import { useEffect, useState, useRef } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { Notification, NOTIFICATION_TYPES } from '../../types/notification.types'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const NotificationBell = () => {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    deleteNotification,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUnreadCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, 10)
    }
  }, [isOpen, fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
    setIsOpen(false)
  }

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationConfig = (type: string) => {
    return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.default
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl transition-colors"
        style={{ color: '#5a5754' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f4f2ee'; (e.currentTarget as HTMLButtonElement).style.color = '#0d0c0a' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#5a5754' }}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl z-50 max-h-[32rem] flex flex-col" style={{ border: '1px solid #e4e1db' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e4e1db' }}>
            <h3 className="font-semibold" style={{ color: '#0d0c0a' }}>Notifications</h3>
            <button
              onClick={() => navigate('/notifications')}
              className="text-sm font-medium"
              style={{ color: '#1a1a2e' }}
            >
              Voir tout
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: '#ccc9c3' }} />
                <p style={{ color: '#5a5754' }}>Aucune notification</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const config = getNotificationConfig(notification.type)
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full p-4 flex items-start gap-3 transition-colors border-b last:border-b-0 text-left"
                    style={{
                      background: !notification.isRead ? '#eaf0fb' : 'transparent',
                      borderColor: '#e4e1db',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${config.bgColor}`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4
                          className="text-sm font-semibold truncate"
                          style={{ color: !notification.isRead ? '#0d0c0a' : '#5a5754' }}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0 ml-2 mt-1" style={{ background: '#1a1a2e' }} />
                        )}
                      </div>
                      <p className="text-sm line-clamp-2 mb-1" style={{ color: '#5a5754' }}>
                        {notification.message}
                      </p>
                      <p className="text-xs" style={{ color: '#9e9b96' }}>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="p-1 transition-colors flex-shrink-0"
                      style={{ color: '#9e9b96' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#9b1c1c')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9e9b96')}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t" style={{ borderColor: '#e4e1db', background: '#fafaf8' }}>
              <button
                onClick={() => {
                  navigate('/notifications')
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ color: '#1a1a2e' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f4f2ee')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
