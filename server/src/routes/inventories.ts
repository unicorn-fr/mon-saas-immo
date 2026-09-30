import { Router } from 'express'
import { z } from 'zod'
import type { Inventory, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { hashToken, newToken } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { contractFor, leaseKindOf, leaseOwned, propertyName } from '../services/contract.js'
import { initialInventory, inventoryDataSchema, inventoryProgress, type InventoryData } from '../domain/inventory.js'
import { renderInventoryPdf, type InventoryInput } from '../pdf/inventory.js'
import { landlordName, personName, propertyAddress } from '../pdf/labels.js'
import { filesAsDataUrls, iso, saveGeneratedDocument, sendPdf } from './helpers.js'

/**
 * États des lieux : préparés à partir de la fiche du logement (pièces, compteurs, clés),
 * remplis sur téléphone pièce par pièce avec photos, signés par les deux parties, puis figés.
 */
const router = Router()
router.use(requireUser)

async function ownInventory(userId: string, id: string) {
  const inv = await prisma.inventory.findFirst({ where: { id, userId } })
  if (!inv) throw new HttpError(404, 'État des lieux introuvable.')
  return inv
}

router.post('/leases/:id/inventories', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const { kind } = z.object({ kind: z.enum(['ENTRY', 'EXIT']) }).parse(req.body)
  const existing = await prisma.inventory.findFirst({ where: { leaseId: lease.id, kind }, orderBy: { createdAt: 'desc' } })
  if (existing) return res.json({ success: true, data: { id: existing.id } })
  const c = await contractFor(user, lease)
  const entry = kind === 'EXIT' ? await prisma.inventory.findFirst({ where: { leaseId: lease.id, kind: 'ENTRY' } }) : null
  const data = initialInventory(c.property, kind, entry ? inventoryDataSchema.parse(entry.data) : null)
  if (kind === 'ENTRY') data.date = c.terms.startDate ?? undefined
  const inv = await prisma.inventory.create({ data: { userId: user.id, leaseId: lease.id, kind, data } })
  res.status(201).json({ success: true, data: { id: inv.id } })
})

async function inventoryInput(user: User, inv: Inventory): Promise<Omit<InventoryInput, 'photos'> & { photoIds: string[] }> {
  const lease = await leaseOwned(user.id, inv.leaseId)
  const c = await contractFor(user, lease)
  const data = inventoryDataSchema.parse(inv.data)
  const photoIds = [...(data.meters ?? []).map((m) => m.photoId), ...(data.rooms ?? []).flatMap((r) => r.items.flatMap((i) => i.photoIds ?? []))].filter((x): x is string => Boolean(x))
  return { kind: inv.kind as 'ENTRY' | 'EXIT', data, landlord: c.landlord, tenants: c.tenants, propertyAddress: propertyAddress(c.property), furnished: leaseKindOf(lease) !== 'VIDE', photoIds }
}

router.get('/inventories/:id', async (req, res) => {
  const user = req.user!
  const inv = await ownInventory(user.id, String(req.params.id))
  const lease = await leaseOwned(user.id, inv.leaseId)
  const c = await contractFor(user, lease)
  const data = inventoryDataSchema.parse(inv.data)
  res.json({
    success: true,
    data: {
      id: inv.id,
      kind: inv.kind,
      status: inv.status,
      data,
      progress: inventoryProgress(data),
      lease: { id: lease.id, startDate: iso(lease.startDate), furnished: leaseKindOf(lease) !== 'VIDE' },
      property: { id: lease.property.id, name: propertyName(lease.property), address: propertyAddress(c.property) },
      landlordName: landlordName(c.landlord),
      tenantName: c.tenants.map((t) => personName(t, false)).join(' et '),
    },
  })
})

router.put('/inventories/:id', async (req, res) => {
  const inv = await ownInventory(req.user!.id, String(req.params.id))
  if (inv.status === 'SIGNED') throw new HttpError(409, 'Cet état des lieux est signé : il ne peut plus être modifié.')
  const data = inventoryDataSchema.parse(req.body)
  const updated = await prisma.inventory.update({ where: { id: inv.id }, data: { data, date: data.date ? new Date(`${data.date}T00:00:00Z`) : null } })
  res.json({ success: true, data: { id: updated.id, progress: inventoryProgress(data) } })
})

router.post('/inventories/:id/sign', async (req, res) => {
  const user = req.user!
  const inv = await ownInventory(user.id, String(req.params.id))
  if (inv.status === 'SIGNED') throw new HttpError(409, 'Cet état des lieux est déjà signé.')
  const data: InventoryData = inventoryDataSchema.parse(inv.data)
  if (!data.signatures?.landlord || !data.signatures?.tenant) throw new HttpError(400, 'Les deux signatures sont nécessaires.')
  if (inv.kind === 'EXIT' && !data.newAddress) throw new HttpError(400, 'Indiquez la nouvelle adresse du locataire : elle est obligatoire à la sortie.')
  const today = new Date().toISOString().slice(0, 10)
  const signed = { ...data, date: data.date ?? today, signatures: { ...data.signatures, signedAt: new Date().toISOString() } }
  await prisma.inventory.update({ where: { id: inv.id }, data: { status: 'SIGNED', data: signed, date: new Date(`${signed.date}T00:00:00Z`) } })
  const input = await inventoryInput(user, { ...inv, data: signed })
  const pdf = await renderInventoryPdf({ ...input, photos: await filesAsDataUrls(user.id, input.photoIds) })
  const lease = await leaseOwned(user.id, inv.leaseId)
  const names = input.tenants.map((t) => personName(t, false)).join(' et ')
  await saveGeneratedDocument({ userId: user.id, kind: 'INVENTORY', title: `État des lieux ${inv.kind === 'EXIT' ? 'de sortie' : 'd’entrée'}, ${names}`, pdf, snapshot: input, leaseId: lease.id, propertyId: lease.propertyId })
  if (inv.kind === 'ENTRY') await prisma.reminder.updateMany({ where: { leaseId: lease.id, type: 'INVENTORY_ENTRY', status: 'TODO' }, data: { status: 'DONE', doneAt: new Date() } })
  res.json({ success: true, data: { id: inv.id, status: 'SIGNED' } })
})

router.get('/inventories/:id/pdf', async (req, res) => {
  const user = req.user!
  const inv = await ownInventory(user.id, String(req.params.id))
  const input = await inventoryInput(user, inv)
  const pdf = await renderInventoryPdf({ ...input, photos: await filesAsDataUrls(user.id, input.photoIds) })
  sendPdf(res, pdf, `etat-des-lieux-${inv.kind === 'EXIT' ? 'sortie' : 'entree'}.pdf`, req.query.download === '1')
})

/**
 * « Faites-le sur votre téléphone » : lien de connexion à usage unique (20 minutes) qui ouvre directement
 * cet état des lieux. Il est affiché en QR code sur l'ordinateur ; rien n'est envoyé par email.
 */
router.post('/inventories/:id/phone-link', async (req, res) => {
  const user = req.user!
  const inv = await ownInventory(user.id, String(req.params.id))
  const token = newToken()
  await prisma.loginToken.create({ data: { tokenHash: hashToken(token), email: user.email, expiresAt: new Date(Date.now() + 20 * 60_000) } })
  const url = `${env.CLIENT_URL}/connexion/lien?jeton=${encodeURIComponent(token)}&suite=${encodeURIComponent(`/edl/${inv.id}`)}`
  res.json({ success: true, data: { url, expiresInMinutes: 20 } })
})

router.delete('/inventories/:id', async (req, res) => {
  const inv = await ownInventory(req.user!.id, String(req.params.id))
  if (inv.status === 'SIGNED') throw new HttpError(409, 'Un état des lieux signé est conservé.')
  await prisma.inventory.delete({ where: { id: inv.id } })
  res.json({ success: true, data: { deleted: true } })
})

export default router
