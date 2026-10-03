import { Router } from 'express'
import { z } from 'zod'
import type { Property, Tenant, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { layout, sendEmail } from '../lib/email.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { newToken } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { propertyName, readProfile, readTenant, tenantName } from '../services/contract.js'
import { TENANT_DOCUMENTS, guarantorSchema, tenantFileSchema, type TenantFile } from '../domain/contract.js'
import { DOC_KEYS, GUARANTOR_EDITABLE, TENANT_EDITABLE, applyReview, pendingReview, tenantLeaseMissing, tenantMissing } from '../domain/tenantFile.js'
import { landlordName } from '../pdf/labels.js'
import { renderLetterPdf } from '../pdf/letter.js'
import { sendPdf, storeFile, upload } from './helpers.js'

/**
 * Dossier du locataire : ce que le propriétaire n'a pas, il le demande au locataire par email ou par courrier.
 * Le locataire reçoit un lien sans compte, complète ses informations (et celles de son garant) et dépose les pièces
 * que la loi autorise à demander. Tout arrive directement dans sa fiche. Le lien expire après 30 jours.
 */
const router = Router()
const LINK_DAYS = 30

type TenantWithProperty = Tenant & { property: Property | null }

async function ownTenant(userId: string, id: string): Promise<TenantWithProperty> {
  const t = await prisma.tenant.findFirst({ where: { id, userId }, include: { property: true } })
  if (!t) throw new HttpError(404, 'Locataire introuvable.')
  return t
}

const formUrl = (code: string) => `${env.CLIENT_URL}/dossier/${code}`
const linkActive = (t: Tenant) => Boolean(t.formCode && t.formSentAt && t.formSentAt.getTime() + LINK_DAYS * 86_400_000 > Date.now())

async function openLink(t: Tenant): Promise<string> {
  if (linkActive(t)) {
    await prisma.tenant.update({ where: { id: t.id }, data: { formSentAt: new Date() } })
    return t.formCode!
  }
  const code = newToken().replace(/[^A-Za-z0-9]/g, '').slice(0, 24)
  await prisma.tenant.update({ where: { id: t.id }, data: { formCode: code, formSentAt: new Date() } })
  return code
}

// ── Propriétaire ─────────────────────────────────────────────────────────────

router.get('/tenants/:id/missing', requireUser, async (req, res) => {
  const t = await ownTenant(req.user!.id, String(req.params.id))
  res.json({ success: true, data: { missing: tenantMissing(readTenant(t)), forLease: tenantLeaseMissing(readTenant(t)), toReview: pendingReview(readTenant(t)).length, link: linkActive(t) ? { url: formUrl(t.formCode!), sentAt: t.formSentAt!.toISOString() } : null } })
})

/** Envoie au locataire le lien pour compléter son dossier (ou le crée seulement, pour un courrier). */
router.post('/tenants/:id/request', requireUser, async (req, res) => {
  const user = req.user!
  const t = await ownTenant(user.id, String(req.params.id))
  const { send } = z.object({ send: z.boolean().default(true) }).parse(req.body ?? {})
  const f = readTenant(t)
  const missing = tenantMissing(f)
  if (!missing.length) throw new HttpError(400, 'Le dossier de ce locataire est complet : rien à demander.')
  if (send && !f.email) throw new HttpError(400, 'Ce locataire n’a pas d’email : téléchargez plutôt le courrier à lui envoyer.')
  const code = await openLink(t)
  if (send) {
    const from = landlordName(readProfile(user)) || 'Votre futur bailleur'
    const mail = layout({
      title: 'Votre dossier de location',
      paragraphs: [
        'Bonjour,',
        `${from} prépare votre bail${t.property ? ` pour ${propertyName(t.property)}` : ''}. Il manque encore quelques informations ou justificatifs.`,
        `À compléter : ${missing.slice(0, 6).map((m) => m.label.toLowerCase()).join(', ')}${missing.length > 6 ? '…' : '.'}`,
        'Vous pouvez tout faire en ligne, sans créer de compte. Le lien est valable 30 jours.',
      ],
      cta: { label: 'Compléter mon dossier', url: formUrl(code) },
    })
    await sendEmail({ to: f.email!, subject: 'Votre dossier de location', ...mail, replyTo: user.email })
  }
  res.json({ success: true, data: { url: formUrl(code), sentTo: send ? f.email : null } })
})

/** Courrier à envoyer au locataire qui n'a pas d'email : liste de ce qui manque et adresse du lien. */
router.get('/tenants/:id/request.pdf', requireUser, async (req, res) => {
  const user = req.user!
  const t = await ownTenant(user.id, String(req.params.id))
  const f = readTenant(t)
  const missing = tenantMissing(f)
  const code = await openLink(t)
  const infos = missing.filter((m) => m.kind === 'INFO')
  const docs = missing.filter((m) => m.kind === 'DOCUMENT')
  const pdf = await renderLetterPdf({
    landlord: readProfile(user),
    recipient: { name: tenantName(f) || 'Madame, Monsieur', address: f.currentAddress ?? '' },
    content: {
      subject: 'Informations et justificatifs pour votre bail',
      recommended: false,
      paragraphs: [
        `Je prépare votre bail${t.property ? ` pour le logement situé ${propertyName(t.property)}` : ''}. Pour l’établir, j’ai besoin des éléments suivants :`,
        ...infos.map((m) => `– ${m.label} ;`),
        ...(docs.length ? ['et d’une copie des justificatifs suivants :', ...docs.map((m) => `– ${m.label} ;`)] : []),
        'Ces pièces sont celles que la loi autorise à demander (décret n° 2015-1437 du 5 novembre 2015). Vous pouvez masquer les informations qui ne sont pas utiles à leur vérification.',
        `Le plus simple : complétez votre dossier en ligne, sans créer de compte, à l’adresse ${formUrl(code)} (valable 30 jours). Vous pouvez aussi me les remettre en main propre ou me les envoyer par courrier.`,
      ],
    },
  })
  sendPdf(res, pdf, 'demande-dossier.pdf', req.query.download === '1')
})

/** Ce que le locataire a envoyé et que le propriétaire doit vérifier. */
router.get('/tenants/:id/review', requireUser, async (req, res) => {
  const t = await ownTenant(req.user!.id, String(req.params.id))
  res.json({ success: true, data: pendingReview(readTenant(t)) })
})

router.post('/tenants/:id/review', requireUser, async (req, res) => {
  const t = await ownTenant(req.user!.id, String(req.params.id))
  const { key, ok } = z.object({ key: z.string().max(60), ok: z.boolean() }).parse(req.body)
  const next = applyReview(readTenant(t), key, ok, new Date().toISOString())
  await prisma.tenant.update({ where: { id: t.id }, data: { data: tenantFileSchema.parse(next) } })
  res.json({ success: true, data: pendingReview(next) })
})

router.delete('/tenants/:id/request', requireUser, async (req, res) => {
  const t = await ownTenant(req.user!.id, String(req.params.id))
  await prisma.tenant.update({ where: { id: t.id }, data: { formCode: null, formSentAt: null } })
  res.json({ success: true, data: { closed: true } })
})

// ── Locataire (public) ───────────────────────────────────────────────────────

async function byCode(code: string): Promise<TenantWithProperty & { user: User }> {
  const t = await prisma.tenant.findUnique({ where: { formCode: code }, include: { property: true, user: true } })
  if (!t || !linkActive(t)) throw new HttpError(404, 'Ce lien n’est plus actif. Demandez-en un nouveau à votre bailleur.')
  return t
}

const pick = <T extends Record<string, unknown>>(o: T | null | undefined, keys: readonly string[]) => Object.fromEntries(keys.map((k) => [k, o?.[k] ?? null]))
const docStatus = (docs: TenantFile['documents']) => Object.fromEntries(DOC_KEYS.map((k) => [k, Boolean(docs?.find((d) => d.category === k && d.received))]))

function publicView(t: TenantWithProperty & { user: User }) {
  const f = readTenant(t)
  return {
    landlord: landlordName(readProfile(t.user)) || 'Votre bailleur',
    property: t.property ? propertyName(t.property) : null,
    guarantee: f.guarantee ?? null,
    tenant: pick(f as Record<string, unknown>, TENANT_EDITABLE),
    guarantor: f.guarantee === 'CAUTION' ? pick(f.guarantor as Record<string, unknown>, GUARANTOR_EDITABLE) : null,
    documents: docStatus(f.documents),
    guarantorDocuments: f.guarantee === 'CAUTION' ? docStatus(f.guarantor?.documents) : null,
    labels: TENANT_DOCUMENTS,
    missing: tenantMissing(f),
  }
}

router.get('/dossier/:code', async (req, res) => {
  res.json({ success: true, data: publicView(await byCode(String(req.params.code))) })
})

const tenantPatch = tenantFileSchema.pick(Object.fromEntries(TENANT_EDITABLE.map((k) => [k, true])) as { [K in (typeof TENANT_EDITABLE)[number]]: true }).partial()
const guarantorPatch = guarantorSchema.pick(Object.fromEntries(GUARANTOR_EDITABLE.map((k) => [k, true])) as { [K in (typeof GUARANTOR_EDITABLE)[number]]: true }).partial()

router.post('/dossier/:code', limitPerVisitor(60, 60), async (req, res) => {
  const t = await byCode(String(req.params.code))
  const body = z.object({ tenant: tenantPatch.optional(), guarantor: guarantorPatch.optional() }).parse(req.body)
  const f = readTenant(t)
  // L'assurance loyers impayés (GLI) est souscrite par le propriétaire : le locataire ne la choisit pas et ne la retire pas.
  if (body.tenant?.guarantee === 'GLI' || (f.guarantee === 'GLI' && body.tenant?.guarantee)) delete body.tenant.guarantee
  const guarantee = body.tenant?.guarantee ?? f.guarantee
  const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))
  // Ce que le locataire change est marqué « à vérifier » pour le propriétaire.
  const changed = (o: Record<string, unknown>, before: Record<string, unknown> | null | undefined, prefix = '') =>
    Object.entries(o)
      .filter(([k, v]) => v !== undefined && v !== null && v !== '' && v !== before?.[k])
      .map(([k]) => `${prefix}${k}`)
  const touched = [...changed(clean(body.tenant ?? {}), f as Record<string, unknown>), ...(guarantee === 'CAUTION' ? changed(clean(body.guarantor ?? {}), f.guarantor as Record<string, unknown>, 'guarantor.') : [])]
  const next: TenantFile = {
    ...f,
    ...clean(body.tenant ?? {}),
    ...(guarantee === 'CAUTION' && body.guarantor ? { guarantor: { ...f.guarantor, ...clean(body.guarantor) } } : {}),
    review: [...new Set([...(f.review ?? []), ...touched])].slice(0, 60),
  }
  await prisma.tenant.update({ where: { id: t.id }, data: { data: tenantFileSchema.parse(next) } })
  res.json({ success: true, data: publicView(await byCode(String(req.params.code))) })
})

router.post('/dossier/:code/document', limitPerVisitor(60, 40), upload.single('file'), async (req, res) => {
  const t = await byCode(String(req.params.code))
  const { category, who } = z.object({ category: z.enum(DOC_KEYS as [string, ...string[]]), who: z.enum(['TENANT', 'GUARANTOR']).default('TENANT') }).parse(req.body)
  if (!req.file) throw new HttpError(400, 'Ajoutez le fichier (photo ou PDF).')
  const f = readTenant(t)
  if (who === 'GUARANTOR' && f.guarantee !== 'CAUTION') throw new HttpError(400, 'Aucun garant n’est prévu pour ce dossier.')
  const stored = await storeFile(t.userId, req.file)
  const entry = { category, received: true, fileId: stored.id, label: stored.name.slice(0, 150), source: 'TENANT' as const }
  const next: TenantFile =
    who === 'GUARANTOR'
      ? { ...f, guarantor: { ...f.guarantor, documents: [...(f.guarantor?.documents ?? []).filter((d) => d.category !== category), entry] } }
      : { ...f, documents: [...(f.documents ?? []).filter((d) => d.category !== category), entry] }
  await prisma.tenant.update({ where: { id: t.id }, data: { data: tenantFileSchema.parse(next) } })
  res.status(201).json({ success: true, data: publicView(await byCode(String(req.params.code))) })
})

/** Le locataire a terminé : le propriétaire est prévenu. */
router.post('/dossier/:code/done', limitPerVisitor(60, 10), async (req, res) => {
  const t = await byCode(String(req.params.code))
  const f = readTenant(t)
  const left = tenantMissing(f).length
  const mail = layout({
    title: 'Dossier complété',
    paragraphs: [`${tenantName(f) || 'Votre locataire'} a complété son dossier en ligne.`, left ? `Il reste ${left} élément${left > 1 ? 's' : ''} à fournir.` : 'Il est complet : vous pouvez préparer le bail.'],
    cta: { label: 'Voir sa fiche', url: `${env.CLIENT_URL}/espace/locataires/${t.id}` },
  })
  sendEmail({ to: t.user.email, subject: `Dossier complété : ${tenantName(f) || 'votre locataire'}`, ...mail }).catch(() => undefined)
  res.json({ success: true, data: { left } })
})

export default router
