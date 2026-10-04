import { prisma } from '../db.js'
import { env } from '../env.js'
import { layout, sendEmail } from '../lib/email.js'
import { autoReceiptStep, dueDateOf, periodsToCheck, receiptAutoOn, sendDateOf } from '../domain/autoReceipt.js'
import { monthYearFr } from '../domain/lease.js'
import { propertyName } from './contract.js'
import { patchLeaseData, recordPayment } from '../routes/leases.js'

type Facts = { receiptAuto?: boolean; receiptHold?: Record<string, string>; receiptWarned?: Record<string, string> }
const fr = (d: string) => d.split('-').reverse().join('/')

/**
 * Tâche quotidienne : pour chaque bail où la quittance automatique est active (par défaut), prévient le propriétaire
 * 3 jours avant l'envoi, puis, 7 jours après l'échéance, enregistre le loyer comme reçu et envoie la quittance —
 * sauf si le loyer est déjà enregistré ou si le propriétaire a annulé l'envoi.
 */
export async function runAutoReceipts(now = new Date(), only?: string[]): Promise<{ warned: number; sent: number }> {
  const today = now.toISOString().slice(0, 10)
  const leases = await prisma.lease.findMany({ where: { status: { in: ['ACTIVE', 'IMPORTED'] }, ...(only ? { id: { in: only } } : {}) }, include: { property: true, payments: { select: { period: true } }, user: true } })
  let warned = 0
  let sent = 0
  for (const l of leases) {
    const f = (l.data ?? {}) as Facts
    if (!receiptAutoOn(l.data)) continue
    const day = l.paymentDay
    const paid = new Set(l.payments.map((p) => p.period))
    for (const period of periodsToCheck(today)) {
      const step = autoReceiptStep({ period, paymentDay: day, today, startDate: l.startDate.toISOString().slice(0, 10), endDate: null, paid: paid.has(period), held: Boolean(f.receiptHold?.[period]), warned: Boolean(f.receiptWarned?.[period]) })
      if (!step) continue
      const [y, m] = period.split('-').map(Number)
      const month = monthYearFr(y, m)
      if (step === 'WARN') {
        const url = `${env.CLIENT_URL}/espace/baux/${l.id}#paiements`
        const mail = layout({
          title: `Quittance de ${month} : envoi automatique le ${fr(sendDateOf(period, day))}.`,
          paragraphs: [
            `Pour ${propertyName(l.property)}, la quittance de ${month} partira automatiquement à votre locataire le ${fr(sendDateOf(period, day))}, et le loyer sera noté comme reçu.`,
            'Le loyer est arrivé ? Vous n’avez rien à faire.',
            'Il n’est pas arrivé ? Dites-le avant cette date : la quittance ne partira pas (elle prouve que le loyer est payé) et Bailio vous propose une relance.',
          ],
          cta: { label: 'Le loyer n’est pas arrivé', url },
        })
        await sendEmail({ to: l.user.email, subject: `Quittance de ${month} : envoi automatique le ${fr(sendDateOf(period, day))}`, ...mail }).catch(() => undefined)
        await patchLeaseData(l.id, (x) => ({ receiptWarned: { ...((x as Facts).receiptWarned ?? {}), [period]: now.toISOString() } }))
        warned += 1
      } else {
        // Le loyer est noté reçu à l'échéance ; recordPayment fait la quittance et l'envoie (receiptAuto).
        await recordPayment(l.user, l, { period, receivedAt: dueDateOf(period, day) })
        sent += 1
      }
    }
  }
  return { warned, sent }
}
