import { prisma } from '../db.js'
import { env } from '../env.js'
import { layout, sendEmail } from '../lib/email.js'
import { DUNNING_LABELS, dunningSettings, dunningStep, type DunningStep } from '../domain/dunning.js'
import { monthYearFr } from '../domain/lease.js'
import type { LetterInput } from '../domain/letters.js'
import { unpaidPeriods } from '../domain/rentHistory.js'
import { propertyName } from './contract.js'
import { emailLetter, letterPdf, patchLeaseData, rememberLetter } from '../routes/leases.js'
import { saveGeneratedDocument } from '../routes/helpers.js'

type Facts = { dunningSent?: Record<string, Partial<Record<DunningStep, string>>>; dunningFailed?: Record<string, Partial<Record<DunningStep, string>>> }
const iso = (d: Date) => d.toISOString().slice(0, 10)
const fr = (d: string) => d.split('-').reverse().join('/')
const label = (period: string) => {
  const [y, m] = period.split('-').map(Number)
  return monthYearFr(y, m)
}
const dueOf = (period: string, day: number) => iso(new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5)) - 1, day)))

/**
 * Tâche quotidienne : pour chaque bail où le propriétaire a activé les relances automatiques, envoie au locataire la
 * relance amiable, le second rappel puis la mise en demeure (jours réglés sur la page du bail), avec les lettres de
 * Bailio, rangées dans les documents du bail. Le propriétaire reçoit une copie de chaque envoi ; pour la mise en demeure,
 * il est invité à l'envoyer aussi en recommandé. Si une lettre ne peut pas partir (email du locataire, signature…),
 * il est prévenu une fois.
 */
export async function runDunning(now = new Date(), only?: string[]): Promise<{ sent: number; failed: number }> {
  const today = iso(now)
  const leases = await prisma.lease.findMany({ where: { status: { in: ['ACTIVE', 'IMPORTED'] }, ...(only ? { id: { in: only } } : {}) }, include: { property: true, payments: { select: { period: true, amountCents: true } }, user: true } })
  let sent = 0
  let failed = 0
  for (const l of leases) {
    const settings = dunningSettings(l.data)
    if (!settings.enabled) continue
    const unpaid = unpaidPeriods(l, l.payments, now)
    if (!unpaid.length) continue
    // La suite suit le mois impayé le plus récent ; chaque lettre reprend toute la dette.
    const last = unpaid[unpaid.length - 1].period
    const f = (l.data ?? {}) as Facts
    const done = f.dunningSent?.[last] ?? {}
    const step = dunningStep({ today, dueDate: dueOf(last, l.paymentDay), days: settings.days, sent: done })
    if (!step || f.dunningFailed?.[last]?.[step]) continue
    const amountCents = unpaid.reduce((a, x) => a + x.missing, 0)
    const periods = unpaid.map((x) => label(x.period))
    const letter = (
      step === 3
        ? { type: 'FORMAL_NOTICE', amountCents, periods, delayDays: 8, guarantorInformed: true }
        : { type: 'REMINDER', amountCents, periods, dueDate: dueOf(unpaid[0].period, l.paymentDay), second: step === 2 }
    ) as LetterInput
    const title = DUNNING_LABELS[step]
    const url = `${env.CLIENT_URL}/espace/baux/${l.id}#paiements`
    try {
      const { pdf, input } = await letterPdf(l.user, l, letter)
      const to = await emailLetter(l.user, l.id, pdf, title, letter)
      await saveGeneratedDocument({ userId: l.user.id, kind: 'LETTER', title, pdf, snapshot: { letter: input, input: letter }, leaseId: l.id, propertyId: l.propertyId, meta: { type: letter.type, auto: true } })
      await rememberLetter(l, letter)
      await patchLeaseData(l.id, (x) => {
        const all = (x as Facts).dunningSent ?? {}
        return { dunningSent: { ...all, [last]: { ...(all[last] ?? {}), [step]: today } } }
      })
      const mail = layout({
        title: `${title} envoyée à votre locataire.`,
        paragraphs: [
          `Pour ${propertyName(l.property)}, ${periods.join(', ')} : ${(amountCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} restent à payer. La lettre « ${title} » est partie aujourd’hui par email à ${to.join(', ')}. Vous la trouvez dans les documents du bail.`,
          step === 3
            ? 'Un email ne suffit pas pour une mise en demeure : envoyez-la aussi par lettre recommandée avec avis de réception. Elle est prête à imprimer dans les documents du bail.'
            : 'Le loyer arrive ? Notez-le reçu : les relances s’arrêtent toutes seules.',
        ],
        cta: { label: 'Voir le bail', url },
      })
      await sendEmail({ to: l.user.email, subject: `${title} envoyée : ${propertyName(l.property)}`, ...mail }).catch(() => undefined)
      sent += 1
    } catch (err) {
      // Prévenu une seule fois par étape : la relance attend que l'information manquante soit complétée.
      await patchLeaseData(l.id, (x) => {
        const all = (x as Facts).dunningFailed ?? {}
        return { dunningFailed: { ...all, [last]: { ...(all[last] ?? {}), [step]: today } } }
      })
      const why = err instanceof Error ? err.message : 'Erreur inconnue.'
      const mail = layout({
        title: `${title} : la lettre n’a pas pu partir.`,
        paragraphs: [`Pour ${propertyName(l.property)}, la lettre « ${title} » prévue le ${fr(today)} n’a pas été envoyée.`, why, 'Complétez ce qui manque, puis envoyez-la depuis la page du bail, onglet Courriers.'],
        cta: { label: 'Ouvrir le bail', url },
      })
      await sendEmail({ to: l.user.email, subject: `${title} non envoyée : ${propertyName(l.property)}`, ...mail }).catch(() => undefined)
      console.error('[relances]', l.id, why)
      failed += 1
    }
  }
  return { sent, failed }
}
