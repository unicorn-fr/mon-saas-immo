/**
 * ApplicationManagement — Owner dashboard for all incoming candidatures.
 * Applications are grouped by property listing.
 * Approved candidates get immediate access to the booking calendar.
 */
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import {
  CheckCircle2, XCircle, Clock, Users, ChevronDown, ChevronUp,
  Building2, RotateCcw, Loader2, MapPin, Euro, ChevronRight, FolderOpen, CalendarDays, Lock,
  Sparkles, AlertTriangle,
} from 'lucide-react'
import { applicationService } from '../../services/application.service'
import { scoreColor } from '../../utils/matchingEngine'
import type { Application, ApplicationStatus } from '../../types/application.types'
import { DossierReviewModal } from '../../components/document/DossierReviewModal'
import { CalendarShareModal } from '../../components/booking/CalendarShareModal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BAI } from '../../constants/bailio-tokens'
import { usePlan } from '../../hooks/usePlan'
import { Link } from 'react-router-dom'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:5000'

const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 14,
  boxShadow: BAI.shadowMd,
}

// ─── Score badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const strokeColor = score >= 70 ? BAI.success : score >= 40 ? BAI.caramel : BAI.error
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      <div style={{ position: 'relative', width: 40, height: 40 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
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
          style={{ fontFamily: BAI.fontBody }}
        >
          {score}
        </span>
      </div>
      <span style={{ fontSize: 10, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>/100</span>
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
  onUnreject,
  onOpenDossier,
  isPro,
}: {
  app: Application
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>
  onUnreject: (id: string) => Promise<void>
  onOpenDossier: (tenantId: string, tenantName: string) => void
  isPro: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ commentary: string; strengths: string[]; concerns: string[]; verdict: 'FORT' | 'MOYEN' | 'FRAGILE' } | null>(null)

  const handleAiScore = async () => {
    setAiLoading(true)
    try {
      const result = await applicationService.aiScore(app.id)
      setAiResult(result)
    } catch {
      toast.error('Analyse IA indisponible')
    } finally {
      setAiLoading(false)
    }
  }

  if (!app.tenant) return null
  const tenant = app.tenant

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
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      {/* Main row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        {/* Ligne 1 : avatar + score + nom/statut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              borderRadius: '50%', width: 36, height: 36,
              background: BAI.ownerLight, color: BAI.owner,
              fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700,
            }}
          >
            {initials}
          </div>

          {isPro ? (
            <ScoreBadge score={app.score} />
          ) : (
            <div
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#fdf5ec', border: '1px solid rgba(196,151,106,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Score IA disponible avec le plan Pro"
            >
              <Lock size={14} style={{ color: BAI.caramel }} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13.5, color: BAI.ink, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tenant.firstName} {tenant.lastName}
              </span>
              <span
                style={{
                  fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                  padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                  ...STATUS_STYLE[app.status],
                }}
              >
                {STATUS_LABEL[app.status]}
              </span>
              {app.hasGuarantor && (
                <span
                  style={{
                    fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                    background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, color: BAI.owner,
                  }}
                >
                  Garant
                </span>
              )}
            </div>
            <div style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenant.email} · {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: BAI.inkFaint, borderRadius: 8, minHeight: 36, minWidth: 36,
              background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Ligne 2 : boutons actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {isPro ? (
            <button
              onClick={() => onOpenDossier(tenant.id, `${tenant.firstName ?? ''} ${tenant.lastName ?? ''}`.trim())}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, color: BAI.owner,
                borderRadius: 8, minHeight: 36, padding: '0 14px', whiteSpace: 'nowrap', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#d8e8fa')}
              onMouseLeave={(e) => (e.currentTarget.style.background = BAI.ownerLight)}
            >
              <FolderOpen size={13} />
              Dossier
            </button>
          ) : (
            <Link
              to="/owner/abonnement"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
                fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                background: '#fdf5ec', border: '1px solid rgba(196,151,106,0.3)', color: BAI.caramel,
                borderRadius: 8, minHeight: 36, padding: '0 14px', whiteSpace: 'nowrap',
                textDecoration: 'none', cursor: 'pointer',
              }}
            >
              <Lock size={12} />
              Dossier IA (PRO)
            </Link>
          )}

          {isPro && (
            <button
              onClick={handleAiScore}
              disabled={aiLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                background: '#fdf5ec', border: '1px solid rgba(196,151,106,0.3)', color: BAI.caramel,
                borderRadius: 8, minHeight: 36, padding: '0 14px', whiteSpace: 'nowrap', cursor: aiLoading ? 'wait' : 'pointer',
                opacity: aiLoading ? 0.7 : 1,
              }}
            >
              {aiLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
              Analyse IA
            </button>
          )}

          {app.status === 'PENDING' && (
            <>
              <button
                onClick={() => decide('APPROVED')}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: '#ffffff',
                  background: BAI.tenant, border: 'none',
                  borderRadius: 8, minHeight: 36, padding: '0 14px', whiteSpace: 'nowrap', cursor: 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#154a2e')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = BAI.tenant)}
              >
                {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={12} />}
                Approuver
              </button>
              <button
                onClick={() => decide('REJECTED')}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                  background: BAI.errorLight, border: `1px solid #f5c6c6`, color: BAI.error,
                  borderRadius: 8, minHeight: 36, padding: '0 14px', whiteSpace: 'nowrap', cursor: 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#fde8e8')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = BAI.errorLight)}
              >
                <XCircle size={12} />
                Refuser
              </button>
            </>
          )}
          {app.status === 'REJECTED' && (
            <button
              onClick={async () => {
                setLoading(true)
                try { await onUnreject(app.id) } finally { setLoading(false) }
              }}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                background: BAI.warningLight, border: `1px solid #e8c98b`, color: BAI.warning,
                borderRadius: 8, minHeight: 36, padding: '0 14px', whiteSpace: 'nowrap', cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#faebd0')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = BAI.warningLight)}
            >
              {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={12} />}
              Annuler refus
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: `1px solid ${BAI.border}` }}
          >
            <div style={{ padding: 16, background: BAI.bgMuted, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {details.length > 0 && (
                <div>
                  {isPro ? (
                    <>
                      <p style={{
                        fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 10,
                      }}>
                        Détail du score
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {details.map((d: { label: string; points: number; maxPoints: number; status: string; explanation: string }) => (
                          <div
                            key={d.label}
                            style={{
                              borderRadius: 10, padding: '10px 12px', fontSize: 12,
                              ...(d.status === 'pass'    ? { background: BAI.successLight, border: `1px solid #a8d5bc`, color: BAI.success } :
                                  d.status === 'partial' ? { background: BAI.warningLight, border: `1px solid #e8c98b`, color: BAI.warning } :
                                  d.status === 'fail'    ? { background: BAI.errorLight,  border: `1px solid #f5c6c6`, color: BAI.error  } :
                                                           { background: BAI.bgMuted, border: `1px solid ${BAI.border}`, color: BAI.inkMid }),
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontWeight: 600 }}>{d.label}</span>
                              <span style={{ fontWeight: 700 }}>{d.points}/{d.maxPoints}</span>
                            </div>
                            <p style={{ opacity: 0.85 }}>{d.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      borderRadius: 10, padding: '12px 14px',
                      background: '#fdf5ec', border: '1px solid rgba(196,151,106,0.3)',
                    }}>
                      <Lock size={14} style={{ color: BAI.caramel, flexShrink: 0 }} />
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel }}>
                        Le détail du score IA est disponible avec le plan{' '}
                        <Link to="/owner/abonnement" style={{ fontWeight: 700, color: BAI.caramel, textDecoration: 'underline' }}>
                          Pro
                        </Link>.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Résultat Analyse IA ── */}
              {aiResult && (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid rgba(196,151,106,0.3)` }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: '#fdf5ec',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={13} style={{ color: BAI.caramel }} />
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.caramel, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Analyse IA (Claude)
                      </span>
                    </div>
                    <span style={{
                      fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      ...(aiResult.verdict === 'FORT'    ? { background: BAI.successLight, color: BAI.success, border: `1px solid #a8d5bc` } :
                          aiResult.verdict === 'MOYEN'   ? { background: '#fdf5ec', color: BAI.caramel, border: '1px solid rgba(196,151,106,0.4)' } :
                                                          { background: BAI.errorLight, color: BAI.error, border: `1px solid #f5c6c6` }),
                    }}>
                      {aiResult.verdict}
                    </span>
                  </div>
                  {/* Body */}
                  <div style={{ padding: '12px 14px', background: BAI.bgSurface, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, fontStyle: 'italic', margin: 0, lineHeight: 1.65 }}>
                      {aiResult.commentary}
                    </p>
                    {aiResult.strengths.length > 0 && (
                      <div className="space-y-1">
                        {aiResult.strengths.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: BAI.success }}>
                            <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    {aiResult.concerns.length > 0 && (
                      <div className="space-y-1">
                        {aiResult.concerns.map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: BAI.warning }}>
                            <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {app.coverLetter && (
                <div>
                  <p style={{
                    fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 8,
                  }}>
                    Lettre de motivation
                  </p>
                  <p style={{
                    fontFamily: BAI.fontBody, fontSize: 13, borderRadius: 10, padding: 14,
                    background: BAI.bgSurface, border: `1px solid ${BAI.border}`, color: BAI.inkMid,
                  }}>
                    {app.coverLetter}
                  </p>
                </div>
              )}

              {app.status === 'APPROVED' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10, padding: 12, fontSize: 13,
                  background: BAI.successLight, border: `1px solid #a8d5bc`, color: BAI.success,
                }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
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
  onUnreject,
  onOpenDossier,
  onShareCalendar,
  isPro,
}: {
  property: PropertyInfo
  apps: Application[]
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>
  onUnreject: (id: string) => Promise<void>
  onOpenDossier: (tenantId: string, tenantName: string) => void
  onShareCalendar: (propertyId: string, propertyTitle: string, tenants: { id: string; firstName: string; lastName: string; email: string }[]) => void
  isPro: boolean
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
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 16,
          padding: '16px 20px', textAlign: 'left', background: BAI.bgSurface,
          border: 'none', cursor: 'pointer', transition: 'background 0.15s',
          flexWrap: 'wrap',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
        onMouseLeave={(e) => (e.currentTarget.style.background = BAI.bgSurface)}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={property.title}
            style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: `1px solid ${BAI.border}` }}
          />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: BAI.ownerLight,
          }}>
            <Building2 size={22} style={{ color: BAI.owner }} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {property.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} />{property.city}
            </span>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Euro size={12} />{Number(property.price).toLocaleString('fr-FR')} €/mois
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0, marginLeft: 'auto' }}>
          {pending > 0 && (
            <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: BAI.warningLight, border: `1px solid #e8c98b`, color: BAI.warning }}>
              {pending} en attente
            </span>
          )}
          {approved > 0 && (
            <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: BAI.successLight, border: `1px solid #a8d5bc`, color: BAI.success }}>
              {approved} approuvé{approved > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, color: BAI.inkMid }}>
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
              style={{
                display: 'flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody,
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, color: BAI.owner,
                minHeight: 30, cursor: 'pointer',
              }}
            >
              <CalendarDays size={12} />
              Partager
            </button>
          )}
          {open
            ? <ChevronUp size={16} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
            : <ChevronRight size={16} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
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
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: 12, borderTop: `1px solid ${BAI.border}`, background: BAI.bgMuted, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sorted.map((app) => (
                <ApplicationCard key={app.id} app={app} onDecision={onDecision} onUnreject={onUnreject} onOpenDossier={onOpenDossier} isPro={isPro} />
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
  const { hasPlan } = usePlan()
  const isPro = hasPlan('PRO')
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768

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
    try {
      await applicationService.updateStatus(id, status)
      toast.success(status === 'APPROVED' ? 'Candidature approuvée !' : 'Candidature refusée.')
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur lors de la mise à jour de la candidature')
    }
  }

  async function handleUnreject(id: string) {
    await applicationService.unreject(id)
    toast.success('Refus annulé — candidature remise en attente.')
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: 'PENDING' } : a))
  }

  const filtered = useMemo(() => {
    if (filter === 'ALL') return applications
    return applications.filter((a) => a.status === filter)
  }, [applications, filter])

  // Group by property
  const groups = useMemo(() => {
    const map = new Map<string, { property: PropertyInfo; apps: Application[] }>()
    for (const app of filtered) {
      if (!app.property) continue
      const prop = app.property
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
    { key: 'ALL',      label: 'Toutes',      count: counts.total },
    { key: 'PENDING',  label: 'En attente',  count: counts.pending },
    { key: 'APPROVED', label: 'Approuvées',  count: counts.approved },
    { key: 'REJECTED', label: 'Refusées',    count: counts.rejected },
  ]

  return (
    <>      {dossierModal && (
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
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px,4vw,48px) clamp(16px,3vw,32px)' }}>

          {/* ── Page header ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 12, marginBottom: 36, flexWrap: 'wrap' }}
          >
            <div>
              <p style={{
                fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 8,
              }}>
                Candidatures
              </p>
              <h1 style={{
                fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic',
                fontSize: 'clamp(26px, 4vw, 40px)', color: BAI.ink, lineHeight: 1.1, margin: '0 0 8px',
              }}>
                Gestion des candidatures
              </h1>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
                {counts.total} dossier{counts.total !== 1 ? 's' : ''} · {counts.pending} en attente
                {groups.length > 0 && ` · ${groups.length} annonce${groups.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={load}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`, color: BAI.inkMid,
                borderRadius: 9, padding: '10px 16px', minHeight: 44, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
              onMouseLeave={(e) => (e.currentTarget.style.background = BAI.bgSurface)}
            >
              <RotateCcw size={14} /> Actualiser
            </button>
          </motion.div>

          {/* ── Stats ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'En attente', value: counts.pending, icon: <Clock size={20} />, bg: BAI.warningLight, border: '#e8c98b', color: BAI.warning, accent: BAI.warning },
              { label: 'Approuvées', value: counts.approved, icon: <CheckCircle2 size={20} />, bg: BAI.successLight, border: '#a8d5bc', color: BAI.success, accent: BAI.success },
              { label: 'Refusées', value: counts.rejected, icon: <XCircle size={20} />, bg: BAI.errorLight, border: '#f5c6c6', color: BAI.error, accent: BAI.error },
            ].map(({ label, value, icon, bg, border, color, accent }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderTop: `3px solid ${accent}` }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: bg, border: `1px solid ${border}`, color }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 4 }}>{label}</p>
                  <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,30px)', color: BAI.ink, lineHeight: 1 }}>{value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Filter tab bar ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: `1px solid ${BAI.border}`, marginBottom: 24 }}>
            {FILTERS.map(({ key, label, count }) => {
              const active = filter === key
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: active ? 700 : 400,
                    color: active ? BAI.ink : BAI.inkMid,
                    borderBottom: active ? `2px solid ${BAI.caramel}` : '2px solid transparent',
                    background: 'transparent', border: 'none',
                    borderBottomWidth: 2, borderBottomStyle: 'solid',
                    borderBottomColor: active ? BAI.caramel : 'transparent',
                    padding: '10px 18px 12px', cursor: 'pointer',
                    transition: 'color 0.15s, border-bottom-color 0.15s',
                    marginBottom: -1, flexShrink: 0, whiteSpace: 'nowrap',
                    minHeight: 44, touchAction: 'manipulation',
                  }}
                >
                  {label} <span style={{ opacity: 0.6, fontSize: 12, marginLeft: 4 }}>({count})</span>
                </button>
              )
            })}
          </div>

          {/* ── Content ───────────────────────────────────────────────────── */}
          {loading ? (
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '64px 0' }}>
              <Loader2 size={20} style={{ color: BAI.owner, animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>Chargement…</span>
            </div>
          ) : groups.length === 0 ? (
            <div style={{ ...cardStyle, padding: '64px 24px', textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                background: BAI.ownerLight,
              }}>
                <Users size={26} style={{ color: BAI.owner }} />
              </div>
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 24, fontWeight: 700, color: BAI.ink, marginBottom: 8 }}>
                {filter === 'ALL' ? 'Aucune candidature' : 'Aucun résultat'}
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13.5, color: BAI.inkMid }}>
                {filter === 'ALL'
                  ? "Publiez vos annonces pour recevoir des dossiers."
                  : 'Aucune candidature dans cette catégorie.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                      onUnreject={handleUnreject}
                      onOpenDossier={(id, name) => setDossierModal({ tenantId: id, tenantName: name })}
                      onShareCalendar={(pid, ptitle, tenants) => setCalendarModal({ propertyId: pid, propertyTitle: ptitle, tenants })}
                      isPro={isPro}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>  )
}
