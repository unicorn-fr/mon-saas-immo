import { Router } from 'express'
import { randomInt } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../db.js'
import { requireUser } from '../services/session.js'
import { publicUser } from './auth.js'
import { HttpError } from '../lib/http.js'
import { layout, sendEmail } from '../lib/email.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { hashToken } from '../lib/tokens.js'
import { deviceLabel } from '../domain/device.js'

/** Compte : suivi par email, préférences, export et suppression des données (RGPD). */
const router = Router()
// Session exigée sur les adresses de ce routeur seulement : une adresse inconnue reçoit « Page introuvable ».
router.use(['/account'], requireUser)

router.post('/account/follow-up', async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: { followUpSince: req.user!.followUpSince ?? new Date() } })
  res.json({ success: true, data: publicUser(user) })
})

router.patch('/account', async (req, res) => {
  const body = z
    .object({
      firstName: z.string().trim().max(80).optional(),
      lastName: z.string().trim().max(80).optional(),
      followUp: z.boolean().optional(),
      notifyWeekly: z.boolean().optional(),
      notifyUrgent: z.boolean().optional(),
    })
    .parse(req.body)
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      notifyWeekly: body.notifyWeekly,
      notifyUrgent: body.notifyUrgent,
      followUpSince: body.followUp === undefined ? undefined : body.followUp ? (req.user!.followUpSince ?? new Date()) : null,
    },
  })
  res.json({ success: true, data: publicUser(user) })
})

// ── Actions sensibles : confirmées par un code envoyé par email ──────────────

const CODE_MINUTES = 10
const purposeSchema = z.enum(['EXPORT', 'DELETE'])
const PURPOSE_LABEL = { EXPORT: 'télécharger toutes vos données', DELETE: 'supprimer définitivement votre compte' } as const

router.post('/account/confirm-code', limitPerVisitor(10, 5), async (req, res) => {
  const user = req.user!
  const { purpose } = z.object({ purpose: purposeSchema }).parse(req.body)
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await prisma.actionCode.deleteMany({ where: { userId: user.id, purpose } })
  await prisma.actionCode.create({ data: { userId: user.id, purpose, codeHash: hashToken(`${user.id}:${purpose}:${code}`), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000) } })
  const mail = layout({
    title: `Votre code de confirmation : ${code}`,
    paragraphs: [
      `Quelqu’un (sans doute vous) a demandé à ${PURPOSE_LABEL[purpose]} sur Bailio.`,
      `Saisissez ce code pour confirmer : ${code}. Il est valable ${CODE_MINUTES} minutes.`,
      'Si vous n’êtes pas à l’origine de cette demande, ne communiquez ce code à personne et déconnectez les autres appareils depuis « Mon compte ».',
    ],
  })
  await sendEmail({ to: user.email, subject: `Code de confirmation : ${code}`, ...mail })
  res.json({ success: true, data: { sentTo: user.email, minutes: CODE_MINUTES } })
})

/** Vérifie le code (5 essais), puis le consomme : il ne sert qu'une fois. */
async function useCode(userId: string, purpose: z.infer<typeof purposeSchema>, code: unknown) {
  const parsed = z.string().trim().regex(/^\d{6}$/, 'Le code compte 6 chiffres.').safeParse(code)
  if (!parsed.success) throw new HttpError(400, 'Saisissez le code à 6 chiffres reçu par email.')
  const row = await prisma.actionCode.findFirst({ where: { userId, purpose }, orderBy: { createdAt: 'desc' } })
  if (!row || row.expiresAt < new Date()) throw new HttpError(400, 'Ce code a expiré. Demandez-en un nouveau.')
  if (row.attempts >= 5) throw new HttpError(429, 'Trop d’essais. Demandez un nouveau code.')
  if (row.codeHash !== hashToken(`${userId}:${purpose}:${parsed.data}`)) {
    await prisma.actionCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } })
    throw new HttpError(400, 'Code incorrect.')
  }
  await prisma.actionCode.delete({ where: { id: row.id } })
}

// Export de toutes les données du compte (RGPD, art. 20). Les fichiers sont listés, pas inclus.
router.post('/account/export', async (req, res) => {
  const userId = req.user!.id
  await useCode(userId, 'EXPORT', (req.body as { code?: unknown } | undefined)?.code)
  const [user, properties, tenants, leases, payments, expenses, inventories, reminders, documents, files, candidates, contacts, interventions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.property.findMany({ where: { userId } }),
    prisma.tenant.findMany({ where: { userId } }),
    prisma.lease.findMany({ where: { userId } }),
    prisma.payment.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.inventory.findMany({ where: { userId } }),
    prisma.reminder.findMany({ where: { userId } }),
    prisma.document.findMany({ where: { userId }, select: { id: true, kind: true, title: true, version: true, period: true, sha256: true, createdAt: true } }),
    prisma.fileBlob.findMany({ where: { userId }, select: { id: true, name: true, mimeType: true, sizeBytes: true, createdAt: true } }),
    prisma.candidate.findMany({ where: { userId } }),
    prisma.contact.findMany({ where: { userId } }),
    prisma.intervention.findMany({ where: { userId } }),
  ])
  res.setHeader('Content-Disposition', 'attachment; filename="bailio-export.json"')
  res.json({ exportedAt: new Date().toISOString(), user: { ...publicUser(user), profile: user.profile }, properties, tenants, leases, payments, expenses, inventories, reminders, documents, files, candidates, contacts, interventions })
})

// Suppression définitive du compte et de toutes ses données (RGPD, art. 17).
router.delete('/account', async (req, res) => {
  const user = req.user!
  await useCode(user.id, 'DELETE', (req.body as { code?: unknown } | undefined)?.code)
  await prisma.user.delete({ where: { id: user.id } })
  const mail = layout({ title: 'Votre compte Bailio est supprimé.', paragraphs: ['Votre compte et toutes ses données (logements, baux, documents) ont été supprimés définitivement.', 'Merci d’avoir utilisé Bailio.'] })
  sendEmail({ to: user.email, subject: 'Compte Bailio supprimé', ...mail }).catch(() => undefined)
  res.json({ success: true, data: { deleted: true } })
})

// ── Appareils connectés ──────────────────────────────────────────────────────

router.get('/account/sessions', async (req, res) => {
  const rows = await prisma.session.findMany({ where: { userId: req.user!.id, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: 'desc' } })
  res.json({
    success: true,
    data: rows.map((s) => ({ id: s.id, device: deviceLabel(s.userAgent), ip: s.ip, createdAt: s.createdAt.toISOString(), lastSeenAt: (s.lastSeenAt ?? s.createdAt).toISOString(), current: s.id === req.sessionId })),
  })
})

router.delete('/account/sessions/:id', async (req, res) => {
  await prisma.session.deleteMany({ where: { id: String(req.params.id), userId: req.user!.id } })
  res.json({ success: true, data: { revoked: true } })
})

// « Déconnecter tous les autres appareils »
router.post('/account/sessions/revoke-others', async (req, res) => {
  const r = await prisma.session.deleteMany({ where: { userId: req.user!.id, NOT: { id: req.sessionId ?? '' } } })
  res.json({ success: true, data: { revoked: r.count } })
})

export default router
