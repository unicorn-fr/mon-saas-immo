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
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TenantDossierModal } from '../../components/dossier/TenantDossierModal'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:3000'

// ─── Score badge ────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" strokeWidth="4" className="stroke-slate-200 fill-none" />
          <circle
            cx="20" cy="20" r="16" strokeWidth="4" className="fill-none"
            style={{
              stroke: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444',
              strokeDasharray: 2 * Math.PI * 16,
              strokeDashoffset: 2 * Math.PI * 16 * (1 - score / 100),
              strokeLinecap: 'round',
              transition: 'stroke-dashoffset 0.6s ease',
            }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${scoreColor(score)}`}>
          {score}
        </span>
      </div>
      <span className="text-[10px] text-slate-400">/100</span>
    </div>
  )
}

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING:   'En attente',
  APPROVED:  'Approuvée',
  REJECTED:  'Refusée',
  WITHDRAWN: 'Retirée',
}

const STATUS_STYLE: Record<ApplicationStatus, React.CSSProperties> = {
  PENDING:   { background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' },
  APPROVED:  { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' },
  REJECTED:  { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' },
  WITHDRAWN: { background: '#f5f5f7', border: '1px solid #d2d2d7', color: '#86868b' },
}

// ─── Single application card ─────────────────────────────────────────────────

function ApplicationCard({
  app,
  onDecision,
}: {
  app: Application
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDossier, setShowDossier] = useState(false)
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

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1px solid #d2d2d7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        background: '#ffffff',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        <ScoreBadge score={app.score} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: '#1d1d1f' }}>
              {tenant.firstName} {tenant.lastName}
            </span>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center"
              style={STATUS_STYLE[app.status]}
            >
              {STATUS_LABEL[app.status]}
            </span>
            {app.hasGuarantor && (
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
              >
                Garant {app.guarantorType}
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#86868b' }}>
            {tenant.email} · {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowDossier(true)}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#dbeafe')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#eff6ff')}
          >
            <FolderOpen className="w-3 h-3" />
            Dossier
          </button>
          {app.status === 'PENDING' && (
            <>
              <button
                onClick={() => decide('APPROVED')}
                disabled={loading}
                className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: '#059669' }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#047857')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#059669')}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approuver
              </button>
              <button
                onClick={() => decide('REJECTED')}
                disabled={loading}
                className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#fee2e2')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#fef2f2')}
              >
                <XCircle className="w-3 h-3" />
                Refuser
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-xl transition-colors"
            style={{ color: '#86868b' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showDossier && (
        <TenantDossierModal
          tenantId={tenant.id}
          tenantName={`${tenant.firstName ?? ''} ${tenant.lastName ?? ''}`.trim()}
          onClose={() => setShowDossier(false)}
        />
      )}

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            style={{ borderTop: '1px solid #d2d2d7' }}
          >
            <div className="p-4 space-y-3" style={{ background: '#f5f5f7' }}>
              {details.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#86868b' }}>
                    Détail du score
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {details.map((d: { label: string; points: number; maxPoints: number; status: string; explanation: string }) => (
                      <div
                        key={d.label}
                        className="rounded-xl p-2.5 text-xs"
                        style={
                          d.status === 'pass'    ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' } :
                          d.status === 'partial' ? { background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' } :
                          d.status === 'fail'    ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' } :
                                                   { background: '#f5f5f7', border: '1px solid #d2d2d7', color: '#64748b' }
                        }
                      >
                        <div className="flex justify-between mb-0.5">
                          <span className="font-medium">{d.label}</span>
                          <span className="font-bold">{d.points}/{d.maxPoints}</span>
                        </div>
                        <p className="opacity-80">{d.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {app.coverLetter && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#86868b' }}>
                    Lettre de motivation
                  </p>
                  <p
                    className="text-sm rounded-xl p-3"
                    style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                  >
                    {app.coverLetter}
                  </p>
                </div>
              )}

              {app.status === 'APPROVED' && (
                <div
                  className="flex items-center gap-2 rounded-xl p-3 text-sm"
                  style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}
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
}: {
  property: PropertyInfo
  apps: Application[]
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: '1px solid #d2d2d7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
        background: '#ffffff',
      }}
    >
      {/* Property header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left transition-opacity hover:opacity-90"
        style={{ background: '#ffffff' }}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={property.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#e8f0fe' }}
          >
            <Building2 className="w-6 h-6" style={{ color: '#007AFF' }} />
          </div>
        )}

        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-semibold text-sm truncate" style={{ color: '#1d1d1f' }}>
            {property.title}
          </h3>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs flex items-center gap-1" style={{ color: '#86868b' }}>
              <MapPin className="w-3 h-3" />{property.city}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: '#86868b' }}>
              <Euro className="w-3 h-3" />{property.price} €/mois
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {pending > 0 && (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center"
              style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' }}
            >
              {pending} en attente
            </span>
          )}
          {approved > 0 && (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center"
              style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}
            >
              {approved} approuvé{approved > 1 ? 's' : ''}
            </span>
          )}
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center"
            style={{ background: '#f5f5f7', border: '1px solid #d2d2d7', color: '#64748b' }}
          >
            {apps.length} dossier{apps.length > 1 ? 's' : ''}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 ml-1 flex-shrink-0" style={{ color: '#86868b' }} />
            : <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" style={{ color: '#86868b' }} />
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
              style={{ borderTop: '1px solid #d2d2d7', background: '#f5f5f7' }}
            >
              {sorted.map((app) => (
                <ApplicationCard key={app.id} app={app} onDecision={onDecision} />
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
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f5f5f7' }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: '#1d1d1f', fontFamily: '"Plus Jakarta Sans", Inter, system-ui' }}
              >
                Candidatures reçues
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#86868b' }}>
                {counts.total} dossier{counts.total !== 1 ? 's' : ''} · {counts.pending} en attente
                {groups.length > 0 && ` · ${groups.length} annonce${groups.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold border transition-colors"
              style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'En attente', value: counts.pending,  icon: <Clock className="w-5 h-5" />,        bg: '#fffbeb', border: '#fde68a', color: '#d97706' },
              { label: 'Approuvées', value: counts.approved, icon: <CheckCircle2 className="w-5 h-5" />, bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
              { label: 'Refusées',   value: counts.rejected, icon: <XCircle className="w-5 h-5" />,      bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
            ].map(({ label, value, icon, bg, border, color }) => (
              <div
                key={label}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: '#ffffff',
                  border: '1px solid #d2d2d7',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg, border: `1px solid ${border}`, color }}
                >
                  {icon}
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: '#1d1d1f' }}>{value}</div>
                  <div className="text-xs" style={{ color: '#86868b' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {FILTERS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="rounded-full px-3 py-1 text-xs font-semibold border transition-all"
                style={
                  filter === key
                    ? { background: '#007AFF', border: '1px solid #007AFF', color: '#ffffff' }
                    : { background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }
                }
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div
              className="flex items-center justify-center py-16 gap-2 rounded-2xl"
              style={{ background: '#ffffff', border: '1px solid #d2d2d7' }}
            >
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#007AFF' }} />
              <span className="text-sm" style={{ color: '#86868b' }}>Chargement…</span>
            </div>
          ) : groups.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl"
              style={{ background: '#ffffff', border: '1px solid #d2d2d7' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#e8f0fe' }}
              >
                <Users className="w-7 h-7" style={{ color: '#007AFF' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#515154' }}>
                {filter === 'ALL'
                  ? "Aucune candidature reçue pour l'instant."
                  : 'Aucune candidature dans cette catégorie.'}
              </p>
              {filter === 'ALL' && (
                <p className="text-xs mt-1" style={{ color: '#86868b' }}>
                  Publiez vos annonces pour recevoir des dossiers.
                </p>
              )}
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
                    <PropertyGroup property={property} apps={apps} onDecision={handleDecision} />
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
