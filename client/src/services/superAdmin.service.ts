import { apiClient as api } from './api.service'

const BASE = '/super-admin'

export const superAdminService = {
  // ── Stats ───────────────────────────────────
  async getStats() {
    const res = await api.get(`${BASE}/stats`)
    return res.data.data
  },

  // ── Audit Logs ──────────────────────────────
  async getAuditLogs(params?: { page?: number; limit?: number; action?: string; severity?: string }) {
    const res = await api.get(`${BASE}/audit-logs`, { params })
    return res.data.data
  },

  // ── Users ────────────────────────────────────
  async getUsers(params?: { page?: number; limit?: number; role?: string; search?: string; emailVerified?: boolean }) {
    const res = await api.get(`${BASE}/users`, { params })
    return res.data.data
  },

  async getUserDetail(id: string) {
    const res = await api.get(`${BASE}/users/${id}`)
    return res.data.data.user
  },

  async updateUserRole(id: string, role: string) {
    const res = await api.put(`${BASE}/users/${id}/role`, { role })
    return res.data.data.user
  },

  async deleteUser(id: string) {
    await api.delete(`${BASE}/users/${id}`)
  },

  async forceVerifyEmail(id: string) {
    const res = await api.post(`${BASE}/users/${id}/verify-email`)
    return res.data.data.user
  },

  // ── Dossiers ─────────────────────────────────
  async getDossiers(params?: { page?: number; limit?: number; status?: string; category?: string }) {
    const res = await api.get(`${BASE}/dossiers`, { params })
    return res.data.data
  },

  async updateDocumentStatus(id: string, status: string, note?: string) {
    const res = await api.put(`${BASE}/dossiers/${id}/status`, { status, note })
    return res.data.data.doc
  },

  // ── DB Explorer ──────────────────────────────
  async getTableList() {
    const res = await api.get(`${BASE}/db/tables`)
    return res.data.data.tables as string[]
  },

  async queryTable(table: string, page = 1, limit = 50) {
    const res = await api.get(`${BASE}/db/tables/${table}`, { params: { page, limit } })
    return res.data.data
  },

  // ── Messages ─────────────────────────────────
  async getConversations(params?: { page?: number; limit?: number; search?: string }) {
    const res = await api.get(`${BASE}/conversations`, { params })
    return res.data.data
  },

  async getConversationMessages(id: string, page = 1) {
    const res = await api.get(`${BASE}/conversations/${id}/messages`, { params: { page } })
    return res.data.data
  },

  // ── Contracts ────────────────────────────────
  async getContracts(params?: { page?: number; limit?: number; status?: string }) {
    const res = await api.get(`${BASE}/contracts`, { params })
    return res.data.data
  },
}
