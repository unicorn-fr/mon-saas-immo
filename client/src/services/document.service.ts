import api from './api'
import { ContractDocument } from '../types/document.types'

class DocumentService {
  /**
   * Upload a document for a contract
   */
  async uploadDocument(contractId: string, category: string, file: File): Promise<ContractDocument> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('contractId', contractId)
    formData.append('category', category)

    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  }

  /**
   * Get all documents for a contract
   */
  async getDocumentsByContract(contractId: string): Promise<ContractDocument[]> {
    const response = await api.get(`/documents/contract/${contractId}`)
    return response.data.data
  }

  /**
   * Get checklist status for a contract
   */
  async getChecklistStatus(contractId: string): Promise<{ contractId: string; documents: { category: string; status: string; fileName: string }[] }> {
    const response = await api.get(`/documents/contract/${contractId}/checklist`)
    return response.data.data
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`)
  }

  /**
   * Validate or reject a document (owner only)
   */
  async updateDocumentStatus(documentId: string, status: 'VALIDATED' | 'REJECTED', rejectionReason?: string): Promise<ContractDocument> {
    const response = await api.put(`/documents/${documentId}/status`, { status, rejectionReason })
    return response.data.data
  }
}

export const documentService = new DocumentService()
