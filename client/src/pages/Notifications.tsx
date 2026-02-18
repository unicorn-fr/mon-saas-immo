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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Bell className="w-8 h-8 text-primary-600" />
                Notifications
              </h1>
              <p className="text-gray-600">
                {notificationsTotal} notification{notificationsTotal > 1 ? 's' : ''}
                {unreadCount > 0 && (
                  <span className="ml-2 text-primary-600 font-medium">
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
                    className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border inline-flex">
            <button
              onClick={() => setFilterMode('all')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  filterMode === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                ${
                  filterMode === 'unread'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              Non lues
              {unreadCount > 0 && (
                <span
                  className={`
                    flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full
                    ${filterMode === 'unread' ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}
                  `}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterMode === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </h3>
            <p className="text-gray-600">
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
                  className={`
                    w-full p-5 bg-white rounded-xl shadow-sm border transition-all hover:shadow-md text-left
                    ${!notification.isRead ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200'}
                    ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${config.bgColor}`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4
                          className={`text-base font-semibold ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {!notification.isRead && (
                            <div
                              className="w-2.5 h-2.5 bg-primary-600 rounded-full"
                              title="Non lu"
                            />
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            disabled={isDeleting}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {isDeleting ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">
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
          <div className="mt-6 text-center text-sm text-gray-600">
            Affichage de {notifications.length} sur {notificationsTotal} notification
            {notificationsTotal > 1 ? 's' : ''}
          </div>
        )}
        </div>
      </div>
    </Layout>
  )
}
