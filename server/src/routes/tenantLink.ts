import { Router } from 'express'
import { z } from 'zod'
import type { Lease, Property, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { layout, sendEmail } from '../lib/email.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { newToken, sha256 } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { contractFor, leaseOwned, propertyName, readProperty, readTenant, tenantName } from '../services/contract.js'
import { landlordName } from '../pdf/labels.js'
import { storeFile, upload } from './helpers.js'
import { patchLeaseData } from './leases.js'

/**
 * Lien sans compte remis au locataire : il y dépose son attestation d'assurance et celle d'entretien de la chaudière,
 * et donne (ou retire) son accord pour recevoir les quittances par email (art. 21 de la loi du 6 juillet 1989).
 * Tout ce qu'il envoie est rangé avec le bail et repris partout : fiche du locataire, rappels, fiche du logement.
 */
const router = Router()

export interface TenantLinkFacts {
  insurance?: { insurer: string | null; expiresAt: string; at: string; documentId: string | null }
  boiler?: { date: string; at: string; documentId: string | null }
  eReceiptConsent?: { email: string; at: string } | null
  eReceiptWithdrawnAt?: string | null
}
const linkFacts = (lease: Lease): TenantLinkFacts => {
  const d = (lease.data ?? {}) as { tenantLink?: TenantLinkFacts }
  return d.tenantLink ?? {}
}

/** Entretien annuel obligatoire : chaudière individuelle au gaz, au fioul ou au bois. */
function needsBoiler(p: Property): boolean {
  const h = readProperty(p).heating
  return h?.mode === 'INDIVIDUAL' && ['GAS', 'FUEL', 'WOOD'].includes(String(h.energy))
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.')

// ── Propriétaire ─────────────────────────────────────────────────────────────

const linkView = (lease: Lease & { property: Property }) => ({
  code: lease.tenantCode,
  url: lease.tenantCode ? `${env.CLIENT_URL}/locataire/${lease.tenantCode}` : null,
  boiler: needsBoiler(lease.property),
  received: linkFacts(lease),
})

router.get('/leases/:id/tenant-link', requireUser, async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  res.json({ success: true, data: linkView(lease) })
})

router.post('/leases/:id/tenant-link', requireUser, async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const { open } = z.object({ open: z.boolean() }).parse(req.body)
  if (open && lease.status === 'DRAFT') throw new HttpError(400, 'Le lien sera disponible une fois le bail signé.')
  const code = open ? (lease.tenantCode ?? newToken().replace(/[^A-Za-z0-9]/g, '').slice(0, 24)) : null
  const u = await prisma.lease.update({ where: { id: lease.id }, data: { tenantCode: code }, include: { property: true } })
  res.json({ success: true, data: linkView(u) })
})

router.post('/leases/:id/tenant-link/send', requireUser, async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  if (!lease.tenantCode) throw new HttpError(400, 'Activez d’abord le lien.')
  const c = await contractFor(user, lease)
  const to = c.tenants.map((t) => t.email).filter((e): e is string => Boolean(e))
  if (!to.length) throw new HttpError(400, 'Ajoutez l’email du locataire dans sa fiche pour lui envoyer le lien.')
  const from = landlordName(c.landlord) || 'Votre bailleur'
  const mail = layout({
    title: 'Vos documents de location',
    paragraphs: [
      'Bonjour,',
      `${from} vous propose d’envoyer en ligne, sans créer de compte, votre attestation d’assurance habitation${needsBoiler(lease.property) ? ' et l’attestation d’entretien de la chaudière' : ''}.`,
      'Vous pouvez aussi y choisir de recevoir vos quittances par email.',
    ],
    cta: { label: 'Envoyer mes documents', url: `${env.CLIENT_URL}/locataire/${lease.tenantCode}` },
  })
  for (const email of to) await sendEmail({ to: email, subject: 'Vos documents de location', ...mail, replyTo: user.email })
  res.json({ success: true, data: { sentTo: to } })
})

// ── Locataire (public) ───────────────────────────────────────────────────────

async function leaseByCode(code: string) {
  const lease = await prisma.lease.findUnique({ where: { tenantCode: code }, include: { property: true, user: true } })
  if (!lease || lease.status === 'ENDED') throw new HttpError(404, 'Ce lien n’est plus actif. Demandez-en un nouveau à votre bailleur.')
  return lease
}

async function tenantsOf(lease: Lease) {
  const rows = await prisma.tenant.findMany({ where: { id: { in: lease.tenantIds }, userId: lease.userId } })
  return lease.tenantIds.map((id) => rows.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t))
}

router.get('/locataire/:code', async (req, res) => {
  const lease = await leaseByCode(String(req.params.code))
  const c = await contractFor(lease.user, lease)
  const f = linkFacts(lease)
  res.json({
    success: true,
    data: {
      property: propertyName(lease.property),
      landlord: landlordName(c.landlord) || 'Votre bailleur',
      tenants: (await tenantsOf(lease)).map((t) => tenantName(readTenant(t))).filter(Boolean),
      boiler: needsBoiler(lease.property),
      insurance: f.insurance ? { insurer: f.insurance.insurer, expiresAt: f.insurance.expiresAt, at: f.insurance.at } : null,
      boilerDone: f.boiler ? { date: f.boiler.date, at: f.boiler.at } : null,
      eReceipt: f.eReceiptConsent ? { email: f.eReceiptConsent.email, at: f.eReceiptConsent.at } : null,
      email: c.tenants.find((t) => t.email)?.email ?? '',
    },
  })
})

/** Range le fichier envoyé par le locataire parmi les documents du bail. */
async function saveTenantFile(lease: Lease, file: Express.Multer.File | undefined, title: string, type: string) {
  if (!file) return null
  const stored = await storeFile(lease.userId, file)
  const blob = await prisma.fileBlob.findUniqueOrThrow({ where: { id: stored.id } })
  const doc = await prisma.document.create({
    data: {
      userId: lease.userId,
      leaseId: lease.id,
      propertyId: lease.propertyId,
      kind: 'OTHER',
      origin: 'UPLOADED',
      title,
      mimeType: blob.mimeType,
      sha256: sha256(Buffer.from(blob.data)),
      sizeBytes: blob.sizeBytes,
      file: blob.data,
      meta: { type, from: 'TENANT' },
    },
  })
  await prisma.fileBlob.delete({ where: { id: stored.id } })
  return doc.id
}

function notifyOwner(lease: Lease & { property: Property; user: User }, what: string) {
  const mail = layout({
    title: 'Document reçu de votre locataire',
    paragraphs: [`Votre locataire de ${propertyName(lease.property)} vient d’envoyer ${what}.`, 'C’est déjà enregistré dans Bailio, avec le bail.'],
    cta: { label: 'Voir le bail', url: `${env.CLIENT_URL}/espace/baux/${lease.id}` },
  })
  sendEmail({ to: lease.user.email, subject: `Reçu : ${what}`, ...mail }).catch(() => undefined)
}

const sameDay = (d: Date) => d.toISOString().slice(0, 10)

router.post('/locataire/:code/insurance', limitPerVisitor(60, 10), upload.single('file'), async (req, res) => {
  const lease = await leaseByCode(String(req.params.code))
  const body = z.object({ insurer: z.string().trim().max(120).optional(), expiresAt: isoDate }).parse(req.body)
  if (!req.file) throw new HttpError(400, 'Ajoutez l’attestation (photo ou PDF).')
  if (body.expiresAt < sameDay(new Date())) throw new HttpError(400, 'Cette attestation a déjà expiré. Envoyez celle de l’année en cours.')
  const documentId = await saveTenantFile(lease, req.file, `Attestation d’assurance (jusqu’au ${body.expiresAt.split('-').reverse().join('/')})`, 'INSURANCE')
  const insurer = body.insurer || null
  // Fiches des locataires : assureur et date de fin, pour le rappel de l'an prochain.
  for (const t of await tenantsOf(lease)) {
    const file = readTenant(t)
    await prisma.tenant.update({ where: { id: t.id }, data: { data: { ...file, insurance: { ...(file.insurance ?? {}), insurer: insurer ?? file.insurance?.insurer ?? null, expiresAt: body.expiresAt } } } })
  }
  await patchLeaseData(lease.id, (f) => ({ tenantLink: { ...((f.tenantLink as TenantLinkFacts) ?? {}), insurance: { insurer, expiresAt: body.expiresAt, at: new Date().toISOString(), documentId } } }))
  await prisma.reminder.updateMany({ where: { leaseId: lease.id, type: 'INSURANCE', status: 'TODO', dueDate: { lte: new Date(Date.now() + 60 * 86_400_000) } }, data: { status: 'DONE', doneAt: new Date() } })
  notifyOwner(lease, 'son attestation d’assurance')
  res.status(201).json({ success: true, data: { received: true } })
})

router.post('/locataire/:code/boiler', limitPerVisitor(60, 10), upload.single('file'), async (req, res) => {
  const lease = await leaseByCode(String(req.params.code))
  const body = z.object({ date: isoDate }).parse(req.body)
  if (!req.file) throw new HttpError(400, 'Ajoutez l’attestation d’entretien (photo ou PDF).')
  if (body.date > sameDay(new Date())) throw new HttpError(400, 'Indiquez la date à laquelle l’entretien a eu lieu.')
  const documentId = await saveTenantFile(lease, req.file, `Entretien de la chaudière du ${body.date.split('-').reverse().join('/')}`, 'BOILER')
  await patchLeaseData(lease.id, (f) => ({ boilerServiceDate: body.date, tenantLink: { ...((f.tenantLink as TenantLinkFacts) ?? {}), boiler: { date: body.date, at: new Date().toISOString(), documentId } } }))
  // Dernier entretien : aussi dans la fiche du logement, pour le prochain bail.
  const p = await prisma.property.findUniqueOrThrow({ where: { id: lease.propertyId } })
  const file = readProperty(p)
  const last = file.heating?.lastMaintenance
  if (!last || last < body.date) await prisma.property.update({ where: { id: p.id }, data: { data: { ...file, heating: { ...(file.heating ?? {}), lastMaintenance: body.date } } } })
  notifyOwner(lease, 'l’attestation d’entretien de la chaudière')
  res.status(201).json({ success: true, data: { received: true } })
})

router.post('/locataire/:code/e-receipt', limitPerVisitor(60, 10), async (req, res) => {
  const lease = await leaseByCode(String(req.params.code))
  const body = z.object({ accept: z.boolean(), email: z.email('Email invalide.').max(200).optional() }).parse(req.body)
  if (body.accept && !body.email) throw new HttpError(400, 'Indiquez l’adresse où recevoir vos quittances.')
  const now = new Date().toISOString()
  await patchLeaseData(lease.id, (f) => {
    const prev = (f.tenantLink as TenantLinkFacts) ?? {}
    return { tenantLink: body.accept ? { ...prev, eReceiptConsent: { email: body.email!, at: now }, eReceiptWithdrawnAt: null } : { ...prev, eReceiptConsent: null, eReceiptWithdrawnAt: now } }
  })
  notifyOwner(lease, body.accept ? 'son accord pour recevoir les quittances par email' : 'le retrait de son accord pour les quittances par email')
  res.json({ success: true, data: { accepted: body.accept } })
})

export default router
