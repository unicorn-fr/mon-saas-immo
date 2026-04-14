import { useState } from 'react'
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
  Trash2,
  FileText,
  CreditCard,
  MapPin,
  Calendar,
  Globe,
  Hash,
} from 'lucide-react'

// ─── Maison Design Tokens ─────────────────────────────────────────────────────

const M = {
  bg: '#fafaf8',
  surface: '#ffffff',
  muted: '#f4f2ee',
  inputBg: '#f8f7f4',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  caramel: '#c4976a',
  caramelLight: '#fdf5ec',
  owner: '#1a3270',
  ownerLight: '#eaf0fb',
  tenant: '#1b5e3b',
  tenantLight: '#edf7f2',
  border: '#e4e1db',
  borderMid: '#ccc9c3',
  danger: '#9b1c1c',
  dangerBg: '#fef2f2',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

// ─── Shared style constants ───────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: M.surface,
  border: `1px solid ${M.border}`,
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

const inputStyle: React.CSSProperties = {
  background: M.inputBg,
  border: `1px solid ${M.border}`,
  borderRadius: '8px',
  padding: '0.625rem 1rem',
  color: M.ink,
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  fontFamily: M.body,
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function onFocusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = M.night
  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,26,46,0.10)`
}
function onBlurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = M.border
  e.currentTarget.style.boxShadow = 'none'
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        style={{
          fontFamily: M.body,
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: M.inkFaint,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: M.border }} />
    </div>
  )
}

// ─── ReadonlyField ────────────────────────────────────────────────────────────

function ReadonlyField({ icon, value }: { icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        background: M.muted,
        border: `1px solid ${M.border}`,
        borderRadius: '8px',
      }}
    >
      <span style={{ color: M.inkFaint }}>{icon}</span>
      <span className="text-sm" style={{ color: M.ink, fontFamily: M.body }}>{value}</span>
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

  const getAvatarColors = (role: string) => {
    switch (role) {
      case 'OWNER':  return { bg: M.ownerLight, color: M.owner }
      case 'TENANT': return { bg: M.tenantLight, color: M.tenant }
      default:       return { bg: M.muted, color: M.inkMid }
    }
  }

  const getRoleBadgeStyle = (role: string): React.CSSProperties => {
    switch (role) {
      case 'OWNER':
        return { background: M.ownerLight, border: `1px solid #b8ccf0`, color: M.owner }
      case 'TENANT':
        return { background: M.tenantLight, border: `1px solid #a8d5bb`, color: M.tenant }
      case 'ADMIN':
        return { background: M.dangerBg, border: `1px solid #f5c6c6`, color: M.danger }
      default:
        return { background: M.muted, border: `1px solid ${M.border}`, color: M.inkMid }
    }
  }

  const hasPassword = true

  const avatarColors = getAvatarColors(user?.role || '')
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  return (
    <Layout>
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: M.bg, fontFamily: M.body }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Email verification banner */}
          {user && !user.emailVerified && (
            <div
              className="mb-6 p-4 flex items-start gap-3"
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
              }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#d97706', fontFamily: M.body }}>
                  Votre adresse email n'est pas vérifiée
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#78350f', fontFamily: M.body }}>
                  Vérifiez votre email pour accéder à toutes les fonctionnalités.
                </p>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="font-semibold px-3 py-1.5 text-xs text-white flex-shrink-0 disabled:opacity-50 transition-colors"
                style={{
                  background: '#d97706',
                  borderRadius: '8px',
                  fontFamily: M.body,
                }}
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

          {/* Page Header */}
          <div className="mb-8">
            <p
              style={{
                fontFamily: M.body,
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: M.inkFaint,
                marginBottom: '6px',
              }}
            >
              Compte
            </p>
            <h1
              style={{
                fontFamily: M.display,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '40px',
                color: M.ink,
                lineHeight: 1.1,
                marginBottom: '6px',
              }}
            >
              Mon profil
            </h1>
            <p style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid }}>
              Gérez vos informations personnelles et vos paramètres de sécurité
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left: Profile summary card ── */}
            <div className="lg:col-span-1">
              <div style={cardStyle}>

                {/* Avatar + identity */}
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover"
                        style={{ border: `3px solid ${M.border}` }}
                      />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center select-none"
                        style={{
                          background: avatarColors.bg,
                          border: `3px solid ${M.border}`,
                          color: avatarColors.color,
                          fontFamily: M.display,
                          fontWeight: 700,
                          fontSize: '32px',
                          fontStyle: 'italic',
                        }}
                      >
                        {initials || <User className="w-10 h-10" />}
                      </div>
                    )}
                  </div>

                  <h2
                    style={{
                      fontFamily: M.display,
                      fontWeight: 700,
                      fontSize: '22px',
                      color: M.ink,
                      lineHeight: 1.2,
                    }}
                  >
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ fontFamily: M.body, color: M.inkMid }}
                  >
                    {user?.email}
                  </p>

                  {/* Role badge */}
                  <div
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1"
                    style={{
                      ...getRoleBadgeStyle(user?.role || ''),
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: M.body,
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {getRoleName(user?.role || '')}
                  </div>
                </div>

                {/* Verification status */}
                <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${M.border}` }}>
                  <SectionHeader label="Vérifications" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: M.inkMid, fontFamily: M.body }}>Email vérifié</span>
                      {user?.emailVerified ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#15803d' }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: M.danger }} />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: M.inkMid, fontFamily: M.body }}>Téléphone vérifié</span>
                      {user?.phoneVerified ? (
                        <CheckCircle className="w-4 h-4" style={{ color: '#15803d' }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: M.danger }} />
                      )}
                    </div>
                  </div>
                </div>

                {!user?.emailVerified && (
                  <div className="mt-5">
                    <button
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="w-full font-semibold px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
                      style={{
                        background: M.surface,
                        border: `1px solid ${M.border}`,
                        color: M.inkMid,
                        borderRadius: '8px',
                        fontFamily: M.body,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
                    >
                      {isResendingVerification ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />Envoi...
                        </span>
                      ) : (
                        'Vérifier mon email'
                      )}
                    </button>
                    <p className="text-xs text-center mt-2" style={{ color: M.inkFaint, fontFamily: M.body }}>
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
                  <SectionHeader label="Informations personnelles" />
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 font-semibold px-3 py-2 text-sm transition-colors"
                      style={{
                        background: M.surface,
                        border: `1px solid ${M.border}`,
                        color: M.inkMid,
                        borderRadius: '8px',
                        fontFamily: M.body,
                        flexShrink: 0,
                        marginTop: '-20px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex items-center gap-2" style={{ marginTop: '-20px' }}>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 font-semibold px-3 py-2 text-sm transition-colors disabled:opacity-50"
                        style={{
                          background: M.surface,
                          border: `1px solid ${M.border}`,
                          color: M.inkMid,
                          borderRadius: '8px',
                          fontFamily: M.body,
                        }}
                      >
                        <XIcon className="w-4 h-4" />
                        Annuler
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 font-semibold px-3 py-2 text-sm text-white transition-colors disabled:opacity-50"
                        style={{
                          background: M.night,
                          borderRadius: '8px',
                          fontFamily: M.body,
                        }}
                        onMouseEnter={(e) => !isSaving && (e.currentTarget.style.background = '#2d2d4e')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = M.night)}
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
                      <label
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: M.inkMid, fontFamily: M.body }}
                      >
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
                      <label
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: M.inkMid, fontFamily: M.body }}
                      >
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
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: M.inkMid, fontFamily: M.body }}
                    >
                      Email
                    </label>
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        background: M.muted,
                        border: `1px solid ${M.border}`,
                        borderRadius: '8px',
                      }}
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: M.inkFaint }} />
                      <span className="text-sm flex-1" style={{ color: M.ink, fontFamily: M.body }}>{user?.email}</span>
                      {user?.emailVerified && (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#15803d' }} />
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: M.inkFaint, fontFamily: M.body }}>
                      L'email ne peut pas être modifié
                    </p>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: M.inkMid, fontFamily: M.body }}
                    >
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
                        className="flex items-center gap-3 px-4 py-3"
                        style={{
                          background: M.muted,
                          border: `1px solid ${M.border}`,
                          borderRadius: '8px',
                        }}
                      >
                        <Phone className="w-4 h-4 flex-shrink-0" style={{ color: M.inkFaint }} />
                        <span className="text-sm flex-1" style={{ color: M.ink, fontFamily: M.body }}>
                          {user?.phone || 'Non renseigné'}
                        </span>
                        {user?.phoneVerified && (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#15803d' }} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: M.inkMid, fontFamily: M.body }}
                    >
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
                      <label
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: M.inkMid, fontFamily: M.body }}
                      >
                        Type de compte
                      </label>
                      <ReadonlyField icon={<Shield className="w-4 h-4" />} value={getRoleName(user?.role || '')} />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: M.inkMid, fontFamily: M.body }}
                      >
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
                  <SectionHeader label="Données extraites par l'IA" />

                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-9 h-9 flex items-center justify-center"
                      style={{
                        background: M.tenantLight,
                        border: `1px solid #a8d5bb`,
                        borderRadius: '10px',
                      }}
                    >
                      <CreditCard className="w-4 h-4" style={{ color: M.tenant }} />
                    </div>
                    <p className="text-xs" style={{ color: M.inkFaint, fontFamily: M.body }}>
                      Classifiées automatiquement depuis vos documents scannés
                    </p>
                  </div>

                  {/* Identité */}
                  {(user.birthDate || user.birthCity || user.nationality || user.documentNumber || user.documentExpiry || user.nationalNumber) && (
                    <div className="mt-4 mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: M.tenant }} />
                        <span
                          style={{
                            fontFamily: M.body,
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: M.tenant,
                          }}
                        >
                          Identité
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {user.birthDate && (
                          <div
                            className="flex items-center gap-2 p-3"
                            style={{ background: M.tenantLight, border: `1px solid #a8d5bb`, borderRadius: '8px' }}
                          >
                            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: M.tenant }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: M.tenant, fontFamily: M.body }}>Date de naissance</p>
                              <p className="text-sm" style={{ color: M.ink, fontFamily: M.body }}>{user.birthDate}</p>
                            </div>
                          </div>
                        )}
                        {user.birthCity && (
                          <div
                            className="flex items-center gap-2 p-3"
                            style={{ background: M.tenantLight, border: `1px solid #a8d5bb`, borderRadius: '8px' }}
                          >
                            <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: M.tenant }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: M.tenant, fontFamily: M.body }}>Lieu de naissance</p>
                              <p className="text-sm" style={{ color: M.ink, fontFamily: M.body }}>{user.birthCity}</p>
                            </div>
                          </div>
                        )}
                        {user.nationality && (
                          <div
                            className="flex items-center gap-2 p-3"
                            style={{ background: M.tenantLight, border: `1px solid #a8d5bb`, borderRadius: '8px' }}
                          >
                            <Globe className="w-4 h-4 flex-shrink-0" style={{ color: M.tenant }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: M.tenant, fontFamily: M.body }}>Nationalité</p>
                              <p className="text-sm" style={{ color: M.ink, fontFamily: M.body }}>{user.nationality}</p>
                            </div>
                          </div>
                        )}
                        {user.documentNumber && (
                          <div
                            className="flex items-center gap-2 p-3"
                            style={{ background: M.tenantLight, border: `1px solid #a8d5bb`, borderRadius: '8px' }}
                          >
                            <Hash className="w-4 h-4 flex-shrink-0" style={{ color: M.tenant }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: M.tenant, fontFamily: M.body }}>N° de pièce d'identité</p>
                              <p className="text-sm font-mono" style={{ color: M.ink }}>{user.documentNumber}</p>
                            </div>
                          </div>
                        )}
                        {user.documentExpiry && (
                          <div
                            className="flex items-center gap-2 p-3"
                            style={{ background: M.tenantLight, border: `1px solid #a8d5bb`, borderRadius: '8px' }}
                          >
                            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: M.tenant }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: M.tenant, fontFamily: M.body }}>Validité du document</p>
                              <p className="text-sm" style={{ color: M.ink, fontFamily: M.body }}>{user.documentExpiry}</p>
                            </div>
                          </div>
                        )}
                        {user.nationalNumber && (
                          <div
                            className="flex items-center gap-2 p-3"
                            style={{ background: M.tenantLight, border: `1px solid #a8d5bb`, borderRadius: '8px' }}
                          >
                            <Shield className="w-4 h-4 flex-shrink-0" style={{ color: M.tenant }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: M.tenant, fontFamily: M.body }}>N° sécurité sociale</p>
                              <p className="text-sm font-mono" style={{ color: M.ink }}>{user.nationalNumber}</p>
                            </div>
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
                        BULLETIN:        { label: 'Revenus — Bulletins de salaire', color: M.owner,   bg: M.ownerLight,  border: '#b8ccf0', dot: M.owner },
                        REVENUS_FISCAUX: { label: 'Revenus fiscaux',               color: M.tenant,  bg: M.tenantLight, border: '#a8d5bb', dot: M.tenant },
                        DOMICILE:        { label: 'Domicile',                       color: '#92400e', bg: '#fffbeb',     border: '#fde68a', dot: M.caramel },
                        GARANTIE:        { label: 'Garanties (Visale / Caution)',   color: M.owner,   bg: M.ownerLight,  border: '#b8ccf0', dot: M.owner },
                        BANCAIRE:        { label: 'Compte bancaire',                color: M.inkMid,  bg: M.muted,       border: M.border,  dot: M.inkFaint },
                        EMPLOI:          { label: 'Emploi',                         color: '#9a3412', bg: '#fff7ed',     border: '#fed7aa', dot: '#f97316' },
                        LOGEMENT:        { label: 'Logement',                       color: '#0f766e', bg: '#f0fdfa',     border: '#99f6e4', dot: '#14b8a6' },
                      }
                      const cfg = SECTION_CONFIG[family] ?? { label: family, color: M.inkMid, bg: M.muted, border: M.border, dot: M.inkFaint }
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
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                            <span
                              style={{
                                fontFamily: M.body,
                                fontSize: '11px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: cfg.color,
                              }}
                            >
                              {cfg.label}
                            </span>
                            {meta._docType ? (
                              <span className="text-xs ml-auto" style={{ color: M.inkFaint, fontFamily: M.body }}>{String(meta._docType)}</span>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {displayFields.map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 p-3"
                                style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '8px' }}
                              >
                                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: cfg.dot }} />
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: cfg.color, fontFamily: M.body }}>{FIELD_LABELS[key]}</p>
                                  <p className="text-sm" style={{ color: M.ink, fontFamily: M.body }}>
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
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div
                        className="w-12 h-12 flex items-center justify-center mb-4"
                        style={{
                          background: M.muted,
                          border: `1px solid ${M.border}`,
                          borderRadius: '12px',
                        }}
                      >
                        <CreditCard className="w-6 h-6" style={{ color: M.inkFaint }} />
                      </div>
                      <p
                        style={{
                          fontFamily: M.display,
                          fontWeight: 700,
                          fontStyle: 'italic',
                          fontSize: '18px',
                          color: M.ink,
                          marginBottom: '6px',
                        }}
                      >
                        Aucune donnée extraite
                      </p>
                      <p className="text-xs max-w-xs" style={{ color: M.inkFaint, fontFamily: M.body, lineHeight: 1.6 }}>
                        Déposez vos documents dans le dossier locataire — l'IA extraira et classifiera automatiquement vos données.
                      </p>
                    </div>
                  )}

                  <p className="text-xs mt-4 flex items-center gap-1.5" style={{ color: M.inkFaint, fontFamily: M.body }}>
                    <Shield className="w-3.5 h-3.5" />
                    Données chiffrées et sécurisées — utilisées uniquement pour valider votre dossier locataire.
                  </p>
                </div>
              )}

              {/* ── Section: Sécurité ── */}
              <div style={cardStyle}>
                <SectionHeader label="Sécurité" />
                <div className="space-y-3">
                  {hasPassword && (
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-left"
                      style={{
                        background: M.surface,
                        border: `1px solid ${M.border}`,
                        color: M.inkMid,
                        borderRadius: '8px',
                        fontFamily: M.body,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
                    >
                      <Lock className="w-4 h-4" style={{ color: M.inkFaint }} />
                      Changer le mot de passe
                    </button>
                  )}

                </div>
              </div>

              {/* ── Section: Comptes liés ── */}
              <div style={cardStyle}>
                <SectionHeader label="Comptes liés" />
                <div
                  className="flex items-center justify-between p-4"
                  style={{
                    background: M.muted,
                    border: `1px solid ${M.border}`,
                    borderRadius: '8px',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: M.ink, fontFamily: M.body }}>Google</p>
                      <p className="text-xs" style={{ color: M.inkFaint, fontFamily: M.body }}>
                        Connectez-vous avec votre compte Google
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1"
                    style={{
                      background: M.surface,
                      border: `1px solid ${M.border}`,
                      color: M.inkFaint,
                      borderRadius: '20px',
                      fontFamily: M.body,
                    }}
                  >
                    {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Disponible' : 'Non configuré'}
                  </span>
                </div>
              </div>

              {/* ── Section: Zone de danger ── */}
              <div
                style={{
                  ...cardStyle,
                  border: `1px solid #f5c6c6`,
                  background: M.dangerBg,
                }}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <div
                    className="w-9 h-9 flex items-center justify-center"
                    style={{
                      background: '#fee2e2',
                      border: `1px solid #f5c6c6`,
                      borderRadius: '10px',
                    }}
                  >
                    <AlertTriangle className="w-4 h-4" style={{ color: M.danger }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: M.body,
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: M.danger,
                    }}
                  >
                    Zone de danger
                  </h3>
                </div>
                <div style={{ height: '1px', background: '#f5c6c6', margin: '12px 0 16px' }} />
                <p className="text-sm mb-4" style={{ color: M.inkMid, fontFamily: M.body }}>
                  Une fois votre compte supprimé, toutes vos données seront définitivement perdues.
                  Cette action est irréversible.
                </p>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="inline-flex items-center gap-2 font-semibold px-4 py-2.5 text-sm transition-colors"
                  style={{
                    background: M.dangerBg,
                    border: `1px solid #f5c6c6`,
                    color: M.danger,
                    borderRadius: '8px',
                    fontFamily: M.body,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.borderColor = '#f5c6c6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = M.dangerBg
                    e.currentTarget.style.borderColor = '#f5c6c6'
                  }}
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

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText('') }}
          />
          <div
            className="relative w-full max-w-md mx-4 p-6"
            style={{
              background: M.surface,
              borderRadius: '16px',
              border: `1px solid ${M.border}`,
              boxShadow: '0 20px 60px rgba(13,12,10,0.15)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ background: M.dangerBg, border: `1px solid #f5c6c6`, borderRadius: '10px' }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: M.danger }} />
              </div>
              <h3
                style={{
                  fontFamily: M.display,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: '20px',
                  color: M.ink,
                }}
              >
                Supprimer votre compte ?
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: M.inkMid, fontFamily: M.body }}>
              Cette action est <strong>irréversible</strong>. Toutes vos données, propriétés,
              contrats et messages seront supprimés définitivement.
            </p>
            <div className="mb-4">
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: M.inkMid, fontFamily: M.body }}
              >
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
                className="flex-1 font-semibold px-4 py-2.5 text-sm transition-colors"
                style={{
                  background: M.surface,
                  border: `1px solid ${M.border}`,
                  color: M.inkMid,
                  borderRadius: '8px',
                  fontFamily: M.body,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
                onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
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
                className="flex-1 font-semibold px-4 py-2.5 text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: M.danger, borderRadius: '8px', fontFamily: M.body }}
                onMouseEnter={(e) => deleteConfirmText === 'SUPPRIMER' && (e.currentTarget.style.background = '#7f1d1d')}
                onMouseLeave={(e) => (e.currentTarget.style.background = M.danger)}
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
