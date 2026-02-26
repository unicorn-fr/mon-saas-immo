import api from './api'

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

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/dossier/${id}`)
  }
}

export const dossierService = new DossierService()
