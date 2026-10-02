/**
 * Bilan annuel et prévisionnel d'un logement, à partir de ce que Bailio connaît déjà :
 * loyers encaissés (séparés en loyer et charges), dépenses par catégorie, baux et prix d'achat.
 */

export interface ReportInput {
  id: string
  name: string
  year: number
  /** Prix d'achat (fiche du logement), pour le rendement brut. */
  purchasePriceCents?: number | null
  payments: { period: string; rentCents: number; chargesCents: number }[]
  expenses: { category: string; amountCents: number; recoverableCents: number }[]
  /** Baux du logement (montants actuels). */
  leases: { status: string; start: string; end: string; rentCents: number; chargesCents: number }[]
  /** Loyers attendus et non reçus, à ce jour. */
  unpaidCents: number
}

export interface PropertyReport {
  id: string
  name: string
  rentCents: number
  chargesCents: number
  expensesCents: number
  /** Dépenses à la charge du propriétaire, par catégorie (part récupérable retirée). */
  byCategory: Record<string, number>
  netCents: number
  /** Mois de l'année couverts par un bail. */
  occupiedMonths: number
  unpaidCents: number
  /** Loyers annuels hors charges ÷ prix d'achat, en pourcentage (une décimale). */
  grossYield: number | null
  forecast: { year: number; rentCents: number; chargesCents: number; expensesCents: number; netCents: number }
}

const monthsCovered = (start: string, end: string, year: number) => {
  let n = 0
  for (let m = 1; m <= 12; m++) {
    const first = `${year}-${String(m).padStart(2, '0')}-01`
    const last = `${year}-${String(m).padStart(2, '0')}-${new Date(Date.UTC(year, m, 0)).getUTCDate()}`
    if (start <= last && end >= first) n++
  }
  return n
}

export function propertyReport(p: ReportInput): PropertyReport {
  const rent = p.payments.reduce((a, x) => a + x.rentCents, 0)
  const charges = p.payments.reduce((a, x) => a + x.chargesCents, 0)
  const byCategory: Record<string, number> = {}
  for (const e of p.expenses) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amountCents - e.recoverableCents
  const expenses = Object.values(byCategory).reduce((a, x) => a + x, 0)
  const signed = p.leases.filter((l) => l.status === 'ACTIVE' || l.status === 'IMPORTED' || l.status === 'ENDED')
  const occupied = Math.min(12, signed.reduce((a, l) => a + monthsCovered(l.start, l.end, p.year), 0))

  // Année suivante : bail en cours supposé reconduit, mêmes dépenses que cette année.
  const next = p.year + 1
  const running = signed.filter((l) => l.status !== 'ENDED')
  const months = (l: (typeof signed)[number]) => monthsCovered(l.start, l.status === 'ENDED' ? l.end : `${next}-12-31`, next)
  const fRent = running.reduce((a, l) => a + l.rentCents * months(l), 0)
  const fCharges = running.reduce((a, l) => a + l.chargesCents * months(l), 0)
  const yearlyRent = running[0] ? running[0].rentCents * 12 : rent

  return {
    id: p.id,
    name: p.name,
    rentCents: rent,
    chargesCents: charges,
    expensesCents: expenses,
    byCategory,
    netCents: rent + charges - expenses - p.expenses.reduce((a, e) => a + e.recoverableCents, 0),
    occupiedMonths: occupied,
    unpaidCents: p.unpaidCents,
    grossYield: p.purchasePriceCents ? Math.round((yearlyRent / p.purchasePriceCents) * 1000) / 10 : null,
    forecast: { year: next, rentCents: fRent, chargesCents: fCharges, expensesCents: expenses, netCents: fRent - expenses },
  }
}
