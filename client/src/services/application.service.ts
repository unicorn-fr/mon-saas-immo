import { apiClient as api } from './api.service'
import type {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
  MatchResult,
} from '../types/application.types'

class ApplicationService {
  /** Live pre-qualification check (no DB write) */
  async prequalify(
    propertyId: string,
    hasGuarantor = false,
    guarantorType?: string
  ): Promise<MatchResult> {
    const params = new URLSearchParams({ hasGuarantor: String(hasGuarantor) })
    if (guarantorType) params.set('guarantorType', guarantorType)
    const res = await api.get(`/applications/prequalify/${propertyId}?${params}`)
    return res.data.data as MatchResult
  }

  /** Submit a candidature */
  async create(data: CreateApplicationInput): Promise<Application> {
    const res = await api.post('/applications', data)
    return res.data.data as Application
  }

  /** List (role-aware — owner sees candidates, tenant sees own) */
  async list(propertyId?: string): Promise<Application[]> {
    const params = propertyId ? `?propertyId=${propertyId}` : ''
    const res = await api.get(`/applications${params}`)
    return res.data.data as Application[]
  }

  /** Get one by ID */
  async getOne(id: string): Promise<Application> {
    const res = await api.get(`/applications/${id}`)
    return res.data.data as Application
  }

  /** Owner approves or rejects */
  async updateStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const res = await api.patch(`/applications/${id}/status`, { status })
    return res.data.data as Application
  }

  /** Owner cancels a rejection — puts back to PENDING */
  async unreject(id: string): Promise<Application> {
    const res = await api.patch(`/applications/${id}/unreject`)
    return res.data.data as Application
  }

  /** Tenant withdraws */
  async withdraw(id: string): Promise<void> {
    await api.delete(`/applications/${id}`)
  }
}

export const applicationService = new ApplicationService()
