import { Router } from 'express'
import { messageController } from '../controllers/message.controller'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Conversations
router.get('/conversations', messageController.getConversations.bind(messageController))
router.get('/conversations/:id', messageController.getConversation.bind(messageController))
router.post('/conversations', messageController.createConversation.bind(messageController))
router.get('/conversations/:id/messages', messageController.getMessages.bind(messageController))
router.put('/conversations/:id/read', messageController.markAsRead.bind(messageController))

// Messages
router.post('/', messageController.sendMessage.bind(messageController))
router.delete('/:id', messageController.deleteMessage.bind(messageController))

// Utility
router.get('/unread-count', messageController.getUnreadCount.bind(messageController))
router.get('/search', messageController.searchMessages.bind(messageController))

export default router
