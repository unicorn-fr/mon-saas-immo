/**
 * SignalBreakdown.tsx
 * Mini visualization of the 3 independent classification signals:
 *   📝 Text (proximity-anchored scoring)
 *   📄 Filename (keyword match)
 *   📐 Structure (page count + file size)
 */

import type { MultiSignalResult, SignalDetail } from '../../utils/document'
import { FAMILY_LABELS } from '../../utils/document'

interface SignalBreakdownProps {
  signals: MultiSignalResult['signals']
  /** If true, renders in compact single-line mode for use inside DocumentRows */
  compact?: boolean
}

function SignalBar({ signal, label, icon }: { signal: SignalDetail | null; label: string; icon: string }) {
  if (!signal) {
    return (
      <div className="flex items-center gap-2 opacity-40">
        <span className="text-[10px] w-3">{icon}</span>
        <span className="text-[10px] text-[#9e9b96] w-14 flex-shrink-0">{label}</span>
        <div className="flex-1 h-1.5 rounded-full bg-[#e4e1db]" />
        <span className="text-[10px] text-[#9e9b96] w-6 text-right">—</span>
      </div>
    )
  }

  const pct   = Math.round(signal.score)
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#86868b'
  const family = FAMILY_LABELS[signal.family] ?? signal.family

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-3">{icon}</span>
      <span className="text-[10px] text-[#5a5754] w-14 flex-shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#e4e1db]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold w-6 text-right" style={{ color }}>{pct}%</span>
      <span className="text-[10px] text-[#9e9b96] truncate max-w-[72px]">{family}</span>
    </div>
  )
}

function fusionLabel(fusion: MultiSignalResult['signals']['fusion'], bonus: number): { text: string; color: string } {
  switch (fusion) {
    case 'certain':          return { text: 'Certifié (token MRZ / officiel)',  color: '#10b981' }
    case 'consensus':        return { text: `Consensus · +${bonus} pts`,        color: '#3b82f6' }
    case 'text_dominant':    return { text: 'Texte dominant',                    color: '#1a1a2e' }
    case 'filename_override':return { text: 'Fichier override (texte < 40%)',    color: '#f59e0b' }
    case 'unknown':          return { text: 'Non reconnu',                       color: '#86868b' }
  }
}

export function SignalBreakdown({ signals, compact = false }: SignalBreakdownProps) {
  const { text: fusion, color } = fusionLabel(signals.fusion, signals.fusionBonus)

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <SignalBar signal={signals.text}      label="Texte"   icon="📝" />
        <SignalBar signal={signals.filename}  label="Fichier" icon="📄" />
        <SignalBar signal={signals.structure} label="Format"  icon="📐" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: '#e4e1db', background: '#f4f2ee' }}>
      <p className="text-[10px] font-bold text-[#9e9b96] uppercase tracking-wide mb-1">
        Analyse IA — 3 signaux
      </p>

      <SignalBar signal={signals.text}      label="Texte"   icon="📝" />
      <SignalBar signal={signals.filename}  label="Fichier" icon="📄" />
      <SignalBar signal={signals.structure} label="Format"  icon="📐" />

      <div className="pt-1 border-t flex items-center gap-1.5" style={{ borderColor: '#e4e1db' }}>
        <span className="text-[10px]">→</span>
        <span className="text-[10px] font-semibold" style={{ color }}>{fusion}</span>
      </div>
    </div>
  )
}
