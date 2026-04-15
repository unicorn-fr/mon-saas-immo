/**
 * MyApplications — Tenant view of all submitted candidatures.
 * Shows score, verdict, status, and allows withdrawal.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Calendar, Loader2,
  Trash2, ChevronDown, ChevronUp, ArrowUpRight, SendHorizonal,
} from 'lucide-react'
import { applicationService } from '../../services/application.service'
import { scoreColor, scoreBg } from '../../utils/matchingEngine'
import type { Application, ApplicationStatus } from '../../types/application.types'
import { Layout } from '../../components/layout/Layout'
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
  APPROVED:  { background: '#edf7f2', color: '#1b5e3b', border: '1px solid #9fd4ba' },
  REJECTED:  { background: '#fef2f2', color: '#9b1c1c', border: '1px solid #fca5a5' },
  WITHDRAWN: { background: '#f4f2ee', color: '#9e9b96', border: '1px solid #ccc9c3' },
}

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:5000'

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 overflow-hidden"
        style={{ background: '#f4f2ee', borderRadius: 99 }}
      >
        <div
          className={`h-1.5 transition-all duration-700 ${scoreBg(score)}`}
          style={{ width: `${score}%`, borderRadius: 99 }}
        />
      </div>
      <span
        className={`text-xs font-bold tabular-nums w-10 text-right ${scoreColor(score)}`}
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14 }}
      >
        {score}/100
      </span>
    </div>
  )
}

function AppCard({ app, onWithdraw }: { app: Application; onWithdraw: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const prop = app.property!

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

  const details = app.matchDetails ? Object.values(app.matchDetails) : []

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
      }}
    >
      <div className="flex gap-4 p-4">
        {/* Property image */}
        {prop.images && prop.images[0] ? (
          <img
            src={`${SERVER_BASE}${prop.images[0]}`}
            alt={prop.title}
            className="w-16 h-16 flex-shrink-0 object-cover"
            style={{ borderRadius: 8 }}
          />
        ) : (
          <div
            className="w-16 h-16 flex items-center justify-center flex-shrink-0"
            style={{ background: '#f4f2ee', borderRadius: 8 }}
          >
            <Building2 className="w-6 h-6" style={{ color: '#9e9b96' }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
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
                padding: '2px 10px',
                whiteSpace: 'nowrap',
              }}
            >
              {STATUS_LABEL[app.status]}
            </span>
          </div>

          <div className="mt-2">
            <ScoreBar score={app.score} />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span style={{ fontSize: 11, color: '#9e9b96' }}>
              Envoyée le {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
            </span>
            <Link
              to={`/property/${prop.id}`}
              className="flex items-center gap-0.5 transition-opacity hover:opacity-70"
              style={{ fontSize: 11, color: '#1b5e3b', fontWeight: 500 }}
            >
              Voir le bien <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {app.status === 'APPROVED' && (
            <Link
              to={`/property/${prop.id}`}
              className="mt-2 inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
              style={{
                background: '#1b5e3b',
                color: '#ffffff',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
              Réserver une visite
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {app.status === 'PENDING' && (
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              title="Retirer la candidature"
              className="p-1.5 transition-colors disabled:opacity-50"
              style={{ borderRadius: 6, color: '#9b1c1c' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {withdrawing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 transition-colors"
            style={{ borderRadius: 6, color: '#9e9b96' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f4f2ee' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
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
                          d.status === 'pass'    ? { background: '#edf7f2', border: '1px solid #9fd4ba', color: '#1b5e3b', borderRadius: 8, padding: '8px 10px' } :
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
      setApps(data.filter((a) => a.status !== 'WITHDRAWN'))
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

  return (
    <Layout>
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <p
              className="uppercase tracking-widest mb-1"
              style={{ fontSize: 10, color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '0.12em' }}
            >
              Espace locataire
            </p>
            <div className="flex items-baseline gap-3">
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: 40,
                  color: '#0d0c0a',
                  lineHeight: 1,
                }}
              >
                Mes candidatures
              </h1>
              {!loading && apps.length > 0 && (
                <span
                  style={{
                    background: '#edf7f2',
                    color: '#1b5e3b',
                    border: '1px solid #9fd4ba',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 10px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {apps.length}
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
              className="text-center py-16"
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
                  background: '#1b5e3b',
                  color: '#ffffff',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                Parcourir les annonces
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} onWithdraw={handleWithdraw} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
