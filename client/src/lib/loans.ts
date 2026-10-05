/** Emprunt d'un logement : mêmes champs que le serveur (server/src/domain/loan.ts). */
export interface Loan {
  label?: string | null
  principalCents: number
  ratePercent: number
  months: number
  firstPaymentDate: string
  insuranceMonthlyCents?: number | null
  feesCents?: number | null
  signedAt?: string | null
}

export interface LoanRow {
  n: number
  date: string
  paymentCents: number
  interestCents: number
  principalCents: number
  insuranceCents: number
  remainingCents: number
}

export interface LoanYear {
  year: number
  interestCents: number
  insuranceCents: number
  principalCents: number
  feesCents: number
  deductibleCents: number
  remainingCents: number
}

export interface LoansView {
  loans: Array<{ index: number; loan: Loan; monthlyCents: number; endDate: string; totalInterestCents: number; totalInsuranceCents: number; years: LoanYear[]; rows: LoanRow[] }>
  now: { paymentCents: number; insuranceCents: number; remainingCents: number }
  thisYear: { year: number; deductibleCents: number }
  cashflow: { rented: boolean; rentCents: number; chargesCents: number; loanPaymentCents: number; loanInsuranceCents: number; averageExpensesCents: number; netCents: number }
}

/** Mensualité hors assurance (même calcul que le serveur, server/src/domain/loan.ts), pour l'aperçu avant enregistrement. */
export function monthlyPaymentCents(principalCents: number, ratePercent: number, months: number): number {
  const r = ratePercent / 100 / 12
  if (!months) return 0
  if (r === 0) return Math.round(principalCents / months)
  return Math.round((principalCents * r) / (1 - Math.pow(1 + r, -months)))
}
