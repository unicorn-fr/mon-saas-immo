import { z } from 'zod'
import { addMonths, parseIsoDate, toIsoDate } from './lease.js'

/**
 * Emprunt d'un logement : tableau d'amortissement à taux fixe et mensualités constantes (prêt amortissable classique,
 * taux mensuel = taux annuel / 12), assurance mensuelle fixe. C'est une estimation : le tableau de la banque fait foi.
 *
 * Déclaration 2044, ligne 250 (notice 2044 de 2026, impots.gouv.fr) : intérêts payés dans l'année, frais d'emprunt
 * (dossier, garantie ou caution, hypothèque ou privilège de prêteur de deniers) et primes d'assurance décès garantissant
 * le remboursement du prêt. Seules les sommes payées pendant l'année comptent.
 */

const cents = z.number().int().min(0).max(1_000_000_000)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')

export const loanSchema = z.object({
  /** « Prêt principal », « Prêt à taux zéro »… */
  label: z.string().trim().max(80).optional().nullable(),
  principalCents: cents,
  /** Taux nominal annuel hors assurance, en pourcentage (3,45 pour 3,45 %). */
  ratePercent: z.number().min(0).max(20),
  months: z.number().int().min(1).max(420),
  /** Date de la première mensualité. */
  firstPaymentDate: isoDate,
  /** Assurance emprunteur par mois. */
  insuranceMonthlyCents: cents.optional().nullable(),
  /** Frais de dossier, de garantie (caution, hypothèque) et de courtage liés au prêt. */
  feesCents: cents.optional().nullable(),
  /** Date de signature du prêt : les frais sont comptés l'année où ils sont payés. Par défaut, un mois avant la première mensualité. */
  signedAt: isoDate.optional().nullable(),
})
export type Loan = z.infer<typeof loanSchema>

export interface LoanRow {
  n: number
  date: string
  paymentCents: number
  interestCents: number
  principalCents: number
  insuranceCents: number
  remainingCents: number
}

/** Mensualité hors assurance, arrondie au centime. */
export function monthlyPaymentCents(principalCents: number, ratePercent: number, months: number): number {
  const r = ratePercent / 100 / 12
  if (r === 0) return Math.round(principalCents / months)
  return Math.round((principalCents * r) / (1 - Math.pow(1 + r, -months)))
}

/** Tableau d'amortissement mois par mois ; la dernière mensualité solde le capital restant (arrondis). */
export function loanSchedule(loan: Loan): LoanRow[] {
  const r = loan.ratePercent / 100 / 12
  const payment = monthlyPaymentCents(loan.principalCents, loan.ratePercent, loan.months)
  const start = parseIsoDate(loan.firstPaymentDate)
  const rows: LoanRow[] = []
  let remaining = loan.principalCents
  for (let n = 1; n <= loan.months && remaining > 0; n++) {
    const interest = Math.round(remaining * r)
    const last = n === loan.months
    const principal = last ? remaining : Math.min(remaining, payment - interest)
    remaining -= principal
    rows.push({ n, date: toIsoDate(addMonths(start, n - 1)), paymentCents: principal + interest, interestCents: interest, principalCents: principal, insuranceCents: loan.insuranceMonthlyCents ?? 0, remainingCents: remaining })
  }
  return rows
}

/** Date de signature retenue pour les frais : celle indiquée, sinon un mois avant la première mensualité. */
export const loanSignedAt = (loan: Loan) => loan.signedAt ?? toIsoDate(addMonths(parseIsoDate(loan.firstPaymentDate), -1))

export interface LoanYear {
  year: number
  interestCents: number
  insuranceCents: number
  principalCents: number
  feesCents: number
  /** Ligne 250 de la 2044 : intérêts + assurance + frais payés dans l'année. */
  deductibleCents: number
  remainingCents: number
}

/** Totaux d'une année civile (sommes payées du 1er janvier au 31 décembre). */
export function loanYear(loan: Loan, year: number, rows = loanSchedule(loan)): LoanYear {
  const inYear = rows.filter((r) => r.date.startsWith(`${year}-`))
  const sum = (k: 'interestCents' | 'insuranceCents' | 'principalCents') => inYear.reduce((a, r) => a + r[k], 0)
  const fees = loanSignedAt(loan).startsWith(`${year}-`) ? (loan.feesCents ?? 0) : 0
  const interest = sum('interestCents')
  const insurance = sum('insuranceCents')
  const before = rows.filter((r) => r.date < `${year + 1}-01-01`)
  return { year, interestCents: interest, insuranceCents: insurance, principalCents: sum('principalCents'), feesCents: fees, deductibleCents: interest + insurance + fees, remainingCents: before.length ? before[before.length - 1].remainingCents : loan.principalCents }
}

/** Tous les emprunts d'un logement pour une année : montant de la ligne 250 calculé. */
export function loansDeductible(loans: Loan[], year: number): number {
  return loans.reduce((a, l) => a + loanYear(l, year).deductibleCents, 0)
}

/** Ce que les emprunts coûtent un mois donné (mensualité + assurance) et le capital restant dû après ce mois. */
export function loansAt(loans: Loan[], isoDay: string): { paymentCents: number; insuranceCents: number; remainingCents: number } {
  const month = isoDay.slice(0, 7)
  let payment = 0
  let insurance = 0
  let remaining = 0
  for (const l of loans) {
    const rows = loanSchedule(l)
    const row = rows.find((r) => r.date.startsWith(month))
    if (row) {
      payment += row.paymentCents
      insurance += row.insuranceCents
    }
    const past = rows.filter((r) => r.date.slice(0, 7) <= month)
    remaining += past.length ? past[past.length - 1].remainingCents : month < l.firstPaymentDate.slice(0, 7) ? l.principalCents : 0
  }
  return { paymentCents: payment, insuranceCents: insurance, remainingCents: remaining }
}

/**
 * Trésorerie d'un mois : loyer et charges encaissés, moins la mensualité, l'assurance de l'emprunt et la moyenne
 * mensuelle des dépenses. Avant impôt.
 */
export function monthlyCashflow(input: { rentCents: number; chargesCents: number; loanPaymentCents: number; loanInsuranceCents: number; averageExpensesCents: number }): number {
  return input.rentCents + input.chargesCents - input.loanPaymentCents - input.loanInsuranceCents - input.averageExpensesCents
}
