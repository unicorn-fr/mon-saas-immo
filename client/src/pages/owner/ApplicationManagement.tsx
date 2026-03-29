/**
 * ApplicationManagement — Owner dashboard for all incoming candidatures.
 * Applications are grouped by property listing.
 * Approved candidates get immediate access to the booking calendar.
 */
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Clock, Users, ChevronDown, ChevronUp,
  Building2, RotateCcw, Loader2, MapPin, Euro, ChevronRight, FolderOpen,
} from 'lucide-react'
import { applicationService } from '../../services/application.service'
import { scoreColor } from '../../utils/matchingEngine'
import type { Application, ApplicationStatus } from '../../types/application.types'
import { Layout } from '../../components/layout/Layout'
import { DossierReviewModal } from '../../components/document/DossierReviewModal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:5000'

// ─── Maison tokens ────────────────────────────────────────────────────────────

const M = {
  bg:           '#fafaf8',
  surface:      '#ffffff',
  muted:        '#f4f2ee',
  inputBg:      '#f8f7f4',
  ink:          '#0d0c0a',
  inkMid:       '#5a5754',
  inkFaint:     '#9e9b96',
  caramel:      '#c4976a',
  caramelLight: '#fdf5ec',
  owner:        '#1a3270',
  ownerLight:   '#eaf0fb',
  ownerBorder:  '#b8ccf0',
  border:       '#e4e1db',
  borderMid:    '#ccc9c3',
  danger:       '#9b1c1c',
  dangerBg:     '#fef2f2',
  warning:      '#92400e',
  warningBg:    '#fdf5ec',
  success:      '#1b5e3b',
  successBg:    '#edf7f2',
}

const cardStyle: React.CSSProperties = {
  background: M.surface,
  border: `1px solid ${M.border}`,
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

// ─── Score badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const strokeColor = score >= 70 ? M.success : score >= 40 ? M.caramel : M.danger
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" strokeWidth="4" fill="none" stroke={M.border} />
          <circle
            cx="20" cy="20" r="16" strokeWidth="4" fill="none"
            style={{
              stroke: strokeColor,
              strokeDasharray: 2 * Math.PI * 16,
              strokeDashoffset: 2 * Math.PI * 16 * (1 - score / 100),
              strokeLinecap: 'round',
              transition: 'stroke-dashoffset 0.6s ease',
            }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${scoreColor(score)}`}
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {score}
        </span>
      </div>
      <span style={{ fontSize: 10, color: M.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}>/100</span>
    </div>
  )
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING:   'En attente',
  APPROVED:  'Approuvée',
  REJECTED:  'Refusée',
  WITHDRAWN: 'Retirée',
}

const STATUS_STYLE: Record<ApplicationStatus, React.CSSProperties> = {
  PENDING:   { background: M.warningBg, border: `1px solid #e8c98b`, color: M.warning },
  APPROVED:  { background: M.ownerLight, border: `1px solid ${M.ownerBorder}`, color: M.owner },
  REJECTED:  { background: M.dangerBg, border: `1px solid #f5c6c6`, color: M.danger },
  WITHDRAWN: { background: M.muted, border: `1px solid ${M.border}`, color: M.inkFaint },
}

// ─── Single application card ──────────────────────────────────────────────────

function ApplicationCard({
  app,
  onDecision,
  onOpenDossier,
}: {
  app: Application
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>
  onOpenDossier: (tenantId: string, tenantName: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const tenant = app.tenant!

  async function decide(status: 'APPROVED' | 'REJECTED') {
    setLoading(true)
    try {
      await onDecision(app.id, status)
    } finally {
      setLoading(false)
    }
  }

  const details = app.matchDetails ? Object.values(app.matchDetails) : []
  const initials = `${tenant.firstName?.[0] ?? ''}${tenant.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div
      style={{
        ...cardStyle,
        overflow: 'hidden',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <div
          className="flex items-center justify-center flex-shrink-0 rounded-full w-9 h-9 text-sm font-bold"
          style={{
            background: M.ownerLight,
            color: M.owner,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {initials}
        </div>

        <ScoreBadge score={app.score} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-semibold text-sm"
              style={{ color: M.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              {tenant.firstName} {tenant.lastName}
            </span>
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center"
              style={STATUS_STYLE[app.status]}
            >
              {STATUS_LABEL[app.status]}
            </span>
            {app.hasGuarantor && (
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center"
                style={{ background: M.ownerLight, border: `1px solid ${M.ownerBorder}`, color: M.owner }}
              >
                Garant {app.guarantorType}
              </span>
            )}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: M.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {tenant.email} · {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onOpenDossier(tenant.id, `${tenant.firstName ?? ''} ${tenant.lastName ?? ''}`.trim())}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: M.ownerLight,
              border: `1px solid ${M.ownerBorder}`,
              color: M.owner,
              borderRadius: 8,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#d8e8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.background = M.ownerLight)}
          >
            <FolderOpen className="w-3 h-3" />
            Dossier
          </button>
          {app.status === 'PENDING' && (
            <>
              <button
                onClick={() => decide('APPROVED')}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                style={{
                  background: M.owner,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#142860')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = M.owner)}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approuver
              </button>
              <button
                onClick={() => decide('REJECTED')}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: M.dangerBg,
                  border: `1px solid #f5c6c6`,
                  color: M.danger,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#fde8e8')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = M.dangerBg)}
              >
                <XCircle className="w-3 h-3" />
                Refuser
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 transition-colors"
            style={{ color: M.inkFaint, borderRadius: 8 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            style={{ borderTop: `1px solid ${M.border}` }}
          >
            <div className="p-4 space-y-3" style={{ background: M.muted }}>
              {details.length > 0 && (
                <div>
                  <p
                    className="uppercase tracking-wide mb-2"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: M.inkFaint,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      letterSpacing: '0.06em',
                    }}
                  >
                    Détail du score
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {details.map((d: { label: string; points: number; maxPoints: number; status: string; explanation: string }) => (
                      <div
                        key={d.label}
                        className="rounded-xl p-2.5 text-xs"
                        style={
                          d.status === 'pass'    ? { background: M.successBg, border: `1px solid #a8d5bc`, color: M.success } :
                          d.status === 'partial' ? { background: M.warningBg, border: `1px solid #e8c98b`, color: M.warning } :
                          d.status === 'fail'    ? { background: M.dangerBg,  border: `1px solid #f5c6c6`, color: M.danger  } :
                                                   { background: M.muted,     border: `1px solid ${M.border}`, color: M.inkMid }
                        }
                      >
                        <div className="flex justify-between mb-0.5">
                          <span className="font-semibold">{d.label}</span>
                          <span className="font-bold">{d.points}/{d.maxPoints}</span>
                        </div>
                        <p style={{ opacity: 0.85 }}>{d.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {app.coverLetter && (
                <div>
                  <p
                    className="uppercase tracking-wide mb-1"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: M.inkFaint,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      letterSpacing: '0.06em',
                    }}
                  >
                    Lettre de motivation
                  </p>
                  <p
                    className="text-sm rounded-xl p-3"
                    style={{
                      background: M.surface,
                      border: `1px solid ${M.border}`,
                      color: M.inkMid,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                  >
                    {app.coverLetter}
                  </p>
                </div>
              )}

              {app.status === 'APPROVED' && (
                <div
                  className="flex items-center gap-2 rounded-xl p-3 text-sm"
                  style={{ background: M.successBg, border: `1px solid #a8d5bc`, color: M.success }}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Ce candidat peut maintenant réserver un créneau de visite.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Property group ───────────────────────────────────────────────────────────

interface PropertyInfo {
  id: string
  title: string
  price: number
  city: string
  images?: string[]
}

function PropertyGroup({
  property,
  apps,
  onDecision,
  onOpenDossier,
}: {
  property: PropertyInfo
  apps: Application[]
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>
  onOpenDossier: (tenantId: string, tenantName: string) => void
}) {
  const [open, setOpen] = useState(true)
  const pending  = apps.filter((a) => a.status === 'PENDING').length
  const approved = apps.filter((a) => a.status === 'APPROVED').length
  const sorted   = [...apps].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1
    return b.score - a.score
  })

  const imgSrc = property.images?.[0]
    ? property.images[0].startsWith('http')
      ? property.images[0]
      : `${SERVER_BASE}${property.images[0]}`
    : null

  return (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      {/* Property header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left transition-opacity hover:opacity-90"
        style={{ background: M.surface }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={property.title}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            style={{ border: `1px solid ${M.border}` }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: M.ownerLight }}
          >
            <Building2 className="w-6 h-6" style={{ color: M.owner }} />
          </div>
        )}

        <div className="flex-1 min-w-0 text-left">
          <h3
            className="font-semibold text-sm truncate"
            style={{ color: M.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {property.title}
          </h3>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: M.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              <MapPin className="w-3 h-3" />{property.city}
            </span>
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: M.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              <Euro className="w-3 h-3" />{property.price} €/mois
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {pending > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center"
              style={{ background: M.warningBg, border: `1px solid #e8c98b`, color: M.warning }}
            >
              {pending} en attente
            </span>
          )}
          {approved > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center"
              style={{ background: M.successBg, border: `1px solid #a8d5bc`, color: M.success }}
            >
              {approved} approuvé{approved > 1 ? 's' : ''}
            </span>
          )}
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center"
            style={{ background: M.muted, border: `1px solid ${M.border}`, color: M.inkMid }}
          >
            {apps.length} dossier{apps.length > 1 ? 's' : ''}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 ml-1 flex-shrink-0" style={{ color: M.inkFaint }} />
            : <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" style={{ color: M.inkFaint }} />
          }
        </div>
      </button>

      {/* Applications list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-3 space-y-2"
              style={{ borderTop: `1px solid ${M.border}`, background: M.muted }}
            >
              {sorted.map((app) => (
                <ApplicationCard key={app.id} app={app} onDecision={onDecision} onOpenDossier={onOpenDossier} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [dossierModal, setDossierModal] = useState<{ tenantId: string; tenantName: string } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await applicationService.list()
      setApplications(data)
    } catch {
      toast.error('Impossible de charger les candidatures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDecision(id: string, status: 'APPROVED' | 'REJECTED') {
    await applicationService.updateStatus(id, status)
    toast.success(status === 'APPROVED' ? 'Candidature approuvée !' : 'Candidature refusée.')
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
  }

  const filtered = useMemo(() => {
    if (filter === 'ALL') return applications
    return applications.filter((a) => a.status === filter)
  }, [applications, filter])

  // Group by property
  const groups = useMemo(() => {
    const map = new Map<string, { property: PropertyInfo; apps: Application[] }>()
    for (const app of filtered) {
      const prop = app.property!
      if (!map.has(prop.id)) {
        map.set(prop.id, {
          property: { id: prop.id, title: prop.title, price: prop.price, city: prop.city, images: prop.images },
          apps: [],
        })
      }
      map.get(prop.id)!.apps.push(app)
    }
    return [...map.values()].sort((a, b) => {
      const aPending = a.apps.filter((x) => x.status === 'PENDING').length
      const bPending = b.apps.filter((x) => x.status === 'PENDING').length
      return bPending - aPending
    })
  }, [filtered])

  const counts = useMemo(() => ({
    total:    applications.length,
    pending:  applications.filter((a) => a.status === 'PENDING').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  }), [applications])

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL',      label: 'Tous',       count: counts.total },
    { key: 'PENDING',  label: 'En attente', count: counts.pending },
    { key: 'APPROVED', label: 'Approuvés',  count: counts.approved },
    { key: 'REJECTED', label: 'Refusés',    count: counts.rejected },
  ]

  return (
    <Layout>
      {dossierModal && (
        <DossierReviewModal
          tenantId={dossierModal.tenantId}
          tenantName={dossierModal.tenantName}
          onClose={() => setDossierModal(null)}
        />
      )}
      <div
        className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        style={{ background: M.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Page header — Maison style */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p
                className="uppercase tracking-widest mb-1"
                style={{ fontSize: 10, color: M.inkFaint, letterSpacing: '0.12em' }}
              >
                Propriétaire
              </p>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: 40,
                  color: M.ink,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Candidatures
              </h1>
              <p className="mt-1.5" style={{ fontSize: 14, color: M.inkMid }}>
                {counts.total} dossier{counts.total !== 1 ? 's' : ''} · {counts.pending} en attente
                {groups.length > 0 && ` · ${groups.length} annonce${groups.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors"
              style={{
                background: M.surface,
                border: `1px solid ${M.border}`,
                color: M.inkMid,
                borderRadius: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
              onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mb-6">
            {[
              {
                label: 'En attente',
                value: counts.pending,
                icon: <Clock className="w-5 h-5" />,
                bg: M.warningBg,
                border: '#e8c98b',
                color: M.warning,
              },
              {
                label: 'Approuvées',
                value: counts.approved,
                icon: <CheckCircle2 className="w-5 h-5" />,
                bg: M.successBg,
                border: '#a8d5bc',
                color: M.success,
              },
              {
                label: 'Refusées',
                value: counts.rejected,
                icon: <XCircle className="w-5 h-5" />,
                bg: M.dangerBg,
                border: '#f5c6c6',
                color: M.danger,
              },
            ].map(({ label, value, icon, bg, border, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-4"
                style={cardStyle}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg, border: `1px solid ${border}`, color }}
                >
                  {icon}
                </div>
                <div>
                  <div
                    className="text-xl font-bold"
                    style={{ color: M.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: 12, color: M.inkFaint }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tab bar */}
          <div
            className="flex mb-5"
            style={{ borderBottom: `1px solid ${M.border}` }}
          >
            {FILTERS.map(({ key, label, count }) => {
              const active = filter === key
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className="px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    color: active ? M.owner : M.inkMid,
                    borderBottom: active ? `2px solid ${M.owner}` : '2px solid transparent',
                    background: 'transparent',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    marginBottom: -1,
                  }}
                >
                  {label} <span style={{ opacity: 0.65, fontSize: 12 }}>({count})</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div
              className="flex items-center justify-center py-16 gap-2"
              style={{ ...cardStyle }}
            >
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: M.owner }} />
              <span style={{ fontSize: 14, color: M.inkFaint }}>Chargement…</span>
            </div>
          ) : groups.length === 0 ? (
            <div
              className="text-center py-16"
              style={cardStyle}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: M.ownerLight }}
              >
                <Users className="w-7 h-7" style={{ color: M.owner }} />
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: M.ink,
                  marginBottom: 6,
                }}
              >
                {filter === 'ALL' ? 'Aucune candidature' : 'Aucun résultat'}
              </p>
              <p style={{ fontSize: 13, color: M.inkMid }}>
                {filter === 'ALL'
                  ? "Publiez vos annonces pour recevoir des dossiers."
                  : 'Aucune candidature dans cette catégorie.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {groups.map(({ property, apps }) => (
                  <motion.div
                    key={property.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <PropertyGroup property={property} apps={apps} onDecision={handleDecision} onOpenDossier={(id, name) => setDossierModal({ tenantId: id, tenantName: name })} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
