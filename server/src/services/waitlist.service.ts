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

  /**
   * Admin — Statistics
   */
  async getStats() {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [total, earlyAccessTaken, notifiedCount, thisWeek, lastWeek] = await Promise.all([
      prisma.waitlistEntry.count(),
      prisma.waitlistEntry.count({ where: { isEarlyAccess: true } }),
      prisma.waitlistEntry.count({ where: { notifiedAt: { not: null } } }),
      prisma.waitlistEntry.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.waitlistEntry.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    ])

    const signupsByDay = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE("createdAt") AS day, COUNT(*)::int AS count
      FROM waitlist_entries
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY day
      ORDER BY day ASC
    `

    return {
      total,
      earlyAccessTaken,
      earlyAccessRemaining: Math.max(0, 150 - earlyAccessTaken),
      notifiedCount,
      thisWeek,
      lastWeek,
      growthRate:
        lastWeek > 0
          ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
          : thisWeek > 0
            ? 100
            : 0,
      signupsByDay: signupsByDay.map((r) => ({ day: String(r.day), count: Number(r.count) })),
    }
  },

  /**
   * Admin — Paginated list with masked emails
   */
  async getPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit
    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({ skip, take: limit, orderBy: { position: 'asc' } }),
      prisma.waitlistEntry.count(),
    ])

    return {
      entries: entries.map((e) => ({
        id: e.id,
        email: maskEmail(e.email),
        position: e.position,
        isEarlyAccess: e.isEarlyAccess,
        notifiedAt: e.notifiedAt,
        createdAt: e.createdAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    }
  },

  /**
   * Admin — Export all entries as CSV data (unmasked)
   */
  async exportAll() {
    return prisma.waitlistEntry.findMany({
      orderBy: { position: 'asc' },
      select: { email: true, position: true, isEarlyAccess: true, notifiedAt: true, createdAt: true },
    })
  },

  /**
   * Admin — Delete entry by id
   */
  async deleteById(id: string) {
    await prisma.waitlistEntry.delete({ where: { id } })
  },
}

function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email
  return `${email[0]}***${email.slice(at)}`
}
