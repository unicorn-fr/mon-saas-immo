import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2, Loader } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { Notification, NOTIFICATION_TYPES } from '../types/notification.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Layout } from '../components/layout/Layout'

type FilterMode = 'all' | 'unread'

export default function Notifications() {
  const navigate = useNavigate()
  const {
    notifications,
    notificationsTotal,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications()

  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications(1, 50, filterMode === 'unread')
  }, [filterMode, fetchNotifications])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  const handleMarkAllAsRead = async () => {
    setActionLoading('mark-all')
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      return
    }

    setActionLoading('delete-all')
    try {
      await deleteAllNotifications()
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionLoading(notificationId)
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getNotificationConfig = (type: string) => {
    return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.default
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f5f7] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1d1d1f] mb-1 flex items-center gap-3" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                  <div className="w-10 h-10 bg-[#e8f0fe] rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  Notifications
                </h1>
                <p className="text-[#515154] text-sm pl-[52px]">
                  {notificationsTotal} notification{notificationsTotal > 1 ? 's' : ''}
                  {unreadCount > 0 && (
                    <span className="ml-2 text-[#007AFF] font-semibold">
                      · {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={actionLoading === 'mark-all'}
                      className="px-4 py-2 text-sm font-semibold text-[#007AFF] hover:bg-[#e8f0fe] rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading === 'mark-all' ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCheck className="w-4 h-4" />
                      )}
                      Tout marquer comme lu
                    </button>
                  )}
                  <button
                    onClick={handleDeleteAll}
                    disabled={actionLoading === 'delete-all'}
                    className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === 'delete-all' ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Tout supprimer
                  </button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="inline-flex items-center gap-1 bg-white rounded-xl p-1 border border-[#d2d2d7] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#007AFF] text-white shadow-sm'
                    : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterMode('unread')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  filterMode === 'unread'
                    ? 'bg-[#007AFF] text-white shadow-sm'
                    : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                Non lues
                {unreadCount > 0 && (
                  <span
                    className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                      filterMode === 'unread' ? 'bg-white text-[#007AFF]' : 'bg-[#007AFF] text-white'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-7 h-7 text-[#007AFF] animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] p-12 text-center">
              <div className="w-14 h-14 bg-[#f5f5f7] border border-[#d2d2d7] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-[#86868b]" />
              </div>
              <h3 className="text-lg font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                {filterMode === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </h3>
              <p className="text-sm text-[#515154]">
                {filterMode === 'unread'
                  ? 'Vous êtes à jour ! Toutes vos notifications ont été lues.'
                  : 'Vous n\'avez pas encore de notifications.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const config = getNotificationConfig(notification.type)
                const isDeleting = actionLoading === notification.id

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    disabled={isDeleting}
                    className={`w-full p-5 bg-white rounded-2xl border transition-all text-left group ${
                      !notification.isRead
                        ? 'border-[#aacfff] bg-[#e8f0fe]/30'
                        : 'border-[#d2d2d7] hover:border-[#b0b0b8]'
                    } shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] ${
                      isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${config.bgColor}`}>
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1.5">
                          <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-[#1d1d1f]' : 'text-[#515154]'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-[#007AFF] rounded-full" title="Non lu" />
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              disabled={isDeleting}
                              className="p-1.5 text-[#86868b] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                              title="Supprimer"
                            >
                              {isDeleting ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-[#515154] mb-1.5">{notification.message}</p>
                        <p className="text-xs text-[#86868b]">
                          {format(new Date(notification.createdAt), 'PPPp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Results Count */}
          {notifications.length > 0 && (
            <div className="mt-6 text-center text-sm text-[#86868b]">
              Affichage de {notifications.length} sur {notificationsTotal} notification
              {notificationsTotal > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
