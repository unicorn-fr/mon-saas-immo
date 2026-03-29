import { Router, Request, Response } from 'express'
import { messageController } from '../controllers/message.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { sseManager } from '../lib/sseManager.js'

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

// SSE — connexion temps réel (remplace le polling 5s)
// Le token JWT peut être passé dans le header Authorization OU dans ?token=xxx
router.get('/stream', authenticate, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  sseManager.add(req.user!.id, res)

  // Ping toutes les 25s pour maintenir la connexion
  const heartbeat = setInterval(() => {
    if (!res.destroyed) res.write(':ping\n\n')
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    sseManager.remove(req.user!.id)
  })
})

export default router
