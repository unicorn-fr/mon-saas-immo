import { prisma } from '../db.js'
import { amountsAt, amountsForPeriod, historyOf } from '../domain/rentHistory.js'
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
  CHARGES_REGULARIZATION: 'Régularisation annuelle des charges',
}

/**
 * Chaque jour à 8 h : prolonge les échéances des baux, puis prévient les propriétaires qui ont activé le suivi.
 * - Alertes urgentes (si activées) : échéance dans les 3 jours, ou loyer en retard depuis 3 jours.
 * - Récapitulatif du lundi (si activé) : tout ce qui arrive dans la semaine.
 */
export async function runDailyReminders(now = new Date()): Promise<void> {
  const leases = await prisma.lease.findMany({ where: { status: { in: ['ACTIVE', 'IMPORTED'] } } })
  for (const l of leases) await ensureReminders(l)
  // Révision qui prend effet aujourd'hui : le loyer en vigueur du bail suit son historique.
  const today = now.toISOString().slice(0, 10)
  for (const l of leases) {
    const current = amountsAt(historyOf(l), today)
    if (current.rentCents !== l.rentCents || current.chargesCents !== l.chargesCents) await prisma.lease.update({ where: { id: l.id }, data: current })
  }

  const users = await prisma.user.findMany({ where: { followUpSince: { not: null }, OR: [{ notifyUrgent: true }, { notifyWeekly: true }] } })
  const monday = now.getUTCDay() === 1
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  for (const user of users) {
    try {
      const reminders = await prisma.reminder.findMany({
        where: { userId: user.id, status: 'TODO', dueDate: { lte: new Date(now.getTime() + 7 * 86_400_000) }, OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }], lease: { status: { in: ['ACTIVE', 'IMPORTED'] } } },
        include: { lease: { include: { property: true } } },
        orderBy: { dueDate: 'asc' },
      })
      const running = await prisma.lease.findMany({ where: { userId: user.id, status: { in: ['ACTIVE', 'IMPORTED'] }, startDate: { lte: now } }, include: { property: true, payments: { where: { period } } } })
      const late = running.filter((l) => {
        const paid = l.payments.reduce((a, p) => a + p.amountCents, 0)
        const days = Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), l.paymentDay)) / 86_400_000)
        const due = amountsForPeriod(l, period)
        return paid < due.rentCents + due.chargesCents && days > 0 ? days : false
      })
      const line = (r: (typeof reminders)[number]) => `${formatDateFr(r.dueDate)} · ${LABELS[r.type] ?? 'Échéance'} · ${r.lease.property.label || r.lease.property.address}`
      const lateLine = (l: (typeof running)[number]) => `Loyer de ${l.property.label || l.property.address} pas encore reçu (attendu le ${l.paymentDay === 1 ? '1er' : l.paymentDay})`

      if (user.notifyUrgent) {
        const urgent = reminders.filter((r) => !r.emailedAt && r.dueDate.getTime() <= now.getTime() + 3 * 86_400_000)
        // Loyer en retard : une seule alerte, trois jours après la date de paiement.
        const lateToday = late.filter((l) => Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), l.paymentDay)) / 86_400_000) === 3)
        if (urgent.length || lateToday.length) {
          const mail = layout({ title: 'À faire rapidement.', paragraphs: [...lateToday.map(lateLine), ...urgent.map(line)], cta: { label: 'Voir ma liste', url: `${env.CLIENT_URL}/espace` } })
          await sendEmail({ to: user.email, subject: 'Bailio · à faire rapidement', ...mail })
          await prisma.reminder.updateMany({ where: { id: { in: urgent.map((r) => r.id) } }, data: { emailedAt: now } })
        }
      }
      if (user.notifyWeekly && monday && (reminders.length || late.length)) {
        const mail = layout({ title: 'Votre semaine.', paragraphs: [...late.map(lateLine), ...reminders.map(line)], cta: { label: 'Voir ma liste', url: `${env.CLIENT_URL}/espace` } })
        await sendEmail({ to: user.email, subject: 'Bailio · votre semaine', ...mail })
        await prisma.reminder.updateMany({ where: { id: { in: reminders.map((r) => r.id) } }, data: { emailedAt: now } })
      }
    } catch (err) {
      console.error('[rappels]', user.id, err)
    }
  }

  await prisma.draft.deleteMany({ where: { expiresAt: { lt: new Date() }, leaseId: null } })
  await prisma.loginToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } } })
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
}
