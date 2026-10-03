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

/** Montants dus pour un mois (AAAA-MM), à sa date d'échéance. */
export function amountsForPeriod(lease: LeaseLike, period: string): { rentCents: number; chargesCents: number } {
  return amountsAt(historyOf(lease), `${period}-${String(Math.min(28, Math.max(1, lease.paymentDay))).padStart(2, '0')}`)
}

/** Nouvel historique après une révision ou un avenant : le montant prend effet à cette date (remplace un montant à la même date). */
export function withStep(history: RentStep[], step: RentStep): RentStep[] {
  return [...history.filter((s) => s.from !== step.from), step].sort((a, b) => a.from.localeCompare(b.from))
}
