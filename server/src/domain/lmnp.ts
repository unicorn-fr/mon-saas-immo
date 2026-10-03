/**
 * Location meublée non professionnelle au régime réel : estimation pour comparer avec le micro-BIC.
 * - Recettes : loyers et charges encaissés ; charges déductibles : dépenses payées (dont la part refacturée),
 *   intérêts d'emprunt, frais de gestion. Les travaux d'amélioration et d'agrandissement s'amortissent.
 * - Amortissements (linéaires, simplifiés) : logement hors terrain sur 30 ans, mobilier sur 7 ans, travaux
 *   d'amélioration sur 15 ans, au prorata de l'année pour le logement acheté en cours d'année.
 * - Article 39 C du CGI : l'amortissement ne peut ni créer ni augmenter un déficit ; la part non déduite est reportée
 *   sans limite de durée. Un déficit avant amortissement se reporte sur les revenus de location meublée des 10 ans suivants.
 * C'est une estimation : la liasse 2031 et ses annexes se font avec un expert-comptable ou un logiciel agréé, qui
 * détaille l'amortissement par composants. Depuis 2025, les amortissements déduits sont repris dans la plus-value à la vente.
 */

export const BUILDING_YEARS = 30
export const FURNITURE_YEARS = 7
export const WORKS_YEARS = 15
export const DEFAULT_LAND_SHARE = 15

export interface LmnpProperty {
  receiptsCents: number
  /** Dépenses déductibles de l'année (montant total payé), hors travaux à amortir. */
  chargesCents: number
  /** Travaux d'amélioration ou d'agrandissement de l'année : amortis. */
  worksCents: number
  loanInterestCents: number
  adminFeesCents: number
  purchase?: { priceCents?: number | null; date?: string | null } | null
  landSharePercent?: number | null
  furnitureCents?: number | null
}

export interface LmnpEstimate {
  receiptsCents: number
  chargesCents: number
  resultBeforeAmortCents: number
  amortYearCents: number
  amortAvailableCents: number
  amortUsedCents: number
  amortCarriedCents: number
  /** Déficit avant amortissement (reportable 10 ans sur les revenus de location meublée). */
  deficitCents: number
  taxableCents: number
  microTaxableCents: number
  better: 'MICRO' | 'REAL'
  /** Logement sans prix d'achat : l'amortissement du logement n'est pas compté. */
  missingPurchase: boolean
}

/** Part de l'année pendant laquelle un bien acheté à cette date est amorti (0 à 1). */
export function yearShare(year: number, dateIso?: string | null): number {
  if (!dateIso) return 1
  const y = Number(dateIso.slice(0, 4))
  if (y < year) return 1
  if (y > year) return 0
  const start = Date.UTC(year, Number(dateIso.slice(5, 7)) - 1, Number(dateIso.slice(8, 10)))
  const end = Date.UTC(year + 1, 0, 1)
  return (end - start) / (end - Date.UTC(year, 0, 1))
}

export function lmnpEstimate(year: number, props: LmnpProperty[], carriedAmortCents = 0): LmnpEstimate {
  const sum = (f: (p: LmnpProperty) => number) => props.reduce((a, p) => a + f(p), 0)
  const receipts = sum((p) => p.receiptsCents)
  const charges = sum((p) => p.chargesCents + p.loanInterestCents + p.adminFeesCents)
  const amortYear = Math.round(
    sum((p) => {
      const price = p.purchase?.priceCents ?? 0
      const land = (p.landSharePercent ?? DEFAULT_LAND_SHARE) / 100
      const building = price ? ((price * (1 - land)) / BUILDING_YEARS) * yearShare(year, p.purchase?.date) : 0
      return building + (p.furnitureCents ?? 0) / FURNITURE_YEARS + p.worksCents / WORKS_YEARS
    }),
  )
  const before = receipts - charges
  const available = amortYear + Math.max(0, carriedAmortCents)
  const used = Math.min(available, Math.max(0, before))
  const taxable = Math.max(0, before - used)
  const micro = Math.round(receipts * 0.5)
  return {
    receiptsCents: receipts,
    chargesCents: charges,
    resultBeforeAmortCents: before,
    amortYearCents: amortYear,
    amortAvailableCents: available,
    amortUsedCents: used,
    amortCarriedCents: available - used,
    deficitCents: Math.max(0, -before),
    taxableCents: taxable,
    microTaxableCents: micro,
    better: taxable < micro ? 'REAL' : 'MICRO',
    missingPurchase: props.some((p) => !p.purchase?.priceCents),
  }
}
