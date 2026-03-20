/**
 * PreQualificationModal
 * Shown when a tenant clicks "Postuler" on a property listing.
 * 1. Computes an instant client-side score
 * 2. Shows the verdict + per-criterion breakdown
 * 3. Lets the tenant add a cover letter + guarantor info, then submit
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, AlertTriangle, XCircle, ChevronRight,
  Loader2, FileText, Users, Send,
} from 'lucide-react'
import { applicationService } from '../../services/application.service'
import { shareApi } from '../../services/dossierService'
import { computeClientScore, extractTenantSnapshot, scoreColor } from '../../utils/matchingEngine'
import type { SelectionCriteria, MatchResult, MatchDetail } from '../../types/application.types'
import { VERDICT_CONFIG, GUARANTOR_TYPES } from '../../types/application.types'
import toast from 'react-hot-toast'

const OVERLAY = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
const PANEL   = { hidden: { opacity: 0, y: 40, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.97 } }

interface Props {
  propertyId: string
  propertyTitle: string
  propertyPrice: number
  criteria: SelectionCriteria
  tenantProfileMeta: Record<string, unknown> | null
  tenantDocCategories: string[]
  ownerId?: string
  onClose: () => void
  onSuccess: () => void
}

function DetailRow({ detail }: { detail: MatchDetail }) {
  const colors = {
    pass:    'text-emerald-600 bg-emerald-50 border-emerald-200',
    partial: 'text-amber-600   bg-amber-50   border-amber-200',
    fail:    'text-red-600     bg-red-50     border-red-200',
    na:      'text-slate-500   bg-slate-50   border-slate-200',
  }
  const icons = {
    pass:    <CheckCircle2 className="w-4 h-4" />,
    partial: <AlertTriangle className="w-4 h-4" />,
    fail:    <XCircle className="w-4 h-4" />,
    na:      <span className="w-4 h-4 inline-flex items-center justify-center text-xs font-bold">?</span>,
  }
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${colors[detail.status]}`}>
      <div className="mt-0.5 flex-shrink-0">{icons[detail.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{detail.label}</span>
          <span className="text-xs font-semibold tabular-nums">
            {detail.points}/{detail.maxPoints} pts
          </span>
        </div>
        <p className="text-xs mt-0.5 opacity-80">{detail.explanation}</p>
      </div>
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const radius = 38
  const circ   = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} strokeWidth="8" className="stroke-slate-100 fill-none" />
        <circle
          cx="50" cy="50" r={radius} strokeWidth="8" className="fill-none transition-all duration-700"
          style={{
            stroke: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444',
            strokeDasharray: circ,
            strokeDashoffset: offset,
            strokeLinecap: 'round',
          }}
        />
      </svg>
      <span className={`absolute text-xl font-bold tabular-nums ${scoreColor(score)}`}>
        {score}
      </span>
    </div>
  )
}

export function PreQualificationModal({
  propertyId, propertyTitle, propertyPrice, criteria,
  tenantProfileMeta, tenantDocCategories, ownerId, onClose, onSuccess,
}: Props) {
  const [phase, setPhase] = useState<'check' | 'apply' | 'submitting'>('check')
  const [hasGuarantor, setHasGuarantor] = useState(false)
  const [guarantorType, setGuarantorType] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [match, setMatch] = useState<MatchResult | null>(null)

  // Compute client-side score instantly
  useEffect(() => {
    const snapshot = extractTenantSnapshot(tenantProfileMeta, tenantDocCategories, hasGuarantor, guarantorType || undefined)
    const result = computeClientScore(propertyPrice, criteria, snapshot)
    setMatch(result)
  }, [hasGuarantor, guarantorType, tenantProfileMeta, tenantDocCategories, propertyPrice, criteria])

  async function handleSubmit() {
    setPhase('submitting')
    try {
      await applicationService.create({
        propertyId,
        coverLetter: coverLetter.trim() || undefined,
        hasGuarantor,
        guarantorType: guarantorType || undefined,
      })
      toast.success('Candidature envoyée !')
      if (ownerId) {
        shareApi.grantShare(ownerId, propertyId, 30).catch(() => {})
      }
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi.'
      toast.error(msg)
      setPhase('apply')
    }
  }

  if (!match) return null

  const verdict = VERDICT_CONFIG[match.verdict]
  const minScore = criteria.minScore ?? 70
  const canApply = match.verdict !== 'INELIGIBLE'

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        variants={OVERLAY}
        initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          key="panel"
          variants={PANEL}
          initial="hidden" animate="visible" exit="exit"
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--bg-primary)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Postuler · {propertyTitle}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Loyer {propertyPrice} €/mois · Score minimum requis : {minScore}/100
              </p>
            </div>
            <button onClick={onClose} className="ml-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Score section */}
            <div className={`flex items-center gap-4 p-5 border-b ${verdict.bg} ${verdict.border} border`} style={{ borderTopWidth: 0, borderLeft: 0, borderRight: 0 }}>
              <ScoreRing score={match.score} />
              <div>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${verdict.bg} ${verdict.color} ${verdict.border} border mb-1.5`}>
                  {verdict.label}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {match.verdict === 'ELIGIBLE' && 'Votre dossier remplit les critères du propriétaire.'}
                  {match.verdict === 'PARTIAL'   && 'Dossier incomplet — vous pouvez tout de même postuler.'}
                  {match.verdict === 'INELIGIBLE' && 'Votre dossier ne satisfait pas les critères minimaux.'}
                </p>
              </div>
            </div>

            {/* Check phase */}
            {phase === 'check' && (
              <div className="p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Détail du score
                </p>
                {Object.values(match.details).map((d) => (
                  <DetailRow key={d.label} detail={d} />
                ))}

                {/* Guarantor toggle (impacts score live) */}
                <div className="rounded-xl border p-3 mt-1" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={hasGuarantor}
                      onChange={(e) => setHasGuarantor(e.target.checked)}
                      className="rounded accent-violet-600"
                    />
                    <Users className="w-3.5 h-3.5" />
                    J'ai un garant
                  </label>
                  {hasGuarantor && (
                    <div className="mt-2 ml-6">
                      <select
                        value={guarantorType}
                        onChange={(e) => setGuarantorType(e.target.value)}
                        className="w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      >
                        <option value="">— Type de garant —</option>
                        {GUARANTOR_TYPES.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="flex gap-2 pt-1">
                  {match.verdict === 'INELIGIBLE' ? (
                    <div className="w-full rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                      <strong>Dossier non éligible.</strong> Complétez votre dossier ou ajoutez un garant pour augmenter votre score.
                    </div>
                  ) : (
                    <button
                      onClick={() => setPhase('apply')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1a1a2e] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#122458] transition-colors"
                    >
                      Continuer ma candidature <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-70"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Apply phase */}
            {(phase === 'apply' || phase === 'submitting') && (
              <div className="p-5 space-y-4">
                <button
                  onClick={() => setPhase('check')}
                  className="text-xs text-[#1a1a2e] hover:underline flex items-center gap-1"
                >
                  ← Retour au score
                </button>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    <FileText className="w-3.5 h-3.5" />
                    Lettre de motivation
                    <span className="text-xs font-normal text-slate-400">(optionnel)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Présentez-vous brièvement et expliquez votre projet de location..."
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSubmit}
                    disabled={phase === 'submitting'}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1a1a2e] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#122458] disabled:opacity-60 transition-colors"
                  >
                    {phase === 'submitting'
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</>
                      : <><Send className="w-4 h-4" /> Envoyer ma candidature</>
                    }
                  </button>
                  <button
                    onClick={onClose}
                    disabled={phase === 'submitting'}
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-70 disabled:opacity-50"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    Annuler
                  </button>
                </div>

                <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Score estimé : <span className={`font-semibold ${scoreColor(match.score)}`}>{match.score}/100</span>
                  {!canApply && ' — le score final est calculé côté serveur.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
