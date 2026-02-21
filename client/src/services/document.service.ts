import api from './api'
import { ContractDocument } from '../types/document.types'
import { validateAndCompressFile } from '../utils/fileUtils'

class DocumentService {
  /**
   * Upload a document for a contract (with automatic compression)
   */
  async uploadDocument(contractId: string, category: string, file: File): Promise<ContractDocument> {
    try {
      // Validate and compress the file
      const result = await validateAndCompressFile(file)

      if ('error' in result) {
        throw new Error(result.error.message)
      }

      // Convert blob to base64
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(result.blob)
      })

      // Send to server as JSON
      const response = await api.post(`/contracts/${contractId}/documents`, {
        fileName: file.name,
        fileSize: result.blob.size,
        mimeType: file.type,
        category,
        fileUrl: base64, // Base64 encoded file data
      })

      return response.data.data.document
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all documents for a contract
   */
  async getDocumentsByContract(contractId: string): Promise<ContractDocument[]> {
    try {
      const response = await api.get(`/contracts/${contractId}/documents`)
      return response.data.data.documents || []
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
      const response = await api.get(`/contracts/${contractId}/documents`)
      const documents = response.data.data.documents || []
      return {
        contractId,
        documents: documents.map((doc: ContractDocument) => ({
          category: doc.category,
          status: doc.status,
          fileName: doc.fileName,
        })),
      }
    } catch (error) {
      console.error('Error fetching checklist:', error)
      return { contractId, documents: [] }
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, contractId: string): Promise<void> {
    try {
      await api.delete(`/contracts/${contractId}/documents/${documentId}`)
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate or reject a document (admin only)
   */
  async updateDocumentStatus(
    documentId: string,
    contractId: string,
    status: 'VALIDATED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<ContractDocument> {
    try {
      let response

      if (status === 'VALIDATED') {
        response = await api.put(`/contracts/${contractId}/documents/${documentId}/validate`)
      } else {
        response = await api.put(`/contracts/${contractId}/documents/${documentId}/reject`, {
          rejectionReason,
        })
      }

      return response.data.data.document
    } catch (error) {
      throw error
    }
  }
}

export const documentService = new DocumentService()

