import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { layout, sendEmail } from '../lib/email.js'
import { HttpError } from '../lib/http.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { newToken } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { propertyName, readProfile, readProperty } from '../services/contract.js'
import { buildAd } from '../domain/ad.js'
import { adSettings } from '../services/ad.js'
import { ALLOWED_DOCUMENTS, DEFAULT_REQUESTED_DOCS, FORBIDDEN_DOCUMENTS, GUARANTEE_LABEL, SITUATION_LABEL, candidateSchema, rentShare, tenantFromCandidate, type CandidateData, type CandidateDoc } from '../domain/candidates.js'
import { TENANT_DOCUMENTS, tenantFileSchema } from '../domain/contract.js'
import { storeFile, upload } from './helpers.js'

/**
 * Candidatures : lien public par logement (sans compte), à donner aux personnes qui répondent à une annonce
 * (Leboncoin, SeLoger, PAP…). Le candidat dépose les pièces choisies pour ce logement ; « Choisir ce candidat »
 * crée la fiche du locataire déjà remplie, avec ses pièces (à vérifier). Le reste est effacé après trois mois.
 */
const router = Router()

/** Durée de conservation d'une candidature non retenue. */
const KEEP_DAYS = 90

async function ownProperty(userId: string, id: string) {
  const p = await prisma.property.findFirst({ where: { id, userId }, include: { leases: { orderBy: { startDate: 'desc' } } } })
  if (!p) throw new HttpError(404, 'Logement introuvable.')
  return p
}

const requested = (file: ReturnType<typeof readProperty>) => (file.ad?.requestedDocs?.length ? file.ad.requestedDocs : DEFAULT_REQUESTED_DOCS)

/** Fichiers d'une candidature : effacés avec elle (jamais conservés au-delà de trois mois). */
async function deleteCandidateFiles(rows: Array<{ data: unknown }>) {
  const ids = rows.flatMap((r) => ((r.data as { documents?: CandidateDoc[] }).documents ?? []).map((d) => d.fileId))
  if (ids.length) await prisma.fileBlob.deleteMany({ where: { id: { in: ids } } })
}

/** Ce que voit le candidat : l'annonce (sans adresse exacte) et les pièces qu'on peut lui demander. */
function publicOffer(p: Awaited<ReturnType<typeof ownProperty>>, agent = false) {
  const file = readProperty(p)
  const settings = adSettings(p, p.leases)
  const ad = buildAd(file, settings, { agent })
  return {
    title: ad.title,
    text: ad.text,
    rentWithChargesCents: settings.rentCents ? settings.rentCents + (settings.chargesCents ?? 0) : null,
    allowedDocuments: ALLOWED_DOCUMENTS,
    requestedDocs: requested(file).map((k) => ({ key: k, label: TENANT_DOCUMENTS[k as keyof typeof TENANT_DOCUMENTS] })),
    guarantorDocs: file.ad?.guarantorDocs !== false,
  }
}

// ── Public ───────────────────────────────────────────────────────────────────

router.get('/candidature/:code', async (req, res) => {
  const p = await prisma.property.findUnique({ where: { applyCode: String(req.params.code) }, include: { leases: { orderBy: { startDate: 'desc' } }, user: true } })
  if (!p) throw new HttpError(404, 'Ce lien de candidature n’est plus actif.')
  res.json({ success: true, data: publicOffer(p, Boolean(readProfile(p.user).agent?.enabled)) })
})

router.post('/candidature/:code', limitPerVisitor(60, 5), async (req, res) => {
  const p = await prisma.property.findUnique({ where: { applyCode: String(req.params.code) }, include: { user: true } })
  if (!p) throw new HttpError(404, 'Ce lien de candidature n’est plus actif.')
  // Champ invisible rempli : envoi automatique, ignoré sans le dire.
  if (typeof req.body?.website === 'string' && req.body.website) return res.status(201).json({ success: true, data: { received: true } })
  const data = candidateSchema.parse(req.body)
  const recent = await prisma.candidate.count({ where: { propertyId: p.id, createdAt: { gt: new Date(Date.now() - 86_400_000) } } })
  if (recent >= 50) throw new HttpError(429, 'Ce logement a reçu beaucoup de candidatures aujourd’hui. Réessayez demain.')
  // Jeton remis au candidat pour déposer ses pièces juste après (valable 24 heures).
  const uploadToken = newToken()
  const created = await prisma.candidate.create({ data: { userId: p.userId, propertyId: p.id, data: { ...data, documents: [], uploadToken, uploadUntil: new Date(Date.now() + 86_400_000).toISOString() } } })
  const mail = layout({
    title: 'Nouvelle candidature',
    paragraphs: [`${data.firstNames} ${data.lastName} a envoyé une candidature pour ${propertyName(p)}.`, 'Retrouvez-la dans Bailio, avec les autres candidatures reçues.'],
    cta: { label: 'Voir les candidatures', url: `${env.CLIENT_URL}/espace/logements/${p.id}/candidats` },
  })
  sendEmail({ to: p.user.email, subject: `Nouvelle candidature, ${propertyName(p)}`, ...mail }).catch(() => undefined)
  res.status(201).json({ success: true, data: { received: true, candidateId: created.id, uploadToken } })
})

/** Le candidat dépose une pièce demandée (photo ou PDF), avec le jeton reçu à l'envoi de sa candidature. */
router.post('/candidature/:code/document', limitPerVisitor(60, 40), upload.single('file'), async (req, res) => {
  const p = await prisma.property.findUnique({ where: { applyCode: String(req.params.code) } })
  if (!p) throw new HttpError(404, 'Ce lien de candidature n’est plus actif.')
  const body = z.object({ candidateId: z.uuid(), token: z.string().min(20).max(200), category: z.enum(Object.keys(TENANT_DOCUMENTS) as [string, ...string[]]), who: z.enum(['TENANT', 'GUARANTOR']).default('TENANT') }).parse(req.body)
  const c = await prisma.candidate.findFirst({ where: { id: body.candidateId, propertyId: p.id } })
  const d = (c?.data ?? {}) as unknown as CandidateData & { documents?: CandidateDoc[]; uploadToken?: string; uploadUntil?: string }
  if (!c || d.uploadToken !== body.token || !d.uploadUntil || new Date(d.uploadUntil) < new Date()) throw new HttpError(403, 'Le dépôt des pièces n’est plus possible pour cette candidature.')
  if (!requested(readProperty(p)).includes(body.category)) throw new HttpError(400, 'Cette pièce n’est pas demandée pour ce logement.')
  if (body.who === 'GUARANTOR' && d.guarantee !== 'CAUTION') throw new HttpError(400, 'Aucun garant n’est indiqué dans la candidature.')
  if (!req.file) throw new HttpError(400, 'Ajoutez le fichier (photo ou PDF).')
  const docs = d.documents ?? []
  if (docs.length >= 12) throw new HttpError(400, 'Toutes les pièces ont déjà été déposées.')
  const stored = await storeFile(p.userId, req.file)
  const old = docs.filter((x) => x.category === body.category && x.who === body.who)
  if (old.length) await prisma.fileBlob.deleteMany({ where: { id: { in: old.map((x) => x.fileId) } } })
  const next = [...docs.filter((x) => !(x.category === body.category && x.who === body.who)), { category: body.category, who: body.who, fileId: stored.id, label: stored.name.slice(0, 150) }]
  await prisma.candidate.update({ where: { id: c.id }, data: { data: { ...d, documents: next } as unknown as Prisma.InputJsonObject } })
  res.status(201).json({ success: true, data: { documents: next.map((x) => ({ category: x.category, who: x.who })) } })
})

// ── Propriétaire ─────────────────────────────────────────────────────────────

router.get('/properties/:id/candidates', requireUser, async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  const offer = publicOffer(p, Boolean(readProfile(req.user!).agent?.enabled))
  const rows = await prisma.candidate.findMany({ where: { propertyId: p.id }, orderBy: { createdAt: 'desc' } })
  res.json({
    success: true,
    data: {
      applyCode: p.applyCode,
      offer,
      forbiddenDocuments: FORBIDDEN_DOCUMENTS,
      keepDays: KEEP_DAYS,
      candidates: rows.map((r) => {
        const d = r.data as CandidateData
        return {
          id: r.id,
          status: r.status,
          receivedAt: r.createdAt.toISOString(),
          name: `${d.firstNames} ${d.lastName}`,
          email: d.email,
          phone: d.phone ?? null,
          situation: SITUATION_LABEL[d.situation],
          guarantee: GUARANTEE_LABEL[d.guarantee],
          guarantorName: d.guarantor ? `${d.guarantor.firstNames} ${d.guarantor.lastName}` : null,
          monthlyIncomeCents: d.monthlyIncomeCents,
          occupants: d.occupants ?? null,
          moveInDate: d.moveInDate ?? null,
          dossierFacileUrl: d.dossierFacileUrl || null,
          message: d.message ?? null,
          rentShare: offer.rentWithChargesCents ? rentShare(offer.rentWithChargesCents, d.monthlyIncomeCents) : null,
          documents: ((d as CandidateData & { documents?: CandidateDoc[] }).documents ?? []).map((x) => ({ category: x.category, who: x.who, fileId: x.fileId, label: `${TENANT_DOCUMENTS[x.category as keyof typeof TENANT_DOCUMENTS]}${x.who === 'GUARANTOR' ? ' du garant' : ''}` })),
        }
      }),
    },
  })
})

// Ouvrir le lien de candidature (ou le renouveler), ou le fermer.
router.post('/properties/:id/apply-link', requireUser, async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  const { open } = z.object({ open: z.boolean() }).parse(req.body)
  const code = open ? newToken().replace(/[^A-Za-z0-9]/g, '').slice(0, 16) : null
  await prisma.property.update({ where: { id: p.id }, data: { applyCode: code } })
  res.json({ success: true, data: { applyCode: code } })
})

async function ownCandidate(userId: string, id: string) {
  const c = await prisma.candidate.findFirst({ where: { id, userId } })
  if (!c) throw new HttpError(404, 'Candidature introuvable.')
  return c
}

router.patch('/candidates/:id', requireUser, async (req, res) => {
  const c = await ownCandidate(req.user!.id, String(req.params.id))
  const { status } = z.object({ status: z.enum(['NEW', 'SHORTLIST', 'REJECTED']) }).parse(req.body)
  await prisma.candidate.update({ where: { id: c.id }, data: { status } })
  res.json({ success: true, data: { status } })
})

router.delete('/candidates/:id', requireUser, async (req, res) => {
  const c = await ownCandidate(req.user!.id, String(req.params.id))
  await deleteCandidateFiles([c])
  await prisma.candidate.delete({ where: { id: c.id } })
  res.json({ success: true, data: { deleted: true } })
})

// « Choisir ce candidat » : sa fiche de locataire est créée, déjà remplie ; la candidature est effacée.
router.post('/candidates/:id/choose', requireUser, async (req, res) => {
  const c = await ownCandidate(req.user!.id, String(req.params.id))
  const tenant = await prisma.tenant.create({ data: { userId: c.userId, propertyId: c.propertyId, data: tenantFileSchema.parse(tenantFromCandidate(c.data as unknown as CandidateData & { documents?: CandidateDoc[] })) } })
  await prisma.candidate.delete({ where: { id: c.id } })
  res.status(201).json({ success: true, data: { tenantId: tenant.id, propertyId: c.propertyId } })
})

/** Effacement des candidatures de plus de trois mois (appelé chaque jour). */
export async function purgeOldCandidates(): Promise<number> {
  const where = { createdAt: { lt: new Date(Date.now() - KEEP_DAYS * 86_400_000) } }
  await deleteCandidateFiles(await prisma.candidate.findMany({ where, select: { data: true } }))
  const r = await prisma.candidate.deleteMany({ where })
  return r.count
}

export default router
