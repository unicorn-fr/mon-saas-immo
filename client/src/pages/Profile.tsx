import { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/auth.service'
import ChangePasswordModal from '../components/auth/ChangePasswordModal'
import toast from 'react-hot-toast'
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X as XIcon,
  Lock,
  AlertTriangle,
  Loader2,
  Link as LinkIcon,
  Trash2,
  FileText,
  ShieldCheck,
  ShieldOff,
  QrCode,
  CreditCard,
  MapPin,
  Calendar,
  Globe,
  Hash,
} from 'lucide-react'

// ─── Shared style constants ───────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '1rem',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
}

const inputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '0.75rem',
  padding: '0.625rem 1rem',
  color: '#1d1d1f',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  fontFamily: '"Plus Jakarta Sans", Inter, system-ui',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function onFocusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#007AFF'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'
}
function onBlurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#d2d2d7'
  e.currentTarget.style.boxShadow = 'none'
}

// ─── ReadonlyField ────────────────────────────────────────────────────────────

function ReadonlyField({ icon, value }: { icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: '#f5f5f7', border: '1px solid #d2d2d7' }}
    >
      <span style={{ color: '#86868b' }}>{icon}</span>
      <span className="text-sm" style={{ color: '#1d1d1f' }}>{value}</span>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile(formData)
      toast.success('Profil mis à jour avec succès')
      setIsEditing(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    })
    setIsEditing(false)
  }

  const handleResendVerification = async () => {
    setIsResendingVerification(true)
    try {
      await authService.resendVerification()
      toast.success('Email de vérification envoyé !')
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'envoi de l'email"
      )
    } finally {
      setIsResendingVerification(false)
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'OWNER':  return 'Propriétaire'
      case 'TENANT': return 'Locataire'
      case 'ADMIN':  return 'Administrateur'
      default:       return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':  return { bg: '#e8f0fe', border: '#aacfff', color: '#0066d6' }
      case 'TENANT': return { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' }
      case 'ADMIN':  return { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' }
      default:       return { bg: '#f5f5f7', border: '#d2d2d7', color: '#64748b' }
    }
  }

  const hasPassword = true

  // ── TOTP state ───────────────────────────────────────────────────────────────
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null)
  const [totpModal, setTotpModal] = useState<'setup' | 'disable' | null>(null)
  const [totpQr, setTotpQr] = useState<string>('')
  const [totpSecret, setTotpSecret] = useState<string>('')
  const [totpCode, setTotpCode] = useState<string>('')
  const [totpStep, setTotpStep] = useState<'qr' | 'verify'>('qr')
  const [totpLoading, setTotpLoading] = useState(false)

  useEffect(() => {
    authService.totpStatus().then(setTotpEnabled).catch(() => setTotpEnabled(false))
  }, [])

  const openTotpSetup = async () => {
    setTotpLoading(true)
    try {
      const { qrCodeDataUrl, secret } = await authService.totpSetup()
      setTotpQr(qrCodeDataUrl)
      setTotpSecret(secret)
      setTotpStep('qr')
      setTotpCode('')
      setTotpModal('setup')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setTotpLoading(false)
    }
  }

  const handleTotpEnable = async () => {
    if (!/^\d{6}$/.test(totpCode)) { toast.error('Code à 6 chiffres requis'); return }
    setTotpLoading(true)
    try {
      await authService.totpEnable(totpCode)
      setTotpEnabled(true)
      setTotpModal(null)
      toast.success('Authentification à deux facteurs activée !')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Code incorrect')
    } finally {
      setTotpLoading(false)
    }
  }

  const handleTotpDisable = async () => {
    if (!/^\d{6}$/.test(totpCode)) { toast.error('Code à 6 chiffres requis'); return }
    setTotpLoading(true)
    try {
      await authService.totpDisable(totpCode)
      setTotpEnabled(false)
      setTotpModal(null)
      toast.success('Authentification à deux facteurs désactivée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Code incorrect')
    } finally {
      setTotpLoading(false)
    }
  }

  const roleColors = getRoleColor(user?.role || '')
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  return (
    <Layout>
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: '#f5f5f7', fontFamily: '"Plus Jakarta Sans", Inter, system-ui' }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Email verification banner */}
          {user && !user.emailVerified && (
            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#d97706' }}>
                  Votre adresse email n'est pas vérifiée
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#78350f' }}>
                  Vérifiez votre email pour accéder à toutes les fonctionnalités.
                </p>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="rounded-xl font-semibold px-3 py-1.5 text-xs text-white flex-shrink-0 disabled:opacity-50 transition-colors"
                style={{ background: '#d97706' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#b45309')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#d97706')}
              >
                {isResendingVerification ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Renvoyer l'email"
                )}
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: '#1d1d1f' }}>Mon Profil</h1>
            <p className="text-sm mt-1" style={{ color: '#515154' }}>
              Gérez vos informations personnelles et vos paramètres
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left: Profile summary card ── */}
            <div className="lg:col-span-1">
              <div style={cardStyle}>
                <div className="text-center">
                  {/* Avatar */}
                  <div className="relative inline-block mb-4">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover"
                        style={{ border: '3px solid #d2d2d7' }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold select-none"
                        style={{
                          background: '#e8f0fe',
                          border: '3px solid #aacfff',
                          color: '#007AFF',
                        }}
                      >
                        {initials || <User className="w-9 h-9" />}
                      </div>
                    )}
                  </div>

                  <h2 className="text-lg font-bold" style={{ color: '#1d1d1f' }}>
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#86868b' }}>{user?.email}</p>

                  {/* Role badge */}
                  <div
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: roleColors.bg, border: `1px solid ${roleColors.border}`, color: roleColors.color }}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {getRoleName(user?.role || '')}
                  </div>
                </div>

                {/* Verification status */}
                <div className="mt-6 pt-5" style={{ borderTop: '1px solid #d2d2d7' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#86868b' }}>
                    Vérifications
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#515154' }}>Email vérifié</span>
                      {user?.emailVerified ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#515154' }}>Téléphone vérifié</span>
                      {user?.phoneVerified ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#515154' }}>Authentification 2FA</span>
                      {totpEnabled ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                      )}
                    </div>
                  </div>
                </div>

                {!user?.emailVerified && (
                  <div className="mt-5">
                    <button
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="w-full rounded-xl font-semibold px-4 py-2.5 text-sm border transition-colors disabled:opacity-50"
                      style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      {isResendingVerification ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />Envoi...
                        </span>
                      ) : (
                        'Vérifier mon email'
                      )}
                    </button>
                    <p className="text-xs text-center mt-2" style={{ color: '#86868b' }}>
                      La vérification augmente la confiance des autres utilisateurs
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* ── Section: Informations personnelles ── */}
              <div style={cardStyle}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: '#e8f0fe' }}
                    >
                      <User className="w-4 h-4" style={{ color: '#007AFF' }} />
                    </div>
                    <h3 className="text-base font-bold" style={{ color: '#1d1d1f' }}>
                      Informations personnelles
                    </h3>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 rounded-xl font-semibold px-3 py-2 text-sm border transition-colors"
                      style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-xl font-semibold px-3 py-2 text-sm border transition-colors disabled:opacity-50"
                        style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                      >
                        <XIcon className="w-4 h-4" />
                        Annuler
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-xl font-semibold px-3 py-2 text-sm text-white transition-colors disabled:opacity-50"
                        style={{ background: '#007AFF' }}
                        onMouseEnter={(e) => !isSaving && (e.currentTarget.style.background = '#0066d6')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#007AFF')}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Prénom */}
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#515154' }}>
                        Prénom
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          style={inputStyle}
                          onFocus={onFocusInput}
                          onBlur={onBlurInput}
                          disabled={isSaving}
                        />
                      ) : (
                        <ReadonlyField icon={<User className="w-4 h-4" />} value={user?.firstName} />
                      )}
                    </div>
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#515154' }}>
                        Nom
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          style={inputStyle}
                          onFocus={onFocusInput}
                          onBlur={onBlurInput}
                          disabled={isSaving}
                        />
                      ) : (
                        <ReadonlyField icon={<User className="w-4 h-4" />} value={user?.lastName} />
                      )}
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#515154' }}>
                      Email
                    </label>
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: '#f5f5f7', border: '1px solid #d2d2d7' }}
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#86868b' }} />
                      <span className="text-sm flex-1" style={{ color: '#1d1d1f' }}>{user?.email}</span>
                      {user?.emailVerified && (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#86868b' }}>
                      L'email ne peut pas être modifié
                    </p>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#515154' }}>
                      Téléphone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="06 12 34 56 78"
                        style={inputStyle}
                        onFocus={onFocusInput}
                        onBlur={onBlurInput}
                        disabled={isSaving}
                      />
                    ) : (
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: '#f5f5f7', border: '1px solid #d2d2d7' }}
                      >
                        <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#86868b' }} />
                        <span className="text-sm flex-1" style={{ color: '#1d1d1f' }}>
                          {user?.phone || 'Non renseigné'}
                        </span>
                        {user?.phoneVerified && (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#515154' }}>
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Parlez-nous de vous..."
                        rows={4}
                        style={{ ...inputStyle, resize: 'vertical' }}
                        onFocus={onFocusInput}
                        onBlur={onBlurInput}
                        disabled={isSaving}
                      />
                    ) : (
                      <ReadonlyField
                        icon={<FileText className="w-4 h-4" />}
                        value={user?.bio || 'Aucune bio renseignée'}
                      />
                    )}
                  </div>

                  {/* Role + Membre depuis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#515154' }}>
                        Type de compte
                      </label>
                      <ReadonlyField icon={<Shield className="w-4 h-4" />} value={getRoleName(user?.role || '')} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#515154' }}>
                        Membre depuis
                      </label>
                      <ReadonlyField
                        icon={<Calendar className="w-4 h-4" />}
                        value={
                          user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })
                            : 'N/A'
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section: Mes données extraites (TENANT only) ── */}
              {user?.role === 'TENANT' && (
                <div style={cardStyle}>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: '#e8f0fe' }}
                    >
                      <CreditCard className="w-4 h-4" style={{ color: '#007AFF' }} />
                    </div>
                    <h3 className="text-base font-bold" style={{ color: '#1d1d1f' }}>
                      Mes données extraites
                    </h3>
                  </div>
                  <p className="text-xs mb-6 ml-11" style={{ color: '#86868b' }}>
                    Classifiées automatiquement par l'IA depuis vos documents scannés
                  </p>

                  {/* Identité */}
                  {(user.birthDate || user.birthCity || user.nationality || user.documentNumber || user.documentExpiry || user.nationalNumber) && (
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#007AFF' }} />
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#007AFF' }}>
                          Identité
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {user.birthDate && (
                          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#e8f0fe', border: '1px solid #aacfff' }}>
                            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#007AFF' }} />
                            <div><p className="text-xs font-semibold" style={{ color: '#007AFF' }}>Date de naissance</p><p className="text-sm" style={{ color: '#1d1d1f' }}>{user.birthDate}</p></div>
                          </div>
                        )}
                        {user.birthCity && (
                          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#e8f0fe', border: '1px solid #aacfff' }}>
                            <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#007AFF' }} />
                            <div><p className="text-xs font-semibold" style={{ color: '#007AFF' }}>Lieu de naissance</p><p className="text-sm" style={{ color: '#1d1d1f' }}>{user.birthCity}</p></div>
                          </div>
                        )}
                        {user.nationality && (
                          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#e8f0fe', border: '1px solid #aacfff' }}>
                            <Globe className="w-4 h-4 flex-shrink-0" style={{ color: '#007AFF' }} />
                            <div><p className="text-xs font-semibold" style={{ color: '#007AFF' }}>Nationalité</p><p className="text-sm" style={{ color: '#1d1d1f' }}>{user.nationality}</p></div>
                          </div>
                        )}
                        {user.documentNumber && (
                          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#e8f0fe', border: '1px solid #aacfff' }}>
                            <Hash className="w-4 h-4 flex-shrink-0" style={{ color: '#007AFF' }} />
                            <div><p className="text-xs font-semibold" style={{ color: '#007AFF' }}>N° de pièce d'identité</p><p className="text-sm font-mono" style={{ color: '#1d1d1f' }}>{user.documentNumber}</p></div>
                          </div>
                        )}
                        {user.documentExpiry && (
                          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#e8f0fe', border: '1px solid #aacfff' }}>
                            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#007AFF' }} />
                            <div><p className="text-xs font-semibold" style={{ color: '#007AFF' }}>Validité du document</p><p className="text-sm" style={{ color: '#1d1d1f' }}>{user.documentExpiry}</p></div>
                          </div>
                        )}
                        {user.nationalNumber && (
                          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#e8f0fe', border: '1px solid #aacfff' }}>
                            <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#007AFF' }} />
                            <div><p className="text-xs font-semibold" style={{ color: '#007AFF' }}>N° sécurité sociale</p><p className="text-sm font-mono" style={{ color: '#1d1d1f' }}>{user.nationalNumber}</p></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sections dynamiques depuis profileMeta */}
                  {user.profileMeta && Object.entries(user.profileMeta)
                    .filter(([family]) => family !== 'IDENTITE')
                    .map(([family, meta]) => {
                      const SECTION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
                        BULLETIN:        { label: 'Revenus — Bulletins de salaire', color: '#0066d6', bg: '#e8f0fe', border: '#aacfff', dot: '#007AFF' },
                        REVENUS_FISCAUX: { label: 'Revenus fiscaux',               color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981' },
                        DOMICILE:        { label: 'Domicile',                       color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
                        GARANTIE:        { label: 'Garanties (Visale / Caution)',   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
                        BANCAIRE:        { label: 'Compte bancaire',                color: '#515154', bg: '#f5f5f7', border: '#d2d2d7', dot: '#86868b' },
                        EMPLOI:          { label: 'Emploi',                         color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316' },
                        LOGEMENT:        { label: 'Logement',                       color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', dot: '#14b8a6' },
                      }
                      const cfg = SECTION_CONFIG[family] ?? { label: family, color: '#515154', bg: '#f5f5f7', border: '#d2d2d7', dot: '#86868b' }
                      const FIELD_LABELS: Record<string, string> = {
                        employerName: 'Employeur', netSalary: 'Salaire net', grossSalary: 'Salaire brut',
                        bulletinPeriod: 'Période', contractType: 'Type de contrat', siret: 'SIRET',
                        fiscalRef: 'Revenu fiscal de référence', cafAmount: 'Allocations CAF (€/mois)',
                        areAmount: 'Allocation chômage (€/mois)', pensionAmount: 'Pension retraite (€/mois)',
                        address: 'Adresse', issuerName: 'Émetteur',
                        visaleAmount: 'Loyer garanti (€/mois)', visaleDuration: 'Durée garantie',
                        visaNumber: 'N° Visa Visale', guarantorLastName: 'Nom garant',
                        guarantorFirstName: 'Prénom garant',
                        ibanPrefix: 'IBAN (préfixe)', loanAmount: 'Échéance crédit (€/mois)',
                      }
                      const displayFields = Object.entries(meta)
                        .filter(([k]) => !k.startsWith('_') && FIELD_LABELS[k])
                      if (!displayFields.length) return null
                      return (
                        <div key={family} className="mb-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: cfg.color }}>
                              {cfg.label}
                            </span>
                            {meta._docType ? (
                              <span className="text-xs ml-auto" style={{ color: '#86868b' }}>{String(meta._docType)}</span>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {displayFields.map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 p-3 rounded-xl"
                                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                              >
                                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: cfg.dot }} />
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: cfg.color }}>{FIELD_LABELS[key]}</p>
                                  <p className="text-sm" style={{ color: '#1d1d1f' }}>
                                    {typeof value === 'number'
                                      ? `${value.toLocaleString('fr-FR')} ${['netSalary','grossSalary','cafAmount','areAmount','pensionAmount','visaleAmount','loanAmount'].includes(key) ? '€' : ''}`
                                      : String(value)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  }

                  {/* Empty state */}
                  {!user.birthDate && !user.birthCity && !user.nationality && !user.documentNumber &&
                    !user.nationalNumber && (!user.profileMeta || Object.keys(user.profileMeta).length === 0) && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{ background: '#f5f5f7', border: '1px solid #d2d2d7' }}
                      >
                        <CreditCard className="w-6 h-6" style={{ color: '#86868b' }} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#515154' }}>
                        Aucune donnée extraite pour le moment
                      </p>
                      <p className="text-xs mt-1 max-w-xs" style={{ color: '#86868b' }}>
                        Déposez vos documents dans le dossier locataire — l'IA extraira et classifiera automatiquement vos données.
                      </p>
                    </div>
                  )}

                  <p className="text-xs mt-4 flex items-center gap-1.5" style={{ color: '#86868b' }}>
                    <Shield className="w-3.5 h-3.5" />
                    Données chiffrées et sécurisées — utilisées uniquement pour valider votre dossier locataire.
                  </p>
                </div>
              )}

              {/* ── Section: Sécurité ── */}
              <div style={cardStyle}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: '#e8f0fe' }}
                  >
                    <Lock className="w-4 h-4" style={{ color: '#007AFF' }} />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: '#1d1d1f' }}>Sécurité</h3>
                </div>
                <div className="space-y-3">
                  {hasPassword && (
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors text-left"
                      style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      <Lock className="w-4 h-4" style={{ color: '#86868b' }} />
                      Changer le mot de passe
                    </button>
                  )}

                  {/* 2FA / TOTP */}
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: '#f5f5f7', border: '1px solid #d2d2d7' }}
                  >
                    <div className="flex items-center gap-3">
                      {totpEnabled ? (
                        <ShieldCheck className="w-5 h-5" style={{ color: '#059669' }} />
                      ) : (
                        <ShieldOff className="w-5 h-5" style={{ color: '#86868b' }} />
                      )}
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>
                          Authentification à deux facteurs
                        </p>
                        <p className="text-xs" style={{ color: '#86868b' }}>
                          {totpEnabled === null
                            ? 'Chargement…'
                            : totpEnabled
                            ? 'Activée (Google Authenticator / Authy)'
                            : 'Désactivée'}
                        </p>
                      </div>
                    </div>
                    {totpEnabled === null ? (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#86868b' }} />
                    ) : totpEnabled ? (
                      <button
                        onClick={() => { setTotpCode(''); setTotpModal('disable') }}
                        className="text-sm font-semibold transition-colors"
                        style={{ color: '#dc2626' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#b91c1c')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#dc2626')}
                      >
                        Désactiver
                      </button>
                    ) : (
                      <button
                        onClick={openTotpSetup}
                        disabled={totpLoading}
                        className="text-sm font-semibold transition-colors disabled:opacity-50"
                        style={{ color: '#007AFF' }}
                        onMouseEnter={(e) => !totpLoading && (e.currentTarget.style.color = '#0066d6')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#007AFF')}
                      >
                        {totpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section: Comptes liés ── */}
              <div style={cardStyle}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: '#e8f0fe' }}
                  >
                    <LinkIcon className="w-4 h-4" style={{ color: '#007AFF' }} />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: '#1d1d1f' }}>Comptes liés</h3>
                </div>
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: '#f5f5f7', border: '1px solid #d2d2d7' }}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1d1d1f' }}>Google</p>
                      <p className="text-xs" style={{ color: '#86868b' }}>
                        Connectez-vous avec votre compte Google
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: '#f5f5f7', border: '1px solid #d2d2d7', color: '#86868b' }}
                  >
                    {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Disponible' : 'Non configuré'}
                  </span>
                </div>
              </div>

              {/* ── Section: Zone de danger ── */}
              <div
                style={{
                  ...cardStyle,
                  border: '1px solid #fecaca',
                }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: '#fef2f2' }}
                  >
                    <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: '#dc2626' }}>Zone de danger</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: '#515154' }}>
                  Une fois votre compte supprimé, toutes vos données seront définitivement perdues.
                  Cette action est irréversible.
                </p>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="inline-flex items-center gap-2 rounded-xl font-semibold px-4 py-2.5 text-sm text-white transition-colors"
                  style={{ background: '#dc2626' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* TOTP Setup Modal */}
      {totpModal === 'setup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTotpModal(null)} />
          <div
            className="relative w-full max-w-md mx-4 p-6 rounded-2xl"
            style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            <button
              onClick={() => setTotpModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl transition-colors"
              style={{ color: '#86868b' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <XIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                <QrCode className="w-5 h-5" style={{ color: '#007AFF' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#1d1d1f' }}>Activer la 2FA</h3>
                <p className="text-xs" style={{ color: '#86868b' }}>Google Authenticator ou Authy</p>
              </div>
            </div>

            {totpStep === 'qr' && (
              <>
                <p className="text-sm mb-4" style={{ color: '#515154' }}>
                  Scannez ce QR code avec votre application d'authentification, puis cliquez sur Suivant.
                </p>
                {totpQr && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={totpQr}
                      alt="QR Code 2FA"
                      className="w-48 h-48 rounded-xl"
                      style={{ border: '1px solid #d2d2d7' }}
                    />
                  </div>
                )}
                <details className="mb-4 cursor-pointer">
                  <summary className="text-xs" style={{ color: '#86868b' }}>Saisie manuelle</summary>
                  <code
                    className="mt-2 block break-all text-xs p-2 rounded-xl"
                    style={{ background: '#f5f5f7', color: '#1d1d1f', border: '1px solid #d2d2d7' }}
                  >
                    {totpSecret}
                  </code>
                </details>
                <button
                  onClick={() => setTotpStep('verify')}
                  className="w-full rounded-xl font-semibold px-4 py-2.5 text-sm text-white"
                  style={{ background: '#007AFF' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#0066d6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#007AFF')}
                >
                  Suivant
                </button>
              </>
            )}

            {totpStep === 'verify' && (
              <>
                <p className="text-sm mb-4" style={{ color: '#515154' }}>
                  Saisissez le code à 6 chiffres affiché dans votre application pour confirmer l'activation.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2em', marginBottom: '1rem' }}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setTotpStep('qr')}
                    className="flex-1 rounded-xl font-semibold px-4 py-2.5 text-sm border transition-colors"
                    style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleTotpEnable}
                    disabled={totpLoading || totpCode.length !== 6}
                    className="flex-1 rounded-xl font-semibold px-4 py-2.5 text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: '#007AFF' }}
                    onMouseEnter={(e) => !totpLoading && (e.currentTarget.style.background = '#0066d6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#007AFF')}
                  >
                    {totpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TOTP Disable Modal */}
      {totpModal === 'disable' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTotpModal(null)} />
          <div
            className="relative w-full max-w-md mx-4 p-6 rounded-2xl"
            style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            <button
              onClick={() => setTotpModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl transition-colors"
              style={{ color: '#86868b' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <XIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <ShieldOff className="w-5 h-5" style={{ color: '#dc2626' }} />
              </div>
              <h3 className="text-lg font-bold" style={{ color: '#1d1d1f' }}>Désactiver la 2FA</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#515154' }}>
              Saisissez le code actuel de votre application pour confirmer la désactivation.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2em', marginBottom: '1rem' }}
              onFocus={onFocusInput}
              onBlur={onBlurInput}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setTotpModal(null)}
                className="flex-1 rounded-xl font-semibold px-4 py-2.5 text-sm border transition-colors"
                style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                Annuler
              </button>
              <button
                onClick={handleTotpDisable}
                disabled={totpLoading || totpCode.length !== 6}
                className="flex-1 rounded-xl font-semibold px-4 py-2.5 text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#dc2626' }}
                onMouseEnter={(e) => !totpLoading && (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
              >
                {totpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText('') }}
          />
          <div
            className="relative w-full max-w-md mx-4 p-6 rounded-2xl"
            style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
              </div>
              <h3 className="text-lg font-bold" style={{ color: '#1d1d1f' }}>
                Supprimer votre compte ?
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#515154' }}>
              Cette action est <strong>irréversible</strong>. Toutes vos données, propriétés,
              contrats et messages seront supprimés définitivement.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#515154' }}>
                Tapez <strong>SUPPRIMER</strong> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                style={inputStyle}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
                placeholder="SUPPRIMER"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText('') }}
                className="flex-1 rounded-xl font-semibold px-4 py-2.5 text-sm border transition-colors"
                style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                Annuler
              </button>
              <button
                disabled={deleteConfirmText !== 'SUPPRIMER'}
                onClick={() => {
                  toast.error('La suppression de compte sera bientôt disponible')
                  setShowDeleteDialog(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 rounded-xl font-semibold px-4 py-2.5 text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#dc2626' }}
                onMouseEnter={(e) => deleteConfirmText === 'SUPPRIMER' && (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
