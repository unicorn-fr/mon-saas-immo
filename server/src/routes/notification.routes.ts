import { Router } from 'express'
import { notificationController } from '../controllers/notification.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get notifications
router.get('/', notificationController.getNotifications)

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount)

// Mark as read
router.put('/:id/read', notificationController.markAsRead)
router.put('/read-all', notificationController.markAllAsRead)

// Delete notifications
router.delete('/:id', notificationController.deleteNotification)
router.delete('/', notificationController.deleteAllNotifications)

export default router
