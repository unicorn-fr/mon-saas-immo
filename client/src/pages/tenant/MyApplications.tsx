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
  PENDING:   { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' },
  APPROVED:  { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' },
  REJECTED:  { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  WITHDRAWN: { background: '#f5f5f7', color: '#86868b', border: '1px solid #d2d2d7' },
}

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:3000'

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${scoreBg(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums w-10 text-right ${scoreColor(score)}`}>
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
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #d2d2d7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex gap-4 p-4">
        {/* Property image */}
        {prop.images && prop.images[0] ? (
          <img
            src={`${SERVER_BASE}${prop.images[0]}`}
            alt={prop.title}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-slate-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate text-slate-900">
                {prop.title}
              </h3>
              <p className="text-xs text-slate-400">
                {prop.city} · {prop.price} €/mois
              </p>
            </div>
            <span className="text-xs rounded-full px-2 py-0.5 flex-shrink-0 font-medium"
              style={STATUS_STYLE[app.status]}>
              {STATUS_LABEL[app.status]}
            </span>
          </div>

          <div className="mt-2">
            <ScoreBar score={app.score} />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-400">
              Envoyée le {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
            </span>
            <Link
              to={`/property/${prop.id}`}
              className="text-xs text-blue-500 hover:underline flex items-center gap-0.5"
            >
              Voir le bien <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {app.status === 'APPROVED' && (
            <Link
              to={`/property/${prop.id}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: '#3b82f6' }}
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
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Retirer la candidature"
            >
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
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
            className="border-t border-slate-100 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {details.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-slate-400">
                    Analyse de votre dossier
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {details.map((d: { label: string; points: number; maxPoints: number; status: string; explanation: string }) => (
                      <div
                        key={d.label}
                        className="rounded-xl p-2.5 text-xs border"
                        style={
                          d.status === 'pass'    ? { background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669' } :
                          d.status === 'partial' ? { background: '#fffbeb', borderColor: '#fde68a', color: '#d97706' } :
                          d.status === 'fail'    ? { background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' } :
                                                   { background: '#f5f5f7', borderColor: '#d2d2d7', color: '#64748b' }
                        }
                      >
                        <div className="flex justify-between mb-0.5">
                          <span className="font-medium">{d.label}</span>
                          <span className="font-bold">{d.points}/{d.maxPoints} pts</span>
                        </div>
                        <p className="opacity-80 leading-relaxed">{d.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {app.coverLetter && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-slate-400">
                    Votre lettre de motivation
                  </p>
                  <p className="text-sm rounded-xl p-3 border border-slate-200 bg-slate-50 text-slate-600">
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
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f5f5f7' }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Mes candidatures
            </h1>
            <p className="text-sm mt-0.5 text-slate-500">
              Suivez l'avancement de vos dossiers locataires.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement…</span>
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white border border-slate-200"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}>
              <SendHorizonal className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold mb-1 text-slate-900">
                Aucune candidature pour l'instant
              </p>
              <p className="text-sm mb-4 text-slate-500">
                Parcourez les annonces et postulez directement depuis la fiche du bien.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#3b82f6' }}
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
