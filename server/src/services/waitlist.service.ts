import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { sendEmail } from '../utils/email.util.js'
import {
  buildWaitlistConfirmationEmail,
  buildWaitlistLaunchEmail,
} from '../utils/waitlistEmails.js'

const LAUNCH_DATE = new Date(env.LAUNCH_DATE)
const BATCH_SIZE = 50

export const waitlistService = {
  /**
   * Register a new email on the waitlist.
   * - Calculates position (count + 1)
   * - Sets isEarlyAccess = position <= 150
   * - Sends confirmation email (non-blocking)
   */
  async join(email: string): Promise<{
    position: number
    isEarlyAccess: boolean
    alreadyRegistered: boolean
  }> {
    const existing = await prisma.waitlistEntry.findUnique({ where: { email } })
    if (existing) {
      return { position: existing.position, isEarlyAccess: existing.isEarlyAccess, alreadyRegistered: true }
    }

    const count = await prisma.waitlistEntry.count()
    const position = count + 1
    const isEarlyAccess = position <= 150

    const entry = await prisma.waitlistEntry.create({
      data: { email, position, isEarlyAccess },
    })

    // Non-blocking confirmation email
    const { subject, html } = buildWaitlistConfirmationEmail(email, position, isEarlyAccess, LAUNCH_DATE)
    sendEmail({ to: email, subject, html }).catch((err) => {
      console.error('[waitlist] confirmation email failed:', err)
    })

    return { position: entry.position, isEarlyAccess, alreadyRegistered: false }
  },

  /**
   * Return total number of waitlist entries.
   */
  async getCount(): Promise<number> {
    return prisma.waitlistEntry.count()
  },

  /**
   * Send launch emails to all entries where notifiedAt IS NULL.
   * Processes in batches of BATCH_SIZE to avoid SMTP flooding.
   * Marks each entry with notifiedAt after successful send.
   */
  async notifyAll(): Promise<{ sent: number; errors: number }> {
    const pending = await prisma.waitlistEntry.findMany({
      where: { notifiedAt: null },
      orderBy: { position: 'asc' },
    })

    let sent = 0
    let errors = 0

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (entry) => {
          const { subject, html } = buildWaitlistLaunchEmail(
            entry.email,
            entry.isEarlyAccess,
            env.FRONTEND_URL,
          )
          const ok = await sendEmail({ to: entry.email, subject, html })

          if (ok) {
            await prisma.waitlistEntry.update({
              where: { id: entry.id },
              data: { notifiedAt: new Date() },
            })
            sent++
          } else {
            errors++
          }
        }),
      )

      // Small pause between batches to be kind to the SMTP server
      if (i + BATCH_SIZE < pending.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return { sent, errors }
  },
}
