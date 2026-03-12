/**
 * DossierLocatif.tsx — v8.0 "Slot Drop + IA définitive"
 *
 * Layout :
 *   PageHeader (progress bar + score + ZIP)
 *   ├── ChecklistPanel (lg:col-span-2)
 *   │   ├── HeroDropZone (en haut — toujours visible)
 *   │   └── 5 catégories accordéon
 *   └── SidePanel (lg:col-span-1) — idle tips / live scan console
 *
 * Nouveautés v7 :
 *   - HeroDropZone proéminente tout en haut
 *   - Suppression mode avancé (KanbanBoard)
 *   - Détection de doublons + DuplicateModal
 *   - Affichage données extraites (salaire, Visale, adresse…)
 *   - Training IA : corrections utilisateur persistées en localStorage
 */
import {
  useState, useEffect, useRef, useCallback, useMemo, useId,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Trash2, CheckCircle, CheckCircle2, AlertTriangle, User,
  Briefcase, TrendingUp, Home, Shield, Lock, Loader, Loader2, Star, Award,
  AlertCircle, Download, ShieldAlert, ShieldCheck, Info, Eye, X,
  Cpu, Sparkles, Layers, FileX, ChevronDown, ChevronUp, GripVertical,
} from 'lucide-react'
import {
  DndContext, useDraggable, useDroppable, DragOverlay, closestCenter,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { DossierWizard } from '../../components/dossier/DossierWizard'
import JSZip from 'jszip'
import { useAuth } from '../../hooks/useAuth'
import { Layout } from '../../components/layout/Layout'
import { dossierService, TenantDocument } from '../../services/dossierService'
import {
} from '../../utils/validateDocumentIntegrity'
import {
  runMultiSignalIntelligence, MultiSignalResult,
  assignDocTypeSlot, crossCheckSalaries,
  saveTrainingCorrection,
  FAMILY_LABELS, FAMILY_COLORS,
  type DocFamily, type ExtractedData,
} from '../../utils/DocumentIntelligence'
import { mapBulletinPeriod }              from '../../utils/TemporalMapper'
import { matchIdentity, matchLevelIcon }  from '../../utils/IdentityMatcher'
import { SignalBreakdown }                from '../../components/dossier/SignalBreakdown'
import { updateDocProgress } from '../../utils/progressState'
import toast from 'react-hot-toast'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ??
  'http://localhost:3000'

// ─── Category & slot definitions ──────────────────────────────────────────────

interface SlotSpec {
  docType:  string
  label:    string
  hint:     string
  why:      string
  required: boolean
  weight:   number
  sensitive?: boolean
}

interface DocCategory {
  id:    string
  label: string
  icon:  React.ElementType
  color: string
  accent: string
  accentBg: string
  slots: SlotSpec[]
}

const CATEGORIES: DocCategory[] = [
  {
    id: 'IDENTITE', label: 'Identité', icon: User,
    color: 'blue', accent: 'text-blue-600', accentBg: 'bg-blue-50',
    slots: [
      { docType: 'CNI_RECTO',      label: "CNI – Face avant",           hint: 'Face avec photo, nom, prénom.',  why: "Preuve d'identité légale (recto).", required: true,  weight: 5 },
      { docType: 'CNI_VERSO',     label: "CNI – Face arrière (MRZ)",   hint: 'Zone de lecture optique (MRZ).', why: "La MRZ valide l'authenticité du document.", required: true, weight: 4 },
      { docType: 'PASSEPORT',     label: 'Passeport',                  hint: 'Page biométrique.',             why: 'Alternative à la CNI.',           required: false, weight: 6 },
      { docType: 'TITRE_SEJOUR',  label: 'Titre de séjour',            hint: 'En cours de validité.',        why: "Séjour régulier sur le territoire.", required: false, weight: 6 },
    ],
  },
  {
    id: 'EMPLOI', label: 'Situation professionnelle', icon: Briefcase,
    color: 'violet', accent: 'text-blue-600', accentBg: 'bg-blue-50',
    slots: [
      { docType: 'CONTRAT_TRAVAIL',    label: 'Contrat de travail',      hint: 'CDI, CDD, alternance…',       why: "Stabilité de l'emploi.",          required: true,  weight: 7 },
      { docType: 'KBIS',               label: 'Extrait Kbis',            hint: '< 3 mois, auto-entrepreneur.', why: "Existence légale de l'entreprise.", required: false, weight: 5 },
      { docType: 'ATTESTATION_EMPLOI', label: 'Attestation employeur',   hint: 'Sur papier à en-tête.',       why: 'Confirmation en poste.',          required: false, weight: 4 },
    ],
  },
  {
    id: 'REVENUS', label: 'Revenus', icon: TrendingUp,
    color: 'emerald', accent: 'text-emerald-600', accentBg: 'bg-emerald-50',
    slots: [
      { docType: 'DERNIER_BULLETIN',  label: 'Dernier bulletin de salaire', hint: 'Bulletin M-1.',           why: 'Rémunération la plus récente.',   required: true,  weight: 5, sensitive: true },
      { docType: 'BULLETIN_1',        label: 'Bulletin M-1',               hint: 'Mois le plus récent.',     why: 'Revenu le plus récent.',          required: true,  weight: 5, sensitive: true },
      { docType: 'BULLETIN_2',        label: 'Bulletin M-2',               hint: 'Avant-dernier mois.',      why: 'Régularité sur 2 mois.',          required: true,  weight: 5, sensitive: true },
      { docType: 'BULLETIN_3',        label: 'Bulletin M-3',               hint: 'Il y a 3 mois.',           why: '3 bulletins = stabilité prouvée.',required: false, weight: 3, sensitive: true },
      { docType: 'AVIS_IMPOSITION_1', label: "Avis d'imposition (N-1)",   hint: 'Dernier avis reçu.',        why: 'Revenus officiels déclarés.',      required: true,  weight: 6, sensitive: true },
      { docType: 'AVIS_IMPOSITION_2', label: "Avis d'imposition (N-2)",   hint: 'Avant-dernier avis.',       why: 'Stabilité sur 2 années.',         required: false, weight: 3, sensitive: true },
    ],
  },
  {
    id: 'DOMICILE', label: 'Domicile', icon: Home,
    color: 'amber', accent: 'text-amber-600', accentBg: 'bg-amber-50',
    slots: [
      { docType: 'JUSTIFICATIF_DOMICILE', label: 'Justificatif de domicile', hint: 'Facture EDF/eau, < 3 mois.', why: 'Atteste votre adresse actuelle.', required: true,  weight: 4 },
      { docType: 'QUITTANCE_1',           label: 'Quittance de loyer',       hint: 'Quittance la plus récente.', why: 'Référence locative positive.',   required: false, weight: 2 },
      { docType: 'QUITTANCE_2',           label: 'Quittance précédente',     hint: '2e quittance.',              why: 'Régularité sur 2 mois.',         required: false, weight: 2 },
    ],
  },
  {
    id: 'GARANTIES', label: 'Garanties', icon: Shield,
    color: 'indigo', accent: 'text-[#007AFF]', accentBg: 'bg-[#e8f0fe]',
    slots: [
      { docType: 'ATTESTATION_VISALE',   label: 'Attestation Visale',        hint: 'Garantie Action Logement.',  why: 'Garantit les loyers impayés.',   required: false, weight: 5 },
      { docType: 'ACTE_CAUTION',         label: 'Acte de cautionnement',     hint: 'Signé par le garant.',       why: 'Engagement légal du garant.',    required: false, weight: 4 },
      { docType: 'ASSURANCE_HABITATION', label: 'Assurance habitation',      hint: 'Attestation valide.',        why: 'Obligation légale du locataire.', required: false, weight: 3 },
    ],
  },
]

const ALL_SLOTS      = CATEGORIES.flatMap((c) => c.slots.map((s) => ({ ...s, category: c.id })))
const REQ_SLOTS      = ALL_SLOTS.filter((s) => s.required)
const OPT_SLOTS      = ALL_SLOTS.filter((s) => !s.required)
// Required docs = 85 % of score, optional = 15 % bonus
const REQ_W          = REQ_SLOTS.reduce((sum, s) => sum + s.weight, 0)
const OPT_W          = OPT_SLOTS.reduce((sum, s) => sum + s.weight, 0)

function computeScore(docs: TenantDocument[]) {
  const uploaded = ALL_SLOTS.filter((s) => docs.some((d) => d.category === s.category && d.docType === s.docType))
  const reqDone  = uploaded.filter((s) => s.required).reduce((sum, s) => sum + s.weight, 0)
  const optDone  = uploaded.filter((s) => !s.required).reduce((sum, s) => sum + s.weight, 0)
  const base     = Math.min(85, Math.round((reqDone / REQ_W) * 85))
  const bonus    = Math.round((optDone / OPT_W) * 15)
  return Math.min(100, base + bonus)
}

function getStrength(score: number, hasVisale: boolean) {
  if (score >= 90 && hasVisale) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Award }
  if (score >= 65)              return { label: 'Bon',       color: 'text-blue-600',    bg: 'bg-blue-100',    icon: Star }
  if (score >= 35)              return { label: 'Moyen',     color: 'text-amber-600',   bg: 'bg-amber-100',   icon: AlertCircle }
  return                               { label: 'Faible',    color: 'text-red-500',     bg: 'bg-red-100',     icon: AlertCircle }
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const R = 54, cx = 64, cy = 64
  const arc    = Math.PI * R
  const offset = arc * (1 - Math.min(100, Math.max(0, score)) / 100)
  const color  = score >= 90 ? '#10b981' : score >= 65 ? '#3b82f6' : score >= 35 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={128} height={72} viewBox="0 0 128 76">
      <path d="M 10 64 A 54 54 0 0 1 118 64" fill="none" stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
      <path d="M 10 64 A 54 54 0 0 1 118 64" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={arc} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }} />
      <text x={cx} y={cy - 4}  textAnchor="middle" fontSize={22} fontWeight="bold" fill={color}>{score}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9}  fill="var(--text-tertiary)">complétude</text>
    </svg>
  )
}

// ─── FileEntry ────────────────────────────────────────────────────────────────

type ScanPhase = 'queued' | 'pdf' | 'ocr' | 'qr' | 'uploading' | 'done' | 'error' | 'needs_confirm'

interface FileEntry {
  id: string
  file: File
  phase: ScanPhase
  phasePct: number
  scanResult: MultiSignalResult | null
  uploadedDoc: TenantDocument | null
  assignedDocType: string | null
  error?: string
  scanLogs: string[]
  temporalLabel?: string
  identityLabel?: string
  identityMatchLevel?: string
}

// ─── DocumentRow ──────────────────────────────────────────────────────────────

function DocumentRow({
  slot, category, doc, scanEntry, serverBase,
  onUploadSlot, onDelete, onOpenWhy,
}: {
  slot: SlotSpec
  category: string
  doc: TenantDocument | undefined
  scanEntry: FileEntry | undefined
  serverBase: string
  onUploadSlot: (docType: string, category: string, file: File) => void
  onDelete: (id: string) => void
  onOpenWhy: (slot: SlotSpec) => void
}) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [isFileDragOver, setIsFileDragOver] = useState(false)

  const isScanning = !!scanEntry && scanEntry.phase !== 'done' && scanEntry.phase !== 'error'
  const isDone     = !!doc
  const isError    = scanEntry?.phase === 'error'

  const confidencePct = scanEntry?.scanResult?.confidence
  const confColor     = (p?: number) => !p ? '#86868b' : p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444'
  const hasHighRisk   = scanEntry?.scanResult?.fraudSignals.some((s) => s.severity === 'high')

  // ── DnD — draggable (only when doc is uploaded) ──────────────────────────
  const draggableId = doc ? `doc::${doc.id}` : ''
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: draggableId || '__disabled__',
    disabled: !doc || isScanning,
    data: { doc, fromCategory: category, fromDocType: slot.docType },
  })

  // ── DnD — droppable (always — accepts both file drops and doc reassignments) ─
  const droppableId = `slot::${category}::${slot.docType}`
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: droppableId,
    data: { toCategory: category, toDocType: slot.docType },
  })

  const setRef = useCallback((el: HTMLDivElement | null) => {
    setDragRef(el)
    setDropRef(el)
  }, [setDragRef, setDropRef])

  const isDragOver = isFileDragOver || isOver

  const handleSlotFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFileDragOver(false)
    if (isScanning) return
    // Only handle OS file drops — DnD kit handles doc-to-doc drops via DndContext
    if (e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0]
      if (/\.(pdf|jpe?g|png|webp)$/i.test(f.name)) onUploadSlot(slot.docType, category, f)
    }
  }

  const dragStyle = isDragging
    ? { opacity: 0.35, transform: CSS.Translate.toString(transform) }
    : transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      ref={setRef}
      style={dragStyle}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isScanning && e.dataTransfer.files.length > 0) setIsFileDragOver(true) }}
      onDragLeave={(e) => {
        e.stopPropagation()
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFileDragOver(false)
      }}
      onDrop={handleSlotFileDrop}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        isDragOver && !isScanning
          ? 'border-blue-400 bg-blue-50/60 shadow-md scale-[1.01]'
          : isScanning ? 'border-blue-200 bg-blue-50/40' :
            isDone && hasHighRisk ? 'border-red-200 bg-red-50/30' :
            isDone ? 'border-emerald-200 bg-emerald-50/30' :
            slot.required ? 'border-dashed border-slate-300 bg-[var(--surface-subtle)]' :
            'border-[var(--border)] bg-[var(--surface-subtle)] opacity-70'
      }`}
    >
      {/* Drag handle — only visible when doc is uploaded */}
      {isDone && !isScanning && (
        <div
          {...listeners}
          {...attributes}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded hover:bg-slate-100 transition-colors"
          title="Glisser vers un autre emplacement"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors" />
        </div>
      )}
      {/* Status icon */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm">
        {isScanning ? (
          <Loader className="w-4 h-4 text-blue-500 animate-spin" />
        ) : isDone && hasHighRisk ? (
          <ShieldAlert className="w-4 h-4 text-red-500" />
        ) : isDone ? (
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        ) : isError ? (
          <FileX className="w-4 h-4 text-red-400" />
        ) : slot.required ? (
          <span className="text-red-400 text-xs font-bold">✗</span>
        ) : (
          <span className="text-slate-300 text-xs">○</span>
        )}
      </div>

      {/* Label + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {slot.label}
          {slot.required && !isDone && <span className="text-red-400 ml-1 text-xs">*</span>}
        </p>
        {isScanning && (
          <p className="text-xs text-blue-500 animate-pulse">Analyse IA en cours…</p>
        )}
        {isDone && doc && (
          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
            {doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} Ko
          </p>
        )}
        {!isDone && !isScanning && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{slot.hint}</p>
        )}

        {/* Données extraites (depuis le résultat du scan) */}
        {isDone && scanEntry?.scanResult?.extractedData && (() => {
          const d = scanEntry.scanResult.extractedData
          const chips: { label: string; color: string }[] = []
          // Identité
          if (d.lastName || d.firstName)
            chips.push({ label: `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim(), color: 'bg-blue-50 text-blue-700' })
          if (d.birthDate)    chips.push({ label: `Né(e) ${d.birthDate}`, color: 'bg-blue-50 text-blue-600' })
          if (d.birthCity)    chips.push({ label: `📍 ${d.birthCity}`, color: 'bg-blue-50 text-blue-600' })
          // documentNumber and nationalNumber intentionally not shown (privacy)
          // Revenus
          if (d.netSalary)    chips.push({ label: `Net ${d.netSalary.toLocaleString('fr-FR')} €`, color: 'bg-emerald-50 text-emerald-700' })
          if (d.grossSalary)  chips.push({ label: `Brut ${d.grossSalary.toLocaleString('fr-FR')} €`, color: 'bg-blue-50 text-blue-700' })
          if (d.bulletinPeriod) chips.push({ label: d.bulletinPeriod, color: 'bg-blue-50 text-blue-600' })
          if (d.employerName) chips.push({ label: d.employerName.slice(0, 30), color: 'bg-slate-100 text-slate-600' })
          if (d.contractType) chips.push({ label: d.contractType, color: 'bg-[#e8f0fe] text-[#0055b3]' })
          if (d.cafAmount)    chips.push({ label: `CAF ${d.cafAmount.toLocaleString('fr-FR')} €`, color: 'bg-green-50 text-green-700' })
          if (d.areAmount)    chips.push({ label: `ARE ${d.areAmount.toLocaleString('fr-FR')} €`, color: 'bg-blue-50 text-blue-600' })
          if (d.pensionAmount) chips.push({ label: `Pension ${d.pensionAmount.toLocaleString('fr-FR')} €`, color: 'bg-amber-50 text-amber-700' })
          if (d.fiscalRef)    chips.push({ label: `RFR ${d.fiscalRef.toLocaleString('fr-FR')} €`, color: 'bg-amber-50 text-amber-700' })
          // Domicile
          if (d.issuerName)   chips.push({ label: d.issuerName, color: 'bg-slate-100 text-slate-600' })
          if (d.address)      chips.push({ label: `📍 ${d.address.slice(0, 40)}${d.address.length > 40 ? '…' : ''}`, color: 'bg-amber-50 text-amber-700' })
          // Visale / Garantie
          if (d.visaleAmount) chips.push({ label: `Visale ≤ ${d.visaleAmount} €/mois`, color: 'bg-blue-50 text-[#007AFF]' })
          if (d.visaNumber)   chips.push({ label: `Visa ${d.visaNumber}`, color: 'bg-fuchsia-50 text-fuchsia-700' })
          if (d.guarantorLastName || d.guarantorFirstName)
            chips.push({ label: `Garant : ${d.guarantorFirstName ?? ''} ${d.guarantorLastName ?? ''}`.trim(), color: 'bg-fuchsia-50 text-fuchsia-700' })
          if (!chips.length) return null
          return (
            <div className="mt-1 flex flex-wrap gap-1">
              {chips.map((c, i) => (
                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${c.color}`}>{c.label}</span>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {scanEntry?.temporalLabel && (
          <span className="text-[10px] bg-blue-50 text-[#007AFF] px-1.5 py-0.5 rounded-full font-medium">
            {scanEntry.temporalLabel.replace(/\s*\(.*\)/, '')}
          </span>
        )}
        {scanEntry?.identityLabel && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            scanEntry.scanResult?.certaintyTokenFound ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-600'
          }`}>{scanEntry.identityLabel}</span>
        )}
        {confidencePct !== undefined && isDone && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ color: confColor(confidencePct), backgroundColor: `${confColor(confidencePct)}18` }}>
            {Math.round(confidencePct)}%
          </span>
        )}
        {isDone && !slot.required && (
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Optionnel</span>
        )}
        {!isDone && !isScanning && !isError && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            slot.required ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'
          }`}>{slot.required ? 'Requis' : 'Optionnel'}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onOpenWhy(slot)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Pourquoi ce document ?">
          <Info className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
        </button>
        {isDone && doc && (
          <>
            <a href={`${serverBase}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Voir le document">
              <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            </a>
            <button onClick={() => onDelete(doc.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </>
        )}
        {!isDone && !isScanning && (
          <>
            <input ref={inputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { onUploadSlot(slot.docType, category, f); e.target.value = '' } }} />
            <button onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
              style={isDragOver
                ? { backgroundColor: 'rgba(124,58,237,0.12)', border: '1px solid #7c3aed', color: '#7c3aed' }
                : { backgroundColor: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <Upload className="w-3 h-3" />
              {isDragOver ? 'Relâcher ici' : 'Déposer'}
            </button>
          </>
        )}
        {isDone && isDragOver && !isScanning && (
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg animate-pulse">
            Remplacer
          </span>
        )}
      </div>
    </motion.div>
  )
}


// ─── WhyModal ─────────────────────────────────────────────────────────────────

function WhyModal({ slot, onClose }: { slot: SlotSpec; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{slot.label}</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}><span className="font-semibold text-blue-600">Pourquoi ? </span>{slot.why}</p>
        <p className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-tertiary)' }}>{slot.hint}</p>
        <button onClick={onClose} className="btn btn-secondary w-full mt-4 text-sm">Fermer</button>
      </motion.div>
    </div>
  )
}

// ─── DuplicateModal ────────────────────────────────────────────────────────────

function DuplicateModal({
  pending, onReplace, onKeepBoth, onCancel,
}: {
  pending: { assignedDocType: string; file: File; familyLabel: string }
  onReplace: () => void
  onKeepBoth: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 70 }}
      onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Fichier déjà ajouté</h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{pending.familyLabel}</p>
            </div>
          </div>
          <button onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-[var(--surface-subtle)] transition-colors flex-shrink-0 ml-2">
            <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>
        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Un document <strong>{pending.familyLabel}</strong> est déjà présent dans votre dossier.
            Que souhaitez-vous faire avec&nbsp;
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{pending.file.name}</span>&nbsp;?
          </p>
          <div className="space-y-2">
            <button onClick={onReplace}
              className="w-full py-3 px-4 rounded-2xl text-sm font-semibold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              Remplacer le document précédent
            </button>
            <button onClick={onKeepBoth}
              className="w-full py-3 px-4 rounded-2xl text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              Conserver les deux documents
            </button>
            <button onClick={onCancel}
              className="w-full py-2 text-xs transition-colors rounded-xl hover:bg-[var(--surface-subtle)]"
              style={{ color: 'var(--text-tertiary)' }}>
              Annuler l'ajout
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── ScannerModal — helpers ────────────────────────────────────────────────────

const FAMILY_ICONS: Record<DocFamily, string> = {
  BULLETIN: '💰', REVENUS_FISCAUX: '📊', IDENTITE: '🪪', DOMICILE: '🏠',
  EMPLOI: '💼', GARANTIE: '🛡️', BANCAIRE: '🏦', LOGEMENT: '🔑', UNKNOWN: '📄',
}

function scanProgressPct(entry: FileEntry): number {
  if (entry.phase === 'queued')          return 4
  if (entry.phase === 'pdf')             return 4 + Math.round(entry.phasePct * 0.31)
  if (entry.phase === 'ocr')             return 35 + Math.round(entry.phasePct * 0.40)
  if (entry.phase === 'qr')              return 80
  if (entry.phase === 'needs_confirm')   return 100
  if (entry.phase === 'uploading')       return 100
  if (entry.phase === 'done')            return 100
  return 0
}



// ─── ExtractedChips ────────────────────────────────────────────────────────────

function ExtractedChips({ data }: { data: ExtractedData }) {
  const chips: { label: string; color: string; icon?: string }[] = []

  // ── Identité ──────────────────────────────────────────────────────────────
  if (data.lastName || data.firstName)
    chips.push({ label: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(), color: 'bg-blue-100 text-blue-700', icon: '👤' })
  if (data.birthDate)
    chips.push({ label: `Né(e) le ${data.birthDate}`, color: 'bg-blue-50 text-blue-600', icon: '📅' })
  if (data.birthCity)
    chips.push({ label: `à ${data.birthCity}`, color: 'bg-blue-50 text-blue-600', icon: '🏙️' })
  if (data.documentExpiry)
    chips.push({ label: `Valide jusqu'au ${data.documentExpiry}`, color: 'bg-slate-100 text-slate-500' })
  if (data.nationality)
    chips.push({ label: `Nat. ${data.nationality}`, color: 'bg-blue-50 text-blue-500' })
  // Note: documentNumber and nationalNumber are NOT displayed for privacy/security reasons

  // ── Revenus / Bulletin ────────────────────────────────────────────────────
  if (data.netSalary)
    chips.push({ label: `Net ${data.netSalary.toLocaleString('fr-FR')} €`, color: 'bg-emerald-100 text-emerald-700', icon: '💰' })
  if (data.grossSalary)
    chips.push({ label: `Brut ${data.grossSalary.toLocaleString('fr-FR')} €`, color: 'bg-blue-100 text-blue-700' })
  if (data.bulletinPeriod)
    chips.push({ label: data.bulletinPeriod, color: 'bg-blue-50 text-blue-600', icon: '📆' })
  if (data.contractType)
    chips.push({ label: data.contractType, color: 'bg-[#d0e6ff] text-[#0055b3]' })
  if (data.employerName)
    chips.push({ label: data.employerName.slice(0, 28), color: 'bg-slate-100 text-slate-600', icon: '🏢' })
  if (data.siret)
    chips.push({ label: `SIRET ${data.siret}`, color: 'bg-slate-100 text-slate-500' })
  if (data.cafAmount)
    chips.push({ label: `CAF ${data.cafAmount.toLocaleString('fr-FR')} €/mois`, color: 'bg-green-100 text-green-700', icon: '🏦' })
  if (data.areAmount)
    chips.push({ label: `ARE ${data.areAmount.toLocaleString('fr-FR')} €/mois`, color: 'bg-blue-100 text-blue-600', icon: '🏦' })
  if (data.pensionAmount)
    chips.push({ label: `Pension ${data.pensionAmount.toLocaleString('fr-FR')} €/mois`, color: 'bg-amber-100 text-amber-700', icon: '🏦' })
  if (data.fiscalRef)
    chips.push({ label: `RFR ${data.fiscalRef.toLocaleString('fr-FR')} €`, color: 'bg-amber-100 text-amber-700', icon: '📊' })

  // ── Domicile ──────────────────────────────────────────────────────────────
  if (data.issuerName)
    chips.push({ label: data.issuerName, color: 'bg-slate-100 text-slate-500', icon: '📄' })
  if (data.address)
    chips.push({ label: `${data.address.slice(0, 40)}${data.address.length > 40 ? '…' : ''}`, color: 'bg-amber-100 text-amber-700', icon: '📍' })
  if (data.rentAmount)
    chips.push({ label: `Loyer ${data.rentAmount.toLocaleString('fr-FR')} €`, color: 'bg-orange-100 text-orange-700' })

  // ── Visale / Garantie ─────────────────────────────────────────────────────
  if (data.visaleAmount)
    chips.push({ label: `Visale ≤ ${data.visaleAmount} €/mois`, color: 'bg-blue-50 text-[#007AFF]', icon: '🛡️' })
  if (data.visaleDuration)
    chips.push({ label: data.visaleDuration, color: 'bg-blue-50 text-blue-600' })
  if (data.visaNumber)
    chips.push({ label: `Visa ${data.visaNumber}`, color: 'bg-fuchsia-100 text-fuchsia-700', icon: '🔑' })

  // ── Garant ────────────────────────────────────────────────────────────────
  if (data.guarantorLastName || data.guarantorFirstName)
    chips.push({ label: `Garant : ${data.guarantorFirstName ?? ''} ${data.guarantorLastName ?? ''}`.trim(), color: 'bg-fuchsia-100 text-fuchsia-700', icon: '🤝' })
  if (data.guarantorAddress)
    chips.push({ label: data.guarantorAddress.slice(0, 40), color: 'bg-fuchsia-50 text-fuchsia-600', icon: '📍' })

  // ── Bancaire ──────────────────────────────────────────────────────────────
  if (data.ibanPrefix)
    chips.push({ label: `IBAN ${data.ibanPrefix}`, color: 'bg-teal-100 text-teal-700', icon: '🏛️' })

  if (!chips.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map((c, i) => (
        <span key={i} className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${c.color}`}>
          {c.icon && <span className="mr-0.5">{c.icon}</span>}{c.label}
        </span>
      ))}
    </div>
  )
}

// ─── ScanningView ──────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<ScanPhase, string> = {
  queued:        'Préparation du document…',
  pdf:           'Extraction du texte PDF…',
  ocr:           'Lecture OCR en cours…',
  qr:            'Détection QR code…',
  uploading:     'Envoi sécurisé…',
  done:          'Terminé',
  error:         'Erreur',
  needs_confirm: 'En attente…',
}

function ScanningView({ entry }: { entry: FileEntry }) {
  const pct = scanProgressPct(entry)
  const label = PHASE_LABELS[entry.phase] ?? 'Analyse IA en cours…'
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 space-y-5">
      {/* Icon + label */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }} />
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed22, #a78bfa22)' }}>
            <Cpu className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Analyse IA en cours…</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
        />
        <motion.div
          className="absolute inset-y-0 w-16 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' }}
          animate={{ x: ['-64px', '500px'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <p className="text-center text-xs font-medium tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
        {Math.round(pct)} %
      </p>
    </motion.div>
  )
}

// ─── ResultView ────────────────────────────────────────────────────────────────

function ResultView({
  scanResult, onConfirm, onCancel,
}: {
  scanResult: MultiSignalResult
  onConfirm: (family: DocFamily) => void
  onCancel:  () => void
}) {
  const [selectedFamily, setSelectedFamily] = useState<DocFamily>(scanResult.docFamily)
  // Seuil 90% : en-dessous → picker direct, au-dessus → simple confirmation oui/non
  const [showPicker, setShowPicker] = useState(scanResult.confidence < 90 && !scanResult.certaintyTokenFound)
  const colors     = FAMILY_COLORS[scanResult.docFamily]
  // ≥90% OU marqueur de certitude → mode confirmation simple
  const isHighConf = scanResult.confidence >= 90 || !!scanResult.certaintyTokenFound
  const families: DocFamily[] = [
    'BULLETIN','REVENUS_FISCAUX','IDENTITE','DOMICILE',
    'EMPLOI','GARANTIE','BANCAIRE','LOGEMENT','UNKNOWN',
  ]

  const confColor = scanResult.confidence >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : scanResult.confidence >= 70 ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {/* Résultat IA */}
      <div className={`rounded-2xl p-4 border ${colors.bg} ${colors.border}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
            {FAMILY_ICONS[scanResult.docFamily]}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-medium uppercase tracking-wide ${colors.text} opacity-70`}>
              {isHighConf ? 'Détecté avec haute confiance :' : 'Détecté (confirmation requise) :'}
            </p>
            <p className={`text-base font-bold ${colors.text}`}>{FAMILY_LABELS[scanResult.docFamily]}</p>
          </div>
          <span className={`text-sm font-bold px-2.5 py-1 rounded-xl flex-shrink-0 border ${confColor}`}>
            {Math.round(scanResult.confidence)}%
          </span>
        </div>
        {scanResult.certaintyTokenFound && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            Certifié par marqueur {scanResult.certaintyTokenFound.toUpperCase()}
          </div>
        )}
        {!isHighConf && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Confiance &lt; 90 % — veuillez choisir la bonne catégorie ci-dessous.
          </div>
        )}
        <ExtractedChips data={scanResult.extractedData} />
      </div>
      {/* Signaux fraude */}
      {scanResult.fraudSignals.length > 0 && (
        <div className="space-y-1.5">
          {scanResult.fraudSignals.map((sig, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-xl ${
              sig.severity === 'high'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {sig.message}
            </div>
          ))}
        </div>
      )}
      {/* Confirmation ≥90% : simple oui/non */}
      {isHighConf && !showPicker ? (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-center font-medium" style={{ color: 'var(--text-secondary)' }}>
            Est-ce bien le bon document ?
          </p>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => onConfirm(selectedFamily)}
            className="w-full py-3 px-4 rounded-2xl text-sm font-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            ✓ Oui, c'est bien {FAMILY_LABELS[scanResult.docFamily]}
          </motion.button>
          <button onClick={() => setShowPicker(true)}
            className="w-full text-xs py-1.5 transition-colors" style={{ color: 'var(--text-tertiary)' }}>
            Non, ce n'est pas la bonne catégorie →
          </button>
        </div>
      ) : (
        /* Picker <90% OU correction manuelle */
        <div className="space-y-2.5 pt-1">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
            {showPicker && isHighConf
              ? 'Choisir la catégorie correcte :'
              : 'Dans quelle catégorie classer ce document ?'}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {families.map((f) => {
              const fc = FAMILY_COLORS[f]
              return (
                <button key={f} onClick={() => setSelectedFamily(f)}
                  className={`text-[11px] py-2 px-1 rounded-xl font-medium border transition-all text-center leading-tight ${
                    selectedFamily === f ? `${fc.bg} ${fc.text} ${fc.border} border` : 'border-[var(--border)]'
                  }`}
                  style={selectedFamily === f ? {} : { backgroundColor: 'var(--surface-subtle)', color: 'var(--text-secondary)' }}>
                  {FAMILY_ICONS[f]}<br /><span>{FAMILY_LABELS[f]}</span>
                </button>
              )
            })}
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => onConfirm(selectedFamily)}
            className="w-full py-3 px-4 rounded-2xl text-sm font-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            Confirmer — {FAMILY_LABELS[selectedFamily]}
          </motion.button>
          {showPicker && isHighConf && (
            <button onClick={() => setShowPicker(false)}
              className="w-full text-xs py-1" style={{ color: 'var(--text-tertiary)' }}>
              ← Retour à la confirmation automatique
            </button>
          )}
          <button onClick={onCancel} className="w-full text-xs py-1 transition-colors" style={{ color: 'var(--text-tertiary)' }}>
            Annuler
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Upload / Done / Error views ───────────────────────────────────────────────

function UploadingView() {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Envoi sécurisé en cours…</p>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>100 % local · chiffré TLS</p>
    </div>
  )
}

function DoneView({ entry }: { entry: FileEntry }) {
  const family = entry.scanResult?.docFamily
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </motion.div>
      <p className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>Document enregistré !</p>
      {family && family !== 'UNKNOWN' && (
        <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          Ajouté dans la catégorie <strong>{FAMILY_LABELS[family]}</strong>
        </p>
      )}
    </div>
  )
}

function ErrorView({ error, onCancel }: { error?: string; onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm font-medium text-center" style={{ color: 'var(--text-primary)' }}>
        {error ?? "Erreur lors de l'analyse"}
      </p>
      <button onClick={onCancel} className="btn btn-secondary text-sm">Fermer</button>
    </div>
  )
}

// ─── ScannerModal ──────────────────────────────────────────────────────────────

function ScannerModal({
  entry, pendingConfirm, onConfirm, onCancel, queueInfo,
}: {
  entry:         FileEntry
  pendingConfirm: { id: string; file: File; scanResult: MultiSignalResult } | null
  onConfirm:     (family: DocFamily) => void
  onCancel:      () => void
  queueInfo:     { current: number; total: number }
}) {
  const isScanning  = ['queued','pdf','ocr','qr'].includes(entry.phase)
  const isResult    = entry.phase === 'needs_confirm' && !!pendingConfirm
  const isUploading = entry.phase === 'uploading'
  const isDone      = entry.phase === 'done'
  const isError     = entry.phase === 'error'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {entry.file.name}
              </p>
              {queueInfo.total > 1 && (
                <span className="text-[10px] bg-blue-50 text-[#007AFF] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  {queueInfo.current}/{queueInfo.total}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {(entry.file.size / 1024).toFixed(0)} Ko
            </p>
          </div>
          {(isScanning || isDone || isError) && (
            <button onClick={onCancel}
              className="p-1.5 ml-2 rounded-xl hover:bg-[var(--surface-subtle)] transition-colors flex-shrink-0">
              <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}
        </div>
        {/* Body */}
        <div className="px-6 pt-4 pb-6 max-h-[80vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {isScanning  && <ScanningView  key="scan" entry={entry} />}
            {isResult    && <ResultView    key="res"  scanResult={pendingConfirm!.scanResult} onConfirm={onConfirm} onCancel={onCancel} />}
            {isUploading && <UploadingView key="up" />}
            {isDone      && <DoneView      key="done" entry={entry} />}
            {isError     && <ErrorView     key="err"  error={entry.error} onCancel={onCancel} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

// ─── LiveScanConsole ──────────────────────────────────────────────────────────

function LiveScanConsole({
  entry, onDismiss,
}: {
  entry: FileEntry
  onDismiss: () => void
}) {
  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [entry.scanLogs])

  const isDone  = entry.phase === 'done'
  const isError = entry.phase === 'error'

  return (
    <div className="space-y-3">
      {/* File header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isDone ? (entry.scanResult?.fraudSignals.some(s=>s.severity==='high') ? '#fee2e2' : '#d1fae5') : 'var(--surface-subtle)' }}>
          {isDone
            ? <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
            : isError ? <FileX className="w-4.5 h-4.5 text-red-500" />
            : <Cpu className="w-4.5 h-4.5 animate-pulse text-blue-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{entry.file.name}</p>
          {isDone && entry.scanResult && (
            <p className="text-xs font-medium" style={{ color: entry.scanResult.docFamily !== 'UNKNOWN' ? '#10b981' : '#86868b' }}>
              {FAMILY_LABELS[entry.scanResult.docFamily]} · {entry.scanResult.confidence}%
            </p>
          )}
          {!isDone && !isError && (
            <p className="text-xs text-blue-500 animate-pulse">Analyse en cours…</p>
          )}
        </div>
        {(isDone || isError) && (
          <button onClick={onDismiss} className="text-xs px-2 py-1 rounded-lg"
            style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-tertiary)' }}>OK</button>
        )}
      </div>

      {/* Progress bar */}
      {!isDone && !isError && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <motion.div className="h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${
              entry.phase === 'queued' ? 5 :
              entry.phase === 'pdf'    ? Math.round(entry.phasePct * 0.35) :
              entry.phase === 'ocr'    ? Math.round(35 + entry.phasePct * 0.4) :
              entry.phase === 'qr'     ? 80 :
              entry.phase === 'uploading' ? 90 : 0
            }%` }}
            transition={{ duration: 0.25 }}
            style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
          />
        </div>
      )}

      {/* Logs */}
      <div ref={logRef}
        className="font-mono text-[10px] space-y-0.5 max-h-36 overflow-y-auto rounded-xl px-3 py-2"
        style={{ backgroundColor: 'var(--surface-subtle)' }}>
        {entry.scanLogs.length === 0
          ? <p style={{ color: 'var(--text-tertiary)' }}>Initialisation…</p>
          : entry.scanLogs.map((log, i) => (
            <p key={i} className={
              log.startsWith('[OK]')   ? 'text-emerald-600' :
              log.startsWith('[WARN]') ? 'text-amber-600'   :
              log.startsWith('[ERR]')  ? 'text-red-600'     :
              'text-[var(--text-tertiary)]'
            }>{log}</p>
          ))
        }
      </div>

      {/* Signal breakdown (after done) */}
      {isDone && entry.scanResult && 'signals' in entry.scanResult && (
        <SignalBreakdown signals={(entry.scanResult as MultiSignalResult).signals} />
      )}

      {/* Fraud alerts */}
      {isDone && entry.scanResult && entry.scanResult.fraudSignals.length > 0 && (
        <div className="space-y-1">
          {entry.scanResult.fraudSignals.map((sig, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-xl ${
              sig.severity === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {sig.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── IdleSidePanel ────────────────────────────────────────────────────────────

function IdleSidePanel({
  score, documents, entries, crossDocWarnings,
}: {
  score: number
  documents: TenantDocument[]
  entries: FileEntry[]
  crossDocWarnings: string[]
}) {
  const required  = ALL_SLOTS.filter((s) => s.required)
  const uploaded  = documents.length
  const missing   = required.filter((s) => !documents.some((d) => d.docType === s.docType)).length
  const suspects  = entries.reduce((n, e) => n + (e.scanResult?.fraudSignals.filter(s => s.severity === 'high').length ?? 0), 0)

  const tip = score === 0  ? "Commencez par déposer votre pièce d'identité et votre contrat de travail."
            : score < 40   ? "Ajoutez vos bulletins de salaire pour renforcer votre dossier."
            : score < 70   ? "Votre dossier est en bonne voie. Ajoutez l'avis d'imposition."
            : score < 90   ? "Excellent ! Ajoutez une attestation Visale pour maximiser vos chances."
            : "Dossier complet et solide. Vous pouvez le télécharger en ZIP."

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>Résumé rapide</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Uploadés',   value: uploaded, color: 'text-emerald-600' },
            { label: 'Manquants',  value: missing,  color: missing  > 0 ? 'text-amber-600' : 'text-emerald-600' },
            { label: 'Suspects',   value: suspects, color: suspects > 0 ? 'text-red-600'   : 'text-emerald-600' },
            { label: 'Score',      value: `${score}%`, color: score >= 65 ? 'text-blue-600' : 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl px-3 py-2 text-center" style={{ backgroundColor: 'var(--surface-subtle)' }}>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {crossDocWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Cohérence inter-documents
          </p>
          {crossDocWarnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600">{w}</p>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>Conseil IA</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tip}</p>
      </div>

      <p className="text-[10px] text-center flex items-center justify-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
        <Lock className="w-3 h-3" />
        Analyse 100 % locale · Aucune donnée transmise
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// MAX_CONCURRENT kept for reference — replaced by serial runner in handleFiles
// const MAX_CONCURRENT = 3

export default function DossierLocatif() {
  const { user, updateProfile } = useAuth()
  useId()

  const [documents,        setDocuments]        = useState<TenantDocument[]>([])
  const [isLoading,        setIsLoading]         = useState(true)
  const [entries,          setEntries]           = useState<FileEntry[]>([])
  const [crossDocWarnings, setCrossDocWarnings]  = useState<string[]>([])
  const [activeScanId,     setActiveScanId]      = useState<string | null>(null)
  const [whySlot,          setWhySlot]           = useState<SlotSpec | null>(null)
  const [pendingDuplicate, setPendingDuplicate]  = useState<{
    id: string; file: File; assignedDocType: string; familyLabel: string; existingDocId?: string
  } | null>(null)
  const [generatingZip,    setGeneratingZip]     = useState(false)
  const [wizardOpen,       setWizardOpen]         = useState(false)
  const assignedSlots = useRef<Set<string>>(new Set())

  const [pendingConfirm, setPendingConfirm] = useState<{
    id: string; file: File; scanResult: MultiSignalResult
  } | null>(null)
  const [scannerModalEntryId, setScannerModalEntryId] = useState<string | null>(null)
  const confirmResolveRef   = useRef<((family: DocFamily | null) => void) | null>(null)
  const duplicateResolveRef = useRef<((choice: 'replace' | 'keep' | 'cancel') => void) | null>(null)

  useEffect(() => {
    dossierService.getDocuments()
      .then((docs) => {
        setDocuments(docs)
        // Pre-fill assignedSlots from already-uploaded docs
        docs.forEach((d) => { if (d.docType) assignedSlots.current.add(d.docType) })
      })
      .catch(() => toast.error('Impossible de charger le dossier'))
      .finally(() => setIsLoading(false))
  }, [])

  const score    = useMemo(() => computeScore(documents), [documents])
  const hasVisale = documents.some((d) => d.docType === 'ATTESTATION_VISALE')
  const strength = getStrength(score, hasVisale)
  const StrIcon  = strength.icon

  // ── Upload helper ──────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (docType: string, category: string, file: File): Promise<TenantDocument> => {
    const doc = await dossierService.uploadDocument(category, docType, file)
    setDocuments((prev) => {
      const filtered = prev.filter((d) => !(d.category === category && d.docType === docType))
      return [doc, ...filtered]
    })
    return doc
  }, [])

  // ── Process one file ───────────────────────────────────────────────────────
  const processEntry = useCallback(async (id: string, file: File) => {
    const logs: string[] = []
    const addLog = (line: string) => {
      logs.push(line)
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, scanLogs: [...logs] } : e))
    }
    const setPhase = (updates: Partial<FileEntry>) =>
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e))

    setActiveScanId(id)

    try {
      addLog('[INFO] Démarrage de l\'analyse IA multi-signaux…')

      const scanResult = await runMultiSignalIntelligence(file, (phase, pct) => {
        setPhase({ phase: phase as ScanPhase, phasePct: pct })
        if (phase === 'pdf' && pct >= 70) addLog('[OK] Texte PDF extrait')
        if (phase === 'ocr' && pct >= 95) addLog('[OK] OCR Tesseract terminé')
        if (phase === 'qr')               addLog('[INFO] Détection QR code 2D-Doc…')
      })

      // Log fusion result
      if (scanResult.docFamily !== 'UNKNOWN') {
        const fuseLabel = scanResult.signals.fusion === 'consensus' ? ` (+${scanResult.signals.fusionBonus}pts consensus)` : ''
        addLog(`[OK] Famille détectée : ${FAMILY_LABELS[scanResult.docFamily]} (${scanResult.confidence}%${fuseLabel})`)
      } else {
        addLog('[WARN] Document non reconnu — confiance insuffisante')
      }

      if (scanResult.certaintyTokenFound)   addLog(`[OK] Marqueur certitude : "${scanResult.certaintyTokenFound}"`)
      if (scanResult.pdfMetadata.isSuspect) addLog(`[WARN] Métadonnée suspecte : ${scanResult.pdfMetadata.producer ?? 'outil inconnu'}`)
      if (scanResult.hasQrCode)             addLog('[OK] QR code 2D-Doc détecté')
      if (scanResult.extractedData.siret) {
        const ok = !scanResult.fraudSignals.some((s) => s.type === 'siret_invalid')
        addLog(ok ? `[OK] SIRET ${scanResult.extractedData.siret} — Luhn ✓` : `[ERR] SIRET ${scanResult.extractedData.siret} — invalide`)
      }

      // Confirmation — toujours demandée :
      //   ≥90% (ou marqueur certitude) → "Est-ce le bon fichier ?" (oui/non)
      //   <90% → sélecteur de catégorie
      let confirmedFamily = scanResult.docFamily
      const skipConfirmation = false  // On demande TOUJOURS confirmation
      if (!skipConfirmation) {
        const confMsg = scanResult.confidence >= 90
          ? `[INFO] Confiance ${scanResult.confidence}% ≥ 90 % — confirmation simple requise`
          : `[INFO] Confiance ${scanResult.confidence}% < 90 % — sélection catégorie requise`
        addLog(confMsg)
        setPhase({ phase: 'needs_confirm', scanResult, scanLogs: [...logs] })
        const choice = await new Promise<DocFamily | null>((resolve) => {
          setPendingConfirm({ id, file, scanResult })
          confirmResolveRef.current = resolve
        })
        setPendingConfirm(null)
        if (choice === null) {
          setPhase({ phase: 'error', error: 'Document annulé.' }); return
        }
        confirmedFamily = choice
        scanResult.docFamily = confirmedFamily
        addLog(`[OK] Type confirmé : ${FAMILY_LABELS[confirmedFamily]}`)
      }

      // Temporal mapping
      let temporalLabel: string | undefined
      let finalDocType: string | null

      if (confirmedFamily === 'BULLETIN') {
        const period = mapBulletinPeriod(scanResult.rawText, assignedSlots.current)
        if (period) {
          temporalLabel = period.label
          finalDocType = period.slot
          if (finalDocType) assignedSlots.current.add(finalDocType)
          addLog(`[OK] Période : ${period.label}`)
        } else {
          finalDocType = assignDocTypeSlot(confirmedFamily, assignedSlots.current, scanResult.keywords)
          if (finalDocType) assignedSlots.current.add(finalDocType)
          addLog('[WARN] Période non détectée — slot séquentiel attribué')
        }
      } else {
        finalDocType = assignDocTypeSlot(confirmedFamily, assignedSlots.current, scanResult.keywords)
        if (finalDocType) assignedSlots.current.add(finalDocType)
      }

      // Identity matching + MRZ enrichment → injecté dans extractedData
      let identityLabel: string | undefined
      let identityMatchLevel: string | undefined
      if (confirmedFamily === 'IDENTITE' && (user?.firstName || user?.lastName)) {
        const idMatch = matchIdentity(scanResult.rawText, user?.firstName ?? '', user?.lastName ?? '')
        identityMatchLevel = idMatch.matchLevel
        identityLabel = `${matchLevelIcon(idMatch.matchLevel)}${idMatch.mrzFound ? ' · MRZ' : ''}`
        addLog(idMatch.mrzFound ? `[OK] Zone MRZ — ${idMatch.detail}` : `[INFO] ${idMatch.detail}`)
        if (idMatch.matchLevel === 'mismatch') addLog('[WARN] Nom sur le document ≠ profil utilisateur')
        // Injecter les données MRZ enrichies dans extractedData pour les chips
        if (idMatch.mrzFound && idMatch.mrzData) {
          if (idMatch.birthDate)      scanResult.extractedData.birthDate      = idMatch.birthDate
          if (idMatch.nationality)    scanResult.extractedData.nationality    = idMatch.nationality as string
          if (idMatch.documentNumber) scanResult.extractedData.documentNumber = idMatch.documentNumber
          if (idMatch.documentExpiry) scanResult.extractedData.documentExpiry = idMatch.documentExpiry
          if (idMatch.mrzData.surname)         scanResult.extractedData.lastName  = idMatch.mrzData.surname
          if (idMatch.mrzData.givenNames?.[0]) scanResult.extractedData.firstName = idMatch.mrzData.givenNames[0]
          addLog(`[OK] MRZ enrichie : ${idMatch.mrzData.surname} ${idMatch.mrzData.givenNames.join(' ')}${idMatch.birthDate ? ` · Né le ${idMatch.birthDate}` : ''}`)
        }
        // Auto-save identity data to user profile (MRZ enriched)
        const profilePatch: Record<string, string> = {}
        // Données biographiques prioritaires : nom, prénom, naissance
        if (idMatch.mrzData?.surname)          profilePatch.lastName      = idMatch.mrzData.surname
        if (idMatch.mrzData?.givenNames?.[0])  profilePatch.firstName     = idMatch.mrzData.givenNames[0]
        if (idMatch.birthDate)                 profilePatch.birthDate     = idMatch.birthDate
        if (idMatch.nationality)               profilePatch.nationality   = idMatch.nationality
        if (idMatch.documentNumber)            profilePatch.documentNumber = idMatch.documentNumber
        if (idMatch.documentExpiry)            profilePatch.documentExpiry = idMatch.documentExpiry
        if (scanResult.extractedData.birthCity)      profilePatch.birthCity      = scanResult.extractedData.birthCity as string
        if (scanResult.extractedData.nationalNumber) profilePatch.nationalNumber = scanResult.extractedData.nationalNumber as string
        if (Object.keys(profilePatch).length > 0) {
          updateProfile(profilePatch)
            .then(() => addLog('[OK] Identité (nom, prénom, naissance) sauvegardée dans le profil'))
            .catch(() => addLog('[WARN] Impossible de sauvegarder les données identité'))
        }
      }

      // ── Sauvegarde identité depuis extractedData (même sans idMatch) ─────────
      // Garantit que nom, prénom, date + lieu de naissance sont sauvegardés
      // même si l'utilisateur n'a pas encore renseigné son nom dans le profil.
      if (confirmedFamily === 'IDENTITE') {
        const ed = scanResult.extractedData
        const identPatch: Record<string, string> = {}
        if (ed.lastName  && typeof ed.lastName  === 'string') identPatch.lastName  = ed.lastName
        if (ed.firstName && typeof ed.firstName === 'string') identPatch.firstName = ed.firstName
        if (ed.birthDate && typeof ed.birthDate === 'string') identPatch.birthDate = ed.birthDate
        if (ed.birthCity && typeof ed.birthCity === 'string') identPatch.birthCity = ed.birthCity
        if (Object.keys(identPatch).length > 0) {
          updateProfile(identPatch)
            .then(() => addLog(`[OK] Données civiles extraites : ${Object.keys(identPatch).join(', ')}`))
            .catch(() => null)
        }
      }

      // ── PDF CNI multi-pages → split recto + verso automatiquement ───────────
      const isPdfFile = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')
      if (confirmedFamily === 'IDENTITE' && isPdfFile && scanResult.pageCount >= 2) {
        try {
          addLog(`[INFO] PDF ${scanResult.pageCount} pages détecté → split recto/verso automatique`)
          const { splitPdfToPageImages } = await import('../../utils/DocumentIntelligence')
          const pageBlobs = await splitPdfToPageImages(file)

          const { parseMrz: detectMrzFn } = await import('../../utils/IdentityMatcher')
          const uploadedSlots: string[] = []

          // Split the rawText by page markers (from OCR path) or use full text
          const pageTexts = scanResult.rawText.split(/---\s*PAGE\s+\d+\s*---/).filter((t) => t.trim())
          const nPages = Math.min(pageBlobs.length, 2)

          for (let i = 0; i < nPages; i++) {
            const pageBlob = pageBlobs[i]
            // Use per-page text if available, otherwise entire rawText
            const pageText = pageTexts[i] ?? scanResult.rawText

            // Detect recto/verso for this page
            const pageMrz      = detectMrzFn(pageText)
            const pageAngles   = (pageText.match(/</g) ?? []).length
            const rawNS        = pageText.replace(/\s/g, '').toUpperCase()
            const hasTd1       = /ID[A-Z]{3}[A-Z0-9<]{20,}/.test(rawNS)
            const isVerso      = pageMrz !== null || pageAngles >= 6 || hasTd1
            const slot         = isVerso ? 'CNI_VERSO' : 'CNI_RECTO'

            if (assignedSlots.current.has(slot)) {
              addLog(`[INFO] Page ${i + 1} : slot ${slot} déjà rempli — ignoré`)
              continue
            }
            assignedSlots.current.add(slot)

            const pageFile = new File(
              [pageBlob],
              `${file.name.replace(/\.pdf$/i, '')}_p${i + 1}.png`,
              { type: 'image/png' },
            )

            addLog(`[OK] Page ${i + 1} → ${isVerso ? 'Verso (MRZ' + (pageMrz ? ' ✓)' : ' ~)') : 'Recto (face photo)'}`)

            const doc = await uploadFile(slot, 'IDENTITE', pageFile).catch(() => null)
            if (doc) {
              uploadedSlots.push(slot)
              addLog(`[OK] ${slot} uploadée`)
              setDocuments((prev) => {
                const filtered = prev.filter((d) => !(d.category === 'IDENTITE' && d.docType === slot))
                return [doc, ...filtered]
              })
              // Enrich extractedData from MRZ
              if (pageMrz) {
                if (!scanResult.extractedData.lastName  && pageMrz.surname)          scanResult.extractedData.lastName  = pageMrz.surname
                if (!scanResult.extractedData.firstName && pageMrz.givenNames?.[0])  scanResult.extractedData.firstName = pageMrz.givenNames[0]
                if (!scanResult.extractedData.birthDate && pageMrz.birthDate)        scanResult.extractedData.birthDate = pageMrz.birthDate
                if (!scanResult.extractedData.documentNumber && pageMrz.cardNumber)  scanResult.extractedData.documentNumber = pageMrz.cardNumber
              }
            }
          }

          if (uploadedSlots.length > 0) {
            finalDocType = null   // ne pas re-uploader le PDF original
            addLog(`[OK] CNI splitée en ${uploadedSlots.length} page(s) : ${uploadedSlots.join(' + ')}`)
          }
        } catch (splitErr) {
          addLog(`[WARN] Split PDF impossible : ${splitErr instanceof Error ? splitErr.message : 'erreur'}`)
        }
      }

      // ── CNI recto/verso — détection fiable multi-signaux ────────────────────
      if (confirmedFamily === 'IDENTITE' && finalDocType &&
          ['CNI_RECTO', 'CNI_VERSO', 'CNI'].includes(finalDocType)) {
        const raw = scanResult.rawText
        const rawNoSpaces = raw.replace(/\s/g, '').toUpperCase()

        // Signal 1 — nombre de '<' dans le texte (MRZ = 40-80 '<', recto ≈ 0)
        const angleBracketCount = (raw.match(/</g) ?? []).length

        // Signal 2 — parseMrz sur le texte brut (chiminfo/mrz)
        const { parseMrz: detectMrz } = await import('../../utils/IdentityMatcher')
        const mrzParsed = detectMrz(raw)

        // Signal 3 — patterns MRZ (après suppression des espaces OCR)
        const hasTd1Pattern = /ID[A-Z]{3}[A-Z0-9<]{20,}/.test(rawNoSpaces)
        const hasTd3Pattern = /P<[A-Z]{3}[A-Z<]{30,}/.test(rawNoSpaces)
        const hasLongMrzBlock = /[A-Z0-9<]{30}/.test(rawNoSpaces)

        // Signal 4 — indicateurs recto : libellés présents sur la face avant
        const rectoScore =
          (/carte\s+nationale\s+d.identit/i.test(raw) ? 2 : 0) +
          (/r[eé]publique\s+fran[cç]aise/i.test(raw)  ? 2 : 0) +
          (/date\s+de\s+naissance/i.test(raw)          ? 1 : 0) +
          (/lieu\s+de\s+naissance/i.test(raw)           ? 1 : 0) +
          (/nationalit[eé]/i.test(raw)                  ? 1 : 0)

        // Signal 5 — indicateurs verso : adresse, signature
        const versoScore =
          (/adresse/i.test(raw)                           ? 1 : 0) +
          (/signature\s+du\s+titulaire/i.test(raw)        ? 2 : 0) +
          (angleBracketCount >= 8                         ? 3 : angleBracketCount >= 3 ? 1 : 0) +
          (mrzParsed !== null                             ? 5 : 0) +
          (hasTd1Pattern || hasTd3Pattern                 ? 3 : 0) +
          (hasLongMrzBlock && angleBracketCount >= 3       ? 2 : 0)

        const hasMrz = versoScore > rectoScore || versoScore >= 4
        const cniSlot = hasMrz ? 'CNI_VERSO' : 'CNI_RECTO'

        // Enrich log
        addLog(`[OK] Face CNI — score verso:${versoScore} recto:${rectoScore} → ${hasMrz ? 'Verso (MRZ ✓)' : 'Recto (face photo)'}`)
        if (mrzParsed) addLog(`[OK] MRZ parsée : ${mrzParsed.surname} ${mrzParsed.givenNames.join(' ')}`)

        // Remove previously guessed slot, assign correct one
        if (finalDocType !== cniSlot) {
          assignedSlots.current.delete(finalDocType)
          finalDocType = cniSlot
          assignedSlots.current.add(finalDocType)
        }
      }

      // ── Duplicate detection ───────────────────────────────────────────────
      if (finalDocType) {
        const existingDoc   = documents.find((d) => d.docType === finalDocType)
        const existingEntry = entries.find((e) =>
          e.id !== id &&
          e.assignedDocType === finalDocType &&
          (e.phase === 'done' || e.phase === 'uploading'),
        )
        if (existingDoc || existingEntry) {
          // Pause before upload — ask user
          const familyLabel = FAMILY_LABELS[confirmedFamily] ?? finalDocType
          setPhase({ phase: 'needs_confirm', scanResult })
          const choice = await new Promise<'replace' | 'keep' | 'cancel'>((resolve) => {
            setPendingDuplicate({
              id, file, assignedDocType: finalDocType, familyLabel,
              existingDocId: existingDoc?.id,
            })
            duplicateResolveRef.current = resolve
          })
          setPendingDuplicate(null)
          if (choice === 'cancel') { setPhase({ phase: 'error', error: 'Upload annulé (doublon).' }); return }
          if (choice === 'replace' && existingDoc) {
            await dossierService.deleteDocument(existingDoc.id).catch(() => null)
            setDocuments((prev) => prev.filter((d) => d.id !== existingDoc.id))
            addLog(`[INFO] Ancien document remplacé`)
          }
        }
      }

      // Upload
      const specEntry  = ALL_SLOTS.find((s) => s.docType === finalDocType)
      const category   = specEntry?.category ?? 'IDENTITE'

      addLog('[INFO] Envoi sécurisé…')
      setPhase({ phase: 'uploading', phasePct: 0, scanResult, assignedDocType: finalDocType, scanLogs: [...logs] })

      const uploadedDoc = finalDocType
        ? await uploadFile(finalDocType, category, file).catch(() => null)
        : null

      if (uploadedDoc) addLog('[OK] Document envoyé avec succès')
      else             addLog('[WARN] Envoi ignoré (type non attribué)')

      // ── Invite à compléter la CNI recto/verso ────────────────────────────
      if (confirmedFamily === 'IDENTITE' && uploadedDoc) {
        const rectoUploaded = finalDocType === 'CNI_RECTO' ||
          documents.some((d) => d.docType === 'CNI_RECTO')
        const versoUploaded = finalDocType === 'CNI_VERSO' ||
          documents.some((d) => d.docType === 'CNI_VERSO')
        if (finalDocType === 'CNI_RECTO' && !versoUploaded) {
          setTimeout(() => toast('Ajoutez maintenant le verso de votre CNI (face avec la MRZ) pour une vérification complète.', {
            duration: 7000, icon: 'ℹ️',
          }), 1500)
        } else if (finalDocType === 'CNI_VERSO' && !rectoUploaded) {
          setTimeout(() => toast('Ajoutez également le recto de votre CNI (face avec la photo).', {
            duration: 7000, icon: 'ℹ️',
          }), 1500)
        }
      }

      if (finalDocType) {
        updateDocProgress(finalDocType, {
          uploaded: !!uploadedDoc,
          trustScore: scanResult.confidence,
          fraudSignalCount: scanResult.fraudSignals.length,
          detectedDocType: scanResult.docType,
        })
      }

      // ── Save ALL extracted data to user profileMeta (AI-classified by doc family) ──
      const ed = scanResult.extractedData
      const metaEntry: Record<string, unknown> = {
        _docType:    finalDocType ?? confirmedFamily,
        _confidence: scanResult.confidence,
        _scannedAt:  new Date().toISOString(),
      }
      // Fields by family
      if (confirmedFamily === 'IDENTITE') {
        if (ed.firstName)      metaEntry.firstName      = ed.firstName
        if (ed.lastName)       metaEntry.lastName       = ed.lastName
        if (ed.birthDate)      metaEntry.birthDate      = ed.birthDate
        if (ed.birthCity)      metaEntry.birthCity      = ed.birthCity
        if (ed.nationality)    metaEntry.nationality    = ed.nationality
        if (ed.documentNumber) metaEntry.documentNumber = ed.documentNumber
        if (ed.documentExpiry) metaEntry.documentExpiry = ed.documentExpiry
        if (ed.nationalNumber) metaEntry.nationalNumber = ed.nationalNumber
      } else if (confirmedFamily === 'BULLETIN') {
        if (ed.employerName)   metaEntry.employerName   = ed.employerName
        if (ed.netSalary)      metaEntry.netSalary      = ed.netSalary
        if (ed.grossSalary)    metaEntry.grossSalary    = ed.grossSalary
        if (ed.bulletinPeriod) metaEntry.bulletinPeriod = ed.bulletinPeriod
        if (ed.siret)          metaEntry.siret          = ed.siret
        if (ed.contractType)   metaEntry.contractType   = ed.contractType
      } else if (confirmedFamily === 'REVENUS_FISCAUX') {
        if (ed.fiscalRef)  metaEntry.fiscalRef  = ed.fiscalRef
        if (ed.cafAmount)  metaEntry.cafAmount  = ed.cafAmount
        if (ed.areAmount)  metaEntry.areAmount  = ed.areAmount
        if (ed.pensionAmount) metaEntry.pensionAmount = ed.pensionAmount
      } else if (confirmedFamily === 'DOMICILE') {
        if (ed.address)    metaEntry.address    = ed.address
        if (ed.issuerName) metaEntry.issuerName = ed.issuerName
        if (ed.firstName)  metaEntry.firstName  = ed.firstName
        if (ed.lastName)   metaEntry.lastName   = ed.lastName
      } else if (confirmedFamily === 'GARANTIE') {
        if (ed.visaleAmount)   metaEntry.visaleAmount   = ed.visaleAmount
        if (ed.visaleDuration) metaEntry.visaleDuration = ed.visaleDuration
        if (ed.visaNumber)     metaEntry.visaNumber     = ed.visaNumber
        if (ed.guarantorLastName)  metaEntry.guarantorLastName  = ed.guarantorLastName
        if (ed.guarantorFirstName) metaEntry.guarantorFirstName = ed.guarantorFirstName
      } else if (confirmedFamily === 'BANCAIRE') {
        if (ed.ibanPrefix)  metaEntry.ibanPrefix  = ed.ibanPrefix
        if (ed.loanAmount)  metaEntry.loanAmount  = ed.loanAmount
      }

      if (Object.keys(metaEntry).length > 3) {  // at least one real field beyond meta
        updateProfile({ profileMeta: { [confirmedFamily]: metaEntry } })
          .then(() => addLog(`[OK] Données "${FAMILY_LABELS[confirmedFamily] ?? confirmedFamily}" sauvegardées dans votre profil`))
          .catch(() => null)
      }

      setPhase({
        phase: 'done', phasePct: 100, scanResult, assignedDocType: finalDocType,
        uploadedDoc, scanLogs: [...logs], temporalLabel, identityLabel, identityMatchLevel,
      })

      // Fermer ScannerModal après 1.2s pour laisser voir l'état "done"
      setTimeout(() => setScannerModalEntryId(null), 1200)

      // Cross-doc check
      setEntries((prev) => {
        const done = prev.filter((e) => e.scanResult).map((e) => e.scanResult!)
        setCrossDocWarnings(crossCheckSalaries(done))
        return prev
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      addLog(`[ERR] ${msg}`)
      setPhase({ phase: 'error', error: msg, scanLogs: [...logs] })
    } finally {
      setActiveScanId(null)
    }
  }, [uploadFile, user, updateProfile])

  // ── Handle new files ───────────────────────────────────────────────────────
  const handleFiles = useCallback((files: File[], hintDocType?: string) => {
    const valid = files.filter((f) => /\.(pdf|jpe?g|png|webp)$/i.test(f.name)).slice(0, 20)
    if (!valid.length) { toast.error('Format non supporté (PDF, JPEG, PNG, WebP uniquement)'); return }

    const newEntries: FileEntry[] = valid.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      phase: 'queued',
      phasePct: 0,
      scanResult: null,
      uploadedDoc: null,
      assignedDocType: hintDocType ?? null,
      scanLogs: [],
    }))
    setEntries((prev) => [...prev, ...newEntries])

    // Runner sériel : une ScannerModal à la fois
    const runSerial = (queue: FileEntry[]) => {
      if (!queue.length) return
      const [head, ...tail] = queue
      setScannerModalEntryId(head.id)  // ouvre la modal immédiatement
      processEntry(head.id, head.file).finally(() => {
        // Avancer vers le fichier suivant après 900ms (temps pour voir "done")
        setTimeout(() => runSerial(tail), 900)
      })
    }
    runSerial(newEntries)
  }, [processEntry])

  // ── Delete document ────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    try {
      await dossierService.deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }, [])


  // ── ZIP export ─────────────────────────────────────────────────────────────
  const handleDownloadZip = useCallback(async () => {
    if (!documents.length) return
    setGeneratingZip(true)
    try {
      const zip = new JSZip()
      const lastName = user?.lastName ?? 'locataire'
      await Promise.all(documents.map(async (doc) => {
        try {
          const res = await fetch(`${SERVER_BASE}${doc.fileUrl}`)
          if (!res.ok) return
          const blob = await res.blob()
          const ext  = doc.fileName.split('.').pop() ?? 'pdf'
          zip.file(`${lastName}_${doc.docType}_${doc.createdAt.slice(0,10)}.${ext}`, blob)
        } catch { /* skip */ }
      }))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url  = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href: url, download: `dossier_${lastName}.zip` }).click()
      URL.revokeObjectURL(url)
      toast.success('ZIP généré !')
    } catch {
      toast.error('Erreur lors de la génération du ZIP')
    } finally {
      setGeneratingZip(false)
    }
  }, [documents, user])


  const activeScanEntry = activeScanId ? entries.find((e) => e.id === activeScanId) : null

  // ── Global drop handlers ───────────────────────────────────────────────────
  const globalInputRef = useRef<HTMLInputElement>(null)
  const [draggingGlobal, setDraggingGlobal] = useState(false)

  // ── DnD reassign between slots ─────────────────────────────────────────────
  const [draggingDoc, setDraggingDoc] = useState<TenantDocument | null>(null)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const doc = event.active.data.current?.doc as TenantDocument | undefined
    if (doc) setDraggingDoc(doc)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setDraggingDoc(null)
    const { active, over } = event
    if (!over) return
    const doc = active.data.current?.doc as TenantDocument | undefined
    if (!doc) return
    const toCategory = over.data.current?.toCategory as string | undefined
    const toDocType  = over.data.current?.toDocType  as string | undefined
    if (!toCategory || !toDocType) return
    if (doc.category === toCategory && doc.docType === toDocType) return

    // Optimistic update
    const prev = [...documents]
    setDocuments((docs) => docs.map((d) => {
      if (d.id === doc.id) return { ...d, category: toCategory, docType: toDocType }
      // If target slot occupied → swap it to source position
      if (d.category === toCategory && d.docType === toDocType)
        return { ...d, category: doc.category, docType: doc.docType }
      return d
    }))

    try {
      const result = await dossierService.reassignDocument(doc.id, toCategory, toDocType)
      if (result.swapped) toast.success('Documents échangés')
      else toast.success('Document déplacé')
    } catch {
      setDocuments(prev)
      toast.error('Erreur lors du déplacement')
    }
  }, [documents])

  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-violet)' }} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6"
        onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDraggingGlobal(true) } }}
        onDragLeave={() => setDraggingGlobal(false)}
        onDrop={(e) => {
          e.preventDefault(); setDraggingGlobal(false)
          const files = Array.from(e.dataTransfer.files).filter((f) => /\.(pdf|jpe?g|png|webp)$/i.test(f.name))
          if (files.length) handleFiles(files)
        }}
      >

        {/* ── PageHeader ─────────────────────────────────────────────────── */}
        <div className="rounded-3xl p-5 sm:p-6 border"
          style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Score gauge */}
            <div className="flex-shrink-0">
              <ScoreGauge score={score} />
            </div>

            {/* Title + progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Mon Dossier Locataire
                </h1>
                {user?.firstName && (
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    — {user.firstName} {user.lastName}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${strength.bg} ${strength.color}`}>
                  <StrIcon className="w-4 h-4" /> {strength.label}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: score >= 65 ? 'linear-gradient(90deg, #10b981, #3b82f6)' : score >= 35 ? 'linear-gradient(90deg, #f59e0b, #f97316)' : '#ef4444' }}
                  />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {documents.length} / {ALL_SLOTS.filter((s) => s.required).length + 3} documents
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {/* Wizard CTA — primary action */}
              <button
                onClick={() => setWizardOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: '#007AFF', boxShadow: '0 2px 8px rgba(0,122,255,0.24)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0066d6' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#007AFF' }}
              >
                <Sparkles className="w-4 h-4" />
                Constituer mon dossier
              </button>
              <button onClick={handleDownloadZip} disabled={generatingZip || documents.length === 0}
                className="btn btn-secondary flex items-center gap-2 text-sm disabled:opacity-40">
                {generatingZip ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                ZIP
              </button>
            </div>
          </div>
        </div>

        {/* ── Main grid ─────────────────────────────────────────────────────*/}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── ChecklistPanel (2/3) ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* ── Hero Drop Zone (toujours visible en haut) ─────────────── */}
            <motion.div
              animate={draggingGlobal ? { scale: 1.02, y: -2 } : { scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-2xl border-2 border-dashed px-6 py-7 text-center cursor-pointer transition-all"
              style={{
                borderColor: draggingGlobal ? '#3b82f6' : '#bfdbfe',
                backgroundColor: draggingGlobal ? '#eff6ff' : '#f5f5f7',
              }}
              onClick={() => globalInputRef.current?.click()}
            >
              <input ref={globalInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) { handleFiles(f); e.target.value = '' } }} />
              <motion.div animate={draggingGlobal ? { scale: 1.18 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                {draggingGlobal
                  ? <Sparkles className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                  : <Upload className="w-10 h-10 mx-auto mb-3 text-blue-400" />}
              </motion.div>
              <p className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {draggingGlobal ? 'Relâchez pour analyser' : 'Déposez vos documents ici'}
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                ≥ 90 % de confiance → confirmation simple · &lt; 90 % → vous choisissez la catégorie
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {[
                  { icon: Cpu,    text: 'OCR intégré' },
                  { icon: Layers, text: 'Auto-classement' },
                  { icon: Lock,   text: '100% local' },
                ].map(({ icon: I, text }) => (
                  <span key={text} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                    <I className="w-3 h-3" /> {text}
                  </span>
                ))}
              </div>
            </motion.div>

            {CATEGORIES.map((cat) => {
              const CatIcon = cat.icon
              const catDocs  = documents.filter((d) => d.category === cat.id)
              const doneCount = cat.slots.filter((s) => catDocs.some((d) => d.docType === s.docType)).length
              const hasIssue  = cat.slots.some((s) =>
                entries.find((e) => e.assignedDocType === s.docType)?.scanResult?.fraudSignals.some((f) => f.severity === 'high')
              )
              const allDone = doneCount === cat.slots.filter((s) => s.required).length

              return (
                <CategorySection
                  key={cat.id}
                  cat={cat}
                  CatIcon={CatIcon}
                  doneCount={doneCount}
                  allDone={allDone}
                  hasIssue={hasIssue}
                  documents={documents}
                  entries={entries}
                  onUploadSlot={(docType, _category, file) => handleFiles([file], docType)}
                  onDelete={handleDelete}
                  onOpenWhy={setWhySlot}
                  serverBase={SERVER_BASE}
                />
              )
            })}

          </div>

          {/* ── SidePanel (1/3) ───────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-3xl p-5 border space-y-4"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>

              <AnimatePresence mode="wait">
                {activeScanEntry ? (
                  <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2"
                      style={{ color: 'var(--text-tertiary)' }}>
                      <Cpu className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> Analyse IA
                    </p>
                    <LiveScanConsole entry={activeScanEntry} onDismiss={() => setActiveScanId(null)} />
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3"
                      style={{ color: 'var(--text-tertiary)' }}>Vue d'ensemble</p>
                    <IdleSidePanel
                      score={score}
                      documents={documents}
                      entries={entries}
                      crossDocWarnings={crossDocWarnings}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Composer le dossier final ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <ProfileComposer documents={documents} serverBase={SERVER_BASE} user={user} />
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingDuplicate && (
          <DuplicateModal
            pending={pendingDuplicate}
            onReplace={() => { duplicateResolveRef.current?.('replace'); duplicateResolveRef.current = null }}
            onKeepBoth={() => { duplicateResolveRef.current?.('keep'); duplicateResolveRef.current = null }}
            onCancel={() => { duplicateResolveRef.current?.('cancel'); duplicateResolveRef.current = null }}
          />
        )}
        {scannerModalEntryId && !pendingDuplicate && (() => {
          const scanEntry = entries.find((e) => e.id === scannerModalEntryId)
          if (!scanEntry) return null
          const activeCount = entries.filter((e) =>
            ['queued','pdf','ocr','qr','needs_confirm','uploading'].includes(e.phase)
          ).length
          return (
            <ScannerModal
              entry={scanEntry}
              pendingConfirm={pendingConfirm?.id === scannerModalEntryId ? pendingConfirm : null}
              onConfirm={(family) => {
                if (pendingConfirm && family !== pendingConfirm.scanResult.docFamily) {
                  saveTrainingCorrection(pendingConfirm.file.name, family)
                  toast.success("L'IA a appris de cette correction !", { icon: '🧠' })
                }
                confirmResolveRef.current?.(family)
                confirmResolveRef.current = null
              }}
              onCancel={() => {
                if (scanEntry.phase === 'done' || scanEntry.phase === 'error') {
                  setScannerModalEntryId(null)
                } else {
                  confirmResolveRef.current?.(null)
                  confirmResolveRef.current = null
                }
              }}
              queueInfo={{ current: 1, total: Math.max(activeCount, 1) }}
            />
          )
        })()}
        {whySlot && <WhyModal slot={whySlot} onClose={() => setWhySlot(null)} />}

        {/* Dossier Wizard */}
        {wizardOpen && (
          <DossierWizard
            onClose={() => setWizardOpen(false)}
            onDocumentUploaded={(doc) => {
              setDocuments((prev) => {
                const filtered = prev.filter((d) => !(d.category === doc.category && d.docType === doc.docType))
                return [doc, ...filtered]
              })
            }}
            existingDocs={documents}
          />
        )}
      </AnimatePresence>

      {/* DragOverlay — ghost card shown while dragging a document between slots */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {draggingDoc && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl border border-blue-300 bg-white"
            style={{ maxWidth: 280, opacity: 0.95, boxShadow: '0 8px 24px rgba(0,122,255,0.20)' }}>
            <GripVertical className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate text-[#1d1d1f]">{draggingDoc.fileName}</p>
              <p className="text-[10px] text-blue-500">{draggingDoc.docType.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
      </DragOverlay>
      </DndContext>
    </Layout>
  )
}

// ─── ProfileComposer ──────────────────────────────────────────────────────────

type ComposerPhase = 'idle' | 'analyzing' | 'review'

interface ProfileFields {
  firstName: string; lastName: string
  birthDate: string; birthCity: string; nationality: string
  documentNumber: string; documentExpiry: string; nationalNumber: string
  address: string
  employerName: string; contractType: string; netSalary: string
}

function ProfileComposer({
  documents, serverBase, user,
}: {
  documents: TenantDocument[]
  serverBase: string
  user: { firstName?: string | null; lastName?: string | null } | null
}) {
  const [phase, setPhase] = useState<ComposerPhase>('idle')
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const [fields, setFields] = useState<ProfileFields>({
    firstName: '', lastName: '', birthDate: '', birthCity: '', nationality: '',
    documentNumber: '', documentExpiry: '', nationalNumber: '',
    address: '', employerName: '', contractType: '', netSalary: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleAnalyze() {
    if (documents.length === 0) {
      toast.error('Ajoutez des documents avant de composer le dossier.')
      return
    }
    setPhase('analyzing')
    setProgress({ done: 0, total: documents.length })

    const merged: Partial<ExtractedData> = {}

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      try {
        const url = serverBase + doc.fileUrl
        const resp = await fetch(url)
        if (!resp.ok) { setProgress({ done: i + 1, total: documents.length }); continue }
        const blob = await resp.blob()
        const file = new File([blob], doc.fileName, { type: doc.mimeType })
        const result = await runMultiSignalIntelligence(file)
        const ex = result.extractedData ?? {}
        // Merge: first non-empty value wins
        const keys = Object.keys(ex) as (keyof ExtractedData)[]
        for (const k of keys) {
          if (merged[k] === undefined || merged[k] === null || merged[k] === '') {
            // @ts-ignore
            merged[k] = ex[k]
          }
        }
      } catch {
        // skip unreadable doc
      }
      setProgress({ done: i + 1, total: documents.length })
    }

    // Pre-fill form: AI results first, then fall back to existing user data
    setFields({
      firstName:      merged.firstName      || (user?.firstName as string) || '',
      lastName:       merged.lastName       || (user?.lastName  as string) || '',
      birthDate:      merged.birthDate      || '',
      birthCity:      merged.birthCity      || '',
      nationality:    merged.nationality    || '',
      documentNumber: merged.documentNumber || '',
      documentExpiry: merged.documentExpiry || '',
      nationalNumber: merged.nationalNumber || '',
      address:        merged.address        || '',
      employerName:   merged.employerName   || '',
      contractType:   merged.contractType   || '',
      netSalary:      merged.netSalary != null ? String(merged.netSalary) : '',
    })
    setPhase('review')
  }

  async function handleSave() {
    setSaving(true)
    try {
      await dossierService.saveProfile({
        firstName:      fields.firstName      || undefined,
        lastName:       fields.lastName       || undefined,
        birthDate:      fields.birthDate      || undefined,
        birthCity:      fields.birthCity      || undefined,
        nationality:    fields.nationality    || undefined,
        documentNumber: fields.documentNumber || undefined,
        documentExpiry: fields.documentExpiry || undefined,
        nationalNumber: fields.nationalNumber || undefined,
        address:        fields.address        || undefined,
        employerName:   fields.employerName   || undefined,
        contractType:   fields.contractType   || undefined,
        netSalary:      fields.netSalary ? parseFloat(fields.netSalary) : null,
      })
      toast.success('Profil enregistré avec succès !')
      setPhase('idle')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  function Field({ label, name, type = 'text', placeholder }: { label: string; name: keyof ProfileFields; type?: string; placeholder?: string }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <input
          type={type}
          value={fields[name]}
          onChange={e => setFields(prev => ({ ...prev, [name]: e.target.value }))}
          placeholder={placeholder}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
        />
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-2xl border p-6" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Composer mon dossier final</h3>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            L'IA analyse tous vos documents et extrait vos informations personnelles.
          </p>
        </div>
      </div>

      {phase === 'idle' && (
        <button
          onClick={handleAnalyze}
          disabled={documents.length === 0}
          className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#2563eb] disabled:opacity-40 transition-colors"
        >
          <Cpu className="w-4 h-4" />
          Analyser mes {documents.length} document{documents.length !== 1 ? 's' : ''}
        </button>
      )}

      {phase === 'analyzing' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            Analyse en cours… {progress.done}/{progress.total} document{progress.total !== 1 ? 's' : ''}
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'review' && (
        <div className="flex flex-col gap-6">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Vérifiez et corrigez les informations extraites par l'IA avant de les enregistrer.
          </p>

          {/* Identité */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <User className="w-3.5 h-3.5" /> Identité
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Prénom" name="firstName" placeholder="Jean" />
              <Field label="Nom" name="lastName" placeholder="Dupont" />
              <Field label="Date de naissance" name="birthDate" placeholder="DD/MM/YYYY" />
              <Field label="Ville de naissance" name="birthCity" placeholder="Paris" />
              <Field label="Nationalité" name="nationality" placeholder="Française" />
              <Field label="N° document d'identité" name="documentNumber" placeholder="123456789" />
              <Field label="Date d'expiration" name="documentExpiry" placeholder="DD/MM/YYYY" />
              <Field label="N° sécurité sociale" name="nationalNumber" placeholder="1 85 12 75…" />
            </div>
          </div>

          {/* Coordonnées */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Home className="w-3.5 h-3.5" /> Coordonnées
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Adresse postale" name="address" placeholder="12 rue de la Paix, 75001 Paris" />
            </div>
          </div>

          {/* Situation professionnelle */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Briefcase className="w-3.5 h-3.5" /> Situation professionnelle
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Employeur" name="employerName" placeholder="Société Exemple" />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Type de contrat</label>
                <select
                  value={fields.contractType}
                  onChange={e => setFields(prev => ({ ...prev, contractType: e.target.value }))}
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="">— Sélectionner —</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Intérim">Intérim</option>
                  <option value="Alternance">Alternance</option>
                  <option value="Indépendant">Indépendant / Freelance</option>
                  <option value="Retraite">Retraite</option>
                  <option value="Sans emploi">Sans emploi</option>
                </select>
              </div>
              <Field label="Salaire net mensuel (€)" name="netSalary" type="number" placeholder="2500" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#2563eb] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Enregistrement…' : 'Enregistrer dans mon compte'}
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-70"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CategorySection ──────────────────────────────────────────────────────────

function CategorySection({
  cat, CatIcon, doneCount, allDone, hasIssue,
  documents, entries, onUploadSlot, onDelete, onOpenWhy, serverBase,
}: {
  cat: DocCategory
  CatIcon: React.ElementType
  doneCount: number
  allDone: boolean
  hasIssue: boolean
  documents: TenantDocument[]
  entries: FileEntry[]
  onUploadSlot: (docType: string, category: string, file: File) => void
  onDelete: (id: string) => void
  onOpenWhy: (slot: SlotSpec) => void
  serverBase: string
}) {
  const [open, setOpen] = useState(true)
  const totalRequired = cat.slots.filter((s) => s.required).length

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-card)' }}>
      {/* Category header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${cat.accentBg} hover:opacity-90`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60`}>
          <CatIcon className={`w-4.5 h-4.5 ${cat.accent}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${cat.accent}`}>{cat.label}</p>
          <p className="text-xs opacity-70" style={{ color: 'inherit' }}>
            {doneCount} / {cat.slots.length} document{cat.slots.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasIssue ? (
            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Alerte
            </span>
          ) : allDone && totalRequired > 0 ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Complet
            </span>
          ) : doneCount > 0 ? (
            <span className="text-[10px] bg-white/70 text-slate-500 px-2 py-0.5 rounded-full font-medium">
              {doneCount}/{totalRequired} requis
            </span>
          ) : (
            <span className="text-[10px] bg-white/50 text-slate-400 px-2 py-0.5 rounded-full">Vide</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
        </div>
      </button>

      {/* Slots */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {cat.slots.map((slot) => {
                const doc       = documents.find((d) => d.category === cat.id && d.docType === slot.docType)
                const scanEntry = entries.find((e) => e.assignedDocType === slot.docType)
                return (
                  <DocumentRow
                    key={slot.docType}
                    slot={slot}
                    category={cat.id}
                    doc={doc}
                    scanEntry={scanEntry}
                    serverBase={serverBase}
                    onUploadSlot={onUploadSlot}
                    onDelete={onDelete}
                    onOpenWhy={onOpenWhy}
                  />
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
