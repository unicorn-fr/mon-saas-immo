import { prisma } from '../config/database.js'
import { sendEmail } from '../utils/email.util.js'
import { env } from '../config/env.js'
import {
  onboardingOwnerJ1Template,
  onboardingTenantJ1Template,
  onboardingReminderJ7Template,
} from '../utils/emailTemplates.js'

/**
 * Envoie les emails d'onboarding :
 * - J+1 : email de bienvenue personnalisé selon le rôle (OWNER ou TENANT)
 * - J+7 : rappel si le compte est resté inactif (aucun bien publié pour un OWNER, aucun dossier pour un TENANT)
 * Exécuté toutes les heures via node-cron (server.ts).
 */
export async function sendOnboardingEmails(): Promise<void> {
  const now = new Date()
  const loginUrl = `${env.FRONTEND_URL}/login`

  // ─── J+1 : fenêtre glissante 23h–25h ───────────────────────────────────────
  const j1Min = new Date(now.getTime() - 25 * 60 * 60 * 1000)
  const j1Max = new Date(now.getTime() - 23 * 60 * 60 * 1000)

  const j1Users = await prisma.user.findMany({
    where: {
      emailVerified: true,
      createdAt: { gte: j1Min, lte: j1Max },
      role: { in: ['OWNER', 'TENANT'] },
    },
    select: { id: true, email: true, firstName: true, role: true },
  })

  let j1Sent = 0

  await Promise.all(
    j1Users.map(async (user) => {
      const firstName = user.firstName || 'vous'
      const template =
        user.role === 'OWNER'
          ? onboardingOwnerJ1Template({ firstName, loginUrl })
          : onboardingTenantJ1Template({ firstName, loginUrl })

      const sent = await sendEmail({ to: user.email, ...template })
      if (sent) j1Sent++
    })
  )

  console.log(`[onboardingEmails] J+1 : ${j1Users.length} utilisateurs ciblés, ${j1Sent} emails envoyés`)

  // ─── J+7 : fenêtre glissante 6j23h–7j01h ──────────────────────────────────
  const j7Min = new Date(now.getTime() - (7 * 24 + 1) * 60 * 60 * 1000)
  const j7Max = new Date(now.getTime() - (6 * 24 + 23) * 60 * 60 * 1000)

  const j7Users = await prisma.user.findMany({
    where: {
      emailVerified: true,
      createdAt: { gte: j7Min, lte: j7Max },
      role: { in: ['OWNER', 'TENANT'] },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      role: true,
      ownedProperties: { where: { status: 'AVAILABLE' }, select: { id: true } },
      tenantDocuments: { select: { id: true }, take: 1 },
    },
  })

  let j7Sent = 0

  await Promise.all(
    j7Users.map(async (user) => {
      const isInactive =
        user.role === 'OWNER'
          ? user.ownedProperties.length === 0
          : user.tenantDocuments.length === 0

      if (!isInactive) return

      const firstName = user.firstName || 'vous'
      const sent = await sendEmail({
        to: user.email,
        ...onboardingReminderJ7Template({ firstName, loginUrl, role: user.role as 'OWNER' | 'TENANT' }),
      })
      if (sent) j7Sent++
    })
  )

  console.log(`[onboardingEmails] J+7 : ${j7Users.length} utilisateurs ciblés, ${j7Sent} emails envoyés`)
}
