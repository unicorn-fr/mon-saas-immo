import { Router, Request, Response } from 'express'
import { messageController } from '../controllers/message.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { sseManager } from '../lib/sseManager.js'
import { verifyAccessToken } from '../utils/jwt.util.js'
import { authService } from '../services/auth.service.js'

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

// SSE — EventSource ne peut pas envoyer Authorization header → auth via query token
router.get('/stream', async (req: Request, res: Response) => {
  // Auth: header Authorization OR ?token= query param (for EventSource)
  const authHeader = req.headers.authorization
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  const queryToken = req.query.token as string | undefined
  const token = headerToken ?? queryToken

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  try {
    const decoded = verifyAccessToken(token)
    const user = await authService.getUserById(decoded.userId)
    if (!user) return res.status(401).json({ success: false, message: 'User not found' })

    req.user = { id: user.id, email: user.email, role: user.role as 'TENANT' | 'OWNER' | 'ADMIN' | 'SUPER_ADMIN' }
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide' })
  }

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
