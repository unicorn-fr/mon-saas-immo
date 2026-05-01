import { create } from 'zustand'
import toast from 'react-hot-toast'
import { maintenanceService } from '../services/maintenance.service'
import { MaintenanceRequest, CreateMaintenanceInput, MaintenanceStatus, MaintenancePriority } from '../types/maintenance.types'

interface MaintenanceStore {
  requests: MaintenanceRequest[]
  isLoading: boolean
  isAnalyzing: string | null  // id of the request being analyzed
  error: string | null
  fetchRequests: () => Promise<void>
  createRequest: (data: CreateMaintenanceInput) => Promise<void>
  updateStatus: (id: string, data: { status?: MaintenanceStatus; priority?: MaintenancePriority }) => Promise<void>
  analyzeWithAI: (id: string) => Promise<void>
}

export const useMaintenanceStore = create<MaintenanceStore>((set) => ({
  requests: [],
  isLoading: false,
  isAnalyzing: null,
  error: null,

  fetchRequests: async () => {
    set({ isLoading: true, error: null })
    try {
      const requests = await maintenanceService.getRequests()
      set({ requests, isLoading: false })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      set({ error: msg, isLoading: false })
    }
  },

  createRequest: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const request = await maintenanceService.createRequest(data)
      set(s => ({ requests: [request, ...s.requests], isLoading: false }))
      toast.success('Demande créée')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      set({ error: msg, isLoading: false })
      toast.error(msg)
      throw e
    }
  },

  updateStatus: async (id, data) => {
    try {
      const request = await maintenanceService.updateRequest(id, data)
      set(s => ({ requests: s.requests.map(r => r.id === id ? request : r) }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      toast.error(msg)
    }
  },

  analyzeWithAI: async (id) => {
    set({ isAnalyzing: id })
    try {
      const request = await maintenanceService.analyzeWithAI(id)
      set(s => ({ requests: s.requests.map(r => r.id === id ? request : r), isAnalyzing: null }))
      toast.success('Analyse IA terminée')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      set({ isAnalyzing: null })
      toast.error(msg)
    }
  },
}))
