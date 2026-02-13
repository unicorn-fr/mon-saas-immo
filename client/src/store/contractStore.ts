import { create } from 'zustand'
import { contractService } from '../services/contract.service'
import {
  Contract,
  CreateContractInput,
  UpdateContractInput,
  ContractFilters,
  ContractStatistics,
} from '../types/contract.types'
import { toast } from 'react-hot-toast'

interface ContractStore {
  // State
  contracts: Contract[]
  currentContract: Contract | null
  statistics: ContractStatistics | null
  isLoading: boolean
  error: string | null
  total: number
  page: number
  limit: number

  // Actions
  fetchContracts: (filters?: ContractFilters, page?: number, limit?: number) => Promise<void>
  fetchContractById: (id: string) => Promise<void>
  createContract: (data: CreateContractInput) => Promise<Contract | null>
  updateContract: (id: string, data: UpdateContractInput) => Promise<Contract | null>
  deleteContract: (id: string) => Promise<boolean>
  signContract: (id: string) => Promise<Contract | null>
  activateContract: (id: string) => Promise<Contract | null>
  terminateContract: (id: string) => Promise<Contract | null>
  fetchStatistics: () => Promise<void>
  clearCurrentContract: () => void
  clearError: () => void
}

export const useContractStore = create<ContractStore>((set, get) => ({
  // Initial state
  contracts: [],
  currentContract: null,
  statistics: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,

  // Fetch contracts with filters
  fetchContracts: async (filters?, page = 1, limit = 20) => {
    set({ isLoading: true, error: null })
    try {
      const data = await contractService.getContracts(filters, { page, limit })
      set({
        contracts: data.contracts,
        total: data.total,
        page: data.page,
        limit: data.limit,
        isLoading: false,
      })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch contracts'
      set({ error: message, isLoading: false })
      toast.error(message)
    }
  },

  // Fetch single contract
  fetchContractById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const contract = await contractService.getContractById(id)
      set({ currentContract: contract, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch contract'
      set({ error: message, isLoading: false, currentContract: null })
      toast.error(message)
    }
  },

  // Create new contract
  createContract: async (data: CreateContractInput) => {
    set({ isLoading: true, error: null })
    try {
      const contract = await contractService.createContract(data)
      set((state) => ({
        contracts: [contract, ...state.contracts],
        currentContract: contract,
        isLoading: false,
      }))
      toast.success('Contrat créé avec succès')
      return contract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  // Update contract
  updateContract: async (id: string, data: UpdateContractInput) => {
    set({ isLoading: true, error: null })
    try {
      const updatedContract = await contractService.updateContract(id, data)
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? updatedContract : c)),
        currentContract: state.currentContract?.id === id ? updatedContract : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat mis à jour avec succès')
      return updatedContract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  // Delete contract
  deleteContract: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await contractService.deleteContract(id)
      set((state) => ({
        contracts: state.contracts.filter((c) => c.id !== id),
        currentContract: state.currentContract?.id === id ? null : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat supprimé avec succès')
      return true
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return false
    }
  },

  // Sign contract
  signContract: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const signedContract = await contractService.signContract(id)
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? signedContract : c)),
        currentContract: state.currentContract?.id === id ? signedContract : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat signé avec succès')
      return signedContract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to sign contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  // Activate contract
  activateContract: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const activatedContract = await contractService.activateContract(id)
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? activatedContract : c)),
        currentContract:
          state.currentContract?.id === id ? activatedContract : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat activé avec succès')
      return activatedContract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to activate contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  // Terminate contract
  terminateContract: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const terminatedContract = await contractService.terminateContract(id)
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? terminatedContract : c)),
        currentContract:
          state.currentContract?.id === id ? terminatedContract : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat résilié avec succès')
      return terminatedContract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to terminate contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  // Fetch statistics
  fetchStatistics: async () => {
    set({ isLoading: true, error: null })
    try {
      const statistics = await contractService.getStatistics()
      set({ statistics, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch statistics'
      set({ error: message, isLoading: false })
      // Don't show toast for statistics errors
    }
  },

  // Clear current contract
  clearCurrentContract: () => {
    set({ currentContract: null })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))
