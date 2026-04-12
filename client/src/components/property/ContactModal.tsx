import { useState, FormEvent } from 'react'
import { X, Send, Mail, User, MessageSquare, AlertCircle, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { propertyService } from '../../services/property.service'
import { shareApi } from '../../services/dossier.service'

const M = {
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  owner: '#1a3270',
  ownerLight: '#eaf0fb',
  ownerBorder: '#b8ccf0',
  tenant: '#1b5e3b',
  tenantLight: '#edf7f2',
  tenantBorder: '#9fd4ba',
  border: '#e4e1db',
  muted: '#f4f2ee',
  surface: '#ffffff',
}

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  propertyTitle: string
  ownerName?: string
  ownerId?: string
}

export const ContactModal = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  ownerName: _ownerName,
  ownerId,
}: ContactModalProps) => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await propertyService.contactProperty(propertyId, formData)

      setSuccess(true)

      if (result.conversationId && isAuthenticated && ownerId) {
        // Show share popup before redirecting to messages
        setPendingConversationId(result.conversationId)
        setShowSharePopup(true)
      } else if (result.conversationId) {
        // Not authenticated or no ownerId — go straight to messages
        setTimeout(() => { onClose(); navigate('/messages') }, 1500)
      } else {
        setTimeout(() => {
          onClose()
          setSuccess(false)
          setFormData({
            name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
            email: user?.email || '',
            message: '',
          })
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToMessages = () => { onClose(); navigate('/messages') }

  const handleShareAndGo = async () => {
    if (!ownerId) { goToMessages(); return }
    setIsSharing(true)
    try { await shareApi.grantShare(ownerId, propertyId, 30) } catch { /* silent */ } finally {
      setIsSharing(false)
      goToMessages()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ background: M.surface, boxShadow: '0 8px 32px rgba(13,12,10,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: `1px solid ${M.border}` }}
        >
          <div>
            <h2 className="text-2xl font-bold" style={{ color: M.ink }}>Contacter le propriétaire</h2>
            <p className="text-sm mt-1 line-clamp-1" style={{ color: M.inkMid }}>{propertyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: M.inkFaint }}
            onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success → Share popup */}
          {success && showSharePopup && pendingConversationId ? (
            <div className="flex flex-col gap-4">
              {/* Sent confirmation */}
              <div className="p-4 rounded-xl flex items-start gap-3"
                style={{ background: M.tenantLight, border: `1px solid ${M.tenantBorder}` }}>
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: M.tenant }} />
                <p className="text-sm font-medium" style={{ color: M.tenant }}>
                  Message envoyé ! Le propriétaire a bien reçu votre demande.
                </p>
              </div>

              {/* Share prompt */}
              <div className="p-5 rounded-xl flex flex-col gap-4"
                style={{ background: M.ownerLight, border: `1px solid ${M.ownerBorder}` }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#d4e4f7' }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: M.owner }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: M.owner }}>
                      Partager votre dossier locatif ?
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: M.owner, opacity: 0.75 }}>
                      Documents 100 % filigranés · consultation uniquement · 30 jours
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShareAndGo}
                    disabled={isSharing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{ background: M.tenant }}
                  >
                    {isSharing
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Partage…</>
                      : <><ShieldCheck className="w-3.5 h-3.5" /> Oui, partager</>
                    }
                  </button>
                  <button
                    onClick={goToMessages}
                    disabled={isSharing}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                    style={{ background: M.muted, color: M.inkMid, border: `1px solid ${M.border}` }}
                  >
                    Non merci
                  </button>
                </div>
              </div>
            </div>
          ) : success ? (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: M.tenantLight, border: `1px solid ${M.tenantBorder}` }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: M.tenant }} />
              <p className="text-sm font-medium" style={{ color: M.tenant }}>
                Message envoyé avec succès.
              </p>
            </div>
          ) : null}

          {/* Not Authenticated Notice */}
          {!isAuthenticated && (
            <div
              className="mb-6 p-4 rounded-xl"
              style={{
                background: M.ownerLight,
                border: `1px solid ${M.ownerBorder}`,
              }}
            >
              <p className="text-sm" style={{ color: M.ink }}>
                Vous n'etes pas connecte. Vous pouvez toujours envoyer un message, mais nous
                vous recommandons de{' '}
                <Link to="/login" className="font-medium hover:underline" style={{ color: M.owner }}>
                  vous connecter
                </Link>{' '}
                pour suivre vos echanges dans la messagerie.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          {!success && <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: M.inkMid }}>
                <User className="w-4 h-4 inline mr-1" />
                Votre nom *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jean Dupont"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: M.inkMid }}>
                <Mail className="w-4 h-4 inline mr-1" />
                Votre email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jean.dupont@example.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: M.inkMid }}>
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Votre message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                placeholder={`Bonjour,\n\nJe suis interesse(e) par votre bien "${propertyTitle}".\n\nPouvez-vous me donner plus d'informations ?\n\nCordialement`}
                className="input"
                required
              />
              <p className="text-xs mt-1" style={{ color: M.inkFaint }}>
                Presentez-vous et expliquez votre projet de location
              </p>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl" style={{ background: M.muted }}>
              <p className="text-sm font-medium mb-2" style={{ color: M.ink }}>Conseils</p>
              <ul className="text-sm space-y-1" style={{ color: M.inkMid }}>
                <li>- Presentez-vous brievement (situation professionnelle, familiale)</li>
                <li>- Indiquez votre date d'emmenagement souhaitee</li>
                <li>- Mentionnez si vous avez des garanties (garant, CDI, etc.)</li>
                <li>- Restez courtois et professionnel</li>
              </ul>
            </div>

            {/* Dossier auto-share notice */}
            {isAuthenticated && ownerId && (
              <div className="p-3 rounded-xl flex gap-2.5"
                style={{ background: M.ownerLight, border: `1px solid ${M.ownerBorder}` }}>
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: M.owner }} />
                <p className="text-xs" style={{ color: M.owner }}>
                  Votre dossier locatif sera automatiquement partagé avec le propriétaire (documents intégralement filigrainés — consultation uniquement).
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isSubmitting || success}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Envoi...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer le message
                  </>
                )}
              </button>
            </div>
          </form>}
        </div>
      </div>
    </div>
  )
}
