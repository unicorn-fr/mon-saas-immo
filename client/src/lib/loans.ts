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
