import { apiClient, handleApiError } from './api.service'
import {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
  NotificationResponse,
} from '../types/notification.types'

class NotificationService {
  /**
   * Get user notifications
   */
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{
    notifications: Notification[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }> {
    try {
      const response = await apiClient.get<NotificationsResponse>('/notifications', {
        params: { page, limit, unreadOnly },
      })
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
      return response.data.data.count
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await apiClient.put<NotificationResponse>(
        `/notifications/${notificationId}/read`
      )
      return response.data.data.notification
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.put('/notifications/read-all')
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${notificationId}`)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<void> {
    try {
      await apiClient.delete('/notifications')
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export const notificationService = new NotificationService()
