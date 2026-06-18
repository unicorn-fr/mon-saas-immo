/**
 * FiscalWizard.tsx
 * Assistant fiscal immobilier français — wizard multi-étapes.
 * Génère les formulaires fiscaux pré-remplis pour la déclaration de l'année N-1.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PremiumGate } from '../../components/billing/PremiumGate'
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  Download,
  CheckCircle,
  Home,
  Building2,
  Users,
  Layers,
  Loader2,
  Info,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { WizardAnswers, calculateFiscal, computeResult } from '../../utils/fiscalCalculator'
import { RESULT_CONFIGS } from '../../data/fiscalWizardConfig'
import { apiClient } from '../../services/api.service'

// ─── Step IDs ─────────────────────────────────────────────────────────────────

type StepId =
  | 'holding'
  | 'location-type'
  | 'sci-regime'
  | 'demembrement-role'
  | 'nu-revenus'
  | 'nu-charges'
  | 'meuble-recettes'
  | 'meuble-charges'
  | 'sci-ir-details'
  | 'sci-is-details'
  | 'indivision-details'
  | 'result'

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: `1px solid ${BAI.border}`,
  borderRadius: 8,
  fontFamily: BAI.fontBody,
  fontSize: 14,
  color: BAI.ink,
  background: BAI.bgInput,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontFamily: BAI.fontBody,
  fontSize: 13,
  fontWeight: 600,
  color: BAI.inkMid,
  display: 'block',
  marginBottom: 6,
}

// ─── Option card ──────────────────────────────────────────────────────────────

interface OptionCardProps {
  icon?: React.ReactNode
  title: string
  description: string
  selected: boolean
  onClick: () => void
  fullWidth?: boolean
}

function OptionCard({ icon, title, description, selected, onClick, fullWidth }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? BAI.caramelLight : BAI.bgSurface,
        border: `${selected ? 2 : 1}px solid ${selected ? BAI.caramel : BAI.border}`,
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        transition: BAI.transition,
        minHeight: 44,
      }}
    >
      {icon && (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: selected ? `${BAI.caramel}22` : BAI.bgMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: selected ? BAI.caramel : BAI.inkMid,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
      <div>
        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 15,
            fontWeight: 600,
            color: selected ? BAI.caramel : BAI.ink,
            margin: 0,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 12,
            color: BAI.inkFaint,
            margin: '3px 0 0',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </button>
  )
}

// ─── Step question header ─────────────────────────────────────────────────────

function QuestionHeader({ question, hint }: { question: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontFamily: BAI.fontDisplay,
          fontSize: 'clamp(20px, 3vw, 26px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: BAI.ink,
          margin: 0,
        }}
      >
        {question}
      </h2>
      {hint && (
        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 13,
            color: BAI.inkMid,
            margin: '6px 0 0',
            lineHeight: 1.6,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

// ─── Number input row ─────────────────────────────────────────────────────────

interface NumInputProps {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
  hint?: string
}

function NumInput({ label, value, onChange, placeholder = '0', hint }: NumInputProps) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          min={0}
          value={value ?? ''}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            onChange(isNaN(n) ? undefined : n)
          }}
          placeholder={placeholder}
          style={inputStyle}
        />
        <span
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: BAI.fontBody,
            fontSize: 13,
            color: BAI.inkFaint,
            pointerEvents: 'none',
          }}
        >
          €
        </span>
      </div>
      {hint && (
        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '4px 0 0' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ─── Info banner ──────────────────────────────────────────────────────────────

function InfoBanner({ message, variant = 'info' }: { message: string; variant?: 'info' | 'warning' | 'success' }) {
  const colors = {
    info:    { bg: BAI.infoLight,    border: BAI.ownerBorder, text: BAI.owner,   icon: Info },
    warning: { bg: BAI.warningLight, border: BAI.caramelBorder, text: BAI.warning, icon: AlertTriangle },
    success: { bg: BAI.successLight, border: BAI.tenantBorder, text: BAI.tenant,  icon: CheckCircle },
  }[variant]
  const Icon = colors.icon

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        marginBottom: 20,
      }}
    >
      <Icon size={16} style={{ color: colors.text, flexShrink: 0, marginTop: 2 }} />
      <p
        style={{
          fontFamily: BAI.fontBody,
          fontSize: 13,
          color: colors.text,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
    </div>
  )
}

// ─── Navigation step logic ────────────────────────────────────────────────────

// ─── Prefill types ────────────────────────────────────────────────────────────

interface PrefillData {
  prefill: Partial<WizardAnswers>
  properties: Array<{ id: string; title: string; address: string; furnished: boolean; monthlyRent: number }>
  mixed: boolean
  year: number
  dataQuality: { hasPayments: boolean; hasExpenses: boolean; hasLoans: boolean }
}

function getNextStep(stepId: StepId, answers: Partial<WizardAnswers>): StepId {
  switch (stepId) {
    case 'holding':
      if (answers.holdingMode === 'SCI') return 'sci-regime'
      if (answers.holdingMode === 'INDIVISION') return 'indivision-details'
      if (answers.holdingMode === 'DEMEMBREMENT') return 'demembrement-role'
      // Skip location-type if already known from DB (all properties same type)
      if (answers.locationType) {
        return answers.locationType === 'MEUBLE' ? 'meuble-recettes' : 'nu-revenus'
      }
      return 'location-type'

    case 'location-type':
      return answers.locationType === 'MEUBLE' ? 'meuble-recettes' : 'nu-revenus'

    case 'nu-revenus': {
      const opte = answers.opteRegimeReel
      const bruts = answers.loyersBruts ?? 0
      return bruts >= 15000 || opte ? 'nu-charges' : 'result'
    }

    case 'nu-charges':
      return 'result'

    case 'meuble-recettes': {
      const recettes = answers.recettesMeublees ?? 0
      const revenus = answers.revenusTotauxProfessionnels ?? 0
      const isLMP = recettes > 23000 && recettes > revenus * 0.5
      if (isLMP || answers.regimeMeuble === 'REEL') return 'meuble-charges'
      return 'result'
    }

    case 'meuble-charges':
      return 'result'

    case 'sci-regime':
      return answers.sciRegime === 'IS' ? 'sci-is-details' : 'sci-ir-details'

    case 'sci-ir-details':
      return 'result'

    case 'sci-is-details':
      return 'result'

    case 'demembrement-role':
      return 'result'

    case 'indivision-details':
      return 'result'

    default:
      return 'result'
  }
}

function getPrevStep(stepId: StepId, answers: Partial<WizardAnswers>): StepId {
  switch (stepId) {
    case 'location-type':
      return 'holding'

    case 'sci-regime':
      return 'holding'

    case 'demembrement-role':
      return 'holding'

    case 'indivision-details':
      return 'holding'

    case 'nu-revenus':
      return 'location-type'

    case 'nu-charges':
      return 'nu-revenus'

    case 'meuble-recettes':
      return 'location-type'

    case 'meuble-charges':
      return 'meuble-recettes'

    case 'sci-ir-details':
      return 'sci-regime'

    case 'sci-is-details':
      return 'sci-regime'

    case 'result': {
      const { holdingMode, locationType, sciRegime } = answers
      if (holdingMode === 'DEMEMBREMENT') return 'demembrement-role'
      if (holdingMode === 'INDIVISION') return 'indivision-details'
      if (holdingMode === 'SCI') return sciRegime === 'IS' ? 'sci-is-details' : 'sci-ir-details'
      if (locationType === 'MEUBLE') {
        const recettes = answers.recettesMeublees ?? 0
        const revenus = answers.revenusTotauxProfessionnels ?? 0
        const isLMP = recettes > 23000 && recettes > revenus * 0.5
        return isLMP || answers.regimeMeuble === 'REEL' ? 'meuble-charges' : 'meuble-recettes'
      }
      const bruts = answers.loyersBruts ?? 0
      return bruts >= 15000 || answers.opteRegimeReel ? 'nu-charges' : 'nu-revenus'
    }

    default:
      return 'holding'
  }
}

function getStepNumber(stepId: StepId, answers: Partial<WizardAnswers>): number {
  // Walk from 'holding' to current step
  let current: StepId = 'holding'
  let count = 1
  while (current !== stepId && current !== 'result') {
    current = getNextStep(current, answers)
    count++
  }
  return count
}

function getTotalSteps(answers: Partial<WizardAnswers>): number {
  let current: StepId = 'holding'
  let count = 1
  while (current !== 'result') {
    current = getNextStep(current, answers)
    count++
  }
  return count
}

// ─── Format currency ──────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FiscalWizard() {
  const navigate = useNavigate()
  const [stepId, setStepId] = useState<StepId>('holding')
  const [answers, setAnswers] = useState<Partial<WizardAnswers>>({})
  const [downloading, setDownloading] = useState(false)
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null)
  const [_prefillLoading, setPrefillLoading] = useState(true)

  const currentYear = new Date().getFullYear()
  const fiscalYear = currentYear - 1

  // ── Load prefill from Bailio DB ─────────────────────────────────────────────
  useEffect(() => {
    apiClient.get(`/finances/wizard-prefill?year=${fiscalYear}`)
      .then(({ data }) => {
        const pd: PrefillData = data.data
        setPrefillData(pd)
        // Pre-populate answers with everything we already know
        setAnswers((prev) => ({ ...prev, ...pd.prefill }))
      })
      .catch(() => { /* non-blocking — wizard still works without prefill */ })
      .finally(() => setPrefillLoading(false))
  }, [fiscalYear])

  const stepNumber = getStepNumber(stepId, answers)
  const totalSteps = getTotalSteps(answers)
  const progress = (stepNumber / totalSteps) * 100

  function patch(partial: Partial<WizardAnswers>) {
    setAnswers((prev) => ({ ...prev, ...partial }))
  }

  function goNext() {
    setStepId(getNextStep(stepId, answers))
  }

  function goBack() {
    if (stepId === 'holding') {
      navigate(-1)
    } else {
      setStepId(getPrevStep(stepId, answers))
    }
  }

  // ── PDF download ────────────────────────────────────────────────────────────

  async function handleDownloadPDF() {
    const completeAnswers = answers as WizardAnswers
    const calc = calculateFiscal(completeAnswers, fiscalYear)
    const result = computeResult(completeAnswers)
    const config = RESULT_CONFIGS[result]
    setDownloading(true)
    try {
      const { data } = await apiClient.post(
        '/finances/fiscal-wizard-pdf',
        {
          year: fiscalYear,
          calculation: calc,
          regime: config.regime,
          forms: config.forms,
        },
        { responseType: 'blob' },
      )
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-fiscal-${fiscalYear}-${result.toLowerCase()}-bailio.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore — PDF generation might not be available yet
    } finally {
      setDownloading(false)
    }
  }

  // ── Render steps ─────────────────────────────────────────────────────────────

  function renderStep() {
    switch (stepId) {

      // ── Step 1: Holding mode ──────────────────────────────────────────────
      case 'holding':
        return (
          <div>
            <QuestionHeader
              question="Comment détenez-vous votre bien ?"
              hint="Votre régime fiscal dépend avant tout du cadre juridique de détention."
            />

            {/* Prefill banner — shows detected properties */}
            {prefillData && prefillData.properties.length > 0 && (
              <div style={{
                background: '#f0f7ff', border: '1px solid #b8ccf0',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <Sparkles size={16} style={{ color: BAI.owner, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.owner, margin: '0 0 4px' }}>
                    {prefillData.properties.length} bien{prefillData.properties.length > 1 ? 's' : ''} détecté{prefillData.properties.length > 1 ? 's' : ''} sur Bailio
                  </p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: 0 }}>
                    {prefillData.properties.map(p => `${p.title} (${p.furnished ? 'meublé' : 'nu'})`).join(' · ')}
                    {prefillData.dataQuality.hasPayments && ` · ${fmt(answers.loyersBruts ?? 0)} de loyers ${fiscalYear}`}
                  </p>
                  {prefillData.mixed && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.caramel, margin: '4px 0 0', fontStyle: 'italic' }}>
                      Biens mixtes (meublé + nu) — vous pourrez préciser le type à l'étape suivante.
                    </p>
                  )}
                  {prefillData.prefill.locationType && !prefillData.mixed && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.tenant, margin: '4px 0 0' }}>
                      ✓ Type de location détecté automatiquement ({prefillData.prefill.locationType === 'MEUBLE' ? 'meublé' : 'vide'}) — l'étape suivante sera pré-remplie.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              <OptionCard
                icon={<Home size={20} />}
                title="En nom propre"
                description="Propriétaire direct, particulier"
                selected={answers.holdingMode === 'NOM_PROPRE'}
                onClick={() => {
                  const newAnswers = { ...answers, holdingMode: 'NOM_PROPRE' as const }
                  setAnswers(newAnswers)
                  setTimeout(() => setStepId(getNextStep('holding', newAnswers)), 120)
                }}
              />
              <OptionCard
                icon={<Building2 size={20} />}
                title="Via une SCI"
                description="Société Civile Immobilière"
                selected={answers.holdingMode === 'SCI'}
                onClick={() => {
                  patch({ holdingMode: 'SCI' })
                  setTimeout(() => setStepId('sci-regime'), 120)
                }}
              />
              <OptionCard
                icon={<Users size={20} />}
                title="En indivision"
                description="Co-propriétaires sans société"
                selected={answers.holdingMode === 'INDIVISION'}
                onClick={() => {
                  patch({ holdingMode: 'INDIVISION' })
                  setTimeout(() => setStepId('indivision-details'), 120)
                }}
              />
              <OptionCard
                icon={<Layers size={20} />}
                title="Démembrement"
                description="Usufruit / Nue-propriété"
                selected={answers.holdingMode === 'DEMEMBREMENT'}
                onClick={() => {
                  patch({ holdingMode: 'DEMEMBREMENT' })
                  setTimeout(() => setStepId('demembrement-role'), 120)
                }}
              />
            </div>
          </div>
        )

      // ── Step 2a: Location type (NOM_PROPRE) ───────────────────────────────
      case 'location-type':
        return (
          <div>
            <QuestionHeader
              question="Louez-vous vide ou meublé ?"
              hint="La fiscalité est radicalement différente selon le type de location."
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <OptionCard
                title="Location nue (vide)"
                description="Bail nu 3 ans — Revenus fonciers"
                selected={answers.locationType === 'NU'}
                onClick={() => {
                  patch({ locationType: 'NU' })
                  setTimeout(() => setStepId('nu-revenus'), 120)
                }}
              />
              <OptionCard
                title="Location meublée"
                description="LMNP / LMP — Revenus BIC"
                selected={answers.locationType === 'MEUBLE'}
                onClick={() => {
                  patch({ locationType: 'MEUBLE' })
                  setTimeout(() => setStepId('meuble-recettes'), 120)
                }}
              />
            </div>
          </div>
        )

      // ── Step 2b: SCI regime ───────────────────────────────────────────────
      case 'sci-regime':
        return (
          <div>
            <QuestionHeader
              question="Quel est le régime fiscal de votre SCI ?"
              hint="Le régime fiscal de la SCI détermine comment vous déclarez vos revenus."
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <OptionCard
                title="SCI à l'IR"
                description="Régime par défaut — revenus fonciers transparents"
                selected={answers.sciRegime === 'IR'}
                onClick={() => {
                  patch({ sciRegime: 'IR' })
                  setTimeout(() => setStepId('sci-ir-details'), 120)
                }}
              />
              <OptionCard
                title="SCI à l'IS"
                description="Impôt sur les sociétés — amortissements possibles"
                selected={answers.sciRegime === 'IS'}
                onClick={() => {
                  patch({ sciRegime: 'IS' })
                  setTimeout(() => setStepId('sci-is-details'), 120)
                }}
              />
            </div>
          </div>
        )

      // ── Step 2c: Démembrement role ────────────────────────────────────────
      case 'demembrement-role':
        return (
          <div>
            <QuestionHeader
              question="Quel est votre rôle dans le démembrement ?"
              hint="L'obligation de déclarer les revenus fonciers dépend de votre qualité."
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <OptionCard
                title="Usufruitier"
                description="Vous percevez les loyers"
                selected={answers.demembrementRole === 'USUFRUITIER'}
                onClick={() => {
                  patch({ demembrementRole: 'USUFRUITIER' })
                  setTimeout(() => setStepId('result'), 120)
                }}
              />
              <OptionCard
                title="Nu-propriétaire"
                description="Vous ne percevez pas les loyers"
                selected={answers.demembrementRole === 'NU_PROPRIETAIRE'}
                onClick={() => {
                  patch({ demembrementRole: 'NU_PROPRIETAIRE' })
                  setTimeout(() => setStepId('result'), 120)
                }}
              />
            </div>
          </div>
        )

      // ── Step 3 NU: Revenus & Régime ───────────────────────────────────────
      case 'nu-revenus': {
        const bruts = answers.loyersBruts ?? 0
        const isMicroEligible = bruts > 0 && bruts < 15000
        const isReelObligatoire = bruts >= 15000
        const hasPaymentData = prefillData?.dataQuality.hasPayments
        return (
          <div>
            <QuestionHeader
              question={`Loyers bruts encaissés en ${fiscalYear}`}
              hint="Indiquez le total des loyers et accessoires encaissés avant déduction de toute charge."
            />

            {/* Prefill indicator */}
            {hasPaymentData && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                padding: '8px 14px', borderRadius: 8,
                background: '#f0f7ff', border: '1px solid #b8ccf0',
              }}>
                <Sparkles size={13} style={{ color: BAI.owner, flexShrink: 0 }} />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.owner, margin: 0 }}>
                  Pré-rempli depuis vos paiements Bailio — vous pouvez ajuster si nécessaire.
                </p>
              </div>
            )}

            <div style={{ maxWidth: 320, marginBottom: 20 }}>
              <NumInput
                label={`Loyers bruts ${fiscalYear} (€)`}
                value={answers.loyersBruts}
                onChange={(v) => patch({ loyersBruts: v, opteRegimeReel: false })}
                placeholder="Ex: 8 400"
              />
            </div>

            {isMicroEligible && (
              <div style={{ marginBottom: 16 }}>
                <InfoBanner
                  variant="success"
                  message="Vous êtes éligible au micro-foncier — abattement forfaitaire de 30% calculé automatiquement. Vous n'avez pas à détailler vos charges."
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    background: BAI.bgMuted,
                    borderRadius: 10,
                    border: `1px solid ${BAI.border}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => patch({ opteRegimeReel: !answers.opteRegimeReel })}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: `2px solid ${answers.opteRegimeReel ? BAI.caramel : BAI.border}`,
                      background: answers.opteRegimeReel ? BAI.caramel : 'transparent',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {answers.opteRegimeReel && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                      Opter pour le régime réel
                    </p>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>
                      Déduire les charges réelles (intérêts, travaux, gestion…)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isReelObligatoire && (
              <InfoBanner
                variant="warning"
                message="Régime réel obligatoire au-delà de 15 000 € de revenus fonciers. Vous devrez détailler vos charges à l'étape suivante."
              />
            )}
          </div>
        )
      }

      // ── Step 4 NU REEL: Charges déductibles ──────────────────────────────
      case 'nu-charges':
        return (
          <div>
            <QuestionHeader
              question="Charges déductibles"
              hint={`Détaillez vos charges réelles engagées en ${fiscalYear}. Saisissez 0 si la charge ne s'applique pas.`}
            />
            {prefillData?.dataQuality.hasExpenses && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '8px 14px', borderRadius: 8,
                background: '#f0f7ff', border: '1px solid #b8ccf0',
              }}>
                <Sparkles size={13} style={{ color: BAI.owner, flexShrink: 0 }} />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.owner, margin: 0 }}>
                  Charges et emprunts pré-remplis depuis vos dépenses et prêts Bailio — vérifiez et complétez.
                </p>
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              <NumInput
                label="Intérêts d'emprunt"
                value={answers.interetsEmprunt}
                onChange={(v) => patch({ interetsEmprunt: v })}
                placeholder="0"
                hint="Attestation fiscale de votre banque"
              />
              <NumInput
                label="Travaux d'entretien et réparation"
                value={answers.travaux}
                onChange={(v) => patch({ travaux: v })}
                placeholder="0"
                hint="Factures acquittées uniquement"
              />
              <NumInput
                label="Charges de copropriété"
                value={answers.chargesCopro}
                onChange={(v) => patch({ chargesCopro: v })}
                placeholder="0"
                hint="Part déductible du relevé du syndic"
              />
              <NumInput
                label="Primes d'assurance PNO"
                value={answers.assurances}
                onChange={(v) => patch({ assurances: v })}
                placeholder="0"
              />
              <NumInput
                label="Frais de gestion / honoraires agence"
                value={answers.fraisGestion}
                onChange={(v) => patch({ fraisGestion: v })}
                placeholder="0"
              />
              <NumInput
                label="Taxe foncière"
                value={answers.taxeFonciere}
                onChange={(v) => patch({ taxeFonciere: v })}
                placeholder="0"
                hint="Non refacturée au locataire"
              />
              <NumInput
                label="Autres charges déductibles"
                value={answers.autresCharges}
                onChange={(v) => patch({ autresCharges: v })}
                placeholder="0"
                hint="Frais de procédure, diagnostics…"
              />
            </div>
          </div>
        )

      // ── Step 3 MEUBLE: Recettes + Type ────────────────────────────────────
      case 'meuble-recettes': {
        const recettes = answers.recettesMeublees ?? 0
        const revenus = answers.revenusTotauxProfessionnels ?? 0
        const isLMP = recettes > 23000 && recettes > revenus * 0.5
        const seuilMicro = answers.meubleeType !== 'CLASSIQUE' ? 188_700 : 77_700
        const autoMicro = recettes <= seuilMicro && !isLMP

        return (
          <div>
            <QuestionHeader
              question={`Recettes locatives meublées ${fiscalYear}`}
              hint="Indiquez le total de vos recettes locatives meublées (loyers + charges refacturées)."
            />
            {prefillData?.dataQuality.hasPayments && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                padding: '8px 14px', borderRadius: 8,
                background: '#f0f7ff', border: '1px solid #b8ccf0',
              }}>
                <Sparkles size={13} style={{ color: BAI.owner, flexShrink: 0 }} />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.owner, margin: 0 }}>
                  Pré-rempli depuis vos paiements Bailio — vous pouvez ajuster si nécessaire.
                </p>
              </div>
            )}

            <div style={{ maxWidth: 320, marginBottom: 24 }}>
              <NumInput
                label={`Recettes locatives ${fiscalYear} (€)`}
                value={answers.recettesMeublees}
                onChange={(v) => patch({ recettesMeublees: v })}
                placeholder="Ex: 12 000"
              />
            </div>

            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.inkMid, marginBottom: 10 }}>
              Type de location meublée
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 24 }}>
              {([
                { value: 'CLASSIQUE' as const, label: 'Classique', desc: 'Bail meublé standard (1 an)' },
                { value: 'TOURISME_CLASSE' as const, label: 'Tourisme classé', desc: 'Classement Atout France' },
                { value: 'CHAMBRE_HOTES' as const, label: 'Chambre d\'hôtes', desc: 'Accueil chez l\'habitant' },
              ]).map((opt) => (
                <OptionCard
                  key={opt.value}
                  title={opt.label}
                  description={opt.desc}
                  selected={answers.meubleeType === opt.value}
                  onClick={() => patch({ meubleeType: opt.value })}
                />
              ))}
            </div>

            <div style={{ maxWidth: 380, marginBottom: 16 }}>
              <NumInput
                label="Revenus professionnels totaux du foyer (hors immobilier)"
                value={answers.revenusTotauxProfessionnels}
                onChange={(v) => patch({ revenusTotauxProfessionnels: v })}
                placeholder="Ex: 40 000"
                hint="Salaires, pensions, BNC, BIC non immobiliers — pour vérifier le seuil LMP"
              />
            </div>

            {isLMP && (
              <InfoBanner
                variant="warning"
                message="Statut LMP détecté : vos recettes dépassent 23 000 € ET représentent plus de 50% de vos revenus professionnels. Le régime réel est obligatoire, avec des cotisations sociales TNS à prévoir."
              />
            )}

            {autoMicro && recettes > 0 && (
              <div>
                <InfoBanner
                  variant="success"
                  message={`Micro-BIC éligible : abattement forfaitaire de ${answers.meubleeType !== 'CLASSIQUE' ? '71%' : '50%'} sur vos recettes brutes.`}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    background: BAI.bgMuted,
                    borderRadius: 10,
                    border: `1px solid ${BAI.border}`,
                    cursor: 'pointer',
                    marginTop: -8,
                  }}
                  onClick={() =>
                    patch({ regimeMeuble: answers.regimeMeuble === 'REEL' ? 'MICRO' : 'REEL' })
                  }
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: `2px solid ${answers.regimeMeuble === 'REEL' ? BAI.caramel : BAI.border}`,
                      background: answers.regimeMeuble === 'REEL' ? BAI.caramel : 'transparent',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {answers.regimeMeuble === 'REEL' && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                      Opter pour le régime réel BIC
                    </p>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>
                      Déduire amortissements + charges réelles (souvent plus avantageux)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      // ── Step MEUBLE REEL: Amortissements + charges ────────────────────────
      case 'meuble-charges':
        return (
          <div>
            <QuestionHeader
              question="Amortissements et charges (régime réel BIC)"
              hint="Le régime réel permet de déduire les amortissements du bien et du mobilier, ainsi que toutes les charges réelles."
            />

            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: BAI.caramel,
                margin: '0 0 12px',
              }}
            >
              Amortissement immobilier
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <NumInput
                label="Valeur du bien (hors terrain)"
                value={answers.valeurBien}
                onChange={(v) => patch({ valeurBien: v })}
                placeholder="Ex: 180 000"
                hint="Prix d'acquisition ou valeur vénale — on n'amortit pas le terrain"
              />
              <div>
                <label style={labelStyle}>Durée d'amortissement (années)</label>
                <input
                  type="number"
                  min={10}
                  max={50}
                  value={answers.dureeAmortissementBien ?? ''}
                  onChange={(e) => {
                    const n = parseInt(e.target.value)
                    patch({ dureeAmortissementBien: isNaN(n) ? undefined : n })
                  }}
                  placeholder="25"
                  style={inputStyle}
                />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '4px 0 0' }}>
                  Typiquement 25 à 30 ans pour l'immobilier
                </p>
              </div>
            </div>

            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: BAI.caramel,
                margin: '0 0 12px',
              }}
            >
              Amortissement mobilier
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <NumInput
                label="Valeur du mobilier"
                value={answers.valeurMobilier}
                onChange={(v) => patch({ valeurMobilier: v })}
                placeholder="Ex: 8 000"
              />
              <div>
                <label style={labelStyle}>Durée d'amortissement mobilier (années)</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={answers.dureeAmortissementMobilier ?? ''}
                  onChange={(e) => {
                    const n = parseInt(e.target.value)
                    patch({ dureeAmortissementMobilier: isNaN(n) ? undefined : n })
                  }}
                  placeholder="7"
                  style={inputStyle}
                />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '4px 0 0' }}>
                  Typiquement 5 à 7 ans pour le mobilier
                </p>
              </div>
            </div>

            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: BAI.caramel,
                margin: '0 0 12px',
              }}
            >
              Autres charges
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <NumInput
                label="Intérêts d'emprunt"
                value={answers.interetsEmprunt}
                onChange={(v) => patch({ interetsEmprunt: v })}
                placeholder="0"
              />
              <NumInput
                label="Charges diverses (copro, assurance, gestion…)"
                value={answers.autresCharges}
                onChange={(v) => patch({ autresCharges: v })}
                placeholder="0"
              />
            </div>
          </div>
        )

      // ── SCI IR details ────────────────────────────────────────────────────
      case 'sci-ir-details':
        return (
          <div>
            <QuestionHeader
              question="Revenus et charges de la SCI"
              hint="Renseignez les données globales de la SCI, puis votre quote-part."
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <NumInput
                label="Revenus bruts de la SCI"
                value={answers.sciRevenusBruts}
                onChange={(v) => patch({ sciRevenusBruts: v })}
                placeholder="Ex: 24 000"
              />
              <NumInput
                label="Charges déductibles SCI"
                value={answers.sciCharges}
                onChange={(v) => patch({ sciCharges: v })}
                placeholder="0"
              />
              <NumInput
                label="Intérêts d'emprunt SCI"
                value={answers.sciInterets}
                onChange={(v) => patch({ sciInterets: v })}
                placeholder="0"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nombre d'associés</label>
                <input
                  type="number"
                  min={1}
                  value={answers.nombreAssocies ?? ''}
                  onChange={(e) => {
                    const n = parseInt(e.target.value)
                    patch({ nombreAssocies: isNaN(n) ? undefined : n })
                  }}
                  placeholder="Ex: 2"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Votre quote-part (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={answers.quotePart ?? ''}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value)
                    patch({ quotePart: isNaN(n) ? undefined : n })
                  }}
                  placeholder="Ex: 50"
                  style={inputStyle}
                />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '4px 0 0' }}>
                  Votre part dans les bénéfices / déficits de la SCI
                </p>
              </div>
            </div>
          </div>
        )

      // ── SCI IS details ────────────────────────────────────────────────────
      // sciDistribueOui: local flag encoded as answers.isLMP (reusing a boolean field
      // not used in this path). We track "Oui/Non" via answers.mandataireDesigne.
      case 'sci-is-details': {
        // Reuse mandataireDesigne boolean as "distribue oui" flag for SCI IS path
        const distribueOui = answers.mandataireDesigne === true
        const distribueNon = answers.mandataireDesigne === false

        return (
          <div>
            <QuestionHeader
              question="Résultat fiscal de la SCI à l'IS"
              hint="L'IS est calculé automatiquement (15% jusqu'à 42 500 €, 25% au-delà)."
            />
            <div style={{ maxWidth: 360, marginBottom: 24 }}>
              <NumInput
                label="Résultat fiscal de la SCI (€)"
                value={answers.resultatFiscalSCI}
                onChange={(v) => patch({ resultatFiscalSCI: v })}
                placeholder="Ex: 18 000"
                hint="Avant impôt sur les sociétés"
              />
            </div>

            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.inkMid, marginBottom: 10 }}>
              Dividendes distribués ?
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {([
                { label: 'Oui', active: distribueOui },
                { label: 'Non', active: distribueNon },
              ] as const).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => patch({ mandataireDesigne: opt.label === 'Oui' })}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: `${opt.active ? 2 : 1}px solid ${opt.active ? BAI.caramel : BAI.border}`,
                    background: opt.active ? BAI.caramelLight : BAI.bgSurface,
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                    fontWeight: 600,
                    color: opt.active ? BAI.caramel : BAI.inkMid,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {distribueOui && (
              <div style={{ maxWidth: 320 }}>
                <NumInput
                  label="Montant des dividendes distribués"
                  value={answers.dividendesDistribues}
                  onChange={(v) => patch({ dividendesDistribues: v })}
                  placeholder="Ex: 5 000"
                  hint="Les dividendes sont soumis à la flat tax (30%) ou au barème de l'IR"
                />
              </div>
            )}
          </div>
        )
      }

      // ── Indivision details ────────────────────────────────────────────────
      case 'indivision-details':
        return (
          <div>
            <QuestionHeader
              question="Revenus et charges de l'indivision"
              hint="Renseignez les données globales de l'indivision, puis votre quote-part indivise."
            />

            <InfoBanner
              variant="info"
              message="Un mandataire commun doit être désigné pour la déclaration centrale (formulaire 2041-E). Chaque indivisaire déclare ensuite sa quote-part."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
              <NumInput
                label="Loyers bruts de l'indivision"
                value={answers.loyersBruts}
                onChange={(v) => patch({ loyersBruts: v })}
                placeholder="Ex: 18 000"
              />
              <NumInput
                label="Intérêts d'emprunt"
                value={answers.interetsEmprunt}
                onChange={(v) => patch({ interetsEmprunt: v })}
                placeholder="0"
              />
              <NumInput
                label="Travaux"
                value={answers.travaux}
                onChange={(v) => patch({ travaux: v })}
                placeholder="0"
              />
              <NumInput
                label="Autres charges"
                value={answers.autresCharges}
                onChange={(v) => patch({ autresCharges: v })}
                placeholder="0"
              />
            </div>

            <div style={{ maxWidth: 280 }}>
              <div>
                <label style={labelStyle}>Votre quote-part indivise (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={answers.quotePartIndivision ?? ''}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value)
                    patch({ quotePartIndivision: isNaN(n) ? undefined : n })
                  }}
                  placeholder="Ex: 50"
                  style={inputStyle}
                />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '4px 0 0' }}>
                  Part que vous détenez dans l'indivision
                </p>
              </div>
            </div>
          </div>
        )

      // ── Result ────────────────────────────────────────────────────────────
      case 'result': {
        const completeAnswers = answers as WizardAnswers
        const result = computeResult(completeAnswers)
        const config = RESULT_CONFIGS[result]
        const calc = calculateFiscal(completeAnswers, fiscalYear)
        const summary = calc.summary
        const isDeficit = summary.revenuNet < 0

        return (
          <div>
            {/* Header result */}
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: BAI.caramelLight,
                  border: `1px solid ${BAI.caramelBorder}`,
                  borderRadius: 20,
                  padding: '4px 12px',
                  marginBottom: 12,
                }}
              >
                <CheckCircle size={13} style={{ color: BAI.caramel }} />
                <span
                  style={{
                    fontFamily: BAI.fontBody,
                    fontSize: 11,
                    fontWeight: 700,
                    color: BAI.caramel,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Votre régime fiscal
                </span>
              </div>
              <h2
                style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 'clamp(22px, 3.5vw, 30px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: BAI.ink,
                  margin: '0 0 8px',
                  lineHeight: 1.2,
                }}
              >
                {config.label}
              </h2>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0, lineHeight: 1.7 }}>
                {config.advice}
              </p>
              {config.disclaimer && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    background: BAI.warningLight,
                    borderRadius: 8,
                    border: `1px solid ${BAI.caramelBorder}`,
                  }}
                >
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.warning, margin: 0, lineHeight: 1.6 }}>
                    {config.disclaimer}
                  </p>
                </div>
              )}
            </div>

            {/* Forms */}
            {config.forms.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    fontFamily: BAI.fontBody,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: BAI.inkFaint,
                    margin: '0 0 10px',
                  }}
                >
                  Formulaires requis
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {config.forms.map((form) => (
                    <div
                      key={form.code}
                      style={{
                        background: BAI.bgSurface,
                        border: `1px solid ${BAI.border}`,
                        borderLeft: `4px solid ${form.isPrimary ? BAI.caramel : BAI.border}`,
                        borderRadius: 10,
                        padding: '14px 18px',
                        display: 'flex',
                        gap: 16,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flexShrink: 0 }}>
                        <p
                          style={{
                            fontFamily: BAI.fontDisplay,
                            fontSize: 22,
                            fontWeight: 700,
                            fontStyle: 'italic',
                            color: form.isPrimary ? BAI.caramel : BAI.inkMid,
                            margin: 0,
                            lineHeight: 1,
                          }}
                        >
                          {form.code}
                        </p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                            {form.label}
                          </p>
                          <span
                            style={{
                              fontFamily: BAI.fontBody,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: form.isPrimary ? BAI.caramel : BAI.inkFaint,
                              background: form.isPrimary ? BAI.caramelLight : BAI.bgMuted,
                              padding: '2px 7px',
                              borderRadius: 20,
                            }}
                          >
                            {form.isPrimary ? 'Principal' : 'Annexe'}
                          </span>
                        </div>
                        {form.section && (
                          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 4px', fontWeight: 500 }}>
                            {form.section}
                          </p>
                        )}
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: 0, lineHeight: 1.5 }}>
                          {form.description}
                        </p>
                      </div>
                      <FileText size={16} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial summary */}
            {summary.revenusBruts > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p
                  style={{
                    fontFamily: BAI.fontBody,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: BAI.inkFaint,
                    margin: '0 0 10px',
                  }}
                >
                  Résumé financier {fiscalYear}
                </p>
                <div
                  style={{
                    background: BAI.bgMuted,
                    borderRadius: 12,
                    border: `1px solid ${BAI.border}`,
                    overflow: 'hidden',
                  }}
                >
                  {[
                    { label: 'Revenus bruts', value: summary.revenusBruts, sign: '' },
                    ...(summary.interetsEmprunt > 0
                      ? [{ label: "dont Intérêts d'emprunt", value: -summary.interetsEmprunt, sign: '-' }]
                      : []),
                    ...(summary.chargesDeductibles > 0 && !summary.abattement
                      ? [{ label: 'Charges déductibles', value: -summary.chargesDeductibles, sign: '-' }]
                      : []),
                    ...(summary.abattement
                      ? [
                          {
                            label: `Abattement forfaitaire (−${summary.abattement != null && summary.revenusBruts > 0 ? Math.round((summary.abattement / summary.revenusBruts) * 100) : 0}%)`,
                            value: -summary.abattement,
                            sign: '-',
                          },
                        ]
                      : []),
                    ...(calc.amortissements
                      ? [
                          { label: 'Amortissement bien', value: -calc.amortissements.bien, sign: '-' },
                          { label: 'Amortissement mobilier', value: -calc.amortissements.mobilier, sign: '-' },
                        ]
                      : []),
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 16px',
                        borderBottom: i < 4 ? `1px solid ${BAI.border}` : 'none',
                      }}
                    >
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>
                        {row.label}
                      </span>
                      <span
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 13,
                          fontWeight: 600,
                          color: row.sign === '-' ? BAI.inkMid : BAI.ink,
                        }}
                      >
                        {row.sign === '-' ? '−' : ''}{fmt(Math.abs(row.value))}
                      </span>
                    </div>
                  ))}

                  {/* Net result */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: isDeficit ? BAI.errorLight : BAI.successLight,
                      borderTop: `2px solid ${isDeficit ? '#fca5a5' : BAI.tenantBorder}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BAI.fontBody,
                        fontSize: 14,
                        fontWeight: 700,
                        color: isDeficit ? BAI.error : BAI.tenant,
                      }}
                    >
                      {result.startsWith('SCI') ? 'Résultat net SCI' : result.startsWith('LMNP') || result.startsWith('LMP') ? 'Résultat BIC net' : 'Revenu foncier net'}
                    </span>
                    <span
                      style={{
                        fontFamily: BAI.fontDisplay,
                        fontSize: 22,
                        fontWeight: 700,
                        fontStyle: 'italic',
                        color: isDeficit ? BAI.error : BAI.tenant,
                      }}
                    >
                      {isDeficit ? '− ' : '+ '}{fmt(Math.abs(summary.revenuNet))}
                    </span>
                  </div>
                </div>

                {isDeficit && (
                  <p
                    style={{
                      fontFamily: BAI.fontBody,
                      fontSize: 12,
                      color: BAI.inkMid,
                      margin: '10px 0 0',
                      padding: '10px 14px',
                      background: BAI.bgMuted,
                      borderRadius: 8,
                      lineHeight: 1.6,
                    }}
                  >
                    Déficit foncier : la part imputable sur le revenu global est plafonnée à 10 700 € par an. L'excédent est reportable sur les revenus fonciers des 10 années suivantes.
                  </p>
                )}
              </div>
            )}

            {/* Download PDF */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading}
                style={{
                  background: downloading ? BAI.inkFaint : BAI.night,
                  color: '#fff',
                  padding: '14px 32px',
                  borderRadius: 12,
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: 'none',
                  minHeight: 44,
                  transition: BAI.transition,
                }}
              >
                {downloading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
                Télécharger le rapport PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnswers({})
                  setStepId('holding')
                }}
                style={{
                  background: 'transparent',
                  color: BAI.inkMid,
                  padding: '14px 20px',
                  borderRadius: 12,
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: `1px solid ${BAI.border}`,
                  minHeight: 44,
                }}
              >
                Recommencer
              </button>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  const isResultStep = stepId === 'result'
  const canGoNext = stepId !== 'result' && stepId !== 'holding'

  // Validate current step before allowing Next
  function canProceed(): boolean {
    switch (stepId) {
      case 'holding':
        return !!answers.holdingMode
      case 'location-type':
        return !!answers.locationType
      case 'sci-regime':
        return !!answers.sciRegime
      case 'demembrement-role':
        return !!answers.demembrementRole
      case 'nu-revenus':
        return (answers.loyersBruts ?? 0) > 0
      case 'nu-charges':
        return true
      case 'meuble-recettes':
        return (answers.recettesMeublees ?? 0) > 0 && !!answers.meubleeType
      case 'meuble-charges':
        return true
      case 'sci-ir-details':
        return (answers.sciRevenusBruts ?? 0) > 0
      case 'sci-is-details':
        return (answers.resultatFiscalSCI ?? 0) >= 0
      case 'indivision-details':
        return (answers.loyersBruts ?? 0) > 0
      default:
        return true
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BAI.bgBase, padding: 'clamp(16px, 4vw, 40px)' }}>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: BAI.caramel,
            margin: '0 0 6px',
          }}
        >
          Fiscalité
        </p>
        <h1
          style={{
            fontFamily: BAI.fontDisplay,
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color: BAI.ink,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Assistant fiscal {fiscalYear}
        </h1>
        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 14,
            color: BAI.inkMid,
            margin: '8px 0 0',
          }}
        >
          Générez vos formulaires fiscaux pré-remplis en 3 minutes.
        </p>
      </div>

      {/* ── Wizard card ──────────────────────────────────────────────────────── */}
      <PremiumGate
        requiredPlan="PRO"
        title="Assistant fiscal automatique"
        description="Générez vos formulaires fiscaux pré-remplis (2044, 2042, 2042-C-PRO, 2031) en 3 minutes, depuis les données de votre compte Bailio. Disponible à partir du plan Pro."
      >
      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          background: BAI.bgSurface,
          borderRadius: 16,
          border: `1px solid ${BAI.border}`,
          boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: BAI.bgMuted }}>
          <div
            style={{
              height: '100%',
              background: BAI.caramel,
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Step indicator */}
        {!isResultStep && (
          <div
            style={{
              padding: '14px 24px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 11,
                fontWeight: 600,
                color: BAI.inkFaint,
                margin: 0,
                letterSpacing: '0.06em',
              }}
            >
              Étape {stepNumber} / {totalSteps}
            </p>
            <div style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: i < stepNumber ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i < stepNumber ? BAI.caramel : BAI.border,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step content */}
        <div style={{ padding: 'clamp(20px, 4vw, 40px)' }}>{renderStep()}</div>

        {/* Navigation */}
        {!isResultStep && (
          <div
            style={{
              padding: '0 clamp(20px, 4vw, 40px) 24px',
              borderTop: `1px solid ${BAI.border}`,
              paddingTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Back */}
            <button
              type="button"
              onClick={goBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 10,
                border: `1px solid ${BAI.border}`,
                background: 'transparent',
                fontFamily: BAI.fontBody,
                fontSize: 14,
                color: BAI.inkMid,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <ChevronLeft size={16} />
              Retour
            </button>

            {/* Next — only show for steps that need explicit confirmation */}
            {canGoNext && (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: canProceed() ? BAI.night : BAI.bgMuted,
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  color: canProceed() ? '#fff' : BAI.inkFaint,
                  cursor: canProceed() ? 'pointer' : 'not-allowed',
                  minHeight: 44,
                  transition: BAI.transition,
                }}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
      </PremiumGate>

      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
