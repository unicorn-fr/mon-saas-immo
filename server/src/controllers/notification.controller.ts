import { Request, Response } from 'express'
import { notificationService } from '../services/notification.service.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

class NotificationController {
  /**
   * GET /api/v1/notifications
   * Get user notifications with pagination
   */
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const unreadOnly = req.query.unreadOnly === 'true'

      if (limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit cannot exceed 100',
        })
      }

      const result = await notificationService.getUserNotifications(
        userId,
        page,
        limit,
        unreadOnly
      )

      res.status(200).json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        },
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
      })
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notification count
   */
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id

      const count = await notificationService.getUnreadCount(userId)

      res.status(200).json({
        success: true,
        data: { count },
      })
    } catch (error) {
      console.error('Error fetching unread count:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
      })
    }
  }

  /**
   * PUT /api/v1/notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params

      const notification = await notificationService.markAsRead(id, userId)

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: { notification },
      })
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      if (error.message === 'Notification not found') {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        })
      }
      if (error.message === 'Unauthorized') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
        })
      }
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
      })
    }
  }

  /**
   * PUT /api/v1/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id

      await notificationService.markAllAsRead(userId)

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
      })
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   * Delete a notification
   */
  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params

      await notificationService.deleteNotification(id, userId)

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting notification:', error)
      if (error.message === 'Notification not found') {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        })
      }
      if (error.message === 'Unauthorized') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
        })
      }
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
      })
    }
  }

  /**
   * DELETE /api/v1/notifications
   * Delete all notifications
   */
  async deleteAllNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id

      await notificationService.deleteAllNotifications(userId)

      res.status(200).json({
        success: true,
        message: 'All notifications deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete all notifications',
      })
    }
  }
}

export const notificationController = new NotificationController()
