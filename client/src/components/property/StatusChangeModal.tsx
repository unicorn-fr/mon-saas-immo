import { useState, useEffect } from 'react'
import { X, User, Search, MessageCircle } from 'lucide-react'
import { PropertyStatus, PROPERTY_STATUS } from '../../types/property.types'
import { useMessageStore } from '../../store/messageStore'
import { useAuth } from '../../hooks/useAuth'
import { User as MessageUser } from '../../types/message.types'
import { BAI } from '../../constants/bailio-tokens'

// Maison color sets per semantic color key
const colorSets = {
  green: {
    selectedBorder: BAI.tenantBorder,
    selectedBg: BAI.tenantLight,
    badgeBg: BAI.tenantLight,
    badgeText: BAI.tenant,
  },
  blue: {
    selectedBorder: BAI.ownerBorder,
    selectedBg: BAI.ownerLight,
    badgeBg: BAI.ownerLight,
    badgeText: BAI.owner,
  },
  amber: {
    selectedBorder: '#f3c99a',
    selectedBg: '#fdf5ec',
    badgeBg: '#fdf5ec',
    badgeText: '#a0622a',
  },
  gray: {
    selectedBorder: BAI.borderStrong,
    selectedBg: BAI.bgMuted,
    badgeBg: BAI.bgMuted,
    badgeText: BAI.inkMid,
  },
}

interface StatusChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (status: PropertyStatus, tenantId?: string) => Promise<void>
  propertyTitle: string
  currentStatus: PropertyStatus
}

export const StatusChangeModal = ({
  isOpen,
  onClose,
  onConfirm,
  propertyTitle,
  currentStatus,
}: StatusChangeModalProps) => {
  const { user } = useAuth()
  const { conversations, fetchConversations } = useMessageStore()

  const [selectedStatus, setSelectedStatus] = useState<PropertyStatus>(currentStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'status' | 'tenant'>('status')
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Extract unique contacts from conversations
  const contacts: MessageUser[] = []
  const seenIds = new Set<string>()
  for (const conv of conversations) {
    const other = conv.user1Id === user?.id ? conv.user2 : conv.user1
    if (other && !seenIds.has(other.id)) {
      seenIds.add(other.id)
      contacts.push(other)
    }
  }

  const filteredContacts = contacts.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
    const email = (c.email || '').toLowerCase()
    const q = searchQuery.toLowerCase()
    return fullName.includes(q) || email.includes(q)
  })

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus)
      setStep('status')
      setSelectedTenantId(null)
      setSearchQuery('')
    }
  }, [isOpen, currentStatus])

  const handleNext = () => {
    if (selectedStatus === 'OCCUPIED' && selectedStatus !== currentStatus) {
      fetchConversations()
      setStep('tenant')
    } else {
      handleConfirm()
    }
  }

  const handleConfirm = async () => {
    if (selectedStatus === currentStatus) return
    setIsSubmitting(true)
    try {
      await onConfirm(selectedStatus, selectedTenantId || undefined)
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
        style={{ background: BAI.bgSurface, boxShadow: '0 8px 32px rgba(13,12,10,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderBottom: `1px solid ${BAI.border}` }}
        >
          <div>
            <h2 className="text-xl font-bold" style={{ color: BAI.ink }}>
              {step === 'status' ? 'Changer le statut' : 'Choisir un locataire'}
            </h2>
            <p className="text-sm mt-1 line-clamp-1" style={{ color: BAI.inkMid }}>{propertyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: BAI.inkFaint }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'status' ? (
          <>
            {/* Status Options */}
            <div className="p-6 space-y-3">
              {PROPERTY_STATUS.filter((s) => s.value !== 'PENDING_REVIEW').map((statusOption) => {
                const isSelected = selectedStatus === statusOption.value
                const isCurrent = currentStatus === statusOption.value
                const colors = colorSets[statusOption.color as keyof typeof colorSets] || colorSets.gray

                return (
                  <label
                    key={statusOption.value}
                    className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={
                      isSelected
                        ? {
                            borderColor: colors.selectedBorder,
                            background: colors.selectedBg,
                          }
                        : {
                            borderColor: BAI.border,
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.borderColor = BAI.borderStrong
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.borderColor = BAI.border
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="propertyStatus"
                      value={statusOption.value}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(statusOption.value)}
                      className="mt-0.5 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: colors.badgeBg, color: colors.badgeText }}
                        >
                          {statusOption.label}
                        </span>
                        {isCurrent && (
                          <span className="text-xs font-medium" style={{ color: BAI.inkFaint }}>(actuel)</span>
                        )}
                      </div>
                      {statusOption.description && (
                        <p className="text-sm mt-1" style={{ color: BAI.inkMid }}>{statusOption.description}</p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 p-6 flex-shrink-0"
              style={{ borderTop: `1px solid ${BAI.border}` }}
            >
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary flex-1"
                disabled={isSubmitting || selectedStatus === currentStatus}
              >
                {selectedStatus === 'OCCUPIED' && selectedStatus !== currentStatus
                  ? 'Suivant'
                  : isSubmitting
                    ? 'Mise a jour...'
                    : 'Confirmer'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Tenant Selection */}
            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <p className="text-sm mb-4" style={{ color: BAI.inkMid }}>
                Sélectionnez le locataire pour ce bien parmi vos contacts :
              </p>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BAI.inkFaint }} />
                <input
                  type="text"
                  placeholder="Rechercher un contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2" style={{ color: BAI.inkFaint }} />
                    <p className="text-sm" style={{ color: BAI.inkFaint }}>
                      {contacts.length === 0
                        ? 'Aucun contact. Discutez avec un locataire potentiel pour le voir ici.'
                        : 'Aucun contact trouvé.'}
                    </p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                      style={
                        selectedTenantId === contact.id
                          ? { borderColor: BAI.ownerBorder, background: BAI.ownerLight }
                          : { borderColor: BAI.border }
                      }
                      onMouseEnter={(e) => {
                        if (selectedTenantId !== contact.id) {
                          (e.currentTarget as HTMLElement).style.borderColor = BAI.borderStrong
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTenantId !== contact.id) {
                          (e.currentTarget as HTMLElement).style.borderColor = BAI.border
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="tenant"
                        value={contact.id}
                        checked={selectedTenantId === contact.id}
                        onChange={() => setSelectedTenantId(contact.id)}
                        className="h-4 w-4"
                      />
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: BAI.ownerLight }}
                      >
                        {contact.avatar ? (
                          <img src={contact.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5" style={{ color: BAI.owner }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm" style={{ color: BAI.ink }}>
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.email && (
                          <p className="text-xs truncate" style={{ color: BAI.inkFaint }}>{contact.email}</p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 p-6 flex-shrink-0"
              style={{ borderTop: `1px solid ${BAI.border}` }}
            >
              <button
                type="button"
                onClick={() => setStep('status')}
                className="btn btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="btn btn-primary flex-1"
                disabled={isSubmitting || !selectedTenantId}
              >
                {isSubmitting ? 'Création...' : 'Confirmer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
