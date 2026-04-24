import { apiClient } from './api.service'

export interface EdlSession {
  id: string
  contractId: string
  pin: string
  ownerId: string
  tenantId: string | null
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED'
  edlType: 'ENTREE' | 'SORTIE'
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
  owner?: { id: string; firstName: string; lastName: string }
  tenant?: { id: string; firstName: string; lastName: string } | null
  contract?: { id: string; propertyId: string; property?: { title: string; address: string } }
}

class EdlService {
  /** Owner : crée ou récupère la session EDL d'un contrat */
  async createSession(contractId: string, edlType: 'ENTREE' | 'SORTIE' = 'ENTREE'): Promise<EdlSession> {
    const { data } = await apiClient.post('/edl/sessions', { contractId, edlType })
    return data.data.session as EdlSession
  }

  /** Locataire : rejoindre via PIN */
  async joinSession(pin: string): Promise<EdlSession> {
    const { data } = await apiClient.post('/edl/sessions/join', { pin })
    return data.data.session as EdlSession
  }

  /** Récupère la session par son ID */
  async getSession(sessionId: string): Promise<EdlSession> {
    const { data } = await apiClient.get(`/edl/sessions/${sessionId}`)
    return data.data.session as EdlSession
  }

  /** Récupère la session par contractId */
  async getSessionByContract(contractId: string): Promise<EdlSession | null> {
    const { data } = await apiClient.get(`/edl/sessions/by-contract/${contractId}`)
    return data.data.session as EdlSession | null
  }

  /** Met à jour un champ de l'EDL (patch partiel) */
  async updateData(sessionId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await apiClient.patch(`/edl/sessions/${sessionId}/data`, { patch })
    return data.data.data as Record<string, unknown>
  }

  /** Enregistre la signature d'une partie — finalise automatiquement si les 2 ont signé */
  async signSession(sessionId: string, signatureBase64: string): Promise<{
    session: EdlSession
    ownerSigned: boolean
    tenantSigned: boolean
    bothSigned: boolean
  }> {
    const { data } = await apiClient.post(`/edl/sessions/${sessionId}/sign`, { signatureBase64 })
    return data.data
  }

  /** Finalise la session (compat) */
  async completeSession(sessionId: string): Promise<EdlSession> {
    const { data } = await apiClient.post(`/edl/sessions/${sessionId}/complete`)
    return data.data.session as EdlSession
  }

  /** Ouvre un flux SSE et appelle onMessage à chaque événement */
  connectStream(sessionId: string, onMessage: (event: Record<string, unknown>) => void): () => void {
    const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    // EventSource ne peut pas envoyer Authorization header → token via query param
    const token = localStorage.getItem('accessToken') ?? ''
    const source = new EventSource(`${API_URL}/edl/sessions/${sessionId}/stream?token=${encodeURIComponent(token)}`)

    source.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data as string)) } catch { /* ignore */ }
    }

    source.onerror = () => {
      console.warn('[EDL SSE] Reconnexion automatique…')
    }

    return () => source.close()
  }
}

export const edlService = new EdlService()
