import { Router, type Response } from 'express'
import { z } from 'zod'
import type { Document as DocRow, Lease, Property, Reminder } from '@prisma/client'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { requireUser } from '../services/session.js'
import { ensureReminders } from '../services/reminders.js'
import { addMonths, formatEuros, fullName, leaseInputSchema, type LeaseInput } from '../domain/lease.js'
import { renderLeasePdf } from '../pdf/lease.js'
import { renderReceiptPdf } from '../pdf/receipt.js'
import { irlOneYearLater, quarterLabel } from '../lib/irl.js'
import { publicUser } from './auth.js'

const router = Router()
router.use(requireUser)

type LeaseWithProperty = Lease & { property: Property }

function leaseInput(lease: Lease): LeaseInput {
  return leaseInputSchema.parse(lease.data)
}

function leaseSummary(lease: LeaseWithProperty) {
  const input = leaseInput(lease)
  return {
    id: lease.id,
    type: lease.type,
    status: lease.status,
    startDate: lease.startDate.toISOString().slice(0, 10),
    endDate: lease.endDate.toISOString().slice(0, 10),
    rentCents: lease.rentCents,
    chargesCents: lease.chargesCents,
    depositCents: lease.depositCents,
    paymentDay: lease.paymentDay,
    property: {
      id: lease.property.id,
      address: lease.property.address,
      city: lease.property.city,
      surface: lease.property.surface,
      rooms: lease.property.rooms,
      dpeClass: lease.property.dpeClass,
    },
    landlord: input.landlord,
    tenants: input.tenants,
    guarantor: input.guarantor ?? null,
  }
}

/** Révision annuelle : nouveau loyer calculé avec l'IRL, ou explication si ce n'est pas possible. */
async function revisionDetails(lease: Lease & { property: Property }, reminder: Reminder) {
  const input = leaseInput(lease)
  if (lease.property.dpeClass === 'F' || lease.property.dpeClass === 'G') {
    return { blocked: true, message: 'Logement classé F ou G : la loi interdit toute hausse du loyer, même la révision annuelle.' }
  }
  if (!input.irl) return { blocked: false, message: "Le trimestre de référence de l'IRL n'est pas indiqué dans le bail." }
  const years = Math.round((reminder.dueDate.getTime() - lease.startDate.getTime()) / (365.25 * 86_400_000))
  const [y, q] = input.irl.quarter.split('-')
  const previous = years <= 1 ? { quarter: input.irl.quarter, value: input.irl.value } : await irlOneYearLater(`${Number(y) + years - 2}-${q}`)
  const next = await irlOneYearLater(`${Number(y) + years - 1}-${q}`)
  if (!previous || !next) {
    return { blocked: false, message: `L'INSEE n'a pas encore publié l'IRL du ${quarterLabel(`${Number(y) + years}-${q}`)}. Nous calculerons le nouveau loyer dès sa publication.` }
  }
  const newRent = Math.round((lease.rentCents * next.value) / previous.value)
  return {
    blocked: false,
    newRentCents: newRent,
    message: `Nouveau loyer : ${formatEuros(newRent)} hors charges (IRL ${String(previous.value).replace('.', ',')} → ${String(next.value).replace('.', ',')}).`,
  }
}

// ─── Aujourd'hui ──────────────────────────────────────────────────────────────

router.get('/today', async (req, res) => {
  const userId = req.user!.id
  const leases = await prisma.lease.findMany({ where: { userId }, include: { property: true }, orderBy: { createdAt: 'desc' } })
  for (const l of leases) await ensureReminders(l)

  const now = new Date()
  const in30 = addMonths(now, 1)
  const reminders = await prisma.reminder.findMany({
    where: { userId, OR: [{ status: 'TODO', dueDate: { lte: in30 } }, { status: 'DONE', doneAt: { gte: new Date(Date.now() - 7 * 86_400_000) } }] },
    orderBy: { dueDate: 'asc' },
    take: 40,
  })
  const upcoming = await prisma.reminder.findMany({
    where: { userId, status: 'TODO', dueDate: { gt: in30 } },
    orderBy: { dueDate: 'asc' },
    take: 6,
  })

  const byId = new Map(leases.map((l) => [l.id, l]))
  const decorate = async (r: Reminder) => {
    const lease = byId.get(r.leaseId)!
    const input = leaseInput(lease)
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      dueDate: r.dueDate.toISOString().slice(0, 10),
      leaseId: r.leaseId,
      address: lease.property.address,
      tenantName: input.tenants.map(fullName).join(' et '),
      tenantEmail: input.tenants.find((t) => t.email)?.email ?? null,
      rentCents: lease.rentCents,
      chargesCents: lease.chargesCents,
      revision: r.type === 'RENT_REVISION' && r.status === 'TODO' ? await revisionDetails(lease, r) : null,
    }
  }

  const month = { y: now.getUTCFullYear(), m: now.getUTCMonth() }
  const rentsThisMonth = await prisma.reminder.findMany({
    where: {
      userId,
      type: 'RENT_RECEIPT',
      dueDate: { gte: new Date(Date.UTC(month.y, month.m, 1)), lt: new Date(Date.UTC(month.y, month.m + 1, 1)) },
    },
  })

  res.json({
    success: true,
    data: {
      user: publicUser(req.user!),
      summary: {
        leases: leases.length,
        rentsExpected: rentsThisMonth.length,
        rentsReceived: rentsThisMonth.filter((r) => r.status === 'DONE').length,
      },
      reminders: await Promise.all(reminders.map(decorate)),
      upcoming: await Promise.all(upcoming.map(decorate)),
      leases: leases.map(leaseSummary),
    },
  })
})

router.post('/reminders/:id/:action', async (req, res) => {
  const { id, action } = z.object({ id: z.uuid(), action: z.enum(['done', 'undo']) }).parse(req.params)
  const r = await prisma.reminder.findFirst({ where: { id, userId: req.user!.id } })
  if (!r) throw new HttpError(404, 'Rappel introuvable.')
  const updated = await prisma.reminder.update({
    where: { id },
    data: action === 'done' ? { status: 'DONE', doneAt: new Date() } : { status: 'TODO', doneAt: null },
  })
  res.json({ success: true, data: { id: updated.id, status: updated.status } })
})

// ─── Baux et documents ────────────────────────────────────────────────────────

async function ownLease(userId: string, id: string) {
  const lease = await prisma.lease.findFirst({ where: { id, userId }, include: { property: true } })
  if (!lease) throw new HttpError(404, 'Bail introuvable.')
  return lease
}

router.get('/leases', async (req, res) => {
  const leases = await prisma.lease.findMany({ where: { userId: req.user!.id }, include: { property: true }, orderBy: { createdAt: 'desc' } })
  res.json({ success: true, data: leases.map(leaseSummary) })
})

router.get('/leases/:id', async (req, res) => {
  const lease = await ownLease(req.user!.id, String(req.params.id))
  const [documents, reminders] = await Promise.all([
    prisma.document.findMany({
      where: { leaseId: lease.id },
      select: { id: true, kind: true, version: true, title: true, mimeType: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reminder.findMany({ where: { leaseId: lease.id, status: 'TODO' }, orderBy: { dueDate: 'asc' }, take: 8 }),
  ])
  res.json({
    success: true,
    data: {
      ...leaseSummary(lease),
      documents,
      reminders: reminders.map((r) => ({ id: r.id, type: r.type, dueDate: r.dueDate.toISOString().slice(0, 10) })),
    },
  })
})

function sendPdf(res: Response, pdf: Buffer, filename: string, download: boolean) {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.send(pdf)
}

async function documentBytes(doc: DocRow): Promise<Buffer> {
  if (doc.file) return Buffer.from(doc.file)
  if (doc.kind === 'LEASE' && doc.snapshot) return renderLeasePdf(leaseInputSchema.parse(doc.snapshot))
  throw new HttpError(404, 'Document introuvable.')
}

// Bail : dernière version (générée) ou document importé.
router.get('/leases/:id/lease.pdf', async (req, res) => {
  const lease = await ownLease(req.user!.id, String(req.params.id))
  const doc = await prisma.document.findFirst({ where: { leaseId: lease.id }, orderBy: [{ version: 'desc' }, { createdAt: 'desc' }] })
  if (!doc) throw new HttpError(404, 'Document introuvable.')
  const bytes = await documentBytes(doc)
  if (doc.mimeType !== 'application/pdf') {
    res.setHeader('Content-Type', doc.mimeType)
    return res.send(bytes)
  }
  sendPdf(res, bytes, 'bail.pdf', req.query.download === '1')
})

// Quittance du mois.
router.get('/leases/:id/receipts/:year/:month.pdf', async (req, res) => {
  const { year, month } = z
    .object({ year: z.coerce.number().int().min(2000).max(2100), month: z.coerce.number().int().min(1).max(12) })
    .parse(req.params)
  const lease = await ownLease(req.user!.id, String(req.params.id))
  const reminder = await prisma.reminder.findFirst({
    where: {
      leaseId: lease.id,
      type: 'RENT_RECEIPT',
      dueDate: { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) },
    },
  })
  const pdf = await renderReceiptPdf({ lease: leaseInput(lease), year, month, paidOn: reminder?.doneAt ?? null })
  sendPdf(res, pdf, `quittance-${year}-${String(month).padStart(2, '0')}.pdf`, req.query.download === '1')
})

// ─── Compte ───────────────────────────────────────────────────────────────────

router.post('/account/follow-up', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { followUpSince: req.user!.followUpSince ?? new Date() },
  })
  res.json({ success: true, data: publicUser(user) })
})

router.patch('/account', async (req, res) => {
  const body = z
    .object({ firstName: z.string().trim().max(80).optional(), lastName: z.string().trim().max(80).optional(), followUp: z.boolean().optional() })
    .parse(req.body)
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      followUpSince: body.followUp === undefined ? undefined : body.followUp ? (req.user!.followUpSince ?? new Date()) : null,
    },
  })
  res.json({ success: true, data: publicUser(user) })
})

// Export de toutes les données du compte (RGPD, art. 20).
router.get('/account/export', async (req, res) => {
  const userId = req.user!.id
  const [user, properties, leases, reminders, documents] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.property.findMany({ where: { userId } }),
    prisma.lease.findMany({ where: { userId } }),
    prisma.reminder.findMany({ where: { userId } }),
    prisma.document.findMany({ where: { userId }, select: { id: true, kind: true, title: true, version: true, sha256: true, createdAt: true } }),
  ])
  res.setHeader('Content-Disposition', 'attachment; filename="bailio-export.json"')
  res.json({ exportedAt: new Date().toISOString(), user: publicUser(user), properties, leases, reminders, documents })
})

// Suppression définitive du compte et de toutes ses données (RGPD, art. 17).
router.delete('/account', async (req, res) => {
  await prisma.user.delete({ where: { id: req.user!.id } })
  res.json({ success: true, data: { deleted: true } })
})

export default router
