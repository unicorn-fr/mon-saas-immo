import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { inputStyle } from './ui'

export interface AddressSuggestion {
  label: string
  postalCode: string
  city: string
  inseeCode: string
  banId: string
}

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (s: AddressSuggestion) => void
  error?: string
  placeholder?: string
  autoFocus?: boolean
}

/**
 * Suggestions d'adresses de la Base Adresse Nationale (Géoplateforme), pour un champ texte :
 * liste déroulante, flèches du clavier, Entrée pour choisir, Échap pour fermer.
 */
export function useAddressSuggestions(value: string, onSelect: (s: AddressSuggestion) => void) {
  const id = useId()
  const [items, setItems] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const skip = useRef(false)

  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return
    }
    const q = value.trim()
    if (q.length < 4) {
      setItems([])
      return
    }
    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      api<AddressSuggestion[]>(`/geo/addresses?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => {
          setItems(r)
          setOpen(r.length > 0)
          setActive(-1)
        })
        .catch(() => undefined)
    }, 250)
    return () => {
      window.clearTimeout(t)
      ctrl.abort()
    }
  }, [value])

  function choose(s: AddressSuggestion) {
    skip.current = true
    onSelect(s)
    setOpen(false)
    setItems([])
  }

  const inputProps = {
    id,
    maxLength: 300,
    role: 'combobox' as const,
    'aria-expanded': open,
    'aria-controls': `${id}-list`,
    'aria-autocomplete': 'list' as const,
    'aria-activedescendant': active >= 0 ? `${id}-${active}` : undefined,
    autoComplete: 'off',
    onBlur: () => window.setTimeout(() => setOpen(false), 150),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (!open || items.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => (a + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => (a <= 0 ? items.length - 1 : a - 1))
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault()
        choose(items[active])
      } else if (e.key === 'Escape') setOpen(false)
    },
  }

  const list =
    open && items.length > 0 ? (
      <ul id={`${id}-list`} role="listbox" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, margin: '6px 0 0', padding: 6, listStyle: 'none', background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 14, boxShadow: '0 12px 40px rgba(26,26,46,0.12)' }}>
        {items.map((s, i) => (
          <li
            key={s.banId || s.label}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault()
              choose(s)
            }}
            style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 16, background: i === active ? BAI.ownerLight : 'transparent' }}
          >
            {s.label}
          </li>
        ))}
      </ul>
    ) : null

  return { id, inputProps, list, reopen: () => setOpen(true) }
}

/** Adresse avec suggestions (tunnel et « Ajouter un logement »). */
export function AddressField({ label, value, onChange, onSelect, error, placeholder, autoFocus }: Props) {
  const { id, inputProps, list, reopen } = useAddressSuggestions(value, onSelect)
  return (
    <div className="stack" style={{ gap: 8, position: 'relative' }}>
      <label htmlFor={id} style={{ fontSize: 15, fontWeight: 600 }}>
        {label}
      </label>
      <input
        {...inputProps}
        aria-invalid={Boolean(error) || undefined}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          reopen()
        }}
        style={inputStyle(Boolean(error))}
      />
      {list}
      {error ? (
        <span role="alert" style={{ fontSize: 14, color: BAI.error }}>
          {error}
        </span>
      ) : null}
    </div>
  )
}
