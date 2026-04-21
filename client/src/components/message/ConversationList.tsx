import { useEffect, useState } from 'react'
import { Search, Loader, User as UserIcon, Home } from 'lucide-react'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { Conversation } from '../../types/message.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BAI } from '../../constants/bailio-tokens'

interface ConversationListProps {
  selectedConversationId: string | null
  onConversationSelect: (conversation: Conversation) => void
  autoSelectUserId?: string
  autoSelectPropertyId?: string
}

export const ConversationList = ({
  selectedConversationId,
  onConversationSelect,
  autoSelectUserId,
  autoSelectPropertyId: _autoSelectPropertyId,
}: ConversationListProps) => {
  const { user } = useAuth()
  const { conversations, isLoading, fetchConversations, pollConversations, fetchUnreadCount } =
    useMessages()
  const [search, setSearch] = useState('')
  const [autoSelected, setAutoSelected] = useState(false)

  useEffect(() => {
    fetchConversations()
    fetchUnreadCount()
  }, [fetchConversations, fetchUnreadCount])

  // Auto-select conversation with target user when conversations load
  useEffect(() => {
    if (!autoSelectUserId || autoSelected || conversations.length === 0 || !user) return
    const target = conversations.find(
      (c) => c.user1Id === autoSelectUserId || c.user2Id === autoSelectUserId
    )
    if (target) {
      setAutoSelected(true)
      onConversationSelect(target)
    }
  }, [conversations, autoSelectUserId, autoSelected, user, onConversationSelect])

  useEffect(() => {
    // 60s — avoid hammering Render (old 10s = same as timeout, causes cascading failures)
    const interval = setInterval(() => {
      pollConversations()
      fetchUnreadCount()
    }, 60000)
    return () => clearInterval(interval)
  }, [pollConversations, fetchUnreadCount])

  const getOtherUser = (conversation: Conversation) =>
    conversation.user1Id === user?.id ? conversation.user2 : conversation.user1

  const getUnreadCount = (conversation: Conversation) =>
    conversation.user1Id === user?.id
      ? conversation.unreadCountUser1
      : conversation.unreadCountUser2

  const filteredConversations = search.trim()
    ? conversations.filter((c) => {
        const other = getOtherUser(c)
        return `${other.firstName} ${other.lastName}`.toLowerCase().includes(search.toLowerCase())
      })
    : conversations

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
        <Loader className="w-5 h-5 animate-spin" style={{ color: BAI.inkFaint }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* Barre de recherche */}
      <div className="px-3 pt-4 pb-2">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: BAI.inkFaint }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-[7px] text-[13px] rounded-[10px] focus:outline-none transition-all"
            style={{
              background: BAI.bgInput,
              border: `1px solid ${BAI.border}`,
              color: BAI.ink,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6">
            <p className="text-[13px] text-center" style={{ color: BAI.inkFaint }}>
              {search.trim() ? 'Aucun résultat.' : 'Aucune conversation pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="px-2 py-1 flex flex-col gap-0.5">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation)
              const unread = getUnreadCount(conversation)
              const isSelected = conversation.id === selectedConversationId
              const initials = `${otherUser.firstName?.[0] ?? ''}${otherUser.lastName?.[0] ?? ''}`.toUpperCase()

              return (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all text-left"
                  style={{ background: isSelected ? BAI.bgMuted : 'transparent' }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = BAI.bgMuted
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
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
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold"
                        style={{ background: BAI.night, color: BAI.bgSurface }}
                      >
                        {initials || <UserIcon className="w-4 h-4" />}
                      </div>
                    )}
                    {unread > 0 && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                        style={{ background: BAI.night }}
                      >
                        <span className="text-[10px] font-bold leading-none" style={{ color: BAI.bgSurface }}>
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
                          color: BAI.ink,
                          fontWeight: unread > 0 ? 600 : 500,
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }}
                      >
                        {otherUser.firstName} {otherUser.lastName}
                      </span>
                      {conversation.lastMessageAt && (
                        <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: BAI.inkFaint }}>
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {/* Property context badge */}
                    {conversation.property && (
                      <div className="flex items-center gap-1 mb-0.5" style={{ overflow: 'hidden' }}>
                        <Home style={{ width: 10, height: 10, color: '#1b5e3b', flexShrink: 0 }} />
                        <span
                          className="text-[11px] truncate"
                          style={{ color: '#1b5e3b', fontWeight: 500 }}
                        >
                          {conversation.property.title} · {Number(conversation.property.price).toLocaleString('fr-FR')} €/mois
                        </span>
                      </div>
                    )}
                    {conversation.lastMessageText && (
                      <p
                        className="text-[12px] truncate"
                        style={{
                          color: unread > 0 ? BAI.inkMid : BAI.inkFaint,
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
