import { useEffect } from 'react'
import { MessageSquare, Search, Loader, User as UserIcon } from 'lucide-react'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { Conversation } from '../../types/message.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ConversationListProps {
  selectedConversationId: string | null
  onConversationSelect: (conversation: Conversation) => void
}

export const ConversationList = ({
  selectedConversationId,
  onConversationSelect,
}: ConversationListProps) => {
  const { user } = useAuth()
  const { conversations, unreadCount, isLoading, fetchConversations, fetchUnreadCount } =
    useMessages()

  useEffect(() => {
    fetchConversations()
    fetchUnreadCount()
  }, [fetchConversations, fetchUnreadCount])

  // Get other user in conversation
  const getOtherUser = (conversation: Conversation) => {
    return conversation.user1Id === user?.id ? conversation.user2 : conversation.user1
  }

  // Get unread count for current user
  const getUnreadCount = (conversation: Conversation) => {
    return conversation.user1Id === user?.id
      ? conversation.unreadCountUser1
      : conversation.unreadCountUser2
  }

  // Format timestamp
  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return format(date, 'HH:mm')
    } else if (diffInHours < 24 * 7) {
      return format(date, 'EEEE', { locale: fr })
    } else {
      return format(date, 'dd/MM/yy')
    }
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary-600 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune conversation
            </h3>
            <p className="text-sm text-gray-600">
              Commencez une conversation en contactant un propriétaire
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherUser(conversation)
            const unread = getUnreadCount(conversation)
            const isSelected = conversation.id === selectedConversationId

            return (
              <button
                key={conversation.id}
                onClick={() => onConversationSelect(conversation)}
                className={`
                  w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b
                  ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-600' : 'border-l-4 border-l-transparent'}
                `}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {otherUser.avatar ? (
                    <img
                      src={otherUser.avatar}
                      alt={`${otherUser.firstName} ${otherUser.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-primary-600" />
                    </div>
                  )}
                  {unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        unread > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {otherUser.firstName} {otherUser.lastName}
                    </h4>
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessageText && (
                    <p
                      className={`text-sm truncate ${
                        unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}
                    >
                      {conversation.lastMessageText}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
