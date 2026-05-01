import { apiClient, handleApiError } from './api.service'
import { Expense, CreateExpenseInput, Loan, SaveLoanInput, FinanceSummary } from '../types/finance.types'

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface RentAdvice {
  minRent: number
  maxRent: number
  recommendedRent: number
  reasoning: string
  encadrementNote: string | null
  tips: string[]
}

export interface RentAdvisorInput {
  city: string
  address: string
  postalCode: string
  surface: number
  bedrooms: number
  furnished: boolean
  type: string
}

export interface MarketAnalysis {
  propertyId: string
  propertyTitle: string
  rentPerM2: number
  market: { city: string; avgRentM2: number; minRentM2: number; maxRentM2: number } | null
  vsMarket: 'below' | 'inline' | 'above'
  vsMarketPct: number
  advice: string
  encadrementStatus: 'compliant' | 'above_limit' | 'not_applicable' | 'unknown'
  encadrementInfo: string
  encadrementRef: number | null
  encadrementMaj: number | null
  encadrementMin: number | null
  fiscalAdvice: string
  annualRevenue: number
}

class FinanceService {
  async getExpenses(): Promise<Expense[]> {
    try {
      const res = await apiClient.get<ApiResponse<{ expenses: Expense[] }>>('/finances/expenses')
      return res.data.data.expenses
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async createExpense(data: CreateExpenseInput): Promise<Expense> {
    try {
      const res = await apiClient.post<ApiResponse<{ expense: Expense }>>('/finances/expenses', data)
      return res.data.data.expense
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async deleteExpense(id: string): Promise<void> {
    try { await apiClient.delete(`/finances/expenses/${id}`) }
    catch (e) { throw new Error(handleApiError(e)) }
  }

  async getLoans(): Promise<Loan[]> {
    try {
      const res = await apiClient.get<ApiResponse<{ loans: Loan[] }>>('/finances/loans')
      return res.data.data.loans
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async saveLoan(data: SaveLoanInput): Promise<Loan> {
    try {
      const res = await apiClient.post<ApiResponse<{ loan: Loan }>>('/finances/loans', data)
      return res.data.data.loan
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async getSummary(): Promise<FinanceSummary> {
    try {
      const res = await apiClient.get<ApiResponse<{ summary: FinanceSummary }>>('/finances/summary')
      return res.data.data.summary
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async getMarketAnalysis(propertyId: string): Promise<MarketAnalysis> {
    try {
      const res = await apiClient.get<ApiResponse<{ analysis: MarketAnalysis }>>(`/finances/market-analysis/${propertyId}`)
      return res.data.data.analysis
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async getRentAdvice(input: RentAdvisorInput): Promise<{ advice: RentAdvice; marketAvailable: boolean }> {
    try {
      const res = await apiClient.post<ApiResponse<{ advice: RentAdvice; marketAvailable: boolean }>>('/finances/rent-advisor', input)
      return res.data.data
    } catch (e) { throw new Error(handleApiError(e)) }
  }
}

export const financeService = new FinanceService()
