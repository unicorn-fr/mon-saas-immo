import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2, Loader } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { Notification, NOTIFICATION_TYPES } from '../types/notification.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Layout } from '../components/layout/Layout'
import { BAI } from '../constants/bailio-tokens'
import toast from 'react-hot-toast'

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
      toast.error('Impossible de marquer les notifications comme lues')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAll = async () => {
    setActionLoading('delete-all')
    try {
      await deleteAllNotifications()
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
      toast.error('Impossible de supprimer les notifications')
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
      toast.error('Impossible de supprimer la notification')
    } finally {
      setActionLoading(null)
    }
  }

  const getNotificationConfig = (type: string) => {
    return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.default
  }

  return (
    <Layout>
      <div className="min-h-screen py-8" style={{ background: BAI.bgBase }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: BAI.caramel,
                  margin: '0 0 4px',
                }}>
                  Compte
                </p>
                <h1 style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 'clamp(26px, 4vw, 40px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: BAI.ink,
                  margin: '0 0 6px',
                  lineHeight: 1.1,
                }}>
                  Notifications
                </h1>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
                  {notificationsTotal} notification{notificationsTotal > 1 ? 's' : ''}
                  {unreadCount > 0 && (
                    <span style={{ marginLeft: 8, color: BAI.night, fontWeight: 600 }}>
                      · {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-2 flex-shrink-0 mt-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={actionLoading === 'mark-all'}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                      style={{
                        fontFamily: BAI.fontBody,
                        fontSize: 13,
                        fontWeight: 600,
                        color: BAI.night,
                        background: 'transparent',
                        border: 'none',
                        cursor: actionLoading === 'mark-all' ? 'not-allowed' : 'pointer',
                        minHeight: BAI.touchMin,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = BAI.ownerLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                    style={{
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      fontWeight: 600,
                      color: BAI.error,
                      background: 'transparent',
                      border: 'none',
                      cursor: actionLoading === 'delete-all' ? 'not-allowed' : 'pointer',
                      minHeight: BAI.touchMin,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = BAI.errorLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
            <div
              className="inline-flex items-center gap-1 p-1"
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 12,
                boxShadow: BAI.shadowSm,
              }}
            >
              <button
                onClick={() => setFilterMode('all')}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  fontFamily: BAI.fontBody,
                  fontWeight: 600,
                  fontSize: 13,
                  background: filterMode === 'all' ? BAI.night : 'transparent',
                  color: filterMode === 'all' ? '#ffffff' : BAI.inkMid,
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 32,
                }}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterMode('unread')}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  fontFamily: BAI.fontBody,
                  fontWeight: 600,
                  fontSize: 13,
                  background: filterMode === 'unread' ? BAI.night : 'transparent',
                  color: filterMode === 'unread' ? '#ffffff' : BAI.inkMid,
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 32,
                }}
              >
                Non lues
                {unreadCount > 0 && (
                  <span
                    className="flex items-center justify-center"
                    style={{
                      minWidth: 20,
                      height: 20,
                      padding: '0 6px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 999,
                      background: filterMode === 'unread' ? '#ffffff' : BAI.night,
                      color: filterMode === 'unread' ? BAI.night : '#ffffff',
                    }}
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
              <Loader className="w-7 h-7 animate-spin" style={{ color: BAI.night }} />
            </div>
          ) : notifications.length === 0 ? (
            <div
              className="p-12 text-center"
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 16,
                boxShadow: BAI.shadowMd,
              }}
            >
              <div
                className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
                style={{
                  background: BAI.bgMuted,
                  border: `1px solid ${BAI.border}`,
                  borderRadius: 16,
                }}
              >
                <Bell className="w-7 h-7" style={{ color: BAI.inkFaint }} />
              </div>
              <h3
                className="text-lg mb-2"
                style={{ fontFamily: BAI.fontBody, fontWeight: 700, color: BAI.ink }}
              >
                {filterMode === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </h3>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>
                {filterMode === 'unread'
                  ? 'Vous êtes à jour ! Toutes vos notifications ont été lues.'
                  : "Vous n'avez pas encore de notifications."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const config = getNotificationConfig(notification.type)
                const isDeleting = actionLoading === notification.id
                const isUnread = !notification.isRead

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    disabled={isDeleting}
                    className="w-full text-left group transition-all"
                    style={{
                      padding: 20,
                      background: isUnread ? `${BAI.ownerLight}66` : BAI.bgSurface,
                      border: `1px solid ${isUnread ? BAI.ownerBorder : BAI.border}`,
                      borderRadius: 16,
                      boxShadow: BAI.shadowSm,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.5 : 1,
                      display: 'block',
                      width: '100%',
                    }}
                    onMouseEnter={e => {
                      if (!isDeleting) {
                        e.currentTarget.style.boxShadow = BAI.shadowLg
                        e.currentTarget.style.borderColor = isUnread ? BAI.ownerBorder : BAI.borderStrong
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = BAI.shadowSm
                      e.currentTarget.style.borderColor = isUnread ? BAI.ownerBorder : BAI.border
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${config.bgColor}`}>
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1.5">
                          <h4 style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 14,
                            fontWeight: 600,
                            color: isUnread ? BAI.ink : BAI.inkMid,
                            margin: 0,
                          }}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {isUnread && (
                              <div
                                className="w-2 h-2 rounded-full"
                                title="Non lu"
                                style={{ background: BAI.night }}
                              />
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              disabled={isDeleting}
                              title="Supprimer"
                              className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg disabled:opacity-50"
                              style={{
                                color: BAI.inkFaint,
                                background: 'transparent',
                                border: 'none',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                minWidth: 32,
                                minHeight: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.color = BAI.error
                                e.currentTarget.style.background = BAI.errorLight
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = BAI.inkFaint
                                e.currentTarget.style.background = 'transparent'
                              }}
                            >
                              {isDeleting ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 6px' }}>
                          {notification.message}
                        </p>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: 0 }}>
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
            <div
              className="mt-6 text-center"
              style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint }}
            >
              Affichage de {notifications.length} sur {notificationsTotal} notification
              {notificationsTotal > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
