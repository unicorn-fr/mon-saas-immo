// Notification Types
import type { PaginationMeta } from './api.types'

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  actionUrl: string | null
  metadata: any
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  pagination: PaginationMeta
}

export interface NotificationsResponse {
  success: boolean
  data: NotificationListResponse
}

export interface UnreadCountResponse {
  success: boolean
  data: {
    count: number
  }
}

export interface NotificationResponse {
  success: boolean
  message: string
  data: {
    notification: Notification
  }
}

// Notification type configurations
export const NOTIFICATION_TYPES: Record<
  string,
  {
    icon: string
    color: string
    bgColor: string
  }
> = {
  booking_new: {
    icon: '📅',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  booking_confirmed: {
    icon: '✅',
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  booking_cancelled: {
    icon: '❌',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  message_new: {
    icon: '💬',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  property_match: {
    icon: '🏠',
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  property_status: {
    icon: 'ℹ️',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
  },
  default: {
    icon: '🔔',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
  },
}
