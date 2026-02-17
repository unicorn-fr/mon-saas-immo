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
  sendContract: (id: string) => Promise<Contract | null>
  signContract: (id: string, signature?: string) => Promise<Contract | null>
  activateContract: (id: string) => Promise<Contract | null>
  terminateContract: (id: string) => Promise<Contract | null>
  fetchStatistics: () => Promise<void>
  clearCurrentContract: () => void
  clearError: () => void
}

export const useContractStore = create<ContractStore>((set) => ({
  contracts: [],
  currentContract: null,
  statistics: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,

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

  createContract: async (data: CreateContractInput) => {
    set({ isLoading: true, error: null })
    try {
      const contract = await contractService.createContract(data)
      set((state) => ({
        contracts: [contract, ...state.contracts],
        currentContract: contract,
        isLoading: false,
      }))
      toast.success('Contrat cree avec succes')
      return contract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  updateContract: async (id: string, data: UpdateContractInput) => {
    set({ isLoading: true, error: null })
    try {
      const updatedContract = await contractService.updateContract(id, data)
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? updatedContract : c)),
        currentContract: state.currentContract?.id === id ? updatedContract : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat mis a jour avec succes')
      return updatedContract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  deleteContract: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await contractService.deleteContract(id)
      set((state) => ({
        contracts: state.contracts.filter((c) => c.id !== id),
        currentContract: state.currentContract?.id === id ? null : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat supprime avec succes')
      return true
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return false
    }
  },

  sendContract: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const contract = await contractService.sendContract(id)
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? contract : c)),
        currentContract: state.currentContract?.id === id ? contract : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat envoye au locataire')
      return contract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  signContract: async (id: string, signature?: string) => {
    set({ isLoading: true, error: null })
    try {
      const signedContract = await contractService.signContract(id, signature)
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? signedContract : c)),
        currentContract: state.currentContract?.id === id ? signedContract : state.currentContract,
        isLoading: false,
      }))
      toast.success('Contrat signe avec succes')
      return signedContract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to sign contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

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
      toast.success('Contrat active avec succes')
      return activatedContract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to activate contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

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
      toast.success('Contrat resilie avec succes')
      return terminatedContract
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to terminate contract'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  fetchStatistics: async () => {
    set({ isLoading: true, error: null })
    try {
      const statistics = await contractService.getStatistics()
      set({ statistics, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch statistics'
      set({ error: message, isLoading: false })
    }
  },

  clearCurrentContract: () => {
    set({ currentContract: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))
