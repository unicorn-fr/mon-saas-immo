import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth.service'
import ChangePasswordModal from '../../components/auth/ChangePasswordModal'
import toast from 'react-hot-toast'
import {
  User,
  Bell,
  Shield,
  Lock,
  ChevronRight,
  Check,
  MessageSquare,
  FileText,
  Calendar,
  Home,
  AlertCircle,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X as XIcon,
  AlertTriangle,
  Loader2,
  Trash2,
  CreditCard,
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
  caramelBorder: '#f3c99a',
  border: '#e4e1db',
  borderMid: '#ccc9c3',
  danger: '#9b1c1c',
  dangerBg: '#fef2f2',
  dangerBorder: '#fca5a5',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

const cardStyle: React.CSSProperties = {
  background: M.surface,
  border: `1px solid ${M.border}`,
  borderRadius: '12px',
  padding: '1.75rem',
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
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.10)'
}
function onBlurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = M.border
  e.currentTarget.style.boxShadow = 'none'
}

// ─── Notification Preferences ─────────────────────────────────────────────────

interface NotifPrefs {
  visitConfirmed: boolean
  visitCancelled: boolean
  visitReminder: boolean
  applicationAccepted: boolean
  applicationRejected: boolean
  applicationUpdated: boolean
  newMessage: boolean
  contractReady: boolean
  contractSigned: boolean
  contractEvent: boolean
}

const NOTIF_DEFAULTS: NotifPrefs = {
  visitConfirmed: true,
  visitCancelled: true,
  visitReminder: true,
  applicationAccepted: true,
  applicationRejected: true,
  applicationUpdated: true,
  newMessage: true,
  contractReady: true,
  contractSigned: true,
  contractEvent: false,
}

function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem('tenant_notif_prefs')
    if (raw) return { ...NOTIF_DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...NOTIF_DEFAULTS }
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        background: checked ? M.night : M.borderMid,
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
      aria-checked={checked}
      role="switch"
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '22px' : '3px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#ffffff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function NotifRow({ icon, label, checked, onChange }: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span style={{ color: M.inkFaint }}>{icon}</span>
        <span style={{ fontSize: '14px', color: M.ink }}>{label}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

type TabId = 'profil' | 'notifications' | 'securite' | 'confidentialite' | 'abonnement'

const TABS: { id: TabId; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'profil',          label: 'Mon profil',         icon: <User size={16} />,        description: 'Informations personnelles' },
  { id: 'notifications',   label: 'Notifications',      icon: <Bell size={16} />,        description: 'Préférences de notifications' },
  { id: 'securite',        label: 'Sécurité',           icon: <Lock size={16} />,        description: 'Mot de passe et accès' },
  { id: 'confidentialite', label: 'Confidentialité',    icon: <Shield size={16} />,      description: 'RGPD et données' },
  { id: 'abonnement',      label: 'Abonnement',         icon: <CreditCard size={16} />,  description: 'Plan et facturation' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TenantSettings() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('profil')

  // ── Notif state ──
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs)
  const savedNotifPrefs = useRef<NotifPrefs>(loadNotifPrefs())
  const [notifDirty, setNotifDirty] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  // ── Profile state ──
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  })

  // ── Security state ──
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Intercept browser close when dirty
  const isDirty = notifDirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ── Notif handlers ──
  function updateNotif(key: keyof NotifPrefs, value: boolean) {
    setNotifPrefs(prev => ({ ...prev, [key]: value }))
    setNotifSaved(false)
    setNotifDirty(true)
  }

  function handleNotifCancel() {
    setNotifPrefs({ ...savedNotifPrefs.current })
    setNotifDirty(false)
    setNotifSaved(false)
  }

  async function handleNotifSave() {
    setNotifSaving(true)
    try {
      localStorage.setItem('tenant_notif_prefs', JSON.stringify(notifPrefs))
      savedNotifPrefs.current = { ...notifPrefs }
      await new Promise(r => setTimeout(r, 300))
      setNotifDirty(false)
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 3000)
    } finally {
      setNotifSaving(false)
    }
  }

  // ── Profile handlers ──
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleProfileSave() {
    setIsSaving(true)
    try {
      await updateProfile(formData)
      toast.success('Profil mis à jour avec succès')
      setIsEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  function handleProfileCancel() {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    })
    setIsEditing(false)
  }

  async function handleResendVerification() {
    setIsResendingVerification(true)
    try {
      await authService.resendVerification()
      toast.success('Email de vérification envoyé !')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'email")
    } finally {
      setIsResendingVerification(false)
    }
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  return (
    <Layout>
      {/* ── Dirty bar (notifications) ─────────────────────────────────────── */}
      {notifDirty && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: M.caramelLight,
          border: `1px solid ${M.caramelBorder}`,
          borderLeft: 'none',
          borderRight: 'none',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: M.body,
          gap: '12px',
        }}>
          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
            Modifications non enregistrées
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNotifCancel}
              style={{ fontSize: '13px', fontFamily: M.body, color: '#92400e', background: 'transparent', border: `1px solid ${M.caramelBorder}`, borderRadius: '6px', padding: '4px 14px', cursor: 'pointer', fontWeight: 500 }}
            >
              Annuler
            </button>
            <button
              onClick={handleNotifSave}
              disabled={notifSaving}
              style={{ fontSize: '13px', fontFamily: M.body, color: '#ffffff', background: '#92400e', border: 'none', borderRadius: '6px', padding: '4px 14px', cursor: notifSaving ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: notifSaving ? 0.7 : 1 }}
            >
              {notifSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: M.bg, minHeight: '100vh', fontFamily: M.body }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Page Header */}
          <div className="mb-8">
            <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: M.inkFaint, fontFamily: M.body, marginBottom: '6px' }}>
              Locataire
            </p>
            <h1 style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '40px', color: M.ink, lineHeight: 1.1, marginBottom: '8px' }}>
              Paramètres
            </h1>
            <p style={{ fontSize: '14px', color: M.inkMid }}>
              Gérez votre profil, vos notifications et vos préférences de compte.
            </p>
          </div>

          {/* ── Layout: sidebar + content ── */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sidebar */}
            <nav
              className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0"
              style={{ flexShrink: 0, width: '100%', maxWidth: '100%' }}
            >
              <div
                className="flex lg:flex-col gap-1"
                style={{ minWidth: 'max-content', width: '100%' }}
              >
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-3 text-left transition-all"
                      style={{
                        background: isActive ? M.surface : 'transparent',
                        border: isActive ? `1px solid ${M.border}` : '1px solid transparent',
                        borderRadius: '10px',
                        padding: '0.625rem 0.875rem',
                        cursor: 'pointer',
                        fontFamily: M.body,
                        boxShadow: isActive ? '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)' : 'none',
                        width: '100%',
                        minWidth: '160px',
                      }}
                    >
                      <span style={{
                        color: isActive ? M.night : M.inkFaint,
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}>
                        {tab.icon}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? M.ink : M.inkMid,
                        whiteSpace: 'nowrap',
                      }}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: M.caramel, flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* ── PROFIL ─────────────────────────────────────────────────── */}
              {activeTab === 'profil' && (
                <div className="flex flex-col gap-5">

                  {/* Email verification banner */}
                  {user && !user.emailVerified && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem' }} className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#d97706', fontFamily: M.body }}>Votre adresse email n'est pas vérifiée</p>
                        <p className="text-sm mt-0.5" style={{ color: '#78350f', fontFamily: M.body }}>Vérifiez votre email pour accéder à toutes les fonctionnalités.</p>
                      </div>
                      <button
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="font-semibold px-3 py-1.5 text-xs text-white flex-shrink-0 disabled:opacity-50"
                        style={{ background: '#d97706', borderRadius: '8px', fontFamily: M.body, border: 'none', cursor: isResendingVerification ? 'not-allowed' : 'pointer' }}
                      >
                        {isResendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : "Renvoyer l'email"}
                      </button>
                    </div>
                  )}

                  {/* Profile card */}
                  <div style={cardStyle}>
                    {/* Avatar + name row */}
                    <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${M.border}` }}>
                      <div
                        className="flex items-center justify-center select-none flex-shrink-0"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: M.caramelLight,
                          border: `2px solid ${M.caramelBorder}`,
                          color: M.caramel,
                          fontFamily: M.display,
                          fontWeight: 700,
                          fontSize: '22px',
                          fontStyle: 'italic',
                        }}
                      >
                        {user?.avatar ? (
                          <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          initials || <User size={22} />
                        )}
                      </div>
                      <div>
                        <p style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.ink, fontStyle: 'italic' }}>
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p style={{ fontSize: '13px', color: M.inkMid }}>{user?.email}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-2"
                            style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: M.inkMid, fontFamily: M.body, cursor: 'pointer', fontWeight: 500 }}
                          >
                            <Edit2 size={13} />
                            Modifier
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleProfileCancel}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1.5"
                              style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: M.inkMid, fontFamily: M.body, cursor: 'pointer', fontWeight: 500 }}
                            >
                              <XIcon size={13} />
                              Annuler
                            </button>
                            <button
                              onClick={handleProfileSave}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1.5 text-white"
                              style={{ background: M.night, border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontFamily: M.body, cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: isSaving ? 0.7 : 1 }}
                            >
                              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                              Enregistrer
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1.5" style={{ color: M.inkMid, fontFamily: M.body }}>Prénom</label>
                          {isEditing ? (
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} disabled={isSaving} />
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3" style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px' }}>
                              <User size={15} style={{ color: M.inkFaint }} />
                              <span style={{ fontSize: '14px', color: M.ink, fontFamily: M.body }}>{user?.firstName || '—'}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1.5" style={{ color: M.inkMid, fontFamily: M.body }}>Nom</label>
                          {isEditing ? (
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} disabled={isSaving} />
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3" style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px' }}>
                              <User size={15} style={{ color: M.inkFaint }} />
                              <span style={{ fontSize: '14px', color: M.ink, fontFamily: M.body }}>{user?.lastName || '—'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Email (readonly) */}
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: M.inkMid, fontFamily: M.body }}>Email</label>
                        <div className="flex items-center gap-3 px-4 py-3" style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px' }}>
                          <Mail size={15} style={{ color: M.inkFaint }} />
                          <span style={{ fontSize: '14px', color: M.ink, fontFamily: M.body, flex: 1 }}>{user?.email}</span>
                          {user?.emailVerified ? (
                            <CheckCircle size={15} style={{ color: '#15803d', flexShrink: 0 }} />
                          ) : (
                            <XCircle size={15} style={{ color: M.danger, flexShrink: 0 }} />
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: M.inkFaint, marginTop: '4px', fontFamily: M.body }}>
                          L'email ne peut pas être modifié.
                          {!user?.emailVerified && (
                            <button
                              onClick={handleResendVerification}
                              disabled={isResendingVerification}
                              style={{ background: 'none', border: 'none', color: M.caramel, fontWeight: 600, cursor: 'pointer', padding: '0 4px', fontFamily: M.body, fontSize: '12px' }}
                            >
                              {isResendingVerification ? 'Envoi…' : 'Vérifier maintenant →'}
                            </button>
                          )}
                        </p>
                      </div>

                      {/* Téléphone */}
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: M.inkMid, fontFamily: M.body }}>Téléphone</label>
                        {isEditing ? (
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="06 12 34 56 78" style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} disabled={isSaving} />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3" style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px' }}>
                            <Phone size={15} style={{ color: M.inkFaint }} />
                            <span style={{ fontSize: '14px', color: M.ink, fontFamily: M.body }}>{user?.phone || 'Non renseigné'}</span>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: M.inkMid, fontFamily: M.body }}>Bio</label>
                        {isEditing ? (
                          <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Parlez-nous de vous…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={onFocusInput} onBlur={onBlurInput} disabled={isSaving} />
                        ) : (
                          <div className="flex items-start gap-3 px-4 py-3" style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px' }}>
                            <FileText size={15} style={{ color: M.inkFaint, marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', color: M.ink, fontFamily: M.body }}>{user?.bio || 'Aucune bio renseignée'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verifications card */}
                  <div style={cardStyle}>
                    <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '12px', fontFamily: M.body, fontWeight: 600 }}>
                      Vérifications
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: M.inkMid, fontFamily: M.body }}>Email vérifié</span>
                        {user?.emailVerified
                          ? <CheckCircle size={16} style={{ color: '#15803d' }} />
                          : <XCircle size={16} style={{ color: M.danger }} />}
                      </div>
                      <div style={{ height: '1px', background: M.border }} />
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: M.inkMid, fontFamily: M.body }}>Téléphone vérifié</span>
                        {user?.phoneVerified
                          ? <CheckCircle size={16} style={{ color: '#15803d' }} />
                          : <XCircle size={16} style={{ color: M.danger }} />}
                      </div>
                    </div>
                  </div>

                  {/* Dossier locatif shortcut */}
                  <div style={cardStyle}>
                    <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '12px', fontFamily: M.body, fontWeight: 600 }}>
                      Dossier locatif
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate('/dossier')}
                        className="flex items-center justify-between w-full"
                        style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '0.625rem 1rem', color: M.ink, fontSize: '14px', fontFamily: M.body, cursor: 'pointer' }}
                      >
                        <span className="flex items-center gap-2">
                          <FileText size={14} style={{ color: M.inkMid }} />
                          Mon dossier locatif
                        </span>
                        <ChevronRight size={14} style={{ color: M.inkFaint }} />
                      </button>
                      <button
                        onClick={() => navigate('/dossier/partages')}
                        className="flex items-center justify-between w-full"
                        style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '0.625rem 1rem', color: M.ink, fontSize: '14px', fontFamily: M.body, cursor: 'pointer' }}
                      >
                        <span className="flex items-center gap-2">
                          <User size={14} style={{ color: M.inkMid }} />
                          Gérer les partages
                        </span>
                        <ChevronRight size={14} style={{ color: M.inkFaint }} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS ──────────────────────────────────────────── */}
              {activeTab === 'notifications' && (
                <div style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1">
                    <Bell size={16} style={{ color: M.inkMid }} />
                    <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.ink }}>
                      Notifications
                    </h2>
                  </div>
                  <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '24px' }}>
                    Choisissez pour quels événements vous souhaitez être notifié.
                  </p>

                  {/* Visites */}
                  <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px', fontWeight: 600 }}>Visites</p>
                  <div className="flex flex-col gap-3 mb-5">
                    <NotifRow icon={<Check size={15} />} label="Visite confirmée par le propriétaire" checked={notifPrefs.visitConfirmed} onChange={v => updateNotif('visitConfirmed', v)} />
                    <NotifRow icon={<Calendar size={15} />} label="Visite annulée" checked={notifPrefs.visitCancelled} onChange={v => updateNotif('visitCancelled', v)} />
                    <NotifRow icon={<Calendar size={15} />} label="Rappel de visite (24h avant)" checked={notifPrefs.visitReminder} onChange={v => updateNotif('visitReminder', v)} />
                  </div>

                  <div style={{ height: '1px', background: M.border, marginBottom: '16px' }} />
                  <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px', fontWeight: 600 }}>Candidatures</p>
                  <div className="flex flex-col gap-3 mb-5">
                    <NotifRow icon={<Check size={15} />} label="Candidature acceptée" checked={notifPrefs.applicationAccepted} onChange={v => updateNotif('applicationAccepted', v)} />
                    <NotifRow icon={<AlertCircle size={15} />} label="Candidature refusée" checked={notifPrefs.applicationRejected} onChange={v => updateNotif('applicationRejected', v)} />
                    <NotifRow icon={<Home size={15} />} label="Mise à jour de statut" checked={notifPrefs.applicationUpdated} onChange={v => updateNotif('applicationUpdated', v)} />
                  </div>

                  <div style={{ height: '1px', background: M.border, marginBottom: '16px' }} />
                  <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px', fontWeight: 600 }}>Messagerie</p>
                  <div className="flex flex-col gap-3 mb-5">
                    <NotifRow icon={<MessageSquare size={15} />} label="Nouveau message" checked={notifPrefs.newMessage} onChange={v => updateNotif('newMessage', v)} />
                  </div>

                  <div style={{ height: '1px', background: M.border, marginBottom: '16px' }} />
                  <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px', fontWeight: 600 }}>Contrats</p>
                  <div className="flex flex-col gap-3 mb-6">
                    <NotifRow icon={<FileText size={15} />} label="Bail prêt à signer" checked={notifPrefs.contractReady} onChange={v => updateNotif('contractReady', v)} />
                    <NotifRow icon={<FileText size={15} />} label="Contrat signé par toutes les parties" checked={notifPrefs.contractSigned} onChange={v => updateNotif('contractSigned', v)} />
                    <NotifRow icon={<FileText size={15} />} label="Événements contrat (rappels, renouvellement)" checked={notifPrefs.contractEvent} onChange={v => updateNotif('contractEvent', v)} />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNotifSave}
                      disabled={notifSaving}
                      className="inline-flex items-center gap-2 text-white"
                      style={{
                        background: notifSaved ? '#15803d' : M.night,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.625rem 1.5rem',
                        fontSize: '14px',
                        fontFamily: M.body,
                        cursor: notifSaving ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        opacity: notifSaving ? 0.7 : 1,
                        transition: 'background 0.3s',
                      }}
                    >
                      <Check size={14} />
                      {notifSaving ? 'Enregistrement…' : notifSaved ? 'Préférences enregistrées' : 'Enregistrer les préférences'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SÉCURITÉ ───────────────────────────────────────────────── */}
              {activeTab === 'securite' && (
                <div className="flex flex-col gap-5">

                  {/* Change password */}
                  <div style={cardStyle}>
                    <div className="flex items-center gap-2 mb-1">
                      <Lock size={16} style={{ color: M.inkMid }} />
                      <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.ink }}>
                        Mot de passe
                      </h2>
                    </div>
                    <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '16px' }}>
                      Modifiez votre mot de passe de connexion.
                    </p>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="flex items-center gap-3 w-full transition-colors"
                      style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '0.75rem 1rem', color: M.ink, fontSize: '14px', fontFamily: M.body, cursor: 'pointer', justifyContent: 'space-between' }}
                      onMouseEnter={e => (e.currentTarget.style.background = M.border)}
                      onMouseLeave={e => (e.currentTarget.style.background = M.muted)}
                    >
                      <span className="flex items-center gap-2">
                        <Lock size={14} style={{ color: M.inkMid }} />
                        Changer le mot de passe
                      </span>
                      <ChevronRight size={14} style={{ color: M.inkFaint }} />
                    </button>
                  </div>

                  {/* Google account */}
                  <div style={cardStyle}>
                    <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '12px', fontFamily: M.body, fontWeight: 600 }}>
                      Comptes liés
                    </p>
                    <div className="flex items-center justify-between p-4" style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px' }}>
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: M.ink, fontFamily: M.body }}>Google</p>
                          <p className="text-xs" style={{ color: M.inkFaint, fontFamily: M.body }}>Connectez-vous avec votre compte Google</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1" style={{ background: M.surface, border: `1px solid ${M.border}`, color: M.inkFaint, borderRadius: '20px', fontFamily: M.body }}>
                        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Disponible' : 'Non configuré'}
                      </span>
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div style={{ ...cardStyle, background: M.dangerBg, border: `1px solid ${M.dangerBorder}` }}>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-9 h-9 flex items-center justify-center" style={{ background: '#fee2e2', border: '1px solid #f5c6c6', borderRadius: '10px' }}>
                        <AlertTriangle size={16} style={{ color: M.danger }} />
                      </div>
                      <h3 style={{ fontFamily: M.body, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: M.danger }}>
                        Zone de danger
                      </h3>
                    </div>
                    <div style={{ height: '1px', background: '#f5c6c6', marginBottom: '16px' }} />
                    <p className="text-sm mb-4" style={{ color: M.inkMid, fontFamily: M.body }}>
                      Une fois votre compte supprimé, toutes vos données seront définitivement perdues. Cette action est irréversible.
                    </p>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="inline-flex items-center gap-2 font-semibold text-sm transition-colors"
                      style={{ background: M.dangerBg, border: '1px solid #f5c6c6', color: M.danger, borderRadius: '8px', padding: '0.625rem 1rem', fontFamily: M.body, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                      onMouseLeave={e => (e.currentTarget.style.background = M.dangerBg)}
                    >
                      <Trash2 size={14} />
                      Supprimer mon compte
                    </button>
                  </div>
                </div>
              )}

              {/* ── CONFIDENTIALITÉ ────────────────────────────────────────── */}
              {activeTab === 'confidentialite' && (
                <div className="flex flex-col gap-5">
                  <div style={cardStyle}>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={16} style={{ color: M.inkMid }} />
                      <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.ink }}>
                        Confidentialité & RGPD
                      </h2>
                    </div>
                    <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                      Accédez à vos droits : consultation, rectification, portabilité et suppression de vos données personnelles.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate('/privacy')}
                        className="flex items-center justify-between w-full transition-colors"
                        style={{ background: M.night, border: 'none', borderRadius: '8px', padding: '0.75rem 1rem', color: '#ffffff', fontSize: '14px', fontFamily: M.body, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#2d2d4e')}
                        onMouseLeave={e => (e.currentTarget.style.background = M.night)}
                      >
                        <span className="flex items-center gap-2">
                          <Shield size={14} />
                          Centre de confidentialité
                        </span>
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => navigate('/dossier/partages')}
                        className="flex items-center justify-between w-full"
                        style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '0.75rem 1rem', color: M.ink, fontSize: '14px', fontFamily: M.body, cursor: 'pointer' }}
                      >
                        <span className="flex items-center gap-2">
                          <User size={14} style={{ color: M.inkMid }} />
                          Gérer les partages de dossier
                        </span>
                        <ChevronRight size={14} style={{ color: M.inkFaint }} />
                      </button>
                    </div>
                  </div>

                  {/* Export data */}
                  <div style={cardStyle}>
                    <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '12px', fontFamily: M.body, fontWeight: 600 }}>
                      Portabilité des données
                    </p>
                    <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '16px', fontFamily: M.body }}>
                      Conformément au RGPD, vous pouvez demander l'export de l'ensemble de vos données personnelles.
                    </p>
                    <button
                      onClick={() => toast.success('Votre demande d\'export a été prise en compte. Vous recevrez un email sous 48h.')}
                      className="inline-flex items-center gap-2"
                      style={{ background: M.caramelLight, border: `1px solid ${M.caramelBorder}`, borderRadius: '8px', padding: '0.625rem 1rem', color: '#92400e', fontSize: '14px', fontFamily: M.body, cursor: 'pointer', fontWeight: 500 }}
                    >
                      <FileText size={14} />
                      Exporter mes données
                    </button>
                  </div>
                </div>
              )}

              {/* ── ABONNEMENT ─────────────────────────────────────────────── */}
              {activeTab === 'abonnement' && (
                <div style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={16} style={{ color: M.inkMid }} />
                    <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.ink }}>
                      Abonnement
                    </h2>
                  </div>
                  <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                    Gérez votre plan et accédez aux fonctionnalités premium.
                  </p>

                  {/* Current plan */}
                  <div className="mb-5 p-4" style={{ background: M.caramelLight, border: `1px solid ${M.caramelBorder}`, borderRadius: '10px' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', fontFamily: M.body }}>Plan actuel</p>
                        <p style={{ fontFamily: M.display, fontWeight: 700, fontStyle: 'italic', fontSize: '20px', color: M.ink, marginTop: '2px' }}>Gratuit</p>
                      </div>
                      <span style={{ background: M.caramel, color: '#ffffff', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, fontFamily: M.body }}>
                        Actif
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/pricing')}
                    className="flex items-center justify-between w-full transition-colors"
                    style={{ background: M.night, border: 'none', borderRadius: '8px', padding: '0.75rem 1rem', color: '#ffffff', fontSize: '14px', fontFamily: M.body, cursor: 'pointer', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2d2d4e')}
                    onMouseLeave={e => (e.currentTarget.style.background = M.night)}
                  >
                    <span>Découvrir les plans premium</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText('') }} />
          <div className="relative w-full max-w-md mx-4 p-6" style={{ background: M.surface, borderRadius: '16px', border: `1px solid ${M.border}`, boxShadow: '0 20px 60px rgba(13,12,10,0.15)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center" style={{ background: M.dangerBg, border: '1px solid #f5c6c6', borderRadius: '10px' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: M.danger }} />
              </div>
              <h3 style={{ fontFamily: M.display, fontWeight: 700, fontStyle: 'italic', fontSize: '20px', color: M.ink }}>
                Supprimer votre compte ?
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: M.inkMid, fontFamily: M.body }}>
              Cette action est <strong>irréversible</strong>. Toutes vos données, candidatures, contrats et messages seront supprimés définitivement.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5" style={{ color: M.inkMid, fontFamily: M.body }}>
                Tapez <strong>SUPPRIMER</strong> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
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
                style={{ background: M.surface, border: `1px solid ${M.border}`, color: M.inkMid, borderRadius: '8px', fontFamily: M.body, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = M.muted)}
                onMouseLeave={e => (e.currentTarget.style.background = M.surface)}
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
                style={{ background: M.danger, borderRadius: '8px', fontFamily: M.body, border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => deleteConfirmText === 'SUPPRIMER' && (e.currentTarget.style.background = '#7f1d1d')}
                onMouseLeave={e => (e.currentTarget.style.background = M.danger)}
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
