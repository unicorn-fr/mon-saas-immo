import { useState, useEffect, useRef, useCallback, type ElementType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteStore } from '../../store/favoriteStore'
import { PropertyCard } from '../../components/property/PropertyCard'
import { PropertyFilters, Property } from '../../types/property.types'
import { Layout } from '../../components/layout/Layout'
import { SearchMap } from '../../components/property/SearchMap'
import { BAI } from '../../constants/bailio-tokens'
import {
  Search, Grid3x3, Map as MapIcon, X, SlidersHorizontal,
  MapPin, Bell, ChevronDown, ChevronUp, Check,
} from 'lucide-react'
import EmailCapture from '../../components/ui/EmailCapture'

// ─── Design tokens locaux ──────────────────────────────────────────────────────

const T = {
  body:         BAI.fontBody,
  display:      BAI.fontDisplay,
  ink:          BAI.ink,
  inkMid:       BAI.inkMid,
  inkFaint:     BAI.inkFaint,
  border:       BAI.border,
  bg:           BAI.bgBase,
  surface:      BAI.bgSurface,
  muted:        BAI.bgMuted,
  input:        '#f8f7f4',
  caramel:      BAI.caramel,
  caramelLight: '#fdf5ec',
  caramelBorder:'rgba(196,151,106,0.35)',
  night:        BAI.night,
  radius:       9,
  radiusLg:     13,
}

// ─── Constantes filtres ────────────────────────────────────────────────────────

const TYPE_OPTS = [
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE',     label: 'Maison' },
  { value: 'STUDIO',    label: 'Studio' },
  { value: 'DUPLEX',    label: 'Duplex' },
  { value: 'LOFT',      label: 'Loft' },
]

const DPE_GRADES = [
  { value: 'A', color: '#3b8a3e', bg: '#e8f5e9' },
  { value: 'B', color: '#66a832', bg: '#f1f8e4' },
  { value: 'C', color: '#a6c822', bg: '#f7fce4' },
  { value: 'D', color: '#f5c518', bg: '#fffde7' },
  { value: 'E', color: '#f5921e', bg: '#fff3e0' },
  { value: 'F', color: '#e25b1a', bg: '#fce8de' },
  { value: 'G', color: '#c62828', bg: '#fce4e4' },
]

const AMENITY_CHIPS = [
  { key: 'hasBalcony',  label: 'Balcon' },
  { key: 'hasTerrace',  label: 'Terrasse' },
  { key: 'hasGarden',   label: 'Jardin' },
  { key: 'hasParking',  label: 'Parking' },
  { key: 'hasCellar',   label: 'Cave' },
  { key: 'hasElevator', label: 'Ascenseur' },
] as const

// ─── Helpers ───────────────────────────────────────────────────────────────────

function countActive(f: PropertyFilters, city: string): number {
  let n = 0
  if (city) n++
  if (f.type) n++
  if (f.minPrice || f.maxPrice) n++
  if (f.minSurface || f.maxSurface) n++
  if (f.minBedrooms || f.maxBedrooms) n++
  if (f.minBathrooms || f.maxBathrooms) n++
  if (f.furnished) n++
  if (f.hasBalcony) n++
  if (f.hasTerrace) n++
  if (f.hasGarden) n++
  if (f.hasParking) n++
  if (f.hasCellar) n++
  if (f.hasElevator) n++
  return n
}

// Traduit hasTerrace/hasCellar en amenities[] avant d'envoyer à l'API
function resolveFilters(f: PropertyFilters): PropertyFilters {
  const extra: string[] = [...(f.amenities ?? [])]
  if (f.hasTerrace  && !extra.includes('terrace')) extra.push('terrace')
  if (f.hasCellar   && !extra.includes('cellar'))  extra.push('cellar')
  const { hasTerrace, hasCellar, minBedrooms, maxBedrooms, minBathrooms, maxBathrooms, ...rest } = f
  return {
    ...rest,
    ...(extra.length ? { amenities: extra } : {}),
    ...(minBedrooms !== undefined ? { bedrooms: minBedrooms } : {}),
    ...(maxBedrooms !== undefined ? { maxBedrooms } : {}),
    ...(minBathrooms !== undefined ? { bathrooms: minBathrooms } : {}),
    ...(maxBathrooms !== undefined ? { maxBathrooms } : {}),
  }
}

// ─── Stepper de pièces ────────────────────────────────────────────────────────

interface StepperProps {
  value: number | undefined
  onChange: (v: number | undefined) => void
  max?: number
  label: string
}

function RoomStepper({ value, onChange, max = 5, label }: StepperProps) {
  const options = Array.from({ length: max }, (_, i) => i + 1)
  return (
    <div>
      <p style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{label}</p>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onChange(undefined)}
          style={{
            padding: '6px 10px', borderRadius: T.radius, border: `1px solid ${value === undefined ? T.caramel : T.border}`,
            background: value === undefined ? T.caramelLight : T.surface,
            color: value === undefined ? T.caramel : T.inkFaint,
            fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Tous
        </button>
        {options.map(n => (
          <button
            key={n}
            onClick={() => onChange(value === n ? undefined : n)}
            style={{
              padding: '6px 10px', borderRadius: T.radius,
              border: `1px solid ${value !== undefined && value <= n ? T.caramel : T.border}`,
              background: value !== undefined && value <= n ? T.caramelLight : T.surface,
              color: value !== undefined && value <= n ? T.caramel : T.inkMid,
              fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {n === max ? `${n}+` : n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Champ min/max générique ──────────────────────────────────────────────────

interface RangeFieldProps {
  labelMin: string; labelMax: string
  min?: number; max?: number
  onMin: (v: number | undefined) => void
  onMax: (v: number | undefined) => void
  unit?: string; step?: number
}

function RangeField({ labelMin, labelMax, min, max, onMin, onMax, unit = '', step = 1 }: RangeFieldProps) {
  const inpStyle: React.CSSProperties = {
    flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: T.radius,
    padding: '9px 10px', fontFamily: T.body, fontSize: 13, color: T.ink,
    outline: 'none', boxSizing: 'border-box', minWidth: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="number" placeholder={labelMin} value={min ?? ''} min={0} step={step}
        onChange={e => onMin(e.target.value ? Number(e.target.value) : undefined)}
        style={inpStyle}
        className="sl-input"
      />
      <span style={{ color: T.inkFaint, fontSize: 12, flexShrink: 0 }}>—</span>
      <input
        type="number" placeholder={labelMax} value={max ?? ''} min={0} step={step}
        onChange={e => onMax(e.target.value ? Number(e.target.value) : undefined)}
        style={inpStyle}
        className="sl-input"
      />
      {unit && <span style={{ color: T.inkFaint, fontSize: 12, flexShrink: 0 }}>{unit}</span>}
    </div>
  )
}

// ─── Section accordéon ────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginBottom: 4 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px',
          fontFamily: T.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: T.inkMid,
        }}
      >
        {title}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  )
}

// ─── Panneau de filtres complet (sidebar + mobile) ────────────────────────────

interface FilterPanelProps {
  filters: PropertyFilters
  city: string
  onCity: (v: string) => void
  onChange: (f: PropertyFilters) => void
  onReset: () => void
  total: number
  compact?: boolean // pour le futur
}

function FilterPanel({ filters, city, onCity, onChange, onReset, total }: FilterPanelProps) {
  const active = countActive(filters, city)

  return (
    <aside style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg,
      padding: '18px 18px 4px', fontFamily: T.body,
      position: 'sticky', top: 72,
      maxHeight: 'calc(100vh - 90px)', overflowY: 'auto',
    }}>
      {/* Titre + reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 18, color: T.ink }}>
          {total > 0 ? `${total} bien${total > 1 ? 's' : ''}` : 'Filtres'}
        </span>
        {active > 0 && (
          <button onClick={onReset} style={{ fontSize: 12, color: T.caramel, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
            Tout effacer
          </button>
        )}
      </div>

      {/* Localisation */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Localisation
        </label>
        <div style={{ position: 'relative' }}>
          <MapPin size={13} color={T.caramel} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            className="sl-input"
            type="text" value={city} onChange={e => onCity(e.target.value)}
            placeholder="Ville, code postal…"
            style={{ width: '100%', paddingLeft: 30, paddingRight: city ? 32 : 12, paddingTop: 10, paddingBottom: 10, borderRadius: T.radius, border: `1px solid ${T.border}`, background: T.input, fontFamily: T.body, fontSize: 13, color: T.ink, outline: 'none', boxSizing: 'border-box' }}
          />
          {city && (
            <button onClick={() => onCity('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.inkFaint, padding: 2 }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Type de bien */}
      <Section title="Type de bien" defaultOpen>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TYPE_OPTS.map(t => {
            const sel = filters.type === t.value
            return (
              <button
                key={t.value}
                onClick={() => onChange({ ...filters, type: sel ? undefined : t.value as any })}
                style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                  fontFamily: T.body, fontSize: 12, fontWeight: sel ? 700 : 500,
                  border: `1px solid ${sel ? T.caramel : T.border}`,
                  background: sel ? T.caramelLight : T.surface,
                  color: sel ? T.caramel : T.inkMid,
                  transition: 'all 0.12s',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Budget */}
      <Section title="Budget (€/mois)" defaultOpen>
        <RangeField
          labelMin="Min" labelMax="Max" unit="€"
          min={filters.minPrice} max={filters.maxPrice}
          onMin={v => onChange({ ...filters, minPrice: v })}
          onMax={v => onChange({ ...filters, maxPrice: v })}
          step={50}
        />
      </Section>

      {/* Surface */}
      <Section title="Surface (m²)" defaultOpen={false}>
        <RangeField
          labelMin="Min" labelMax="Max" unit="m²"
          min={filters.minSurface} max={filters.maxSurface}
          onMin={v => onChange({ ...filters, minSurface: v })}
          onMax={v => onChange({ ...filters, maxSurface: v })}
          step={5}
        />
      </Section>

      {/* Pièces & Chambres */}
      <Section title="Pièces & Chambres" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <RoomStepper
            label="Nombre de chambres (min)"
            value={filters.minBedrooms}
            onChange={v => onChange({ ...filters, minBedrooms: v, maxBedrooms: undefined })}
          />
          <RoomStepper
            label="Salles de bain (min)"
            value={filters.minBathrooms}
            onChange={v => onChange({ ...filters, minBathrooms: v, maxBathrooms: undefined })}
            max={3}
          />
        </div>
      </Section>

      {/* Meublé */}
      <Section title="Ameublement" defaultOpen={false}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'furnished', label: 'Meublé' },
            { key: 'unfurnished', label: 'Non meublé' },
          ].map(({ key, label }) => {
            const sel = !!filters[key as keyof PropertyFilters]
            return (
              <button
                key={key}
                onClick={() => onChange({ ...filters, [key]: sel ? undefined : true })}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: T.radius, cursor: 'pointer',
                  fontFamily: T.body, fontSize: 13, fontWeight: sel ? 700 : 500,
                  border: `1px solid ${sel ? T.caramel : T.border}`,
                  background: sel ? T.caramelLight : T.surface,
                  color: sel ? T.caramel : T.inkMid,
                  transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}
              >
                {sel && <Check size={12} />}
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Extérieur & Annexes */}
      <Section title="Extérieur & Annexes" defaultOpen={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {AMENITY_CHIPS.map(({ key, label }) => {
            const sel = !!filters[key as keyof PropertyFilters]
            return (
              <button
                key={key}
                onClick={() => onChange({ ...filters, [key]: sel ? undefined : true })}
                style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                  fontFamily: T.body, fontSize: 12, fontWeight: sel ? 700 : 500,
                  border: `1px solid ${sel ? T.caramel : T.border}`,
                  background: sel ? T.caramelLight : T.surface,
                  color: sel ? T.caramel : T.inkMid,
                  transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* DPE */}
      <Section title="DPE — Performance énergétique" defaultOpen={false}>
        <p style={{ fontFamily: T.body, fontSize: 11, color: T.inkFaint, margin: '0 0 8px', lineHeight: 1.5 }}>
          Filtre visuel — données disponibles prochainement.
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          {DPE_GRADES.map(g => (
            <button
              key={g.value}
              disabled
              title="Bientôt disponible"
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 6, border: `1px solid ${T.border}`,
                background: g.bg, color: g.color, fontFamily: T.body, fontSize: 12, fontWeight: 700,
                cursor: 'not-allowed', opacity: 0.55,
              }}
            >
              {g.value}
            </button>
          ))}
        </div>
      </Section>
    </aside>
  )
}

// ─── Barre de filtres compacte (top bar) ──────────────────────────────────────
// Flyout dropdown interne

interface FlyoutProps {
  label: string
  active?: boolean
  children: React.ReactNode
}

function Flyout({ label, active = false, children }: FlyoutProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px',
          height: 40, borderRadius: 8, border: `1px solid ${active ? T.caramel : T.border}`,
          background: active ? T.caramelLight : T.surface,
          color: active ? T.caramel : T.inkMid,
          fontFamily: T.body, fontSize: 13, fontWeight: active ? 700 : 500,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {label}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 500,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: 16, minWidth: 200,
              boxShadow: '0 8px 32px rgba(13,12,10,0.10)',
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Top bar compact
interface TopBarProps {
  filters: PropertyFilters
  city: string
  onCity: (v: string) => void
  onChange: (f: PropertyFilters) => void
  onReset: () => void
  onOpenFilters: () => void
  sortBy: string; sortOrder: string
  onSort: (sb: string, so: string) => void
  viewMode: 'grid' | 'map'
  onView: (v: 'grid' | 'map') => void
  activeCount: number
}

function TopBar({
  filters, city, onCity, onChange, onReset, onOpenFilters,
  sortBy, sortOrder, onSort, viewMode, onView, activeCount,
}: TopBarProps) {
  const inpStyle: React.CSSProperties = {
    width: '100%', paddingLeft: 34, paddingRight: city ? 32 : 14,
    paddingTop: 9, paddingBottom: 9, borderRadius: 8, height: 40,
    border: `1px solid ${T.border}`, background: T.input,
    fontFamily: T.body, fontSize: 14, color: T.ink,
    outline: 'none', boxSizing: 'border-box',
  }

  const budgetLabel = (() => {
    if (filters.minPrice && filters.maxPrice) return `${filters.minPrice}–${filters.maxPrice} €`
    if (filters.minPrice) return `> ${filters.minPrice} €`
    if (filters.maxPrice) return `< ${filters.maxPrice} €`
    return 'Budget'
  })()

  const typeLabel = filters.type
    ? (TYPE_OPTS.find(t => t.value === filters.type)?.label ?? 'Type')
    : 'Type'

  return (
    <div style={{
      background: T.surface, borderBottom: `1px solid ${T.border}`,
      padding: '8px clamp(12px,3vw,28px)',
      display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 0 rgba(13,12,10,0.04)',
      overflowX: 'auto',
    }}>
      {/* Champ ville */}
      <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 130 }}>
        <MapPin size={14} color={T.caramel} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          className="sl-input"
          type="text" value={city} onChange={e => onCity(e.target.value)}
          placeholder="Ville, quartier, code postal…"
          style={inpStyle}
        />
        {city && (
          <button onClick={() => onCity('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.inkFaint, padding: 2 }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Type flyout */}
      <Flyout label={typeLabel} active={!!filters.type}>
        <p style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Type de bien</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {TYPE_OPTS.map(t => {
            const sel = filters.type === t.value
            return (
              <button
                key={t.value}
                onClick={() => onChange({ ...filters, type: sel ? undefined : t.value as any })}
                style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                  fontFamily: T.body, fontSize: 12, fontWeight: sel ? 700 : 500,
                  border: `1px solid ${sel ? T.caramel : T.border}`,
                  background: sel ? T.caramelLight : T.surface,
                  color: sel ? T.caramel : T.inkMid,
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </Flyout>

      {/* Budget flyout */}
      <Flyout label={budgetLabel} active={!!(filters.minPrice || filters.maxPrice)}>
        <p style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Budget mensuel</p>
        <RangeField
          labelMin="Min" labelMax="Max" unit="€"
          min={filters.minPrice} max={filters.maxPrice}
          onMin={v => onChange({ ...filters, minPrice: v })}
          onMax={v => onChange({ ...filters, maxPrice: v })}
          step={50}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {[
            { label: '< 500 €', min: undefined, max: 500 },
            { label: '500–800 €', min: 500, max: 800 },
            { label: '800–1 200 €', min: 800, max: 1200 },
            { label: '> 1 200 €', min: 1200, max: undefined },
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => onChange({ ...filters, minPrice: opt.min, maxPrice: opt.max })}
              style={{
                padding: '4px 9px', borderRadius: 20, cursor: 'pointer', fontSize: 11,
                fontFamily: T.body, fontWeight: 500,
                border: `1px solid ${T.border}`,
                background: T.muted, color: T.inkMid,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Flyout>

      {/* Bouton filtres avancés */}
      <button
        onClick={onOpenFilters}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 13px', height: 40, borderRadius: 8, flexShrink: 0,
          border: `1px solid ${activeCount > 0 ? T.caramel : T.border}`,
          background: activeCount > 0 ? T.caramelLight : T.surface,
          color: activeCount > 0 ? T.caramel : T.inkMid,
          fontFamily: T.body, fontSize: 13, fontWeight: activeCount > 0 ? 700 : 500,
          cursor: 'pointer',
        }}
      >
        <SlidersHorizontal size={14} />
        <span>Filtres{activeCount > 0 ? ` (${activeCount})` : ''}</span>
      </button>

      {/* Tri */}
      <select
        value={`${sortBy}-${sortOrder}`}
        onChange={e => { const [sb, so] = e.target.value.split('-'); onSort(sb, so) }}
        className="sl-select sl-desktop-only"
        style={{
          flexShrink: 0, height: 40, background: T.input, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '0 10px', fontFamily: T.body, fontSize: 13,
          color: T.inkMid, cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="createdAt-desc">Plus récent</option>
        <option value="createdAt-asc">Plus ancien</option>
        <option value="price-asc">Prix croissant</option>
        <option value="price-desc">Prix décroissant</option>
      </select>

      {/* Vue grille / carte */}
      <div className="sl-desktop-only" style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', background: T.surface, flexShrink: 0 }}>
        {([
          { mode: 'grid', Icon: Grid3x3 },
          { mode: 'map',  Icon: MapIcon },
        ] as { mode: 'grid' | 'map'; Icon: ElementType }[]).map(({ mode, Icon }, i) => (
          <button key={mode} onClick={() => onView(mode)} style={{
            padding: '0 12px', height: 40,
            background: viewMode === mode ? T.night : 'transparent',
            color: viewMode === mode ? '#fff' : T.inkFaint,
            border: 'none', borderLeft: i > 0 ? `1px solid ${T.border}` : 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <Icon size={15} />
          </button>
        ))}
      </div>

      {/* Effacer */}
      {activeCount > 0 && (
        <button onClick={onReset} style={{ fontSize: 13, color: T.caramel, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0, height: 40 }}>
          Effacer
        </button>
      )}
    </div>
  )
}

// ─── Sheet mobile (drawer bas) ────────────────────────────────────────────────

interface FilterSheetProps extends FilterPanelProps {
  onClose: () => void
}

function FilterSheet({ onClose, ...rest }: FilterSheetProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(13,12,10,0.45)', zIndex: 300 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 38 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
          background: T.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
          maxHeight: '90dvh', overflowY: 'auto',
          padding: '0 16px 32px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
          <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: T.ink }}>Filtres</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} color={T.inkMid} />
          </button>
        </div>
        {/* Panel sans sticky */}
        <FilterPanelInner {...rest} />
        {/* CTA */}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 20, padding: '14px', borderRadius: 10, border: 'none',
            background: T.night, color: '#fff', fontFamily: T.body, fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Voir {rest.total} bien{rest.total > 1 ? 's' : ''}
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

// Version du panneau sans sticky/maxHeight (pour la sheet mobile)
function FilterPanelInner({ filters, city, onCity, onChange, onReset }: Omit<FilterPanelProps, 'total'>) {
  const active = countActive(filters, city)
  return (
    <div>
      {/* Localisation */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Localisation</label>
        <div style={{ position: 'relative' }}>
          <MapPin size={13} color={T.caramel} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input className="sl-input" type="text" value={city} onChange={e => onCity(e.target.value)} placeholder="Ville, code postal…"
            style={{ width: '100%', paddingLeft: 30, paddingRight: city ? 32 : 12, paddingTop: 10, paddingBottom: 10, borderRadius: T.radius, border: `1px solid ${T.border}`, background: T.input, fontFamily: T.body, fontSize: 13, color: T.ink, outline: 'none', boxSizing: 'border-box' }} />
          {city && <button onClick={() => onCity('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.inkFaint }}><X size={13} /></button>}
        </div>
      </div>

      {/* Type */}
      <Section title="Type de bien" defaultOpen>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TYPE_OPTS.map(t => {
            const sel = filters.type === t.value
            return (
              <button key={t.value} onClick={() => onChange({ ...filters, type: sel ? undefined : t.value as any })}
                style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: T.body, fontSize: 13, fontWeight: sel ? 700 : 500, border: `1px solid ${sel ? T.caramel : T.border}`, background: sel ? T.caramelLight : T.surface, color: sel ? T.caramel : T.inkMid }}>
                {t.label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Budget */}
      <Section title="Budget (€/mois)" defaultOpen>
        <RangeField labelMin="Min" labelMax="Max" unit="€" min={filters.minPrice} max={filters.maxPrice} onMin={v => onChange({ ...filters, minPrice: v })} onMax={v => onChange({ ...filters, maxPrice: v })} step={50} />
      </Section>

      {/* Surface */}
      <Section title="Surface (m²)" defaultOpen>
        <RangeField labelMin="Min" labelMax="Max" unit="m²" min={filters.minSurface} max={filters.maxSurface} onMin={v => onChange({ ...filters, minSurface: v })} onMax={v => onChange({ ...filters, maxSurface: v })} step={5} />
      </Section>

      {/* Pièces & Chambres */}
      <Section title="Chambres" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <RoomStepper label="Chambres (min)" value={filters.minBedrooms} onChange={v => onChange({ ...filters, minBedrooms: v })} />
          <RoomStepper label="Salles de bain (min)" value={filters.minBathrooms} onChange={v => onChange({ ...filters, minBathrooms: v })} max={3} />
        </div>
      </Section>

      {/* Meublé */}
      <Section title="Ameublement" defaultOpen={false}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ key: 'furnished', label: 'Meublé' }, { key: 'unfurnished', label: 'Non meublé' }].map(({ key, label }) => {
            const sel = !!filters[key as keyof PropertyFilters]
            return (
              <button key={key} onClick={() => onChange({ ...filters, [key]: sel ? undefined : true })}
                style={{ flex: 1, padding: '9px 10px', borderRadius: T.radius, cursor: 'pointer', fontFamily: T.body, fontSize: 13, fontWeight: sel ? 700 : 500, border: `1px solid ${sel ? T.caramel : T.border}`, background: sel ? T.caramelLight : T.surface, color: sel ? T.caramel : T.inkMid, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {sel && <Check size={12} />}{label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Extérieur */}
      <Section title="Extérieur & Annexes" defaultOpen>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {AMENITY_CHIPS.map(({ key, label }) => {
            const sel = !!filters[key as keyof PropertyFilters]
            return (
              <button key={key} onClick={() => onChange({ ...filters, [key]: sel ? undefined : true })}
                style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: T.body, fontSize: 13, fontWeight: sel ? 700 : 500, border: `1px solid ${sel ? T.caramel : T.border}`, background: sel ? T.caramelLight : T.surface, color: sel ? T.caramel : T.inkMid }}>
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* DPE */}
      <Section title="DPE — Performance énergétique" defaultOpen={false}>
        <p style={{ fontFamily: T.body, fontSize: 11, color: T.inkFaint, margin: '0 0 8px' }}>Filtre disponible prochainement.</p>
        <div style={{ display: 'flex', gap: 4 }}>
          {DPE_GRADES.map(g => (
            <button key={g.value} disabled style={{ flex: 1, padding: '7px 4px', borderRadius: 6, border: `1px solid ${T.border}`, background: g.bg, color: g.color, fontFamily: T.body, fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 }}>
              {g.value}
            </button>
          ))}
        </div>
      </Section>

      {active > 0 && (
        <button onClick={onReset} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: T.radius, border: `1px solid ${T.border}`, background: T.surface, color: T.inkMid, fontFamily: T.body, fontSize: 13, cursor: 'pointer' }}>
          Effacer tous les filtres
        </button>
      )}
    </div>
  )
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: 'hidden' }}>
      <div style={{ height: 180, background: T.muted, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`, animation: 'shimmer 1.5s infinite' }} />
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ height: 16, borderRadius: 4, background: T.muted, marginBottom: 8, width: '70%' }} />
        <div style={{ height: 12, borderRadius: 4, background: T.muted, marginBottom: 12, width: '50%' }} />
        <div style={{ height: 20, borderRadius: 4, background: T.muted, width: '40%' }} />
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function SearchProperties() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { loadFavorites } = useFavoriteStore()
  const { properties, totalProperties, hasMore, fetchProperties, isLoading } = useProperties()

  const [city, setCity] = useState(searchParams.get('city') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'createdAt' | 'price'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const LIMIT = 15

  const [filters, setFilters] = useState<PropertyFilters>({
    type: (searchParams.get('type') as any) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  })

  const activeCount = countActive(filters, city)

  useEffect(() => { if (isAuthenticated) loadFavorites() }, [isAuthenticated])

  useEffect(() => {
    if (currentPage === 1) { setAllProperties(properties) }
    else { setAllProperties(prev => { const ids = new Set(prev.map(p => p.id)); return [...prev, ...properties.filter(p => !ids.has(p.id))] }) }
  }, [properties])

  const doFetch = useCallback((page: number, f: PropertyFilters, c: string, sb: string, so: string) => {
    const resolved = resolveFilters({ ...f, status: 'AVAILABLE' as const, ...(c.trim() ? { city: c.trim() } : {}) })
    fetchProperties(resolved, { page, limit: LIMIT, sortBy: sb as any, sortOrder: so as any })
  }, [fetchProperties])

  useEffect(() => {
    setCurrentPage(1)
    setAllProperties([])
    doFetch(1, filters, city, sortBy, sortOrder)
  }, [filters, city, sortBy, sortOrder])

  const handleSentinel = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting && hasMore && !isLoading) {
      const next = currentPage + 1
      setCurrentPage(next)
      doFetch(next, filters, city, sortBy, sortOrder)
    }
  }, [hasMore, isLoading, currentPage, filters, city, sortBy, sortOrder])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(handleSentinel, { rootMargin: '300px' })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [handleSentinel])

  const handleReset = () => { setFilters({}); setCity(''); setSearchParams({}) }

  const commonFilterProps: FilterPanelProps = {
    filters, city, onCity: setCity,
    onChange: setFilters, onReset: handleReset,
    total: totalProperties,
  }

  return (
    <Layout bodyBackground={T.bg}>
      <style>{`
        .sl-input:focus  { border-color: ${T.caramel} !important; }
        .sl-select:focus { border-color: ${T.caramel} !important; }
        .sl-desktop-only { display: flex; }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .sl-sidebar { display: none !important; }
          .sl-desktop-only { display: none !important; }
        }
      `}</style>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <TopBar
        {...commonFilterProps}
        onOpenFilters={() => setShowFilterSheet(true)}
        sortBy={sortBy} sortOrder={sortOrder}
        onSort={(sb, so) => { setSortBy(sb as any); setSortOrder(so as any) }}
        viewMode={viewMode} onView={setViewMode}
        activeCount={activeCount}
      />

      {/* ── Sheet mobile ─────────────────────────────────────────────────── */}
      {showFilterSheet && (
        <FilterSheet {...commonFilterProps} onClose={() => setShowFilterSheet(false)} />
      )}

      {/* ── Corps ────────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1440, margin: '0 auto',
        padding: 'clamp(16px,2vw,24px) clamp(12px,3vw,28px)',
        display: 'flex', gap: 24, alignItems: 'flex-start',
      }}>

        {/* Sidebar desktop (≥1024px) */}
        <div className="sl-sidebar" style={{ width: 270, flexShrink: 0 }}>
          <FilterPanel {...commonFilterProps} />
        </div>

        {/* Zone résultats */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Résumé + chips filtres actifs */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: T.body, fontSize: 14, color: T.inkMid, margin: 0 }}>
              {isLoading && allProperties.length === 0
                ? 'Recherche en cours…'
                : <><span style={{ fontWeight: 700, color: T.ink }}>{totalProperties}</span>{' '}bien{totalProperties > 1 ? 's' : ''} disponible{totalProperties > 1 ? 's' : ''}{city && <> · <span style={{ color: T.caramel, fontWeight: 600 }}>{city}</span></>}</>
              }
            </motion.p>

            {/* Tri mobile */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => { const [sb, so] = e.target.value.split('-'); setSortBy(sb as any); setSortOrder(so as any) }}
              style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', fontFamily: T.body, fontSize: 12, color: T.inkMid, background: T.surface, outline: 'none', cursor: 'pointer' }}
            >
              <option value="createdAt-desc">Plus récent</option>
              <option value="createdAt-asc">Plus ancien</option>
              <option value="price-asc">Prix ↑</option>
              <option value="price-desc">Prix ↓</option>
            </select>
          </div>

          {/* Chips filtres actifs (résumé visuel) */}
          {activeCount > 0 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {city && (
                <span onClick={() => setCity('')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 11px', borderRadius: 20, background: T.caramelLight, border: `1px solid ${T.caramelBorder}`, color: T.caramel, fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  📍 {city} <X size={10} />
                </span>
              )}
              {filters.type && (
                <span onClick={() => setFilters(f => ({ ...f, type: undefined }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 11px', borderRadius: 20, background: T.caramelLight, border: `1px solid ${T.caramelBorder}`, color: T.caramel, fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {TYPE_OPTS.find(t => t.value === filters.type)?.label} <X size={10} />
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span onClick={() => setFilters(f => ({ ...f, minPrice: undefined, maxPrice: undefined }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 11px', borderRadius: 20, background: T.caramelLight, border: `1px solid ${T.caramelBorder}`, color: T.caramel, fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {filters.minPrice && filters.maxPrice ? `${filters.minPrice}–${filters.maxPrice} €` : filters.minPrice ? `> ${filters.minPrice} €` : `< ${filters.maxPrice} €`} <X size={10} />
                </span>
              )}
              {filters.minSurface && (
                <span onClick={() => setFilters(f => ({ ...f, minSurface: undefined }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 11px', borderRadius: 20, background: T.caramelLight, border: `1px solid ${T.caramelBorder}`, color: T.caramel, fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  ≥ {filters.minSurface} m² <X size={10} />
                </span>
              )}
              {filters.minBedrooms && (
                <span onClick={() => setFilters(f => ({ ...f, minBedrooms: undefined }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 11px', borderRadius: 20, background: T.caramelLight, border: `1px solid ${T.caramelBorder}`, color: T.caramel, fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {filters.minBedrooms}+ ch. <X size={10} />
                </span>
              )}
              {AMENITY_CHIPS.filter(({ key }) => !!filters[key as keyof PropertyFilters]).map(({ key, label }) => (
                <span key={key} onClick={() => setFilters(f => ({ ...f, [key]: undefined }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 11px', borderRadius: 20, background: T.caramelLight, border: `1px solid ${T.caramelBorder}`, color: T.caramel, fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {label} <X size={10} />
                </span>
              ))}
            </motion.div>
          )}

          {/* Vue carte */}
          {viewMode === 'map' && (
            <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', height: 'calc(100vh - 160px)', minHeight: 'min(500px,70vh)' }}>
              <SearchMap properties={allProperties} selectedPropertyId={selectedPropertyId} onPropertySelect={p => setSelectedPropertyId(p?.id ?? null)} />
            </div>
          )}

          {/* Vue grille */}
          {viewMode === 'grid' && (
            <>
              {isLoading && allProperties.length === 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%), 1fr))', gap: 20 }}>
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {!isLoading && allProperties.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,48px)' }}>
                  <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 24px' }}>
                    <div style={{ width: 88, height: 88, borderRadius: 22, background: T.muted, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Search size={32} color={T.inkFaint} />
                    </div>
                    <div style={{ position: 'absolute', bottom: -6, right: -6, width: 30, height: 30, borderRadius: 10, background: T.caramelLight, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={14} color={T.caramel} />
                    </div>
                  </div>
                  <p style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 'clamp(20px,3vw,26px)', color: T.ink, marginBottom: 8 }}>
                    Aucun bien ne correspond à vos critères.
                  </p>
                  <p style={{ fontFamily: T.body, fontSize: 14, color: T.inkFaint, marginBottom: 28, lineHeight: 1.6 }}>
                    Élargissez votre recherche ou créez une alerte pour être notifié dès qu'un bien correspond.
                  </p>
                  {activeCount > 0 && (
                    <button onClick={handleReset} style={{ background: T.night, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontFamily: T.body, fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44, marginBottom: 36 }}>
                      Réinitialiser les filtres
                    </button>
                  )}
                  <div style={{ maxWidth: 480, margin: '0 auto', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 'clamp(18px,3vw,28px)', boxShadow: BAI.shadowMd }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, justifyContent: 'center' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={16} color={T.caramel} />
                      </div>
                      <p style={{ fontFamily: T.body, fontSize: 14, fontWeight: 600, color: T.ink, margin: 0 }}>Créer une alerte email</p>
                    </div>
                    <EmailCapture variant="light" placeholder="votre@email.fr" ctaLabel="M'alerter" source="search_empty_state" successMessage="Alerte créée ! Vous serez notifié dès qu'un bien correspond." />
                  </div>
                </motion.div>
              )}

              {allProperties.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%), 1fr))', gap: 20 }}>
                  {allProperties.map((property, i) => (
                    <motion.div key={property.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.24 }}>
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>
              )}

              <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                {isLoading && allProperties.length > 0 && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${T.border}`, borderTopColor: T.caramel, animation: 'spin 0.8s linear infinite' }} />
                )}
                {!isLoading && !hasMore && allProperties.length > 0 && (
                  <p style={{ fontSize: 13, color: T.inkFaint, fontFamily: T.body }}>Tous les biens ont été affichés</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
