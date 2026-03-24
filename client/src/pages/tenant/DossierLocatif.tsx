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
  FAMILY_LABELS,
  type DocFamily, type ExtractedData,
} from '../../utils/DocumentIntelligence'
import { mapBulletinPeriod }              from '../../utils/TemporalMapper'
import { matchIdentity, matchLevelIcon }  from '../../utils/IdentityMatcher'
import { SignalBreakdown }                from '../../components/dossier/SignalBreakdown'
import { updateDocProgress } from '../../utils/progressState'
import { celebrateBig } from '../../utils/celebrate'
import toast from 'react-hot-toast'
import { DocumentViewerModal } from '../../components/document/DocumentViewerModal'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ??
  'http://localhost:3000'

const M = {
  bg: '#fafaf8', surface: '#ffffff', muted: '#f4f2ee', inputBg: '#f8f7f4',
  ink: '#0d0c0a', inkMid: '#5a5754', inkFaint: '#9e9b96',
  tenant: '#1b5e3b', tenantLight: '#edf7f2', tenantBorder: '#9fd4ba',
  border: '#e4e1db', borderMid: '#ccc9c3',
  danger: '#9b1c1c', dangerBg: '#fef2f2',
  warning: '#92400e', warningBg: '#fdf5ec',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  cardShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

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
    color: 'indigo', accent: 'text-[#1b5e3b]', accentBg: 'bg-[#edf7f2]',
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
  if (score >= 90 && hasVisale) return { label: 'Excellent', textColor: M.tenant,  bgColor: M.tenantLight,  icon: Award }
  if (score >= 65)              return { label: 'Bon',       textColor: '#1d4ed8', bgColor: '#dbeafe',      icon: Star }
  if (score >= 35)              return { label: 'Moyen',     textColor: M.warning, bgColor: M.warningBg,    icon: AlertCircle }
  return                               { label: 'Faible',    textColor: M.danger,  bgColor: M.dangerBg,     icon: AlertCircle }
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const R = 54, cx = 64, cy = 64
  const arc    = Math.PI * R
  const offset = arc * (1 - Math.min(100, Math.max(0, score)) / 100)
  const color  = score >= 90 ? M.tenant : score >= 65 ? '#2563eb' : score >= 35 ? '#b45309' : M.danger
  return (
    <svg width={128} height={72} viewBox="0 0 128 76">
      <path d="M 10 64 A 54 54 0 0 1 118 64" fill="none" stroke={M.border} strokeWidth={10} strokeLinecap="round" />
      <path d="M 10 64 A 54 54 0 0 1 118 64" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={arc} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }} />
      <text x={cx} y={cy - 4}  textAnchor="middle" fontSize={22} fontWeight="bold" fill={color}>{score}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9}  fill={M.inkFaint}>complétude</text>
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
  slot, category, doc, scanEntry,
  onUploadSlot, onDelete, onOpenWhy, onView,
}: {
  slot: SlotSpec
  category: string
  doc: TenantDocument | undefined
  scanEntry: FileEntry | undefined
  onUploadSlot: (docType: string, category: string, file: File) => void
  onDelete: (id: string) => void
  onOpenWhy: (slot: SlotSpec) => void
  onView: (doc: TenantDocument) => void
}) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [isFileDragOver, setIsFileDragOver] = useState(false)

  const isScanning = !!scanEntry && scanEntry.phase !== 'done' && scanEntry.phase !== 'error'
  const isDone     = !!doc
  const isError    = scanEntry?.phase === 'error'

  const confidencePct = scanEntry?.scanResult?.confidence
  const confColor     = (p?: number) => !p ? M.inkFaint : p >= 70 ? M.tenant : p >= 40 ? '#b45309' : M.danger
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
      style={{
        ...dragStyle,
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        borderRadius: 10, transition: 'all 0.15s',
        border: isDragOver && !isScanning
          ? `1.5px solid ${M.tenant}`
          : isScanning ? `1px solid ${M.tenantBorder}`
          : isDone && hasHighRisk ? `1px solid #fca5a5`
          : isDone ? `1px solid ${M.tenantBorder}`
          : slot.required ? `1.5px dashed ${M.borderMid}`
          : `1px solid ${M.border}`,
        background: isDragOver && !isScanning
          ? M.tenantLight
          : isScanning ? '#f0fdf4'
          : isDone && hasHighRisk ? M.dangerBg
          : isDone ? M.tenantLight
          : M.muted,
        opacity: !isDone && !isScanning && !slot.required ? 0.75 : 1,
      }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isScanning && e.dataTransfer.files.length > 0) setIsFileDragOver(true) }}
      onDragLeave={(e) => {
        e.stopPropagation()
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFileDragOver(false)
      }}
      onDrop={handleSlotFileDrop}
    >
      {/* Drag handle — only visible when doc is uploaded */}
      {isDone && !isScanning && (
        <div
          {...listeners}
          {...attributes}
          style={{ flexShrink: 0, cursor: 'grab', padding: 2, marginLeft: -4, borderRadius: 6, color: M.borderMid }}
          title="Glisser vers un autre emplacement"
          onMouseEnter={(e) => { e.currentTarget.style.background = M.muted; e.currentTarget.style.color = M.inkMid }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = M.borderMid }}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}
      {/* Status icon */}
      <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
        {isScanning ? (
          <Loader className="w-4 h-4 animate-spin" style={{ color: M.tenant }} />
        ) : isDone && hasHighRisk ? (
          <ShieldAlert className="w-4 h-4" style={{ color: M.danger }} />
        ) : isDone ? (
          <CheckCircle className="w-4 h-4" style={{ color: M.tenant }} />
        ) : isError ? (
          <FileX className="w-4 h-4" style={{ color: M.danger }} />
        ) : slot.required ? (
          <span style={{ color: M.danger, fontSize: 11, fontWeight: 700 }}>✗</span>
        ) : (
          <span style={{ color: M.borderMid, fontSize: 11 }}>○</span>
        )}
      </div>

      {/* Label + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: M.ink, fontFamily: M.body, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {slot.label}
          {slot.required && !isDone && <span style={{ color: M.danger, marginLeft: 4, fontSize: 11 }}>*</span>}
        </p>
        {isScanning && (
          <p style={{ fontSize: 11, color: M.tenant, fontFamily: M.body, margin: 0 }} className="animate-pulse">Analyse IA en cours…</p>
        )}
        {isDone && doc && (
          <>
            <p style={{ fontSize: 11, color: M.inkFaint, fontFamily: M.body, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} Ko
            </p>
            {doc.expiresAt && (() => {
              const exp = new Date(doc.expiresAt)
              const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000)
              const isUrgent = daysLeft <= 14
              return (
                <p style={{ fontSize: 10, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, color: isUrgent ? M.danger : M.inkFaint, fontFamily: M.body }}>
                  <span>{isUrgent ? '⚠' : '🔒'}</span>
                  {isUrgent
                    ? `Supprimé dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
                    : `Suppression auto le ${exp.toLocaleDateString('fr-FR')}`}
                </p>
              )
            })()}
          </>
        )}
        {!isDone && !isScanning && (
          <p style={{ fontSize: 11, color: M.inkFaint, fontFamily: M.body, margin: 0 }}>{slot.hint}</p>
        )}

        {/* Données extraites (depuis le résultat du scan) */}
        {isDone && scanEntry?.scanResult?.extractedData && (() => {
          const d = scanEntry.scanResult.extractedData
          const chips: { label: string; color: string; bg?: string }[] = []
          // Identité
          if (d.lastName || d.firstName)
            chips.push({ label: `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim(), color: 'bg-blue-50 text-blue-700' })
          if (d.birthDate)    chips.push({ label: `Né(e) ${d.birthDate}`, color: 'bg-blue-50 text-blue-600' })
          if (d.birthCity)    chips.push({ label: `📍 ${d.birthCity}`, color: 'bg-blue-50 text-blue-600' })
          // documentNumber and nationalNumber intentionally not shown (privacy)
          // Revenus
          if (d.netSalary)    chips.push({ label: `Net ${d.netSalary.toLocaleString('fr-FR')} €`, bg: M.tenantLight, color: M.tenant })
          if (d.grossSalary)  chips.push({ label: `Brut ${d.grossSalary.toLocaleString('fr-FR')} €`, bg: '#dbeafe', color: '#1d4ed8' })
          if (d.bulletinPeriod) chips.push({ label: d.bulletinPeriod, bg: '#dbeafe', color: '#1d4ed8' })
          if (d.employerName) chips.push({ label: d.employerName.slice(0, 30), bg: M.muted, color: M.inkMid })
          if (d.contractType) chips.push({ label: d.contractType, bg: '#dbeafe', color: '#1d4ed8' })
          if (d.cafAmount)    chips.push({ label: `CAF ${d.cafAmount.toLocaleString('fr-FR')} €`, bg: M.tenantLight, color: M.tenant })
          if (d.areAmount)    chips.push({ label: `ARE ${d.areAmount.toLocaleString('fr-FR')} €`, bg: '#dbeafe', color: '#1d4ed8' })
          if (d.pensionAmount) chips.push({ label: `Pension ${d.pensionAmount.toLocaleString('fr-FR')} €`, bg: M.warningBg, color: M.warning })
          if (d.fiscalRef)    chips.push({ label: `RFR ${d.fiscalRef.toLocaleString('fr-FR')} €`, bg: M.warningBg, color: M.warning })
          // Domicile
          if (d.issuerName)   chips.push({ label: d.issuerName, bg: M.muted, color: M.inkMid })
          if (d.address)      chips.push({ label: `📍 ${d.address.slice(0, 40)}${d.address.length > 40 ? '…' : ''}`, bg: M.warningBg, color: M.warning })
          // Visale / Garantie
          if (d.visaleAmount) chips.push({ label: `Visale ≤ ${d.visaleAmount} €/mois`, bg: M.tenantLight, color: M.tenant })
          if (d.visaNumber)   chips.push({ label: `Visa ${d.visaNumber}`, bg: '#fdf4ff', color: '#7e22ce' })
          if (d.guarantorLastName || d.guarantorFirstName)
            chips.push({ label: `Garant : ${d.guarantorFirstName ?? ''} ${d.guarantorLastName ?? ''}`.trim(), bg: '#fdf4ff', color: '#7e22ce' })
          if (!chips.length) return null
          return (
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {chips.map((c, i) => (
                <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, fontWeight: 500, fontFamily: M.body, background: c.bg, color: c.color }}>{c.label}</span>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {scanEntry?.temporalLabel && (
          <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 20, fontWeight: 500, fontFamily: M.body }}>
            {scanEntry.temporalLabel.replace(/\s*\(.*\)/, '')}
          </span>
        )}
        {scanEntry?.identityLabel && (
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 500, fontFamily: M.body,
            background: scanEntry.scanResult?.certaintyTokenFound ? M.tenantLight : '#dbeafe',
            color: scanEntry.scanResult?.certaintyTokenFound ? M.tenant : '#1d4ed8',
          }}>{scanEntry.identityLabel}</span>
        )}
        {confidencePct !== undefined && isDone && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, fontFamily: M.body,
            color: confColor(confidencePct), background: `${confColor(confidencePct)}18` }}>
            {Math.round(confidencePct)}%
          </span>
        )}
        {isDone && !slot.required && (
          <span style={{ fontSize: 10, background: M.muted, color: M.inkFaint, padding: '1px 6px', borderRadius: 20, fontFamily: M.body }}>Optionnel</span>
        )}
        {!isDone && !isScanning && !isError && (
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 500, fontFamily: M.body,
            background: slot.required ? M.dangerBg : M.muted,
            color: slot.required ? M.danger : M.inkFaint,
          }}>{slot.required ? 'Requis' : 'Optionnel'}</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button onClick={() => onOpenWhy(slot)}
          style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: M.inkFaint, transition: 'background 0.15s' }}
          title="Pourquoi ce document ?"
          onMouseEnter={(e) => { e.currentTarget.style.background = M.muted }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}>
          <Info className="w-3.5 h-3.5" />
        </button>
        {isDone && doc && (
          <>
            <button
              onClick={() => onView(doc)}
              style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: M.inkFaint, transition: 'background 0.15s', display: 'flex', alignItems: 'center' }}
              title="Voir le document"
              onMouseEnter={(e) => { e.currentTarget.style.background = M.muted }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}>
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(doc.id)}
              style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: M.danger, transition: 'background 0.15s' }}
              title="Supprimer"
              onMouseEnter={(e) => { e.currentTarget.style.background = M.dangerBg }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {!isDone && !isScanning && (
          <>
            <input ref={inputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { onUploadSlot(slot.docType, category, f); e.target.value = '' } }} />
            <button onClick={() => inputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 8, fontWeight: 500,
                fontFamily: M.body, cursor: 'pointer', transition: 'all 0.15s',
                background: isDragOver ? M.tenantLight : M.surface,
                border: `1px solid ${isDragOver ? M.tenant : M.border}`,
                color: isDragOver ? M.tenant : M.inkMid,
              }}>
              <Upload className="w-3 h-3" />
              {isDragOver ? 'Relâcher ici' : 'Déposer'}
            </button>
          </>
        )}
        {isDone && isDragOver && !isScanning && (
          <span style={{ fontSize: 10, fontWeight: 600, background: M.tenantLight, color: M.tenant, border: `1px solid ${M.tenantBorder}`, padding: '2px 8px', borderRadius: 8, fontFamily: M.body }}
            className="animate-pulse">
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
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
        style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(13,12,10,0.18)' }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 15, color: M.ink, fontFamily: M.body, margin: '0 0 6px' }}>{slot.label}</h3>
        <p style={{ fontSize: 13, color: M.inkMid, fontFamily: M.body, margin: '0 0 12px' }}>
          <span style={{ fontWeight: 600, color: M.tenant }}>Pourquoi ? </span>{slot.why}
        </p>
        <p style={{ fontSize: 11, padding: '8px 12px', borderRadius: 8, background: M.muted, color: M.inkFaint, fontFamily: M.body, margin: 0 }}>{slot.hint}</p>
        <button
          onClick={onClose}
          style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${M.border}`, background: M.muted, color: M.inkMid, fontFamily: M.body, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = M.borderMid }}
          onMouseLeave={(e) => { e.currentTarget.style.background = M.muted }}
        >Fermer</button>
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
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 70 }}
      onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden"
        style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: 16, boxShadow: '0 20px 60px rgba(13,12,10,0.18)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 20px 12px', borderBottom: `1px solid ${M.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: M.warningBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle className="w-5 h-5" style={{ color: M.warning }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: M.ink, fontFamily: M.body, margin: 0 }}>Fichier déjà ajouté</h3>
              <p style={{ fontSize: 11, color: M.inkFaint, fontFamily: M.body, margin: 0 }}>{pending.familyLabel}</p>
            </div>
          </div>
          <button onClick={onCancel}
            style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: M.inkFaint, flexShrink: 0, marginLeft: 8 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = M.muted }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: M.inkMid, fontFamily: M.body, lineHeight: 1.5, margin: 0 }}>
            Un document <strong style={{ color: M.ink }}>{pending.familyLabel}</strong> est déjà présent dans votre dossier.
            Que souhaitez-vous faire avec&nbsp;
            <span style={{ fontWeight: 600, color: M.ink }}>{pending.file.name}</span>&nbsp;?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={onReplace}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', background: M.danger, border: 'none', cursor: 'pointer', fontFamily: M.body, transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
              Remplacer le document précédent
            </button>
            <button onClick={onKeepBoth}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: M.ink, background: M.muted, border: `1px solid ${M.border}`, cursor: 'pointer', fontFamily: M.body, transition: 'background 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = M.borderMid }}
              onMouseLeave={(e) => { e.currentTarget.style.background = M.muted }}>
              Conserver les deux documents
            </button>
            <button onClick={onCancel}
              style={{ width: '100%', padding: '8px', fontSize: 11, color: M.inkFaint, background: 'none', border: 'none', cursor: 'pointer', fontFamily: M.body, borderRadius: 8, transition: 'background 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = M.muted }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}>
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
  const chips: { label: string; bg: string; color: string; icon?: string }[] = []

  // ── Identité ──────────────────────────────────────────────────────────────
  if (data.lastName || data.firstName)
    chips.push({ label: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(), bg: '#dbeafe', color: '#1d4ed8', icon: '👤' })
  if (data.birthDate)
    chips.push({ label: `Né(e) le ${data.birthDate}`, bg: '#dbeafe', color: '#1d4ed8', icon: '📅' })
  if (data.birthCity)
    chips.push({ label: `à ${data.birthCity}`, bg: '#dbeafe', color: '#1d4ed8', icon: '🏙️' })
  if (data.documentExpiry)
    chips.push({ label: `Valide jusqu'au ${data.documentExpiry}`, bg: M.muted, color: M.inkFaint })
  if (data.nationality)
    chips.push({ label: `Nat. ${data.nationality}`, bg: '#dbeafe', color: '#1d4ed8' })
  // Note: documentNumber and nationalNumber are NOT displayed for privacy/security reasons

  // ── Revenus / Bulletin ────────────────────────────────────────────────────
  if (data.netSalary)
    chips.push({ label: `Net ${data.netSalary.toLocaleString('fr-FR')} €`, bg: M.tenantLight, color: M.tenant, icon: '💰' })
  if (data.grossSalary)
    chips.push({ label: `Brut ${data.grossSalary.toLocaleString('fr-FR')} €`, bg: '#dbeafe', color: '#1d4ed8' })
  if (data.bulletinPeriod)
    chips.push({ label: data.bulletinPeriod, bg: '#dbeafe', color: '#1d4ed8', icon: '📆' })
  if (data.contractType)
    chips.push({ label: data.contractType, bg: '#dbeafe', color: '#1d4ed8' })
  if (data.employerName)
    chips.push({ label: data.employerName.slice(0, 28), bg: M.muted, color: M.inkMid, icon: '🏢' })
  if (data.siret)
    chips.push({ label: `SIRET ${data.siret}`, bg: M.muted, color: M.inkFaint })
  if (data.cafAmount)
    chips.push({ label: `CAF ${data.cafAmount.toLocaleString('fr-FR')} €/mois`, bg: M.tenantLight, color: M.tenant, icon: '🏦' })
  if (data.areAmount)
    chips.push({ label: `ARE ${data.areAmount.toLocaleString('fr-FR')} €/mois`, bg: '#dbeafe', color: '#1d4ed8', icon: '🏦' })
  if (data.pensionAmount)
    chips.push({ label: `Pension ${data.pensionAmount.toLocaleString('fr-FR')} €/mois`, bg: M.warningBg, color: M.warning, icon: '🏦' })
  if (data.fiscalRef)
    chips.push({ label: `RFR ${data.fiscalRef.toLocaleString('fr-FR')} €`, bg: M.warningBg, color: M.warning, icon: '📊' })

  // ── Domicile ──────────────────────────────────────────────────────────────
  if (data.issuerName)
    chips.push({ label: data.issuerName, bg: M.muted, color: M.inkFaint, icon: '📄' })
  if (data.address)
    chips.push({ label: `${data.address.slice(0, 40)}${data.address.length > 40 ? '…' : ''}`, bg: M.warningBg, color: M.warning, icon: '📍' })
  if (data.rentAmount)
    chips.push({ label: `Loyer ${data.rentAmount.toLocaleString('fr-FR')} €`, bg: M.warningBg, color: M.warning })

  // ── Visale / Garantie ─────────────────────────────────────────────────────
  if (data.visaleAmount)
    chips.push({ label: `Visale ≤ ${data.visaleAmount} €/mois`, bg: M.tenantLight, color: M.tenant, icon: '🛡️' })
  if (data.visaleDuration)
    chips.push({ label: data.visaleDuration, bg: M.tenantLight, color: M.tenant })
  if (data.visaNumber)
    chips.push({ label: `Visa ${data.visaNumber}`, bg: '#fdf4ff', color: '#7e22ce', icon: '🔑' })

  // ── Garant ────────────────────────────────────────────────────────────────
  if (data.guarantorLastName || data.guarantorFirstName)
    chips.push({ label: `Garant : ${data.guarantorFirstName ?? ''} ${data.guarantorLastName ?? ''}`.trim(), bg: '#fdf4ff', color: '#7e22ce', icon: '🤝' })
  if (data.guarantorAddress)
    chips.push({ label: data.guarantorAddress.slice(0, 40), bg: '#fdf4ff', color: '#7e22ce', icon: '📍' })

  // ── Bancaire ──────────────────────────────────────────────────────────────
  if (data.ibanPrefix)
    chips.push({ label: `IBAN ${data.ibanPrefix}`, bg: M.tenantLight, color: M.tenant, icon: '🏛️' })

  if (!chips.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {chips.map((c, i) => (
        <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 500, fontFamily: M.body, background: c.bg, color: c.color }}>
          {c.icon && <span style={{ marginRight: 2 }}>{c.icon}</span>}{c.label}
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
        <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="absolute inset-0 rounded-full animate-ping"
            style={{ background: M.tenantLight, opacity: 0.5 }} />
          <div style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: M.tenantLight, border: `1px solid ${M.tenantBorder}` }}>
            <Cpu className="w-6 h-6 animate-pulse" style={{ color: M.tenant }} />
          </div>
        </div>
        <div className="text-center">
          <p style={{ fontSize: 14, fontWeight: 600, color: M.ink, fontFamily: M.body }}>Analyse IA en cours…</p>
          <p style={{ fontSize: 11, marginTop: 2, color: M.inkFaint, fontFamily: M.body }}>{label}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ position: 'relative', height: 10, borderRadius: 20, overflow: 'hidden', background: M.muted }}>
        <motion.div
          style={{ position: 'absolute', inset: '0 auto 0 0', borderRadius: 20, background: `linear-gradient(90deg, ${M.tenant}, #2e9d61)` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <motion.div
          style={{ position: 'absolute', inset: '0 auto 0 0', width: 64, borderRadius: 20, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
          animate={{ x: ['-64px', '110vw'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 500, color: M.inkFaint, fontFamily: M.body }}>
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
  // ≥90% OU marqueur de certitude → mode confirmation simple
  const isHighConf = scanResult.confidence >= 90 || !!scanResult.certaintyTokenFound
  const families: DocFamily[] = [
    'BULLETIN','REVENUS_FISCAUX','IDENTITE','DOMICILE',
    'EMPLOI','GARANTIE','BANCAIRE','LOGEMENT','UNKNOWN',
  ]

  const confBg    = scanResult.confidence >= 90 ? M.tenantLight : scanResult.confidence >= 70 ? '#dbeafe' : M.warningBg
  const confColor = scanResult.confidence >= 90 ? M.tenant     : scanResult.confidence >= 70 ? '#1d4ed8' : M.warning

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {/* Résultat IA */}
      <div style={{ borderRadius: 12, padding: 16, border: `1px solid ${scanResult.confidence >= 90 ? M.tenantBorder : M.border}`, background: scanResult.confidence >= 90 ? M.tenantLight : M.muted }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
            {FAMILY_ICONS[scanResult.docFamily]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: M.inkFaint, fontFamily: M.body, margin: 0 }}>
              {isHighConf ? 'Détecté avec haute confiance :' : 'Détecté (confirmation requise) :'}
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: M.ink, fontFamily: M.body, margin: 0 }}>{FAMILY_LABELS[scanResult.docFamily]}</p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 8, flexShrink: 0, background: confBg, color: confColor, border: `1px solid ${confColor}30`, fontFamily: M.body }}>
            {Math.round(scanResult.confidence)}%
          </span>
        </div>
        {scanResult.certaintyTokenFound && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, background: M.tenantLight, color: M.tenant, border: `1px solid ${M.tenantBorder}`, borderRadius: 8, padding: '6px 12px', marginBottom: 4, fontFamily: M.body }}>
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            Certifié par marqueur {scanResult.certaintyTokenFound.toUpperCase()}
          </div>
        )}
        {!isHighConf && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, background: M.warningBg, color: M.warning, border: `1px solid #fde68a`, borderRadius: 8, padding: '6px 12px', marginBottom: 4, fontFamily: M.body }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Confiance &lt; 90 % — veuillez choisir la bonne catégorie ci-dessous.
          </div>
        )}
        <ExtractedChips data={scanResult.extractedData} />
      </div>
      {/* Signaux fraude */}
      {scanResult.fraudSignals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {scanResult.fraudSignals.map((sig, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, padding: '8px 12px', borderRadius: 8, fontFamily: M.body,
              background: sig.severity === 'high' ? M.dangerBg : M.warningBg,
              color: sig.severity === 'high' ? M.danger : M.warning,
              border: `1px solid ${sig.severity === 'high' ? '#fca5a5' : '#fde68a'}`,
            }}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {sig.message}
            </div>
          ))}
        </div>
      )}
      {/* Confirmation ≥90% : simple oui/non */}
      {isHighConf && !showPicker ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          <p style={{ fontSize: 11, textAlign: 'center', fontWeight: 500, color: M.inkMid, fontFamily: M.body, margin: 0 }}>
            Est-ce bien le bon document ?
          </p>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => onConfirm(selectedFamily)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', background: M.tenant, border: 'none', cursor: 'pointer', fontFamily: M.body }}>
            ✓ Oui, c'est bien {FAMILY_LABELS[scanResult.docFamily]}
          </motion.button>
          <button onClick={() => setShowPicker(true)}
            style={{ width: '100%', fontSize: 11, padding: '6px', color: M.inkFaint, background: 'none', border: 'none', cursor: 'pointer', fontFamily: M.body }}>
            Non, ce n'est pas la bonne catégorie →
          </button>
        </div>
      ) : (
        /* Picker <90% OU correction manuelle */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: M.inkFaint, fontFamily: M.body, margin: 0 }}>
            {showPicker && isHighConf
              ? 'Choisir la catégorie correcte :'
              : 'Dans quelle catégorie classer ce document ?'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {families.map((f) => {
              const isSelected = selectedFamily === f
              return (
                <button key={f} onClick={() => setSelectedFamily(f)}
                  style={{
                    fontSize: 11, padding: '8px 4px', borderRadius: 8, fontWeight: 500, textAlign: 'center', lineHeight: 1.3, cursor: 'pointer', fontFamily: M.body, transition: 'all 0.15s',
                    background: isSelected ? M.tenantLight : M.muted,
                    border: `1px solid ${isSelected ? M.tenant : M.border}`,
                    color: isSelected ? M.tenant : M.inkMid,
                  }}>
                  {FAMILY_ICONS[f]}<br /><span>{FAMILY_LABELS[f]}</span>
                </button>
              )
            })}
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => onConfirm(selectedFamily)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', background: M.tenant, border: 'none', cursor: 'pointer', fontFamily: M.body }}>
            Confirmer — {FAMILY_LABELS[selectedFamily]}
          </motion.button>
          {showPicker && isHighConf && (
            <button onClick={() => setShowPicker(false)}
              style={{ width: '100%', fontSize: 11, padding: '4px', color: M.inkFaint, background: 'none', border: 'none', cursor: 'pointer', fontFamily: M.body }}>
              ← Retour à la confirmation automatique
            </button>
          )}
          <button onClick={onCancel}
            style={{ width: '100%', fontSize: 11, padding: '4px', color: M.inkFaint, background: 'none', border: 'none', cursor: 'pointer', fontFamily: M.body }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: M.tenant }} />
      <p style={{ fontSize: 13, fontWeight: 600, color: M.ink, fontFamily: M.body, margin: 0 }}>Envoi sécurisé en cours…</p>
      <p style={{ fontSize: 11, color: M.inkFaint, fontFamily: M.body, margin: 0 }}>100 % local · chiffré TLS</p>
    </div>
  )
}

function DoneView({ entry }: { entry: FileEntry }) {
  const family = entry.scanResult?.docFamily
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
        <CheckCircle2 className="w-10 h-10" style={{ color: M.tenant }} />
      </motion.div>
      <p style={{ fontSize: 14, fontWeight: 600, textAlign: 'center', color: M.ink, fontFamily: M.body, margin: 0 }}>Document enregistré !</p>
      {family && family !== 'UNKNOWN' && (
        <p style={{ fontSize: 11, textAlign: 'center', color: M.inkFaint, fontFamily: M.body, margin: 0 }}>
          Ajouté dans la catégorie <strong style={{ color: M.inkMid }}>{FAMILY_LABELS[family]}</strong>
        </p>
      )}
    </div>
  )
}

function ErrorView({ error, onCancel }: { error?: string; onCancel: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
      <AlertCircle className="w-8 h-8" style={{ color: M.danger }} />
      <p style={{ fontSize: 13, fontWeight: 500, textAlign: 'center', color: M.ink, fontFamily: M.body, margin: 0 }}>
        {error ?? "Erreur lors de l'analyse"}
      </p>
      <button
        onClick={onCancel}
        style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${M.border}`, background: M.muted, color: M.inkMid, fontFamily: M.body, fontSize: 13, cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = M.borderMid }}
        onMouseLeave={(e) => { e.currentTarget.style.background = M.muted }}
      >Fermer</button>
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
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        className="w-full max-w-md overflow-hidden"
        style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: 16, boxShadow: '0 20px 60px rgba(13,12,10,0.18)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${M.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: M.ink, fontFamily: M.body, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.file.name}
              </p>
              {queueInfo.total > 1 && (
                <span style={{ fontSize: 10, background: M.tenantLight, color: M.tenant, padding: '1px 8px', borderRadius: 20, fontWeight: 500, flexShrink: 0, fontFamily: M.body }}>
                  {queueInfo.current}/{queueInfo.total}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, marginTop: 2, color: M.inkFaint, fontFamily: M.body, margin: 0 }}>
              {(entry.file.size / 1024).toFixed(0)} Ko
            </p>
          </div>
          {(isScanning || isDone || isError) && (
            <button onClick={onCancel}
              style={{ padding: 6, marginLeft: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: M.inkFaint, flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = M.muted }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Body */}
        <div style={{ padding: '16px 24px 24px', maxHeight: '80vh', overflowY: 'auto' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* File header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: isDone ? (entry.scanResult?.fraudSignals.some(s=>s.severity==='high') ? M.dangerBg : M.tenantLight) : M.muted,
        }}>
          {isDone
            ? <CheckCircle className="w-4 h-4" style={{ color: M.tenant }} />
            : isError ? <FileX className="w-4 h-4" style={{ color: M.danger }} />
            : <Cpu className="w-4 h-4 animate-pulse" style={{ color: M.tenant }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: M.ink, fontFamily: M.body, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.file.name}</p>
          {isDone && entry.scanResult && (
            <p style={{ fontSize: 11, fontWeight: 500, color: entry.scanResult.docFamily !== 'UNKNOWN' ? M.tenant : M.inkFaint, fontFamily: M.body, margin: 0 }}>
              {FAMILY_LABELS[entry.scanResult.docFamily]} · {entry.scanResult.confidence}%
            </p>
          )}
          {!isDone && !isError && (
            <p style={{ fontSize: 11, color: M.tenant, fontFamily: M.body, margin: 0 }} className="animate-pulse">Analyse en cours…</p>
          )}
        </div>
        {(isDone || isError) && (
          <button onClick={onDismiss}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: M.muted, border: `1px solid ${M.border}`, color: M.inkMid, fontFamily: M.body, cursor: 'pointer' }}>
            OK
          </button>
        )}
      </div>

      {/* Progress bar */}
      {!isDone && !isError && (
        <div style={{ height: 6, borderRadius: 20, overflow: 'hidden', background: M.muted }}>
          <motion.div
            style={{ height: 6, borderRadius: 20, background: `linear-gradient(90deg, ${M.tenant}, #2e9d61)` }}
            initial={{ width: 0 }}
            animate={{ width: `${
              entry.phase === 'queued' ? 5 :
              entry.phase === 'pdf'    ? Math.round(entry.phasePct * 0.35) :
              entry.phase === 'ocr'    ? Math.round(35 + entry.phasePct * 0.4) :
              entry.phase === 'qr'     ? 80 :
              entry.phase === 'uploading' ? 90 : 0
            }%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      )}

      {/* Logs */}
      <div ref={logRef}
        style={{ fontFamily: 'monospace', fontSize: 10, maxHeight: 144, overflowY: 'auto', borderRadius: 8, padding: '8px 12px', background: '#0d0c0a', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {entry.scanLogs.length === 0
          ? <p style={{ color: '#4a5568', margin: 0 }}>Initialisation…</p>
          : entry.scanLogs.map((log, i) => (
            <p key={i} style={{ margin: 0, color:
              log.startsWith('[OK]')   ? '#4ade80' :
              log.startsWith('[WARN]') ? '#fbbf24' :
              log.startsWith('[ERR]')  ? '#f87171' :
              '#94a3b8'
            }}>{log}</p>
          ))
        }
      </div>

      {/* Signal breakdown (after done) */}
      {isDone && entry.scanResult && 'signals' in entry.scanResult && (
        <SignalBreakdown signals={(entry.scanResult as MultiSignalResult).signals} />
      )}

      {/* Fraud alerts */}
      {isDone && entry.scanResult && entry.scanResult.fraudSignals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {entry.scanResult.fraudSignals.map((sig, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, padding: '8px 12px', borderRadius: 8, fontFamily: M.body,
              background: sig.severity === 'high' ? M.dangerBg : M.warningBg,
              color: sig.severity === 'high' ? M.danger : M.warning,
            }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, fontFamily: M.body, margin: '0 0 12px' }}>Résumé rapide</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Uploadés',  value: uploaded,      textColor: M.tenant },
            { label: 'Manquants', value: missing,       textColor: missing  > 0 ? M.warning : M.tenant },
            { label: 'Suspects',  value: suspects,      textColor: suspects > 0 ? M.danger  : M.tenant },
            { label: 'Score',     value: `${score}%`,   textColor: score >= 65 ? '#1d4ed8'  : M.warning },
          ].map(({ label, value, textColor }) => (
            <div key={label} style={{ borderRadius: 10, padding: '8px 12px', textAlign: 'center', background: M.surface, border: `1px solid ${M.border}` }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: textColor, fontFamily: M.body, margin: 0 }}>{value}</p>
              <p style={{ fontSize: 10, color: M.inkFaint, fontFamily: M.body, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {crossDocWarnings.length > 0 && (
        <div style={{ border: `1px solid #fde68a`, background: M.warningBg, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: M.warning, fontFamily: M.body, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle className="w-3.5 h-3.5" /> Cohérence inter-documents
          </p>
          {crossDocWarnings.map((w, i) => (
            <p key={i} style={{ fontSize: 11, color: M.warning, fontFamily: M.body, margin: 0 }}>{w}</p>
          ))}
        </div>
      )}

      <div style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, fontFamily: M.body, margin: '0 0 8px' }}>Conseil IA</p>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: M.inkMid, fontFamily: M.body, margin: 0 }}>{tip}</p>
      </div>

      <p style={{ fontSize: 10, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: M.inkFaint, fontFamily: M.body }}>
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
  const [viewerDoc,        setViewerDoc]         = useState<TenantDocument | null>(null)
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

  const celebratedRef = useRef(false)
  useEffect(() => {
    if (score >= 90 && !celebratedRef.current) {
      celebratedRef.current = true
      celebrateBig()
    }
  }, [score])
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: M.bg }}>
          <Loader className="w-6 h-6 animate-spin" style={{ color: M.tenant }} />
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
          style={{ backgroundColor: '#ffffff', borderColor: '#e4e1db' }}>
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
                  <span className="text-sm" style={{ color: '#9e9b96' }}>
                    — {user.firstName} {user.lastName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full" style={{ background: strength.bgColor, color: strength.textColor }}>
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
                style={{ backgroundColor: '#1b5e3b', boxShadow: '0 2px 8px rgba(27,94,59,0.20)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0066d6' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1b5e3b' }}
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
              <p className="text-sm mb-4" style={{ color: '#9e9b96' }}>
                ≥ 90 % de confiance → confirmation simple · &lt; 90 % → vous choisissez la catégorie
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {[
                  { icon: Cpu,    text: 'OCR intégré' },
                  { icon: Layers, text: 'Auto-classement' },
                  { icon: Lock,   text: '100% local' },
                ].map(({ icon: I, text }) => (
                  <span key={text} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1db', color: '#9e9b96' }}>
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
                  onView={setViewerDoc}
                />
              )
            })}

          </div>

          {/* ── SidePanel (1/3) ───────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-3xl p-5 border space-y-4"
              style={{ backgroundColor: '#ffffff', borderColor: '#e4e1db' }}>

              <AnimatePresence mode="wait">
                {activeScanEntry ? (
                  <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2"
                      style={{ color: '#9e9b96' }}>
                      <Cpu className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> Analyse IA
                    </p>
                    <LiveScanConsole entry={activeScanEntry} onDismiss={() => setActiveScanId(null)} />
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3"
                      style={{ color: '#9e9b96' }}>Vue d'ensemble</p>
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

        {viewerDoc && (
          <DocumentViewerModal
            fileUrl={viewerDoc.fileUrl}
            fileName={viewerDoc.fileName}
            onClose={() => setViewerDoc(null)}
          />
        )}

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
          <p className="text-xs" style={{ color: '#9e9b96' }}>
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
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#9e9b96' }}>
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
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#9e9b96' }}>
              <Home className="w-3.5 h-3.5" /> Coordonnées
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Adresse postale" name="address" placeholder="12 rue de la Paix, 75001 Paris" />
            </div>
          </div>

          {/* Situation professionnelle */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#9e9b96' }}>
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
  documents, entries, onUploadSlot, onDelete, onOpenWhy, onView,
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
  onView: (doc: TenantDocument) => void
}) {
  const [open, setOpen] = useState(true)
  const totalRequired = cat.slots.filter((s) => s.required).length

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#e4e1db', backgroundColor: '#ffffff' }}>
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
            <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded-full font-medium" style={{ color: '#9e9b96' }}>
              {doneCount}/{totalRequired} requis
            </span>
          ) : (
            <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded-full" style={{ color: '#9e9b96' }}>Vide</span>
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
                    onUploadSlot={onUploadSlot}
                    onDelete={onDelete}
                    onOpenWhy={onOpenWhy}
                    onView={onView}
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
