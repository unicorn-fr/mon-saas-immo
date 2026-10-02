import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { layout, sendEmail } from '../lib/email.js'
import { HttpError } from '../lib/http.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { newToken } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { propertyName, readProperty } from '../services/contract.js'
import { buildAd } from '../domain/ad.js'
import { adSettings } from '../services/ad.js'
import { ALLOWED_DOCUMENTS, FORBIDDEN_DOCUMENTS, GUARANTEE_LABEL, SITUATION_LABEL, candidateSchema, rentShare, tenantFromCandidate, type CandidateData } from '../domain/candidates.js'

/**
 * Candidatures : lien public par logement (sans compte, sans pièce jointe), liste pour le propriétaire,
 * et « Choisir ce candidat » qui crée la fiche du locataire déjà remplie.
 */
const router = Router()

/** Durée de conservation d'une candidature non retenue. */
const KEEP_DAYS = 90

async function ownProperty(userId: string, id: string) {
  const p = await prisma.property.findFirst({ where: { id, userId }, include: { leases: { orderBy: { startDate: 'desc' } } } })
  if (!p) throw new HttpError(404, 'Logement introuvable.')
  return p
}

/** Ce que voit le candidat : l'annonce (sans adresse exacte) et les pièces qu'on peut lui demander. */
function publicOffer(p: Awaited<ReturnType<typeof ownProperty>>) {
  const file = readProperty(p)
  const settings = adSettings(p, p.leases)
  const ad = buildAd(file, settings)
  return {
    title: ad.title,
    text: ad.text,
    rentWithChargesCents: settings.rentCents ? settings.rentCents + (settings.chargesCents ?? 0) : null,
    allowedDocuments: ALLOWED_DOCUMENTS,
  }
}

// ── Public ───────────────────────────────────────────────────────────────────

router.get('/candidature/:code', async (req, res) => {
  const p = await prisma.property.findUnique({ where: { applyCode: String(req.params.code) }, include: { leases: { orderBy: { startDate: 'desc' } } } })
  if (!p) throw new HttpError(404, 'Ce lien de candidature n’est plus actif.')
  res.json({ success: true, data: publicOffer(p) })
})

router.post('/candidature/:code', limitPerVisitor(60, 5), async (req, res) => {
  const p = await prisma.property.findUnique({ where: { applyCode: String(req.params.code) }, include: { user: true } })
  if (!p) throw new HttpError(404, 'Ce lien de candidature n’est plus actif.')
  // Champ invisible rempli : envoi automatique, ignoré sans le dire.
  if (typeof req.body?.website === 'string' && req.body.website) return res.status(201).json({ success: true, data: { received: true } })
  const data = candidateSchema.parse(req.body)
  const recent = await prisma.candidate.count({ where: { propertyId: p.id, createdAt: { gt: new Date(Date.now() - 86_400_000) } } })
  if (recent >= 50) throw new HttpError(429, 'Ce logement a reçu beaucoup de candidatures aujourd’hui. Réessayez demain.')
  await prisma.candidate.create({ data: { userId: p.userId, propertyId: p.id, data } })
  const mail = layout({
    title: 'Nouvelle candidature',
    paragraphs: [`${data.firstNames} ${data.lastName} a envoyé une candidature pour ${propertyName(p)}.`, 'Retrouvez-la dans Bailio, avec les autres candidatures reçues.'],
    cta: { label: 'Voir les candidatures', url: `${env.CLIENT_URL}/espace/logements/${p.id}/candidats` },
  })
  sendEmail({ to: p.user.email, subject: `Nouvelle candidature, ${propertyName(p)}`, ...mail }).catch(() => undefined)
  res.status(201).json({ success: true, data: { received: true } })
})

// ── Propriétaire ─────────────────────────────────────────────────────────────

router.get('/properties/:id/candidates', requireUser, async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  const offer = publicOffer(p)
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
  await prisma.candidate.delete({ where: { id: c.id } })
  res.json({ success: true, data: { deleted: true } })
})

// « Choisir ce candidat » : sa fiche de locataire est créée, déjà remplie ; la candidature est effacée.
router.post('/candidates/:id/choose', requireUser, async (req, res) => {
  const c = await ownCandidate(req.user!.id, String(req.params.id))
  const tenant = await prisma.tenant.create({ data: { userId: c.userId, propertyId: c.propertyId, data: tenantFromCandidate(c.data as CandidateData) } })
  await prisma.candidate.delete({ where: { id: c.id } })
  res.status(201).json({ success: true, data: { tenantId: tenant.id, propertyId: c.propertyId } })
})

/** Effacement des candidatures de plus de trois mois (appelé chaque jour). */
export async function purgeOldCandidates(): Promise<number> {
  const r = await prisma.candidate.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_DAYS * 86_400_000) } } })
  return r.count
}

export default router
