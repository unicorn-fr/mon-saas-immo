import api from './api'
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
}
