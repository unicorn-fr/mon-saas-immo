import { create } from 'zustand'
import { documentService } from '../services/document.service'
import { ContractDocument } from '../types/document.types'

interface DocumentState {
  documents: ContractDocument[]
  isLoading: boolean
  error: string | null
  contractId: string | null

  fetchDocuments: (contractId: string) => Promise<void>
  uploadDocument: (contractId: string, category: string, file: File) => Promise<ContractDocument>
  deleteDocument: (contractId: string, documentId: string) => Promise<void>
  updateDocumentStatus: (contractId: string, documentId: string, status: 'VALIDATED' | 'REJECTED', rejectionReason?: string) => Promise<void>
  clearDocuments: () => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  isLoading: false,
  error: null,
  contractId: null,

  fetchDocuments: async (contractId: string) => {
    set({ isLoading: true, error: null, contractId })
    try {
      const documents = await documentService.getDocumentsByContract(contractId)
      set({ documents, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Erreur lors du chargement des documents',
        isLoading: false,
      })
    }
  },

  uploadDocument: async (contractId: string, category: string, file: File) => {
    set({ isLoading: true, error: null })
    try {
      const doc = await documentService.uploadDocument(contractId, category, file)
      set((state) => ({
        documents: [doc, ...state.documents.filter(d => d.category !== category)],
        isLoading: false,
      }))
      return doc
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || 'Erreur lors du telechargement'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  deleteDocument: async (contractId: string, documentId: string) => {
    try {
      await documentService.deleteDocument(documentId, contractId)
      set((state) => ({
        documents: state.documents.filter(d => d.id !== documentId),
      }))
    } catch (error: any) {
      set({
        error: error.message || error.response?.data?.message || 'Erreur lors de la suppression',
      })
      throw error
    }
  },

  updateDocumentStatus: async (contractId: string, documentId: string, status: 'VALIDATED' | 'REJECTED', rejectionReason?: string) => {
    try {
      const updated = await documentService.updateDocumentStatus(documentId, contractId, status, rejectionReason)
      set((state) => ({
        documents: state.documents.map(d => d.id === documentId ? updated : d),
      }))
    } catch (error: any) {
      set({
        error: error.message || error.response?.data?.message || 'Erreur lors de la mise a jour',
      })
      throw error
    }
  },

  clearDocuments: () => set({ documents: [], error: null, contractId: null }),
}))

