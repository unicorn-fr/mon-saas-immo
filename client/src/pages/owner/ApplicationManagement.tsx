/**
 * ApplicationManagement — Owner dashboard for all incoming candidatures.
 * Applications are grouped by property listing.
 * Approved candidates get immediate access to the booking calendar.
 */
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Clock, Users, ChevronDown, ChevronUp,
  Building2, RotateCcw, Loader2, MapPin, Euro, ChevronRight,
} from 'lucide-react'
import { applicationService } from '../../services/application.service'
import { scoreColor } from '../../utils/matchingEngine'
import type { Application, ApplicationStatus } from '../../types/application.types'
import { Layout } from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

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

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-100 text-red-700 border-red-200',
  WITHDRAWN: 'bg-slate-100 text-slate-500 border-slate-200',
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
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-3" style={{ background: 'var(--surface-card)' }}>
        <ScoreBadge score={app.score} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {tenant.firstName} {tenant.lastName}
            </span>
            <span className={`text-xs border rounded-full px-2 py-0.5 ${STATUS_STYLE[app.status]}`}>
              {STATUS_LABEL[app.status]}
            </span>
            {app.hasGuarantor && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                Garant {app.guarantorType}
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {tenant.email} · {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {app.status === 'PENDING' && (
            <>
              <button
                onClick={() => decide('APPROVED')}
                disabled={loading}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approuver
              </button>
              <button
                onClick={() => decide('REJECTED')}
                disabled={loading}
                className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-3 h-3" />
                Refuser
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
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
            className="border-t overflow-hidden"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-subtle)' }}
          >
            <div className="p-4 space-y-3">
              {details.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    Détail du score
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {details.map((d: { label: string; points: number; maxPoints: number; status: string; explanation: string }) => (
                      <div
                        key={d.label}
                        className={`rounded-xl p-2.5 text-xs border ${
                          d.status === 'pass'    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          d.status === 'partial' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          d.status === 'fail'    ? 'bg-red-50 border-red-200 text-red-700' :
                                                   'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
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
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    Lettre de motivation
                  </p>
                  <p className="text-sm rounded-xl p-3 border" style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {app.coverLetter}
                  </p>
                </div>
              )}

              {app.status === 'APPROVED' && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
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
    <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)' }}>
      {/* Property header — click to collapse/expand */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left transition-opacity hover:opacity-90"
        style={{ background: 'var(--surface-card)' }}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={property.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-slate-400" />
          </div>
        )}

        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {property.title}
          </h3>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <MapPin className="w-3 h-3" />{property.city}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <Euro className="w-3 h-3" />{property.price} €/mois
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {pending > 0 && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
              {pending} en attente
            </span>
          )}
          {approved > 0 && (
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1">
              {approved} approuvé{approved > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs rounded-full px-2.5 py-1 border" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
            {apps.length} dossier{apps.length > 1 ? 's' : ''}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 ml-1 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            : <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
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
              className="p-3 space-y-2 border-t"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-subtle)' }}
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
    // Sort groups: most pending applications first
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Candidatures reçues
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {counts.total} dossier{counts.total !== 1 ? 's' : ''} · {counts.pending} en attente
              {groups.length > 0 && ` · ${groups.length} annonce${groups.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm hover:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-card)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'En attente', value: counts.pending,  icon: <Clock className="w-4 h-4" />,        color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Approuvées', value: counts.approved, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: 'Refusées',   value: counts.rejected, icon: <XCircle className="w-4 h-4" />,      color: 'text-red-600 bg-red-50 border-red-200' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
              {icon}
              <div>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f ? 'bg-violet-600 border-violet-600 text-white' : ''
              }`}
              style={filter !== f ? { background: 'var(--surface-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
            >
              {f === 'ALL'      ? `Tous (${counts.total})` :
               f === 'PENDING'  ? `En attente (${counts.pending})` :
               f === 'APPROVED' ? `Approuvés (${counts.approved})` :
               `Refusés (${counts.rejected})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {filter === 'ALL'
                ? 'Aucune candidature reçue pour l\'instant.'
                : 'Aucune candidature dans cette catégorie.'}
            </p>
            {filter === 'ALL' && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
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
    </Layout>
  )
}
