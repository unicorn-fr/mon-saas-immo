/**
 * ApplicationManagement — Owner dashboard for all incoming candidatures.
 * Applications are grouped by property listing.
 * Approved candidates get immediate access to the booking calendar.
 */
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Clock, Users, ChevronDown, ChevronUp,
  Building2, RotateCcw, Loader2, MapPin, Euro, ChevronRight, FolderOpen, CalendarDays,
} from 'lucide-react'
import { applicationService } from '../../services/application.service'
import { scoreColor } from '../../utils/matchingEngine'
import type { Application, ApplicationStatus } from '../../types/application.types'
import { Layout } from '../../components/layout/Layout'
import { DossierReviewModal } from '../../components/document/DossierReviewModal'
import { CalendarShareModal } from '../../components/booking/CalendarShareModal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BAI } from '../../constants/bailio-tokens'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:5000'

// ─── Maison tokens ────────────────────────────────────────────────────────────


const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

// ─── Score badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const strokeColor = score >= 70 ? BAI.success : score >= 40 ? BAI.caramel : BAI.error
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" strokeWidth="4" fill="none" stroke={BAI.border} />
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
      <span style={{ fontSize: 10, color: BAI.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}>/100</span>
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
  PENDING:   { background: BAI.warningLight, border: `1px solid #e8c98b`, color: BAI.warning },
  APPROVED:  { background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, color: BAI.owner },
  REJECTED:  { background: BAI.errorLight, border: `1px solid #f5c6c6`, color: BAI.error },
  WITHDRAWN: { background: BAI.bgMuted, border: `1px solid ${BAI.border}`, color: BAI.inkFaint },
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
      {/* Main row — stack on mobile, row on sm+ */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        {/* Top section: avatar + score + nom/statut */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-full w-9 h-9 text-sm font-bold"
            style={{
              background: BAI.ownerLight,
              color: BAI.owner,
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
                style={{ color: BAI.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}
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
                  style={{ background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, color: BAI.owner }}
                >
                  Garant {app.guarantorType}
                </span>
              )}
            </div>
            <div
              className="text-xs mt-0.5 truncate"
              style={{ color: BAI.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              {tenant.email} · {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
          <button
            onClick={() => onOpenDossier(tenant.id, `${tenant.firstName ?? ''} ${tenant.lastName ?? ''}`.trim())}
            className="flex items-center gap-1 px-3 text-xs font-semibold transition-colors"
            style={{
              background: BAI.ownerLight,
              border: `1px solid ${BAI.ownerBorder}`,
              color: BAI.owner,
              borderRadius: 8,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              minHeight: 40,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#d8e8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.background = BAI.ownerLight)}
          >
            <FolderOpen className="w-3 h-3" />
            Dossier
          </button>
          {app.status === 'PENDING' && (
            <>
              <button
                onClick={() => decide('APPROVED')}
                disabled={loading}
                className="flex items-center gap-1 px-3 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                style={{
                  background: BAI.owner,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  minHeight: 40,
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#142860')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = BAI.owner)}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approuver
              </button>
              <button
                onClick={() => decide('REJECTED')}
                disabled={loading}
                className="flex items-center gap-1 px-3 text-xs font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: BAI.errorLight,
                  border: `1px solid #f5c6c6`,
                  color: BAI.error,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  minHeight: 40,
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#fde8e8')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = BAI.errorLight)}
              >
                <XCircle className="w-3 h-3" />
                Refuser
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center transition-colors"
            style={{ color: BAI.inkFaint, borderRadius: 8, minHeight: 40, minWidth: 40 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
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
            style={{ borderTop: `1px solid ${BAI.border}` }}
          >
            <div className="p-4 space-y-3" style={{ background: BAI.bgMuted }}>
              {details.length > 0 && (
                <div>
                  <p
                    className="uppercase tracking-wide mb-2"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: BAI.inkFaint,
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
                          d.status === 'pass'    ? { background: BAI.successLight, border: `1px solid #a8d5bc`, color: BAI.success } :
                          d.status === 'partial' ? { background: BAI.warningLight, border: `1px solid #e8c98b`, color: BAI.warning } :
                          d.status === 'fail'    ? { background: BAI.errorLight,  border: `1px solid #f5c6c6`, color: BAI.error  } :
                                                   { background: BAI.bgMuted,     border: `1px solid ${BAI.border}`, color: BAI.inkMid }
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
                      color: BAI.inkFaint,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      letterSpacing: '0.06em',
                    }}
                  >
                    Lettre de motivation
                  </p>
                  <p
                    className="text-sm rounded-xl p-3"
                    style={{
                      background: BAI.bgSurface,
                      border: `1px solid ${BAI.border}`,
                      color: BAI.inkMid,
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
                  style={{ background: BAI.successLight, border: `1px solid #a8d5bc`, color: BAI.success }}
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
  onShareCalendar,
}: {
  property: PropertyInfo
  apps: Application[]
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>
  onOpenDossier: (tenantId: string, tenantName: string) => void
  onShareCalendar: (propertyId: string, propertyTitle: string, tenants: { id: string; firstName: string; lastName: string; email: string }[]) => void
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
        className="w-full flex items-start sm:items-center gap-3 sm:gap-4 p-4 text-left transition-opacity hover:opacity-90 flex-wrap sm:flex-nowrap"
        style={{ background: BAI.bgSurface }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={property.title}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            style={{ border: `1px solid ${BAI.border}` }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: BAI.ownerLight }}
          >
            <Building2 className="w-6 h-6" style={{ color: BAI.owner }} />
          </div>
        )}

        <div className="flex-1 min-w-0 text-left">
          <h3
            className="font-semibold text-sm truncate"
            style={{ color: BAI.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {property.title}
          </h3>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: BAI.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              <MapPin className="w-3 h-3" />{property.city}
            </span>
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: BAI.inkFaint, fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              <Euro className="w-3 h-3" />{Number(property.price).toLocaleString('fr-FR')} €/mois
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap flex-shrink-0 ml-auto">
          {pending > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center"
              style={{ background: BAI.warningLight, border: `1px solid #e8c98b`, color: BAI.warning }}
            >
              {pending} en attente
            </span>
          )}
          {approved > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center"
              style={{ background: BAI.successLight, border: `1px solid #a8d5bc`, color: BAI.success }}
            >
              {approved} approuvé{approved > 1 ? 's' : ''}
            </span>
          )}
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center"
            style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, color: BAI.inkMid }}
          >
            {apps.length} dossier{apps.length > 1 ? 's' : ''}
          </span>
          {approved > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const tenants = apps.filter(a => a.status === 'APPROVED').map(a => ({
                  id: a.tenant!.id,
                  firstName: a.tenant!.firstName ?? '',
                  lastName: a.tenant!.lastName ?? '',
                  email: a.tenant!.email,
                }))
                onShareCalendar(property.id, property.title, tenants)
              }}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 rounded-lg"
              style={{ background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, color: BAI.owner, minHeight: 32 }}
            >
              <CalendarDays className="w-3 h-3" />
              <span>Partager</span>
            </button>
          )}
          {open
            ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: BAI.inkFaint }} />
            : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: BAI.inkFaint }} />
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
              style={{ borderTop: `1px solid ${BAI.border}`, background: BAI.bgMuted }}
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
  const [calendarModal, setCalendarModal] = useState<{ propertyId: string; propertyTitle: string; tenants: { id: string; firstName: string; lastName: string; email: string }[] } | null>(null)

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
      {calendarModal && (
        <CalendarShareModal
          isOpen
          onClose={() => setCalendarModal(null)}
          propertyId={calendarModal.propertyId}
          propertyTitle={calendarModal.propertyTitle}
          suggestedTenants={calendarModal.tenants}
        />
      )}
      <div
        className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        style={{ background: BAI.bgBase, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Page header — Maison style */}
          <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
            <div>
              <p
                className="uppercase tracking-widest mb-1"
                style={{ fontSize: 10, color: BAI.inkFaint, letterSpacing: '0.12em' }}
              >
                Propriétaire
              </p>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: 'clamp(20px, 4vw, 40px)',
                  color: BAI.ink,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Candidatures
              </h1>
              <p className="mt-1.5" style={{ fontSize: 14, color: BAI.inkMid }}>
                {counts.total} dossier{counts.total !== 1 ? 's' : ''} · {counts.pending} en attente
                {groups.length > 0 && ` · ${groups.length} annonce${groups.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors"
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                color: BAI.inkMid,
                borderRadius: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
              onMouseLeave={(e) => (e.currentTarget.style.background = BAI.bgSurface)}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: 'En attente',
                value: counts.pending,
                icon: <Clock className="w-5 h-5" />,
                bg: BAI.warningLight,
                border: '#e8c98b',
                color: BAI.warning,
              },
              {
                label: 'Approuvées',
                value: counts.approved,
                icon: <CheckCircle2 className="w-5 h-5" />,
                bg: BAI.successLight,
                border: '#a8d5bc',
                color: BAI.success,
              },
              {
                label: 'Refusées',
                value: counts.rejected,
                icon: <XCircle className="w-5 h-5" />,
                bg: BAI.errorLight,
                border: '#f5c6c6',
                color: BAI.error,
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
                    style={{ color: BAI.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: 12, color: BAI.inkFaint }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tab bar */}
          <div
            className="flex flex-wrap mb-5"
            style={{ borderBottom: `1px solid ${BAI.border}` }}
          >
            {FILTERS.map(({ key, label, count }) => {
              const active = filter === key
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className="px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    color: active ? BAI.owner : BAI.inkMid,
                    borderBottom: active ? `2px solid ${BAI.owner}` : '2px solid transparent',
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
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: BAI.owner }} />
              <span style={{ fontSize: 14, color: BAI.inkFaint }}>Chargement…</span>
            </div>
          ) : groups.length === 0 ? (
            <div
              className="text-center py-16"
              style={cardStyle}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: BAI.ownerLight }}
              >
                <Users className="w-7 h-7" style={{ color: BAI.owner }} />
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: BAI.ink,
                  marginBottom: 6,
                }}
              >
                {filter === 'ALL' ? 'Aucune candidature' : 'Aucun résultat'}
              </p>
              <p style={{ fontSize: 13, color: BAI.inkMid }}>
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
                    <PropertyGroup
                      property={property} apps={apps}
                      onDecision={handleDecision}
                      onOpenDossier={(id, name) => setDossierModal({ tenantId: id, tenantName: name })}
                      onShareCalendar={(pid, ptitle, tenants) => setCalendarModal({ propertyId: pid, propertyTitle: ptitle, tenants })}
                    />
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
