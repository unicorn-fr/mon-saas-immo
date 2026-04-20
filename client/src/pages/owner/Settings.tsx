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
  CreditCard,
  Sliders,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  DollarSign,
  Edit2,
  Save,
  X,
  AlertTriangle,
  Loader2,
  Trash2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react'

// ─── Design Tokens ────────────────────────────────────────────────────────────

const M = {
  bg: '#fafaf8',
  surface: '#ffffff',
  muted: '#f4f2ee',
  inputBg: '#f8f7f4',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  owner: '#1a3270',
  ownerLight: '#eaf0fb',
  ownerBorder: '#b8ccf0',
  border: '#e4e1db',
  borderMid: '#ccc9c3',
  caramel: '#c4976a',
  caramelLight: '#fdf5ec',
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
  padding: '1.5rem',
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: M.inputBg,
  border: `1px solid ${M.border}`,
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '14px',
  fontFamily: M.body,
  color: M.ink,
  outline: 'none',
  boxSizing: 'border-box',
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = 'profile' | 'notifications' | 'security' | 'preferences' | 'subscription'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Mon profil', icon: <User size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'security', label: 'Sécurité', icon: <Shield size={15} /> },
  { id: 'preferences', label: 'Préférences', icon: <Sliders size={15} /> },
  { id: 'subscription', label: 'Abonnement', icon: <CreditCard size={15} /> },
]

// ─── Notification Preferences ─────────────────────────────────────────────────

interface NotifPrefs {
  visitRequested: boolean
  visitConfirmed: boolean
  visitCancelled: boolean
  newApplication: boolean
  applicationUpdated: boolean
  newMessage: boolean
  contractSigned: boolean
  contractEvent: boolean
  paymentReceived: boolean
  paymentLate: boolean
}

const NOTIF_DEFAULTS: NotifPrefs = {
  visitRequested: true,
  visitConfirmed: true,
  visitCancelled: true,
  newApplication: true,
  applicationUpdated: true,
  newMessage: true,
  contractSigned: true,
  contractEvent: false,
  paymentReceived: true,
  paymentLate: true,
}

function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem('owner_notif_prefs')
    if (raw) return { ...NOTIF_DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...NOTIF_DEFAULTS }
}

// ─── Property Defaults ────────────────────────────────────────────────────────

interface PropertyDefaults {
  defaultVisibility: 'PUBLISHED' | 'DRAFT'
  requireDossier: boolean
  minMonthlyIncome: number
  acceptGuarantor: boolean
  acceptPets: boolean
  acceptSmoking: boolean
}

const PROPERTY_DEFAULTS: PropertyDefaults = {
  defaultVisibility: 'PUBLISHED',
  requireDossier: true,
  minMonthlyIncome: 3,
  acceptGuarantor: true,
  acceptPets: false,
  acceptSmoking: false,
}

function loadPropertyDefaults(): PropertyDefaults {
  try {
    const raw = localStorage.getItem('owner_property_defaults')
    if (raw) return { ...PROPERTY_DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...PROPERTY_DEFAULTS }
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        background: checked ? M.night : M.borderMid,
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 22 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )
}

// ─── NotifRow ─────────────────────────────────────────────────────────────────

function NotifRow({
  icon,
  label,
  checked,
  onChange,
}: {
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

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider({ my = 16 }: { my?: number }) {
  return <div style={{ height: 1, background: M.border, marginTop: my, marginBottom: my }} />
}

// ─── Save Bar ─────────────────────────────────────────────────────────────────

function SaveBar({
  visible,
  saving,
  onCancel,
  onSave,
}: {
  visible: boolean
  saving: boolean
  onCancel: () => void
  onSave: () => void
}) {
  if (!visible) return null
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fdf5ec',
        borderBottom: '1px solid #f3c99a',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: M.body,
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
        Modifications non enregistrées
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          style={{
            fontSize: '13px',
            fontFamily: M.body,
            color: '#92400e',
            background: 'transparent',
            border: '1px solid #f3c99a',
            borderRadius: '6px',
            padding: '4px 14px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            fontSize: '13px',
            fontFamily: M.body,
            color: '#ffffff',
            background: '#92400e',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 14px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '11px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: M.inkFaint,
        fontFamily: M.body,
        marginBottom: '10px',
      }}
    >
      {children}
    </p>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerSettings() {
  const { user, updateProfile, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabId>('profile')

  // ── Profile tab state ──
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [phone, setPhone] = useState((user as { phone?: string })?.phone ?? '')
  const [bio, setBio] = useState((user as { bio?: string })?.bio ?? '')
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  // ── Security tab state ──
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteSaving, setDeleteSaving] = useState(false)

  // ── Notifications tab state ──
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs)
  const [notifDirty, setNotifDirty] = useState(false)
  const savedNotifPrefs = useRef<NotifPrefs>(loadNotifPrefs())

  // ── Preferences tab state ──
  const [propertyDefaults, setPropertyDefaults] = useState<PropertyDefaults>(loadPropertyDefaults)
  const [propertyDirty, setPropertyDirty] = useState(false)
  const savedPropertyDefaults = useRef<PropertyDefaults>(loadPropertyDefaults())

  const [saving, setSaving] = useState(false)

  // Sync profile fields when user loads
  useEffect(() => {
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
    setPhone((user as { phone?: string })?.phone ?? '')
    setBio((user as { bio?: string })?.bio ?? '')
  }, [user?.firstName, user?.lastName])

  // Warn on tab close when dirty
  useEffect(() => {
    const isDirty = notifDirty || propertyDirty
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [notifDirty, propertyDirty])

  // ── Notifications handlers ──

  function updateNotif(key: keyof NotifPrefs, value: boolean) {
    setNotifPrefs(prev => ({ ...prev, [key]: value }))
    setNotifDirty(true)
  }

  function handleNotifCancel() {
    setNotifPrefs({ ...savedNotifPrefs.current })
    setNotifDirty(false)
  }

  async function handleNotifSave() {
    setSaving(true)
    try {
      localStorage.setItem('owner_notif_prefs', JSON.stringify(notifPrefs))
      savedNotifPrefs.current = { ...notifPrefs }
      await new Promise(r => setTimeout(r, 250))
      setNotifDirty(false)
      toast.success('Notifications enregistrées')
    } finally {
      setSaving(false)
    }
  }

  // ── Preferences handlers ──

  function updatePropertyDefault<K extends keyof PropertyDefaults>(key: K, value: PropertyDefaults[K]) {
    setPropertyDefaults(prev => ({ ...prev, [key]: value }))
    setPropertyDirty(true)
  }

  function handlePropertyCancel() {
    setPropertyDefaults({ ...savedPropertyDefaults.current })
    setPropertyDirty(false)
  }

  async function handlePropertySave() {
    setSaving(true)
    try {
      localStorage.setItem('owner_property_defaults', JSON.stringify(propertyDefaults))
      savedPropertyDefaults.current = { ...propertyDefaults }
      await new Promise(r => setTimeout(r, 250))
      setPropertyDirty(false)
      toast.success('Préférences enregistrées')
    } finally {
      setSaving(false)
    }
  }

  // ── Profile save ──

  async function handleProfileSave() {
    setProfileSaving(true)
    try {
      await authService.updateProfile({ firstName, lastName, phone, bio })
      updateProfile({ firstName, lastName })
      setEditingProfile(false)
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setProfileSaving(false)
    }
  }

  function handleProfileCancel() {
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
    setPhone((user as { phone?: string })?.phone ?? '')
    setBio((user as { bio?: string })?.bio ?? '')
    setEditingProfile(false)
  }

  // ── Delete account ──

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'SUPPRIMER') return
    setDeleteSaving(true)
    try {
      await fetch('/api/v1/auth/account', { method: 'DELETE', credentials: 'include' })
      logout()
      navigate('/')
    } catch {
      toast.error('Erreur lors de la suppression du compte')
    } finally {
      setDeleteSaving(false)
    }
  }

  // ── Focused input style ──

  function getInputStyle(id: string): React.CSSProperties {
    return {
      ...inputStyle,
      borderColor: focusedInput === id ? M.night : M.border,
      boxShadow: focusedInput === id ? '0 0 0 3px rgba(26,26,46,0.10)' : 'none',
    }
  }

  // ── Avatar initials ──
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  // ── Render tabs ──

  return (
    <Layout>
      {/* Save bars for dirty tabs */}
      <SaveBar
        visible={activeTab === 'notifications' && notifDirty}
        saving={saving}
        onCancel={handleNotifCancel}
        onSave={handleNotifSave}
      />
      <SaveBar
        visible={activeTab === 'preferences' && propertyDirty}
        saving={saving}
        onCancel={handlePropertyCancel}
        onSave={handlePropertySave}
      />

      <div style={{ background: M.bg, minHeight: '100vh', fontFamily: M.body }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Page Header */}
          <div className="mb-8">
            <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: M.inkFaint, fontFamily: M.body, marginBottom: '6px' }}>
              Propriétaire
            </p>
            <h1 style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '40px', color: M.ink, lineHeight: 1.1, marginBottom: '8px' }}>
              Paramètres
            </h1>
            <p style={{ fontSize: '14px', color: M.inkMid }}>
              Gérez votre profil, vos préférences et la sécurité de votre compte.
            </p>
          </div>

          {/* Layout: sidebar on md+, horizontal scroll on mobile */}
          <div className="flex flex-col md:flex-row gap-6">

            {/* ── Sidebar (desktop) / Tab bar (mobile) ── */}
            {/* Mobile: horizontal scrollable tab bar */}
            <div
              className="flex md:hidden gap-1 overflow-x-auto pb-1"
              style={{ borderBottom: `1px solid ${M.border}`, marginBottom: '4px' }}
            >
              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-1.5 whitespace-nowrap"
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px 8px 0 0',
                      fontSize: '13px',
                      fontFamily: M.body,
                      fontWeight: isActive ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? M.surface : 'transparent',
                      color: isActive ? M.night : M.inkMid,
                      borderBottom: isActive ? `2px solid ${M.night}` : '2px solid transparent',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: isActive ? M.night : M.inkFaint }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Desktop: vertical sidebar */}
            <div
              className="hidden md:flex flex-col gap-1"
              style={{ width: '180px', flexShrink: 0 }}
            >
              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2 text-left"
                    style={{
                      padding: '9px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: M.body,
                      fontWeight: isActive ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? M.ownerLight : 'transparent',
                      color: isActive ? M.owner : M.inkMid,
                      transition: 'all 0.15s',
                      width: '100%',
                    }}
                  >
                    <span style={{ color: isActive ? M.owner : M.inkFaint, flexShrink: 0 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* ── Tab content ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* ════════════════════════════════════════
                  MON PROFIL
              ════════════════════════════════════════ */}
              {activeTab === 'profile' && (
                <div style={cardStyle}>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.ink, marginBottom: '4px' }}>
                        Mon profil
                      </h2>
                      <p style={{ fontSize: '13px', color: M.inkMid }}>
                        Informations personnelles visibles par les locataires.
                      </p>
                    </div>
                    {!editingProfile && (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="flex items-center gap-1.5"
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontFamily: M.body,
                          fontWeight: 500,
                          border: `1px solid ${M.border}`,
                          background: M.muted,
                          color: M.ink,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Edit2 size={13} />
                        Modifier
                      </button>
                    )}
                  </div>

                  {/* Avatar + name */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: M.ownerLight,
                        border: `2px solid ${M.ownerBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontFamily: M.display,
                        fontWeight: 700,
                        fontSize: '22px',
                        color: M.owner,
                      }}
                    >
                      {initials || <User size={24} style={{ color: M.owner }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: M.ink, fontSize: '16px', marginBottom: '2px' }}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p style={{ fontSize: '13px', color: M.inkMid }}>Propriétaire</p>
                    </div>
                  </div>

                  {editingProfile ? (
                    /* Edit form */
                    <div className="flex flex-col gap-4">
                      {/* First + Last name */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 500, color: M.inkMid, display: 'block', marginBottom: '6px' }}>
                            Prénom
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            onFocus={() => setFocusedInput('firstName')}
                            onBlur={() => setFocusedInput(null)}
                            style={getInputStyle('firstName')}
                            placeholder="Votre prénom"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 500, color: M.inkMid, display: 'block', marginBottom: '6px' }}>
                            Nom
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            onFocus={() => setFocusedInput('lastName')}
                            onBlur={() => setFocusedInput(null)}
                            style={getInputStyle('lastName')}
                            placeholder="Votre nom"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: M.inkMid, display: 'block', marginBottom: '6px' }}>
                          Téléphone
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Phone
                            size={14}
                            style={{
                              position: 'absolute',
                              left: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: M.inkFaint,
                              pointerEvents: 'none',
                            }}
                          />
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            onFocus={() => setFocusedInput('phone')}
                            onBlur={() => setFocusedInput(null)}
                            style={{ ...getInputStyle('phone'), paddingLeft: '36px' }}
                            placeholder="+33 6 00 00 00 00"
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: M.inkMid, display: 'block', marginBottom: '6px' }}>
                          Bio <span style={{ color: M.inkFaint, fontWeight: 400 }}>({bio.length}/200)</span>
                        </label>
                        <textarea
                          value={bio}
                          onChange={e => setBio(e.target.value.slice(0, 200))}
                          onFocus={() => setFocusedInput('bio')}
                          onBlur={() => setFocusedInput(null)}
                          rows={3}
                          style={{ ...getInputStyle('bio'), resize: 'vertical' }}
                          placeholder="Quelques mots sur vous…"
                        />
                      </div>

                      {/* Email — read only */}
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: M.inkMid, display: 'block', marginBottom: '6px' }}>
                          Email
                        </label>
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              flex: 1,
                              background: M.muted,
                              border: `1px solid ${M.border}`,
                              borderRadius: '8px',
                              padding: '9px 12px',
                              fontSize: '14px',
                              color: M.inkMid,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <Mail size={14} style={{ color: M.inkFaint, flexShrink: 0 }} />
                            {user?.email}
                          </div>
                          {user?.emailVerified ? (
                            <span
                              className="flex items-center gap-1"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#065f46',
                                background: '#d1fae5',
                                border: '1px solid #6ee7b7',
                                borderRadius: '5px',
                                padding: '3px 8px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <CheckCircle size={11} />
                              Vérifié
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-1"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: M.danger,
                                background: M.dangerBg,
                                border: `1px solid ${M.dangerBorder}`,
                                borderRadius: '5px',
                                padding: '3px 8px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <XCircle size={11} />
                              Non vérifié
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          onClick={handleProfileCancel}
                          className="flex items-center gap-1.5"
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontFamily: M.body,
                            fontWeight: 500,
                            border: `1px solid ${M.border}`,
                            background: M.muted,
                            color: M.ink,
                            cursor: 'pointer',
                          }}
                        >
                          <X size={13} />
                          Annuler
                        </button>
                        <button
                          onClick={handleProfileSave}
                          disabled={profileSaving}
                          className="flex items-center gap-1.5"
                          style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontFamily: M.body,
                            fontWeight: 500,
                            border: 'none',
                            background: M.night,
                            color: '#ffffff',
                            cursor: profileSaving ? 'not-allowed' : 'pointer',
                            opacity: profileSaving ? 0.7 : 1,
                          }}
                        >
                          {profileSaving ? (
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Save size={13} />
                          )}
                          {profileSaving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Read-only view */
                    <div className="flex flex-col gap-3">
                      <div
                        style={{
                          background: M.muted,
                          border: `1px solid ${M.border}`,
                          borderRadius: '10px',
                          padding: '14px 16px',
                        }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, marginBottom: '3px' }}>Prénom</p>
                            <p style={{ fontSize: '14px', color: M.ink, fontWeight: 500 }}>{user?.firstName || '—'}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, marginBottom: '3px' }}>Nom</p>
                            <p style={{ fontSize: '14px', color: M.ink, fontWeight: 500 }}>{user?.lastName || '—'}</p>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          background: M.muted,
                          border: `1px solid ${M.border}`,
                          borderRadius: '10px',
                          padding: '14px 16px',
                        }}
                      >
                        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, marginBottom: '3px' }}>Email</p>
                        <div className="flex items-center gap-2">
                          <p style={{ fontSize: '14px', color: M.ink }}>{user?.email}</p>
                          {user?.emailVerified ? (
                            <span
                              className="flex items-center gap-1"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#065f46',
                                background: '#d1fae5',
                                border: '1px solid #6ee7b7',
                                borderRadius: '5px',
                                padding: '2px 7px',
                              }}
                            >
                              <CheckCircle size={10} />
                              Vérifié
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-1"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: M.danger,
                                background: M.dangerBg,
                                border: `1px solid ${M.dangerBorder}`,
                                borderRadius: '5px',
                                padding: '2px 7px',
                              }}
                            >
                              <XCircle size={10} />
                              Non vérifié
                            </span>
                          )}
                        </div>
                      </div>
                      {(user as { phone?: string })?.phone && (
                        <div
                          style={{
                            background: M.muted,
                            border: `1px solid ${M.border}`,
                            borderRadius: '10px',
                            padding: '14px 16px',
                          }}
                        >
                          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, marginBottom: '3px' }}>Téléphone</p>
                          <p style={{ fontSize: '14px', color: M.ink }}>{(user as { phone?: string }).phone}</p>
                        </div>
                      )}
                      {(user as { bio?: string })?.bio && (
                        <div
                          style={{
                            background: M.muted,
                            border: `1px solid ${M.border}`,
                            borderRadius: '10px',
                            padding: '14px 16px',
                          }}
                        >
                          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, marginBottom: '3px' }}>Bio</p>
                          <p style={{ fontSize: '14px', color: M.ink, lineHeight: 1.6 }}>{(user as { bio?: string }).bio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════
                  NOTIFICATIONS
              ════════════════════════════════════════ */}
              {activeTab === 'notifications' && (
                <div style={cardStyle}>
                  <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.ink, marginBottom: '4px' }}>
                    Notifications
                  </h2>
                  <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                    Choisissez les événements pour lesquels vous souhaitez être notifié.
                  </p>

                  <SectionLabel>Visites</SectionLabel>
                  <div className="flex flex-col gap-3 mb-5">
                    <NotifRow icon={<Calendar size={15} />} label="Nouvelle demande de visite" checked={notifPrefs.visitRequested} onChange={v => updateNotif('visitRequested', v)} />
                    <NotifRow icon={<Check size={15} />} label="Visite confirmée" checked={notifPrefs.visitConfirmed} onChange={v => updateNotif('visitConfirmed', v)} />
                    <NotifRow icon={<X size={15} />} label="Visite annulée" checked={notifPrefs.visitCancelled} onChange={v => updateNotif('visitCancelled', v)} />
                  </div>

                  <Divider my={4} />
                  <SectionLabel>Candidatures</SectionLabel>
                  <div className="flex flex-col gap-3 mb-5">
                    <NotifRow icon={<Users size={15} />} label="Nouvelle candidature reçue" checked={notifPrefs.newApplication} onChange={v => updateNotif('newApplication', v)} />
                    <NotifRow icon={<Users size={15} />} label="Mise à jour d'une candidature" checked={notifPrefs.applicationUpdated} onChange={v => updateNotif('applicationUpdated', v)} />
                  </div>

                  <Divider my={4} />
                  <SectionLabel>Messagerie</SectionLabel>
                  <div className="flex flex-col gap-3 mb-5">
                    <NotifRow icon={<MessageSquare size={15} />} label="Nouveau message" checked={notifPrefs.newMessage} onChange={v => updateNotif('newMessage', v)} />
                  </div>

                  <Divider my={4} />
                  <SectionLabel>Contrats & Paiements</SectionLabel>
                  <div className="flex flex-col gap-3">
                    <NotifRow icon={<FileText size={15} />} label="Contrat signé par le locataire" checked={notifPrefs.contractSigned} onChange={v => updateNotif('contractSigned', v)} />
                    <NotifRow icon={<FileText size={15} />} label="Événement contrat (rappels, échéances)" checked={notifPrefs.contractEvent} onChange={v => updateNotif('contractEvent', v)} />
                    <NotifRow icon={<DollarSign size={15} />} label="Paiement reçu" checked={notifPrefs.paymentReceived} onChange={v => updateNotif('paymentReceived', v)} />
                    <NotifRow icon={<DollarSign size={15} />} label="Retard de paiement" checked={notifPrefs.paymentLate} onChange={v => updateNotif('paymentLate', v)} />
                  </div>

                  {notifDirty && (
                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        onClick={handleNotifCancel}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: M.body,
                          fontWeight: 500,
                          border: `1px solid ${M.border}`,
                          background: M.muted,
                          color: M.ink,
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleNotifSave}
                        disabled={saving}
                        className="flex items-center gap-1.5"
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: M.body,
                          fontWeight: 500,
                          border: 'none',
                          background: M.night,
                          color: '#ffffff',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.7 : 1,
                        }}
                      >
                        <Save size={13} />
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════
                  SÉCURITÉ
              ════════════════════════════════════════ */}
              {activeTab === 'security' && (
                <div className="flex flex-col gap-4">
                  {/* Password */}
                  <div style={cardStyle}>
                    <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.ink, marginBottom: '4px' }}>
                      Mot de passe
                    </h2>
                    <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '16px' }}>
                      Modifiez votre mot de passe de connexion.
                    </p>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="flex items-center gap-2"
                      style={{
                        background: M.night,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '9px 18px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: M.body,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      <Shield size={14} />
                      Modifier le mot de passe
                    </button>
                  </div>

                  {/* Danger zone */}
                  <div
                    style={{
                      ...cardStyle,
                      border: `1px solid ${M.dangerBorder}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={16} style={{ color: M.danger }} />
                      <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.danger }}>
                        Zone de danger
                      </h2>
                    </div>
                    <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                      La suppression de votre compte est définitive et irréversible. Toutes vos données seront effacées.
                    </p>

                    <div
                      style={{
                        background: M.dangerBg,
                        border: `1px solid ${M.dangerBorder}`,
                        borderRadius: '10px',
                        padding: '16px',
                      }}
                    >
                      <p style={{ fontSize: '13px', color: M.danger, fontWeight: 500, marginBottom: '10px' }}>
                        Pour confirmer, saisissez <strong>SUPPRIMER</strong> dans le champ ci-dessous.
                      </p>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="SUPPRIMER"
                        style={{
                          ...inputStyle,
                          borderColor: deleteConfirm === 'SUPPRIMER' ? M.dangerBorder : M.border,
                          marginBottom: '12px',
                          maxWidth: '280px',
                        }}
                      />
                      <br />
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== 'SUPPRIMER' || deleteSaving}
                        className="flex items-center gap-1.5"
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: M.body,
                          fontWeight: 500,
                          border: 'none',
                          background: deleteConfirm === 'SUPPRIMER' ? M.danger : M.borderMid,
                          color: '#ffffff',
                          cursor: deleteConfirm !== 'SUPPRIMER' || deleteSaving ? 'not-allowed' : 'pointer',
                          opacity: deleteSaving ? 0.7 : 1,
                          transition: 'background 0.2s',
                        }}
                      >
                        {deleteSaving ? (
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Supprimer mon compte
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════
                  PRÉFÉRENCES
              ════════════════════════════════════════ */}
              {activeTab === 'preferences' && (
                <div style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders size={16} style={{ color: M.caramel }} />
                    <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.ink }}>
                      Préférences de publication
                    </h2>
                  </div>
                  <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                    Valeurs par défaut appliquées à chaque nouveau bien que vous publiez.
                  </p>

                  {/* Default visibility */}
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: M.ink }}>Visibilité par défaut</p>
                      <p style={{ fontSize: '12px', color: M.inkFaint, marginTop: '2px' }}>État initial lors de la création d'un bien</p>
                    </div>
                    <div className="flex gap-2" style={{ flexShrink: 0 }}>
                      {(['PUBLISHED', 'DRAFT'] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => updatePropertyDefault('defaultVisibility', v)}
                          className="flex items-center gap-1"
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: M.body,
                            cursor: 'pointer',
                            border: `1px solid ${propertyDefaults.defaultVisibility === v ? M.night : M.border}`,
                            background: propertyDefaults.defaultVisibility === v ? M.night : M.surface,
                            color: propertyDefaults.defaultVisibility === v ? '#ffffff' : M.inkMid,
                            transition: 'all 0.15s',
                            fontWeight: propertyDefaults.defaultVisibility === v ? 600 : 400,
                          }}
                        >
                          {v === 'PUBLISHED' ? <Eye size={11} /> : <EyeOff size={11} />}
                          {v === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  <SectionLabel>Critères locataire</SectionLabel>
                  <div className="flex flex-col gap-4">
                    {/* Min income multiplier */}
                    <div className="flex items-center justify-between gap-4">
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: M.ink }}>Revenus minimum</p>
                        <p style={{ fontSize: '12px', color: M.inkFaint, marginTop: '2px' }}>Multiple du loyer exigé (ex. ×3 = 3 fois le loyer)</p>
                      </div>
                      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                        <button
                          onClick={() => updatePropertyDefault('minMonthlyIncome', Math.max(1, propertyDefaults.minMonthlyIncome - 0.5))}
                          style={{
                            width: 28, height: 28, borderRadius: '6px',
                            border: `1px solid ${M.border}`, background: M.surface,
                            cursor: 'pointer', fontSize: '16px', color: M.ink,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: '36px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: M.ink }}>
                          ×{propertyDefaults.minMonthlyIncome}
                        </span>
                        <button
                          onClick={() => updatePropertyDefault('minMonthlyIncome', Math.min(10, propertyDefaults.minMonthlyIncome + 0.5))}
                          style={{
                            width: 28, height: 28, borderRadius: '6px',
                            border: `1px solid ${M.border}`, background: M.surface,
                            cursor: 'pointer', fontSize: '16px', color: M.ink,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <NotifRow icon={<Shield size={15} />} label="Accepter les dossiers avec garant" checked={propertyDefaults.acceptGuarantor} onChange={v => updatePropertyDefault('acceptGuarantor', v)} />
                    <NotifRow icon={<ChevronRight size={15} />} label="Animaux de compagnie acceptés" checked={propertyDefaults.acceptPets} onChange={v => updatePropertyDefault('acceptPets', v)} />
                    <NotifRow icon={<ChevronRight size={15} />} label="Fumeurs acceptés" checked={propertyDefaults.acceptSmoking} onChange={v => updatePropertyDefault('acceptSmoking', v)} />
                    <NotifRow icon={<FileText size={15} />} label="Dossier locataire requis pour candidater" checked={propertyDefaults.requireDossier} onChange={v => updatePropertyDefault('requireDossier', v)} />
                  </div>

                  {propertyDirty && (
                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        onClick={handlePropertyCancel}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: M.body,
                          fontWeight: 500,
                          border: `1px solid ${M.border}`,
                          background: M.muted,
                          color: M.ink,
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handlePropertySave}
                        disabled={saving}
                        className="flex items-center gap-1.5"
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: M.body,
                          fontWeight: 500,
                          border: 'none',
                          background: M.night,
                          color: '#ffffff',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.7 : 1,
                        }}
                      >
                        <Save size={13} />
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════
                  ABONNEMENT
              ════════════════════════════════════════ */}
              {activeTab === 'subscription' && (
                <div style={{ ...cardStyle, background: M.ownerLight, border: `1px solid ${M.ownerBorder}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={16} style={{ color: M.owner }} />
                    <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '22px', color: M.owner }}>
                      Abonnement
                    </h2>
                  </div>
                  <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                    Gérez votre formule et votre facturation.
                  </p>

                  <div
                    style={{
                      background: M.surface,
                      border: `1px solid ${M.ownerBorder}`,
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ fontSize: '12px', color: M.inkFaint, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Formule actuelle</p>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: M.owner, fontFamily: M.display }}>Découverte — Gratuit</p>
                        <p style={{ fontSize: '13px', color: M.inkMid, marginTop: '4px' }}>Accès aux fonctionnalités essentielles</p>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          background: M.ownerLight,
                          color: M.owner,
                          border: `1px solid ${M.ownerBorder}`,
                          borderRadius: '5px',
                          padding: '3px 9px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          flexShrink: 0,
                        }}
                      >
                        ACTIF
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/pricing')}
                    className="flex items-center justify-between gap-2 w-full"
                    style={{
                      background: M.owner,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 18px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: M.body,
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard size={15} />
                      Voir les formules
                    </span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </Layout>
  )
}
