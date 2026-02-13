import { create } from 'zustand'
import { notificationService } from '../services/notification.service'
import { Notification } from '../types/notification.types'

interface NotificationStore {
  // State
  notifications: Notification[]
  notificationsTotal: number
  unreadCount: number
  isLoading: boolean
  error: string | null

  // Actions
  fetchNotifications: (page?: number, limit?: number, unreadOnly?: boolean) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
  addNotification: (notification: Notification) => void
  setError: (error: string | null) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  notificationsTotal: 0,
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Actions
  fetchNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
    set({ isLoading: true, error: null })
    try {
      const result = await notificationService.getNotifications(page, limit, unreadOnly)
      set({
        notifications: result.notifications,
        notificationsTotal: result.pagination.total,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        isLoading: false,
      })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount()
      set({ unreadCount: count })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)

      // Update local state
      const notifications = get().notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      )
      set({ notifications })

      // Decrement unread count
      const currentUnreadCount = get().unreadCount
      set({ unreadCount: Math.max(0, currentUnreadCount - 1) })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark as read',
      })
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead()

      // Update local state
      const notifications = get().notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date().toISOString(),
      }))
      set({ notifications, unreadCount: 0 })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark all as read',
      })
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)

      // Remove from local state
      const notifications = get().notifications.filter((n) => n.id !== notificationId)
      const deletedNotification = get().notifications.find((n) => n.id === notificationId)

      set({ notifications, notificationsTotal: get().notificationsTotal - 1 })

      // Decrement unread count if was unread
      if (deletedNotification && !deletedNotification.isRead) {
        const currentUnreadCount = get().unreadCount
        set({ unreadCount: Math.max(0, currentUnreadCount - 1) })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete notification',
      })
      throw error
    }
  },

  deleteAllNotifications: async () => {
    try {
      await notificationService.deleteAllNotifications()

      // Clear local state
      set({ notifications: [], notificationsTotal: 0, unreadCount: 0 })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete all notifications',
      })
      throw error
    }
  },

  addNotification: (notification: Notification) => {
    const notifications = get().notifications
    set({
      notifications: [notification, ...notifications],
      notificationsTotal: get().notificationsTotal + 1,
      unreadCount: get().unreadCount + 1,
    })
  },

  setError: (error: string | null) => set({ error }),
}))
