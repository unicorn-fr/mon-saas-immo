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
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DossierAccessLog {
  id: string
  viewerId: string
  viewerName: string
  viewerEmail: string
  propertyTitle: string | null
  createdAt: string
}

export interface DossierShare {
  id: string
  tenantId: string
  ownerId: string
  propertyId: string | null
  expiresAt: string
  revokedAt: string | null
  createdAt: string
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
    trustScore: number
    isVerifiedOwner: boolean
  }
}

export interface PublicUserProfile {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  role: string
  createdAt: string
  emailVerified: boolean
  phoneVerified: boolean
  trustScore: number
  isVerifiedOwner: boolean
  reportCount: number
  isBanned: boolean
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

  // ── Watermarked document view URL ────────────────────────────────────────
  getWatermarkedDocUrl(docId: string): string {
    return `/api/v1/dossier/docs/${docId}/view`
  }
}

export const dossierService = new DossierService()

// ── Share Management API ─────────────────────────────────────────────────────

export const shareApi = {
  async grantShare(ownerId: string, propertyId?: string, durationDays = 7): Promise<DossierShare> {
    const res = await api.post('/dossier/share', { ownerId, propertyId, durationDays })
    return res.data.data
  },

  async revokeShare(ownerId: string): Promise<void> {
    await api.delete(`/dossier/share/${ownerId}`)
  },

  async listShares(): Promise<DossierShare[]> {
    const res = await api.get('/dossier/shares')
    return res.data.data || []
  },

  async reportUser(targetId: string, reason: string, details?: string): Promise<void> {
    await api.post('/dossier/report', { targetId, reason, details })
  },

  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    const res = await api.get(`/dossier/profile/${userId}`)
    return res.data.data
  },
}

// ── Privacy API ──────────────────────────────────────────────────────────────

export const privacyApi = {
  async getAccessLog(): Promise<DossierAccessLog[]> {
    const res = await api.get('/privacy/access-log')
    return res.data.data
  },

  async exportData(): Promise<void> {
    const res = await api.get('/privacy/export', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async deleteAccount(confirmEmail: string): Promise<void> {
    await api.delete('/privacy/account', { data: { confirmEmail } })
  },
}
