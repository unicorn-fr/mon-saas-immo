/**
 * Aide à la déclaration des revenus locatifs d'une année, à partir des loyers encaissés et des dépenses
 * enregistrées dans Bailio (sommes encaissées ou payées pendant l'année civile).
 * - Location vide (revenus fonciers) : micro-foncier (recettes du foyer ≤ 15 000 €, abattement de 30 %,
 *   case 4BE de la déclaration 2042) ou régime réel (déclaration 2044, lignes 211 à 250).
 * - Location meublée (loueur en meublé non professionnel) : micro-BIC (abattement de 50 %, case 5ND de la
 *   déclaration 2042-C-PRO), le régime réel relevant d'une comptabilité (expert-comptable).
 * C'est une aide : le propriétaire vérifie et reste seul responsable de sa déclaration.
 */

export const MICRO_FONCIER_CEILING_CENTS = 15_000_00
export const MICRO_BIC_CEILING_CENTS = 77_700_00
/** Ligne 222 de la 2044 : forfait de frais de gestion par local. */
export const MANAGEMENT_FLAT_CENTS = 20_00

export interface TaxProperty {
  id: string
  name: string
  furnished: boolean
  /** Loyers encaissés dans l'année, séparés en loyer et charges (selon le bail). */
  payments: { rentCents: number; chargesCents: number }[]
  expenses: { category: string; amountCents: number; recoverableCents: number }[]
  /** Saisis par le propriétaire pour l'année : intérêts d'emprunt, frais d'administration (honoraires…). */
  extra?: { loanInterestCents?: number | null; adminFeesCents?: number | null } | null
}

export interface TaxLine {
  line: string
  label: string
  cents: number
}

export interface PropertyTax {
  id: string
  name: string
  furnished: boolean
  rentCents: number
  chargesCents: number
  /** Dépenses classées « autre » : à vérifier, non reprises dans les lignes. */
  unclassifiedCents: number
  lines: TaxLine[]
  resultCents: number
}

export interface TaxSummary {
  year: number
  properties: PropertyTax[]
  empty: {
    grossRentCents: number
    /** Micro-foncier possible (recettes ≤ 15 000 €), montant à reporter case 4BE. */
    microAllowed: boolean
    microTaxableCents: number
    realResultCents: number
    /** Régime le plus favorable d'après les sommes enregistrées. */
    better: 'MICRO' | 'REAL' | null
  } | null
  furnished: {
    receiptsCents: number
    microAllowed: boolean
    microTaxableCents: number
  } | null
}

const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0)

export function propertyTax(p: TaxProperty): PropertyTax {
  const rent = sum(p.payments, (x) => x.rentCents)
  const charges = sum(p.payments, (x) => x.chargesCents)
  const owner = (cat: string[]) => sum(p.expenses.filter((e) => cat.includes(e.category)), (e) => e.amountCents - e.recoverableCents)
  const lines: TaxLine[] = p.furnished
    ? []
    : [
        { line: '211', label: 'Loyers bruts encaissés (hors charges)', cents: rent },
        { line: '221', label: 'Frais d’administration et de gestion', cents: p.extra?.adminFeesCents ?? 0 },
        { line: '222', label: 'Autres frais de gestion (forfait de 20 € par logement)', cents: rent > 0 ? MANAGEMENT_FLAT_CENTS : 0 },
        { line: '223', label: 'Primes d’assurance', cents: owner(['INSURANCE']) },
        { line: '224', label: 'Travaux de réparation, d’entretien et d’amélioration', cents: owner(['REPAIR', 'MAINTENANCE']) },
        { line: '227', label: 'Taxe foncière (hors taxe d’ordures ménagères récupérable)', cents: owner(['TAX']) },
        { line: '229', label: 'Provisions pour charges de copropriété (part non récupérable)', cents: owner(['COPRO']) },
        { line: '250', label: 'Intérêts d’emprunt', cents: p.extra?.loanInterestCents ?? 0 },
      ]
  const deductions = sum(lines.filter((l) => l.line !== '211'), (l) => l.cents)
  return {
    id: p.id,
    name: p.name,
    furnished: p.furnished,
    rentCents: rent,
    chargesCents: charges,
    unclassifiedCents: sum(p.expenses.filter((e) => e.category === 'OTHER'), (e) => e.amountCents),
    lines,
    resultCents: p.furnished ? rent + charges : rent - deductions,
  }
}

export function taxSummary(year: number, input: TaxProperty[]): TaxSummary {
  const properties = input.map(propertyTax).filter((p) => p.rentCents || p.chargesCents || p.lines.some((l) => l.cents && l.line !== '222'))
  const empty = properties.filter((p) => !p.furnished)
  const furnished = properties.filter((p) => p.furnished)
  const gross = sum(empty, (p) => p.rentCents)
  const real = sum(empty, (p) => p.resultCents)
  const microTaxable = Math.round(gross * 0.7)
  const receipts = sum(furnished, (p) => p.rentCents + p.chargesCents)
  return {
    year,
    properties,
    empty: empty.length
      ? { grossRentCents: gross, microAllowed: gross <= MICRO_FONCIER_CEILING_CENTS, microTaxableCents: microTaxable, realResultCents: real, better: gross <= MICRO_FONCIER_CEILING_CENTS ? (real < microTaxable ? 'REAL' : 'MICRO') : 'REAL' }
      : null,
    furnished: furnished.length ? { receiptsCents: receipts, microAllowed: receipts <= MICRO_BIC_CEILING_CENTS, microTaxableCents: Math.round(receipts * 0.5) } : null,
  }
}

/** Répartition d'un paiement entre loyer et charges, selon les montants du bail. */
export function splitPayment(amountCents: number, rentCents: number): { rentCents: number; chargesCents: number } {
  const rent = Math.min(amountCents, rentCents)
  return { rentCents: rent, chargesCents: Math.max(0, amountCents - rent) }
}
