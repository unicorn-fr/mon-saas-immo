// Message Types

export interface User {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  email?: string
}

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
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
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
