import { apiClient, handleApiError } from './api.service'
import {
  Conversation,
  Message,
  SendMessageInput,
  CreateConversationInput,
  ConversationResponse,
  ConversationsResponse,
  MessagesResponse,
  SendMessageResponse,
  UnreadCountResponse,
} from '../types/message.types'

class MessageService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<ConversationsResponse>('/messages/conversations')
      return response.data.data.conversations
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string): Promise<Conversation> {
    try {
      const response = await apiClient.get<ConversationResponse>(
        `/messages/conversations/${id}`
      )
      return response.data.data.conversation
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Create or get conversation with another user
   */
  async createConversation(data: CreateConversationInput): Promise<Conversation> {
    try {
      const response = await apiClient.post<ConversationResponse>(
        '/messages/conversations',
        data
      )
      return response.data.data.conversation
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: Message[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }> {
    try {
      const response = await apiClient.get<MessagesResponse>(
        `/messages/conversations/${conversationId}/messages`,
        {
          params: { page, limit },
        }
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Send a message
   */
  async sendMessage(data: SendMessageInput): Promise<Message> {
    try {
      const response = await apiClient.post<SendMessageResponse>('/messages', data)
      return response.data.data.message
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Mark messages in a conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await apiClient.put(`/messages/conversations/${conversationId}/read`)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get total unread message count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<UnreadCountResponse>('/messages/unread-count')
      return response.data.data.count
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`/messages/${messageId}`)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, limit: number = 20): Promise<Message[]> {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: { messages: Message[] }
      }>('/messages/search', {
        params: { q: query, limit },
      })
      return response.data.data.messages
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export const messageService = new MessageService()
