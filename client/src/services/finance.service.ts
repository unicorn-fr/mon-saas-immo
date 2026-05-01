import { apiClient, handleApiError } from './api.service'
import { Expense, CreateExpenseInput, Loan, SaveLoanInput, FinanceSummary } from '../types/finance.types'

interface ApiResponse<T> { success: boolean; message?: string; data: T }

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
}

export const financeService = new FinanceService()
