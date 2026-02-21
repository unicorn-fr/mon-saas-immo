import api from './api'
import { ContractDocument } from '../types/document.types'

class DocumentService {
  /**
   * Upload a document for a contract using FormData
   */
  async uploadDocument(contractId: string, category: string, file: File): Promise<ContractDocument> {
    try {
      // Validate file size (5 MB = 5242880 bytes)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum: 5 MB.`)
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('contractId', contractId)
      formData.append('category', category)

      // Upload to API
      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all documents for a contract
   */
  async getDocumentsByContract(contractId: string): Promise<ContractDocument[]> {
    try {
      const response = await api.get(`/documents/contract/${contractId}`)
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching documents:', error)
      return []
    }
  }

  /**
   * Get checklist status for a contract
   */
  async getChecklistStatus(contractId: string): Promise<{ contractId: string; documents: { category: string; status: string; fileName: string }[] }> {
    try {
      const response = await api.get(`/documents/contract/${contractId}/checklist`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching checklist:', error)
      return { contractId, documents: [] }
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await api.delete(`/documents/${documentId}`)
    } catch (error) {
      throw error
    }
  }

  /**
   * Update document status (validate or reject)
   */
  async updateDocumentStatus(
    documentId: string,
    status: 'VALIDATED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<ContractDocument> {
    try {
      const response = await api.put(`/documents/${documentId}/status`, {
        status,
        rejectionReason,
      })
      return response.data.data
    } catch (error) {
      throw error
    }
  }
}

export const documentService = new DocumentService()

