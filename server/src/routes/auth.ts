import { Router, type Request } from 'express'
import { z } from 'zod'
import type { User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { hashToken, newToken } from '../lib/tokens.js'
import { layout, sendEmail } from '../lib/email.js'
import { allowEmailTo, limitPerVisitor } from '../lib/rateLimit.js'
import { createSession, deleteSession, optionalUser, requireUser, sessionToken } from '../services/session.js'
import { createLeaseFromDraft, draftToLeaseInput } from '../services/leases.js'
import { draftFromRequest } from './drafts.js'
import { acceptAccess, invitationEmailFor, ownerLabel } from './access.js'

const router = Router()
const limiter = limitPerVisitor(15, 20)
const LINK_MINUTES = 30

const emailSchema = z.object({ email: z.email('Email invalide').max(200).transform((e) => e.trim().toLowerCase()) })

export function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    emailVerified: Boolean(u.emailVerifiedAt),
    followUpActive: Boolean(u.followUpSince),
    notifyWeekly: u.notifyWeekly,
    notifyUrgent: u.notifyUrgent,
  }
}

async function sendMagicLink(email: string, draftId: string | null, isNew = false, accessId: string | null = null): Promise<void> {
  const token = newToken()
  await prisma.loginToken.create({
    data: { tokenHash: hashToken(token), email, draftId, accessId, expiresAt: new Date(Date.now() + LINK_MINUTES * 60_000) },
  })
  const url = `${env.CLIENT_URL}/connexion/lien?jeton=${encodeURIComponent(token)}`
  const mail = accessId
    ? layout({
        title: 'Accédez à l’espace partagé avec vous.',
        paragraphs: [`Cliquez sur le bouton : votre invitation est acceptée et l’espace s’ouvre. Pas de mot de passe à retenir. Ce lien est valable ${LINK_MINUTES} minutes.`, "Si vous n'avez rien demandé, ignorez cet email."],
        cta: { label: 'Ouvrir l’espace partagé', url },
      })
    : draftId
    ? layout({
        title: 'Confirmez votre adresse pour retrouver votre bail.',
        paragraphs: [
          isNew
            ? 'Cliquez sur le bouton : votre espace Bailio est créé et votre bail vous y attend. Pas de mot de passe à retenir.'
            : 'Vous avez déjà un espace Bailio avec cette adresse. Cliquez sur le bouton pour y ajouter votre nouveau bail.',
          `Ce lien est valable ${LINK_MINUTES} minutes. Si vous n'avez rien demandé, ignorez cet email.`,
        ],
        cta: { label: 'Retrouver mon bail', url },
      })
    : isNew
      ? layout({
          title: 'Bienvenue sur Bailio.',
          paragraphs: [`Cliquez sur le bouton pour ouvrir votre espace. Ce lien est valable ${LINK_MINUTES} minutes.`, 'Pas de mot de passe à retenir : pour revenir, demandez simplement un nouveau lien.', "Si vous n'avez rien demandé, ignorez cet email."],
          cta: { label: 'Ouvrir mon espace', url },
        })
      : layout({
        title: 'Votre lien de connexion.',
        paragraphs: [`Cliquez sur le bouton pour ouvrir votre espace Bailio. Ce lien est valable ${LINK_MINUTES} minutes.`, "Si vous n'avez rien demandé, ignorez cet email."],
        cta: { label: 'Ouvrir mon espace', url },
      })
  allowEmailTo(email)
  await sendEmail({ to: email, subject: draftId ? 'Récupérez votre bail sur Bailio' : 'Connexion à Bailio', ...mail })
}

async function draftIdIfAny(req: Request): Promise<string | null> {
  if (!req.header('x-draft-token')) return null
  return (await draftFromRequest(req)).id
}

/**
 * « Télécharger mon bail » : l'espace est créé avec l'email, sans mot de passe.
 * Si l'adresse a déjà un compte, on n'ouvre rien : un lien de confirmation est envoyé.
 */
router.post('/finish-draft', limiter, optionalUser, async (req, res) => {
  const draft = await draftFromRequest(req)
  draftToLeaseInput(draft) // refuse un bail incomplet avant de créer quoi que ce soit

  if (req.user) {
    const { lease } = await createLeaseFromDraft(req.user, draft.id)
    return res.json({ success: true, data: { status: 'created', leaseId: lease.id, user: publicUser(req.user) } })
  }

  // Adresse vérifiée avant de créer quoi que ce soit : le bail est rattaché au compte au clic sur le lien.
  const { email } = emailSchema.parse(req.body)
  const existing = await prisma.user.findUnique({ where: { email } })
  await sendMagicLink(email, draft.id, !existing)
  res.json({ success: true, data: { status: 'check_email', email } })
})

// Connexion par lien magique.
// Avec « signup », l'espace sera créé au premier clic sur le lien (l'adresse est ainsi vérifiée).
router.post('/magic-link', limiter, async (req, res) => {
  const { email, signup } = emailSchema.extend({ signup: z.boolean().optional() }).parse(req.body)
  const user = await prisma.user.findUnique({ where: { email } })
  if (user || signup) await sendMagicLink(email, null, !user)
  // Même réponse que le compte existe ou non (on ne révèle pas les adresses inscrites).
  res.json({ success: true, data: { sent: true } })
})

// Invitation à un espace partagé, pas encore connecté : le lien part à l'adresse invitée (et seulement à elle).
router.post('/invitation-link', limiter, async (req, res) => {
  const { token } = z.object({ token: z.string().min(10).max(200) }).parse(req.body)
  const { accessId, email } = await invitationEmailFor(token)
  const existing = await prisma.user.findUnique({ where: { email } })
  await sendMagicLink(email, null, !existing, accessId)
  res.json({ success: true, data: { sent: true, email } })
})

router.post('/magic-link/verify', limiter, async (req, res) => {
  const { token } = z.object({ token: z.string().min(10).max(200) }).parse(req.body)
  const row = await prisma.loginToken.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new HttpError(400, 'Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.')
  }
  await prisma.loginToken.update({ where: { id: row.id }, data: { usedAt: new Date() } })
  const user = await prisma.user.upsert({
    where: { email: row.email },
    update: { emailVerifiedAt: new Date() },
    // Rappels par email actifs dès l'inscription (désactivables dans « Mon compte »).
    create: { email: row.email, emailVerifiedAt: new Date(), followUpSince: new Date() },
  })
  const leaseId = row.draftId ? (await createLeaseFromDraft(user, row.draftId)).lease.id : null
  // Lien envoyé depuis une invitation : elle est acceptée, l'espace partagé s'ouvre.
  let space: { id: string; role: string; ownerName: string } | null = null
  if (row.accessId) {
    const a = await prisma.access.findUnique({ where: { id: row.accessId }, include: { owner: true } })
    if (a && !a.revokedAt && !a.acceptedAt && a.inviteExpiresAt && a.inviteExpiresAt > new Date() && a.email.toLowerCase() === row.email.toLowerCase()) {
      await acceptAccess(a.id, user.id)
      space = { id: a.id, role: a.role, ownerName: ownerLabel(a.owner) }
    }
  }
  const sessionTokenValue = await createSession(user.id, req)
  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  res.json({ success: true, data: { sessionToken: sessionTokenValue, user: publicUser(fresh), leaseId, space } })
})

router.get('/me', requireUser, (req, res) => {
  res.json({ success: true, data: publicUser(req.user!) })
})

router.post('/logout', async (req, res) => {
  const token = sessionToken(req)
  if (token) await deleteSession(token)
  res.json({ success: true, data: { loggedOut: true } })
})

export default router
