/**
 * DossierLocatif.tsx — v3.0 "Magic Drop"
 * Mode par défaut : dépôt en lot → scan OCR autonome → dashboard auto-généré.
 * Mode secondaire : wizard 5 étapes guidé (conservé pour flux guidé).
 *
 * Architecture :
 *  view = 'magic'   → MagicDropZone → FileScanCard[] → MagicDashboard
 *  view = 'wizard'  → WizardStepBar + DocCard[] (flux guidé existant)
 */
import {
  useState, useEffect, useRef, useCallback, useMemo, useId,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Trash2, CheckCircle, AlertCircle, FileText, User,
  Briefcase, TrendingUp, Home, Shield, Eye, Lock, Loader,
  Star, Award, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Download, ShieldAlert, ShieldCheck, AlertTriangle, Info,
  ScanLine, LayoutDashboard, FileCheck, XCircle, QrCode, Cpu,
  Sparkles, Layers, FileX, CheckSquare,
} from 'lucide-react'
import JSZip from 'jszip'
import { useAuth } from '../../hooks/useAuth'
import { Layout } from '../../components/layout/Layout'
import { dossierService, TenantDocument } from '../../services/dossierService'
import {
  validateDocumentIntegrity,
  IntegrityResult,
  luhnSiret,
  validateNIR,
} from '../../utils/validateDocumentIntegrity'
import {
  runIntelligence,
  assignDocTypeSlot,
  crossCheckSalaries,
  IntelligenceResult,
  FAMILY_LABELS,
  FAMILY_COLORS,
  type DocFamily,
} from '../../utils/DocumentIntelligence'
import { mapBulletinPeriod } from '../../utils/TemporalMapper'
import { matchIdentity, matchLevelIcon } from '../../utils/IdentityMatcher'
import { KanbanBoard, type KanbanEntry } from '../../components/dossier/KanbanBoard'
import { saveProgress, updateDocProgress } from '../../utils/progressState'
import toast from 'react-hot-toast'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ??
  'http://localhost:3000'

// ─── Static data (steps / doc specs) ─────────────────────────────────────────

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
  headline: string
  intro: string
  docs: DocSpec[]
}

const STEPS: WizardStep[] = [
  {
    id: 'IDENTITE', label: 'Identité & Profil', shortLabel: 'Identité',
    icon: User, accent: 'text-cyan-600', accentBg: 'bg-cyan-50',
    headline: 'Prouvez qui vous êtes',
    intro: "Ces documents permettent au propriétaire de s'assurer de votre identité réelle.",
    docs: [
      { docType: 'CNI',                  label: "Carte d'identité (recto/verso)", hint: 'Valide, non expirée.',               why: "Preuve d'identité légale.",          required: true,  weight: 3 },
      { docType: 'PASSEPORT',            label: 'Passeport (page photo)',          hint: 'Page biométrique.',                  why: 'Alternative à la CNI.',              required: false, weight: 2 },
      { docType: 'JUSTIFICATIF_DOMICILE',label: 'Justificatif de domicile',        hint: 'Facture EDF/eau, < 3 mois.',         why: 'Atteste votre adresse actuelle.',    required: true,  weight: 2 },
    ],
  },
  {
    id: 'SITUATION_PRO', label: 'Situation Professionnelle', shortLabel: 'Emploi',
    icon: Briefcase, accent: 'text-violet-600', accentBg: 'bg-violet-50',
    headline: 'Justifiez votre activité',
    intro: "Contrat de travail, attestation employeur et dernier bulletin — les 3 piliers.",
    docs: [
      { docType: 'CONTRAT_TRAVAIL',       label: 'Contrat de travail',              hint: 'CDI, CDD, alternance…',              why: 'Stabilité de l\'emploi.',            required: true,  weight: 4 },
      { docType: 'ATTESTATION_EMPLOYEUR', label: "Attestation de l'employeur",      hint: 'Sur papier entête.',                 why: 'Confirmation en poste.',             required: false, weight: 2 },
      { docType: 'DERNIER_BULLETIN',      label: 'Dernier bulletin de salaire',     hint: 'Bulletin M-1.',                      why: 'Rémunération réelle.',               required: true,  weight: 3, sensitive: true },
      { docType: 'KBIS_SIRET',            label: 'Kbis / numéro SIRET',            hint: 'Auto-entrepreneurs.',                why: 'Existence légale entreprise.',       required: false, weight: 2 },
    ],
  },
  {
    id: 'REVENUS', label: 'Ressources & Revenus', shortLabel: 'Revenus',
    icon: TrendingUp, accent: 'text-emerald-600', accentBg: 'bg-emerald-50',
    headline: 'Démontrez votre capacité financière',
    intro: "3 bulletins + 2 avis d'imposition = preuve de stabilité sur 2 ans.",
    docs: [
      { docType: 'BULLETIN_1',         label: 'Bulletin M-1',               hint: 'Mois le plus récent.',           why: 'Revenu le plus récent.',             required: true,  weight: 3, sensitive: true },
      { docType: 'BULLETIN_2',         label: 'Bulletin M-2',               hint: 'Avant-dernier mois.',            why: 'Régularité sur 2 mois.',             required: true,  weight: 3, sensitive: true },
      { docType: 'BULLETIN_3',         label: 'Bulletin M-3',               hint: 'Il y a 3 mois.',                 why: '3 mois = preuve de stabilité.',      required: true,  weight: 3, sensitive: true },
      { docType: 'AVIS_IMPOSITION_1',  label: "Avis d'imposition N-1",      hint: 'Dernier avis reçu.',             why: 'Revenus officiels déclarés.',        required: true,  weight: 4, sensitive: true },
      { docType: 'AVIS_IMPOSITION_2',  label: "Avis d'imposition N-2",      hint: 'Avant-dernier avis.',            why: 'Stabilité sur 2 années.',           required: false, weight: 2, sensitive: true },
      { docType: 'RELEVE_BANCAIRE',    label: 'Relevés bancaires (3 mois)', hint: 'Relevés complets.',              why: 'Gestion financière.',                required: false, weight: 2 },
    ],
  },
  {
    id: 'HISTORIQUE', label: 'Historique de Logement', shortLabel: 'Historique',
    icon: Home, accent: 'text-blue-600', accentBg: 'bg-blue-50',
    headline: 'Montrez que vous payez régulièrement',
    intro: "Vos quittances = vos «références locatives».",
    docs: [
      { docType: 'QUITTANCE_1',           label: 'Quittance M-1',                hint: 'Quittance la plus récente.',     why: 'Paiement à temps.',                  required: false, weight: 2 },
      { docType: 'QUITTANCE_2',           label: 'Quittance M-2',                hint: 'Deuxième quittance.',            why: 'Régularité sur 2 mois.',             required: false, weight: 2 },
      { docType: 'QUITTANCE_3',           label: 'Quittance M-3',                hint: 'Troisième quittance.',           why: '3 quittances = fiabilité.',          required: false, weight: 2 },
      { docType: 'ATTESTATION_PAIEMENT',  label: 'Attestation de bon paiement',  hint: "Délivrée par l'ancien proprio.", why: 'Meilleur signe de confiance.',       required: false, weight: 3 },
      { docType: 'ASSURANCE_HABITATION',  label: "Assurance habitation",         hint: "Attestation valide.",            why: 'Obligation légale.',                 required: false, weight: 2 },
    ],
  },
  {
    id: 'GARANTIES', label: 'Garanties & Cautions', shortLabel: 'Garanties',
    icon: Shield, accent: 'text-fuchsia-600', accentBg: 'bg-fuchsia-50',
    headline: 'Sécurisez votre candidature',
    intro: "La garantie Visale est gratuite et très appréciée des propriétaires.",
    docs: [
      { docType: 'ATTESTATION_VISALE',        label: 'Attestation Visale',               hint: 'Garantie Action Logement.',      why: 'Garantit les loyers impayés.',       required: false, weight: 5 },
      { docType: 'ACTE_CAUTION',              label: 'Acte de cautionnement solidaire',  hint: 'Document signé par le garant.',  why: 'Engagement légal du garant.',        required: false, weight: 4 },
      { docType: 'CNI_GARANT',                label: "Pièce d'identité du garant",       hint: 'CNI ou passeport.',              why: 'Identifie le garant.',               required: false, weight: 2 },
      { docType: 'BULLETINS_GARANT',          label: 'Bulletins du garant',              hint: '3 derniers bulletins.',          why: 'Solvabilité du garant.',             required: false, weight: 3 },
      { docType: 'AVIS_IMPOSITION_GARANT',    label: "Avis d'imposition du garant",      hint: "Dernier avis.",                  why: 'Revenus officiels du garant.',       required: false, weight: 2 },
    ],
  },
]

const ALL_DOCS = STEPS.flatMap((s) => s.docs.map((d) => ({ ...d, category: s.id })))
const TOTAL_WEIGHT = ALL_DOCS.reduce((sum, d) => sum + d.weight, 0)

function computeScore(docs: TenantDocument[]) {
  const w = ALL_DOCS.filter((spec) =>
    docs.some((d) => d.category === spec.category && d.docType === spec.docType),
  ).reduce((sum, spec) => sum + spec.weight, 0)
  return Math.round((w / TOTAL_WEIGHT) * 100)
}

function getStrength(score: number, hasVisale: boolean) {
  if (score >= 90 && hasVisale) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Award }
  if (score >= 65) return { label: 'Bon',    color: 'text-blue-600',   bg: 'bg-blue-100',   icon: Star }
  if (score >= 35) return { label: 'Moyen',  color: 'text-amber-600',  bg: 'bg-amber-100',  icon: AlertCircle }
  return               { label: 'Faible',  color: 'text-red-500',    bg: 'bg-red-100',    icon: AlertCircle }
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const R = 54, cx = 64, cy = 64
  const arc = Math.PI * R
  const offset = arc * (1 - Math.min(100, Math.max(0, score)) / 100)
  const color = score >= 90 ? '#10b981' : score >= 65 ? '#3b82f6' : score >= 35 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={128} height={72} viewBox="0 0 128 76">
      <path d="M 10 64 A 54 54 0 0 1 118 64" fill="none" stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
      <path d="M 10 64 A 54 54 0 0 1 118 64" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={arc} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={22} fontWeight="bold" fill={color}>{score}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">complétude</text>
    </svg>
  )
}

// ─── FileScanCard (magic mode — per-file animated card) ───────────────────────

type ScanPhase = 'queued' | 'pdf' | 'ocr' | 'qr' | 'uploading' | 'done' | 'error' | 'needs_confirm'

interface FileEntry {
  id: string
  file: File
  phase: ScanPhase
  phasePct: number
  scanResult: IntelligenceResult | null
  uploadedDoc: TenantDocument | null
  assignedDocType: string | null
  error?: string
  /** Live scan log lines shown in the kanban card terminal */
  scanLogs: string[]
  /** Human-readable period label for bulletins: "Janvier 2025 (M-1)" */
  temporalLabel?: string
  /** Identity match result summary: "✓ MRZ · Martin Paul" */
  identityLabel?: string
  identityMatchLevel?: string
}

function phaseLabel(e: FileEntry): string {
  switch (e.phase) {
    case 'queued':       return 'En attente…'
    case 'pdf':          return `Extraction texte PDF — ${e.phasePct}%`
    case 'ocr':          return `Reconnaissance optique (OCR) — ${e.phasePct}%`
    case 'qr':           return 'Détection QR code 2D-Doc…'
    case 'uploading':    return 'Envoi sécurisé…'
    case 'done':         return 'Analyse complète'
    case 'needs_confirm':return 'Confirmation du type…'
    case 'error':        return e.error ?? 'Erreur'
  }
}

function phaseColor(phase: ScanPhase): string {
  if (phase === 'done') return '#10b981'
  if (phase === 'error') return '#ef4444'
  return '#7c3aed'
}

function FileScanCard({ entry, index }: { entry: FileEntry; index: number }) {
  const isDone = entry.phase === 'done'
  const isError = entry.phase === 'error'
  const scan = entry.scanResult
  const family = scan?.docFamily ?? 'UNKNOWN'
  const colors = FAMILY_COLORS[family]
  const overallPct =
    entry.phase === 'queued'    ? 0 :
    entry.phase === 'pdf'       ? Math.round(entry.phasePct * 0.35) :
    entry.phase === 'ocr'       ? Math.round(35 + entry.phasePct * 0.4) :
    entry.phase === 'qr'        ? Math.round(75 + entry.phasePct * 0.1) :
    entry.phase === 'uploading' ? 88 :
    entry.phase === 'done'      ? 100 : 0

  const highRisk = scan?.fraudSignals.some((s) => s.severity === 'high')
  const medRisk  = scan?.fraudSignals.some((s) => s.severity === 'medium')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: isDone && highRisk ? '#fca5a5' : isDone && medRisk ? '#fcd34d' : isDone ? '#10b981' : 'var(--border)',
        boxShadow: isDone ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isDone ? (highRisk ? '#fee2e2' : '#d1fae5') : 'var(--surface-subtle)' }}>
          {isError  ? <FileX className="w-4.5 h-4.5 text-red-500" /> :
           isDone   ? <FileCheck className="w-4.5 h-4.5 text-emerald-600" /> :
                      <FileText className="w-4.5 h-4.5" style={{ color: 'var(--text-tertiary)' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{entry.file.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {(entry.file.size / 1024).toFixed(0)} Ko
            {entry.file.type === 'application/pdf' ? ' · PDF' : ' · Image'}
          </p>
        </div>

        {/* Family badge (animates in when detected) */}
        <AnimatePresence>
          {isDone && family !== 'UNKNOWN' && (
            <motion.span
              initial={{ opacity: 0, scale: 0, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${colors.bg} ${colors.text}`}
            >
              {FAMILY_LABELS[family]}
            </motion.span>
          )}
          {isDone && family === 'UNKNOWN' && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 bg-slate-100 text-slate-500"
            >
              Non reconnu
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-1">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <motion.div
            className="h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ background: `linear-gradient(90deg, ${phaseColor(entry.phase)}, ${phaseColor(entry.phase)}99)` }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{phaseLabel(entry)}</p>
      </div>

      {/* Extracted data snippet */}
      <AnimatePresence>
        {isDone && scan && (family === 'BULLETIN' || family === 'REVENUS_FISCAUX' || family === 'BANCAIRE') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-3"
          >
            <div className="rounded-xl px-3 py-2 text-xs space-y-0.5"
              style={{ backgroundColor: 'var(--surface-subtle)' }}>
              {scan.extractedData.netSalary && (
                <p style={{ color: 'var(--text-secondary)' }}>
                  Net : <strong style={{ color: 'var(--text-primary)' }}>{scan.extractedData.netSalary.toLocaleString('fr-FR')} €</strong>
                  {scan.extractedData.grossSalary && (
                    <> · Brut : <strong style={{ color: 'var(--text-primary)' }}>{scan.extractedData.grossSalary.toLocaleString('fr-FR')} €</strong></>
                  )}
                  {scan.extractedData.salaryRatio && (
                    <> · {(scan.extractedData.salaryRatio * 100).toFixed(0)} %</>
                  )}
                </p>
              )}
              {scan.extractedData.siret && (
                <p style={{ color: 'var(--text-secondary)' }} className="flex items-center gap-1">
                  {luhnSiret(scan.extractedData.siret)
                    ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                    : <XCircle className="w-3 h-3 text-red-500" />}
                  SIRET : <span className="font-mono">{scan.extractedData.siret}</span>
                </p>
              )}
              {scan.extractedData.fiscalRef && (
                <p style={{ color: 'var(--text-secondary)' }}>
                  RFR : <strong style={{ color: 'var(--text-primary)' }}>{scan.extractedData.fiscalRef.toLocaleString('fr-FR')} €</strong>
                </p>
              )}
              {scan.extractedData.ibanPrefix && (
                <p style={{ color: 'var(--text-secondary)' }}>
                  IBAN : <span className="font-mono">{scan.extractedData.ibanPrefix}</span>
                </p>
              )}
              {scan.hasQrCode && (
                <p className="flex items-center gap-1 text-cyan-600 font-semibold">
                  <QrCode className="w-3 h-3" /> QR code 2D-Doc détecté
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fraud signals */}
      <AnimatePresence>
        {isDone && scan && scan.fraudSignals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-4 pb-3 space-y-1"
          >
            {scan.fraudSignals.map((sig, i) => (
              <div key={i} className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg ${
                sig.severity === 'high' ? 'bg-red-50' : 'bg-amber-50'
              }`}>
                <AlertTriangle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${
                  sig.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                }`} />
                <span style={{ color: 'var(--text-primary)' }}>{sig.message}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confidence + slot */}
      {isDone && scan && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          {entry.assignedDocType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
              → {entry.assignedDocType}
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Confiance : {scan.confidence}%
            {scan.ocrUsed ? ' (OCR)' : ' (texte natif)'}
            {' · '}{scan.scanMs} ms
          </span>
        </div>
      )}

      {/* Scanning laser overlay */}
      {!isDone && !isError && entry.phase !== 'queued' && (
        <div className="relative mx-4 mb-3 h-10 rounded-xl overflow-hidden"
          style={{ backgroundColor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <motion.div
            className="absolute left-0 right-0 h-0.5 pointer-events-none"
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)',
              boxShadow: '0 0 10px 3px rgba(124,58,237,0.4)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <Cpu className="w-3.5 h-3.5 animate-pulse" style={{ color: '#7c3aed' }} />
            <span className="text-xs font-medium" style={{ color: '#7c3aed' }}>Analyse en cours…</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── MagicDropZone ────────────────────────────────────────────────────────────

function MagicDropZone({ onFiles, disabled }: {
  onFiles: (files: File[]) => void
  disabled?: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(pdf|jpe?g|png|webp)$/i.test(f.name),
    )
    if (files.length) onFiles(files)
  }, [onFiles])

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className="relative flex flex-col items-center justify-center gap-5 rounded-3xl cursor-pointer select-none overflow-hidden"
      style={{
        minHeight: 340,
        background: dragging
          ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.12))'
          : 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(59,130,246,0.06))',
        border: `2px dashed ${dragging ? '#7c3aed' : 'var(--border)'}`,
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
        transform: dragging ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
        disabled={disabled}
      />

      {/* Icon */}
      <motion.div
        animate={dragging ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.15))',
          border: '1.5px solid rgba(124,58,237,0.2)',
          boxShadow: '0 8px 32px rgba(124,58,237,0.15)',
        }}
      >
        {dragging
          ? <Sparkles className="w-9 h-9 text-violet-500" />
          : <Upload className="w-9 h-9 text-violet-400" />
        }
      </motion.div>

      {/* Text */}
      <div className="relative z-10 text-center px-8">
        <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {dragging ? 'Relâchez pour analyser' : 'Déposez tous vos documents'}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Bulletins, avis d'imposition, CNI, quittances… tout en une seule fois
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          ou <span className="text-violet-500 font-medium">cliquez pour parcourir</span>
          {' · '}PDF, JPEG, PNG · max 20 fichiers
        </p>
      </div>

      {/* Feature chips */}
      <div className="relative z-10 flex flex-wrap justify-center gap-2">
        {[
          { icon: Cpu,         text: 'OCR automatique' },
          { icon: ScanLine,    text: 'Anti-fraude silencieux' },
          { icon: Layers,      text: 'Classement auto' },
          { icon: Lock,        text: '100 % local' },
        ].map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <Icon className="w-3 h-3" /> {text}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// ─── MagicDashboard ───────────────────────────────────────────────────────────

interface DashSection {
  step: WizardStep
  uploaded: TenantDocument[]
  missing: DocSpec[]
  suspectCount: number
}

function MagicDashboard({
  documents, entries, crossDocWarnings, score, hasVisale, userLastName, onReset,
}: {
  documents: TenantDocument[]
  entries: FileEntry[]
  crossDocWarnings: string[]
  score: number
  hasVisale: boolean
  userLastName: string
  onReset: () => void
}) {
  const [generatingZip, setGeneratingZip] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const strength = getStrength(score, hasVisale)
  const StrengthIcon = strength.icon

  const sections: DashSection[] = useMemo(() => STEPS.map((step) => {
    const uploaded = documents.filter((d) => d.category === step.id)
    const missing = step.docs.filter(
      (spec) => !documents.some((d) => d.docType === spec.docType && d.category === step.id),
    )
    const suspectCount = entries.filter((e) =>
      e.assignedDocType && step.docs.some((spec) => spec.docType === e.assignedDocType) &&
      e.scanResult?.fraudSignals.some((s) => s.severity === 'high'),
    ).length
    return { step, uploaded, missing, suspectCount }
  }), [documents, entries])

  const handleDownloadZip = async () => {
    setGeneratingZip(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder('dossier_locataire')!
      const date = new Date().toISOString().slice(0, 10)
      await Promise.all(documents.map(async (doc) => {
        try {
          const r = await fetch(`${SERVER_BASE}${doc.fileUrl}`)
          if (!r.ok) return
          const blob = await r.blob()
          const ext = doc.fileName.split('.').pop() ?? 'pdf'
          const name = `${userLastName}_${doc.docType}_${date}.${ext}`.replace(/[^a-zA-Z0-9_\-.]/g, '_')
          folder.file(name, blob)
        } catch { /* skip */ }
      }))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href: url, download: `Dossier_${userLastName}_${date}.zip` }).click()
      URL.revokeObjectURL(url)
      toast.success('Archive téléchargée !')
    } catch {
      toast.error("Erreur lors de la génération")
    } finally {
      setGeneratingZip(false)
    }
  }

  const handleConfirm = () => {
    saveProgress({ confirmed: true, globalScore: score })
    setConfirmed(true)
    toast.success('Dossier confirmé ✓ — votre propriétaire peut maintenant le consulter.')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* Score header */}
      <div className="rounded-2xl border p-5 flex flex-col sm:flex-row items-center gap-5"
        style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
        <ScoreGauge score={score} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <LayoutDashboard className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Récapitulatif du dossier</h2>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${strength.bg} ${strength.color}`}>
            <StrengthIcon className="w-4 h-4" /> Dossier {strength.label} — {documents.length} document{documents.length > 1 ? 's' : ''}
          </div>
          {crossDocWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-700">{w}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ step, uploaded, missing, suspectCount }) => {
          const Icon = step.icon
          const allRequired = step.docs.filter((d) => d.required)
          const requiredDone = allRequired.filter((spec) =>
            uploaded.some((d) => d.docType === spec.docType),
          ).length
          const sectionScore = allRequired.length > 0
            ? Math.round((requiredDone / allRequired.length) * 100)
            : uploaded.length > 0 ? 100 : 0

          return (
            <motion.div
              key={step.id}
              layout
              className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
            >
              {/* Section header */}
              <div className={`px-4 py-3 flex items-center gap-2 ${step.accentBg} border-b`}
                style={{ borderColor: 'var(--border)' }}>
                <Icon className={`w-4 h-4 ${step.accent}`} />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{step.label}</span>
                <div className="ml-auto flex items-center gap-2">
                  {suspectCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                      ⚠ {suspectCount} suspect{suspectCount > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className={`text-xs font-bold ${
                    sectionScore === 100 ? 'text-emerald-600' :
                    sectionScore >= 50   ? 'text-amber-600' : 'text-red-500'
                  }`}>{sectionScore}%</span>
                </div>
              </div>

              {/* Uploaded docs */}
              {uploaded.map((doc) => {
                const entry = entries.find((e) => e.assignedDocType === doc.docType)
                const scan = entry?.scanResult
                const isHighRisk = scan?.fraudSignals.some((s) => s.severity === 'high')
                const isMedRisk  = scan?.fraudSignals.some((s) => s.severity === 'medium')
                return (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0"
                    style={{ borderColor: 'var(--border)' }}>
                    {isHighRisk  ? <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" /> :
                     isMedRisk   ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" /> :
                                   <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doc.fileName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {doc.docType}
                        {scan?.extractedData.netSalary ? ` · Net ${scan.extractedData.netSalary.toLocaleString('fr-FR')} €` : ''}
                        {scan?.hasQrCode ? ' · QR ✓' : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isHighRisk ? 'bg-red-100 text-red-600' :
                      isMedRisk  ? 'bg-amber-100 text-amber-600' :
                                   'bg-emerald-100 text-emerald-600'
                    }`}>
                      {isHighRisk ? 'Suspect' : isMedRisk ? 'À vérifier' : 'Certifié'}
                    </span>
                  </div>
                )
              })}

              {/* Missing required docs */}
              {missing.filter((s) => s.required).map((spec) => (
                <div key={spec.docType} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)', opacity: 0.7 }}>
                  <FileX className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{spec.label}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-red-50 text-red-500">Manquant</span>
                </div>
              ))}

              {uploaded.length === 0 && missing.filter((s) => s.required).length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>Aucun document obligatoire</p>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Action bar */}
      <div className="rounded-2xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
        <div className="flex-1">
          {confirmed
            ? <p className="text-emerald-600 font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Dossier confirmé — visible par votre propriétaire
              </p>
            : <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Tout est en ordre ? Confirmez pour rendre le dossier accessible.
              </p>
          }
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onReset}
            className="btn btn-secondary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Ajouter des fichiers
          </button>
          <button onClick={handleDownloadZip} disabled={generatingZip || documents.length === 0}
            className="btn btn-secondary flex items-center gap-2 text-sm disabled:opacity-40">
            {generatingZip ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Télécharger .zip
          </button>
          {!confirmed && (
            <button onClick={handleConfirm} disabled={documents.length === 0}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-40">
              <FileCheck className="w-4 h-4" /> Confirmer mon dossier
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        <Lock className="w-3 h-3 inline mr-1" />
        Chiffré AES-256 · Analyse 100 % locale · Aucune donnée transmise à une IA externe
      </p>
    </motion.div>
  )
}

// ─── Wizard sub-components (unchanged from v2) ────────────────────────────────

function SensitiveChecklist({ docType, confirms, onChange }: {
  docType: string
  confirms: Record<string, boolean | string>
  onChange: (k: string, v: boolean | string) => void
}) {
  const isSalary = ['BULLETIN_1','BULLETIN_2','BULLETIN_3','DERNIER_BULLETIN'].includes(docType)
  const isTax    = ['AVIS_IMPOSITION_1','AVIS_IMPOSITION_2'].includes(docType)
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
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-emerald-500"
              checked={!!confirms['date_recent']} onChange={(e) => onChange('date_recent', e.target.checked)} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Bulletin daté de moins de <strong>4 mois</strong>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-emerald-500"
              checked={!!confirms['salary_ratio']} onChange={(e) => onChange('salary_ratio', e.target.checked)} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Ratio <strong>Net ÷ Brut</strong> entre 72 % et 82 %
            </span>
          </label>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-primary)' }}>SIRET (14 chiffres)</label>
            <input type="text" placeholder="73282932000074" maxLength={14} className="input text-xs py-1.5"
              value={(confirms['siret_value'] as string) ?? ''}
              onChange={(e) => onChange('siret_value', e.target.value.replace(/\D/g, ''))} />
            {(confirms['siret_value'] as string)?.length === 14 && (
              <p className={`text-xs mt-0.5 ${luhnSiret(confirms['siret_value'] as string) ? 'text-emerald-600' : 'text-red-600'}`}>
                {luhnSiret(confirms['siret_value'] as string) ? '✓ SIRET valide' : '✗ SIRET invalide (Luhn)'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-primary)' }}>NIR (15 chiffres)</label>
            <input type="text" placeholder="185066900123456" maxLength={15} className="input text-xs py-1.5"
              value={(confirms['nir_value'] as string) ?? ''}
              onChange={(e) => onChange('nir_value', e.target.value.replace(/\D/g, ''))} />
            {(confirms['nir_value'] as string)?.length === 15 && (() => {
              const r = validateNIR(confirms['nir_value'] as string)
              return <p className={`text-xs mt-0.5 ${r.valid ? 'text-emerald-600' : 'text-red-600'}`}>{r.valid ? '✓ NIR valide' : `✗ ${r.reason}`}</p>
            })()}
          </div>
        </>
      )}
      {isTax && (
        <>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-emerald-500"
              checked={!!confirms['date_recent']} onChange={(e) => onChange('date_recent', e.target.checked)} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Avis N-1 ou N-2 (non périmé)</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-emerald-500"
              checked={!!confirms['2ddoc_rf']} onChange={(e) => onChange('2ddoc_rf', e.target.checked)} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Filigrane <strong>"RF"</strong> ou QR 2D-Doc présent</span>
          </label>
        </>
      )}
    </div>
  )
}

function WizardDocCard({ spec, category, doc, onUpload, onDelete, uploading }: {
  spec: DocSpec; category: string
  doc: TenantDocument | undefined
  onUpload: (docType: string, category: string, file: File) => Promise<void>
  onDelete: (id: string) => void
  uploading: boolean
}) {
  const [showWhy, setShowWhy] = useState(false)
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null)
  const [confirms, setConfirms] = useState<Record<string, boolean | string>>({})
  const [showAnalysis, setShowAnalysis] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!doc?.mimeType) return
    validateDocumentIntegrity(new File([''], doc.fileName, { type: doc.mimeType }), spec.docType, confirms as Record<string, boolean>)
      .then(setIntegrity)
  }, [confirms, doc, spec.docType])

  const borderColor = !doc ? 'var(--border)' :
    integrity?.level === 'green' ? '#10b981' : integrity?.level === 'orange' ? '#f59e0b' : integrity?.level === 'red' ? '#ef4444' : '#3b82f6'

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor, backgroundColor: 'var(--surface-card)' }}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${doc ? 'bg-emerald-100' : 'bg-slate-100'}`}>
          {doc ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <FileText className="w-5 h-5 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.label}</p>
            {spec.required && <span className="text-xs text-red-500 font-bold">*</span>}
            <button onClick={() => setShowWhy((v) => !v)} className="p-0.5 rounded hover:opacity-70">
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
          {doc && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} Ko</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {integrity && <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
            integrity.level === 'green' ? 'bg-emerald-100 text-emerald-700' :
            integrity.level === 'orange' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}>
            {integrity.level === 'green' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {integrity.trustScore}%
          </span>}
          {!doc && spec.required && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Requis</span>}
          {!doc && !spec.required && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Optionnel</span>}
          {doc && (
            <div className="flex gap-1">
              <a href={`${SERVER_BASE}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-slate-100"><Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /></a>
              <button onClick={() => onDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className={`flex items-center gap-2 rounded-xl border-2 border-dashed px-3 py-2.5 cursor-pointer transition-all hover:border-primary-300 ${uploading ? 'opacity-60' : ''}`}
          style={{ borderColor: 'var(--border)' }}
          onClick={() => !uploading && fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(spec.docType, category, f) }}
            disabled={uploading} />
          {uploading ? <Loader className="w-4 h-4 text-primary-500 animate-spin" /> : <Upload className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />}
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{uploading ? 'Envoi…' : doc ? 'Remplacer' : 'Déposer le fichier'}</p>
        </div>
      </div>
      {doc && spec.sensitive && <SensitiveChecklist docType={spec.docType} confirms={confirms} onChange={(k, v) => setConfirms((p) => ({ ...p, [k]: v }))} />}
      {doc && integrity && (
        <>
          <button onClick={() => setShowAnalysis((v) => !v)}
            className="mt-2 flex items-center gap-1.5 text-xs hover:opacity-80" style={{ color: 'var(--text-tertiary)' }}>
            {showAnalysis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Détails de l'analyse ({integrity.checks.filter((c) => c.passed !== 'na').length} vérifications)
          </button>
          {showAnalysis && (
            <div className="mt-2 rounded-xl border p-3 space-y-1.5" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
              {integrity.checks.filter((c) => c.passed !== 'na').map((check) => (
                <div key={check.id} className="flex items-start gap-2 text-xs">
                  {check.passed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                  <span style={{ color: 'var(--text-primary)' }}>{check.label}</span>
                  {check.detail && <span style={{ color: 'var(--text-tertiary)' }}>— {check.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function WizardStepBar({ steps, current, completed }: { steps: WizardStep[]; current: number; completed: boolean[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(current / steps.length) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#3b82f6)' }} />
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-tertiary)' }}>{current}/{steps.length}</span>
      </div>
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, i) => {
          const Icon = step.icon; const done = completed[i]; const active = i === current - 1
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${done ? 'bg-emerald-500 shadow-lg' : active ? 'ring-2 ring-primary-500 ring-offset-2 shadow-md' : ''}`}
                  style={{ backgroundColor: done ? undefined : active ? 'var(--brand,#4338ca)' : 'var(--surface-subtle)' }}>
                  {done ? <CheckCircle className="w-5 h-5 text-white" /> : <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} style={{ color: active ? undefined : 'var(--text-tertiary)' }} />}
                </div>
                <span className={`text-xs font-medium mt-1.5 ${active ? 'text-primary-600' : ''}`} style={{ color: active ? undefined : 'var(--text-tertiary)' }}>{step.shortLabel}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-0.5 mx-2 rounded-full" style={{ backgroundColor: done ? '#10b981' : 'var(--border)' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type AppMode = 'magic' | 'wizard'
type MagicPhase = 'drop' | 'scanning' | 'dashboard' | 'kanban'

// Max concurrent scans to avoid browser freeze
const MAX_CONCURRENT = 3

export default function DossierLocatif() {
  const { user } = useAuth()
  useId() // reserved for future stable key generation

  // Shared state
  const [documents, setDocuments] = useState<TenantDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mode, setMode] = useState<AppMode>('magic')

  // Magic mode state
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [magicPhase, setMagicPhase] = useState<MagicPhase>('drop')
  const [crossDocWarnings, setCrossDocWarnings] = useState<string[]>([])
  const assignedSlots = useRef<Set<string>>(new Set())

  // Confirmation dialog state (for needsConfirmation=true scans)
  const [pendingConfirm, setPendingConfirm] = useState<{
    id: string
    file: File
    scanResult: IntelligenceResult
  } | null>(null)
  const confirmResolveRef = useRef<((family: DocFamily | null) => void) | null>(null)

  // Wizard mode state
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  useEffect(() => {
    dossierService.getDocuments()
      .then(setDocuments)
      .catch(() => toast.error('Impossible de charger le dossier'))
      .finally(() => setIsLoading(false))
  }, [])

  // ── Core upload helper ─────────────────────────────────────────────────────
  const uploadFile = useCallback(async (docType: string, category: string, file: File): Promise<TenantDocument> => {
    const doc = await dossierService.uploadDocument(category, docType, file)
    setDocuments((prev) => {
      const filtered = prev.filter((d) => !(d.category === category && d.docType === docType))
      return [doc, ...filtered]
    })
    return doc
  }, [])

  // ── Magic mode: process one file ──────────────────────────────────────────
  const processEntry = useCallback(async (id: string, file: File) => {
    const logs: string[] = []
    const addLog = (line: string) => {
      logs.push(line)
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, scanLogs: [...logs] } : e))
    }
    const setPhase = (updates: Partial<FileEntry>) =>
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e))

    try {
      addLog('[INFO] Démarrage de l\'analyse...')

      // Scan with DocumentIntelligence (proximity anchors + metadata forensics)
      const scanResult = await runIntelligence(file, (phase, pct) => {
        setPhase({ phase: phase as ScanPhase, phasePct: pct })
        if (phase === 'pdf' && pct === 70) addLog('[OK] Texte PDF extrait')
        if (phase === 'ocr' && pct >= 95)  addLog('[OK] OCR terminé')
        if (phase === 'qr')                addLog('[INFO] Détection QR code 2D-Doc...')
      })

      // Log classification result
      if (scanResult.docFamily !== 'UNKNOWN') {
        addLog(`[OK] Famille détectée : ${scanResult.docFamily} (confiance ${scanResult.confidence}%)`)
      } else {
        addLog('[WARN] Document non reconnu (confiance trop faible)')
      }

      if (scanResult.certaintyTokenFound) {
        addLog(`[OK] Marqueur de certitude : "${scanResult.certaintyTokenFound}"`)
      }
      if (scanResult.pdfMetadata.isSuspect) {
        addLog(`[WARN] Metadata suspecte : ${scanResult.pdfMetadata.producer ?? 'outil inconnu'}`)
      }
      if (scanResult.hasQrCode) {
        addLog('[OK] QR code 2D-Doc détecté')
      }

      // SIRET validation log
      if (scanResult.extractedData.siret) {
        const siretValid = !scanResult.fraudSignals.some((s) => s.type === 'siret_invalid')
        addLog(siretValid
          ? `[OK] SIRET ${scanResult.extractedData.siret} — valide (Luhn)`
          : `[ERR] SIRET ${scanResult.extractedData.siret} — INVALIDE (Luhn)`
        )
      }

      // If confidence is 40–69%, ask the user to confirm the detected type
      let confirmedFamily = scanResult.docFamily
      if (scanResult.needsConfirmation) {
        addLog('[INFO] Confiance intermédiaire — confirmation requise')
        setPhase({ phase: 'needs_confirm', scanResult, scanLogs: [...logs] })
        const userChoice = await new Promise<DocFamily | null>((resolve) => {
          setPendingConfirm({ id, file, scanResult })
          confirmResolveRef.current = resolve
        })
        setPendingConfirm(null)
        if (userChoice === null) {
          setPhase({ phase: 'error', error: 'Document non confirmé — glissez-le à nouveau avec un nom explicite.' })
          return
        }
        confirmedFamily = userChoice
        scanResult.docFamily = confirmedFamily
        addLog(`[OK] Type confirmé manuellement : ${confirmedFamily}`)
      }

      // ── Temporal mapping for bulletins ─────────────────────────────────────
      let temporalLabel: string | undefined
      let finalDocType: string | null

      if (confirmedFamily === 'BULLETIN') {
        const period = mapBulletinPeriod(scanResult.rawText, assignedSlots.current)
        if (period) {
          temporalLabel = period.label
          finalDocType = period.slot
          if (finalDocType) assignedSlots.current.add(finalDocType)
          addLog(`[OK] Détection période : ${period.label}`)
        } else {
          finalDocType = assignDocTypeSlot(confirmedFamily, assignedSlots.current, scanResult.keywords)
          if (finalDocType) assignedSlots.current.add(finalDocType)
          addLog('[WARN] Période non détectée — slot séquentiel attribué')
        }
      } else {
        finalDocType = assignDocTypeSlot(confirmedFamily, assignedSlots.current, scanResult.keywords)
        if (finalDocType) assignedSlots.current.add(finalDocType)
      }

      // ── Identity matching for IDENTITE documents ───────────────────────────
      let identityLabel: string | undefined
      let identityMatchLevel: string | undefined

      if (confirmedFamily === 'IDENTITE' && (user?.firstName || user?.lastName)) {
        const idMatch = matchIdentity(
          scanResult.rawText,
          user?.firstName ?? '',
          user?.lastName ?? '',
        )
        identityMatchLevel = idMatch.matchLevel
        identityLabel = `${matchLevelIcon(idMatch.matchLevel)}${idMatch.mrzFound ? ' · MRZ' : ''}`
        addLog(idMatch.mrzFound
          ? `[OK] Zone MRZ détectée — ${idMatch.detail}`
          : `[INFO] ${idMatch.detail}`
        )
        if (idMatch.matchLevel === 'mismatch') {
          addLog('[WARN] Nom sur le document ≠ profil utilisateur')
        }
      }

      // Find category for this docType
      const specEntry = ALL_DOCS.find((d) => d.docType === finalDocType)
      const category = specEntry?.category ?? 'IDENTITE'

      addLog('[INFO] Envoi sécurisé...')
      setPhase({ phase: 'uploading', phasePct: 0, scanResult, assignedDocType: finalDocType, scanLogs: [...logs] })

      // Upload
      const uploadedDoc = finalDocType
        ? await uploadFile(finalDocType, category, file).catch(() => null)
        : null

      if (uploadedDoc) addLog('[OK] Document envoyé avec succès')
      else             addLog('[WARN] Envoi échoué ou ignoré (type non attribué)')

      if (finalDocType) {
        updateDocProgress(finalDocType, {
          uploaded: !!uploadedDoc,
          trustScore: scanResult.confidence,
          fraudSignalCount: scanResult.fraudSignals.length,
          detectedDocType: scanResult.docType,
        })
      }

      setPhase({
        phase: 'done',
        phasePct: 100,
        scanResult,
        assignedDocType: finalDocType,
        uploadedDoc,
        scanLogs: [...logs],
        temporalLabel,
        identityLabel,
        identityMatchLevel,
      })
    } catch (err) {
      setPhase({ phase: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue', scanLogs: [...logs] })
    }
  }, [uploadFile, user])

  // ── Magic mode: process all dropped files ─────────────────────────────────
  const handleMagicFiles = useCallback(async (files: File[]) => {
    const newEntries: FileEntry[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      phase: 'queued' as ScanPhase,
      phasePct: 0,
      scanResult: null,
      uploadedDoc: null,
      assignedDocType: null,
      scanLogs: [],
    }))

    setEntries((prev) => [...prev, ...newEntries])
    setMagicPhase('scanning')

    // Process with concurrency limit
    const queue = [...newEntries]
    const runNext = async (): Promise<void> => {
      const entry = queue.shift()
      if (!entry) return
      await processEntry(entry.id, entry.file)
      await runNext()
    }
    const workers = Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, runNext)
    await Promise.all(workers)

    // After all done: compute cross-doc warnings and switch to kanban
    setEntries((current) => {
      const completedScans = current
        .filter((e) => e.scanResult)
        .map((e) => e.scanResult!)
      const warnings = crossCheckSalaries(completedScans)
      setCrossDocWarnings(warnings)
      return current
    })
    setMagicPhase('kanban')
  }, [processEntry])

  // ── Wizard mode: upload ────────────────────────────────────────────────────
  const handleWizardUpload = useCallback(async (docType: string, category: string, file: File) => {
    setUploadingKey(`${category}:${docType}`)
    try {
      await uploadFile(docType, category, file)
      toast.success('Document ajouté ✓')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setUploadingKey(null)
    }
  }, [uploadFile])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await dossierService.deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document supprimé')
    } catch { toast.error('Erreur lors de la suppression') }
  }, [])

  // ── Kanban: move entry to another family (manual reclassification) ─────────
  const handleMoveEntry = useCallback(async (entryId: string, newFamily: DocFamily) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e
      const newDocType = assignDocTypeSlot(newFamily, new Set(
        prev.filter((x) => x.id !== entryId).map((x) => x.assignedDocType).filter(Boolean) as string[]
      ), e.scanResult?.keywords ?? [])
      // Note: backend update on reclassification requires re-upload via wizard mode
      const updatedResult = e.scanResult ? { ...e.scanResult, docFamily: newFamily, docType: newDocType } : null
      toast.success(`Reclassé → ${FAMILY_LABELS[newFamily]}`)
      return {
        ...e,
        scanResult: updatedResult,
        assignedDocType: newDocType,
        scanLogs: [...(e.scanLogs ?? []), `[INFO] Reclassé manuellement → ${FAMILY_LABELS[newFamily]}`],
      }
    }))
  }, [])

  const score = computeScore(documents)
  const hasVisale = documents.some((d) => d.docType === 'ATTESTATION_VISALE')
  const stepCompletedMap = useMemo(() => STEPS.map((step) => {
    const required = step.docs.filter((d) => d.required)
    if (!required.length) return documents.some((d) => d.category === step.id)
    return required.every((spec) => documents.some((d) => d.category === step.id && d.docType === spec.docType))
  }), [documents])

  const allDoneCount   = entries.filter((e) => e.phase === 'done').length
  const totalCount     = entries.length
  const isAllDone      = totalCount > 0 && allDoneCount === totalCount

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Mon Dossier Locatif</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {mode === 'magic'
                ? 'Mode Intelligent — déposez tout en une fois, l\'IA fait le reste'
                : 'Mode Guidé — suivez les 5 étapes'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === 'magic' ? 'wizard' : 'magic')}
              className="btn btn-secondary flex items-center gap-2 text-sm"
            >
              {mode === 'magic'
                ? <><Layers className="w-4 h-4" /> Mode guidé</>
                : <><Sparkles className="w-4 h-4" /> Magic Drop</>}
            </button>
            {mode === 'magic' && entries.length > 0 && magicPhase !== 'kanban' && (
              <button onClick={() => setMagicPhase('kanban')} className="btn btn-secondary text-sm flex items-center gap-2">
                <Layers className="w-4 h-4" /> Tableau
              </button>
            )}
          </div>
        </div>

        {/* ── MAGIC MODE ─────────────────────────────────────────────── */}
        {mode === 'magic' && (
          <>
            {/* Drop phase */}
            {magicPhase === 'drop' && (
              <MagicDropZone onFiles={handleMagicFiles} />
            )}

            {/* Scanning phase */}
            {magicPhase === 'scanning' && (
              <div className="space-y-4">
                {/* Global progress */}
                <div className="rounded-2xl border p-4 flex items-center gap-4"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Analyse en cours… {allDoneCount}/{totalCount} fichiers traités
                      </p>
                      {isAllDone && (
                        <button onClick={() => setMagicPhase('kanban')}
                          className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5">
                          <Layers className="w-3.5 h-3.5" /> Tableau de contrôle
                        </button>
                      )}
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                      <motion.div className="h-2 rounded-full" animate={{ width: `${(allDoneCount / Math.max(totalCount, 1)) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }} />
                    </div>
                  </div>
                  <Cpu className="w-7 h-7 text-violet-500 animate-pulse flex-shrink-0" />
                </div>

                {/* Drop zone to add more files */}
                <div className="rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 p-4 cursor-pointer hover:border-primary-300 transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'; input.multiple = true; input.accept = '.pdf,image/jpeg,image/png,image/webp'
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files ?? [])
                      if (files.length) handleMagicFiles(files)
                    }
                    input.click()
                  }}>
                  <Upload className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ajouter d'autres fichiers</span>
                </div>

                {/* File cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <AnimatePresence>
                    {entries.map((entry, i) => (
                      <FileScanCard key={entry.id} entry={entry} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Dashboard phase (legacy summary) */}
            {magicPhase === 'dashboard' && (
              <div className="space-y-5">
                {entries.length > 0 && (
                  <div className="rounded-2xl border p-4 flex items-center justify-between gap-4"
                    style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {allDoneCount} fichier{allDoneCount > 1 ? 's' : ''} analysé{allDoneCount > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {entries.filter((e) => e.scanResult?.docFamily !== 'UNKNOWN').length} reconnus ·
                        {' '}{entries.filter((e) => e.scanResult?.fraudSignals.some((s) => s.severity === 'high')).length} suspects
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setMagicPhase('kanban')}
                        className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5">
                        <Layers className="w-3.5 h-3.5" /> Tableau de contrôle
                      </button>
                      <button onClick={() => setMagicPhase('scanning')}
                        className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                        <Eye className="w-3.5 h-3.5" /> Détail scan
                      </button>
                    </div>
                  </div>
                )}
                <MagicDashboard
                  documents={documents}
                  entries={entries}
                  crossDocWarnings={crossDocWarnings}
                  score={score}
                  hasVisale={hasVisale}
                  userLastName={user?.lastName ?? 'Locataire'}
                  onReset={() => setMagicPhase(entries.length > 0 ? 'scanning' : 'drop')}
                />
              </div>
            )}

            {/* Kanban phase — Tableau de contrôle drag & drop */}
            {magicPhase === 'kanban' && (
              <div className="space-y-4">
                {/* Header bar */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border p-4"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      Tableau de contrôle — {entries.length} document{entries.length > 1 ? 's' : ''}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Glissez une carte vers une autre colonne pour la reclasser manuellement.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setMagicPhase('dashboard')}
                      className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" /> Récapitulatif
                    </button>
                    <button onClick={() => setMagicPhase('drop')}
                      className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                      <Upload className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  </div>
                </div>

                {/* Cross-doc warnings */}
                {crossDocWarnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1">
                    {crossDocWarnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Kanban board */}
                <KanbanBoard
                  entries={entries.map((e): KanbanEntry => ({
                    id: e.id,
                    file: e.file,
                    phase: e.phase,
                    confidence: e.scanResult?.confidence ?? 0,
                    docFamily: e.scanResult?.docFamily ?? 'UNKNOWN',
                    docType: e.scanResult?.docType ?? null,
                    assignedDocType: e.assignedDocType,
                    fraudSignalCount: e.scanResult?.fraudSignals.length ?? 0,
                    hasMediumRisk: e.scanResult?.fraudSignals.some((s) => s.severity === 'medium') ?? false,
                    hasHighRisk: e.scanResult?.fraudSignals.some((s) => s.severity === 'high') ?? false,
                    hasQrCode: e.scanResult?.hasQrCode ?? false,
                    ocrUsed: e.scanResult?.ocrUsed ?? false,
                    mrzFound: !!e.scanResult?.certaintyTokenFound,
                    temporalLabel: e.temporalLabel,
                    identityLabel: e.identityLabel,
                    scanLogs: e.scanLogs ?? [],
                  }))}
                  onMoveEntry={handleMoveEntry}
                />
              </div>
            )}
          </>
        )}

        {/* ── WIZARD MODE ────────────────────────────────────────────── */}
        {mode === 'wizard' && (
          <>
            {/* Score banner */}
            <div className="rounded-2xl border p-5 mb-6 flex flex-col sm:flex-row items-center gap-5"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <ScoreGauge score={score} />
              <div className="flex-1 space-y-2 w-full">
                {(() => {
                  const strength = getStrength(score, hasVisale)
                  const StrengthIcon = strength.icon
                  return (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${strength.bg} ${strength.color}`}>
                      <StrengthIcon className="w-4 h-4" /> Dossier {strength.label}
                    </div>
                  )
                })()}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span style={{ color: 'var(--text-tertiary)' }}>Documents : </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{documents.length}</span></div>
                  {hasVisale && <div className="flex items-center gap-1 text-emerald-600 font-semibold"><Shield className="w-4 h-4" /> Garantie Visale</div>}
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                  <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, background: score >= 90 ? '#10b981' : score >= 65 ? '#3b82f6' : score >= 35 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  <Lock className="w-3.5 h-3.5" /> Chiffré AES-256 · Accès réservé
                </p>
              </div>
            </div>

            <WizardStepBar steps={STEPS} current={currentStep} completed={stepCompletedMap} />

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader className="w-10 h-10 text-primary-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Step intro */}
                <div className="rounded-2xl border p-5 mb-5"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                  {(() => {
                    const step = STEPS[currentStep - 1]
                    const Icon = step.icon
                    return (
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.accentBg}`}>
                          <Icon className={`w-5 h-5 ${step.accent}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Étape {currentStep} / {STEPS.length}</p>
                          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{step.headline}</h2>
                        </div>
                        {stepCompletedMap[currentStep - 1] && (
                          <div className="flex items-center gap-1 text-sm text-emerald-600 font-semibold">
                            <CheckCircle className="w-4 h-4" /> Complète
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>{STEPS[currentStep - 1].intro}</p>
                </div>

                {/* Doc cards */}
                <div className="space-y-4 mb-8">
                  {STEPS[currentStep - 1].docs.map((spec) => (
                    <WizardDocCard
                      key={spec.docType} spec={spec}
                      category={STEPS[currentStep - 1].id}
                      doc={documents.find((d) => d.category === STEPS[currentStep - 1].id && d.docType === spec.docType)}
                      onUpload={handleWizardUpload}
                      onDelete={handleDelete}
                      uploading={uploadingKey === `${STEPS[currentStep - 1].id}:${spec.docType}`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t" style={{ borderTopColor: 'var(--border)' }}>
                  <button onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                    disabled={currentStep === 1}
                    className="btn btn-secondary flex items-center gap-2 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </button>
                  <div className="flex items-center gap-1.5">
                    {STEPS.map((_, i) => (
                      <button key={i} onClick={() => setCurrentStep(i + 1)}
                        className={`h-2 rounded-full transition-all ${i + 1 === currentStep ? 'w-5 bg-primary-500' : 'w-2 bg-slate-300 hover:bg-slate-400'}`} />
                    ))}
                  </div>
                  {currentStep < STEPS.length
                    ? <button onClick={() => setCurrentStep((s) => Math.min(STEPS.length, s + 1))}
                        className="btn btn-primary flex items-center gap-2">
                        Suivant <ChevronRight className="w-4 h-4" />
                      </button>
                    : <button onClick={() => { saveProgress({ confirmed: true, globalScore: score }); toast.success('Dossier confirmé ✓') }}
                        disabled={documents.length === 0}
                        className="btn btn-primary flex items-center gap-2 disabled:opacity-40">
                        <FileCheck className="w-4 h-4" /> Confirmer mon dossier
                      </button>
                  }
                </div>
              </>
            )}
          </>
        )}

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl border p-4 flex gap-3"
          style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
          <Cpu className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Analyse 100 % locale</strong> — OCR (tesseract.js), détection QR (jsqr), forensique metadata PDF et classification par ancrage textuel s'exécutent entièrement dans votre navigateur. Aucun document n'est transmis à un serveur externe. Le score de confiance est indicatif.
          </p>
        </div>
      </div>

      {/* ── Confirmation Modal (confidence 40–69%) ──────────────────────────── */}
      <AnimatePresence>
        {pendingConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="rounded-2xl border shadow-2xl max-w-md w-full p-6"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Confirmation du type de document
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Confiance : <span className="font-semibold text-amber-600">{pendingConfirm.scanResult.confidence}%</span>
                  </p>
                </div>
              </div>

              {/* Detection result */}
              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Nous avons détecté un{' '}
                  <strong>{FAMILY_LABELS[pendingConfirm.scanResult.docFamily]}</strong> dans le fichier :{' '}
                  <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {pendingConfirm.file.name}
                  </span>
                </p>
                {pendingConfirm.scanResult.matchedGroups.length > 0 && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Ancre détectée : {pendingConfirm.scanResult.matchedGroups[0]}
                  </p>
                )}
              </div>

              {/* Confirm button */}
              <button
                onClick={() => confirmResolveRef.current?.(pendingConfirm.scanResult.docFamily)}
                className="btn btn-primary w-full flex items-center justify-center gap-2 mb-2"
              >
                <CheckCircle className="w-4 h-4" />
                Oui, c'est bien un {FAMILY_LABELS[pendingConfirm.scanResult.docFamily]}
              </button>

              {/* Family picker — override */}
              <p className="text-xs text-center mb-2" style={{ color: 'var(--text-tertiary)' }}>
                ou sélectionnez le type correct :
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(Object.entries(FAMILY_LABELS) as [DocFamily, string][])
                  .filter(([f]) => f !== 'UNKNOWN' && f !== pendingConfirm.scanResult.docFamily)
                  .map(([family, label]) => {
                    const col = FAMILY_COLORS[family]
                    return (
                      <button
                        key={family}
                        onClick={() => confirmResolveRef.current?.(family)}
                        className={`text-xs font-medium px-3 py-2 rounded-lg border text-left truncate ${col.bg} ${col.text} ${col.border}`}
                      >
                        {label}
                      </button>
                    )
                  })}
              </div>

              {/* Cancel */}
              <button
                onClick={() => confirmResolveRef.current?.(null)}
                className="w-full text-xs py-2 rounded-lg"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <XCircle className="w-3.5 h-3.5 inline mr-1" />
                Annuler ce document
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
