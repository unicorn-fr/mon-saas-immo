import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import {
  User,
  Shield,
  Home,
  CreditCard,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  DollarSign,
  Sliders,
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
  owner: '#1a3270',
  ownerLight: '#eaf0fb',
  ownerBorder: '#b8ccf0',
  border: '#e4e1db',
  borderMid: '#ccc9c3',
  caramel: '#c4976a',
  caramelLight: '#fdf5ec',
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

export default function OwnerSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs)
  const [propertyDefaults, setPropertyDefaults] = useState<PropertyDefaults>(loadPropertyDefaults)
  const [saving, setSaving] = useState(false)

  function updateNotif(key: keyof NotifPrefs, value: boolean) {
    setNotifPrefs(prev => ({ ...prev, [key]: value }))
  }

  function updatePropertyDefault<K extends keyof PropertyDefaults>(key: K, value: PropertyDefaults[K]) {
    setPropertyDefaults(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      localStorage.setItem('owner_notif_prefs', JSON.stringify(notifPrefs))
      localStorage.setItem('owner_property_defaults', JSON.stringify(propertyDefaults))
      await new Promise(r => setTimeout(r, 300))
      toast.success('Préférences enregistrées')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div style={{ background: M.bg, minHeight: '100vh', fontFamily: M.body }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Page Header */}
          <div className="mb-8">
            <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: M.inkFaint, fontFamily: M.body, marginBottom: '6px' }}>
              Propriétaire
            </p>
            <h1 style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '40px', color: M.ink, lineHeight: 1.1, marginBottom: '8px' }}>
              Paramètres
            </h1>
            <p style={{ fontSize: '14px', color: M.inkMid }}>
              Gérez vos préférences de compte et de publication.
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
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: M.ownerLight, border: `2px solid ${M.ownerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} style={{ color: M.owner }} />
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
              <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.ink, marginBottom: '4px' }}>
                Notifications
              </h2>
              <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                Choisissez les événements pour lesquels vous souhaitez être notifié.
              </p>

              {/* Visites */}
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px' }}>Visites</p>
              <div className="flex flex-col gap-3 mb-5">
                <NotifRow icon={<Calendar size={15} />} label="Nouvelle demande de visite" checked={notifPrefs.visitRequested} onChange={v => updateNotif('visitRequested', v)} />
                <NotifRow icon={<Check size={15} />} label="Visite confirmée" checked={notifPrefs.visitConfirmed} onChange={v => updateNotif('visitConfirmed', v)} />
                <NotifRow icon={<Calendar size={15} />} label="Visite annulée" checked={notifPrefs.visitCancelled} onChange={v => updateNotif('visitCancelled', v)} />
              </div>

              {/* Candidatures */}
              <div style={{ height: 1, background: M.border, marginBottom: '16px' }} />
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px' }}>Candidatures</p>
              <div className="flex flex-col gap-3 mb-5">
                <NotifRow icon={<Users size={15} />} label="Nouvelle candidature reçue" checked={notifPrefs.newApplication} onChange={v => updateNotif('newApplication', v)} />
                <NotifRow icon={<Users size={15} />} label="Mise à jour d'une candidature" checked={notifPrefs.applicationUpdated} onChange={v => updateNotif('applicationUpdated', v)} />
              </div>

              {/* Messagerie */}
              <div style={{ height: 1, background: M.border, marginBottom: '16px' }} />
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px' }}>Messagerie</p>
              <div className="flex flex-col gap-3 mb-5">
                <NotifRow icon={<MessageSquare size={15} />} label="Nouveau message" checked={notifPrefs.newMessage} onChange={v => updateNotif('newMessage', v)} />
              </div>

              {/* Contrats & Paiements */}
              <div style={{ height: 1, background: M.border, marginBottom: '16px' }} />
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '10px' }}>Contrats & Paiements</p>
              <div className="flex flex-col gap-3">
                <NotifRow icon={<FileText size={15} />} label="Contrat signé par le locataire" checked={notifPrefs.contractSigned} onChange={v => updateNotif('contractSigned', v)} />
                <NotifRow icon={<FileText size={15} />} label="Événement contrat (rappels, échéances)" checked={notifPrefs.contractEvent} onChange={v => updateNotif('contractEvent', v)} />
                <NotifRow icon={<DollarSign size={15} />} label="Paiement reçu" checked={notifPrefs.paymentReceived} onChange={v => updateNotif('paymentReceived', v)} />
                <NotifRow icon={<DollarSign size={15} />} label="Retard de paiement" checked={notifPrefs.paymentLate} onChange={v => updateNotif('paymentLate', v)} />
              </div>
            </div>

            {/* ── Préférences de publication ────────────────────────────────── */}
            <div style={cardStyle}>
              <div className="flex items-center gap-2 mb-1">
                <Sliders size={16} style={{ color: M.caramel }} />
                <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.ink }}>
                  Préférences de publication
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '20px' }}>
                Valeurs par défaut appliquées à chaque nouveau bien que vous publiez.
              </p>

              {/* Default visibility */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: M.ink }}>Visibilité par défaut</p>
                  <p style={{ fontSize: '12px', color: M.inkFaint, marginTop: '2px' }}>État initial lors de la création d'un bien</p>
                </div>
                <div className="flex gap-2">
                  {(['PUBLISHED', 'DRAFT'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => updatePropertyDefault('defaultVisibility', v)}
                      className="flex items-center gap-1"
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: M.body,
                        cursor: 'pointer',
                        border: `1px solid ${propertyDefaults.defaultVisibility === v ? M.night : M.border}`,
                        background: propertyDefaults.defaultVisibility === v ? M.night : M.surface,
                        color: propertyDefaults.defaultVisibility === v ? '#ffffff' : M.inkMid,
                        transition: 'all 0.15s',
                      }}
                    >
                      {v === 'PUBLISHED' ? <Eye size={11} /> : <EyeOff size={11} />}
                      {v === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: M.border, marginBottom: '16px' }} />

              {/* Critères locataire */}
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: M.inkFaint, marginBottom: '12px' }}>Critères locataire</p>
              <div className="flex flex-col gap-4">
                {/* Min income multiplier */}
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: M.ink }}>Revenus minimum</p>
                    <p style={{ fontSize: '12px', color: M.inkFaint, marginTop: '2px' }}>Multiple du loyer exigé (ex. ×3 = 3 fois le loyer)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updatePropertyDefault('minMonthlyIncome', Math.max(1, propertyDefaults.minMonthlyIncome - 0.5))}
                      style={{ width: 28, height: 28, borderRadius: '6px', border: `1px solid ${M.border}`, background: M.surface, cursor: 'pointer', fontSize: '16px', color: M.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >−</button>
                    <span style={{ minWidth: '36px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: M.ink }}>×{propertyDefaults.minMonthlyIncome}</span>
                    <button
                      onClick={() => updatePropertyDefault('minMonthlyIncome', Math.min(10, propertyDefaults.minMonthlyIncome + 0.5))}
                      style={{ width: 28, height: 28, borderRadius: '6px', border: `1px solid ${M.border}`, background: M.surface, cursor: 'pointer', fontSize: '16px', color: M.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >+</button>
                  </div>
                </div>

                <NotifRow icon={<Shield size={15} />} label="Accepter les dossiers avec garant" checked={propertyDefaults.acceptGuarantor} onChange={v => updatePropertyDefault('acceptGuarantor', v)} />
                <NotifRow icon={<Home size={15} />} label="Animaux de compagnie acceptés" checked={propertyDefaults.acceptPets} onChange={v => updatePropertyDefault('acceptPets', v)} />
                <NotifRow icon={<Home size={15} />} label="Fumeurs acceptés" checked={propertyDefaults.acceptSmoking} onChange={v => updatePropertyDefault('acceptSmoking', v)} />
                <NotifRow icon={<FileText size={15} />} label="Dossier locataire requis pour candidater" checked={propertyDefaults.requireDossier} onChange={v => updatePropertyDefault('requireDossier', v)} />
              </div>
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
                  <Shield size={15} style={{ color: M.inkMid }} />
                  Modifier le mot de passe
                </span>
                <ChevronRight size={15} style={{ color: M.inkFaint }} />
              </button>
            </div>

            {/* ── Abonnement ────────────────────────────────────────────────── */}
            <div style={{ ...cardStyle, background: M.ownerLight, border: `1px solid ${M.ownerBorder}` }}>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={16} style={{ color: M.owner }} />
                <h2 style={{ fontFamily: M.display, fontWeight: 700, fontSize: '20px', color: M.owner }}>
                  Abonnement
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: M.inkMid, marginBottom: '16px' }}>
                Gérez votre formule et votre facturation.
              </p>
              <div style={{ background: M.surface, border: `1px solid ${M.ownerBorder}`, borderRadius: '8px', padding: '1rem', marginBottom: '12px' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: '13px', color: M.inkFaint, marginBottom: '2px' }}>Formule actuelle</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: M.owner }}>Découverte — Gratuit</p>
                  </div>
                  <span style={{ fontSize: '11px', background: M.ownerLight, color: M.owner, border: `1px solid ${M.ownerBorder}`, borderRadius: '4px', padding: '2px 8px', fontWeight: 600 }}>
                    ACTIF
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2 w-full"
                style={{ background: M.owner, border: 'none', borderRadius: '8px', padding: '0.625rem 1rem', color: '#ffffff', fontSize: '14px', fontFamily: M.body, cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <span className="flex items-center gap-2">
                  <CreditCard size={15} />
                  Voir les formules
                </span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* ── Save button ───────────────────────────────────────────────── */}
            <div className="flex justify-end pb-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
                style={{ background: M.night, border: 'none', borderRadius: '8px', padding: '0.75rem 2rem', color: '#ffffff', fontSize: '14px', fontFamily: M.body, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontWeight: 500 }}
              >
                {saving ? 'Enregistrement…' : (
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
