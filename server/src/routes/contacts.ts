import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { requireUser } from '../services/session.js'
import { propertyName } from '../services/contract.js'
import { iso } from './helpers.js'
import { TRASH_DAYS, restoreFromTrash, toTrash } from '../services/trash.js'

/**
 * Carnet (artisans, syndic, assureur…) et interventions dans les logements. Un contact saisi une fois sert
 * partout ; une intervention terminée avec un coût devient la dépense correspondante, sans ressaisie.
 */
const router = Router()
router.use(['/contacts', '/interventions'], requireUser)

const opt = (max: number) => z.string().trim().max(max).optional().nullable()
const contactSchema = z.object({
  kind: z.enum(['ARTISAN', 'SYNDIC', 'INSURER', 'AGENCY', 'OTHER']).default('ARTISAN'),
  name: z.string().trim().min(1, 'Indiquez le nom.').max(160),
  trade: opt(80),
  phone: opt(30),
  email: z.email('Email invalide').or(z.literal('')).optional().nullable(),
  address: opt(300),
  note: opt(1000),
})

const contactView = (c: { id: string; kind: string; name: string; trade: string | null; phone: string | null; email: string | null; address: string | null; note: string | null }) => ({ id: c.id, kind: c.kind, name: c.name, trade: c.trade, phone: c.phone, email: c.email, address: c.address, note: c.note })

router.get('/contacts', async (req, res) => {
  const rows = await prisma.contact.findMany({ where: { userId: req.user!.id }, orderBy: { name: 'asc' }, include: { _count: { select: { interventions: true } } } })
  res.json({ success: true, data: rows.map((c) => ({ ...contactView(c), interventions: c._count.interventions })) })
})

router.post('/contacts', async (req, res) => {
  const body = contactSchema.parse(req.body)
  const c = await prisma.contact.create({ data: { ...body, email: body.email || null, userId: req.user!.id } })
  res.status(201).json({ success: true, data: contactView(c) })
})

async function ownContact(userId: string, id: string) {
  const c = await prisma.contact.findFirst({ where: { id, userId } })
  if (!c) throw new HttpError(404, 'Contact introuvable.')
  return c
}

router.put('/contacts/:id', async (req, res) => {
  const c = await ownContact(req.user!.id, String(req.params.id))
  const body = contactSchema.parse(req.body)
  const u = await prisma.contact.update({ where: { id: c.id }, data: { ...body, email: body.email || null } })
  res.json({ success: true, data: contactView(u) })
})

router.delete('/contacts/:id', async (req, res) => {
  const c = await ownContact(req.user!.id, String(req.params.id))
  await toTrash(req.user!.id, 'CONTACT', `Contact : ${c.name}`, c)
  await prisma.contact.delete({ where: { id: c.id } })
  res.json({ success: true, data: { deleted: true } })
})

// ── Interventions ────────────────────────────────────────────────────────────

const interventionSchema = z.object({
  title: z.string().trim().min(1, 'Indiquez l’objet de l’intervention.').max(160),
  description: opt(2000),
  status: z.enum(['TODO', 'PLANNED', 'DONE']).default('TODO'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  contactId: z.uuid().optional().nullable(),
  /** Nouveau contact saisi directement : il rejoint le carnet. */
  newContact: z.object({ name: z.string().trim().min(1).max(160), trade: opt(80), phone: opt(30) }).optional().nullable(),
  costCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  /** Terminée avec un coût : enregistrer la dépense (catégorie). */
  expenseCategory: z.enum(['REPAIR', 'MAINTENANCE']).optional().nullable(),
})

type InterventionRow = Awaited<ReturnType<typeof prisma.intervention.findFirstOrThrow>> & { contact: { id: string; name: string; trade: string | null; phone: string | null } | null }
const interventionView = (i: InterventionRow) => ({
  id: i.id,
  propertyId: i.propertyId,
  title: i.title,
  description: i.description,
  status: i.status,
  date: i.date ? iso(i.date) : null,
  costCents: i.costCents,
  expenseId: i.expenseId,
  contact: i.contact ? { id: i.contact.id, name: i.contact.name, trade: i.contact.trade, phone: i.contact.phone } : null,
})

router.get('/properties/:id/interventions', requireUser, async (req, res) => {
  const p = await prisma.property.findFirst({ where: { id: String(req.params.id), userId: req.user!.id } })
  if (!p) throw new HttpError(404, 'Logement introuvable.')
  const rows = await prisma.intervention.findMany({ where: { propertyId: p.id }, include: { contact: true }, orderBy: [{ status: 'asc' }, { date: 'desc' }, { createdAt: 'desc' }] })
  res.json({ success: true, data: rows.map(interventionView) })
})

/** Enregistre l'intervention ; terminée avec un coût, elle crée (ou met à jour) sa dépense. */
async function saveIntervention(userId: string, propertyId: string, body: z.infer<typeof interventionSchema>, existing?: InterventionRow) {
  let contactId = body.contactId ?? null
  if (contactId) await ownContact(userId, contactId)
  if (!contactId && body.newContact) contactId = (await prisma.contact.create({ data: { userId, kind: 'ARTISAN', name: body.newContact.name, trade: body.newContact.trade ?? null, phone: body.newContact.phone ?? null } })).id
  const date = body.date ? new Date(`${body.date}T00:00:00Z`) : null
  const data = { title: body.title, description: body.description ?? null, status: body.status, date, contactId, costCents: body.costCents ?? null }
  const row = existing
    ? await prisma.intervention.update({ where: { id: existing.id }, data, include: { contact: true } })
    : await prisma.intervention.create({ data: { ...data, userId, propertyId }, include: { contact: true } })
  if (row.status === 'DONE' && row.costCents && body.expenseCategory) {
    const expense = {
      vendor: row.contact?.name ?? 'Intervention',
      description: row.title,
      category: body.expenseCategory,
      amountCents: row.costCents,
      date: row.date ?? new Date(new Date().toISOString().slice(0, 10)),
    }
    if (row.expenseId && (await prisma.expense.findFirst({ where: { id: row.expenseId, userId } }))) await prisma.expense.update({ where: { id: row.expenseId }, data: expense })
    else {
      const e = await prisma.expense.create({ data: { ...expense, userId, propertyId } })
      return prisma.intervention.update({ where: { id: row.id }, data: { expenseId: e.id }, include: { contact: true } })
    }
  }
  return row
}

router.post('/properties/:id/interventions', requireUser, async (req, res) => {
  const p = await prisma.property.findFirst({ where: { id: String(req.params.id), userId: req.user!.id } })
  if (!p) throw new HttpError(404, 'Logement introuvable.')
  const row = await saveIntervention(req.user!.id, p.id, interventionSchema.parse(req.body))
  res.status(201).json({ success: true, data: interventionView(row) })
})

async function ownIntervention(userId: string, id: string) {
  const i = await prisma.intervention.findFirst({ where: { id, userId }, include: { contact: true } })
  if (!i) throw new HttpError(404, 'Intervention introuvable.')
  return i
}

router.put('/interventions/:id', async (req, res) => {
  const i = await ownIntervention(req.user!.id, String(req.params.id))
  const row = await saveIntervention(req.user!.id, i.propertyId, interventionSchema.parse(req.body), i)
  res.json({ success: true, data: interventionView(row) })
})

router.delete('/interventions/:id', async (req, res) => {
  const i = await ownIntervention(req.user!.id, String(req.params.id))
  const { contact: _c, ...row } = i
  await toTrash(req.user!.id, 'INTERVENTION', `Intervention : ${i.title}`, row)
  await prisma.intervention.delete({ where: { id: i.id } })
  res.json({ success: true, data: { deleted: true } })
})

// ── Corbeille ────────────────────────────────────────────────────────────────

router.get('/trash', requireUser, async (req, res) => {
  const rows = await prisma.trashItem.findMany({ where: { userId: req.user!.id }, orderBy: { deletedAt: 'desc' }, select: { id: true, kind: true, label: true, deletedAt: true } })
  res.json({ success: true, data: rows.map((r) => ({ ...r, deletedAt: r.deletedAt.toISOString(), expiresAt: new Date(r.deletedAt.getTime() + TRASH_DAYS * 86_400_000).toISOString() })) })
})

router.post('/trash/:id/restore', requireUser, async (req, res) => {
  res.json({ success: true, data: await restoreFromTrash(req.user!.id, String(req.params.id)) })
})

router.delete('/trash/:id', requireUser, async (req, res) => {
  await prisma.trashItem.deleteMany({ where: { id: String(req.params.id), userId: req.user!.id } })
  res.json({ success: true, data: { deleted: true } })
})

/** Interventions prévues dans les jours qui viennent (accueil). */
export async function upcomingInterventions(userId: string, days = 14) {
  const now = new Date()
  const until = new Date(now.getTime() + days * 86_400_000)
  const rows = await prisma.intervention.findMany({ where: { userId, status: 'PLANNED', date: { gte: new Date(now.toISOString().slice(0, 10)), lte: until } }, include: { property: true, contact: true }, orderBy: { date: 'asc' } })
  return rows.map((r) => ({ date: r.date!, label: `${r.title}${r.contact ? ` avec ${r.contact.name}` : ''}, ${propertyName(r.property)}` }))
}

export default router
