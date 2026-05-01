import { create } from 'zustand'
import toast from 'react-hot-toast'
import { financeService } from '../services/finance.service'
import { Expense, CreateExpenseInput, Loan, SaveLoanInput, FinanceSummary } from '../types/finance.types'

interface FinanceStore {
  expenses: Expense[]
  loans: Loan[]
  summary: FinanceSummary | null
  isLoading: boolean
  error: string | null
  fetchExpenses: () => Promise<void>
  createExpense: (data: CreateExpenseInput) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  fetchLoans: () => Promise<void>
  saveLoan: (data: SaveLoanInput) => Promise<void>
  fetchSummary: () => Promise<void>
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  expenses: [],
  loans: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchExpenses: async () => {
    set({ isLoading: true, error: null })
    try {
      const expenses = await financeService.getExpenses()
      set({ expenses, isLoading: false })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      set({ error: msg, isLoading: false })
      toast.error(msg)
    }
  },

  createExpense: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const expense = await financeService.createExpense(data)
      set(s => ({ expenses: [expense, ...s.expenses], isLoading: false }))
      toast.success('Dépense ajoutée')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      set({ error: msg, isLoading: false })
      toast.error(msg)
      throw e
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await financeService.deleteExpense(id)
      set(s => ({ expenses: s.expenses.filter(e => e.id !== id), isLoading: false }))
      toast.success('Dépense supprimée')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      set({ error: msg, isLoading: false })
      toast.error(msg)
    }
  },

  fetchLoans: async () => {
    set({ isLoading: true, error: null })
    try {
      const loans = await financeService.getLoans()
      set({ loans, isLoading: false })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      set({ error: msg, isLoading: false })
    }
  },

  saveLoan: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const loan = await financeService.saveLoan(data)
      const loans = get().loans
      const idx = loans.findIndex(l => l.propertyId === data.propertyId)
      if (idx >= 0) {
        const updated = [...loans]; updated[idx] = loan
        set({ loans: updated, isLoading: false })
      } else {
        set({ loans: [loan, ...loans], isLoading: false })
      }
      toast.success('Emprunt enregistré')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      set({ error: msg, isLoading: false })
      toast.error(msg)
      throw e
    }
  },

  fetchSummary: async () => {
    set({ isLoading: true, error: null })
    try {
      const summary = await financeService.getSummary()
      set({ summary, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
    }
  },
}))
