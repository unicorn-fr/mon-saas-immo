import { useNotificationStore } from '../store/notificationStore'

export const useNotifications = () => {
  const {
    notifications,
    notificationsTotal,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    addNotification,
    setError,
  } = useNotificationStore()

  return {
    // State
    notifications,
    notificationsTotal,
    unreadCount,
    isLoading,
    error,

    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    addNotification,
    setError,
  }
}
