import { useEffect } from 'react'
import { Search, Loader, User as UserIcon } from 'lucide-react'
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
  const { conversations, isLoading, fetchConversations, pollConversations, fetchUnreadCount } =
    useMessages()

  useEffect(() => {
    fetchConversations()
    fetchUnreadCount()
  }, [fetchConversations, fetchUnreadCount])

  useEffect(() => {
    const interval = setInterval(() => {
      pollConversations()
      fetchUnreadCount()
    }, 10000)
    return () => clearInterval(interval)
  }, [pollConversations, fetchUnreadCount])

  const getOtherUser = (conversation: Conversation) =>
    conversation.user1Id === user?.id ? conversation.user2 : conversation.user1

  const getUnreadCount = (conversation: Conversation) =>
    conversation.user1Id === user?.id
      ? conversation.unreadCountUser1
      : conversation.unreadCountUser2

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const diffInHours = (Date.now() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) return format(date, 'HH:mm')
    if (diffInHours < 168) return format(date, 'EEEE', { locale: fr })
    return format(date, 'dd/MM/yy')
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Barre de recherche ─────────────────────────────── */}
      <div className="px-3 pt-4 pb-2">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-[7px] text-[13px] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-violet-500/25 transition-all"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* ── Liste ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6">
            <p className="text-[13px] text-center" style={{ color: 'var(--text-tertiary)' }}>
              Aucune conversation pour le moment.
            </p>
          </div>
        ) : (
          <div className="px-2 py-1 flex flex-col gap-0.5">
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation)
              const unread = getUnreadCount(conversation)
              const isSelected = conversation.id === selectedConversationId
              const initials = `${otherUser.firstName?.[0] ?? ''}${otherUser.lastName?.[0] ?? ''}`.toUpperCase()

              return (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all text-left"
                  style={{
                    backgroundColor: isSelected ? 'var(--surface-subtle)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {otherUser.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={initials}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
                      >
                        {initials || <UserIcon className="w-4 h-4" />}
                      </div>
                    )}
                    {unread > 0 && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#7c3aed' }}
                      >
                        <span className="text-[10px] font-bold text-white leading-none">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span
                        className="text-[13.5px] truncate"
                        style={{
                          color: 'var(--text-primary)',
                          fontWeight: unread > 0 ? 600 : 500,
                        }}
                      >
                        {otherUser.firstName} {otherUser.lastName}
                      </span>
                      {conversation.lastMessageAt && (
                        <span
                          className="text-[11px] flex-shrink-0 ml-2"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessageText && (
                      <p
                        className="text-[12px] truncate"
                        style={{
                          color: unread > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                          fontWeight: unread > 0 ? 500 : 400,
                        }}
                      >
                        {conversation.lastMessageText}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
