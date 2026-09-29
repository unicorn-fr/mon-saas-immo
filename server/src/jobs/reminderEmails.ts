import { prisma } from '../db.js'
import { env } from '../env.js'
import { formatDateFr } from '../domain/lease.js'
import { layout, sendEmail } from '../lib/email.js'
import { ensureReminders } from '../services/reminders.js'

const LABELS: Record<string, string> = {
  RENT_RECEIPT: 'Loyer attendu : la quittance est prête',
  INSURANCE: "Attestation d'assurance du locataire à demander",
  RENT_REVISION: 'Révision annuelle du loyer',
  LEASE_END: 'Fin du bail : date limite pour donner congé',
  INVENTORY_ENTRY: "État des lieux d'entrée",
}

/**
 * Chaque jour : prolonge les échéances des baux, puis envoie un récapitulatif aux
 * propriétaires qui ont activé le suivi (un email par personne, rappels à 7 jours).
 */
export async function runDailyReminders(): Promise<void> {
  const leases = await prisma.lease.findMany({ where: { status: { in: ['ACTIVE', 'IMPORTED'] } } })
  for (const l of leases) await ensureReminders(l)

  const soon = new Date(Date.now() + 7 * 86_400_000)
  const due = await prisma.reminder.findMany({
    where: { status: 'TODO', emailedAt: null, dueDate: { lte: soon }, user: { followUpSince: { not: null } } },
    include: { user: true, lease: { include: { property: true } } },
    orderBy: { dueDate: 'asc' },
  })
  const byUser = new Map<string, typeof due>()
  for (const r of due) byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r])

  for (const [, items] of byUser) {
    const user = items[0].user
    const mail = layout({
      title: items.length === 1 ? 'Une chose à faire cette semaine.' : `${items.length} choses à faire cette semaine.`,
      paragraphs: items.map((r) => `${formatDateFr(r.dueDate)} · ${LABELS[r.type]} · ${r.lease.property.address}`),
      cta: { label: 'Voir ma liste', url: `${env.CLIENT_URL}/espace` },
    })
    try {
      await sendEmail({ to: user.email, subject: 'Bailio · à faire cette semaine', ...mail })
      await prisma.reminder.updateMany({ where: { id: { in: items.map((i) => i.id) } }, data: { emailedAt: new Date() } })
    } catch (err) {
      console.error('[rappels]', user.id, err)
    }
  }

  await prisma.draft.deleteMany({ where: { expiresAt: { lt: new Date() }, leaseId: null } })
  await prisma.loginToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } } })
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
}
