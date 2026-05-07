/**
 * MyApplications — Tenant view of all submitted candidatures.
 * Groups: En cours (PENDING + APPROVED) / Refusées (REJECTED) / Retirées (WITHDRAWN)
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Calendar, Loader2,
  Trash2, ChevronDown, ChevronUp, ArrowUpRight, SendHorizonal,
  XCircle, RefreshCw,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { applicationService } from '../../services/application.service'
import type { Application, ApplicationStatus } from '../../types/application.types'
import { Layout } from '../../components/layout/Layout'
import { BookingModal } from '../../components/booking/BookingModal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING:   'En cours d\'examen',
  APPROVED:  'Approuvée — visite disponible',
  REJECTED:  'Non retenue',
  WITHDRAWN: 'Retirée',
}

const STATUS_STYLE: Record<ApplicationStatus, React.CSSProperties> = {
  PENDING:   { background: '#fdf5ec', color: '#92400e', border: '1px solid #e8c99a' },
  APPROVED:  { background: '#fdf5ec', color: '#c4976a', border: '1px solid #f3c99a' },
  REJECTED:  { background: '#fef2f2', color: '#9b1c1c', border: '1px solid #fca5a5' },
  WITHDRAWN: { background: '#f4f2ee', color: '#9e9b96', border: '1px solid #ccc9c3' },
}

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:5000'

function AppCard({ app, onWithdraw, onReapply }: { app: Application; onWithdraw: (id: string) => void; onReapply: (updated: Application) => void }) {
  const [expanded, setExpanded] = useState(app.status === 'REJECTED')
  const [withdrawing, setWithdrawing] = useState(false)
  const [reapplying, setReapplying] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const navigate = useNavigate()
  const prop = app.property

  async function handleWithdraw() {
    if (!confirm('Retirer votre candidature pour ce bien ?')) return
    setWithdrawing(true)
    try {
      await applicationService.withdraw(app.id)
      toast.success('Candidature retirée.')
      onWithdraw(app.id)
    } catch {
      toast.error('Erreur lors du retrait.')
    } finally {
      setWithdrawing(false)
    }
  }

  async function handleReapply() {
    if (!prop) return
    setReapplying(true)
    try {
      const updated = await applicationService.create({ propertyId: prop.id })
      toast.success('Candidature envoyée à nouveau !')
      onReapply(updated)
    } catch (e: any) {
      const msg: string = e?.message ?? 'Impossible de repostuler'
      if (msg.includes('dossier locatif est incomplet') || msg.includes('DOSSIER_INCOMPLET')) {
        toast.error('Complétez votre dossier avant de postuler', { duration: 5000 })
        window.location.href = '/dossier'
        return
      }
      toast.error(msg)
    } finally {
      setReapplying(false)
    }
  }

  const details = app.matchDetails ? Object.values(app.matchDetails) : []
  const isRejected = app.status === 'REJECTED'
  const isWithdrawn = app.status === 'WITHDRAWN'

  // Fallback si la propriété n'est plus disponible
  if (!prop) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        style={{
          background: '#ffffff',
          border: '1px solid #e4e1db',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
          overflow: 'hidden',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          opacity: 0.6,
        }}
      >
        <div className="flex gap-4 p-4 items-center">
          <div
            className="w-16 h-16 flex items-center justify-center flex-shrink-0"
            style={{ background: '#f4f2ee', borderRadius: 8 }}
          >
            <Building2 className="w-6 h-6" style={{ color: '#9e9b96' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 600, color: '#9e9b96' }}>Logement non disponible</p>
            <p style={{ fontSize: 12, color: '#9e9b96', marginTop: 2 }}>
              Ce bien n'est plus accessible.
            </p>
          </div>
          <span
            className="flex-shrink-0"
            style={{
              ...STATUS_STYLE[app.status],
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 99,
              padding: '2px 10px',
              whiteSpace: 'nowrap',
            }}
          >
            {STATUS_LABEL[app.status]}
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        background: '#ffffff',
        border: isRejected ? '1px solid #fca5a5' : isWithdrawn ? '1px solid #ccc9c3' : '1px solid #e4e1db',
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        overflow: 'hidden',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        opacity: isRejected || isWithdrawn ? 0.85 : 1,
      }}
    >
      <Link
        to={`/property/${prop.id}`}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        {/* Card body — colonne sur mobile, ligne sur sm+ */}
        <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 sm:p-4">
          {/* Property image — 100px mobile (full width), 64px sm+ (fixed) */}
          {prop.images && prop.images[0] ? (
            <img
              src={`${SERVER_BASE}${prop.images[0]}`}
              alt={prop.title}
              className="w-full sm:w-16 sm:flex-shrink-0 object-cover"
              style={{
                height: 100,
                borderRadius: 0,
              }}
            />
          ) : (
            <div
              className="w-full sm:w-16 sm:flex-shrink-0 flex items-center justify-center"
              style={{ height: 100, background: '#f4f2ee' }}
            >
              <Building2 className="w-6 h-6" style={{ color: '#9e9b96' }} />
            </div>
          )}

          <div className="flex-1 min-w-0 p-4 sm:p-0">
            {/* Title + status badge */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <h3
                  className="truncate"
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#0d0c0a',
                  }}
                >
                  {prop.title}
                </h3>
                <p style={{ fontSize: 12, color: '#9e9b96', marginTop: 2 }}>
                  {prop.city}
                  {' · '}
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: '#5a5754' }}>
                    {Number(prop.price).toLocaleString('fr-FR')} €/mois
                  </span>
                </p>
              </div>
              <span
                className="flex-shrink-0"
                style={{
                  ...STATUS_STYLE[app.status],
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 99,
                  padding: '4px 10px',
                  whiteSpace: 'nowrap',
                }}
              >
                {STATUS_LABEL[app.status]}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span style={{ fontSize: 11, color: '#9e9b96' }}>
                Envoyée le {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
              </span>
              <span
                className="flex items-center gap-0.5"
                style={{ fontSize: 11, color: '#c4976a', fontWeight: 500 }}
              >
                Voir le bien <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {app.status === 'APPROVED' && prop && (
              <>
                <button
                  className="mt-2 inline-flex items-center gap-1.5"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setShowBooking(true) }}
                  style={{
                    background: '#edf7f2',
                    color: '#1b5e3b',
                    border: '1px solid #9fd4ba',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    minHeight: 44,
                    cursor: 'pointer',
                  }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Réserver une visite →
                </button>
                <BookingModal
                  isOpen={showBooking}
                  onClose={() => setShowBooking(false)}
                  propertyId={prop.id}
                  propertyTitle={prop.title}
                  visitDuration={prop.visitDuration}
                  onSuccess={() => { setShowBooking(false); navigate('/my-bookings') }}
                />
              </>
            )}

            {/* Actions — flex-wrap, touch targets ≥ 44px */}
            <div
              className="flex items-center gap-2 flex-wrap mt-3"
              onClick={e => e.preventDefault()}
            >
              {app.status === 'PENDING' && (
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  style={{
                    borderRadius: 8,
                    color: '#9b1c1c',
                    border: '1px solid #fca5a5',
                    background: '#fef2f2',
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: withdrawing ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    minHeight: 44,
                  }}
                >
                  {withdrawing
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                  Retirer
                </button>
              )}
              {!isWithdrawn && (
                <button
                  onClick={(e) => { e.preventDefault(); setExpanded(!expanded) }}
                  className="inline-flex items-center gap-1.5 transition-colors"
                  style={{
                    borderRadius: 8,
                    color: '#5a5754',
                    border: '1px solid #e4e1db',
                    background: '#f4f2ee',
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    minHeight: 44,
                  }}
                >
                  {expanded ? (
                    <><ChevronUp className="w-4 h-4" /> Réduire</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Détails</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Rejection reason + Reapply */}
      {isRejected && (
        <div style={{ borderTop: '1px solid #fca5a5', padding: '12px 16px', background: '#fef2f2' }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2 flex-1">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#9b1c1c' }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#9b1c1c', fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: '2px' }}>
                  Non retenue
                </p>
                <p style={{ fontSize: 13, color: '#5a5754', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.5 }}>
                  Le propriétaire n'a pas retenu votre dossier.{app.rejectionReason ? ` Raison\u00a0: ${app.rejectionReason}` : ''}
                </p>
              </div>
            </div>
            {prop && (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); handleReapply() }}
                disabled={reapplying}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, cursor: reapplying ? 'not-allowed' : 'pointer',
                  background: '#ffffff', border: '1px solid #fca5a5', color: '#9b1c1c',
                  fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif",
                  opacity: reapplying ? 0.6 : 1, minHeight: 44, flexShrink: 0,
                }}
              >
                {reapplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Repostuler
              </button>
            )}
          </div>
        </div>
      )}

      {/* Withdrawn notice */}
      {isWithdrawn && (
        <div style={{ borderTop: '1px solid #ccc9c3', padding: '12px 16px', background: '#f4f2ee' }}>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#9e9b96' }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#5a5754', fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: '2px' }}>
                Retirée
              </p>
              <p style={{ fontSize: 13, color: '#5a5754', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.5 }}>
                Vous avez retiré cette candidature.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable details (non-rejected, non-withdrawn) */}
      <AnimatePresence>
        {expanded && !isWithdrawn && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid #f4f2ee', overflow: 'hidden' }}
          >
            <div className="p-4 space-y-3">
              {details.length > 0 && (
                <div>
                  <p
                    className="uppercase tracking-wide mb-2"
                    style={{ fontSize: 10, fontWeight: 500, color: '#9e9b96', letterSpacing: '0.08em' }}
                  >
                    Analyse de votre dossier
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {details.map((d: { label: string; points: number; maxPoints: number; status: string; explanation: string }) => (
                      <div
                        key={d.label}
                        className="text-xs"
                        style={
                          d.status === 'pass'    ? { background: '#fdf5ec', border: '1px solid #f3c99a', color: '#92400e', borderRadius: 8, padding: '8px 10px' } :
                          d.status === 'partial' ? { background: '#fdf5ec', border: '1px solid #e8c99a', color: '#92400e', borderRadius: 8, padding: '8px 10px' } :
                          d.status === 'fail'    ? { background: '#fef2f2', border: '1px solid #fca5a5', color: '#9b1c1c', borderRadius: 8, padding: '8px 10px' } :
                                                   { background: '#f4f2ee', border: '1px solid #ccc9c3', color: '#5a5754', borderRadius: 8, padding: '8px 10px' }
                        }
                      >
                        <div className="flex justify-between mb-0.5">
                          <span style={{ fontWeight: 600 }}>{d.label}</span>
                          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, fontWeight: 700 }}>
                            {d.points}/{d.maxPoints} pts
                          </span>
                        </div>
                        <p style={{ opacity: 0.85, lineHeight: 1.5 }}>{d.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {app.coverLetter && (
                <div>
                  <p
                    className="uppercase tracking-wide mb-1"
                    style={{ fontSize: 10, fontWeight: 500, color: '#9e9b96', letterSpacing: '0.08em' }}
                  >
                    Votre lettre de motivation
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#5a5754',
                      background: '#f8f7f4',
                      border: '1px solid #e4e1db',
                      borderRadius: 8,
                      padding: '10px 12px',
                      lineHeight: 1.6,
                    }}
                  >
                    {app.coverLetter}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MyApplications() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await applicationService.list()
      setApps(data)
    } catch {
      toast.error('Impossible de charger vos candidatures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleWithdraw(id: string) {
    setApps((prev) => prev.filter((a) => a.id !== id))
  }

  function handleReapply(updated: Application) {
    setApps((prev) => prev.map((a) => a.id === updated.id ? updated : a))
  }

  const activeApps = apps.filter(a => a.status === 'PENDING' || a.status === 'APPROVED')
  const rejectedApps = apps.filter(a => a.status === 'REJECTED')
  const withdrawnApps = apps.filter(a => a.status === 'WITHDRAWN')

  return (
    <Layout>
      <div
        className="min-h-screen px-4 py-6 lg:p-8"
        style={{ background: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Page header — responsive font size */}
          <div className="mb-8">
            <p
              className="uppercase tracking-widest mb-1"
              style={{ fontSize: 10, color: BAI.caramel, fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '0.12em' }}
            >
              Espace locataire
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: 'clamp(26px, 4vw, 40px)',
                  color: '#0d0c0a',
                  lineHeight: 1,
                }}
              >
                Mes candidatures
              </h1>
              {!loading && activeApps.length > 0 && (
                <span
                  style={{
                    background: '#fdf5ec',
                    color: '#c4976a',
                    border: '1px solid #f3c99a',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 10px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {activeApps.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 14, color: '#5a5754', marginTop: 6 }}>
              Suivez l'avancement de vos dossiers locataires.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2" style={{ color: '#9e9b96' }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span style={{ fontSize: 14 }}>Chargement…</span>
            </div>
          ) : apps.length === 0 ? (
            <div
              className="text-center py-16 px-4"
              style={{
                background: '#ffffff',
                border: '1px solid #e4e1db',
                borderRadius: 12,
                boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
              }}
            >
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                style={{ background: '#f4f2ee', borderRadius: '50%' }}
              >
                <SendHorizonal className="w-7 h-7" style={{ color: '#9e9b96' }} />
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 22,
                  fontStyle: 'italic',
                  color: '#0d0c0a',
                  marginBottom: 8,
                }}
              >
                Aucune candidature
              </p>
              <p style={{ fontSize: 13, color: '#5a5754', marginBottom: 20 }}>
                Parcourez les annonces et postulez directement depuis la fiche du bien.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  background: '#1a1a2e',
                  color: '#ffffff',
                  borderRadius: 8,
                  padding: '12px 20px',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  minHeight: 44,
                }}
              >
                Parcourir les annonces
              </Link>
            </div>
          ) : (
            <div className="space-y-6">

              {/* ── En cours ── */}
              {activeApps.length > 0 && (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {activeApps.map((app) => (
                      <AppCard key={app.id} app={app} onWithdraw={handleWithdraw} onReapply={handleReapply} />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* ── Séparateur Refusées ── */}
              {rejectedApps.length > 0 && (
                <>
                  <div className="flex items-center gap-3 pt-2">
                    <div style={{ flex: 1, height: '1px', background: '#fca5a5' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9b1c1c', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Sans', system-ui, sans-serif", whiteSpace: 'nowrap' }}>
                      Candidatures non retenues
                    </span>
                    <div style={{ flex: 1, height: '1px', background: '#fca5a5' }} />
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {rejectedApps.map((app) => (
                        <AppCard key={app.id} app={app} onWithdraw={handleWithdraw} onReapply={handleReapply} />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* ── Séparateur Retirées ── */}
              {withdrawnApps.length > 0 && (
                <>
                  <div className="flex items-center gap-3 pt-2">
                    <div style={{ flex: 1, height: '1px', background: '#ccc9c3' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9e9b96', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Sans', system-ui, sans-serif", whiteSpace: 'nowrap' }}>
                      Candidatures retirées
                    </span>
                    <div style={{ flex: 1, height: '1px', background: '#ccc9c3' }} />
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {withdrawnApps.map((app) => (
                        <AppCard key={app.id} app={app} onWithdraw={handleWithdraw} onReapply={handleReapply} />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
