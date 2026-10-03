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
/** Déficit foncier imputable sur le revenu global (hors intérêts d'emprunt), par an. */
export const DEFICIT_GLOBAL_CEILING_CENTS = 10_700_00
/**
 * Plafond porté à 21 400 € quand le déficit vient de travaux de rénovation énergétique faisant passer le logement
 * d'une classe E, F ou G à A, B, C ou D (devis accepté depuis le 5 novembre 2022, dépenses payées de 2023 à 2027 :
 * prolongation de la loi de finances pour 2026, à vérifier sur impots.gouv.fr). CGI, art. 156, I-3°.
 */
export const DEFICIT_ENERGY_CEILING_CENTS = 21_400_00
export const DEFICIT_ENERGY_YEARS = [2023, 2027] as const

export interface TaxProperty {
  id: string
  name: string
  furnished: boolean
  /** Loyers encaissés dans l'année, séparés en loyer et charges (selon le bail). */
  payments: { rentCents: number; chargesCents: number }[]
  expenses: { category: string; amountCents: number; recoverableCents: number }[]
  /** Saisis par le propriétaire pour l'année : intérêts d'emprunt, frais d'administration (honoraires…). */
  extra?: { loanInterestCents?: number | null; adminFeesCents?: number | null; coproRegularizationCents?: number | null } | null
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
  /** Construction, reconstruction, agrandissement : non déductibles (à garder pour la plus-value à la vente). */
  nonDeductibleCents: number
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
    /** Régime réel en déficit : part imputable sur le revenu global (case 4BC) et part reportée sur les revenus fonciers (case 4BD). */
    deficit: { totalCents: number; globalCents: number; carriedCents: number } | null
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
        { line: '224', label: 'Travaux de réparation, d’entretien et d’amélioration', cents: owner(['REPAIR', 'MAINTENANCE', 'ENERGY_RENOVATION']) },
        { line: '227', label: 'Taxe foncière (hors taxe d’ordures ménagères récupérable)', cents: owner(['TAX']) },
        { line: '229', label: 'Provisions pour charges de copropriété (part non récupérable)', cents: owner(['COPRO']) },
        { line: '230', label: 'Régularisation des provisions de l’année précédente (à déduire)', cents: -(p.extra?.coproRegularizationCents ?? 0) },
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
    nonDeductibleCents: sum(p.expenses.filter((e) => e.category === 'EXTENSION'), (e) => e.amountCents),
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
  const interest = sum(empty, (p) => p.lines.find((l) => l.line === '250')?.cents ?? 0)
  const energyWorks = year >= DEFICIT_ENERGY_YEARS[0] && year <= DEFICIT_ENERGY_YEARS[1] ? sum(input.filter((p) => !p.furnished), (p) => sum(p.expenses.filter((e) => e.category === 'ENERGY_RENOVATION'), (e) => e.amountCents - e.recoverableCents)) : 0
  return {
    year,
    properties,
    empty: empty.length
      ? {
          grossRentCents: gross,
          microAllowed: gross <= MICRO_FONCIER_CEILING_CENTS,
          microTaxableCents: microTaxable,
          realResultCents: real,
          better: gross <= MICRO_FONCIER_CEILING_CENTS ? (real < microTaxable ? 'REAL' : 'MICRO') : 'REAL',
          deficit: foncierDeficit(gross, interest, gross - real - interest, energyWorks),
        }
      : null,
    furnished: furnished.length ? { receiptsCents: receipts, microAllowed: receipts <= MICRO_BIC_CEILING_CENTS, microTaxableCents: Math.round(receipts * 0.5) } : null,
  }
}

/** Répartition d'un paiement entre loyer et charges, selon les montants du bail. */
export function splitPayment(amountCents: number, rentCents: number): { rentCents: number; chargesCents: number } {
  const rent = Math.min(amountCents, rentCents)
  return { rentCents: rent, chargesCents: Math.max(0, amountCents - rent) }
}

/**
 * Déficit foncier au régime réel (CGI, art. 156, I-3°) : la part due aux intérêts d'emprunt ne s'impute que sur les
 * revenus fonciers des 10 années suivantes ; le reste s'impute sur le revenu global dans la limite de 10 700 € par an,
 * l'excédent étant reporté. Plafond porté à 21 400 € pour les travaux de rénovation énergétique (voir
 * DEFICIT_ENERGY_CEILING_CENTS).
 */
export function foncierDeficit(grossCents: number, interestCents: number, otherChargesCents: number, energyWorksCents = 0): { totalCents: number; globalCents: number; carriedCents: number; ceilingCents: number } | null {
  const total = interestCents + otherChargesCents - grossCents
  if (total <= 0) return null
  // Plafond majoré à hauteur des travaux de rénovation énergétique, sans dépasser 21 400 €.
  const ceiling = Math.min(DEFICIT_ENERGY_CEILING_CENTS, DEFICIT_GLOBAL_CEILING_CENTS + Math.max(0, energyWorksCents))
  const imputable = interestCents >= grossCents ? otherChargesCents : total
  const global = Math.min(imputable, ceiling)
  return { totalCents: total, globalCents: global, carriedCents: total - global, ceilingCents: ceiling }
}
