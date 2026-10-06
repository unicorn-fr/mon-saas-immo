import { Router } from 'express'
import { z } from 'zod'
import type { Inventory, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { layout, sendEmail } from '../lib/email.js'
import { hashToken, newToken } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { contractFor, liveContract, leaseKindOf, leaseOwned, propertyName, readTenant } from '../services/contract.js'
import { initialInventory, inventoryDataSchema, inventoryProgress, type InventoryData } from '../domain/inventory.js'
import { renderInventoryPdf, type InventoryInput } from '../pdf/inventory.js'
import { compareWithEntry, meterComparison } from '../domain/inventoryCompare.js'
import { landlordName, personName, propertyAddress } from '../pdf/labels.js'
import { fileDates, filesAsDataUrls, iso, saveGeneratedDocument, sendPdf } from './helpers.js'

/**
 * États des lieux : préparés à partir de la fiche du logement (pièces, compteurs, clés),
 * remplis sur téléphone pièce par pièce avec photos, signés par les deux parties, puis figés.
 */
const router = Router()
// Session exigée sur les adresses de ce routeur seulement : une adresse inconnue reçoit « Page introuvable ».
router.use(['/inventories', '/leases'], requireUser)

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

/** Sortie : l'état des lieux d'entrée du même bail (signé de préférence), pour comparer. */
async function entryFor(inv: Inventory): Promise<InventoryData | null> {
  if (inv.kind !== 'EXIT') return null
  const entry = await prisma.inventory.findFirst({ where: { leaseId: inv.leaseId, kind: 'ENTRY' }, orderBy: [{ status: 'desc' }, { createdAt: 'desc' }] })
  return entry ? inventoryDataSchema.parse(entry.data) : null
}

async function inventoryInput(user: User, inv: Inventory): Promise<Omit<InventoryInput, 'photos'> & { photoIds: string[] }> {
  const lease = await leaseOwned(user.id, inv.leaseId)
  const c = await liveContract(user, lease)
  const data = inventoryDataSchema.parse(inv.data)
  const photoIds = [
    ...(data.meters ?? []).map((m) => m.photoId),
    ...(data.rooms ?? []).flatMap((r) => [...(r.photoIds ?? []), ...r.items.flatMap((i) => i.photoIds ?? [])]),
    ...(data.complements ?? []).filter((c) => c.status === 'ACCEPTED').flatMap((c) => c.photoIds),
  ].filter((x): x is string => Boolean(x))
  return { kind: inv.kind as 'ENTRY' | 'EXIT', data, entry: await entryFor(inv), landlord: c.landlord, tenants: c.tenants, propertyAddress: propertyAddress(c.property), furnished: leaseKindOf(lease) !== 'VIDE', photoIds }
}

/** PDF de l'état des lieux, photos en annexe avec leur date d'ajout. */
async function inventoryPdf(user: User, inv: Inventory) {
  const input = await inventoryInput(user, inv)
  const pdf = await renderInventoryPdf({ ...input, photos: await filesAsDataUrls(user.id, input.photoIds), photoDates: await fileDates(user.id, input.photoIds) })
  return { input, pdf }
}

router.get('/inventories/:id', async (req, res) => {
  const user = req.user!
  const inv = await ownInventory(user.id, String(req.params.id))
  const lease = await leaseOwned(user.id, inv.leaseId)
  const c = await liveContract(user, lease)
  const data = inventoryDataSchema.parse(inv.data)
  const entry = await entryFor(inv)
  res.json({
    success: true,
    data: {
      id: inv.id,
      kind: inv.kind,
      status: inv.status,
      data,
      // Sortie : ce qui avait été relevé à l'entrée, élément par élément (clé « pièce/élément »), et les compteurs.
      comparison: inv.kind === 'EXIT' ? { hasEntry: Boolean(entry), items: compareWithEntry(entry, data), meters: meterComparison(entry, data) } : null,
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
  const { input, pdf } = await inventoryPdf(user, { ...inv, data: signed })
  const lease = await leaseOwned(user.id, inv.leaseId)
  const names = input.tenants.map((t) => personName(t, false)).join(' et ')
  await saveGeneratedDocument({ userId: user.id, kind: 'INVENTORY', title: `État des lieux ${inv.kind === 'EXIT' ? 'de sortie' : 'd’entrée'}, ${names}`, pdf, snapshot: input, leaseId: lease.id, propertyId: lease.propertyId })
  // Chacun reçoit son exemplaire : le locataire (s'il a un email) et le bailleur.
  const what = `état des lieux ${inv.kind === 'EXIT' ? 'de sortie' : 'd’entrée'}`
  const mail = layout({ title: `Votre ${what}.`, paragraphs: ['Bonjour,', `Vous trouverez en pièce jointe l’${what} signé du logement situé ${input.propertyAddress}.`, 'Conservez-le : il sert de référence à la fin de la location.'] })
  const recipients = [...new Set([...(await liveContract(user, lease)).tenants.map((t) => t.email).filter((e): e is string => Boolean(e)), user.email])]
  for (const to of recipients) {
    await sendEmail({ to, subject: `${what[0].toUpperCase()}${what.slice(1)} signé`, ...mail, replyTo: user.email, attachments: [{ filename: `etat-des-lieux-${inv.kind === 'EXIT' ? 'sortie' : 'entree'}.pdf`, content: pdf }] }).catch((e) => console.error('Envoi de l’état des lieux impossible', e))
  }
  // Sortie : la nouvelle adresse du locataire et la date de remise des clés servent ensuite aux courriers (solde de tout compte).
  if (inv.kind === 'EXIT') {
    for (const id of lease.tenantIds) {
      const t = await prisma.tenant.findFirst({ where: { id, userId: user.id } })
      if (t && signed.newAddress) await prisma.tenant.update({ where: { id }, data: { data: { ...readTenant(t), newAddress: signed.newAddress } } })
    }
    const fresh = await prisma.lease.findUniqueOrThrow({ where: { id: lease.id } })
    const ld = (fresh.data ?? {}) as Record<string, unknown>
    if (!ld.keysDate) await prisma.lease.update({ where: { id: lease.id }, data: { data: { ...ld, keysDate: signed.date } } })
  }
  if (inv.kind === 'ENTRY') await prisma.reminder.updateMany({ where: { leaseId: lease.id, type: 'INVENTORY_ENTRY', status: 'TODO' }, data: { status: 'DONE', doneAt: new Date() } })
  res.json({ success: true, data: { id: inv.id, status: 'SIGNED' } })
})

router.get('/inventories/:id/pdf', async (req, res) => {
  const user = req.user!
  const inv = await ownInventory(user.id, String(req.params.id))
  const { pdf } = await inventoryPdf(user, inv)
  sendPdf(res, pdf, `etat-des-lieux-${inv.kind === 'EXIT' ? 'sortie' : 'entree'}.pdf`, req.query.download === '1')
})

/**
 * Demande du locataire pour compléter l'état des lieux d'entrée (article 3-2) : acceptée, elle est ajoutée au document
 * (nouvelle version du PDF, envoyée aux deux parties) ; refusée, le locataire est prévenu avec le motif et son recours.
 */
router.post('/inventories/:id/complements/:cid', async (req, res) => {
  const user = req.user!
  const inv = await ownInventory(user.id, String(req.params.id))
  const body = z.object({ accept: z.boolean(), reason: z.string().trim().max(1000).optional() }).parse(req.body)
  const data = inventoryDataSchema.parse(inv.data)
  const c = (data.complements ?? []).find((x) => x.id === String(req.params.cid))
  if (!c) throw new HttpError(404, 'Demande introuvable.')
  if (c.status !== 'PENDING') throw new HttpError(409, 'Cette demande a déjà reçu une réponse.')
  if (!body.accept && !body.reason) throw new HttpError(400, 'Indiquez en une phrase pourquoi vous refusez : votre locataire le recevra.')
  const decided = { ...c, status: body.accept ? ('ACCEPTED' as const) : ('REFUSED' as const), decidedAt: new Date().toISOString(), reason: body.reason ?? null }
  const next = { ...data, complements: (data.complements ?? []).map((x) => (x.id === c.id ? decided : x)) }
  const updated = await prisma.inventory.update({ where: { id: inv.id }, data: { data: next } })
  const lease = await leaseOwned(user.id, inv.leaseId)
  const tenantsTo = (await liveContract(user, lease)).tenants.map((t) => t.email).filter((e): e is string => Boolean(e))
  const day = c.at.slice(0, 10).split('-').reverse().join('/')
  if (body.accept) {
    const { input, pdf } = await inventoryPdf(user, updated)
    const names = input.tenants.map((t) => personName(t, false)).join(' et ')
    await saveGeneratedDocument({ userId: user.id, kind: 'INVENTORY', title: `État des lieux d’entrée complété, ${names}`, pdf, snapshot: input, leaseId: lease.id, propertyId: lease.propertyId })
    const mail = layout({ title: 'L’état des lieux d’entrée est complété.', paragraphs: ['Bonjour,', `La demande du ${day} a été acceptée : elle est ajoutée à l’état des lieux d’entrée, joint à cet email.`, 'Conservez cette version : elle remplace la précédente.'] })
    for (const to of [...new Set([...tenantsTo, user.email])]) await sendEmail({ to, subject: 'État des lieux d’entrée complété', ...mail, replyTo: user.email, attachments: [{ filename: 'etat-des-lieux-entree.pdf', content: pdf }] }).catch((e) => console.error('Envoi de l’état des lieux impossible', e))
  } else {
    const mail = layout({
      title: 'Votre demande sur l’état des lieux',
      paragraphs: ['Bonjour,', `Votre bailleur n’a pas ajouté votre demande du ${day} à l’état des lieux d’entrée. Son motif : « ${body.reason} »`, 'Si vous n’êtes pas d’accord, vous pouvez saisir gratuitement la commission départementale de conciliation de votre département (article 3-2 de la loi du 6 juillet 1989).'],
    })
    for (const to of tenantsTo) await sendEmail({ to, subject: 'Votre demande sur l’état des lieux', ...mail, replyTo: user.email }).catch((e) => console.error('Envoi impossible', e))
  }
  res.json({ success: true, data: { status: decided.status, notified: tenantsTo } })
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
