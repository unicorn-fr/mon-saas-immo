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
  MapPin, Bell, ChevronDown, Check,
} from 'lucide-react'
import EmailCapture from '../../components/ui/EmailCapture'

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
  body:          BAI.fontBody,
  display:       BAI.fontDisplay,
  ink:           BAI.ink,
  inkMid:        BAI.inkMid,
  inkFaint:      BAI.inkFaint,
  border:        BAI.border,
  bg:            BAI.bgBase,
  surface:       BAI.bgSurface,
  muted:         BAI.bgMuted,
  input:         '#f8f7f4',
  caramel:       BAI.caramel,
  caramelLight:  '#fdf5ec',
  caramelBorder: 'rgba(196,151,106,0.35)',
  night:         BAI.night,
  radius:        9,
  radiusLg:      12,
  // zone de recherche : fond sombre façon PAP
  heroTop:       '#1a1a2e',
  heroBottom:    '#12122a',
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TYPE_OPTS = [
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE',     label: 'Maison' },
  { value: 'STUDIO',    label: 'Studio' },
  { value: 'DUPLEX',    label: 'Duplex' },
  { value: 'LOFT',      label: 'Loft' },
]

const AMENITY_CHIPS = [
  { key: 'hasBalcony',  label: 'Balcon' },
  { key: 'hasTerrace',  label: 'Terrasse' },
  { key: 'hasGarden',   label: 'Jardin' },
  { key: 'hasParking',  label: 'Parking' },
  { key: 'hasCellar',   label: 'Cave' },
  { key: 'hasElevator', label: 'Ascenseur' },
] as const

const DPE_GRADES = ['A','B','C','D','E','F','G']
const DPE_COLORS: Record<string, { color: string; bg: string }> = {
  A:{color:'#3b8a3e',bg:'#e8f5e9'}, B:{color:'#66a832',bg:'#f1f8e4'},
  C:{color:'#a6c822',bg:'#f7fce4'}, D:{color:'#f5c518',bg:'#fffde7'},
  E:{color:'#f5921e',bg:'#fff3e0'}, F:{color:'#e25b1a',bg:'#fce8de'},
  G:{color:'#c62828',bg:'#fce4e4'},
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countActive(f: PropertyFilters, city: string): number {
  let n = 0
  if (city) n++
  if (f.type) n++
  if (f.minPrice || f.maxPrice) n++
  if (f.minSurface || f.maxSurface) n++
  if (f.minBedrooms) n++
  if (f.minBathrooms) n++
  if (f.furnished) n++
  if (f.unfurnished) n++
  if (f.hasBalcony) n++
  if (f.hasTerrace) n++
  if (f.hasGarden) n++
  if (f.hasParking) n++
  if (f.hasCellar) n++
  if (f.hasElevator) n++
  return n
}

function resolveFilters(f: PropertyFilters): PropertyFilters {
  const extra: string[] = [...(f.amenities ?? [])]
  if (f.hasTerrace && !extra.includes('terrace')) extra.push('terrace')
  if (f.hasCellar  && !extra.includes('cellar'))  extra.push('cellar')
  const { hasTerrace, hasCellar, minBedrooms, maxBedrooms, minBathrooms, maxBathrooms, ...rest } = f
  return {
    ...rest,
    ...(extra.length ? { amenities: extra } : {}),
    ...(minBedrooms  !== undefined ? { bedrooms:  minBedrooms  } : {}),
    ...(maxBedrooms  !== undefined ? { maxBedrooms  } : {}),
    ...(minBathrooms !== undefined ? { bathrooms: minBathrooms } : {}),
    ...(maxBathrooms !== undefined ? { maxBathrooms } : {}),
  }
}

// ─── Flyout générique ─────────────────────────────────────────────────────────

function Flyout({ label, active = false, pill = false, children }: {
  label: string; active?: boolean; pill?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const btnStyle: React.CSSProperties = pill ? {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '0 14px', height: 36, borderRadius: 100,
    border: `1.5px solid ${active ? T.caramel : T.border}`,
    background: active ? T.caramelLight : T.surface,
    color: active ? T.caramel : T.inkMid,
    fontFamily: T.body, fontSize: 13, fontWeight: active ? 700 : 500,
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
  } : {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '0 12px', height: 40, borderRadius: T.radius,
    border: `1px solid ${active ? T.caramel : T.border}`,
    background: active ? T.caramelLight : T.surface,
    color: active ? T.caramel : T.inkMid,
    fontFamily: T.body, fontSize: 13, fontWeight: active ? 700 : 500,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(v => !v)} style={btnStyle}>
        {label}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', opacity: 0.6 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 600,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 18, minWidth: 220,
              boxShadow: '0 8px 32px rgba(13,12,10,0.12)',
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

// ─── Champ min/max ─────────────────────────────────────────────────────────────

function RangeField({ labelMin, labelMax, min, max, onMin, onMax, unit = '', step = 1 }: {
  labelMin: string; labelMax: string
  min?: number; max?: number
  onMin: (v: number | undefined) => void
  onMax: (v: number | undefined) => void
  unit?: string; step?: number
}) {
  const inp: React.CSSProperties = {
    flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: T.radius,
    padding: '8px 10px', fontFamily: T.body, fontSize: 13, color: T.ink,
    outline: 'none', boxSizing: 'border-box', minWidth: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="number" placeholder={labelMin} value={min ?? ''} min={0} step={step} onChange={e => onMin(e.target.value ? +e.target.value : undefined)} style={inp} className="sp-input" />
      <span style={{ color: T.inkFaint, fontSize: 12, flexShrink: 0 }}>—</span>
      <input type="number" placeholder={labelMax} value={max ?? ''} min={0} step={step} onChange={e => onMax(e.target.value ? +e.target.value : undefined)} style={inp} className="sp-input" />
      {unit && <span style={{ color: T.inkFaint, fontSize: 12, flexShrink: 0 }}>{unit}</span>}
    </div>
  )
}

// ─── Stepper chambres ─────────────────────────────────────────────────────────

function RoomStepper({ value, onChange, max = 5 }: { value?: number; onChange: (v: number | undefined) => void; max?: number }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      <button onClick={() => onChange(undefined)} style={{ padding: '6px 10px', borderRadius: 20, border: `1.5px solid ${value === undefined ? T.caramel : T.border}`, background: value === undefined ? T.caramelLight : T.surface, color: value === undefined ? T.caramel : T.inkFaint, fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Tous</button>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} onClick={() => onChange(value === n ? undefined : n)} style={{ padding: '6px 10px', borderRadius: 20, border: `1.5px solid ${value !== undefined && value <= n ? T.caramel : T.border}`, background: value !== undefined && value <= n ? T.caramelLight : T.surface, color: value !== undefined && value <= n ? T.caramel : T.inkMid, fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {n === max ? `${n}+` : n}
        </button>
      ))}
    </div>
  )
}

// ─── Drawer "Tous les filtres" (sheet mobile + desktop) ───────────────────────

function AllFiltersSheet({ filters, city, onCity, onChange, onReset, total, onClose }: {
  filters: PropertyFilters; city: string; onCity: (v: string) => void
  onChange: (f: PropertyFilters) => void; onReset: () => void
  total: number; onClose: () => void
}) {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, paddingBottom: 16 }}>
        <p style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>{title}</p>
        {children}
      </div>
    )
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(13,12,10,0.5)', zIndex: 400 }} onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 36 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440, zIndex: 401,
          background: T.surface, overflowY: 'auto',
          padding: '0 24px 40px', paddingBottom: 'calc(40px + env(safe-area-inset-bottom))',
          boxShadow: '-8px 0 48px rgba(13,12,10,0.14)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 12px', position: 'sticky', top: 0, background: T.surface, zIndex: 1, borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
          <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: T.ink }}>Tous les filtres</span>
          <button onClick={onClose} style={{ background: T.muted, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 8, minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color={T.inkMid} />
          </button>
        </div>

        {/* Localisation */}
        <Section title="Localisation">
          <div style={{ position: 'relative' }}>
            <MapPin size={13} color={T.caramel} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input className="sp-input" type="text" value={city} onChange={e => onCity(e.target.value)} placeholder="Ville, code postal…"
              style={{ width: '100%', paddingLeft: 32, paddingRight: city ? 34 : 12, paddingTop: 11, paddingBottom: 11, borderRadius: T.radius, border: `1px solid ${T.border}`, background: T.input, fontFamily: T.body, fontSize: 13, color: T.ink, outline: 'none', boxSizing: 'border-box' }} />
            {city && <button onClick={() => onCity('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.inkFaint, display:'flex', alignItems:'center' }}><X size={13} /></button>}
          </div>
        </Section>

        {/* Type */}
        <Section title="Type de bien">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {TYPE_OPTS.map(t => { const s = filters.type === t.value; return (
              <button key={t.value} onClick={() => onChange({ ...filters, type: s ? undefined : t.value as any })}
                style={{ padding: '8px 16px', borderRadius: 100, cursor: 'pointer', fontFamily: T.body, fontSize: 13, fontWeight: s ? 700 : 500, border: `1.5px solid ${s ? T.caramel : T.border}`, background: s ? T.caramelLight : T.surface, color: s ? T.caramel : T.inkMid }}>
                {t.label}
              </button>
            )})}
          </div>
        </Section>

        {/* Budget */}
        <Section title="Loyer mensuel">
          <RangeField labelMin="Min" labelMax="Max" unit="€" min={filters.minPrice} max={filters.maxPrice} onMin={v => onChange({ ...filters, minPrice: v })} onMax={v => onChange({ ...filters, maxPrice: v })} step={50} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {[{l:'< 500 €',mn:undefined,mx:500},{l:'500–800 €',mn:500,mx:800},{l:'800–1 200 €',mn:800,mx:1200},{l:'> 1 200 €',mn:1200,mx:undefined}].map(o => (
              <button key={o.l} onClick={() => onChange({ ...filters, minPrice: o.mn, maxPrice: o.mx })} style={{ padding: '5px 11px', borderRadius: 100, cursor: 'pointer', fontFamily: T.body, fontSize: 12, border: `1px solid ${T.border}`, background: T.muted, color: T.inkMid }}>{o.l}</button>
            ))}
          </div>
        </Section>

        {/* Surface */}
        <Section title="Surface">
          <RangeField labelMin="Min" labelMax="Max" unit="m²" min={filters.minSurface} max={filters.maxSurface} onMin={v => onChange({ ...filters, minSurface: v })} onMax={v => onChange({ ...filters, maxSurface: v })} step={5} />
        </Section>

        {/* Chambres */}
        <Section title="Chambres (minimum)">
          <RoomStepper value={filters.minBedrooms} onChange={v => onChange({ ...filters, minBedrooms: v })} />
        </Section>

        {/* SDB */}
        <Section title="Salles de bain (minimum)">
          <RoomStepper value={filters.minBathrooms} onChange={v => onChange({ ...filters, minBathrooms: v })} max={3} />
        </Section>

        {/* Meublé */}
        <Section title="Ameublement">
          <div style={{ display: 'flex', gap: 7 }}>
            {[{k:'furnished',l:'Meublé'},{k:'unfurnished',l:'Non meublé'}].map(({k,l}) => { const s = !!filters[k as keyof PropertyFilters]; return (
              <button key={k} onClick={() => onChange({ ...filters, [k]: s ? undefined : true })}
                style={{ flex: 1, padding: '10px', borderRadius: T.radius, cursor: 'pointer', fontFamily: T.body, fontSize: 13, fontWeight: s ? 700 : 500, border: `1.5px solid ${s ? T.caramel : T.border}`, background: s ? T.caramelLight : T.surface, color: s ? T.caramel : T.inkMid, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {s && <Check size={12} />}{l}
              </button>
            )})}
          </div>
        </Section>

        {/* Équipements */}
        <Section title="Équipements & extérieur">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {AMENITY_CHIPS.map(({ key, label }) => { const s = !!filters[key as keyof PropertyFilters]; return (
              <button key={key} onClick={() => onChange({ ...filters, [key]: s ? undefined : true })}
                style={{ padding: '8px 16px', borderRadius: 100, cursor: 'pointer', fontFamily: T.body, fontSize: 13, fontWeight: s ? 700 : 500, border: `1.5px solid ${s ? T.caramel : T.border}`, background: s ? T.caramelLight : T.surface, color: s ? T.caramel : T.inkMid }}>
                {label}
              </button>
            )})}
          </div>
        </Section>

        {/* DPE */}
        <Section title="DPE — bientôt disponible">
          <div style={{ display: 'flex', gap: 5 }}>
            {DPE_GRADES.map(g => { const c = DPE_COLORS[g]; return (
              <button key={g} disabled title="Bientôt" style={{ flex: 1, padding: '8px 4px', borderRadius: 6, border: `1px solid ${T.border}`, background: c.bg, color: c.color, fontFamily: T.body, fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 }}>{g}</button>
            )})}
          </div>
        </Section>

        {/* Boutons bas */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onReset} style={{ flex: 1, padding: '12px', borderRadius: T.radius, border: `1px solid ${T.border}`, background: T.surface, color: T.inkMid, fontFamily: T.body, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            Effacer tout
          </button>
          <button onClick={onClose} style={{ flex: 2, padding: '12px', borderRadius: T.radius, border: 'none', background: T.night, color: '#fff', fontFamily: T.body, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Voir {total} bien{total > 1 ? 's' : ''}
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: 'hidden' }}>
      <div style={{ height: 180, background: T.muted, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)`, animation: 'sp-shimmer 1.4s infinite' }} />
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ height: 14, width: '60%', borderRadius: 4, background: T.muted, marginBottom: 10 }} />
        <div style={{ height: 12, width: '40%', borderRadius: 4, background: T.muted, marginBottom: 12 }} />
        <div style={{ height: 22, width: '35%', borderRadius: 4, background: T.muted }} />
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
  const [cityInput, setCityInput] = useState(searchParams.get('city') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [showSheet, setShowSheet] = useState(false)
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
    if (currentPage === 1) setAllProperties(properties)
    else setAllProperties(prev => { const ids = new Set(prev.map(p => p.id)); return [...prev, ...properties.filter(p => !ids.has(p.id))] })
  }, [properties])

  const doFetch = useCallback((page: number, f: PropertyFilters, c: string, sb: string, so: string) => {
    const resolved = resolveFilters({ ...f, status: 'AVAILABLE' as const, ...(c.trim() ? { city: c.trim() } : {}) })
    fetchProperties(resolved, { page, limit: LIMIT, sortBy: sb as any, sortOrder: so as any })
  }, [fetchProperties])

  useEffect(() => {
    setCurrentPage(1); setAllProperties([])
    doFetch(1, filters, city, sortBy, sortOrder)
  }, [filters, city, sortBy, sortOrder])

  const handleSentinel = useCallback((entries: IntersectionObserverEntry[]) => {
    const [e] = entries
    if (e.isIntersecting && hasMore && !isLoading) {
      const next = currentPage + 1; setCurrentPage(next)
      doFetch(next, filters, city, sortBy, sortOrder)
    }
  }, [hasMore, isLoading, currentPage, filters, city, sortBy, sortOrder])

  useEffect(() => {
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(handleSentinel, { rootMargin: '300px' })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [handleSentinel])

  const handleReset = () => { setFilters({}); setCity(''); setCityInput(''); setSearchParams({}) }

  // Budgets résumé
  const budgetLabel = filters.minPrice && filters.maxPrice
    ? `${filters.minPrice}–${filters.maxPrice} €`
    : filters.minPrice ? `> ${filters.minPrice} €`
    : filters.maxPrice ? `< ${filters.maxPrice} €`
    : 'Loyer'

  const surfaceLabel = filters.minSurface || filters.maxSurface
    ? `${filters.minSurface ?? ''}–${filters.maxSurface ?? ''} m²`.replace('– ', '< ').replace(' –', '> ')
    : 'Surface'

  return (
    <Layout bodyBackground={T.bg}>
      <style>{`
        .sp-input:focus { border-color: ${T.caramel} !important; outline: none; }
        @keyframes sp-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes sp-spin    { to { transform: rotate(360deg); } }
      `}</style>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ZONE DE RECHERCHE — fond sombre façon PAP.fr
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        background: T.heroTop,
        padding: 'clamp(28px,4vw,48px) clamp(16px,4vw,40px) clamp(24px,3vw,36px)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Titre */}
          <p style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 6px' }}>
            Location
          </p>
          <h1 style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,38px)', color: '#fff', margin: '0 0 clamp(18px,3vw,28px)', lineHeight: 1.2 }}>
            Trouvez votre prochain logement
          </h1>

          {/* Chips de type — sélection du type de bien */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {TYPE_OPTS.map(t => {
              const sel = filters.type === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setFilters(f => ({ ...f, type: sel ? undefined : t.value as any }))}
                  style={{
                    padding: '7px 16px', borderRadius: 100, cursor: 'pointer',
                    fontFamily: T.body, fontSize: 13, fontWeight: sel ? 700 : 500,
                    border: `1.5px solid ${sel ? T.caramel : 'rgba(255,255,255,0.2)'}`,
                    background: sel ? T.caramel : 'rgba(255,255,255,0.08)',
                    color: sel ? '#fff' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.14s',
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Grand champ de recherche */}
          <div style={{
            display: 'flex', background: T.surface, borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}>
            {/* Input ville */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MapPin size={17} color={T.caramel} style={{ position: 'absolute', left: 16, pointerEvents: 'none', flexShrink: 0 }} />
              <input
                className="sp-input"
                type="text"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setCity(cityInput) }}
                placeholder="Ville, quartier, code postal…"
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  padding: 'clamp(14px,2vw,18px) 14px clamp(14px,2vw,18px) 44px',
                  fontFamily: T.body, fontSize: 'clamp(14px,1.5vw,16px)', color: T.ink,
                  background: 'transparent',
                }}
              />
              {cityInput && (
                <button onClick={() => { setCityInput(''); setCity('') }} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: T.inkFaint, padding: 4, display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Bouton recherche */}
            <button
              onClick={() => setCity(cityInput)}
              style={{
                flexShrink: 0, padding: '0 clamp(18px,3vw,28px)',
                background: T.caramel, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: T.body, fontSize: 15, fontWeight: 700, color: '#fff',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Search size={16} />
              <span style={{ display: 'none' }} className="sp-search-label">Rechercher</span>
            </button>
          </div>

          {/* Ligne de filtres rapides sous le champ */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Budget */}
            <Flyout label={budgetLabel} active={!!(filters.minPrice || filters.maxPrice)} pill>
              <p style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Loyer mensuel</p>
              <RangeField labelMin="Min" labelMax="Max" unit="€" min={filters.minPrice} max={filters.maxPrice} onMin={v => setFilters(f => ({...f,minPrice:v}))} onMax={v => setFilters(f => ({...f,maxPrice:v}))} step={50} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                {[{l:'< 500 €',mn:undefined as number|undefined,mx:500},{l:'500–800',mn:500,mx:800},{l:'800–1200',mn:800,mx:1200},{l:'> 1200 €',mn:1200,mx:undefined as number|undefined}].map(o=>(
                  <button key={o.l} onClick={()=>setFilters(f=>({...f,minPrice:o.mn,maxPrice:o.mx}))} style={{padding:'5px 10px',borderRadius:100,cursor:'pointer',fontFamily:T.body,fontSize:11,border:`1px solid ${T.border}`,background:T.muted,color:T.inkMid}}>{o.l}</button>
                ))}
              </div>
            </Flyout>

            {/* Surface */}
            <Flyout label={surfaceLabel} active={!!(filters.minSurface || filters.maxSurface)} pill>
              <p style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Surface</p>
              <RangeField labelMin="Min" labelMax="Max" unit="m²" min={filters.minSurface} max={filters.maxSurface} onMin={v => setFilters(f=>({...f,minSurface:v}))} onMax={v => setFilters(f=>({...f,maxSurface:v}))} step={5} />
            </Flyout>

            {/* Pièces */}
            <Flyout label={filters.minBedrooms ? `${filters.minBedrooms}+ ch.` : 'Chambres'} active={!!filters.minBedrooms} pill>
              <p style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Chambres (minimum)</p>
              <RoomStepper value={filters.minBedrooms} onChange={v => setFilters(f=>({...f,minBedrooms:v}))} />
            </Flyout>

            {/* Meublé */}
            <button
              onClick={() => setFilters(f => ({ ...f, furnished: f.furnished ? undefined : true, unfurnished: undefined }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '0 14px', height: 36, borderRadius: 100,
                border: `1.5px solid ${filters.furnished ? T.caramel : 'rgba(255,255,255,0.2)'}`,
                background: filters.furnished ? T.caramel : 'rgba(255,255,255,0.08)',
                color: filters.furnished ? '#fff' : 'rgba(255,255,255,0.8)',
                fontFamily: T.body, fontSize: 13, fontWeight: filters.furnished ? 700 : 500,
                cursor: 'pointer', backdropFilter: 'blur(8px)',
                transition: 'all 0.14s', flexShrink: 0,
              }}
            >
              {filters.furnished && <Check size={12} />}
              Meublé
            </button>

            {/* Tous les filtres */}
            <button
              onClick={() => setShowSheet(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 16px', height: 36, borderRadius: 100,
                border: `1.5px solid rgba(255,255,255,0.2)`,
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.9)',
                fontFamily: T.body, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', backdropFilter: 'blur(8px)',
                flexShrink: 0,
              }}
            >
              <SlidersHorizontal size={13} />
              Filtres{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>

            {/* Effacer */}
            {activeCount > 0 && (
              <button onClick={handleReset} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.body, padding: '0 4px', flexShrink: 0 }}>
                Tout effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SHEET FILTRES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {showSheet && (
          <AllFiltersSheet
            filters={filters} city={city} onCity={c => { setCity(c); setCityInput(c) }}
            onChange={setFilters} onReset={handleReset}
            total={totalProperties} onClose={() => setShowSheet(false)}
          />
        )}
      </AnimatePresence>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          RÉSULTATS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,2.5vw,32px) clamp(16px,3vw,28px)' }}>

        {/* Barre résultats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: T.body, fontSize: 15, color: T.inkMid, margin: 0 }}>
            {isLoading && allProperties.length === 0
              ? 'Recherche…'
              : (
                <>
                  <span style={{ fontWeight: 700, fontSize: 18, color: T.ink }}>{totalProperties}</span>
                  {' '}bien{totalProperties > 1 ? 's' : ''} en location
                  {city && <> · <span style={{ color: T.caramel, fontWeight: 600 }}>{city}</span></>}
                </>
              )
            }
          </motion.p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Tri */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => { const [sb,so] = e.target.value.split('-'); setSortBy(sb as any); setSortOrder(so as any) }}
              style={{ height: 38, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0 10px', fontFamily: T.body, fontSize: 13, color: T.inkMid, outline: 'none', cursor: 'pointer' }}
            >
              <option value="createdAt-desc">Plus récent</option>
              <option value="createdAt-asc">Plus ancien</option>
              <option value="price-asc">Prix ↑</option>
              <option value="price-desc">Prix ↓</option>
            </select>

            {/* Vue grille / carte */}
            <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', background: T.surface }}>
              {([{m:'grid' as const,I:Grid3x3},{m:'map' as const,I:MapIcon}] as {m:'grid'|'map';I:ElementType}[]).map(({m,I},i)=>(
                <button key={m} onClick={() => setViewMode(m)} style={{ padding: '0 12px', height: 38, background: viewMode === m ? T.night : 'transparent', color: viewMode === m ? '#fff' : T.inkFaint, border: 'none', borderLeft: i > 0 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <I size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chips filtres actifs */}
        {activeCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {city && <Chip label={`📍 ${city}`} onRemove={() => { setCity(''); setCityInput('') }} />}
            {filters.type && <Chip label={TYPE_OPTS.find(t=>t.value===filters.type)?.label ?? filters.type} onRemove={() => setFilters(f=>({...f,type:undefined}))} />}
            {(filters.minPrice||filters.maxPrice) && <Chip label={budgetLabel} onRemove={() => setFilters(f=>({...f,minPrice:undefined,maxPrice:undefined}))} />}
            {(filters.minSurface||filters.maxSurface) && <Chip label={surfaceLabel} onRemove={() => setFilters(f=>({...f,minSurface:undefined,maxSurface:undefined}))} />}
            {filters.minBedrooms && <Chip label={`${filters.minBedrooms}+ ch.`} onRemove={() => setFilters(f=>({...f,minBedrooms:undefined}))} />}
            {filters.furnished && <Chip label="Meublé" onRemove={() => setFilters(f=>({...f,furnished:undefined}))} />}
            {AMENITY_CHIPS.filter(({key}) => !!filters[key as keyof PropertyFilters]).map(({key,label}) => (
              <Chip key={key} label={label} onRemove={() => setFilters(f=>({...f,[key]:undefined}))} />
            ))}
          </motion.div>
        )}

        {/* Vue carte */}
        {viewMode === 'map' && (
          <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', height: 'calc(100vh - 200px)', minHeight: 400 }}>
            <SearchMap properties={allProperties} selectedPropertyId={selectedPropertyId} onPropertySelect={p => setSelectedPropertyId(p?.id ?? null)} />
          </div>
        )}

        {/* Vue grille */}
        {viewMode === 'grid' && (
          <>
            {isLoading && allProperties.length === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(280px,100%),1fr))', gap: 20 }}>
                {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!isLoading && allProperties.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: 'clamp(48px,8vw,80px) 20px' }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: T.muted, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Search size={32} color={T.inkFaint} />
                </div>
                <p style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 'clamp(20px,3vw,26px)', color: T.ink, marginBottom: 8 }}>
                  Aucun bien ne correspond à ces critères.
                </p>
                <p style={{ fontFamily: T.body, fontSize: 14, color: T.inkFaint, marginBottom: 24, lineHeight: 1.6 }}>
                  Modifiez vos filtres ou créez une alerte pour être notifié.
                </p>
                {activeCount > 0 && (
                  <button onClick={handleReset} style={{ background: T.night, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontFamily: T.body, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 32 }}>
                    Réinitialiser les filtres
                  </button>
                )}
                <div style={{ maxWidth: 420, margin: '0 auto', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, justifyContent: 'center' }}>
                    <Bell size={16} color={T.caramel} />
                    <span style={{ fontFamily: T.body, fontSize: 14, fontWeight: 600, color: T.ink }}>Créer une alerte email</span>
                  </div>
                  <EmailCapture variant="light" placeholder="votre@email.fr" ctaLabel="M'alerter" source="search_empty_state" successMessage="Alerte créée !" />
                </div>
              </motion.div>
            )}

            {allProperties.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(280px,100%),1fr))', gap: 20 }}>
                {allProperties.map((property, i) => (
                  <motion.div key={property.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.22 }}>
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </div>
            )}

            <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              {isLoading && allProperties.length > 0 && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${T.border}`, borderTopColor: T.caramel, animation: 'sp-spin 0.8s linear infinite' }} />
              )}
              {!isLoading && !hasMore && allProperties.length > 0 && (
                <p style={{ fontFamily: T.body, fontSize: 13, color: T.inkFaint }}>Tous les biens ont été affichés</p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

// ─── Chip filtre actif ────────────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span onClick={onRemove} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 11px 5px 12px', borderRadius: 100,
      background: '#fdf5ec', border: '1.5px solid rgba(196,151,106,0.35)',
      color: BAI.caramel, fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
      cursor: 'pointer', transition: 'opacity 0.12s',
    }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {label} <X size={10} />
    </span>
  )
}
