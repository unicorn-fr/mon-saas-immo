import { apiClient as api } from './api.service'
import { PlatformStatistics, AdminUser, RecentActivity } from '../types/admin.types'

interface UsersResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
}

export const adminService = {
  /**
   * Get platform statistics
   */
  async getPlatformStatistics(): Promise<PlatformStatistics> {
    const response = await api.get('/admin/statistics')
    return response.data.data.statistics
  },

  /**
   * Get all users
   */
  async getUsers(params?: {
    role?: string
    emailVerified?: boolean
    searchQuery?: string
    page?: number
    limit?: number
  }): Promise<UsersResponse> {
    const response = await api.get('/admin/users', { params })
    return response.data.data
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<any> {
    const response = await api.get(`/admin/users/${id}`)
    return response.data.data.user
  },

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: string): Promise<AdminUser> {
    const response = await api.put(`/admin/users/${id}/role`, { role })
    return response.data.data.user
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`)
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 20): Promise<RecentActivity> {
    const response = await api.get('/admin/activity', { params: { limit } })
    return response.data.data.activity
  },

  /**
   * List all fraud reports (signalements)
   */
  async getReports(page = 1, limit = 30): Promise<{
    reports: FraudReport[]
    total: number
    page: number
    pages: number
  }> {
    const response = await api.get('/admin/reports', { params: { page, limit } })
    return response.data.data
  },

  /**
   * Update a report's status
   */
  async updateReport(id: string, status: string, reviewNote?: string): Promise<void> {
    await api.patch(`/admin/reports/${id}`, { status, reviewNote })
  },
}

export interface FraudReport {
  id: string
  reporterId: string
  reporter: { id: string; firstName: string; lastName: string; email: string }
  targetId: string
  target: { id: string; firstName: string; lastName: string; email: string }
  propertyId: string | null
  property: { id: string; title: string; city: string; address: string } | null
  reason: string
  details: string | null
  status: string
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
}
