import { Request, Response } from 'express'
import { messageService } from '../services/message.service'
import { AuthRequest } from '../middlewares/auth.middleware.js'

class MessageController {
  /**
   * GET /api/v1/messages/conversations
   * Get all conversations for the authenticated user
   */
  async getConversations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id

      const conversations = await messageService.getUserConversations(userId)

      res.status(200).json({
        success: true,
        data: { conversations },
      })
    } catch (error) {
      console.error('Error fetching conversations:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
      })
    }
  }

  /**
   * GET /api/v1/messages/conversations/:id
   * Get conversation by ID
   */
  async getConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params

      const conversation = await messageService.getConversationById(id, userId)

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        })
      }

      res.status(200).json({
        success: true,
        data: { conversation },
      })
    } catch (error) {
      console.error('Error fetching conversation:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation',
      })
    }
  }

  /**
   * POST /api/v1/messages/conversations
   * Create or get conversation with another user
   */
  async createConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { recipientId } = req.body

      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: 'Recipient ID is required',
        })
      }

      if (recipientId === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create conversation with yourself',
        })
      }

      const conversation = await messageService.getOrCreateConversation(userId, recipientId)

      res.status(200).json({
        success: true,
        data: { conversation },
      })
    } catch (error) {
      console.error('Error creating conversation:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create conversation',
      })
    }
  }

  /**
   * GET /api/v1/messages/conversations/:id/messages
   * Get messages for a conversation
   */
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50

      if (limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit cannot exceed 100',
        })
      }

      const result = await messageService.getConversationMessages(id, userId, page, limit)

      res.status(200).json({
        success: true,
        data: {
          messages: result.messages,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        },
      })
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      if (error.message === 'Conversation not found or access denied') {
        return res.status(404).json({
          success: false,
          message: error.message,
        })
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
      })
    }
  }

  /**
   * POST /api/v1/messages
   * Send a message
   */
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { conversationId, receiverId, content, attachments } = req.body

      // Validation
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required',
        })
      }

      if (content.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Message content cannot exceed 5000 characters',
        })
      }

      if (!conversationId && !receiverId) {
        return res.status(400).json({
          success: false,
          message: 'Either conversationId or receiverId is required',
        })
      }

      if (attachments && (!Array.isArray(attachments) || attachments.length > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Attachments must be an array with maximum 5 items',
        })
      }

      const message = await messageService.sendMessage(userId, {
        conversationId,
        receiverId,
        content: content.trim(),
        attachments,
      })

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message },
      })
    } catch (error: any) {
      console.error('Error sending message:', error)
      if (error.message === 'Conversation not found or access denied') {
        return res.status(404).json({
          success: false,
          message: error.message,
        })
      }
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
      })
    }
  }

  /**
   * PUT /api/v1/messages/conversations/:id/read
   * Mark messages as read
   */
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params

      await messageService.markMessagesAsRead(id, userId)

      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
      })
    } catch (error: any) {
      console.error('Error marking messages as read:', error)
      if (error.message === 'Conversation not found or access denied') {
        return res.status(404).json({
          success: false,
          message: error.message,
        })
      }
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
      })
    }
  }

  /**
   * GET /api/v1/messages/unread-count
   * Get total unread message count
   */
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id

      const count = await messageService.getUnreadCount(userId)

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
   * DELETE /api/v1/messages/:id
   * Delete a message
   */
  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { id } = req.params

      await messageService.deleteMessage(id, userId)

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting message:', error)
      if (error.message === 'Message not found' || error.message.includes('sender')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        })
      }
      res.status(500).json({
        success: false,
        message: 'Failed to delete message',
      })
    }
  }

  /**
   * GET /api/v1/messages/search
   * Search messages
   */
  async searchMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id
      const { q } = req.query

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        })
      }

      if (q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
        })
      }

      const limit = parseInt(req.query.limit as string) || 20

      const messages = await messageService.searchMessages(userId, q, limit)

      res.status(200).json({
        success: true,
        data: { messages },
      })
    } catch (error) {
      console.error('Error searching messages:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to search messages',
      })
    }
  }
}

export const messageController = new MessageController()
