import { useState } from 'react'
import { Bookmark, X, Check } from 'lucide-react'
import type { PropertyFilters } from '../../types/property.types'

interface NLChip { label: string; value: string }

interface SavedSearch {
  id: string
  name: string
  filters: PropertyFilters
  chips: NLChip[]
  nlQuery: string
  savedAt: string
}

interface Props {
  currentFilters: PropertyFilters
  currentChips: NLChip[]
  currentNlQuery: string
  hasChips: boolean
  onApply: (saved: SavedSearch) => void
}

const STORAGE_KEY = 'bailio_saved_searches'

function loadSaved(): SavedSearch[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function persistSaved(list: SavedSearch[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function SavedSearches({ currentFilters, currentChips, currentNlQuery, hasChips, onApply }: Props) {
  const [saved, setSaved] = useState<SavedSearch[]>(loadSaved)
  const [saving, setSaving] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const defaultName = currentChips.find(c => c.label === 'Ville')?.value
    ?? currentChips[0]?.value
    ?? 'Ma recherche'

  function handleSave() {
    const name = nameInput.trim() || defaultName
    const entry: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: currentFilters,
      chips: currentChips,
      nlQuery: currentNlQuery,
      savedAt: new Date().toISOString(),
    }
    const next = [entry, ...saved].slice(0, 8)
    setSaved(next)
    persistSaved(next)
    setSaving(false)
    setNameInput('')
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const next = saved.filter(s => s.id !== id)
    setSaved(next)
    persistSaved(next)
  }

  if (!hasChips && saved.length === 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', marginTop: 12 }}>
      {/* Save button */}
      {hasChips && !saving && (
        <button
          onClick={() => { setSaving(true); setNameInput(defaultName) }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '6px 12px', borderRadius: 999, border: '1px dashed rgba(196,151,106,0.5)',
            background: 'rgba(196,151,106,0.08)', color: '#c4976a',
            fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <Bookmark style={{ width: 12, height: 12 }} />
          Sauvegarder cette recherche
        </button>
      )}

      {/* Inline name input */}
      {hasChips && saving && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(196,151,106,0.5)', borderRadius: 999, padding: '4px 6px 4px 12px',
        }}>
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaving(false) }}
            placeholder="Nom de la recherche…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, width: 150 }}
          />
          <button onClick={handleSave} style={{ background: '#c4976a', border: 'none', borderRadius: 999, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check style={{ width: 12, height: 12, color: '#fff' }} />
          </button>
          <button onClick={() => setSaving(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
            <X style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>
      )}

      {/* Saved search chips */}
      {saved.map(s => (
        <button key={s.id} onClick={() => onApply(s)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '6px 10px 6px 12px', borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.9)', fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          <Bookmark style={{ width: 11, height: 11, opacity: 0.7 }} />
          {s.name}
          <span
            onClick={e => handleDelete(s.id, e)}
            style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X style={{ width: 9, height: 9 }} />
          </span>
        </button>
      ))}
    </div>
  )
}
