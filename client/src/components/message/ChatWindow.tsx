import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User as UserIcon, Loader, Home } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { CreateLeaseModal } from './CreateLeaseModal'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { Conversation } from '../../types/message.types'

const POLL_INTERVAL = 5000 // 5 seconds

interface ChatWindowProps {
  conversation: Conversation
  onBack?: () => void
}

export const ChatWindow = ({ conversation, onBack }: ChatWindowProps) => {
  const { user, isOwner } = useAuth()
  const navigate = useNavigate()
  const [showLeaseModal, setShowLeaseModal] = useState(false)
  const {
    messages,
    isLoadingMessages,
    isSending,
    fetchMessages,
    pollMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
  } = useMessages()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [, setHasMarkedAsRead] = useState(false)
  const isNearBottomRef = useRef(true)
  const prevMessageCountRef = useRef(0)

  // Get other user
  const otherUser = conversation.user1Id === user?.id ? conversation.user2 : conversation.user1
  const otherUserId = conversation.user1Id === user?.id ? conversation.user2Id : conversation.user1Id

  // Track if user is scrolled near the bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
  }, [])

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id)
      setHasMarkedAsRead(false)
      isNearBottomRef.current = true
      prevMessageCountRef.current = 0
    }
  }, [conversation?.id, fetchMessages])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!conversation?.id) return

    const interval = setInterval(() => {
      pollMessages(conversation.id)
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [conversation?.id, pollMessages])

  // Mark messages as read when new messages arrive
  useEffect(() => {
    if (!conversation?.id || !user?.id || messages.length === 0) return

    const hasUnread = messages.some((m) => !m.isRead && m.receiverId === user.id)
    if (hasUnread) {
      markAsRead(conversation.id, user.id)
    }
  }, [conversation?.id, messages, markAsRead, user?.id])

  // Smart auto-scroll: only scroll when near bottom or when user sends a message
  useEffect(() => {
    const newCount = messages.length
    const prevCount = prevMessageCountRef.current
    prevMessageCountRef.current = newCount

    if (newCount > prevCount && isNearBottomRef.current) {
      // Small delay to allow DOM update
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: prevCount === 0 ? 'auto' : 'smooth' })
      })
    }
  }, [messages])

  // Handle send message
  const handleSendMessage = async (content: string, attachments?: string[]) => {
    if (!conversation?.id) return

    // Force scroll to bottom when sending
    isNearBottomRef.current = true

    await sendMessage({
      conversationId: conversation.id,
      receiverId: otherUserId,
      content,
      attachments,
    })
  }

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Etes-vous sur de vouloir supprimer ce message ?')) {
      try {
        await deleteMessage(messageId)
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }
  }

  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped: { [key: string]: typeof messages } = {}

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(message)
    })

    return grouped
  }

  const groupedMessages = groupMessagesByDate()

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-white">
        {/* Back Button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* User Info */}
        <div className="flex items-center gap-3 flex-1">
          {otherUser.avatar ? (
            <img
              src={otherUser.avatar}
              alt={`${otherUser.firstName} ${otherUser.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {otherUser.firstName} {otherUser.lastName}
            </h3>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowLeaseModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Mettre en location</span>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <UserIcon className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Commencez la conversation</h3>
            <p className="text-sm text-gray-600">
              Envoyez votre premier message a {otherUser.firstName}
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-6">
                  <div className="px-4 py-1.5 bg-white rounded-full shadow-sm border">
                    <span className="text-xs font-medium text-gray-600">{date}</span>
                  </div>
                </div>

                {/* Messages for this date */}
                {dateMessages.map((message, index) => {
                  const isOwn = message.senderId === user?.id
                  const previousMessage = dateMessages[index - 1]
                  const showAvatar =
                    !previousMessage || previousMessage.senderId !== message.senderId

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      onDelete={isOwn ? handleDeleteMessage : undefined}
                    />
                  )
                })}
              </div>
            ))}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <MessageInput onSend={handleSendMessage} isSending={isSending} />

      {/* Create Lease Modal */}
      {isOwner && (
        <CreateLeaseModal
          isOpen={showLeaseModal}
          onClose={() => setShowLeaseModal(false)}
          tenantId={otherUserId}
          tenantName={`${otherUser.firstName} ${otherUser.lastName}`}
          onSuccess={(contractId) => navigate(`/contracts/${contractId}`)}
        />
      )}
    </div>
  )
}
