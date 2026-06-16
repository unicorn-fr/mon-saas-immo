import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Trash2, Loader } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { Notification, NOTIFICATION_TYPES } from '../types/notification.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
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
    <>      {/* ── Dark Hero ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#0a0d1a',
          padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,48px) clamp(40px,6vw,60px)',
        }}
      >
        <div style={{ maxWidth: 896, margin: '0 auto' }}>

          {/* Top row: title left + actions right */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">

            {/* Left: overline + title + count badge */}
            <div className="flex-1">
              <p
                style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: BAI.caramel,
                  margin: '0 0 6px',
                }}
              >
                Compte
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <h1
                  style={{
                    fontFamily: BAI.fontDisplay,
                    fontSize: 'clamp(28px,5vw,40px)',
                    fontWeight: 700,
                    fontStyle: 'italic',
                    color: '#ffffff',
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  Notifications
                </h1>
                {/* Unread count badge — glass on dark */}
                {unreadCount > 0 && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(20px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                      border: '1px solid rgba(255,255,255,0.13)',
                      borderRadius: '999px',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: BAI.caramel }}
                    />
                    <span
                      style={{
                        fontFamily: BAI.fontBody,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              <p
                style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.45)',
                  margin: '8px 0 0',
                }}
              >
                {notificationsTotal} notification{notificationsTotal > 1 ? 's' : ''}
              </p>
            </div>

            {/* Right: action buttons */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={actionLoading === 'mark-all'}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                    style={{
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.8)',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.13)',
                      cursor: actionLoading === 'mark-all' ? 'not-allowed' : 'pointer',
                      minHeight: BAI.touchMin,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  >
                    {actionLoading === 'mark-all' ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCheck className="w-4 h-4" />
                    )}
                    Tout marquer
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
                    color: 'rgba(252,165,165,0.85)',
                    background: 'rgba(153,27,27,0.2)',
                    border: '1px solid rgba(252,165,165,0.2)',
                    cursor: actionLoading === 'delete-all' ? 'not-allowed' : 'pointer',
                    minHeight: BAI.touchMin,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(153,27,27,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(153,27,27,0.2)')}
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

          {/* Filter tabs — glass pill on dark bg */}
          <div className="mt-8">
            <div
              className="inline-flex items-center gap-1 p-1"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
              }}
            >
              <button
                onClick={() => setFilterMode('all')}
                className="px-4 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  fontFamily: BAI.fontBody,
                  fontWeight: 600,
                  fontSize: 13,
                  background: filterMode === 'all' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: filterMode === 'all' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  border: filterMode === 'all' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  minHeight: 32,
                }}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterMode('unread')}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  fontFamily: BAI.fontBody,
                  fontWeight: 600,
                  fontSize: 13,
                  background: filterMode === 'unread' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: filterMode === 'unread' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  border: filterMode === 'unread' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
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
                      background: filterMode === 'unread' ? BAI.caramel : 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notification list on bgBase ─────────────────────────────────── */}
      <div
        className="py-8"
        style={{ background: BAI.bgBase, minHeight: '50vh' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

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
              {notifications.map((notification, i) => {
                const config = getNotificationConfig(notification.type)
                const isDeleting = actionLoading === notification.id
                const isUnread = !notification.isRead

                return (
                  <motion.button
                    key={notification.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    whileHover={{ y: -1 }}
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
                  </motion.button>
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
    </>  )
}
