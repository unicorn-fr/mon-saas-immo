import { apiClient, handleApiError } from './api.service'
import { MaintenanceRequest, CreateMaintenanceInput, MaintenanceStatus, MaintenancePriority } from '../types/maintenance.types'

interface ApiResponse<T> { success: boolean; message?: string; data: T }

class MaintenanceService {
  async getRequests(): Promise<MaintenanceRequest[]> {
    try {
      const res = await apiClient.get<ApiResponse<{ requests: MaintenanceRequest[] }>>('/maintenance')
      return res.data.data.requests
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async createRequest(data: CreateMaintenanceInput): Promise<MaintenanceRequest> {
    try {
      const res = await apiClient.post<ApiResponse<{ request: MaintenanceRequest }>>('/maintenance', data)
      return res.data.data.request
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async updateRequest(id: string, data: { status?: MaintenanceStatus; priority?: MaintenancePriority }): Promise<MaintenanceRequest> {
    try {
      const res = await apiClient.patch<ApiResponse<{ request: MaintenanceRequest }>>(`/maintenance/${id}`, data)
      return res.data.data.request
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async analyzeWithAI(id: string): Promise<MaintenanceRequest> {
    try {
      const res = await apiClient.post<ApiResponse<{ request: MaintenanceRequest }>>(`/maintenance/${id}/ai-analyze`)
      return res.data.data.request
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async findContractors(data: {
    latitude?: number | null
    longitude?: number | null
    city: string
    category: string
  }): Promise<{
    contractors: Array<{ id: string; name: string; address: string; phone: string | null; website: string | null; distance: number; openingHours: string | null }>
    platforms: Array<{ name: string; url: string; description: string }>
    searchLocation: { lat: number; lon: number }
  }> {
    try {
      const res = await apiClient.post<ApiResponse<{
        contractors: Array<{ id: string; name: string; address: string; phone: string | null; website: string | null; distance: number; openingHours: string | null }>
        platforms: Array<{ name: string; url: string; description: string }>
        searchLocation: { lat: number; lon: number }
      }>>('/maintenance/find-contractors', data)
      return res.data.data
    } catch (e) { throw new Error(handleApiError(e)) }
  }
}

export const maintenanceService = new MaintenanceService()
