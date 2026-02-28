/**
 * KanbanBoard.tsx
 * Tableau de contrôle drag & drop pour le Dossier Locatif.
 *
 * Colonnes = familles documentaires (DocFamily).
 * Cartes   = fichiers scannés (FileEntry).
 * Drag d'une colonne à l'autre = reclassement manuel.
 *
 * Dépendances : @dnd-kit/core, @dnd-kit/utilities, framer-motion
 */

import { useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileX, FileText, GripVertical,
  ShieldCheck, ShieldAlert, AlertTriangle, Cpu, QrCode,
} from 'lucide-react'
import { useState } from 'react'
import type { DocFamily } from '../../utils/DocumentIntelligence'
import { FAMILY_LABELS, FAMILY_COLORS } from '../../utils/DocumentIntelligence'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal subset of FileEntry needed by the board */
export interface KanbanEntry {
  id: string
  file: File
  phase: string
  confidence: number
  docFamily: DocFamily
  docType: string | null
  assignedDocType: string | null
  fraudSignalCount: number
  hasMediumRisk: boolean
  hasHighRisk: boolean
  hasQrCode: boolean
  ocrUsed: boolean
  mrzFound?: boolean
  temporalLabel?: string  // e.g. "Janvier 2025 (M-1)"
  identityLabel?: string  // e.g. "✓ MRZ • Martin Paul"
  scanLogs: string[]
}

interface KanbanBoardProps {
  entries: KanbanEntry[]
  onMoveEntry: (id: string, newFamily: DocFamily) => void
}

// ─── Column order ─────────────────────────────────────────────────────────────

const COLUMN_ORDER: DocFamily[] = [
  'IDENTITE',
  'BULLETIN',
  'REVENUS_FISCAUX',
  'EMPLOI',
  'GARANTIE',
  'DOMICILE',
  'BANCAIRE',
  'LOGEMENT',
  'UNKNOWN',
]

// ─── DraggableCard ────────────────────────────────────────────────────────────

function DraggableCard({
  entry,
  isDragging,
}: {
  entry: KanbanEntry
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: entry.id })
  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined

  return (
    <div ref={setNodeRef} style={style}>
      <CardContent entry={entry} isDragging={isDragging} {...attributes} {...listeners} />
    </div>
  )
}

function CardContent({
  entry,
  isDragging,
  ...dragProps
}: {
  entry: KanbanEntry
  isDragging?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  const [logsOpen, setLogsOpen] = useState(false)

  const riskColor =
    entry.hasHighRisk ? 'border-red-200' :
    entry.hasMediumRisk ? 'border-amber-200' :
    entry.phase === 'done' ? 'border-emerald-200' :
    'border-[var(--border)]'

  const confidencePct = Math.min(100, Math.round(entry.confidence))
  const confColor =
    confidencePct >= 70 ? '#10b981' :
    confidencePct >= 40 ? '#f59e0b' :
    '#ef4444'

  return (
    <motion.div
      layout
      initial={isDragging ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border bg-[var(--surface-card)] cursor-grab active:cursor-grabbing select-none ${riskColor} ${isDragging ? 'shadow-2xl scale-105' : 'shadow-sm'}`}
      style={{ transition: isDragging ? 'none' : undefined }}
    >
      {/* Drag handle + file info */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2" {...dragProps}>
        <GripVertical className="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-tertiary)]" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate text-[var(--text-primary)]">
            {entry.file.name}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {(entry.file.size / 1024).toFixed(0)} Ko
            {entry.file.type.includes('pdf') ? ' · PDF' : ' · Image'}
          </p>
        </div>
        {/* Confidence pill */}
        {entry.phase === 'done' && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ color: confColor, backgroundColor: `${confColor}20` }}
          >
            {confidencePct}%
          </span>
        )}
      </div>

      {/* Temporal / identity badge */}
      {(entry.temporalLabel || entry.identityLabel) && (
        <div className="px-3 pb-1 flex flex-wrap gap-1">
          {entry.temporalLabel && (
            <span className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">
              {entry.temporalLabel}
            </span>
          )}
          {entry.identityLabel && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              entry.mrzFound ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'
            }`}>
              {entry.identityLabel}
            </span>
          )}
        </div>
      )}

      {/* Risk / QR / OCR badges */}
      <div className="px-3 pb-2 flex items-center gap-1.5 flex-wrap">
        {entry.hasHighRisk && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
            <ShieldAlert className="w-2.5 h-2.5" /> Suspect
          </span>
        )}
        {entry.hasMediumRisk && !entry.hasHighRisk && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
            <AlertTriangle className="w-2.5 h-2.5" /> À vérifier
          </span>
        )}
        {!entry.hasHighRisk && !entry.hasMediumRisk && entry.phase === 'done' && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            <ShieldCheck className="w-2.5 h-2.5" /> OK
          </span>
        )}
        {entry.hasQrCode && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
            <QrCode className="w-2.5 h-2.5" /> QR
          </span>
        )}
        {entry.ocrUsed && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
            <Cpu className="w-2.5 h-2.5" /> OCR
          </span>
        )}
        {entry.phase === 'error' && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
            <FileX className="w-2.5 h-2.5" /> Erreur
          </span>
        )}
      </div>

      {/* Live scan logs toggle */}
      {entry.scanLogs.length > 0 && (
        <div className="border-t border-[var(--border)] px-3 py-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setLogsOpen((v) => !v) }}
            className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}  // don't trigger drag
          >
            <FileText className="w-2.5 h-2.5" />
            {logsOpen ? 'Masquer logs' : `Logs (${entry.scanLogs.length})`}
          </button>
          <AnimatePresence>
            {logsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="font-mono text-[9px] mt-1 space-y-0.5 max-h-24 overflow-y-auto pr-1">
                  {entry.scanLogs.map((log, i) => (
                    <p key={i} className={
                      log.startsWith('[OK]')   ? 'text-emerald-600' :
                      log.startsWith('[WARN]') ? 'text-amber-600'   :
                      log.startsWith('[ERR]')  ? 'text-red-600'     :
                      'text-[var(--text-tertiary)]'
                    }>
                      {log}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

// ─── DroppableColumn ─────────────────────────────────────────────────────────

function DroppableColumn({
  family,
  entries,
}: {
  family: DocFamily
  entries: KanbanEntry[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: family })
  const colors = FAMILY_COLORS[family]
  const label  = FAMILY_LABELS[family]
  const isEmpty = entries.length === 0

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 transition-colors duration-150 min-h-[120px] flex flex-col ${
        isOver
          ? `border-dashed ${colors.border.replace('border', 'border-2')} bg-opacity-30`
          : 'border-transparent'
      }`}
      style={{
        backgroundColor: isOver ? undefined : 'var(--surface-subtle)',
        ...(isOver ? { backgroundColor: `var(--surface-card)` } : {}),
      }}
    >
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${colors.bg}`}>
        <span className={`text-xs font-bold ${colors.text} flex-1`}>{label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {entries.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 flex-1">
        <AnimatePresence mode="popLayout">
          {entries.map((entry) => (
            <DraggableCard key={entry.id} entry={entry} />
          ))}
        </AnimatePresence>
        {isEmpty && isOver && (
          <div className={`rounded-lg border-2 border-dashed ${colors.border} h-16 flex items-center justify-center`}>
            <p className={`text-xs ${colors.text} opacity-60`}>Déposer ici</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── KanbanBoard ─────────────────────────────────────────────────────────────

export function KanbanBoard({ entries, onMoveEntry }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      if (!over) return
      const entryId   = active.id as string
      const newFamily = over.id as DocFamily
      const current = entries.find((e) => e.id === entryId)
      if (current && current.docFamily !== newFamily) {
        onMoveEntry(entryId, newFamily)
      }
    },
    [entries, onMoveEntry],
  )

  // Group entries by family
  const byFamily = COLUMN_ORDER.reduce<Record<DocFamily, KanbanEntry[]>>(
    (acc, f) => {
      acc[f] = entries.filter((e) => e.docFamily === f)
      return acc
    },
    {} as Record<DocFamily, KanbanEntry[]>,
  )

  const activeEntry = activeId ? entries.find((e) => e.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-3 items-start">
        {COLUMN_ORDER.map((family) => (
          <div key={family} className="flex-shrink-0 w-52">
            <DroppableColumn
              family={family}
              entries={byFamily[family] ?? []}
            />
          </div>
        ))}
      </div>

      {/* Drag overlay — floating ghost card */}
      <DragOverlay dropAnimation={null}>
        {activeEntry ? (
          <CardContent entry={activeEntry} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
