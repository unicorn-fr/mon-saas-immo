import { useState } from 'react'
import { ConversationList } from '../components/message/ConversationList'
import { ChatWindow } from '../components/message/ChatWindow'
import { CreateLeaseModal } from '../components/message/CreateLeaseModal'
import { ContractActivityFeed } from '../components/message/ContractActivityFeed'
import { Conversation } from '../types/message.types'
import { MessageSquare, FolderOpen, Home, FileText } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'

const M = {
  ink:      '#0d0c0a',
  inkMid:   '#5a5754',
  inkFaint: '#9e9b96',
  border:   '#e4e1db',
  muted:    '#f4f2ee',
  surface:  '#ffffff',
  owner:    '#1a3270',
  ownerL:   '#eaf0fb',
  ownerB:   '#b8ccf0',
  tenant:   '#1b5e3b',
  tenantL:  '#edf7f2',
  night:    '#1a1a2e',
}

export default function Messages() {
  const { user, isOwner } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const openWithUserId: string | undefined = (location.state as any)?.openWithUserId
  const openWithPropertyId: string | undefined = (location.state as any)?.propertyId
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showLeaseModal, setShowLeaseModal] = useState(false)

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setIsMobileView(true)
  }

  const handleBack = () => {
    setIsMobileView(false)
  }

  const otherUser = selectedConversation
    ? selectedConversation.user1Id === user?.id
      ? selectedConversation.user2
      : selectedConversation.user1
    : null
  const otherUserId = selectedConversation
    ? selectedConversation.user1Id === user?.id
      ? selectedConversation.user2Id
      : selectedConversation.user1Id
    : null

  const otherInitials = otherUser
    ? `${otherUser.firstName?.[0] ?? ''}${otherUser.lastName?.[0] ?? ''}`.toUpperCase()
    : ''

  return (
    <Layout>
      <div
        className="h-full overflow-hidden flex"
        style={{ backgroundColor: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >

        {/* Conversation list — left panel */}
        <div
          className={`w-full lg:w-[300px] flex-shrink-0 flex flex-col ${isMobileView ? 'hidden lg:flex' : 'flex'}`}
          style={{ background: M.surface, borderRight: `1px solid ${M.border}` }}
        >
          <ConversationList
            selectedConversationId={selectedConversation?.id || null}
            onConversationSelect={handleConversationSelect}
            autoSelectUserId={openWithUserId}
            autoSelectPropertyId={openWithPropertyId}
          />
        </div>

        {/* Chat window */}
        <div
          className={`flex-1 overflow-hidden ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}
          style={{ background: '#fafaf8' }}
        >
          {selectedConversation ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Owner CTA bar — visible on all screen sizes */}
              {isOwner && otherUserId && (
                <div
                  className="flex items-center justify-between flex-shrink-0 xl:hidden"
                  style={{
                    padding: '8px 16px',
                    background: M.surface,
                    borderBottom: `1px solid ${M.border}`,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 12, color: M.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      Vous discutez avec{' '}
                      <span style={{ color: M.ink, fontWeight: 500 }}>
                        {otherUser?.firstName} {otherUser?.lastName}
                      </span>
                    </p>
                    {selectedConversation?.property && (
                      <p style={{ fontSize: 11, color: M.tenant, fontWeight: 500, fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 1 }}>
                        <Home style={{ display: 'inline', width: 10, height: 10, marginRight: 3 }} />
                        {selectedConversation.property.title} · {Number(selectedConversation.property.price).toLocaleString('fr-FR')} €/mois
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowLeaseModal(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 7,
                      background: M.night, color: '#ffffff',
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontWeight: 500, fontSize: 12,
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    <FileText style={{ width: 12, height: 12 }} />
                    Créer un contrat
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <ChatWindow conversation={selectedConversation} onBack={handleBack} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: M.muted, border: `1px solid ${M.border}`, boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)' }}
              >
                <MessageSquare className="w-7 h-7" strokeWidth={1.5} style={{ color: M.inkFaint }} />
              </div>
              <div className="text-center">
                <p className="mb-1.5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontStyle: 'italic', fontSize: '22px', color: M.ink }}>
                  Vos messages
                </p>
                <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', color: M.inkFaint, maxWidth: '210px', lineHeight: '1.6' }}>
                  Sélectionnez une conversation pour commencer à échanger.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right info panel — visible on xl+ when a conversation is selected */}
        {selectedConversation && otherUser && (
          <div
            className="hidden xl:flex flex-col flex-shrink-0"
            style={{ width: 240, background: M.surface, borderLeft: `1px solid ${M.border}` }}
          >
            {/* Header */}
            <div className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${M.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: 12 }}>
                Interlocuteur
              </p>

              {/* Avatar */}
              <div className="flex flex-col items-center gap-2 mb-4">
                {otherUser.avatar ? (
                  <img src={otherUser.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-bold"
                    style={{ background: isOwner ? M.tenantL : M.ownerL, color: isOwner ? M.tenant : M.owner }}
                  >
                    {otherInitials}
                  </div>
                )}
                <div className="text-center">
                  <p className="font-semibold text-[14px]" style={{ color: M.ink }}>
                    {otherUser.firstName} {otherUser.lastName}
                  </p>
                  <span
                    className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={
                      isOwner
                        ? { background: M.tenantL, color: M.tenant, border: `1px solid #9fd4ba` }
                        : { background: M.ownerL, color: M.owner, border: `1px solid ${M.ownerB}` }
                    }
                  >
                    {isOwner ? 'Locataire' : 'Propriétaire'}
                  </span>
                </div>
              </div>

              {/* Property context card */}
              {selectedConversation?.property && (
                <div
                  className="mb-4 rounded-lg overflow-hidden cursor-pointer"
                  style={{ border: `1px solid ${M.border}`, background: M.muted }}
                  onClick={() => navigate(`/property/${selectedConversation.property!.id}`)}
                >
                  {selectedConversation.property.images?.[0] && (
                    <img
                      src={selectedConversation.property.images[0]}
                      alt={selectedConversation.property.title}
                      style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div className="p-2">
                    <p style={{ fontSize: 11, fontWeight: 600, color: M.ink, lineHeight: 1.3, marginBottom: 2 }} className="truncate">
                      {selectedConversation.property.title}
                    </p>
                    <p style={{ fontSize: 11, color: M.tenant, fontWeight: 600 }}>
                      {Number(selectedConversation.property.price).toLocaleString('fr-FR')} €/mois
                    </p>
                    <p style={{ fontSize: 10, color: M.inkFaint }}>
                      {selectedConversation.property.city}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex flex-col gap-2">
                {isOwner && (
                  <button
                    onClick={() => navigate(`/owner/tenants/${otherUserId}`)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ background: M.ownerL, color: M.owner, border: `1px solid ${M.ownerB}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#d4e4f7')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = M.ownerL)}
                  >
                    <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    Voir le dossier
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => setShowLeaseModal(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ background: M.night, color: '#fff' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a4e')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = M.night)}
                  >
                    <Home className="w-3.5 h-3.5 flex-shrink-0" />
                    Mettre en location
                  </button>
                )}
                {!isOwner && (
                  <button
                    onClick={() => navigate('/search')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ background: M.tenantL, color: M.tenant, border: `1px solid #9fd4ba` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#d4ede3')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = M.tenantL)}
                  >
                    <Home className="w-3.5 h-3.5 flex-shrink-0" />
                    Voir les annonces
                  </button>
                )}
              </div>
            </div>

            {/* Activité contrat */}
            <div className="p-4 flex-1 overflow-y-auto">
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: 12 }}>
                Suivi du contrat
              </p>
              {otherUserId && (
                <ContractActivityFeed otherUserId={otherUserId} />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${M.border}` }}>
              <p style={{ fontSize: 10, color: M.inkFaint, lineHeight: 1.5, textAlign: 'center' }}>
                Chiffré TLS · Hébergé en France
              </p>
            </div>
          </div>
        )}

      </div>

      {/* CreateLeaseModal — déclenché depuis le panneau droit */}
      {isOwner && otherUser && otherUserId && (
        <CreateLeaseModal
          isOpen={showLeaseModal}
          onClose={() => setShowLeaseModal(false)}
          tenantId={otherUserId}
          tenantName={`${otherUser.firstName} ${otherUser.lastName}`}
          onSuccess={(contractId) => { setShowLeaseModal(false); navigate(`/contracts/${contractId}`) }}
        />
      )}
    </Layout>
  )
}
