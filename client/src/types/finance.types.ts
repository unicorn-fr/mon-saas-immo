export type ExpenseCategory = 'TAXE_FONCIERE' | 'ASSURANCE' | 'TRAVAUX' | 'CHARGES_COPRO' | 'AUTRE'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TAXE_FONCIERE: 'Taxe foncière',
  ASSURANCE: 'Assurance',
  TRAVAUX: 'Travaux',
  CHARGES_COPRO: 'Charges copropriété',
  AUTRE: 'Autre',
}

export interface Expense {
  id: string
  propertyId: string
  ownerId: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  receiptUrl?: string
  createdAt: string
  property?: { title: string }
}

export interface CreateExpenseInput {
  propertyId: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  receiptUrl?: string
}

export interface Loan {
  id: string
  propertyId: string
  ownerId: string
  bankName?: string
  totalAmount: number
  monthlyPayment: number
  interestRate: number
  durationMonths: number
  startDate: string
  createdAt: string
  property?: { title: string }
}

export interface SaveLoanInput {
  propertyId: string
  bankName?: string
  totalAmount: number
  monthlyPayment: number
  interestRate: number
  durationMonths: number
  startDate: string
}

export interface CashFlowMonth {
  month: string
  revenue: number
  expenses: number
  net: number
}

export interface FinanceSummary {
  totalRevenue: number
  totalExpenses: number
  totalLoanMonthly: number
  netCashFlow: number
  cashFlowByMonth: CashFlowMonth[]
  occupancyRate: number
}
