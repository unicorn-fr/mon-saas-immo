import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConversationList } from '../components/message/ConversationList'
import { ChatWindow } from '../components/message/ChatWindow'
import { CreateLeaseModal } from '../components/message/CreateLeaseModal'
import { ContractActivityFeed } from '../components/message/ContractActivityFeed'
import { Conversation } from '../types/message.types'
import { MessageSquare, FolderOpen, Home, FileText } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'

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
    <>      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22 }}
        className="h-full overflow-hidden flex flex-col md:flex-row"
        style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody }}
      >

        {/* ── Colonne gauche — liste conversations (30%) ───────────────── */}
        <div
          className={`w-full md:w-[300px] flex-shrink-0 flex flex-col ${isMobileView ? 'hidden md:flex' : 'flex'}`}
          style={{
            background: BAI.bgSurface,
            borderRight: `1px solid ${BAI.border}`,
          }}
        >
          <ConversationList
            selectedConversationId={selectedConversation?.id || null}
            onConversationSelect={handleConversationSelect}
            autoSelectUserId={openWithUserId}
            autoSelectPropertyId={openWithPropertyId}
          />
        </div>

        {/* ── Colonne centrale — thread actif ──────────────────────────── */}
        <div
          className={`flex-1 overflow-hidden ${isMobileView ? 'flex' : 'hidden md:flex'}`}
          style={{ background: BAI.bgBase }}
        >
          {selectedConversation ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* CTA barre bailleur — visible mobile/tablet, caché xl */}
              {isOwner && otherUserId && (
                <div
                  className="flex items-center justify-between flex-shrink-0 xl:hidden"
                  style={{
                    padding: '10px 16px',
                    background: BAI.bgSurface,
                    borderBottom: `1px solid ${BAI.border}`,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 12, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
                      Vous discutez avec{' '}
                      <span style={{ color: BAI.ink, fontWeight: 600 }}>
                        {otherUser?.firstName} {otherUser?.lastName}
                      </span>
                    </p>
                    {selectedConversation?.property && (
                      <p style={{ fontSize: 11, color: BAI.tenant, fontWeight: 600, fontFamily: BAI.fontBody, marginTop: 2 }}>
                        <Home style={{ display: 'inline', width: 10, height: 10, marginRight: 3 }} />
                        {selectedConversation.property.title} · {Number(selectedConversation.property.price).toLocaleString('fr-FR')} €/mois
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowLeaseModal(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8,
                      background: BAI.night, color: '#ffffff',
                      fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 12,
                      border: 'none', cursor: 'pointer', minHeight: 36,
                    }}
                  >
                    <FileText style={{ width: 13, height: 13 }} />
                    Créer un contrat
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <ChatWindow conversation={selectedConversation} onBack={handleBack} />
              </div>
            </div>
          ) : (
            /* ── Empty state ────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center w-full h-full gap-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28 }}
                style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                  boxShadow: BAI.shadowMd,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <MessageSquare size={26} strokeWidth={1.5} style={{ color: BAI.inkFaint }} />
              </motion.div>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic',
                  fontSize: 'clamp(18px,2.5vw,22px)', color: BAI.ink,
                  marginBottom: 6,
                }}>
                  Vos messages
                </p>
                <p style={{
                  fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint,
                  maxWidth: 210, lineHeight: 1.6, margin: '0 auto',
                }}>
                  Sélectionnez une conversation pour commencer à échanger.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Panneau droit — infos interlocuteur (xl+) ────────────────── */}
        {selectedConversation && otherUser && (
          <div
            className="hidden xl:flex flex-col flex-shrink-0"
            style={{ width: 248, background: BAI.bgSurface, borderLeft: `1px solid ${BAI.border}` }}
          >
            {/* Header */}
            <div className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BAI.border}` }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 14,
              }}>
                Interlocuteur
              </p>

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 mb-4">
                {otherUser.avatar ? (
                  <img src={otherUser.avatar} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700,
                    background: isOwner ? BAI.tenantLight : BAI.ownerLight,
                    color: isOwner ? BAI.tenant : BAI.owner,
                  }}>
                    {otherInitials}
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink, marginBottom: 4 }}>
                    {otherUser.firstName} {otherUser.lastName}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                    padding: '3px 10px', borderRadius: 20,
                    ...(isOwner
                      ? { background: BAI.tenantLight, color: BAI.tenant, border: `1px solid ${BAI.tenantBorder}` }
                      : { background: BAI.ownerLight, color: BAI.owner, border: `1px solid ${BAI.ownerBorder}` }
                    ),
                  }}>
                    {isOwner ? 'Locataire' : 'Propriétaire'}
                  </span>
                </div>
              </div>

              {/* Carte bien lié */}
              {selectedConversation?.property && (
                <div
                  style={{
                    marginBottom: 16, borderRadius: 10, overflow: 'hidden',
                    border: `1px solid ${BAI.border}`, background: BAI.bgMuted,
                    cursor: 'pointer',
                  }}
                  onClick={() => { if (selectedConversation.property?.id) navigate(`/property/${selectedConversation.property.id}`) }}
                >
                  {selectedConversation.property.images?.[0] && (
                    <img
                      src={selectedConversation.property.images[0]}
                      alt={selectedConversation.property.title}
                      style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: BAI.ink, lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedConversation.property.title}
                    </p>
                    <p style={{ fontSize: 11, color: BAI.tenant, fontWeight: 700 }}>
                      {Number(selectedConversation.property.price).toLocaleString('fr-FR')} €/mois
                    </p>
                    <p style={{ fontSize: 10, color: BAI.inkFaint }}>
                      {selectedConversation.property.city}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions rapides */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isOwner && (
                  <button
                    onClick={() => navigate(`/owner/tenants/${otherUserId}`)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      fontFamily: BAI.fontBody, cursor: 'pointer',
                      background: BAI.ownerLight, color: BAI.owner,
                      border: `1px solid ${BAI.ownerBorder}`, transition: BAI.transition,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#d4e4f7')}
                    onMouseLeave={e => (e.currentTarget.style.background = BAI.ownerLight)}
                  >
                    <FolderOpen size={13} style={{ flexShrink: 0 }} />
                    Voir le dossier
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => setShowLeaseModal(true)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      fontFamily: BAI.fontBody, cursor: 'pointer',
                      background: BAI.night, color: '#fff',
                      border: 'none', transition: BAI.transition,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = BAI.nightHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = BAI.night)}
                  >
                    <Home size={13} style={{ flexShrink: 0 }} />
                    Mettre en location
                  </button>
                )}
                {!isOwner && (
                  <button
                    onClick={() => navigate('/search')}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      fontFamily: BAI.fontBody, cursor: 'pointer',
                      background: BAI.tenantLight, color: BAI.tenant,
                      border: `1px solid ${BAI.tenantBorder}`, transition: BAI.transition,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#d4ede3')}
                    onMouseLeave={e => (e.currentTarget.style.background = BAI.tenantLight)}
                  >
                    <Home size={13} style={{ flexShrink: 0 }} />
                    Voir les annonces
                  </button>
                )}
              </div>
            </div>

            {/* Suivi contrat */}
            <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 12,
              }}>
                Suivi du contrat
              </p>
              {otherUserId && <ContractActivityFeed otherUserId={otherUserId} />}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${BAI.border}` }}>
              <p style={{ fontSize: 10, color: BAI.inkFaint, lineHeight: 1.5, textAlign: 'center' }}>
                Chiffré TLS · Hébergé en France
              </p>
            </div>
          </div>
        )}

      </motion.div>

      {/* CreateLeaseModal */}
      {isOwner && otherUser && otherUserId && (
        <CreateLeaseModal
          isOpen={showLeaseModal}
          onClose={() => setShowLeaseModal(false)}
          tenantId={otherUserId}
          tenantName={`${otherUser.firstName} ${otherUser.lastName}`}
          onSuccess={(contractId) => { setShowLeaseModal(false); navigate(`/contracts/${contractId}`) }}
        />
      )}
    </>  )
}
