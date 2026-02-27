/**
 * DossierLocatif.tsx — Wizard anti-fraude 5 étapes v2
 * Intègre SmartDocumentScanner (OCR + keyphrase matching + forensics),
 * une animation "laser scan", un challenge "Preuve de Vie" pour les documents
 * suspects, et un Dashboard de finalisation remplaçant le simple export ZIP.
 */
import {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react'
import {
  Upload, Trash2, CheckCircle, AlertCircle, FileText, User,
  Briefcase, TrendingUp, Home, Shield, Eye, Lock, Loader,
  Star, Award, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Download, ShieldAlert, ShieldCheck, AlertTriangle, Info,
  ScanLine, Camera, LayoutDashboard, FileCheck, XCircle, QrCode,
  Cpu, Zap,
} from 'lucide-react'
import JSZip from 'jszip'
import { useAuth } from '../../hooks/useAuth'
import { Layout } from '../../components/layout/Layout'
import { dossierService, TenantDocument } from '../../services/dossierService'
import {
  validateDocumentIntegrity,
  autoClassifyFilename,
  IntegrityResult,
  luhnSiret,
  validateNIR,
} from '../../utils/validateDocumentIntegrity'
import {
  scanDocument,
  ScanResult,
  generateProofOfLifeObject,
  checkCrossDocumentCoherence,
} from '../../utils/SmartDocumentScanner'
import {
  loadProgress,
  saveProgress,
  updateDocProgress,
} from '../../utils/progressState'
import toast from 'react-hot-toast'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ??
  'http://localhost:3000'

// ─── Data ─────────────────────────────────────────────────────────────────────

interface DocSpec {
  docType: string
  label: string
  hint: string
  why: string
  required: boolean
  weight: number
  sensitive?: boolean
}

interface WizardStep {
  id: string
  label: string
  shortLabel: string
  icon: React.ElementType
  accent: string
  accentBg: string
  accentBorder: string
  headline: string
  intro: string
  docs: DocSpec[]
}

const STEPS: WizardStep[] = [
  {
    id: 'IDENTITE',
    label: 'Identité & Profil',
    shortLabel: 'Identité',
    icon: User,
    accent: 'text-cyan-600',
    accentBg: 'bg-cyan-50',
    accentBorder: 'border-cyan-200',
    headline: 'Prouvez qui vous êtes',
    intro:
      "Ces documents permettent au propriétaire de s'assurer de votre identité réelle. Un dossier sans pièce d'identité est systématiquement rejeté.",
    docs: [
      {
        docType: 'CNI',
        label: "Carte d'identité (recto/verso)",
        hint: 'Valide, non expirée. Recto et verso sur la même page PDF.',
        why: "Preuve d'identité légale obligatoire.",
        required: true,
        weight: 3,
      },
      {
        docType: 'PASSEPORT',
        label: 'Passeport (page photo)',
        hint: 'Page avec photo et données biométriques.',
        why: 'Alternative à la CNI si vous avez un passeport valide.',
        required: false,
        weight: 2,
      },
      {
        docType: 'JUSTIFICATIF_DOMICILE',
        label: 'Justificatif de domicile',
        hint: 'Facture EDF/eau/gaz ou avis de taxe, daté de moins de 3 mois.',
        why: 'Atteste votre adresse actuelle.',
        required: true,
        weight: 2,
      },
    ],
  },
  {
    id: 'SITUATION_PRO',
    label: 'Situation Professionnelle',
    shortLabel: 'Emploi',
    icon: Briefcase,
    accent: 'text-violet-600',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-violet-200',
    headline: 'Justifiez votre activité',
    intro:
      "Le propriétaire doit s'assurer que vos revenus sont stables. Un CDI ou un statut d'indépendant solide rassure davantage qu'un CDD court.",
    docs: [
      {
        docType: 'CONTRAT_TRAVAIL',
        label: 'Contrat de travail',
        hint: 'CDI, CDD, intérim ou convention de stage signée.',
        why: 'Justifie la stabilité de votre emploi.',
        required: true,
        weight: 4,
      },
      {
        docType: 'ATTESTATION_EMPLOYEUR',
        label: "Attestation de l'employeur",
        hint: "Sur papier entête, précisant poste, date d'embauche et salaire.",
        why: "Confirme que vous êtes bien en poste à la date du dossier.",
        required: false,
        weight: 2,
      },
      {
        docType: 'DERNIER_BULLETIN',
        label: 'Dernier bulletin de salaire',
        hint: 'Bulletin M-1, le plus récent.',
        why: 'Permet de vérifier votre rémunération réelle.',
        required: true,
        weight: 3,
        sensitive: true,
      },
      {
        docType: 'KBIS_SIRET',
        label: 'Kbis / numéro SIRET',
        hint: 'Pour travailleurs indépendants, auto-entrepreneurs.',
        why: "Preuve d'existence légale de votre entreprise.",
        required: false,
        weight: 2,
      },
    ],
  },
  {
    id: 'REVENUS',
    label: 'Ressources & Revenus',
    shortLabel: 'Revenus',
    icon: TrendingUp,
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    headline: 'Démontrez votre capacité financière',
    intro:
      "La règle des «3× le loyer» est le critère principal. Vos bulletins des 3 derniers mois et vos avis d'imposition sont les preuves les plus fiables.",
    docs: [
      { docType: 'BULLETIN_1', label: 'Bulletin de salaire M-1', hint: 'Mois le plus récent.', why: 'Revenu le plus récent.', required: true, weight: 3, sensitive: true },
      { docType: 'BULLETIN_2', label: 'Bulletin de salaire M-2', hint: 'Avant-dernier mois.', why: 'Régularité sur 2 mois.', required: true, weight: 3, sensitive: true },
      { docType: 'BULLETIN_3', label: 'Bulletin de salaire M-3', hint: 'Il y a 3 mois.', why: '3 mois consécutifs = stabilité.', required: true, weight: 3, sensitive: true },
      { docType: 'AVIS_IMPOSITION_1', label: "Avis d'imposition N-1", hint: 'Dernier avis reçu.', why: 'Revenus officiels déclarés.', required: true, weight: 4, sensitive: true },
      { docType: 'AVIS_IMPOSITION_2', label: "Avis d'imposition N-2", hint: 'Avant-dernier avis.', why: 'Stabilité sur 2 années fiscales.', required: false, weight: 2, sensitive: true },
      { docType: 'RELEVE_BANCAIRE', label: 'Relevés bancaires (3 mois)', hint: 'Relevés complets.', why: 'Gestion financière quotidienne.', required: false, weight: 2 },
    ],
  },
  {
    id: 'HISTORIQUE',
    label: 'Historique de Logement',
    shortLabel: 'Historique',
    icon: Home,
    accent: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    headline: 'Montrez que vous payez régulièrement',
    intro:
      "Vos quittances sont vos «références locatives». Un historique propre est l'argument le plus rassurant.",
    docs: [
      { docType: 'QUITTANCE_1', label: 'Quittance de loyer M-1', hint: 'Quittance la plus récente.', why: 'Paiement à temps le mois dernier.', required: false, weight: 2 },
      { docType: 'QUITTANCE_2', label: 'Quittance de loyer M-2', hint: 'Deuxième quittance.', why: 'Régularité sur 2 mois.', required: false, weight: 2 },
      { docType: 'QUITTANCE_3', label: 'Quittance de loyer M-3', hint: 'Troisième quittance.', why: '3 quittances = locataire fiable.', required: false, weight: 2 },
      { docType: 'ATTESTATION_PAIEMENT', label: 'Attestation de bon paiement', hint: "Délivrée par l'ancien propriétaire.", why: 'Meilleur signe de confiance.', required: false, weight: 3 },
      { docType: 'ASSURANCE_HABITATION', label: 'Assurance habitation en cours', hint: "Attestation d'assurance valide.", why: 'Obligation légale respectée.', required: false, weight: 2 },
    ],
  },
  {
    id: 'GARANTIES',
    label: 'Garanties & Cautions',
    shortLabel: 'Garanties',
    icon: Shield,
    accent: 'text-fuchsia-600',
    accentBg: 'bg-fuchsia-50',
    accentBorder: 'border-fuchsia-200',
    headline: 'Sécurisez votre candidature',
    intro:
      "La garantie Visale est préférée à la caution parentale. Elle couvre les loyers impayés et est gratuite.",
    docs: [
      { docType: 'ATTESTATION_VISALE', label: 'Attestation Visale', hint: 'Garantie Action Logement.', why: 'Garantit les loyers impayés.', required: false, weight: 5 },
      { docType: 'ACTE_CAUTION', label: 'Acte de cautionnement solidaire', hint: 'Document signé par le garant.', why: 'Engagement légal du garant.', required: false, weight: 4 },
      { docType: 'CNI_GARANT', label: "Pièce d'identité du garant", hint: 'CNI ou passeport valide.', why: 'Identifie légalement votre garant.', required: false, weight: 2 },
      { docType: 'BULLETINS_GARANT', label: 'Bulletins de salaire du garant', hint: '3 derniers bulletins.', why: 'Solvabilité du garant.', required: false, weight: 3 },
      { docType: 'AVIS_IMPOSITION_GARANT', label: "Avis d'imposition du garant", hint: "Dernier avis d'imposition.", why: 'Revenus officiels du garant.', required: false, weight: 2 },
    ],
  },
]

const ALL_DOCS = STEPS.flatMap((s) => s.docs.map((d) => ({ ...d, category: s.id })))
const TOTAL_WEIGHT = ALL_DOCS.reduce((sum, d) => sum + d.weight, 0)

function computeScore(documents: TenantDocument[]): number {
  const uploadedWeight = ALL_DOCS.filter((spec) =>
    documents.some((d) => d.category === spec.category && d.docType === spec.docType),
  ).reduce((sum, spec) => sum + spec.weight, 0)
  return Math.round((uploadedWeight / TOTAL_WEIGHT) * 100)
}

function getStrength(score: number, hasVisale: boolean) {
  if (score >= 90 && hasVisale) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Award }
  if (score >= 65) return { label: 'Bon', color: 'text-blue-600', bg: 'bg-blue-100', icon: Star }
  if (score >= 35) return { label: 'Moyen', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertCircle }
  return { label: 'Faible', color: 'text-red-500', bg: 'bg-red-100', icon: AlertCircle }
}

// ─── Score Gauge SVG ──────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const R = 54, cx = 64, cy = 64
  const circumference = Math.PI * R
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100)
  const strokeColor = score >= 90 ? '#10b981' : score >= 65 ? '#3b82f6' : score >= 35 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={128} height={72} viewBox="0 0 128 76">
      <path d="M 10 64 A 54 54 0 0 1 118 64" fill="none" stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
      <path
        d="M 10 64 A 54 54 0 0 1 118 64"
        fill="none" stroke={strokeColor} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={22} fontWeight="bold" fill={strokeColor}>{score}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">complétude</text>
    </svg>
  )
}

// ─── LaserScanAnimation ───────────────────────────────────────────────────────

function LaserScanAnimation({ phase, pct }: { phase: string; pct: number }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'rgba(0,200,150,0.04)', border: '1.5px solid rgba(0,200,150,0.25)' }}>
      {/* Laser line */}
      <div
        className="absolute left-0 right-0 h-0.5 pointer-events-none"
        style={{
          top: `${pct}%`,
          background: 'linear-gradient(90deg, transparent, #00c896, #00ffcc, #00c896, transparent)',
          boxShadow: '0 0 12px 3px rgba(0,200,150,0.6)',
          transition: 'top 0.12s linear',
        }}
      />
      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,150,0.04) 4px)',
        }}
      />

      <div className="relative z-10 flex items-center gap-2">
        <Cpu className="w-5 h-5 animate-pulse" style={{ color: '#00c896' }} />
        <span className="text-sm font-semibold" style={{ color: '#00c896' }}>
          {phase === 'pdf' && 'Extraction du texte PDF…'}
          {phase === 'ocr' && `Reconnaissance optique (OCR) — ${pct}%`}
          {phase === 'qr' && 'Détection QR code 2D-Doc…'}
          {phase === 'done' && 'Analyse terminée'}
        </span>
      </div>

      <div className="relative z-10 w-48 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(0,200,150,0.2)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00c896, #00ffcc)' }}
        />
      </div>

      <p className="relative z-10 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Aucune donnée transmise — analyse 100 % locale
      </p>
    </div>
  )
}

// ─── TrustBadge ───────────────────────────────────────────────────────────────

function TrustBadge({ result }: { result: IntegrityResult }) {
  const config = {
    green:  { icon: ShieldCheck,  bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Vérifié' },
    orange: { icon: AlertTriangle, bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'À confirmer' },
    red:    { icon: ShieldAlert,   bg: 'bg-red-100',     text: 'text-red-700',     label: 'Suspect' },
  }[result.level]
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label} · {result.trustScore}%
    </span>
  )
}

// ─── ScanResultPanel ──────────────────────────────────────────────────────────

function ScanResultPanel({ scan, integrityResult }: { scan: ScanResult; integrityResult?: IntegrityResult | null }) {
  const [expanded, setExpanded] = useState(false)

  const hasHighRisk = scan.fraudSignals.some((s) => s.severity === 'high')
  const hasMedRisk = scan.fraudSignals.some((s) => s.severity === 'medium')
  const badgeColor = hasHighRisk ? 'text-red-600' : hasMedRisk ? 'text-amber-600' : 'text-emerald-600'
  const badgeBg = hasHighRisk ? 'bg-red-50' : hasMedRisk ? 'bg-amber-50' : 'bg-emerald-50'

  return (
    <div className="mt-2 rounded-xl border overflow-hidden"
      style={{ borderColor: hasHighRisk ? '#fca5a5' : hasMedRisk ? '#fcd34d' : 'var(--border)' }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left ${badgeBg}`}
      >
        <div className="flex items-center gap-2">
          <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${badgeColor}`} />
          <span className={`text-xs font-semibold ${badgeColor}`}>
            Analyse IA — {scan.fraudSignals.length === 0 ? 'Aucun signal suspect' : `${scan.fraudSignals.length} signal${scan.fraudSignals.length > 1 ? 's' : ''} détecté${scan.fraudSignals.length > 1 ? 's' : ''}`}
          </span>
          {scan.ocrUsed && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">OCR</span>
          )}
          {scan.hasQrCode && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-600 flex items-center gap-0.5">
              <QrCode className="w-2.5 h-2.5" /> 2D-Doc
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-3 py-2 space-y-2" style={{ backgroundColor: 'var(--surface-subtle)' }}>
          {/* Detected doc type */}
          {scan.detectedDocType && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-medium">Type détecté : </span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {scan.detectedDocType}
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}> ({scan.classificationScore}% de certitude)</span>
            </p>
          )}

          {/* Keywords */}
          {scan.keywords.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Mots-clés trouvés :</p>
              <div className="flex flex-wrap gap-1">
                {scan.keywords.map((kw) => (
                  <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Extracted fields */}
          {(scan.extractedFields.siret || scan.extractedFields.netSalary || scan.extractedFields.fiscalRef) && (
            <div className="rounded-lg px-2 py-1.5 space-y-0.5" style={{ backgroundColor: 'var(--surface-card)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Champs extraits automatiquement :</p>
              {scan.extractedFields.siret && (
                <p className="text-xs flex items-center gap-1">
                  {luhnSiret(scan.extractedFields.siret)
                    ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                    : <XCircle className="w-3 h-3 text-red-500" />}
                  <span style={{ color: 'var(--text-tertiary)' }}>SIRET :</span>
                  <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{scan.extractedFields.siret}</span>
                </p>
              )}
              {scan.extractedFields.netSalary && scan.extractedFields.grossSalary && (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Net : <strong style={{ color: 'var(--text-primary)' }}>{scan.extractedFields.netSalary.toFixed(2)} €</strong>
                  {' '} / Brut : <strong style={{ color: 'var(--text-primary)' }}>{scan.extractedFields.grossSalary.toFixed(2)} €</strong>
                  {' '} → ratio {((scan.extractedFields.salaryRatio ?? 0) * 100).toFixed(1)} %
                </p>
              )}
              {scan.extractedFields.fiscalRef && (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  RFR : <strong style={{ color: 'var(--text-primary)' }}>{scan.extractedFields.fiscalRef.toLocaleString('fr-FR')} €</strong>
                </p>
              )}
            </div>
          )}

          {/* Fraud signals */}
          {scan.fraudSignals.length > 0 && (
            <div className="space-y-1">
              {scan.fraudSignals.map((sig, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg ${
                  sig.severity === 'high' ? 'bg-red-50' : 'bg-amber-50'
                }`}>
                  <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                    sig.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <span style={{ color: 'var(--text-primary)' }}>{sig.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Integrity checks from validateDocumentIntegrity */}
          {integrityResult && (
            <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Vérifications forensiques :</p>
              {integrityResult.checks.filter((c) => c.passed !== 'na').map((check) => (
                <div key={check.id} className="flex items-start gap-2 text-xs">
                  {check.passed === true
                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <span style={{ color: 'var(--text-primary)' }}>{check.label}</span>
                    {check.detail && (
                      <span className="ml-1" style={{ color: 'var(--text-tertiary)' }}>— {check.detail}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Durée d'analyse : {scan.scanDurationMs} ms
          </p>
        </div>
      )}
    </div>
  )
}

// ─── ProofOfLifeChallenge ─────────────────────────────────────────────────────

interface ProofOfLifeProps {
  docLabel: string
  object: string
  onPhotoProvided: (file: File) => void
  provided: boolean
}

function ProofOfLifeChallenge({ docLabel, object, onPhotoProvided, provided }: ProofOfLifeProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mt-3 rounded-xl border-2 border-dashed p-4 space-y-2"
      style={{
        borderColor: provided ? '#10b981' : '#f59e0b',
        backgroundColor: provided ? 'rgba(16,185,129,0.04)' : 'rgba(245,158,11,0.04)',
      }}>
      <div className="flex items-center gap-2">
        <Camera className={`w-4 h-4 flex-shrink-0 ${provided ? 'text-emerald-500' : 'text-amber-500'}`} />
        <p className="text-xs font-semibold" style={{ color: provided ? '#10b981' : '#f59e0b' }}>
          {provided ? 'Preuve de vie fournie ✓' : 'Preuve de vie requise'}
        </p>
      </div>

      {!provided && (
        <>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Le document <strong>{docLabel}</strong> présente un format inhabituel. Pour confirmer son authenticité,
            veuillez prendre une photo du <strong>document papier à côté de {object}</strong>.
          </p>
          <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
            Cette méthode rend la falsification numérique instantanément obsolète car elle exige la possession physique du document original.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPhotoProvided(f)
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#b45309' }}
          >
            <Camera className="w-3.5 h-3.5" />
            Prendre la photo de vérification
          </button>
        </>
      )}
    </div>
  )
}

// ─── SensitiveChecklist ───────────────────────────────────────────────────────

interface SensitiveChecklistProps {
  docType: string
  confirms: Record<string, boolean | string>
  onChange: (key: string, value: boolean | string) => void
}

function SensitiveChecklist({ docType, confirms, onChange }: SensitiveChecklistProps) {
  const isSalary = ['BULLETIN_1', 'BULLETIN_2', 'BULLETIN_3', 'DERNIER_BULLETIN'].includes(docType)
  const isTax = ['AVIS_IMPOSITION_1', 'AVIS_IMPOSITION_2'].includes(docType)
  if (!isSalary && !isTax) return null

  return (
    <div className="mt-3 rounded-xl border p-3 space-y-3"
      style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
        <ScanLine className="w-3.5 h-3.5" /> Checklist de vérification manuelle
      </p>

      {isSalary && (
        <>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
              checked={!!confirms['date_recent']} onChange={(e) => onChange('date_recent', e.target.checked)} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Le bulletin est daté de moins de <strong>4 mois</strong>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
              checked={!!confirms['salary_ratio']} onChange={(e) => onChange('salary_ratio', e.target.checked)} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Ratio <strong>Net ÷ Brut</strong> compris entre 72 % et 82 %
              <span className="block mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Hors de cette fourchette = structure salariale anormale.
              </span>
            </span>
          </label>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-primary)' }}>
              SIRET de l'employeur <span style={{ color: 'var(--text-tertiary)' }}>(14 chiffres, optionnel)</span>
            </label>
            <input
              type="text" placeholder="Ex: 73282932000074" maxLength={14} className="input text-xs py-1.5"
              value={(confirms['siret_value'] as string) ?? ''}
              onChange={(e) => onChange('siret_value', e.target.value.replace(/\D/g, ''))}
            />
            {(confirms['siret_value'] as string)?.length === 14 && (
              <p className={`text-xs mt-0.5 ${luhnSiret(confirms['siret_value'] as string) ? 'text-emerald-600' : 'text-red-600'}`}>
                {luhnSiret(confirms['siret_value'] as string) ? '✓ SIRET valide' : '✗ SIRET invalide (Luhn)'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-primary)' }}>
              NIR (N° Sécu) <span style={{ color: 'var(--text-tertiary)' }}>(15 chiffres, optionnel)</span>
            </label>
            <input
              type="text" placeholder="Ex: 185066900123456" maxLength={15} className="input text-xs py-1.5"
              value={(confirms['nir_value'] as string) ?? ''}
              onChange={(e) => onChange('nir_value', e.target.value.replace(/\D/g, ''))}
            />
            {(confirms['nir_value'] as string)?.length === 15 && (() => {
              const r = validateNIR(confirms['nir_value'] as string)
              return (
                <p className={`text-xs mt-0.5 ${r.valid ? 'text-emerald-600' : 'text-red-600'}`}>
                  {r.valid ? '✓ NIR valide' : `✗ ${r.reason}`}
                </p>
              )
            })()}
          </div>
        </>
      )}

      {isTax && (
        <>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
              checked={!!confirms['date_recent']} onChange={(e) => onChange('date_recent', e.target.checked)} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              L'avis est daté de l'année fiscale N-1 ou N-2 <strong>(non périmé)</strong>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
              checked={!!confirms['2ddoc_rf']} onChange={(e) => onChange('2ddoc_rf', e.target.checked)} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Le document porte le <strong>filigrane "RF"</strong> ou un QR code 2D-Doc
              <span className="block mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Ce code garantit l'authenticité DGFIP. Absent = risque de falsification.
              </span>
            </span>
          </label>
        </>
      )}
    </div>
  )
}

// ─── SmartDropZone ────────────────────────────────────────────────────────────

function SmartDropZone({ onFiles, uploading, stepDocs }: {
  onFiles: (files: File[], suggestedDocType?: string) => void
  uploading: boolean
  stepDocs: DocSpec[]
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (!files.length) return
      if (files.length === 1) {
        const classified = autoClassifyFilename(files[0].name)
        const inStep = classified ? stepDocs.find((d) => d.docType === classified) : undefined
        onFiles(files, inStep ? classified! : undefined)
        return
      }
      onFiles(files)
    },
    [onFiles, stepDocs],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 transition-all cursor-pointer select-none ${
        dragging ? 'border-primary-400 bg-primary-50/80 scale-[1.01]' : 'hover:border-primary-300 hover:bg-primary-50/40'
      }`}
      style={{ borderColor: dragging ? undefined : 'var(--border)' }}
    >
      <input
        ref={inputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp"
        multiple className="hidden"
        onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) onFiles(files) }}
        disabled={uploading}
      />
      {uploading
        ? <Loader className="w-7 h-7 text-primary-500 animate-spin" />
        : (
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface-subtle)' }}>
            <Upload className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )
      }
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {uploading ? 'Analyse et envoi en cours...' : 'Glissez vos fichiers ici'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          ou <span className="text-primary-600 font-medium">cliquez pour parcourir</span>
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-placeholder)' }}>
          PDF, JPEG, PNG · 5 Mo max · OCR + forensique automatique
        </p>
      </div>
    </div>
  )
}

// ─── DocCard ──────────────────────────────────────────────────────────────────

interface DocCardProps {
  spec: DocSpec
  category: string
  doc: TenantDocument | undefined
  onUpload: (docType: string, category: string, file: File) => Promise<void>
  onDelete: (id: string) => void
  uploading: boolean
  scanResult?: ScanResult | null
  onScanResult: (docType: string, result: ScanResult) => void
  proofOfLife?: { object: string; provided: boolean }
  onProofOfLifePhoto: (docType: string, file: File) => void
}

function DocCard({
  spec, category, doc, onUpload, onDelete, uploading,
  scanResult, onScanResult, proofOfLife, onProofOfLifePhoto,
}: DocCardProps) {
  const [showWhy, setShowWhy] = useState(false)
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null)
  const [confirms, setConfirms] = useState<Record<string, boolean | string>>({})
  const [justUploaded, setJustUploaded] = useState(false)
  const [scanPhase, setScanPhase] = useState<'pdf' | 'ocr' | 'qr' | 'done' | null>(null)
  const [scanPct, setScanPct] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Needs proof of life if scan score < 70 and has fraud signals
  const needsProofOfLife =
    scanResult !== null &&
    scanResult !== undefined &&
    (scanResult.classificationScore < 70 || scanResult.fraudSignals.some((s) => s.severity === 'high'))

  const handleConfirmChange = useCallback((key: string, value: boolean | string) => {
    setConfirms((prev) => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (!doc?.mimeType) return
    const syntheticFile = new File([''], doc.fileName, { type: doc.mimeType })
    validateDocumentIntegrity(syntheticFile, spec.docType, confirms as Record<string, boolean>)
      .then(setIntegrity)
  }, [confirms, doc, spec.docType])

  const handleFileChange = useCallback(
    async (file: File) => {
      // Run integrity check + OCR scan in parallel with upload
      setScanPhase('pdf')
      setScanPct(10)

      const [intResult, scanRes] = await Promise.all([
        validateDocumentIntegrity(file, spec.docType, confirms as Record<string, boolean>),
        scanDocument(file, spec.docType, (phase, pct) => {
          setScanPhase(phase)
          setScanPct(pct)
        }),
      ])

      setScanPhase('done')
      setIntegrity(intResult)
      onScanResult(spec.docType, scanRes)

      // Persist progress
      updateDocProgress(spec.docType, {
        uploaded: true,
        trustScore: intResult.trustScore,
        fraudSignalCount: scanRes.fraudSignals.length,
        detectedDocType: scanRes.detectedDocType,
      })

      await onUpload(spec.docType, category, file)
      setJustUploaded(true)
      setTimeout(() => {
        setJustUploaded(false)
        setScanPhase(null)
      }, 2500)
    },
    [onUpload, onScanResult, spec.docType, category, confirms],
  )

  const cardBorder =
    !doc ? 'var(--border)' :
    integrity?.level === 'green' ? '#10b981' :
    integrity?.level === 'orange' ? '#f59e0b' :
    integrity?.level === 'red' ? '#ef4444' :
    '#3b82f6'

  const cardBg =
    !doc ? 'var(--surface-subtle)' :
    integrity?.level === 'green' ? 'rgba(16,185,129,0.04)' :
    integrity?.level === 'orange' ? 'rgba(245,158,11,0.04)' :
    integrity?.level === 'red' ? 'rgba(239,68,68,0.04)' :
    'var(--surface-card)'

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${justUploaded ? 'ring-2 ring-emerald-300' : ''}`}
      style={{ borderColor: cardBorder, backgroundColor: cardBg }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${doc ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            {doc ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <FileText className="w-5 h-5 text-slate-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.label}</p>
              {spec.required && <span className="text-xs text-red-500 font-bold">*</span>}
              <button onClick={() => setShowWhy((v) => !v)} className="p-0.5 rounded hover:opacity-70" title="Pourquoi ce document ?">
                <Info className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </div>

            {showWhy && (
              <div className="mt-1.5 rounded-lg px-3 py-2 text-xs"
                style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--text-secondary)' }}>
                <span className="font-semibold text-blue-600">Pourquoi ? </span>{spec.why}
                <p className="mt-1 italic" style={{ color: 'var(--text-tertiary)' }}>{spec.hint}</p>
              </div>
            )}

            {doc && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                {doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} Ko
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {doc && integrity && <TrustBadge result={integrity} />}
            {!doc && spec.required && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Requis</span>}
            {!doc && !spec.required && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Optionnel</span>}
            {doc && (
              <div className="flex gap-1">
                <a href={`${SERVER_BASE}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Voir">
                  <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                </a>
                <button onClick={() => onDelete(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Laser animation while scanning */}
        {scanPhase && scanPhase !== 'done' && (
          <div className="mt-3">
            <LaserScanAnimation phase={scanPhase} pct={scanPct} />
          </div>
        )}

        {/* Upload mini zone */}
        {!scanPhase && (
          <div className="mt-3">
            <div
              className={`flex items-center gap-2 rounded-xl border-2 border-dashed px-3 py-2.5 cursor-pointer transition-all hover:border-primary-300 hover:bg-primary-50/30 ${uploading ? 'opacity-60' : ''}`}
              style={{ borderColor: 'var(--border)' }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }}
                disabled={uploading}
              />
              {uploading
                ? <Loader className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0" />
                : <Upload className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              }
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {uploading ? 'Analyse...' : doc ? 'Remplacer · Scan IA automatique' : 'Déposer · Scan IA automatique'}
              </p>
            </div>
          </div>
        )}

        {/* Sensitive checklist */}
        {doc && spec.sensitive && (
          <SensitiveChecklist docType={spec.docType} confirms={confirms} onChange={handleConfirmChange} />
        )}

        {/* Proof of life for suspicious docs */}
        {doc && needsProofOfLife && proofOfLife && (
          <ProofOfLifeChallenge
            docLabel={spec.label}
            object={proofOfLife.object}
            provided={proofOfLife.provided}
            onPhotoProvided={(f) => onProofOfLifePhoto(spec.docType, f)}
          />
        )}

        {/* Scan result panel */}
        {doc && scanResult && (
          <ScanResultPanel scan={scanResult} integrityResult={integrity} />
        )}
      </div>
    </div>
  )
}

// ─── WizardStepBar ────────────────────────────────────────────────────────────

function WizardStepBar({ steps, currentStep, completedMap }: {
  steps: WizardStep[]
  currentStep: number
  completedMap: boolean[]
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
          {currentStep}/{steps.length}
        </span>
      </div>
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, i) => {
          const Icon = step.icon
          const done = completedMap[i]
          const active = i === currentStep - 1
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    done ? 'bg-emerald-500 shadow-lg' : active ? 'ring-2 ring-primary-500 ring-offset-2 shadow-md' : ''
                  }`}
                  style={{ backgroundColor: done ? undefined : active ? 'var(--brand, #4338ca)' : 'var(--surface-subtle)' }}
                >
                  {done
                    ? <CheckCircle className="w-5 h-5 text-white" />
                    : <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} style={{ color: active ? undefined : 'var(--text-tertiary)' }} />
                  }
                </div>
                <span className={`text-xs font-medium mt-1.5 ${active ? 'text-primary-600' : ''}`}
                  style={{ color: active ? undefined : 'var(--text-tertiary)' }}>
                  {step.shortLabel}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full" style={{ backgroundColor: done ? '#10b981' : 'var(--border)' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── DossierDashboard ─────────────────────────────────────────────────────────

interface DossierDashboardProps {
  documents: TenantDocument[]
  scanResults: Record<string, ScanResult>
  crossDocWarnings: string[]
  score: number
  hasVisale: boolean
  userLastName: string
  onBack: () => void
}

function DossierDashboard({
  documents, scanResults, crossDocWarnings, score, hasVisale, userLastName, onBack,
}: DossierDashboardProps) {
  const [generatingZip, setGeneratingZip] = useState(false)
  const strength = getStrength(score, hasVisale)
  const StrengthIcon = strength.icon

  const handleDownloadZip = async () => {
    if (documents.length === 0) return
    setGeneratingZip(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder('dossier_locataire')!
      const dateStr = new Date().toISOString().slice(0, 10)
      await Promise.all(documents.map(async (doc) => {
        try {
          const resp = await fetch(`${SERVER_BASE}${doc.fileUrl}`)
          if (!resp.ok) return
          const blob = await resp.blob()
          const ext = doc.fileName.split('.').pop() ?? 'pdf'
          const name = `${userLastName}_${doc.docType}_${dateStr}.${ext}`.replace(/[^a-zA-Z0-9_\-.]/g, '_')
          folder.file(name, blob)
        } catch { /* skip */ }
      }))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Dossier_${userLastName}_${dateStr}.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Archive téléchargée !')
    } catch {
      toast.error("Erreur lors de la génération de l'archive")
    } finally {
      setGeneratingZip(false)
    }
  }

  const getBadge = (docType: string): { label: string; color: string; bg: string; icon: React.ElementType } => {
    const scan = scanResults[docType]
    if (!scan) return { label: 'Non scanné', color: 'text-slate-500', bg: 'bg-slate-100', icon: FileText }
    if (scan.fraudSignals.some((s) => s.severity === 'high'))
      return { label: 'Suspect', color: 'text-red-600', bg: 'bg-red-100', icon: ShieldAlert }
    if (scan.fraudSignals.some((s) => s.severity === 'medium'))
      return { label: 'À vérifier', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle }
    if (scan.classificationScore >= 70)
      return { label: 'Certifié', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: FileCheck }
    return { label: 'Partiel', color: 'text-blue-600', bg: 'bg-blue-100', icon: AlertCircle }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-6"
        style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
        <div className="flex-shrink-0">
          <ScoreGauge score={score} />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Récapitulatif du dossier
            </h2>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${strength.bg} ${strength.color}`}>
            <StrengthIcon className="w-4 h-4" />
            Dossier {strength.label} — {documents.length} document{documents.length > 1 ? 's' : ''}
          </div>
          {crossDocWarnings.length > 0 && (
            <div className="rounded-xl px-3 py-2 bg-red-50 border border-red-200 space-y-1">
              {crossDocWarnings.map((w, i) => (
                <p key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {w}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documents by step */}
      {STEPS.map((step) => {
        const stepDocs = documents.filter((d) => d.category === step.id)
        if (stepDocs.length === 0) return null
        const Icon = step.icon
        return (
          <div key={step.id} className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
            <div className={`px-4 py-3 flex items-center gap-2 border-b ${step.accentBg}`}
              style={{ borderColor: 'var(--border)' }}>
              <Icon className={`w-4 h-4 ${step.accent}`} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{step.label}</h3>
              <span className="ml-auto text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {stepDocs.length} doc{stepDocs.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {stepDocs.map((doc) => {
                const badge = getBadge(doc.docType)
                const BadgeIcon = badge.icon
                const scan = scanResults[doc.docType]
                return (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <BadgeIcon className={`w-4 h-4 flex-shrink-0 ${badge.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {doc.fileName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {doc.docType} · {(doc.fileSize / 1024).toFixed(0)} Ko
                        {scan?.hasQrCode && ' · QR 2D-Doc ✓'}
                        {scan?.extractedFields.siret && ` · SIRET ${scan.extractedFields.siret}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${badge.bg} ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Footer actions */}
      <div className="rounded-2xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center">
            <Download className="w-5 h-5 text-fuchsia-600" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Télécharger l'archive complète (.zip)
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Dossier complet renommé — prêt à envoyer au propriétaire
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="btn btn-secondary flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Modifier
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={generatingZip || documents.length === 0}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            {generatingZip ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generatingZip ? 'Génération...' : 'Télécharger le ZIP'}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs px-1" style={{ color: 'var(--text-tertiary)' }}>
        <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        Dossier chiffré AES-256 · Accès réservé à vous et aux propriétaires contactés · Analyse locale — aucune donnée transmise à une IA externe
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DossierLocatif() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<TenantDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [view, setView] = useState<'wizard' | 'dashboard'>('wizard')

  // Scanner state
  const [scanResults, setScanResults] = useState<Record<string, ScanResult>>({})
  const [proofOfLife, setProofOfLife] = useState<Record<string, { object: string; provided: boolean }>>({})
  const [crossDocWarnings, setCrossDocWarnings] = useState<string[]>([])

  // Load documents + restore progress on mount
  useEffect(() => {
    setIsLoading(true)
    dossierService.getDocuments()
      .then(setDocuments)
      .catch(() => toast.error('Impossible de charger le dossier'))
      .finally(() => setIsLoading(false))

    const saved = loadProgress()
    if (saved.currentStep > 1) setCurrentStep(saved.currentStep)
  }, [])

  // Persist step to localStorage
  useEffect(() => {
    saveProgress({ currentStep })
  }, [currentStep])

  const score = computeScore(documents)
  const hasVisale = documents.some((d) => d.docType === 'ATTESTATION_VISALE')
  const strength = getStrength(score, hasVisale)
  const StrengthIcon = strength.icon

  const stepCompletedMap = useMemo(() => STEPS.map((step) => {
    const required = step.docs.filter((d) => d.required)
    if (required.length === 0) return documents.some((d) => d.category === step.id)
    return required.every((spec) =>
      documents.some((d) => d.category === step.id && d.docType === spec.docType),
    )
  }), [documents])

  const handleUpload = useCallback(async (docType: string, category: string, file: File) => {
    const key = `${category}:${docType}`
    setUploadingKey(key)
    try {
      const doc = await dossierService.uploadDocument(category, docType, file)
      setDocuments((prev) => {
        const filtered = prev.filter((d) => !(d.category === category && d.docType === docType))
        return [doc, ...filtered]
      })
      toast.success('Document ajouté et analysé ✓')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'upload"
      toast.error(msg)
    } finally {
      setUploadingKey(null)
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await dossierService.deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }, [])

  const handleScanResult = useCallback((docType: string, result: ScanResult) => {
    setScanResults((prev) => {
      const next = { ...prev, [docType]: result }

      // Cross-document coherence after scan
      const allResults = Object.entries(next).map(([dt, scan]) => ({ docType: dt, scan }))
      const warnings = checkCrossDocumentCoherence(allResults)
      setCrossDocWarnings(warnings)

      return next
    })

    // Generate proof-of-life challenge if suspicious
    const isHighRisk =
      result.classificationScore < 70 ||
      result.fraudSignals.some((s) => s.severity === 'high')
    if (isHighRisk) {
      setProofOfLife((prev) => {
        if (prev[docType]) return prev
        return { ...prev, [docType]: { object: generateProofOfLifeObject(), provided: false } }
      })
    }
  }, [])

  const handleProofOfLifePhoto = useCallback((docType: string, _file: File) => {
    setProofOfLife((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], provided: true },
    }))
    updateDocProgress(docType, { hasProofOfLife: true })
    toast.success('Photo de vérification enregistrée ✓')
  }, [])

  const handleMultiFiles = useCallback(async (files: File[], suggestedDocType?: string) => {
    const currentStepData = STEPS[currentStep - 1]
    if (suggestedDocType && files.length === 1) {
      await handleUpload(suggestedDocType, currentStepData.id, files[0])
      return
    }
    for (const file of files) {
      const classified = autoClassifyFilename(file.name)
      for (const step of STEPS) {
        const match = step.docs.find((d) => d.docType === classified)
        if (match) {
          await handleUpload(match.docType, step.id, file)
          break
        }
      }
    }
    if (files.length > 1) toast.success(`${files.length} fichiers classés automatiquement`)
  }, [currentStep, handleUpload])

  const handleConfirmDossier = () => {
    saveProgress({ confirmed: true, globalScore: score, crossDocWarnings })
    setView('dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeStep = STEPS[currentStep - 1]
  const ActiveIcon = activeStep.icon
  const stepDocs = activeStep.docs
  const requiredDocs = ALL_DOCS.filter((d) => d.required)
  const requiredUploaded = requiredDocs.filter((spec) =>
    documents.some((d) => d.category === spec.category && d.docType === spec.docType),
  ).length

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Mon Dossier Locatif
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {view === 'dashboard'
                ? 'Récapitulatif — vérification anti-fraude complète'
                : 'Wizard 5 étapes · Analyse OCR + forensique automatique'}
            </p>
          </div>
          {view === 'wizard' && (
            <button
              onClick={() => setView('dashboard')}
              className="btn btn-secondary flex items-center gap-2 text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Récapitulatif</span>
            </button>
          )}
        </div>

        {view === 'dashboard' ? (
          <DossierDashboard
            documents={documents}
            scanResults={scanResults}
            crossDocWarnings={crossDocWarnings}
            score={score}
            hasVisale={hasVisale}
            userLastName={user?.lastName ?? 'Locataire'}
            onBack={() => setView('wizard')}
          />
        ) : (
          <>
            {/* Score banner */}
            <div className="rounded-2xl border p-5 mb-6 flex flex-col sm:flex-row items-center gap-6"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <div className="flex-shrink-0">
                <ScoreGauge score={score} />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${strength.bg} ${strength.color}`}>
                  <StrengthIcon className="w-4 h-4" />
                  Dossier {strength.label}
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Documents : </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{documents.length}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Obligatoires : </span>
                    <span className={`font-semibold ${requiredUploaded === requiredDocs.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {requiredUploaded}/{requiredDocs.length}
                    </span>
                  </div>
                  {hasVisale && (
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <Shield className="w-4 h-4" /> Garantie Visale
                    </div>
                  )}
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                  <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${score}%`,
                      background: score >= 90 ? '#10b981' : score >= 65 ? '#3b82f6' : score >= 35 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  Accès réservé à vous et aux propriétaires que vous contactez · Chiffré AES-256
                </p>
              </div>
            </div>

            {/* Cross-doc warnings */}
            {crossDocWarnings.length > 0 && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 space-y-1">
                <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Incohérence entre documents détectée
                </p>
                {crossDocWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-red-600">{w}</p>
                ))}
              </div>
            )}

            {/* Wizard step bar */}
            <WizardStepBar steps={STEPS} currentStep={currentStep} completedMap={stepCompletedMap} />

            {/* Loading */}
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader className="w-10 h-10 text-primary-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Step intro */}
                <div className="rounded-2xl border p-5 mb-5"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activeStep.accentBg}`}>
                      <ActiveIcon className={`w-5 h-5 ${activeStep.accent}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Étape {currentStep} / {STEPS.length}
                      </p>
                      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{activeStep.headline}</h2>
                    </div>
                    {stepCompletedMap[currentStep - 1] && (
                      <div className="ml-auto flex items-center gap-1 text-sm text-emerald-600 font-semibold">
                        <CheckCircle className="w-4 h-4" /> Complète
                      </div>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{activeStep.intro}</p>
                </div>

                {/* Global SmartDropZone */}
                <div className="mb-5">
                  <SmartDropZone
                    onFiles={handleMultiFiles}
                    uploading={uploadingKey !== null}
                    stepDocs={stepDocs}
                  />
                </div>

                {/* Doc cards */}
                <div className="space-y-4">
                  {stepDocs.map((spec) => (
                    <DocCard
                      key={spec.docType}
                      spec={spec}
                      category={activeStep.id}
                      doc={documents.find((d) => d.category === activeStep.id && d.docType === spec.docType)}
                      onUpload={handleUpload}
                      onDelete={handleDelete}
                      uploading={uploadingKey === `${activeStep.id}:${spec.docType}`}
                      scanResult={scanResults[spec.docType] ?? null}
                      onScanResult={handleScanResult}
                      proofOfLife={proofOfLife[spec.docType]}
                      onProofOfLifePhoto={handleProofOfLifePhoto}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t"
                  style={{ borderTopColor: 'var(--border)' }}>
                  <button
                    onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                    disabled={currentStep === 1}
                    className="btn btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </button>

                  <div className="flex items-center gap-1.5">
                    {STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i + 1)}
                        className={`h-2 rounded-full transition-all ${i + 1 === currentStep ? 'w-5 bg-primary-500' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                      />
                    ))}
                  </div>

                  {currentStep < STEPS.length ? (
                    <button
                      onClick={() => setCurrentStep((s) => Math.min(STEPS.length, s + 1))}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      Suivant <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirmDossier}
                      disabled={documents.length === 0}
                      className="btn btn-primary flex items-center gap-2 disabled:opacity-40"
                    >
                      <FileCheck className="w-4 h-4" />
                      Confirmer mon dossier
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Disclaimer */}
            {!isLoading && (
              <div className="mt-6 rounded-xl border p-4 flex gap-3"
                style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                <Cpu className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Analyse 100 % locale</strong> — L'OCR, la détection QR et l'analyse forensique s'exécutent dans votre navigateur. Aucun contenu de document n'est envoyé à un serveur IA externe. Le score de confiance est indicatif et ne remplace pas la vérification humaine du propriétaire.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
