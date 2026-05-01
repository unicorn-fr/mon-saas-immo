/**
 * PreQualificationModal
 * Shown when a tenant clicks "Postuler" on a property listing.
 * - Shows a profile snapshot (name, employment, guarantor, docs)
 * - Lets the tenant write a cover letter and submit
 * - Guarantor info is auto-read from the dossier questionnaire (no re-ask)
 * - No score percentage shown (avoids confusion with dossier completeness %)
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, Loader2, FileText, Send,
  User, Briefcase, Shield, CheckCircle2, AlertCircle, XCircle,
} from 'lucide-react'
import { applicationService } from '../../services/application.service'
import { shareApi } from '../../services/dossier.service'
import { computeClientScore, extractTenantSnapshot } from '../../utils/matchingEngine'
import type { SelectionCriteria } from '../../types/application.types'
import { VERDICT_CONFIG } from '../../types/application.types'
import toast from 'react-hot-toast'

const OVERLAY = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
const PANEL   = { hidden: { opacity: 0, y: 40, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.97 } }

// ── Labels ─────────────────────────────────────────────────────────────────────
const EMPLOI_LABELS: Record<string, string> = {
  cdi:          'Salarié·e CDI',
  cdd_embauche: 'CDD / En cours d\'embauche',
  independant:  'Indépendant·e / Auto-entrepreneur',
  etudiant:     'Étudiant·e',
  retraite:     'Retraité·e',
  sans_emploi:  'Sans activité salariée',
}
const GARANT_LABELS: Record<string, string> = {
  oui_physique: 'Garant personnel',
  oui_visale:   'Visale / CLé',
  oui_les_deux: 'Garant personnel + Visale',
  non:          'Aucun garant',
}
const DOC_CATS = [
  { id: 'IDENTITE',  label: "Pièce d'ID" },
  { id: 'EMPLOI',    label: 'Emploi' },
  { id: 'REVENUS',   label: 'Revenus' },
  { id: 'DOMICILE',  label: 'Domicile' },
  { id: 'GARANTIES', label: 'Garant' },
]

// ── Profile snapshot card ──────────────────────────────────────────────────────
function ProfileSnapshot({
  firstName, lastName, birthDate, birthCity, nationality,
  questionnaire, docCategories,
}: {
  firstName?: string
  lastName?: string
  birthDate?: string | null
  birthCity?: string | null
  nationality?: string | null
  questionnaire: Record<string, unknown>
  docCategories: string[]
}) {
  const emploiLabel = EMPLOI_LABELS[String(questionnaire.emploiType ?? '')] ?? null
  const garantLabel = GARANT_LABELS[String(questionnaire.hasGarant ?? '')] ?? null
  const hasComplementaire = questionnaire.hasRevenuComplementaire === true

  const birthStr = (() => {
    if (!birthDate) return null
    try {
      const d = new Date(birthDate)
      return `Né·e le ${d.toLocaleDateString('fr-FR')}${birthCity ? ` à ${birthCity}` : ''}`
    } catch { return null }
  })()

  return (
    <div style={{
      borderRadius: 12, border: '1px solid #e4e1db', background: '#f8f7f4',
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#edf7f2',
          border: '1px solid #9fd4ba', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <User style={{ width: 16, height: 16, color: '#1b5e3b' }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0d0c0a', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            {firstName && lastName ? `${firstName} ${lastName.toUpperCase()}` : 'Profil incomplet'}
          </p>
          {birthStr && (
            <p style={{ margin: 0, fontSize: 11, color: '#9e9b96', fontFamily: 'DM Sans, system-ui, sans-serif', marginTop: 1 }}>
              {birthStr}{nationality ? ` · ${nationality}` : ''}
            </p>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: '#e4e1db' }} />

      {/* Employment + guarantor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {emploiLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase style={{ width: 13, height: 13, color: '#5a5754', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#5a5754', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
              {emploiLabel}
              {hasComplementaire && <span style={{ marginLeft: 6, color: '#9e9b96' }}>+ revenu salarié</span>}
            </span>
          </div>
        )}
        {garantLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 13, height: 13, color: '#5a5754', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#5a5754', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
              {garantLabel}
            </span>
          </div>
        )}
      </div>

      {/* Document status */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DOC_CATS.map(cat => {
          const present = docCategories.includes(cat.id)
          return (
            <span key={cat.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontFamily: 'DM Sans, system-ui, sans-serif', fontWeight: 500,
              padding: '3px 8px', borderRadius: 20,
              background: present ? '#edf7f2' : '#fef2f2',
              color: present ? '#1b5e3b' : '#9b1c1c',
              border: `1px solid ${present ? '#9fd4ba' : '#fca5a5'}`,
            }}>
              {present
                ? <CheckCircle2 style={{ width: 10, height: 10 }} />
                : <XCircle style={{ width: 10, height: 10 }} />
              }
              {cat.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  propertyId: string
  propertyTitle: string
  propertyPrice: number
  criteria: SelectionCriteria
  tenantProfileMeta: Record<string, unknown> | null
  tenantDocCategories: string[]
  tenantFirstName?: string
  tenantLastName?: string
  tenantBirthDate?: string | null
  tenantBirthCity?: string | null
  tenantNationality?: string | null
  ownerId?: string
  onClose: () => void
  onSuccess: () => void
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export function PreQualificationModal({
  propertyId, propertyTitle, propertyPrice, criteria,
  tenantProfileMeta, tenantDocCategories,
  tenantFirstName, tenantLastName, tenantBirthDate, tenantBirthCity, tenantNationality,
  ownerId, onClose, onSuccess,
}: Props) {
  const [phase, setPhase] = useState<'check' | 'apply' | 'submitting'>('check')
  const [coverLetter, setCoverLetter] = useState('')

  // Read questionnaire from dossier (no UI re-ask)
  const questionnaire = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('dossier_questionnaire_v1') ?? '{}') as Record<string, unknown> }
    catch { return {} as Record<string, unknown> }
  }, [])

  // Derive guarantor info from dossier questionnaire (no UI toggle)
  const hasGuarantor = useMemo(() => {
    const g = String(questionnaire.hasGarant ?? '')
    if (g === 'oui_physique' || g === 'oui_visale' || g === 'oui_les_deux') return true
    return tenantDocCategories.includes('GARANTIES')
  }, [questionnaire, tenantDocCategories])

  const guarantorType = useMemo(() => {
    const g = String(questionnaire.hasGarant ?? '')
    if (g === 'oui_physique' || g === 'oui_les_deux') return 'physique'
    if (g === 'oui_visale') return 'visale'
    return ''
  }, [questionnaire])

  // Verdict — only used for can-apply check, score NOT displayed
  const verdict = useMemo(() => {
    const snapshot = extractTenantSnapshot(tenantProfileMeta, tenantDocCategories, hasGuarantor, guarantorType || undefined)
    return computeClientScore(propertyPrice, criteria, snapshot).verdict
  }, [tenantProfileMeta, tenantDocCategories, hasGuarantor, guarantorType, propertyPrice, criteria])

  const verdictConfig = VERDICT_CONFIG[verdict]
  const canApply = verdict !== 'INELIGIBLE'

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
      const raw = err instanceof Error ? err.message : "Erreur lors de l'envoi."
      if (raw.includes('dossier locatif est incomplet') || raw.includes('DOSSIER_INCOMPLET')) {
        toast.error('Dossier incomplet — complétez votre dossier avant de postuler', { duration: 6000 })
        onClose()
        window.location.href = '/dossier'
        return
      }
      toast.error(raw)
      setPhase('apply')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        variants={OVERLAY}
        initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          key="panel"
          variants={PANEL}
          initial="hidden" animate="visible" exit="exit"
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col"
          style={{ background: '#ffffff', maxHeight: 'calc(100dvh - 32px)' }}
        >
          {/* Header — flex-shrink-0 so it never gets squeezed */}
          <div className="flex-shrink-0 flex items-start justify-between p-5 border-b" style={{ borderColor: '#e4e1db', background: '#ffffff' }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: '#0d0c0a', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                Postuler · {propertyTitle}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#9e9b96', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                Loyer {propertyPrice} €/mois
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f4f2ee')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <X className="w-4 h-4" style={{ color: '#9e9b96' }} />
            </button>
          </div>

          {/* Scrollable body — flex-1 + min-h-0 ensures correct scroll within flex parent */}
          <div
            className="flex-1 overflow-y-auto min-h-0 rounded-b-2xl"
            // overscroll-contain: prevent scroll chaining that resets position
            // WebkitOverflowScrolling: smooth momentum scroll on iOS
            style={{ overscrollBehavior: 'contain' }}
          >

            {/* Verdict banner */}
            <div className={`flex items-center gap-3 px-5 py-3 border-b ${verdictConfig.bg}`} style={{ borderColor: '#e4e1db' }}>
              {verdict === 'ELIGIBLE'   && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />}
              {verdict === 'PARTIAL'    && <AlertCircle  className="w-4 h-4 flex-shrink-0 text-amber-600" />}
              {verdict === 'INELIGIBLE' && <XCircle      className="w-4 h-4 flex-shrink-0 text-red-600" />}
              <p className={`text-sm font-medium ${verdictConfig.color}`} style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                {verdict === 'ELIGIBLE'   && 'Votre dossier correspond aux critères — vous pouvez postuler.'}
                {verdict === 'PARTIAL'    && 'Dossier en cours de complétude — vous pouvez néanmoins postuler.'}
                {verdict === 'INELIGIBLE' && 'Votre dossier ne satisfait pas les critères minimaux de ce bien.'}
              </p>
            </div>

            {/* Phase: check */}
            {phase === 'check' && (
              <div className="p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9b96', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  Votre profil
                </p>

                <ProfileSnapshot
                  firstName={tenantFirstName}
                  lastName={tenantLastName}
                  birthDate={tenantBirthDate}
                  birthCity={tenantBirthCity}
                  nationality={tenantNationality}
                  questionnaire={questionnaire}
                  docCategories={tenantDocCategories}
                />

                {/* CTA */}
                {canApply ? (
                  <button
                    onClick={() => setPhase('apply')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow transition-colors"
                    style={{ background: '#1a1a2e', fontFamily: 'DM Sans, system-ui, sans-serif' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#122458')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1a1a2e')}
                  >
                    Rédiger ma lettre de motivation <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="rounded-xl p-4 text-sm" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#9b1c1c', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                    <strong>Dossier non éligible.</strong> Complétez votre dossier locatif pour ce type de bien.{' '}
                    <a href="/dossier" style={{ color: '#9b1c1c', fontWeight: 700, textDecoration: 'underline' }}>Accéder au dossier →</a>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ borderColor: '#e4e1db', color: '#5a5754', fontFamily: 'DM Sans, system-ui, sans-serif' }}
                >
                  Annuler
                </button>
              </div>
            )}

            {/* Phase: apply / submitting */}
            {(phase === 'apply' || phase === 'submitting') && (
              <div className="p-5 space-y-4">
                <button
                  onClick={() => setPhase('check')}
                  className="text-xs hover:underline flex items-center gap-1"
                  style={{ color: '#1a1a2e', fontFamily: 'DM Sans, system-ui, sans-serif' }}
                >
                  ← Retour au profil
                </button>

                {/* Mini summary */}
                <div style={{
                  borderRadius: 10, border: '1px solid #e4e1db', background: '#f8f7f4',
                  padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <User style={{ width: 14, height: 14, color: '#9e9b96', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 12, color: '#5a5754', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                    <strong style={{ color: '#0d0c0a' }}>
                      {tenantFirstName && tenantLastName ? `${tenantFirstName} ${tenantLastName.toUpperCase()}` : 'Locataire'}
                    </strong>
                    {!!questionnaire.emploiType && (
                      <span style={{ marginLeft: 8, color: '#9e9b96' }}>
                        · {EMPLOI_LABELS[String(questionnaire.emploiType)] ?? ''}
                      </span>
                    )}
                    {hasGuarantor && (
                      <span style={{ marginLeft: 8, color: '#9e9b96' }}>
                        · {GARANT_LABELS[String(questionnaire.hasGarant)] ?? 'Avec garant'}
                      </span>
                    )}
                  </p>
                </div>

                {/* Cover letter */}
                <div>
                  <label
                    className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
                    style={{ color: '#0d0c0a', fontFamily: 'DM Sans, system-ui, sans-serif' }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Lettre de motivation
                    <span className="text-xs font-normal" style={{ color: '#9e9b96' }}>(optionnel)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Présentez-vous brièvement et expliquez votre projet de location…"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ background: '#f8f7f4', borderColor: '#e4e1db', color: '#0d0c0a', fontFamily: 'DM Sans, system-ui, sans-serif' }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={phase === 'submitting'}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow transition-colors disabled:opacity-60"
                    style={{ background: '#1a1a2e', fontFamily: 'DM Sans, system-ui, sans-serif' }}
                    onMouseEnter={e => { if (phase !== 'submitting') e.currentTarget.style.background = '#122458' }}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1a1a2e')}
                  >
                    {phase === 'submitting'
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
                      : <><Send className="w-4 h-4" /> Envoyer ma candidature</>
                    }
                  </button>
                  <button
                    onClick={onClose}
                    disabled={phase === 'submitting'}
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-70 disabled:opacity-50"
                    style={{ borderColor: '#e4e1db', color: '#5a5754', fontFamily: 'DM Sans, system-ui, sans-serif' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
