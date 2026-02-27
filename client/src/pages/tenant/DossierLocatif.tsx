/**
 * DossierLocatif.tsx — Wizard anti-fraude 5 étapes
 * Tunnel d'accompagnement pédagogique pour le dépôt de dossier locataire.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload, Trash2, CheckCircle, AlertCircle, FileText, User,
  Briefcase, TrendingUp, Home, Shield, Eye, Lock, Loader,
  Star, Award, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Download, ShieldAlert, ShieldCheck, AlertTriangle, Info,
  ScanLine, ZapOff,
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
import toast from 'react-hot-toast'

const SERVER_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:3000'

// ─── Data ─────────────────────────────────────────────────────────────────────

interface DocSpec {
  docType: string
  label: string
  hint: string
  why: string  // pedagogical explanation
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
    intro: 'Ces documents permettent au propriétaire de s\'assurer de votre identité réelle et d\'éviter les usurpations. Un dossier sans pièce d\'identité est systématiquement rejeté.',
    docs: [
      { docType: 'CNI', label: "Carte d'identité (recto/verso)", hint: "Valide, non expirée. Recto et verso sur la même page PDF.", why: "Preuve d'identité légale obligatoire.", required: true, weight: 3 },
      { docType: 'PASSEPORT', label: 'Passeport (page photo)', hint: "Page avec photo et données biométriques.", why: "Alternative à la CNI si vous avez un passeport valide.", required: false, weight: 2 },
      { docType: 'JUSTIFICATIF_DOMICILE', label: 'Justificatif de domicile', hint: "Facture EDF/eau/gaz ou avis de taxe, daté de moins de 3 mois.", why: "Atteste votre adresse actuelle, utilisée pour la correspondance.", required: true, weight: 2 },
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
    intro: 'Le propriétaire doit s\'assurer que vos revenus sont stables. Un CDI ou un statut d\'indépendant solide rassure davantage qu\'un CDD court. Ajoutez votre contrat pour maximiser vos chances.',
    docs: [
      { docType: 'CONTRAT_TRAVAIL', label: 'Contrat de travail', hint: "CDI, CDD, intérim ou convention de stage signée.", why: "Justifie la stabilité de votre emploi.", required: true, weight: 4 },
      { docType: 'ATTESTATION_EMPLOYEUR', label: "Attestation de l'employeur", hint: "Sur papier entête, précisant poste, date d'embauche et salaire.", why: "Confirme que vous êtes bien en poste à la date du dossier.", required: false, weight: 2 },
      { docType: 'DERNIER_BULLETIN', label: 'Dernier bulletin de salaire', hint: "Bulletin M-1, le plus récent.", why: "Permet de vérifier votre rémunération réelle.", required: true, weight: 3, sensitive: true },
      { docType: 'KBIS_SIRET', label: "Kbis / numéro SIRET", hint: "Pour travailleurs indépendants, auto-entrepreneurs.", why: "Preuve d'existence légale de votre entreprise.", required: false, weight: 2 },
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
    intro: 'La règle des "3× le loyer" est le critère principal. Vos bulletins des 3 derniers mois et vos avis d\'imposition sont les preuves les plus fiables de revenus réguliers et officiels.',
    docs: [
      { docType: 'BULLETIN_1', label: 'Bulletin de salaire M-1', hint: "Mois le plus récent.", why: "Revenu le plus récent — base du calcul de solvabilité.", required: true, weight: 3, sensitive: true },
      { docType: 'BULLETIN_2', label: 'Bulletin de salaire M-2', hint: "Avant-dernier mois.", why: "Confirme la régularité sur 2 mois.", required: true, weight: 3, sensitive: true },
      { docType: 'BULLETIN_3', label: 'Bulletin de salaire M-3', hint: "Il y a 3 mois.", why: "3 mois consécutifs = preuve de stabilité.", required: true, weight: 3, sensitive: true },
      { docType: 'AVIS_IMPOSITION_1', label: "Avis d'imposition N-1", hint: "Dernier avis reçu (ou avis de non-imposition).", why: "Certifie vos revenus officiels déclarés auprès des impôts.", required: true, weight: 4, sensitive: true },
      { docType: 'AVIS_IMPOSITION_2', label: "Avis d'imposition N-2", hint: "Avant-dernier avis.", why: "Démontre une stabilité sur 2 années fiscales.", required: false, weight: 2, sensitive: true },
      { docType: 'RELEVE_BANCAIRE', label: 'Relevés bancaires (3 mois)', hint: "Relevés complets des 3 derniers mois.", why: "Montre votre gestion financière quotidienne.", required: false, weight: 2 },
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
    intro: 'Vos quittances et attestations de bon paiement sont vos "références locatives". Un historique propre est l\'argument le plus rassurant pour un propriétaire. S\'il s\'agit de votre premier logement, précisez-le.',
    docs: [
      { docType: 'QUITTANCE_1', label: 'Quittance de loyer M-1', hint: "Quittance la plus récente, signée.", why: "Preuve de paiement à temps le mois dernier.", required: false, weight: 2 },
      { docType: 'QUITTANCE_2', label: 'Quittance de loyer M-2', hint: "Deuxième quittance.", why: "Régularité sur 2 mois.", required: false, weight: 2 },
      { docType: 'QUITTANCE_3', label: 'Quittance de loyer M-3', hint: "Troisième quittance.", why: "3 quittances consécutives = locataire fiable.", required: false, weight: 2 },
      { docType: 'ATTESTATION_PAIEMENT', label: 'Attestation de bon paiement', hint: "Délivrée par l'ancien propriétaire.", why: "Le meilleur signe de confiance pour votre futur propriétaire.", required: false, weight: 3 },
      { docType: 'ASSURANCE_HABITATION', label: "Assurance habitation en cours", hint: "Attestation d'assurance multirisque habitation valide.", why: "Prouve que vous assurez déjà votre logement (obligation légale).", required: false, weight: 2 },
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
    intro: 'La garantie Visale (Action Logement) est aujourd\'hui préférée à la caution parentale par beaucoup de propriétaires. Elle couvre les loyers impayés et est gratuite pour vous. Ajoutez-la pour maximiser votre score.',
    docs: [
      { docType: 'ATTESTATION_VISALE', label: 'Attestation Visale', hint: "Garantie Action Logement, très appréciée.", why: "Garantit les loyers impayés — remplace avantageusement la caution.", required: false, weight: 5 },
      { docType: 'ACTE_CAUTION', label: 'Acte de cautionnement solidaire', hint: "Document signé par le garant et le locataire.", why: "Engagement légal du garant à payer si vous ne le pouvez plus.", required: false, weight: 4 },
      { docType: 'CNI_GARANT', label: "Pièce d'identité du garant", hint: "CNI ou passeport valide du garant.", why: "Identifie légalement votre garant.", required: false, weight: 2 },
      { docType: 'BULLETINS_GARANT', label: 'Bulletins de salaire du garant', hint: "3 derniers bulletins de salaire.", why: "Prouve la solvabilité de votre garant.", required: false, weight: 3 },
      { docType: 'AVIS_IMPOSITION_GARANT', label: "Avis d'imposition du garant", hint: "Dernier avis d'imposition.", why: "Revenus officiels du garant sur l'année écoulée.", required: false, weight: 2 },
    ],
  },
]

const ALL_DOCS = STEPS.flatMap((s) => s.docs.map((d) => ({ ...d, category: s.id })))
const TOTAL_WEIGHT = ALL_DOCS.reduce((sum, d) => sum + d.weight, 0)

// ─── Score helpers ────────────────────────────────────────────────────────────

function computeScore(documents: TenantDocument[]): number {
  const uploadedWeight = ALL_DOCS.filter((spec) =>
    documents.some((d) => d.category === spec.category && d.docType === spec.docType)
  ).reduce((sum, spec) => sum + spec.weight, 0)
  return Math.round((uploadedWeight / TOTAL_WEIGHT) * 100)
}

function getStrength(score: number, hasVisale: boolean) {
  if (score >= 90 && hasVisale) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Award }
  if (score >= 65) return { label: 'Bon', color: 'text-blue-600', bg: 'bg-blue-100', icon: Star }
  if (score >= 35) return { label: 'Moyen', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertCircle }
  return { label: 'Faible', color: 'text-red-500', bg: 'bg-red-100', icon: AlertCircle }
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────

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

// ─── AnalysisPanel ────────────────────────────────────────────────────────────

function AnalysisPanel({ result }: { result: IntegrityResult }) {
  return (
    <div className="mt-2 rounded-xl border p-3 space-y-1.5" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Détails de l'analyse</p>
      {result.checks.filter((c) => c.passed !== 'na').map((check) => (
        <div key={check.id} className="flex items-start gap-2 text-xs">
          {check.passed === true
            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          }
          <div>
            <span style={{ color: 'var(--text-primary)' }}>{check.label}</span>
            {check.detail && <span className="ml-1" style={{ color: 'var(--text-tertiary)' }}>— {check.detail}</span>}
          </div>
        </div>
      ))}
      {result.flags.length > 0 && (
        <div className="pt-1 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
          {result.flags.map((flag, i) => (
            <p key={i} className="text-xs text-amber-600 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {flag}
            </p>
          ))}
        </div>
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
  const isTax    = ['AVIS_IMPOSITION_1', 'AVIS_IMPOSITION_2'].includes(docType)
  if (!isSalary && !isTax) return null

  return (
    <div className="mt-3 rounded-xl border p-3 space-y-3" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
        <ScanLine className="w-3.5 h-3.5" /> Checklist de vérification anti-fraude
      </p>

      {isSalary && (
        <>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
              checked={!!confirms['date_recent']}
              onChange={(e) => onChange('date_recent', e.target.checked)}
            />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Le bulletin est daté de moins de <strong>4 mois</strong>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
              checked={!!confirms['salary_ratio']}
              onChange={(e) => onChange('salary_ratio', e.target.checked)}
            />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Le ratio <strong>Net ÷ Brut</strong> est compris entre 72 % et 82 %
              <span className="block mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Formule : Net à Payer ÷ Salaire Brut × 100. Si &lt; 72 % ou &gt; 82 %, le document est suspect.
              </span>
            </span>
          </label>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-primary)' }}>
              SIRET de l'employeur <span style={{ color: 'var(--text-tertiary)' }}>(14 chiffres, optionnel)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 73282932000074"
              maxLength={14}
              className="input text-xs py-1.5"
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
              NIR (N° Sécurité Sociale) <span style={{ color: 'var(--text-tertiary)' }}>(15 chiffres, optionnel)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 1 85 06 69 001 234 56"
              maxLength={15}
              className="input text-xs py-1.5"
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
            <input
              type="checkbox"
              className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
              checked={!!confirms['date_recent']}
              onChange={(e) => onChange('date_recent', e.target.checked)}
            />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              L'avis est bien daté de l'année fiscale N-1 ou N-2 <strong>(non périmé)</strong>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
              checked={!!confirms['2ddoc_rf']}
              onChange={(e) => onChange('2ddoc_rf', e.target.checked)}
            />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Le document porte le <strong>filigrane "RF" (République Française)</strong> ou un QR code 2D-Doc
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

interface SmartDropZoneProps {
  onFiles: (files: File[], suggestedDocType?: string) => void
  uploading: boolean
  stepDocs: DocSpec[]
}

function SmartDropZone({ onFiles, uploading, stepDocs }: SmartDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (!files.length) return

      // Single file: try auto-classify within current step
      if (files.length === 1) {
        const classified = autoClassifyFilename(files[0].name)
        const inStep = classified ? stepDocs.find((d) => d.docType === classified) : undefined
        onFiles(files, inStep ? classified! : undefined)
        return
      }

      // Multi-file: group by auto-classify
      onFiles(files)
    },
    [onFiles, stepDocs]
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
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
        }}
        disabled={uploading}
      />
      {uploading ? (
        <Loader className="w-7 h-7 text-primary-500 animate-spin" />
      ) : (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface-subtle)' }}>
          <Upload className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      )}
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {uploading ? 'Envoi en cours...' : 'Glissez vos fichiers ici'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          ou <span className="text-primary-600 font-medium">cliquez pour parcourir</span>
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-placeholder)' }}>
          PDF, JPEG, PNG · 5 Mo max · Classement automatique par nom de fichier
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
}

function DocCard({ spec, category, doc, onUpload, onDelete, uploading }: DocCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showWhy, setShowWhy] = useState(false)
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null)
  const [confirms, setConfirms] = useState<Record<string, boolean | string>>({})
  const [justUploaded, setJustUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleConfirmChange = useCallback((key: string, value: boolean | string) => {
    setConfirms((prev) => {
      const next = { ...prev, [key]: value }
      // Re-run integrity check with updated confirms (if doc exists)
      return next
    })
  }, [])

  // Re-validate when confirms change
  useEffect(() => {
    if (!doc || !doc.mimeType) return
    // We don't have the File object anymore, so we create a synthetic result
    // based on stored doc info + user confirms
    const syntheticFile = new File([''], doc.fileName, { type: doc.mimeType })
    validateDocumentIntegrity(syntheticFile, spec.docType, confirms as Record<string, boolean>)
      .then(setIntegrity)
  }, [confirms, doc, spec.docType])

  const handleFileChange = useCallback(
    async (file: File) => {
      const result = await validateDocumentIntegrity(file, spec.docType, confirms as Record<string, boolean>)
      setIntegrity(result)
      await onUpload(spec.docType, category, file)
      setJustUploaded(true)
      setTimeout(() => setJustUploaded(false), 2000)
    },
    [onUpload, spec.docType, category, confirms]
  )

  // Border color based on state
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
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${justUploaded ? 'animate-pulse-once' : ''}`}
      style={{ borderColor: cardBorder, backgroundColor: cardBg }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${doc ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            {doc
              ? <CheckCircle className="w-5 h-5 text-emerald-600" />
              : <FileText className="w-5 h-5 text-slate-400" />
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {spec.label}
              </p>
              {spec.required && <span className="text-xs text-red-500 font-bold">*</span>}
              <button onClick={() => setShowWhy((v) => !v)} className="p-0.5 rounded hover:opacity-70 transition-opacity" title="Pourquoi ce document ?">
                <Info className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </div>

            {showWhy && (
              <div className="mt-1.5 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--text-secondary)' }}>
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

          {/* Actions */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {doc && integrity && <TrustBadge result={integrity} />}
            {!doc && spec.required && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Requis</span>
            )}
            {!doc && !spec.required && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Optionnel</span>
            )}

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

        {/* Upload zone */}
        <div className="mt-3">
          <div
            className={`flex items-center gap-2 rounded-xl border-2 border-dashed px-3 py-2.5 cursor-pointer transition-all hover:border-primary-300 hover:bg-primary-50/30 ${uploading ? 'opacity-60' : ''}`}
            style={{ borderColor: 'var(--border)' }}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }}
              disabled={uploading}
            />
            {uploading
              ? <Loader className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0" />
              : <Upload className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            }
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {uploading ? 'Envoi...' : doc ? 'Remplacer' : 'Déposer le fichier'}
            </p>
          </div>
        </div>

        {/* Sensitive checklist (shown when doc is uploaded) */}
        {doc && spec.sensitive && (
          <SensitiveChecklist docType={spec.docType} confirms={confirms} onChange={handleConfirmChange} />
        )}

        {/* Analysis panel */}
        {doc && integrity && (
          <button
            onClick={() => setShowAnalysis((v) => !v)}
            className="mt-2 flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {showAnalysis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Détails de l'analyse ({integrity.checks.filter((c) => c.passed !== 'na').length} vérifications)
          </button>
        )}
        {showAnalysis && integrity && <AnalysisPanel result={integrity} />}
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
      {/* Mobile: linear progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep) / steps.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
          {currentStep}/{steps.length}
        </span>
      </div>

      {/* Desktop: step dots */}
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
                    done ? 'bg-emerald-500 shadow-lg' :
                    active ? 'ring-2 ring-primary-500 ring-offset-2 shadow-md' :
                    ''
                  }`}
                  style={{
                    backgroundColor: done ? undefined : active ? 'var(--brand, #4338ca)' : 'var(--surface-subtle)',
                  }}
                >
                  {done
                    ? <CheckCircle className="w-5 h-5 text-white" />
                    : <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} style={{ color: active ? undefined : 'var(--text-tertiary)' }} />
                  }
                </div>
                <span className={`text-xs font-medium mt-1.5 ${active ? 'text-primary-600' : ''}`} style={{ color: active ? undefined : 'var(--text-tertiary)' }}>
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

// ─── ZipExport ────────────────────────────────────────────────────────────────

async function generateZip(documents: TenantDocument[], userLastName: string) {
  const zip = new JSZip()
  const folder = zip.folder('dossier_locataire')!
  const dateStr = new Date().toISOString().slice(0, 10)

  const fetchPromises = documents.map(async (doc) => {
    try {
      const url = `${SERVER_BASE}${doc.fileUrl}`
      const resp = await fetch(url)
      if (!resp.ok) return
      const blob = await resp.blob()
      const ext = doc.fileName.split('.').pop() ?? 'pdf'
      const safeName = `${userLastName}_${doc.docType}_${dateStr}.${ext}`.replace(/[^a-zA-Z0-9_\-.]/g, '_')
      folder.file(safeName, blob)
    } catch { /* skip */ }
  })

  await Promise.all(fetchPromises)
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Dossier_${userLastName}_${dateStr}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DossierLocatif() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<TenantDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [generatingZip, setGeneratingZip] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    dossierService
      .getDocuments()
      .then(setDocuments)
      .catch(() => toast.error('Impossible de charger le dossier'))
      .finally(() => setIsLoading(false))
  }, [])

  // Score
  const score = computeScore(documents)
  const hasVisale = documents.some((d) => d.docType === 'ATTESTATION_VISALE')
  const strength = getStrength(score, hasVisale)
  const StrengthIcon = strength.icon

  // Step completeness
  const stepCompletedMap = STEPS.map((step) => {
    const required = step.docs.filter((d) => d.required)
    if (required.length === 0) return documents.some((d) => d.category === step.id)
    return required.every((spec) =>
      documents.some((d) => d.category === step.id && d.docType === spec.docType)
    )
  })

  const handleUpload = useCallback(
    async (docType: string, category: string, file: File) => {
      const key = `${category}:${docType}`
      setUploadingKey(key)
      try {
        const doc = await dossierService.uploadDocument(category, docType, file)
        setDocuments((prev) => {
          const filtered = prev.filter((d) => !(d.category === category && d.docType === docType))
          return [doc, ...filtered]
        })
        toast.success('Document ajouté ✓')
      } catch (err: any) {
        toast.error(err.message || "Erreur lors de l'upload")
      } finally {
        setUploadingKey(null)
      }
    },
    []
  )

  const handleDelete = useCallback(async (id: string) => {
    try {
      await dossierService.deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }, [])

  // Smart multi-file handler for the global dropzone
  const handleMultiFiles = useCallback(
    async (files: File[], suggestedDocType?: string) => {
      const currentStepData = STEPS[currentStep - 1]

      if (suggestedDocType && files.length === 1) {
        await handleUpload(suggestedDocType, currentStepData.id, files[0])
        return
      }

      for (const file of files) {
        const classified = autoClassifyFilename(file.name)
        // Find which step / docType this belongs to
        for (const step of STEPS) {
          const match = step.docs.find((d) => d.docType === classified)
          if (match) {
            await handleUpload(match.docType, step.id, file)
            break
          }
        }
      }
      if (files.length > 1) toast.success(`${files.length} fichiers classés automatiquement`)
    },
    [currentStep, handleUpload]
  )

  const handleGenerateZip = async () => {
    if (documents.length === 0) {
      toast.error('Aucun document à exporter')
      return
    }
    setGeneratingZip(true)
    try {
      await generateZip(documents, user?.lastName ?? 'Locataire')
      toast.success('Dossier ZIP généré avec succès !')
    } catch {
      toast.error('Erreur lors de la génération du ZIP')
    } finally {
      setGeneratingZip(false)
    }
  }

  const activeStep = STEPS[currentStep - 1]
  const ActiveIcon = activeStep.icon
  const stepDocs = activeStep.docs

  const requiredDocs = ALL_DOCS.filter((d) => d.required)
  const requiredUploaded = requiredDocs.filter((spec) =>
    documents.some((d) => d.category === spec.category && d.docType === spec.docType)
  ).length

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Mon Dossier Locatif
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Suivez les 5 étapes pour constituer un dossier solide et certifié.
          </p>
        </div>

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
              <div
                className="h-1.5 rounded-full transition-all duration-700"
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
                />
              ))}
            </div>

            {/* ZIP export (step 5 or when dossier complete) */}
            {(currentStep === STEPS.length || score >= 80) && documents.length > 0 && (
              <div
                className="mt-6 rounded-2xl border p-5 flex flex-col sm:flex-row items-center gap-4"
                style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-fuchsia-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Générer mon dossier certifié (.zip)
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {documents.length} document{documents.length > 1 ? 's' : ''} renommés proprement · Prêt à envoyer
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateZip}
                  disabled={generatingZip}
                  className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {generatingZip
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />
                  }
                  {generatingZip ? 'Génération...' : 'Télécharger le ZIP'}
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderTopColor: 'var(--border)' }}>
              <button
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                disabled={currentStep === 1}
                className="btn btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>

              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i + 1)}
                    className={`w-2 h-2 rounded-full transition-all ${i + 1 === currentStep ? 'w-5 bg-primary-500' : 'bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>

              {currentStep < STEPS.length ? (
                <button
                  onClick={() => setCurrentStep((s) => Math.min(STEPS.length, s + 1))}
                  className="btn btn-primary flex items-center gap-2"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleGenerateZip}
                  disabled={generatingZip || documents.length === 0}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-40"
                >
                  {generatingZip ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Générer le ZIP
                </button>
              )}
            </div>
          </>
        )}

        {/* No-OCR notice */}
        {!isLoading && (
          <div className="mt-6 rounded-xl border p-4 flex gap-3"
            style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
            <ZapOff className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Analyse côté client uniquement</strong> — L'algorithme de vérification analyse les métadonnées et vous guide par checklist. Aucun contenu de document n'est envoyé à un serveur d'IA. Le score de confiance est indicatif et ne remplace pas la vérification humaine du propriétaire.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
