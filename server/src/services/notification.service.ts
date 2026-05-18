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

  // ── Applications ────────────────────────────────────────────────────────────

  /** Propriétaire : nouvelle candidature reçue */
  async notifyApplicationReceived(
    ownerId: string,
    applicationId: string,
    propertyTitle: string,
    tenantName: string,
    score: number
  ) {
    return await this.createNotification({
      userId: ownerId,
      type: 'application_new',
      title: 'Nouvelle candidature',
      message: `${tenantName} a postulé pour "${propertyTitle}" (score dossier : ${score}/100)`,
      actionUrl: `/applications/manage`,
      metadata: { applicationId, propertyTitle, tenantName, score },
    })
  }

  /** Locataire : candidature approuvée ou refusée */
  async notifyApplicationStatus(
    tenantId: string,
    applicationId: string,
    propertyTitle: string,
    status: 'APPROVED' | 'REJECTED'
  ) {
    const approved = status === 'APPROVED'
    return await this.createNotification({
      userId: tenantId,
      type: approved ? 'application_approved' : 'application_rejected',
      title: approved ? 'Candidature acceptée ✓' : 'Candidature refusée',
      message: approved
        ? `Bonne nouvelle ! Votre candidature pour "${propertyTitle}" a été acceptée. Vous pouvez maintenant planifier une visite.`
        : `Votre candidature pour "${propertyTitle}" n'a pas été retenue. Continuez vos recherches !`,
      actionUrl: approved ? `/my-bookings` : `/search`,
      metadata: { applicationId, propertyTitle, status },
    })
  }

  // ── Contrats ────────────────────────────────────────────────────────────────

  /** Les deux parties ont signé — contrat COMPLETED */
  async notifyContractCompleted(
    ownerId: string,
    tenantId: string,
    contractId: string,
    propertyTitle: string
  ) {
    const msg = `Le bail pour "${propertyTitle}" a été signé par les deux parties. Il peut maintenant être activé.`
    await Promise.all([
      this.createNotification({
        userId: ownerId,
        type: 'contract_completed',
        title: 'Bail signé des deux côtés',
        message: msg,
        actionUrl: `/contracts/${contractId}`,
        metadata: { contractId, propertyTitle },
      }),
      this.createNotification({
        userId: tenantId,
        type: 'contract_completed',
        title: 'Bail signé des deux côtés',
        message: `Le bail pour "${propertyTitle}" a été signé par les deux parties. Votre location est confirmée.`,
        actionUrl: `/contracts/${contractId}`,
        metadata: { contractId, propertyTitle },
      }),
    ])
  }

  /** Propriétaire a activé le contrat (ACTIVE) */
  async notifyContractActivated(
    tenantId: string,
    contractId: string,
    propertyTitle: string
  ) {
    return await this.createNotification({
      userId: tenantId,
      type: 'contract_active',
      title: 'Contrat de location actif',
      message: `Votre contrat pour "${propertyTitle}" est maintenant actif. Bienvenue !`,
      actionUrl: `/contracts/${contractId}`,
      metadata: { contractId, propertyTitle },
    })
  }

  // ── Maintenance ──────────────────────────────────────────────────────────────

  /** Nouvelle demande de maintenance soumise */
  async notifyMaintenanceNew(
    recipientId: string,
    requestId: string,
    propertyTitle: string,
    requesterName: string,
    requestTitle: string
  ) {
    return await this.createNotification({
      userId: recipientId,
      type: 'maintenance_new',
      title: 'Nouvelle demande de maintenance',
      message: `${requesterName} a signalé un problème dans "${propertyTitle}" : ${requestTitle}`,
      actionUrl: `/owner/maintenance`,
      metadata: { requestId, propertyTitle, requesterName, requestTitle },
    })
  }

  /** Statut d'une demande de maintenance mis à jour */
  async notifyMaintenanceUpdated(
    tenantId: string,
    requestId: string,
    propertyTitle: string,
    newStatus: string
  ) {
    const statusLabel: Record<string, string> = {
      OPEN: 'ouverte',
      IN_PROGRESS: 'en cours de traitement',
      RESOLVED: 'résolue',
      CLOSED: 'clôturée',
    }
    return await this.createNotification({
      userId: tenantId,
      type: 'maintenance_updated',
      title: 'Demande de maintenance mise à jour',
      message: `Votre demande pour "${propertyTitle}" est maintenant ${statusLabel[newStatus] ?? newStatus}.`,
      actionUrl: `/tenant/maintenance`,
      metadata: { requestId, propertyTitle, newStatus },
    })
  }
}

export const notificationService = new NotificationService()
