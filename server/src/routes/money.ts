import { Router } from 'express'
import { z } from 'zod'
import type { Document as DocRow, User } from '@prisma/client'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { requireUser } from '../services/session.js'
import { documentText, ocrAvailable } from '../services/import/ocr.js'
import { matchProperty, parseInvoice } from '../services/import/invoice.js'
import { contractFor, leaseOwned, propertyName } from '../services/contract.js'
import { renderContractPdf } from '../pdf/contract.js'
import { renderGuaranteePdf } from '../pdf/guarantee.js'
import { renderReceiptPdf, type ReceiptInput } from '../pdf/receipt.js'
import { renderLetterPdf, type LetterRender } from '../pdf/letter.js'
import { renderInventoryPdf, type InventoryInput } from '../pdf/inventory.js'
import type { ContractInput, Guarantor } from '../domain/contract.js'
import { parseIsoDate } from '../domain/lease.js'
import { emailLetter } from './leases.js'
import { fileSlug, filesAsDataUrls, iso, sendFile, sendPdf, storeFile, upload } from './helpers.js'

/** Dépenses, factures lues automatiquement, tableau « Argent », documents et fichiers du propriétaire. */
const router = Router()
router.use(requireUser)

const CATEGORIES = ['REPAIR', 'MAINTENANCE', 'TAX', 'COPRO', 'INSURANCE', 'OTHER'] as const
export const CATEGORY_LABEL: Record<string, string> = { REPAIR: 'réparation', MAINTENANCE: 'entretien', TAX: 'impôt', COPRO: 'copropriété', INSURANCE: 'assurance', OTHER: 'autre' }

const expenseSchema = z.object({
  propertyId: z.uuid().nullable().optional(),
  vendor: z.string().trim().min(1, 'Indiquez le fournisseur.').max(160),
  description: z.string().trim().max(300).optional().nullable(),
  category: z.enum(CATEGORIES).default('OTHER'),
  amountCents: z.number().int().min(0).max(100_000_000),
  recoverableCents: z.number().int().min(0).max(100_000_000).default(0),
  chargeTo: z.enum(['OWNER', 'TENANT']).default('OWNER'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

async function checkProperty(userId: string, id: string | null | undefined) {
  if (id && !(await prisma.property.findFirst({ where: { id, userId } }))) throw new HttpError(404, 'Logement introuvable.')
}

const expenseView = (e: { id: string; vendor: string; description: string | null; category: string; amountCents: number; recoverableCents: number; chargeTo: string; status: string; date: Date; documentId: string | null; propertyId: string | null; property?: { label: string | null; address: string } | null }) => ({
  id: e.id,
  vendor: e.vendor,
  description: e.description,
  category: e.category,
  categoryLabel: CATEGORY_LABEL[e.category] ?? 'autre',
  amountCents: e.amountCents,
  recoverableCents: e.recoverableCents,
  chargeTo: e.chargeTo,
  status: e.status,
  date: iso(e.date),
  documentId: e.documentId,
  propertyId: e.propertyId,
  propertyName: e.property ? propertyName(e.property) : null,
})

router.get('/expenses', async (req, res) => {
  const year = z.coerce.number().int().min(2000).max(2100).optional().parse(req.query.year)
  const rows = await prisma.expense.findMany({
    where: { userId: req.user!.id, ...(year ? { date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } } : {}) },
    include: { property: true },
    orderBy: { date: 'desc' },
  })
  res.json({ success: true, data: rows.map(expenseView) })
})

router.get('/expenses/:id', async (req, res) => {
  const e = await prisma.expense.findFirst({ where: { id: String(req.params.id), userId: req.user!.id }, include: { property: true } })
  if (!e) throw new HttpError(404, 'Dépense introuvable.')
  const doc = e.documentId ? await prisma.document.findFirst({ where: { id: e.documentId }, select: { id: true, mimeType: true, title: true, meta: true, createdAt: true } }) : null
  res.json({ success: true, data: { ...expenseView(e), document: doc } })
})

router.post('/expenses', async (req, res) => {
  const body = expenseSchema.parse(req.body)
  await checkProperty(req.user!.id, body.propertyId)
  const e = await prisma.expense.create({ data: { userId: req.user!.id, ...body, propertyId: body.propertyId ?? null, date: parseIsoDate(body.date), status: 'OK' }, include: { property: true } })
  res.status(201).json({ success: true, data: expenseView(e) })
})

router.put('/expenses/:id', async (req, res) => {
  const e = await prisma.expense.findFirst({ where: { id: String(req.params.id), userId: req.user!.id } })
  if (!e) throw new HttpError(404, 'Dépense introuvable.')
  const body = expenseSchema.partial().extend({ status: z.enum(['OK', 'TO_VERIFY']).optional() }).parse(req.body)
  await checkProperty(req.user!.id, body.propertyId)
  const updated = await prisma.expense.update({ where: { id: e.id }, data: { ...body, ...(body.date ? { date: parseIsoDate(body.date) } : {}) }, include: { property: true } })
  if (updated.documentId && body.propertyId !== undefined) await prisma.document.update({ where: { id: updated.documentId }, data: { propertyId: updated.propertyId } })
  res.json({ success: true, data: expenseView(updated) })
})

router.delete('/expenses/:id', async (req, res) => {
  const e = await prisma.expense.findFirst({ where: { id: String(req.params.id), userId: req.user!.id } })
  if (!e) throw new HttpError(404, 'Dépense introuvable.')
  await prisma.expense.delete({ where: { id: e.id } })
  // « Ce n'est pas une facture » : le document déposé est retiré aussi.
  if (e.documentId && req.query.withDocument === '1') await prisma.document.deleteMany({ where: { id: e.documentId, userId: req.user!.id } })
  res.json({ success: true, data: { deleted: true } })
})

// Facture en photo ou PDF : lue sur le serveur, rangée dans le bon logement, à vérifier.
router.post('/expenses/scan', upload.array('files', 10), async (req, res) => {
  const user = req.user!
  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  if (!files.length) throw new HttpError(400, 'Ajoutez une photo ou le PDF de la facture.')
  if (!(await ocrAvailable())) throw new HttpError(503, 'La lecture automatique n’est pas disponible pour le moment.')
  const { text } = await documentText(files.map((f) => ({ buffer: f.buffer, mimetype: f.mimetype, originalname: f.originalname })))
  const reading = parseInvoice(text)
  const properties = await prisma.property.findMany({ where: { userId: user.id } })
  const match = matchProperty(reading.address, text, properties)
  const stored = await storeFile(user.id, files[0])
  const blob = await prisma.fileBlob.findUniqueOrThrow({ where: { id: stored.id } })
  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      kind: 'INVOICE',
      origin: 'UPLOADED',
      title: `Facture ${reading.vendor ?? ''}`.trim(),
      mimeType: blob.mimeType,
      sha256: (await import('../lib/tokens.js')).sha256(Buffer.from(blob.data)),
      sizeBytes: blob.sizeBytes,
      file: blob.data,
      propertyId: match?.id ?? null,
      meta: { reading, matchedBy: match ? 'address' : null } as object,
    },
  })
  await prisma.fileBlob.delete({ where: { id: stored.id } })
  const e = await prisma.expense.create({
    data: {
      userId: user.id,
      propertyId: match?.id ?? null,
      vendor: reading.vendor ?? 'Fournisseur à préciser',
      description: reading.description,
      category: reading.category,
      amountCents: reading.amountCents ?? 0,
      date: reading.date ? parseIsoDate(reading.date) : new Date(),
      status: 'TO_VERIFY',
      documentId: doc.id,
    },
    include: { property: true },
  })
  res.status(201).json({ success: true, data: { ...expenseView(e), reading, matchedProperty: match ? { id: match.id, name: propertyName(match) } : null } })
})

// ── Argent ───────────────────────────────────────────────────────────────────

router.get('/money', async (req, res) => {
  const userId = req.user!.id
  const year = z.coerce.number().int().min(2000).max(2100).default(new Date().getUTCFullYear()).parse(req.query.year)
  const [payments, expenses, leases] = await Promise.all([
    prisma.payment.findMany({ where: { userId, period: { startsWith: String(year) } } }),
    prisma.expense.findMany({ where: { userId, date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } }, include: { property: true }, orderBy: { date: 'desc' } }),
    prisma.lease.findMany({ where: { userId, status: { in: ['ACTIVE', 'IMPORTED', 'ENDED'] } } }),
  ])
  const byMonth = Array.from({ length: 12 }, (_, m) => {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`
    const monthStart = new Date(Date.UTC(year, m, 1))
    const monthEnd = new Date(Date.UTC(year, m + 1, 0))
    const expected = leases.filter((l) => l.startDate <= monthEnd && l.endDate >= monthStart).reduce((a, l) => a + l.rentCents + l.chargesCents, 0)
    return { month: m + 1, receivedCents: payments.filter((p) => p.period === key).reduce((a, p) => a + p.amountCents, 0), expectedCents: expected }
  })
  const income = payments.reduce((a, p) => a + p.amountCents, 0)
  const spent = expenses.reduce((a, e) => a + e.amountCents, 0)
  res.json({ success: true, data: { year, incomeCents: income, expensesCents: spent, netCents: income - spent, byMonth, expenses: expenses.map(expenseView) } })
})

// Export de l'année (CSV lisible par un tableur), pour la déclaration de revenus fonciers.
router.get('/money/export', async (req, res) => {
  const userId = req.user!.id
  const year = z.coerce.number().int().min(2000).max(2100).default(new Date().getUTCFullYear()).parse(req.query.year)
  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({ where: { userId, period: { startsWith: String(year) } }, include: { lease: { include: { property: true } } }, orderBy: { receivedAt: 'asc' } }),
    prisma.expense.findMany({ where: { userId, date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } }, include: { property: true }, orderBy: { date: 'asc' } }),
  ])
  const eur = (c: number) => (c / 100).toFixed(2).replace('.', ',')
  const cell = (s: string | null | undefined) => `"${(s ?? '').replace(/"/g, '""')}"`
  const rows = [
    ['Date', 'Type', 'Logement', 'Libellé', 'Catégorie', 'Montant (€)', 'Dont récupérable (€)'].map(cell).join(';'),
    ...payments.map((p) => [iso(p.receivedAt)!, 'Loyer', propertyName(p.lease.property), `Loyer ${p.period}`, 'loyer', eur(p.amountCents), ''].map(cell).join(';')),
    ...expenses.map((e) => [iso(e.date)!, 'Dépense', e.property ? propertyName(e.property) : '', `${e.vendor}${e.description ? `, ${e.description}` : ''}`, CATEGORY_LABEL[e.category] ?? '', `-${eur(e.amountCents)}`, eur(e.recoverableCents)].map(cell).join(';')),
  ]
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="bailio-${year}.csv"`)
  res.send(`﻿${rows.join('\r\n')}\r\n`)
})

// ── Documents ────────────────────────────────────────────────────────────────

const KIND_GROUP: Record<string, string> = {
  LEASE: 'LEASES', LEASE_IMPORTED: 'LEASES', GUARANTEE: 'LEASES',
  RECEIPT: 'RECEIPTS', PARTIAL_RECEIPT: 'RECEIPTS', RENT_NOTICE: 'RECEIPTS',
  INVENTORY: 'INVENTORIES', INVOICE: 'INVOICES', DIAGNOSTIC: 'DIAGNOSTICS', LETTER: 'LETTERS', OTHER: 'OTHER',
}

router.get('/documents', async (req, res) => {
  const userId = req.user!.id
  const q = z.object({ group: z.string().optional(), propertyId: z.uuid().optional(), leaseId: z.uuid().optional(), tenantId: z.uuid().optional() }).parse(req.query)
  const kinds = q.group ? Object.entries(KIND_GROUP).filter(([, g]) => g === q.group).map(([k]) => k) : undefined
  const rows = await prisma.document.findMany({
    where: { userId, ...(kinds ? { kind: { in: kinds as DocRow['kind'][] } } : {}), ...(q.propertyId ? { OR: [{ propertyId: q.propertyId }, { lease: { propertyId: q.propertyId } }] } : {}), ...(q.leaseId ? { leaseId: q.leaseId } : {}), ...(q.tenantId ? { tenantId: q.tenantId } : {}) },
    select: { id: true, kind: true, title: true, version: true, period: true, origin: true, mimeType: true, createdAt: true, leaseId: true, propertyId: true, property: { select: { label: true, address: true } }, lease: { select: { property: { select: { label: true, address: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 300,
  })
  // Seule la dernière version d'un bail généré est listée (les précédentes restent consultables depuis le bail).
  const seen = new Set<string>()
  const list = rows.filter((d) => {
    if (d.kind !== 'LEASE') return true
    const key = `${d.leaseId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  res.json({
    success: true,
    data: list.map((d) => ({
      id: d.id,
      kind: d.kind,
      group: KIND_GROUP[d.kind] ?? 'OTHER',
      title: d.title,
      version: d.version,
      period: d.period,
      origin: d.origin,
      mimeType: d.mimeType,
      date: iso(d.createdAt),
      leaseId: d.leaseId,
      propertyId: d.propertyId,
      propertyName: d.property ? propertyName(d.property) : d.lease ? propertyName(d.lease.property) : null,
    })),
  })
})

router.post('/documents', upload.single('file'), async (req, res) => {
  const user = req.user!
  const f = req.file
  if (!f) throw new HttpError(400, 'Ajoutez un fichier.')
  const body = z.object({ kind: z.enum(['DIAGNOSTIC', 'INVOICE', 'OTHER', 'LEASE_IMPORTED']).default('OTHER'), title: z.string().trim().max(160).optional(), propertyId: z.uuid().optional(), leaseId: z.uuid().optional(), tenantId: z.uuid().optional(), diagnostic: z.string().max(20).optional() }).parse(req.body)
  await checkProperty(user.id, body.propertyId)
  if (body.leaseId) await leaseOwned(user.id, body.leaseId)
  if (body.tenantId && !(await prisma.tenant.findFirst({ where: { id: body.tenantId, userId: user.id } }))) throw new HttpError(404, 'Locataire introuvable.')
  const stored = await storeFile(user.id, f)
  const blob = await prisma.fileBlob.findUniqueOrThrow({ where: { id: stored.id } })
  const { sha256 } = await import('../lib/tokens.js')
  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      kind: body.kind,
      origin: 'UPLOADED',
      title: body.title || f.originalname || 'Document',
      mimeType: blob.mimeType,
      sha256: sha256(Buffer.from(blob.data)),
      sizeBytes: blob.sizeBytes,
      file: blob.data,
      propertyId: body.propertyId ?? null,
      leaseId: body.leaseId ?? null,
      tenantId: body.tenantId ?? null,
      meta: body.diagnostic ? { diagnostic: body.diagnostic } : undefined,
    },
  })
  await prisma.fileBlob.delete({ where: { id: stored.id } })
  res.status(201).json({ success: true, data: { id: doc.id, title: doc.title } })
})

/** Octets d'un document : fichier déposé, ou PDF régénéré à l'identique depuis sa copie figée. */
export async function documentBytes(user: User, doc: DocRow): Promise<{ bytes: Buffer; mime: string }> {
  if (doc.file) return { bytes: Buffer.from(doc.file), mime: doc.mimeType }
  const snap = doc.snapshot as Record<string, unknown> | null
  if (!snap) throw new HttpError(404, 'Document introuvable.')
  switch (doc.kind) {
    case 'LEASE':
      if ('landlord' in snap && 'terms' in snap) return { bytes: await renderContractPdf(snap as unknown as ContractInput), mime: 'application/pdf' }
      if (doc.leaseId) {
        // Ancien bail du tunnel : rendu depuis ses réponses d'origine.
        const lease = await leaseOwned(user.id, doc.leaseId)
        return { bytes: await renderContractPdf(await contractFor(user, lease)), mime: 'application/pdf' }
      }
      break
    case 'GUARANTEE':
      return { bytes: await renderGuaranteePdf(snap.contract as ContractInput, snap.guarantor as Guarantor), mime: 'application/pdf' }
    case 'RECEIPT':
    case 'PARTIAL_RECEIPT':
    case 'RENT_NOTICE': {
      const r = snap as unknown as ReceiptInput
      return { bytes: await renderReceiptPdf({ ...r, paidOn: r.paidOn ? new Date(r.paidOn) : null, dueDate: r.dueDate ? new Date(r.dueDate) : null }), mime: 'application/pdf' }
    }
    case 'LETTER': {
      const l = snap.letter as LetterRender
      return { bytes: await renderLetterPdf({ ...l, date: new Date(l.date ?? doc.createdAt) }), mime: 'application/pdf' }
    }
    case 'INVENTORY': {
      const inv = snap as unknown as Omit<InventoryInput, 'photos'> & { photoIds: string[] }
      return { bytes: await renderInventoryPdf({ ...inv, photos: await filesAsDataUrls(user.id, inv.photoIds ?? []) }), mime: 'application/pdf' }
    }
  }
  throw new HttpError(404, 'Document introuvable.')
}

async function ownDocument(userId: string, id: string) {
  const d = await prisma.document.findFirst({ where: { id, userId } })
  if (!d) throw new HttpError(404, 'Document introuvable.')
  return d
}

router.get('/documents/:id/file', async (req, res) => {
  const user = req.user!
  const doc = await ownDocument(user.id, String(req.params.id))
  const { bytes, mime } = await documentBytes(user, doc)
  const ext = mime === 'application/pdf' ? 'pdf' : mime.split('/')[1] ?? 'bin'
  if (mime === 'application/pdf') return sendPdf(res, bytes, `${fileSlug(doc.title)}.${ext}`, req.query.download === '1')
  sendFile(res, bytes, mime, `${fileSlug(doc.title)}.${ext}`, req.query.download === '1')
})

router.post('/documents/:id/send', async (req, res) => {
  const user = req.user!
  const doc = await ownDocument(user.id, String(req.params.id))
  if (!doc.leaseId) throw new HttpError(400, 'Ce document n’est rattaché à aucun bail.')
  const { bytes } = await documentBytes(user, doc)
  const to = await emailLetter(user, doc.leaseId, bytes, doc.title)
  res.json({ success: true, data: { sentTo: to } })
})

router.delete('/documents/:id', async (req, res) => {
  const doc = await ownDocument(req.user!.id, String(req.params.id))
  if (doc.origin !== 'UPLOADED' && doc.kind !== 'LETTER') throw new HttpError(409, 'Un document généré par Bailio est conservé pour garder l’historique.')
  await prisma.document.delete({ where: { id: doc.id } })
  await prisma.expense.updateMany({ where: { documentId: doc.id }, data: { documentId: null } })
  res.json({ success: true, data: { deleted: true } })
})

// ── Fichiers (photos d'état des lieux, justificatifs, diagnostics joints aux fiches) ──

router.post('/files', upload.array('files', 10), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  if (!files.length) throw new HttpError(400, 'Ajoutez un fichier.')
  const out = []
  for (const f of files) out.push(await storeFile(req.user!.id, f))
  res.status(201).json({ success: true, data: out })
})

router.get('/files/:id', async (req, res) => {
  const f = await prisma.fileBlob.findFirst({ where: { id: String(req.params.id), userId: req.user!.id } })
  if (!f) throw new HttpError(404, 'Fichier introuvable.')
  sendFile(res, Buffer.from(f.data), f.mimeType, f.name, req.query.download === '1')
})

router.delete('/files/:id', async (req, res) => {
  await prisma.fileBlob.deleteMany({ where: { id: String(req.params.id), userId: req.user!.id } })
  res.json({ success: true, data: { deleted: true } })
})

export default router
