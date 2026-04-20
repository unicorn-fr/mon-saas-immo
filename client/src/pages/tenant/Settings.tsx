import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
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
} from 'lucide-react'

// ─── Maison Design Tokens ─────────────────────────────────────────────────────

const M = {
  bg: '#fafaf8',
  surface: '#ffffff',
  muted: '#f4f2ee',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  tenant: '#1b5e3b',
  tenantLight: '#edf7f2',
  tenantBorder: '#9fd4ba',
  border: '#e4e1db',
  borderMid: '#ccc9c3',
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

// ─── Toggle component ─────────────────────────────────────────────────────────

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
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '22px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#ffffff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TenantSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Snapshot of last saved state (to support Annuler)
  const savedNotifPrefs = useRef<NotifPrefs>(loadNotifPrefs())

  // Intercept browser tab close/refresh when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function updateNotif(key: keyof NotifPrefs, value: boolean) {
    setNotifPrefs(prev => ({ ...prev, [key]: value }))
    setSaved(false)
    setIsDirty(true)
  }

  function handleCancel() {
    setNotifPrefs({ ...savedNotifPrefs.current })
    setIsDirty(false)
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      localStorage.setItem('tenant_notif_prefs', JSON.stringify(notifPrefs))
      savedNotifPrefs.current = { ...notifPrefs }
      await new Promise(r => setTimeout(r, 300))
      setIsDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      {/* ── Dirty bar ─────────────────────────────────────────────────────── */}
      {isDirty && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#fdf5ec',
          border: '1px solid #f3c99a',
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
              onClick={handleCancel}
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
              onClick={handleSave}
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
      )}
      <div style={{ background: M.bg, minHeight: '100vh', fontFamily: M.body }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Page Header */}
          <div className="mb-8">
            <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: M.inkFaint, fontFamily: M.body, marginBottom: '6px' }}>
              Locataire
            </p>
            <h1 style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '40px', color: M.ink, lineHeight: 1.1, marginBottom: '8px' }}>
              Paramètres
            </h1>
            <p style={{ fontSize: '14px', color: M.inkMid }}>
              Gérez vos préférences de compte et de notifications.
            </p>
          </div>

          <div className="flex flex-col gap-6">

            {/* ── Profil ───────────────────────────────────────────────────── */}
            <div style={cardStyle}>
              <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.ink, marginBottom: '4px' }}>
                Profil
              </h2>
              <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '16px' }}>
                Informations personnelles, photo, numéro de téléphone.
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: M.tenantLight, border: `2px solid ${M.tenantBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} style={{ color: M.tenant }} />
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: M.ink, fontSize: '14px' }}>{user?.firstName} {user?.lastName}</p>
                  <p style={{ fontSize: '13px', color: M.inkMid }}>{user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 w-full"
                style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '0.625rem 1rem', color: M.ink, fontSize: '14px', fontFamily: M.body, cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <span className="flex items-center gap-2">
                  <User size={15} style={{ color: M.inkMid }} />
                  Modifier le profil
                </span>
                <ChevronRight size={15} style={{ color: M.inkFaint }} />
              </button>
            </div>

            {/* ── Notifications ─────────────────────────────────────────────── */}
            <div style={cardStyle}>
              <div className="flex items-center gap-2 mb-1">
                <Bell size={16} style={{ color: M.inkMid }} />
                <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.ink }}>
                  Notifications
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                Choisissez pour quels événements vous souhaitez être notifié.
              </p>

              {/* Visites */}
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px' }}>Visites</p>
              <div className="flex flex-col gap-3 mb-5">
                <NotifRow icon={<Check size={15} />} label="Visite confirmée par le propriétaire" checked={notifPrefs.visitConfirmed} onChange={v => updateNotif('visitConfirmed', v)} />
                <NotifRow icon={<Calendar size={15} />} label="Visite annulée" checked={notifPrefs.visitCancelled} onChange={v => updateNotif('visitCancelled', v)} />
                <NotifRow icon={<Calendar size={15} />} label="Rappel de visite (24h avant)" checked={notifPrefs.visitReminder} onChange={v => updateNotif('visitReminder', v)} />
              </div>

              {/* Candidatures */}
              <div style={{ height: 1, background: M.border, marginBottom: '16px' }} />
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px' }}>Candidatures</p>
              <div className="flex flex-col gap-3 mb-5">
                <NotifRow icon={<Check size={15} />} label="Candidature acceptée" checked={notifPrefs.applicationAccepted} onChange={v => updateNotif('applicationAccepted', v)} />
                <NotifRow icon={<AlertCircle size={15} />} label="Candidature refusée" checked={notifPrefs.applicationRejected} onChange={v => updateNotif('applicationRejected', v)} />
                <NotifRow icon={<Home size={15} />} label="Mise à jour de statut" checked={notifPrefs.applicationUpdated} onChange={v => updateNotif('applicationUpdated', v)} />
              </div>

              {/* Messagerie */}
              <div style={{ height: 1, background: M.border, marginBottom: '16px' }} />
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px' }}>Messagerie</p>
              <div className="flex flex-col gap-3 mb-5">
                <NotifRow icon={<MessageSquare size={15} />} label="Nouveau message" checked={notifPrefs.newMessage} onChange={v => updateNotif('newMessage', v)} />
              </div>

              {/* Contrats */}
              <div style={{ height: 1, background: M.border, marginBottom: '16px' }} />
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px' }}>Contrats</p>
              <div className="flex flex-col gap-3">
                <NotifRow icon={<FileText size={15} />} label="Bail prêt à signer" checked={notifPrefs.contractReady} onChange={v => updateNotif('contractReady', v)} />
                <NotifRow icon={<FileText size={15} />} label="Contrat signé par toutes les parties" checked={notifPrefs.contractSigned} onChange={v => updateNotif('contractSigned', v)} />
                <NotifRow icon={<FileText size={15} />} label="Événements contrat (rappels, renouvellement)" checked={notifPrefs.contractEvent} onChange={v => updateNotif('contractEvent', v)} />
              </div>
            </div>

            {/* ── Dossier locatif ───────────────────────────────────────────── */}
            <div style={cardStyle}>
              <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.ink, marginBottom: '4px' }}>
                Dossier locatif
              </h2>
              <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '16px' }}>
                Gérez vos documents et les partages de dossier.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/dossier')}
                  className="flex items-center gap-2 w-full"
                  style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '0.625rem 1rem', color: M.ink, fontSize: '14px', fontFamily: M.body, cursor: 'pointer', justifyContent: 'space-between' }}
                >
                  <span className="flex items-center gap-2">
                    <FileText size={15} style={{ color: M.inkMid }} />
                    Mon dossier locatif
                  </span>
                  <ChevronRight size={15} style={{ color: M.inkFaint }} />
                </button>
                <button
                  onClick={() => navigate('/dossier/partages')}
                  className="flex items-center gap-2 w-full"
                  style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '0.625rem 1rem', color: M.ink, fontSize: '14px', fontFamily: M.body, cursor: 'pointer', justifyContent: 'space-between' }}
                >
                  <span className="flex items-center gap-2">
                    <User size={15} style={{ color: M.inkMid }} />
                    Gérer les partages
                  </span>
                  <ChevronRight size={15} style={{ color: M.inkFaint }} />
                </button>
              </div>
            </div>

            {/* ── Confidentialité ───────────────────────────────────────────── */}
            <div style={{ ...cardStyle, background: M.tenantLight, border: `1px solid ${M.tenantBorder}` }}>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} style={{ color: M.tenant }} />
                <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.tenant }}>
                  Confidentialité & RGPD
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '16px' }}>
                Accédez à vos droits : consultation, rectification, portabilité et suppression de vos données.
              </p>
              <button
                onClick={() => navigate('/privacy')}
                className="flex items-center gap-2 w-full"
                style={{ background: M.tenant, border: 'none', borderRadius: '8px', padding: '0.625rem 1rem', color: '#ffffff', fontSize: '14px', fontFamily: M.body, cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <span className="flex items-center gap-2">
                  <Shield size={15} />
                  Centre de confidentialité
                </span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* ── Sécurité ──────────────────────────────────────────────────── */}
            <div style={cardStyle}>
              <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.ink, marginBottom: '4px' }}>
                Sécurité
              </h2>
              <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '16px' }}>
                Mot de passe et paramètres de connexion.
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 w-full"
                style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: '8px', padding: '0.625rem 1rem', color: M.ink, fontSize: '14px', fontFamily: M.body, cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <span className="flex items-center gap-2">
                  <Lock size={15} style={{ color: M.inkMid }} />
                  Modifier le mot de passe
                </span>
                <ChevronRight size={15} style={{ color: M.inkFaint }} />
              </button>
            </div>

            {/* ── Save button ───────────────────────────────────────────────── */}
            <div className="flex justify-end pb-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
                style={{
                  background: saved ? M.tenant : M.night,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 2rem',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: M.body,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  fontWeight: 500,
                  transition: 'background 0.3s',
                }}
              >
                {saving ? 'Enregistrement…' : saved ? (
                  <>
                    <Check size={15} />
                    Préférences enregistrées
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Enregistrer les préférences
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}

// ─── NotifRow helper ──────────────────────────────────────────────────────────

function NotifRow({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
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
