import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { layout, sendEmail } from '../lib/email.js'
import { HttpError } from '../lib/http.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { newToken, sha256 } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { propertyName, readProfile, readProperty } from '../services/contract.js'
import { buildAd } from '../domain/ad.js'
import { adSettings } from '../services/ad.js'
import { ALLOWED_DOCUMENTS, DEFAULT_REQUESTED_DOCS, FORBIDDEN_DOCUMENTS, GUARANTEE_LABEL, SITUATION_LABEL, candidateSchema, docsLocked, rentShare, reviewCandidate, tenantFromCandidate, type CandidateData, type CandidateDoc, type CandidateFollow } from '../domain/candidates.js'
import { TENANT_DOCUMENTS, tenantFileSchema } from '../domain/contract.js'
import { MAX_FILES_PER_DOC, SUGGESTED_FILES } from '../domain/tenantFile.js'
import { sendPropertyPhoto, storeFile, upload } from './helpers.js'
import { watermarkText } from '../domain/watermark.js'

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
    requestedDocs: requested(file).map((k) => ({ key: k, label: TENANT_DOCUMENTS[k as keyof typeof TENANT_DOCUMENTS], suggested: SUGGESTED_FILES[k as keyof typeof SUGGESTED_FILES] ?? null })),
    guarantorDocs: file.ad?.guarantorDocs !== false,
    city: file.city ?? null,
    hasPhoto: Boolean(file.photos?.length),
  }
}

type Stored = CandidateData & CandidateFollow & { documents?: CandidateDoc[]; uploadToken?: string; uploadUntil?: string }

const followUrl = (token: string) => `${env.CLIENT_URL}/suivi-candidature/${token}`

/** Email au candidat : son lien de suivi, pour confirmer la visite (ses pièces deviennent alors visibles) ou retirer sa candidature. */
function sendFollowEmail(to: string, place: string, token: string, again = false) {
  const mail = layout({
    title: again ? 'Avez-vous visité le logement ?' : 'Votre candidature est bien envoyée',
    paragraphs: [
      again ? `Le propriétaire du logement ${place} vous demande de confirmer la visite.` : `Votre candidature pour le logement ${place} est bien arrivée.`,
      'Pour vous protéger des fausses annonces, vos pièces portent un filigrane et restent cachées au propriétaire tant que vous n’avez pas confirmé avoir visité le logement ou rencontré le propriétaire.',
      'Ne confirmez qu’après une vraie visite. Ne versez jamais d’argent avant d’avoir visité le logement et signé le bail.',
    ],
    cta: { label: again ? 'Confirmer la visite' : 'Suivre ma candidature', url: followUrl(token) },
  })
  sendEmail({ to, subject: again ? `Confirmez votre visite, logement ${place}` : `Candidature envoyée, logement ${place}`, ...mail }).catch(() => undefined)
}

const placeOf = (file: ReturnType<typeof readProperty>) => (file.city ? `à ${file.city}` : 'que vous avez choisi')

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
  // Lien de suivi du candidat (gardé en empreinte) : confirmer la visite, retirer sa candidature.
  const followToken = newToken()
  const created = await prisma.candidate.create({ data: { userId: p.userId, propertyId: p.id, data: { ...data, documents: [], uploadToken, uploadUntil: new Date(Date.now() + 86_400_000).toISOString(), followHashes: [sha256(followToken)] } } })
  sendFollowEmail(data.email, placeOf(readProperty(p)), followToken)
  const mail = layout({
    title: 'Nouvelle candidature',
    paragraphs: [`${data.firstNames} ${data.lastName} a envoyé une candidature pour ${propertyName(p)}.`, 'Retrouvez-la dans Bailio, avec les autres candidatures reçues.'],
    cta: { label: 'Voir les candidatures', url: `${env.CLIENT_URL}/espace/logements/${p.id}/candidats` },
  })
  sendEmail({ to: p.user.email, subject: `Nouvelle candidature, ${propertyName(p)}`, ...mail }).catch(() => undefined)
  res.status(201).json({ success: true, data: { received: true, candidateId: created.id, uploadToken, followToken } })
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
  if (docs.length >= 30) throw new HttpError(400, 'Toutes les pièces ont déjà été déposées.')
  if (docs.filter((x) => x.category === body.category && x.who === body.who).length >= MAX_FILES_PER_DOC) throw new HttpError(400, `${MAX_FILES_PER_DOC} fichiers au plus pour une même pièce. Retirez-en un pour en ajouter un autre.`)
  // Enregistrée seulement avec son filigrane : l'original n'est jamais gardé.
  const stored = await storeFile(p.userId, req.file, { watermark: watermarkText({ city: readProperty(p).city }) })
  // Le fichier s'ajoute aux autres de la même pièce (trois bulletins de salaire), sans les remplacer.
  const next = [...docs, { category: body.category, who: body.who, fileId: stored.id, label: stored.name.slice(0, 150) }]
  await prisma.candidate.update({ where: { id: c.id }, data: { data: { ...d, documents: next } as unknown as Prisma.InputJsonObject } })
  res.status(201).json({ success: true, data: { documents: next.map((x) => ({ category: x.category, who: x.who, fileId: x.fileId, name: x.label })) } })
})

// Le candidat retire un fichier qu'il vient de déposer (mauvais fichier, doublon), avec le même jeton de 24 heures.
router.post('/candidature/:code/document/remove', limitPerVisitor(60, 40), async (req, res) => {
  const p = await prisma.property.findUnique({ where: { applyCode: String(req.params.code) } })
  if (!p) throw new HttpError(404, 'Ce lien de candidature n’est plus actif.')
  const body = z.object({ candidateId: z.uuid(), token: z.string().min(20).max(200), fileId: z.uuid() }).parse(req.body)
  const c = await prisma.candidate.findFirst({ where: { id: body.candidateId, propertyId: p.id } })
  const d = (c?.data ?? {}) as unknown as Stored
  if (!c || d.uploadToken !== body.token || !d.uploadUntil || new Date(d.uploadUntil) < new Date()) throw new HttpError(403, 'Le dépôt des pièces n’est plus possible pour cette candidature.')
  const next = (d.documents ?? []).filter((x) => x.fileId !== body.fileId)
  await prisma.candidate.update({ where: { id: c.id }, data: { data: { ...d, documents: next } as unknown as Prisma.InputJsonObject } })
  await prisma.fileBlob.deleteMany({ where: { id: body.fileId, userId: p.userId } })
  res.json({ success: true, data: { documents: next.map((x) => ({ category: x.category, who: x.who, fileId: x.fileId, name: x.label })) } })
})

// Photo principale du logement, montrée au candidat (la même que dans l'annonce).
router.get('/candidature/:code/photo', async (req, res) => {
  const p = await prisma.property.findUnique({ where: { applyCode: String(req.params.code) } })
  if (!p) throw new HttpError(404, 'Ce lien de candidature n’est plus actif.')
  await sendPropertyPhoto(res, p)
})

// ── Suivi par le candidat (lien reçu par email, sans compte) ─────────────────

async function byFollow(token: string) {
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) throw new HttpError(404, 'Ce lien de suivi n’est plus actif.')
  const c = await prisma.candidate.findFirst({ where: { data: { path: ['followHashes'], array_contains: [sha256(token)] } }, include: { property: true } })
  if (!c) throw new HttpError(404, 'Ce lien de suivi n’est plus actif : la candidature a été retirée, retenue ou effacée.')
  return c
}

function followView(c: Awaited<ReturnType<typeof byFollow>>) {
  const d = c.data as unknown as Stored
  const file = readProperty(c.property)
  return {
    firstNames: d.firstNames,
    city: file.city ?? null,
    hasPhoto: Boolean(file.photos?.length),
    sentAt: c.createdAt.toISOString(),
    documents: (d.documents ?? []).map((x) => `${TENANT_DOCUMENTS[x.category as keyof typeof TENANT_DOCUMENTS]}${x.who === 'GUARANTOR' ? ' du garant' : ''}`),
    visitConfirmedAt: d.visitConfirmedAt ?? null,
    keepDays: KEEP_DAYS,
  }
}

router.get('/suivi-candidature/:token', limitPerVisitor(10, 60), async (req, res) => {
  res.json({ success: true, data: followView(await byFollow(String(req.params.token))) })
})

router.get('/suivi-candidature/:token/photo', limitPerVisitor(10, 60), async (req, res) => {
  await sendPropertyPhoto(res, (await byFollow(String(req.params.token))).property)
})

// Le candidat confirme avoir visité le logement ou rencontré le propriétaire : ses pièces deviennent visibles.
router.post('/suivi-candidature/:token/visit', limitPerVisitor(60, 10), async (req, res) => {
  const c = await byFollow(String(req.params.token))
  const d = c.data as unknown as Stored
  if (!d.visitConfirmedAt) {
    await prisma.candidate.update({ where: { id: c.id }, data: { data: { ...d, visitConfirmedAt: new Date().toISOString() } as unknown as Prisma.InputJsonObject } })
    const owner = await prisma.user.findUniqueOrThrow({ where: { id: c.userId } })
    const mail = layout({
      title: 'Visite confirmée',
      paragraphs: [`${d.firstNames} ${d.lastName} confirme avoir visité ${propertyName(c.property)}.`, d.documents?.length ? 'Ses pièces sont maintenant visibles dans Bailio, avec leur filigrane.' : 'Sa candidature vous attend dans Bailio.'],
      cta: { label: 'Voir les candidatures', url: `${env.CLIENT_URL}/espace/logements/${c.propertyId}/candidats` },
    })
    sendEmail({ to: owner.email, subject: `Visite confirmée : ${d.firstNames} ${d.lastName}`, ...mail }).catch(() => undefined)
  }
  res.json({ success: true, data: followView(await byFollow(String(req.params.token))) })
})

// Le candidat retire sa candidature : elle est effacée tout de suite, pièces comprises.
router.delete('/suivi-candidature/:token', limitPerVisitor(60, 10), async (req, res) => {
  const c = await byFollow(String(req.params.token))
  await deleteCandidateFiles([c])
  await prisma.candidate.delete({ where: { id: c.id } })
  res.json({ success: true, data: { deleted: true } })
})

/** Pièce d'un candidat qui n'a pas encore confirmé la visite : jamais servie au propriétaire (routes/money.ts, /files/:id). */
export async function candidateFileLocked(userId: string, fileId: string): Promise<boolean> {
  const c = await prisma.candidate.findFirst({ where: { userId, data: { path: ['documents'], array_contains: [{ fileId }] } } })
  return Boolean(c && docsLocked(c.data as unknown as Stored))
}

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
        const d = r.data as unknown as Stored
        const locked = docsLocked(d)
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
          // Aide au tri sur des critères objectifs seulement (domain/candidates.ts, reviewCandidate).
          review: reviewCandidate(d as CandidateData & { documents?: CandidateDoc[] }, { rentWithChargesCents: offer.rentWithChargesCents, requestedDocs: offer.requestedDocs.map((x) => x.key), availableFrom: adSettings(p, p.leases).availableFrom ?? null }),
          // Pièces cachées tant que le candidat n'a pas confirmé la visite (docsLocked).
          visitConfirmedAt: d.visitConfirmedAt ?? null,
          visitRequestedAt: d.visitRequestedAt ?? null,
          docsLocked: locked,
          documents: (d.documents ?? []).map((x, i, all) => {
            // Plusieurs fichiers pour une pièce : numérotés (« Justificatifs de ressources, 2 sur 3 »).
            const same = all.filter((y) => y.category === x.category && y.who === x.who)
            const nth = same.length > 1 ? `, ${same.indexOf(x) + 1} sur ${same.length}` : ''
            return { category: x.category, who: x.who, fileId: locked ? null : x.fileId, label: `${TENANT_DOCUMENTS[x.category as keyof typeof TENANT_DOCUMENTS]}${x.who === 'GUARANTOR' ? ' du garant' : ''}${nth}` }
          }),
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

// Le propriétaire demande au candidat de confirmer la visite (une fois par jour au plus) : nouveau lien de suivi.
router.post('/candidates/:id/visit-request', requireUser, async (req, res) => {
  const c = await ownCandidate(req.user!.id, String(req.params.id))
  const d = c.data as unknown as Stored
  if (!docsLocked(d)) return res.json({ success: true, data: { sent: false } })
  if (d.visitRequestedAt && Date.now() - new Date(d.visitRequestedAt).getTime() < 86_400_000) throw new HttpError(429, 'Une demande est déjà partie aujourd’hui. Le candidat peut aussi confirmer depuis le lien reçu avec sa candidature.')
  const p = await prisma.property.findUniqueOrThrow({ where: { id: c.propertyId } })
  const followToken = newToken()
  await prisma.candidate.update({ where: { id: c.id }, data: { data: { ...d, followHashes: [...(d.followHashes ?? []), sha256(followToken)].slice(-5), visitRequestedAt: new Date().toISOString() } as unknown as Prisma.InputJsonObject } })
  sendFollowEmail(d.email, placeOf(readProperty(p)), followToken, true)
  res.json({ success: true, data: { sent: true } })
})

// « Choisir ce candidat » : sa fiche de locataire est créée, déjà remplie ; la candidature est effacée.
router.post('/candidates/:id/choose', requireUser, async (req, res) => {
  const c = await ownCandidate(req.user!.id, String(req.params.id))
  const cd = c.data as unknown as Stored
  if (docsLocked(cd) && cd.documents?.length) throw new HttpError(409, 'Le candidat n’a pas encore confirmé la visite : ses pièces restent cachées. Demandez-lui de la confirmer, puis choisissez-le.')
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
