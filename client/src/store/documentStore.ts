import { create } from 'zustand'
import { documentService } from '../services/document.service'
import { ContractDocument } from '../types/document.types'

interface DocumentState {
  documents: ContractDocument[]
  isLoading: boolean
  error: string | null

  fetchDocuments: (contractId: string) => Promise<void>
  uploadDocument: (contractId: string, category: string, file: File) => Promise<ContractDocument>
  deleteDocument: (documentId: string) => Promise<void>
  updateDocumentStatus: (documentId: string, status: 'VALIDATED' | 'REJECTED', rejectionReason?: string) => Promise<void>
  clearDocuments: () => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  isLoading: false,
  error: null,

  fetchDocuments: async (contractId: string) => {
    set({ isLoading: true, error: null })
    try {
      const documents = await documentService.getDocumentsByContract(contractId)
      set({ documents, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors du chargement des documents',
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
      set({
        error: error.response?.data?.message || 'Erreur lors du telechargement',
        isLoading: false,
      })
      throw error
    }
  },

  deleteDocument: async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId)
      set((state) => ({
        documents: state.documents.filter(d => d.id !== documentId),
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors de la suppression',
      })
      throw error
    }
  },

  updateDocumentStatus: async (documentId: string, status: 'VALIDATED' | 'REJECTED', rejectionReason?: string) => {
    try {
      const updated = await documentService.updateDocumentStatus(documentId, status, rejectionReason)
      set((state) => ({
        documents: state.documents.map(d => d.id === documentId ? updated : d),
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors de la mise a jour',
      })
      throw error
    }
  },

  clearDocuments: () => set({ documents: [], error: null }),
}))
