import { Router, type Request } from 'express'
import multer from 'multer'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import type { Draft, Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { draftDataSchema } from '../domain/lease.js'
import { HttpError } from '../lib/http.js'
import { hashToken, newToken } from '../lib/tokens.js'
import { layout, sendEmail } from '../lib/email.js'
import { optionalUser } from '../services/session.js'
import { draftToLeaseInput } from '../services/leases.js'
import { renderLeasePdf } from '../pdf/lease.js'
import { extractLease, extractionToDraft, importAvailable, toArchivedFile, validateFiles } from '../services/importLease.js'

const DRAFT_DAYS = 30
const router = Router()

const createLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false })
const emailLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 5, standardHeaders: true, legacyHeaders: false })
const importLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false })
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 10 } })

/** Le brouillon est identifié par son jeton, envoyé dans l'en-tête X-Draft-Token. */
export async function draftFromRequest(req: Request): Promise<Draft> {
  const token = req.header('x-draft-token')
  if (!token) throw new HttpError(401, 'Brouillon introuvable.')
  const draft = await prisma.draft.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!draft || draft.expiresAt < new Date()) throw new HttpError(404, 'Ce brouillon a expiré. Vous pouvez recommencer, cela prend 5 minutes.')
  if (draft.userId && req.user?.id !== draft.userId) throw new HttpError(403, 'Ce brouillon est rattaché à un autre compte.')
  return draft
}

function publicDraft(d: Draft) {
  return { data: d.data, step: d.step, leaseId: d.leaseId, hasImportFile: Boolean(d.importFile), updatedAt: d.updatedAt }
}

const expiry = () => new Date(Date.now() + DRAFT_DAYS * 86_400_000)

// Nouveau brouillon (sans compte).
router.post('/', createLimiter, optionalUser, async (req, res) => {
  const token = newToken()
  const draft = await prisma.draft.create({
    data: { tokenHash: hashToken(token), expiresAt: expiry(), userId: req.user?.id },
  })
  res.status(201).json({ success: true, data: { token, draft: publicDraft(draft) } })
})

router.get('/current', optionalUser, async (req, res) => {
  const draft = await draftFromRequest(req)
  res.json({ success: true, data: publicDraft(draft) })
})

const saveSchema = z.object({ data: draftDataSchema, step: z.string().max(40).optional() })

// Enregistrement automatique à chaque étape.
router.put('/current', optionalUser, async (req, res) => {
  const draft = await draftFromRequest(req)
  if (draft.leaseId) throw new HttpError(409, 'Ce bail a déjà été créé.')
  const { data, step } = saveSchema.parse(req.body)
  const updated = await prisma.draft.update({
    where: { id: draft.id },
    data: { data: data as Prisma.InputJsonValue, step: step ?? draft.step, expiresAt: expiry() },
  })
  res.json({ success: true, data: publicDraft(updated) })
})

// « Enregistrer et terminer plus tard » : lien de reprise par email.
router.post('/current/resume-link', emailLimiter, optionalUser, async (req, res) => {
  const draft = await draftFromRequest(req)
  const { email } = z.object({ email: z.email('Email invalide') }).parse(req.body)
  const token = req.header('x-draft-token')!
  await prisma.draft.update({ where: { id: draft.id }, data: { resumeEmail: email.toLowerCase() } })
  const mail = layout({
    title: 'Votre bail vous attend.',
    paragraphs: [
      'Vous avez commencé votre bail sur Bailio. Tout ce que vous avez saisi est enregistré.',
      `Ce lien reste valable ${DRAFT_DAYS} jours. Ne le transmettez à personne.`,
    ],
    cta: { label: 'Reprendre mon bail', url: `${env.CLIENT_URL}/reprendre?brouillon=${encodeURIComponent(token)}` },
  })
  await sendEmail({ to: email, subject: 'Reprendre votre bail sur Bailio', ...mail })
  res.json({ success: true, data: { sent: true } })
})

// Aperçu du bail complet, avant la création du compte.
router.get('/current/preview.pdf', optionalUser, async (req, res) => {
  const draft = await draftFromRequest(req)
  const pdf = await renderLeasePdf(draftToLeaseInput(draft))
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline; filename="apercu-bail.pdf"')
  res.setHeader('Cache-Control', 'no-store')
  res.send(pdf)
})

router.get('/import/available', (_req, res) => {
  res.json({ success: true, data: { available: importAvailable() } })
})

// « J'ai déjà un bail signé » : l'IA lit le document et remplit le brouillon.
router.post('/current/import', importLimiter, optionalUser, upload.array('files', 10), async (req, res) => {
  const draft = await draftFromRequest(req)
  if (draft.leaseId) throw new HttpError(409, 'Ce bail a déjà été créé.')
  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  validateFiles(files)
  const extraction = await extractLease(files)
  const data = await extractionToDraft(extraction)
  const archived = await toArchivedFile(files)
  const updated = await prisma.draft.update({
    where: { id: draft.id },
    data: {
      data: data as Prisma.InputJsonValue,
      step: 'relecture',
      importFile: new Uint8Array(archived.file),
      importMime: archived.mime,
      importName: archived.name,
      expiresAt: expiry(),
    },
  })
  res.json({ success: true, data: publicDraft(updated) })
})

export default router
