import { Conversation, Message } from '@prisma/client'
import { prisma } from '../config/database.js'

interface CreateConversationInput {
  user1Id: string
  user2Id: string
}

interface SendMessageInput {
  conversationId?: string
  receiverId: string
  content: string
  attachments?: string[]
}

interface ConversationWithLastMessage extends Conversation {
  user1: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
    email: string
  }
  user2: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
    email: string
  }
  messages: Message[]
}

interface MessageWithUsers extends Message {
  sender: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  receiver: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

class MessageService {
  /**
   * Get or create conversation between two users
   */
  private get conversationInclude() {
    return {
      user1: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
        },
      },
      user2: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    }
  }

  async getOrCreateConversation(
    user1Id: string,
    user2Id: string
  ): Promise<ConversationWithLastMessage> {
    // Ensure consistent ordering (smaller ID first)
    const [smallerId, largerId] = [user1Id, user2Id].sort()

    // Try to find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: smallerId, user2Id: largerId },
          { user1Id: largerId, user2Id: smallerId },
        ],
      },
      include: this.conversationInclude,
    })

    // Create if doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: smallerId,
          user2Id: largerId,
        },
        include: this.conversationInclude,
      })
    }

    return conversation as ConversationWithLastMessage
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ConversationWithLastMessage[]> {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: this.conversationInclude,
      orderBy: {
        lastMessageAt: 'desc',
      },
    })

    return conversations as ConversationWithLastMessage[]
  }

  /**
   * Get conversation by ID (with access check)
   */
  async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithLastMessage | null> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: this.conversationInclude,
    })

    return conversation as ConversationWithLastMessage | null
  }

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    data: SendMessageInput
  ): Promise<MessageWithUsers> {
    const { conversationId, receiverId, content, attachments = [] } = data

    // Get or create conversation
    const conversation = conversationId
      ? await this.getConversationById(conversationId, senderId)
      : await this.getOrCreateConversation(senderId, receiverId)

    if (!conversation) {
      throw new Error('Conversation not found or access denied')
    }

    // Determine actual receiverId from conversation
    const actualReceiverId =
      conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId: actualReceiverId,
        content,
        attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    // Update conversation metadata
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: content.substring(0, 100), // Truncate for preview
        // Increment unread count for receiver
        ...(actualReceiverId === conversation.user1Id
          ? { unreadCountUser1: { increment: 1 } }
          : { unreadCountUser2: { increment: 1 } }),
      },
    })

    return message as MessageWithUsers
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: MessageWithUsers[]; total: number }> {
    // Verify user has access to this conversation
    const conversation = await this.getConversationById(conversationId, userId)
    if (!conversation) {
      throw new Error('Conversation not found or access denied')
    }

    const skip = (page - 1) * limit

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: { conversationId },
      }),
    ])

    return {
      messages: messages as MessageWithUsers[],
      total,
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    // Verify user has access
    const conversation = await this.getConversationById(conversationId, userId)
    if (!conversation) {
      throw new Error('Conversation not found or access denied')
    }

    // Mark all unread messages from the other user as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    // Reset unread count for this user
    await prisma.conversation.update({
      where: { id: conversationId },
      data:
        userId === conversation.user1Id
          ? { unreadCountUser1: 0 }
          : { unreadCountUser2: 0 },
    })
  }

  /**
   * Get total unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: {
        user1Id: true,
        unreadCountUser1: true,
        unreadCountUser2: true,
      },
    })

    return conversations.reduce((total, conv) => {
      return total + (conv.user1Id === userId ? conv.unreadCountUser1 : conv.unreadCountUser2)
    }, 0)
  }

  /**
   * Delete a message (soft delete - only for sender)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      throw new Error('Message not found')
    }

    if (message.senderId !== userId) {
      throw new Error('Only the sender can delete this message')
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    })

    // Update conversation's last message if this was the last one
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId: message.conversationId },
      orderBy: { createdAt: 'desc' },
    })

    if (lastMessage) {
      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: {
          lastMessageAt: lastMessage.createdAt,
          lastMessageText: lastMessage.content.substring(0, 100),
        },
      })
    } else {
      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: {
          lastMessageAt: null,
          lastMessageText: null,
        },
      })
    }
  }

  /**
   * Search messages in user's conversations
   */
  async searchMessages(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<MessageWithUsers[]> {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: { id: true },
    })

    const conversationIds = conversations.map((c) => c.id)

    const messages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return messages as MessageWithUsers[]
  }
}

export const messageService = new MessageService()
