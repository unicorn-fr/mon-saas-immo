import { create } from 'zustand'
import { messageService } from '../services/message.service'
import {
  Conversation,
  Message,
  SendMessageInput,
} from '../types/message.types'

interface MessageStore {
  // State
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  messagesTotal: number
  unreadCount: number
  isLoading: boolean
  isLoadingMessages: boolean
  isSending: boolean
  error: string | null

  // Actions
  fetchConversations: () => Promise<void>
  pollConversations: () => Promise<void>
  fetchConversationById: (id: string) => Promise<void>
  createConversation: (recipientId: string) => Promise<Conversation>
  fetchMessages: (conversationId: string, page?: number, limit?: number) => Promise<void>
  pollMessages: (conversationId: string) => Promise<void>
  sendMessage: (data: SendMessageInput) => Promise<Message>
  markAsRead: (conversationId: string, currentUserId?: string) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  searchMessages: (query: string) => Promise<Message[]>
  setCurrentConversation: (conversation: Conversation | null) => void
  addMessageOptimistic: (message: Message) => void
  setError: (error: string | null) => void
  clearMessages: () => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  messages: [],
  messagesTotal: 0,
  unreadCount: 0,
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,

  // Actions
  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const conversations = await messageService.getConversations()
      set({ conversations, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
        isLoading: false,
      })
    }
  },

  pollConversations: async () => {
    try {
      const conversations = await messageService.getConversations()
      set({ conversations })
    } catch {
      // Silent fail for polling
    }
  },

  fetchConversationById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const conversation = await messageService.getConversationById(id)
      set({ currentConversation: conversation, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch conversation',
        isLoading: false,
      })
    }
  },

  createConversation: async (recipientId: string) => {
    set({ isLoading: true, error: null })
    try {
      const conversation = await messageService.createConversation({ recipientId })

      // Add to conversations list if not exists
      const conversations = get().conversations
      const exists = conversations.find((c) => c.id === conversation.id)
      if (!exists) {
        set({ conversations: [conversation, ...conversations] })
      }

      set({ currentConversation: conversation, isLoading: false })
      return conversation
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create conversation',
        isLoading: false,
      })
      throw error
    }
  },

  fetchMessages: async (conversationId: string, page = 1, limit = 50) => {
    set({ isLoadingMessages: true, error: null })
    try {
      const result = await messageService.getMessages(conversationId, page, limit)

      // Reverse messages to show oldest first in the UI
      const messages = [...result.messages].reverse()

      // If page 1, replace. Otherwise, append (for pagination/infinite scroll)
      if (page === 1) {
        set({
          messages,
          messagesTotal: result.pagination.total,
          isLoadingMessages: false,
        })
      } else {
        set({
          messages: [...messages, ...get().messages],
          messagesTotal: result.pagination.total,
          isLoadingMessages: false,
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        isLoadingMessages: false,
      })
    }
  },

  pollMessages: async (conversationId: string) => {
    try {
      const result = await messageService.getMessages(conversationId, 1, 50)
      const fetched = [...result.messages].reverse()

      const currentMessages = get().messages
      const existingIds = new Set(currentMessages.map((m) => m.id))
      const newMessages = fetched.filter((m) => !existingIds.has(m.id))

      // Also detect deleted messages
      const fetchedIds = new Set(fetched.map((m) => m.id))
      const remainingMessages = currentMessages.filter((m) => fetchedIds.has(m.id))

      if (newMessages.length > 0 || remainingMessages.length !== currentMessages.length) {
        set({
          messages: [...remainingMessages, ...newMessages],
          messagesTotal: result.pagination.total,
        })
      }
    } catch {
      // Silent fail for polling
    }
  },

  sendMessage: async (data: SendMessageInput) => {
    set({ isSending: true, error: null })
    try {
      const message = await messageService.sendMessage(data)

      // Add to messages list
      const messages = get().messages
      set({
        messages: [...messages, message],
        isSending: false,
      })

      // Update conversation's last message
      const conversations = get().conversations.map((c) =>
        c.id === message.conversationId
          ? {
              ...c,
              lastMessageAt: message.createdAt,
              lastMessageText: message.content,
              messages: [message],
            }
          : c
      )
      set({ conversations })

      return message
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
        isSending: false,
      })
      throw error
    }
  },

  markAsRead: async (conversationId: string, currentUserId?: string) => {
    try {
      await messageService.markAsRead(conversationId)

      // Update local state - mark messages where the current user is the receiver
      const messages = get().messages.map((m) =>
        m.conversationId === conversationId && !m.isRead && m.receiverId === currentUserId
          ? { ...m, isRead: true, readAt: new Date().toISOString() }
          : m
      )
      set({ messages })

      // Update conversation unread count
      const currentConversation = get().currentConversation
      if (currentConversation && currentConversation.id === conversationId && currentUserId) {
        set({
          currentConversation: {
            ...currentConversation,
            unreadCountUser1: currentConversation.user1Id === currentUserId ? 0 : currentConversation.unreadCountUser1,
            unreadCountUser2: currentConversation.user2Id === currentUserId ? 0 : currentConversation.unreadCountUser2,
          },
        })
      }

      // Update conversations list unread count
      if (currentUserId) {
        const conversations = get().conversations.map((c) => {
          if (c.id !== conversationId) return c
          return {
            ...c,
            unreadCountUser1: c.user1Id === currentUserId ? 0 : c.unreadCountUser1,
            unreadCountUser2: c.user2Id === currentUserId ? 0 : c.unreadCountUser2,
          }
        })
        set({ conversations })
      }

      // Refresh unread count
      get().fetchUnreadCount()
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await messageService.getUnreadCount()
      set({ unreadCount: count })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await messageService.deleteMessage(messageId)

      // Remove from messages list
      const messages = get().messages.filter((m) => m.id !== messageId)
      set({ messages })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete message',
      })
      throw error
    }
  },

  searchMessages: async (query: string) => {
    set({ isLoading: true, error: null })
    try {
      const messages = await messageService.searchMessages(query)
      set({ isLoading: false })
      return messages
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search messages',
        isLoading: false,
      })
      throw error
    }
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation })
  },

  addMessageOptimistic: (message: Message) => {
    const messages = get().messages
    set({ messages: [...messages, message] })
  },

  setError: (error: string | null) => set({ error }),

  clearMessages: () =>
    set({
      messages: [],
      messagesTotal: 0,
      currentConversation: null,
    }),
}))
