import api from './api'

export interface ProfileSaveData {
  firstName?: string
  lastName?: string
  birthDate?: string
  birthCity?: string
  nationality?: string
  documentNumber?: string
  documentExpiry?: string
  nationalNumber?: string
  address?: string
  employerName?: string
  contractType?: string
  netSalary?: number | null
}

export interface TenantDocument {
  id: string
  userId: string
  category: string
  docType: string
  status: 'UPLOADED' | 'VALIDATED' | 'REJECTED'
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface TenantDossierProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  birthDate: string | null
  birthCity: string | null
  nationality: string | null
  profileMeta: Record<string, unknown> | null
  tenantDocuments: TenantDocument[]
}

class DossierService {
  async getDocuments(): Promise<TenantDocument[]> {
    const response = await api.get('/dossier')
    return response.data.data || []
  }

  async uploadDocument(category: string, docType: string, file: File): Promise<TenantDocument> {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 5 MB.`)
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    formData.append('docType', docType)
    const response = await api.post('/dossier', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  }

  async reassignDocument(id: string, category: string, docType: string): Promise<{ swapped: boolean }> {
    const response = await api.patch(`/dossier/${id}`, { category, docType })
    return response.data.data
  }

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/dossier/${id}`)
  }

  async saveProfile(data: ProfileSaveData): Promise<void> {
    await api.patch('/dossier/profile', data)
  }

  async getTenantDossier(tenantId: string): Promise<TenantDossierProfile> {
    const response = await api.get(`/dossier/tenant/${tenantId}`)
    return response.data.data
  }
}

export const dossierService = new DossierService()
