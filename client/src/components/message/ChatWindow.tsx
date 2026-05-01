import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User as UserIcon, Loader, Home, FolderOpen, ShieldCheck, X, CalendarCheck } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { CreateLeaseModal } from './CreateLeaseModal'
import { ProposeRdvModal, type RdvProposal, type RdvSlot } from './ProposeRdvModal'
import { MaintenanceDetectedPanel, detectMaintenanceCategory } from './MaintenanceDetectedPanel'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { shareApi } from '../../services/dossier.service'
import { bookingService } from '../../services/booking.service'
import { propertyService } from '../../services/property.service'
import { Conversation } from '../../types/message.types'
import toast from 'react-hot-toast'

// SSE replaces polling — kept for fallback reference only
// const POLL_INTERVAL = 5000

interface ChatWindowProps {
  conversation: Conversation
  onBack?: () => void
}

export const ChatWindow = ({ conversation, onBack }: ChatWindowProps) => {
  const { user, isOwner } = useAuth()
  const navigate = useNavigate()
  const [showLeaseModal, setShowLeaseModal] = useState(false)
  const [showRdvModal, setShowRdvModal] = useState(false)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
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
  const hasPromptedRef = useRef(false)

  const [maintenancePanelInfo, setMaintenancePanelInfo] = useState<{
    messageId: string
    category: string
    propertyId: string
    propertyCity: string
    propertyLatitude?: number | null
    propertyLongitude?: number | null
  } | null>(null)
  const [dismissedMaintenanceIds, setDismissedMaintenanceIds] = useState<Set<string>>(new Set())

  const otherUser = conversation.user1Id === user?.id ? conversation.user2 : conversation.user1
  const otherUserId = conversation.user1Id === user?.id ? conversation.user2Id : conversation.user1Id

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
  }, [])

  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id)
      setHasMarkedAsRead(false)
      isNearBottomRef.current = true
      prevMessageCountRef.current = 0
      hasPromptedRef.current = false
      setShowSharePrompt(false)
    }
  }, [conversation?.id, fetchMessages])

  // SSE — connexion temps réel (remplace le polling 5s)
  useEffect(() => {
    if (!conversation?.id) return

    const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const eventSource = new EventSource(`${API_URL}/messages/stream`, {
      withCredentials: true,
    })

    eventSource.addEventListener('new_message', (e: MessageEvent) => {
      const newMsg = JSON.parse(e.data as string) as {
        conversationId: string
        id: string
        senderId: string
        content: string
        createdAt: string
      }
      if (newMsg.conversationId === conversation.id) {
        // Déclenche un re-fetch léger pour récupérer le message complet
        pollMessages(conversation.id)
      }
    })

    eventSource.onerror = () => {
      // La reconnexion automatique est gérée par le navigateur (EventSource)
      console.warn('[SSE] Connexion perdue, reconnexion automatique...')
    }

    return () => eventSource.close()
  }, [conversation?.id, pollMessages])

  useEffect(() => {
    if (!conversation?.id || !user?.id || messages.length === 0) return
    const hasUnread = messages.some((m) => !m.isRead && m.receiverId === user.id)
    if (hasUnread) {
      markAsRead(conversation.id, user.id)
    }
  }, [conversation?.id, messages, markAsRead, user?.id])

  useEffect(() => {
    const newCount = messages.length
    const prevCount = prevMessageCountRef.current
    prevMessageCountRef.current = newCount
    if (newCount > prevCount && isNearBottomRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: prevCount === 0 ? 'auto' : 'smooth' })
      })
    }
  }, [messages])

  // Auto-detect maintenance keywords in the last received message (owner side only)
  useEffect(() => {
    if (!isOwner || !messages.length) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.senderId === user?.id) return
    if (dismissedMaintenanceIds.has(lastMsg.id)) return

    const category = detectMaintenanceCategory(lastMsg.content)
    if (!category) return

    const prop = conversation?.property
    if (!prop) return

    setMaintenancePanelInfo({
      messageId: lastMsg.id,
      category,
      propertyId: prop.id,
      propertyCity: prop.city,
      propertyLatitude: null,
      propertyLongitude: null,
    })

    propertyService.getPropertyById(prop.id).then(full => {
      setMaintenancePanelInfo(prev =>
        prev?.messageId === lastMsg.id
          ? { ...prev, propertyLatitude: full.latitude ?? null, propertyLongitude: full.longitude ?? null }
          : prev
      )
    }).catch(() => {})
  }, [messages, isOwner, user?.id, conversation?.property, dismissedMaintenanceIds])

  const handleSendMessage = async (content: string, attachments?: string[]) => {
    if (!conversation?.id) return
    isNearBottomRef.current = true

    await sendMessage({
      conversationId: conversation.id,
      receiverId: otherUserId,
      content,
      attachments,
    })

    // After first message sent by tenant → ask about sharing dossier
    if (!isOwner && !hasPromptedRef.current) {
      const hasSentBefore = messages.some((m) => m.senderId === user?.id)
      if (!hasSentBefore) {
        hasPromptedRef.current = true
        setShowSharePrompt(true)
      }
    }
  }

  const handleShareDossier = async () => {
    setIsSharing(true)
    try {
      await shareApi.grantShare(otherUserId, undefined, 30)
    } catch {
      // silent — share may already exist
    } finally {
      setIsSharing(false)
      setShowSharePrompt(false)
    }
  }

  const handleSendRdvProposal = async (proposal: RdvProposal) => {
    if (!conversation?.id) return
    isNearBottomRef.current = true
    await sendMessage({
      conversationId: conversation.id,
      receiverId: otherUserId,
      content: JSON.stringify(proposal),
    })
  }

  const handleRdvSlotSelect = async (slot: RdvSlot, propertyId: string, duration: number) => {
    if (!conversation?.id) return
    try {
      const booking = await bookingService.createBooking({
        propertyId,
        visitDate: slot.date,
        visitTime: slot.time,
        duration,
      })
      // Find property title from the RDV proposal message
      const proposalMsg = messages.find(m => {
        try { const p = JSON.parse(m.content); return p.__rdv === 'proposal' && p.propertyId === propertyId } catch { return false }
      })
      const propertyTitle = proposalMsg ? JSON.parse(proposalMsg.content).propertyTitle : propertyId

      isNearBottomRef.current = true
      await sendMessage({
        conversationId: conversation.id,
        receiverId: otherUserId,
        content: JSON.stringify({
          __rdv: 'confirmed',
          propertyId,
          propertyTitle,
          date: slot.date,
          time: slot.time,
          duration,
          bookingId: booking.id,
        }),
      })
      toast.success('Visite confirmée ! Rendez-vous ajouté à votre calendrier.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la réservation')
      throw err
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Etes-vous sur de vouloir supprimer ce message ?')) {
      try {
        await deleteMessage(messageId)
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }
  }

  const groupMessagesByDate = () => {
    const grouped: { [key: string]: typeof messages } = {}
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(message)
    })
    return grouped
  }

  const groupedMessages = groupMessagesByDate()

  return (
    <div className="flex flex-col h-full relative" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b"
        style={{ background: '#ffffff', borderColor: '#e4e1db' }}>
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden flex items-center justify-center rounded-xl transition-colors"
            style={{ color: '#5a5754', minWidth: 44, minHeight: 44 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f2ee')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#eaf0fb' }}>
              <UserIcon className="w-5 h-5" style={{ color: '#1a3270' }} />
            </div>
          )}
          <div>
            <h3 className="font-semibold" style={{ color: '#0d0c0a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {otherUser.firstName} {otherUser.lastName}
            </h3>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/owner/tenants/${otherUserId}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: '#eaf0fb', border: '1px solid #b8ccf0', color: '#1a3270' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#d4e4f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#eaf0fb')}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Voir le dossier</span>
            </button>
            <button
              onClick={() => setShowRdvModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: '#edf7f2', border: '1px solid #9fd4ba', color: '#1b5e3b' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#d4eedf')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#edf7f2')}
            >
              <CalendarCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Proposer un RDV</span>
            </button>
            <button
              onClick={() => setShowLeaseModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-opacity text-sm font-medium hover:opacity-90"
              style={{ background: '#1a1a2e', color: '#ffffff' }}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Mettre en location</span>
            </button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
        style={{ background: '#fafaf8' }}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-8 h-8 animate-spin" style={{ color: '#1a3270' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#eaf0fb' }}>
              <UserIcon className="w-10 h-10" style={{ color: '#1a3270' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2"
              style={{ color: '#0d0c0a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Commencez la conversation
            </h3>
            <p className="text-sm" style={{ color: '#5a5754' }}>
              Envoyez votre premier message a {otherUser.firstName}
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-6">
                  <div className="px-4 py-1.5 rounded-full"
                    style={{ background: '#ffffff', border: '1px solid #e4e1db', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
                    <span className="text-xs font-medium" style={{ color: '#5a5754' }}>{date}</span>
                  </div>
                </div>

                {dateMessages.map((message, index) => {
                  const isOwn = message.senderId === user?.id
                  const previousMessage = dateMessages[index - 1]
                  const showAvatar =
                    !previousMessage || previousMessage.senderId !== message.senderId

                  return (
                    <div key={message.id}>
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onDelete={isOwn ? handleDeleteMessage : undefined}
                        onRdvSlotSelect={!isOwner ? handleRdvSlotSelect : undefined}
                      />
                      {maintenancePanelInfo?.messageId === message.id && !dismissedMaintenanceIds.has(message.id) && (
                        <MaintenanceDetectedPanel
                          category={maintenancePanelInfo.category}
                          propertyId={maintenancePanelInfo.propertyId}
                          propertyCity={maintenancePanelInfo.propertyCity}
                          propertyLatitude={maintenancePanelInfo.propertyLatitude}
                          propertyLongitude={maintenancePanelInfo.propertyLongitude}
                          onDismiss={() => {
                            setDismissedMaintenanceIds(prev => new Set([...prev, message.id]))
                            setMaintenancePanelInfo(null)
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <MessageInput onSend={handleSendMessage} isSending={isSending} />

      {isOwner && (
        <>
          <CreateLeaseModal
            isOpen={showLeaseModal}
            onClose={() => setShowLeaseModal(false)}
            tenantId={otherUserId}
            tenantName={`${otherUser.firstName} ${otherUser.lastName}`}
            onSuccess={(contractId) => navigate(`/contracts/${contractId}`)}
          />
          <ProposeRdvModal
            isOpen={showRdvModal}
            onClose={() => setShowRdvModal(false)}
            onSubmit={handleSendRdvProposal}
          />
        </>
      )}

      {/* Share dossier prompt — tenant side, first message only */}
      {showSharePrompt && !isOwner && (
        <div
          className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(13,12,10,0.45)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: '#ffffff',
              boxShadow: '0 20px 60px rgba(13,12,10,0.18)',
              border: '1px solid #e4e1db',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#eaf0fb' }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: '#1a3270' }} />
                </div>
                <div>
                  <p className="font-semibold text-[14px]" style={{ color: '#0d0c0a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    Partager votre dossier ?
                  </p>
                  <p className="text-[12px]" style={{ color: '#9e9b96' }}>
                    avec {otherUser.firstName} {otherUser.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSharePrompt(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: '#9e9b96' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f2ee')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <p className="text-[12px] leading-relaxed" style={{ color: '#5a5754' }}>
              Vos documents seront <strong>intégralement filigranés</strong> à votre nom.
              Le propriétaire peut consulter mais <strong>ne peut pas télécharger</strong>.
              Accès limité à 30 jours, révocable depuis « Contrôle d'accès ».
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleShareDossier}
                disabled={isSharing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition-opacity disabled:opacity-60"
                style={{ background: '#1b5e3b', color: '#ffffff' }}
              >
                {isSharing ? 'Partage…' : <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Oui, partager
                </>}
              </button>
              <button
                onClick={() => setShowSharePrompt(false)}
                disabled={isSharing}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                style={{ background: '#f4f2ee', color: '#5a5754', border: '1px solid #e4e1db' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e5e0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f4f2ee')}
              >
                Non merci
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
