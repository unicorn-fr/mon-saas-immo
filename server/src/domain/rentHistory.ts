/**
 * Historique des loyers d'un bail : chaque montant avec sa date d'effet (signature, révision, avenant).
 * Le loyer d'un mois est celui en vigueur à sa date d'échéance : une révision qui prend effet le 15 octobre
 * s'applique au loyer de novembre si le loyer est payable le 5. Quittances, statut des loyers, régularisation
 * des charges et aide fiscale utilisent le montant du mois concerné, jamais le montant du jour.
 */

export interface RentStep {
  from: string
  rentCents: number
  chargesCents: number
  reason: 'START' | 'REVISION' | 'AMENDMENT'
}

interface LeaseLike {
  data: unknown
  startDate: Date
  rentCents: number
  chargesCents: number
  paymentDay: number
}

export function historyOf(lease: LeaseLike): RentStep[] {
  const saved = (lease.data as { rentHistory?: RentStep[] } | null)?.rentHistory
  if (Array.isArray(saved) && saved.length) return [...saved].sort((a, b) => a.from.localeCompare(b.from))
  return [{ from: lease.startDate.toISOString().slice(0, 10), rentCents: lease.rentCents, chargesCents: lease.chargesCents, reason: 'START' }]
}

/** Montants en vigueur à une date (AAAA-MM-JJ). Avant le premier montant connu : le premier. */
export function amountsAt(history: RentStep[], date: string): { rentCents: number; chargesCents: number } {
  const current = [...history].filter((s) => s.from <= date).pop() ?? history[0]
  return { rentCents: current.rentCents, chargesCents: current.chargesCents }
}

/**
 * Périodicité du paiement : chaque mois (habitation, garage), par trimestre ou par an (bail commercial, terms.paymentFrequency).
 * Les montants du bail restent mensuels ; une échéance réunit `termMonths` mois, à compter du mois d'entrée
 * (trimestre : mois d'entrée, puis tous les 3 mois). Les paiements sont enregistrés sur le premier mois de l'échéance.
 */
export const PAYMENT_FREQUENCIES = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as const
export type PaymentFrequency = keyof typeof PAYMENT_FREQUENCIES

export function termMonthsOf(lease: Pick<LeaseLike, 'data'>): number {
  const f = (lease.data as { terms?: { paymentFrequency?: string } } | null)?.terms?.paymentFrequency
  return f && f in PAYMENT_FREQUENCIES ? PAYMENT_FREQUENCIES[f as PaymentFrequency] : 1
}

const monthIndex = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1

/** Ce mois (AAAA-MM) ouvre-t-il une échéance ? Toujours vrai pour un paiement mensuel. */
export function isTermStart(lease: Pick<LeaseLike, 'data' | 'startDate'>, period: string): boolean {
  const n = termMonthsOf(lease)
  if (n === 1) return true
  const diff = monthIndex(period) - monthIndex(lease.startDate.toISOString().slice(0, 7))
  return diff >= 0 && diff % n === 0
}

/** Bail commercial soumis à la TVA (option ou local équipé) : 20 % sur le loyer et les charges (F31925). */
export const VAT_RATE = 0.2
export const vatOn = (lease: Pick<LeaseLike, 'data'>) => Boolean((lease.data as { terms?: { kind?: string; commercial?: { vat?: boolean } } } | null)?.terms?.kind === 'COMMERCIAL' && (lease.data as { terms?: { commercial?: { vat?: boolean } } }).terms?.commercial?.vat)

/** Premier mois (AAAA-MM) de l'échéance qui contient ce mois. Paiement mensuel : le mois lui-même. */
export function termStartOf(lease: Pick<LeaseLike, 'data' | 'startDate'>, period: string): string {
  const n = termMonthsOf(lease)
  if (n === 1) return period
  const start = monthIndex(lease.startDate.toISOString().slice(0, 7))
  const i = monthIndex(period)
  const k = i < start ? i : start + Math.floor((i - start) / n) * n
  return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}`
}

/**
 * Montant dû pour l'échéance qui s'ouvre ce mois : loyer et charges du mois (hors taxes) × nombre de mois de l'échéance,
 * et la TVA s'il y a lieu. Le total dû est rentCents + chargesCents + vatCents.
 */
export function termAmounts(lease: LeaseLike, period: string): { rentCents: number; chargesCents: number; vatCents: number } {
  const n = termMonthsOf(lease)
  const a = amountsForPeriod(lease, period)
  const rentCents = a.rentCents * n
  const chargesCents = a.chargesCents * n
  return { rentCents, chargesCents, vatCents: vatOn(lease) ? Math.round((rentCents + chargesCents) * VAT_RATE) : 0 }
}

export const termDueCents = (lease: LeaseLike, period: string) => {
  const a = termAmounts(lease, period)
  return a.rentCents + a.chargesCents + a.vatCents
}

/**
 * Part du loyer et des charges (hors taxes) dans un paiement : la TVA éventuelle est retirée d'abord, puis le loyer de
 * l'échéance est servi en premier (comme splitPayment de domain/tax.ts). Sert à l'aide à la déclaration et à l'export.
 */
export function splitTermPayment(lease: LeaseLike, period: string, amountCents: number): { rentCents: number; chargesCents: number } {
  const exVat = vatOn(lease) ? Math.round(amountCents / (1 + VAT_RATE)) : amountCents
  const rent = Math.min(exVat, termAmounts(lease, period).rentCents)
  return { rentCents: rent, chargesCents: Math.max(0, exVat - rent) }
}

/** Montants dus pour un mois (AAAA-MM), à sa date d'échéance. */
export function amountsForPeriod(lease: LeaseLike, period: string): { rentCents: number; chargesCents: number } {
  return amountsAt(historyOf(lease), `${period}-${String(Math.min(28, Math.max(1, lease.paymentDay))).padStart(2, '0')}`)
}

/** Nouvel historique après une révision ou un avenant : le montant prend effet à cette date (remplace un montant à la même date). */
export function withStep(history: RentStep[], step: RentStep): RentStep[] {
  return [...history.filter((s) => s.from !== step.from), step].sort((a, b) => a.from.localeCompare(b.from))
}

/**
 * Loyers attendus et non (entièrement) reçus sur les 12 derniers mois et le mois en cours, échéance passée :
 * le montant de chaque mois est celui en vigueur à son échéance.
 */
export function unpaidPeriods(lease: LeaseLike, payments: Array<{ period: string; amountCents: number }>, now = new Date()): Array<{ period: string; missing: number }> {
  const out: Array<{ period: string; missing: number }> = []
  for (let i = 12; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, lease.paymentDay))
    if (d < lease.startDate || d > now) continue
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (!isTermStart(lease, period)) continue
    const paid = payments.find((p) => p.period === period)?.amountCents ?? 0
    const due = termDueCents(lease, period)
    if (paid < due) out.push({ period, missing: due - paid })
  }
  return out
}

export type MonthState = 'PAID' | 'PARTIAL' | 'LATE' | 'UPCOMING' | 'FIRST'

/**
 * Loyers de l'entrée (12 mois au plus) au mois prochain, du plus récent au plus ancien : montant attendu, reçu et état.
 * Les retards sont ceux de `unpaidPeriods` ; le premier mois au prorata (échéance avant l'entrée) n'est jamais en retard.
 */
export function rentSchedule(
  lease: LeaseLike & { endDate: Date },
  payments: Array<{ period: string; amountCents: number; receivedAt?: Date }>,
  now = new Date(),
): Array<{ period: string; dueCents: number; paidCents: number; receivedAt: Date | null; state: MonthState }> {
  const late = new Set(unpaidPeriods(lease, payments, now).map((u) => u.period))
  const out: Array<{ period: string; dueCents: number; paidCents: number; receivedAt: Date | null; state: MonthState }> = []
  for (let i = -1; i <= 11; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, lease.paymentDay))
    const startMonth = Date.UTC(lease.startDate.getUTCFullYear(), lease.startDate.getUTCMonth(), 1)
    if (d.getTime() < startMonth || d > lease.endDate) continue
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (!isTermStart(lease, period)) continue
    const dueCents = termDueCents(lease, period)
    const pay = payments.find((p) => p.period === period)
    const paidCents = pay?.amountCents ?? 0
    const state: MonthState = paidCents >= dueCents ? 'PAID' : late.has(period) ? (paidCents > 0 ? 'PARTIAL' : 'LATE') : d > now ? 'UPCOMING' : d < lease.startDate ? 'FIRST' : 'UPCOMING'
    out.push({ period, dueCents, paidCents, receivedAt: pay?.receivedAt ?? null, state })
  }
  return out
}
