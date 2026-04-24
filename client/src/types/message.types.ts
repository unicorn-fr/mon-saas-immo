// Message Types
import type { PaginationMeta } from './api.types'
import type { User as AuthUser } from './auth.types'

// UserPreview — version allégée pour les contextes messagerie/conversation
export type UserPreview = Pick<AuthUser, 'id' | 'firstName' | 'lastName' | 'avatar'> & { email?: string }
/** @deprecated Utilise UserPreview — conservé pour compatibilité */
export type User = UserPreview

export interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  attachments: string[]
  isRead: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
  sender: User
  receiver: User
}

export interface ConversationProperty {
  id: string
  title: string
  price: number
  city: string
  images: string[]
}

export interface Conversation {
  id: string
  user1Id: string
  user2Id: string
  lastMessageAt: string | null
  lastMessageText: string | null
  unreadCountUser1: number
  unreadCountUser2: number
  createdAt: string
  updatedAt: string
  user1: User
  user2: User
  messages: Message[]
  propertyId?: string | null
  property?: ConversationProperty | null
}

export interface ConversationListItem extends Conversation {
  otherUser: User
  unreadCount: number
  lastMessage: Message | null
}

// API Request/Response Types

export interface SendMessageInput {
  conversationId?: string
  receiverId?: string
  content: string
  attachments?: string[]
}

export interface CreateConversationInput {
  recipientId: string
}

export interface MessageListResponse {
  messages: Message[]
  pagination: PaginationMeta
}

export interface ConversationResponse {
  success: boolean
  data: {
    conversation: Conversation
  }
}

export interface ConversationsResponse {
  success: boolean
  data: {
    conversations: Conversation[]
  }
}

export interface MessagesResponse {
  success: boolean
  data: MessageListResponse
}

export interface SendMessageResponse {
  success: boolean
  message: string
  data: {
    message: Message
  }
}

export interface UnreadCountResponse {
  success: boolean
  data: {
    count: number
  }
}

// WebSocket/Real-time Event Types

export interface MessageEvent {
  type: 'message:new' | 'message:read' | 'message:deleted' | 'conversation:new'
  data: Message | Conversation | { conversationId: string; messageIds: string[] }
}

export interface TypingEvent {
  conversationId: string
  userId: string
  isTyping: boolean
}

export interface OnlineStatusEvent {
  userId: string
  isOnline: boolean
  lastSeen: string
}
