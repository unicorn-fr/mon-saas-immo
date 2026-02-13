import { PrismaClient, Notification } from '@prisma/client'

const prisma = new PrismaClient()

interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  message: string
  actionUrl?: string
  metadata?: any
}

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationInput): Promise<Notification> {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
      },
    })
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    return { notifications, total }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new Error('Notification not found')
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized')
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new Error('Notification not found')
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized')
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    })
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { userId },
    })
  }

  // ============================================
  // HELPER METHODS FOR CREATING SPECIFIC NOTIFICATIONS
  // ============================================

  /**
   * Notify owner of new booking
   */
  async notifyNewBooking(ownerId: string, bookingId: string, propertyTitle: string, tenantName: string) {
    return await this.createNotification({
      userId: ownerId,
      type: 'booking_new',
      title: 'Nouvelle demande de visite',
      message: `${tenantName} souhaite visiter votre bien "${propertyTitle}"`,
      actionUrl: `/bookings/manage`,
      metadata: { bookingId, propertyTitle, tenantName },
    })
  }

  /**
   * Notify tenant of booking confirmation
   */
  async notifyBookingConfirmed(tenantId: string, bookingId: string, propertyTitle: string) {
    return await this.createNotification({
      userId: tenantId,
      type: 'booking_confirmed',
      title: 'Visite confirmée',
      message: `Votre visite pour "${propertyTitle}" a été confirmée`,
      actionUrl: `/my-bookings`,
      metadata: { bookingId, propertyTitle },
    })
  }

  /**
   * Notify of booking cancellation
   */
  async notifyBookingCancelled(
    userId: string,
    bookingId: string,
    propertyTitle: string,
    cancelledBy: 'owner' | 'tenant'
  ) {
    return await this.createNotification({
      userId,
      type: 'booking_cancelled',
      title: 'Visite annulée',
      message: `La visite pour "${propertyTitle}" a été annulée par ${
        cancelledBy === 'owner' ? 'le propriétaire' : 'le locataire'
      }`,
      actionUrl: cancelledBy === 'tenant' ? `/bookings/manage` : `/my-bookings`,
      metadata: { bookingId, propertyTitle, cancelledBy },
    })
  }

  /**
   * Notify of new message
   */
  async notifyNewMessage(receiverId: string, senderName: string, conversationId: string) {
    return await this.createNotification({
      userId: receiverId,
      type: 'message_new',
      title: 'Nouveau message',
      message: `${senderName} vous a envoyé un message`,
      actionUrl: `/messages`,
      metadata: { conversationId, senderName },
    })
  }

  /**
   * Notify tenant of new property matching preferences
   */
  async notifyNewPropertyMatch(tenantId: string, propertyId: string, propertyTitle: string) {
    return await this.createNotification({
      userId: tenantId,
      type: 'property_match',
      title: 'Nouveau bien disponible',
      message: `Un bien correspondant à vos critères est disponible: "${propertyTitle}"`,
      actionUrl: `/property/${propertyId}`,
      metadata: { propertyId, propertyTitle },
    })
  }

  /**
   * Notify of property status change
   */
  async notifyPropertyStatusChange(
    userId: string,
    propertyId: string,
    propertyTitle: string,
    newStatus: string
  ) {
    return await this.createNotification({
      userId,
      type: 'property_status',
      title: 'Statut de bien mis à jour',
      message: `Le statut de "${propertyTitle}" a été changé en ${newStatus}`,
      actionUrl: `/properties/${propertyId}`,
      metadata: { propertyId, propertyTitle, newStatus },
    })
  }
}

export const notificationService = new NotificationService()
