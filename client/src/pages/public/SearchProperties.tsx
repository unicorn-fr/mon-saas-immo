import { useState, useEffect, useRef, useCallback, type ElementType } from 'react'
import { motion } from 'framer-motion'
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
  Search, Grid3x3, Map as MapIcon, X, Home as HomeIcon,
  SlidersHorizontal, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── Constantes filtres ────────────────────────────────────────────────────────

const TYPES = [
  { value: '', label: 'Tous types' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'LOFT', label: 'Loft' },
]

const BUDGETS = [
  { value: '', label: 'Budget' },
  { value: '0-400', label: '< 400 €' },
  { value: '400-600', label: '400 – 600 €' },
  { value: '600-800', label: '600 – 800 €' },
  { value: '800-1000', label: '800 – 1 000 €' },
  { value: '1000-1500', label: '1 000 – 1 500 €' },
  { value: '1500-2500', label: '1 500 – 2 500 €' },
  { value: '2500-', label: '> 2 500 €' },
]

const SURFACES = [
  { value: '', label: 'Surface' },
  { value: '20', label: '> 20 m²' },
  { value: '30', label: '> 30 m²' },
  { value: '50', label: '> 50 m²' },
  { value: '70', label: '> 70 m²' },
  { value: '100', label: '> 100 m²' },
]

const ROOMS = [
  { value: '', label: 'Pièces' },
  { value: '1', label: '1 pièce' },
  { value: '2', label: '2 pièces' },
  { value: '3', label: '3 pièces' },
  { value: '4', label: '4 pièces' },
  { value: '5', label: '5 pièces +' },
]

// ─── Composant filtres latéraux ────────────────────────────────────────────────

interface FiltersProps {
  filters: PropertyFilters
  city: string
  onCity: (v: string) => void
  onChange: (f: PropertyFilters) => void
  onReset: () => void
  total: number
}

function FilterPanel({ filters, city, onCity, onChange, onReset, total }: FiltersProps) {
  const [budgetOpen, setBudgetOpen] = useState(true)
  const [surfaceOpen, setSurfaceOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const activeBudget = BUDGETS.find(b => {
    if (!b.value) return false
    const [min, max] = b.value.split('-')
    return filters.minPrice === (min ? Number(min) : undefined) &&
           filters.maxPrice === (max ? Number(max) : undefined)
  })?.value ?? ''

  const setBudget = (v: string) => {
    if (!v) { onChange({ ...filters, minPrice: undefined, maxPrice: undefined }); return }
    const [min, max] = v.split('-')
    onChange({ ...filters, minPrice: min ? Number(min) : undefined, maxPrice: max ? Number(max) : undefined })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: BAI.bgInput, border: `1px solid ${BAI.border}`,
    borderRadius: 8, padding: '10px 12px', fontFamily: BAI.fontBody, fontSize: 14,
    color: BAI.ink, outline: 'none', boxSizing: 'border-box',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
  const sectionTitle: React.CSSProperties = {
    fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkMid,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer', padding: '10px 0', border: 'none', background: 'none', width: '100%',
  }

  const hasActive = city || filters.type || filters.minPrice || filters.maxPrice ||
    filters.minSurface || filters.bedrooms || filters.furnished

  return (
    <aside style={{
      background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
      borderRadius: 14, padding: 20, fontFamily: BAI.fontBody,
      position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
    }}>
      {/* Titre + reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 18, color: BAI.ink }}>
          {total > 0 ? `${total} bien${total > 1 ? 's' : ''}` : 'Filtres'}
        </span>
        {hasActive && (
          <button onClick={onReset} style={{ fontSize: 12, color: BAI.caramel, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
            Effacer tout
          </button>
        )}
      </div>

      {/* Ville */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Localisation
        </label>
        <div style={{ position: 'relative' }}>
          <Search size={14} color={BAI.inkFaint} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text" value={city} onChange={e => onCity(e.target.value)}
            placeholder="Ville, code postal…"
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
          {city && (
            <button onClick={() => onCity('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, padding: 2 }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Type */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Type de bien
        </label>
        <select value={filters.type ?? ''} onChange={e => onChange({ ...filters, type: (e.target.value as any) || undefined })} style={selectStyle}>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Budget */}
      <div style={{ marginBottom: 14, borderTop: `1px solid ${BAI.border}`, paddingTop: 12 }}>
        <button style={sectionTitle} onClick={() => setBudgetOpen(v => !v)}>
          <span>Budget</span>
          {budgetOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {budgetOpen && (
          <select value={activeBudget} onChange={e => setBudget(e.target.value)} style={{ ...selectStyle, marginTop: 6 }}>
            {BUDGETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        )}
      </div>

      {/* Surface */}
      <div style={{ marginBottom: 14, borderTop: `1px solid ${BAI.border}`, paddingTop: 12 }}>
        <button style={sectionTitle} onClick={() => setSurfaceOpen(v => !v)}>
          <span>Surface</span>
          {surfaceOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {surfaceOpen && (
          <select
            value={filters.minSurface?.toString() ?? ''}
            onChange={e => onChange({ ...filters, minSurface: e.target.value ? Number(e.target.value) : undefined })}
            style={{ ...selectStyle, marginTop: 6 }}
          >
            {SURFACES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        )}
      </div>

      {/* Plus de critères */}
      <div style={{ borderTop: `1px solid ${BAI.border}`, paddingTop: 12 }}>
        <button style={sectionTitle} onClick={() => setMoreOpen(v => !v)}>
          <span>Plus de critères</span>
          {moreOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {moreOpen && (
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 4 }}>Pièces</label>
              <select
                value={filters.bedrooms?.toString() ?? ''}
                onChange={e => onChange({ ...filters, bedrooms: e.target.value ? Number(e.target.value) : undefined })}
                style={selectStyle}
              >
                {ROOMS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: BAI.ink, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={!!filters.furnished}
                onChange={e => onChange({ ...filters, furnished: e.target.checked || undefined })}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: BAI.caramel }}
              />
              Meublé uniquement
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: BAI.ink, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={!!filters.hasParking}
                onChange={e => onChange({ ...filters, hasParking: e.target.checked || undefined })}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: BAI.caramel }}
              />
              Avec parking
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: BAI.ink, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={!!filters.hasGarden}
                onChange={e => onChange({ ...filters, hasGarden: e.target.checked || undefined })}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: BAI.caramel }}
              />
              Avec jardin / terrasse
            </label>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function SearchProperties() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { loadFavorites } = useFavoriteStore()
  const {
    properties, totalProperties, hasMore, fetchProperties, isLoading,
  } = useProperties()

  const [city, setCity] = useState(searchParams.get('city') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
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

  useEffect(() => { if (isAuthenticated) loadFavorites() }, [isAuthenticated])

  useEffect(() => {
    if (currentPage === 1) {
      setAllProperties(properties)
    } else {
      setAllProperties(prev => {
        const ids = new Set(prev.map(p => p.id))
        return [...prev, ...properties.filter(p => !ids.has(p.id))]
      })
    }
  }, [properties])

  const doFetch = useCallback((page: number, f: PropertyFilters, c: string, sb: string, so: string) => {
    const combined: PropertyFilters = { ...f, status: 'AVAILABLE' as const, ...(c.trim() ? { city: c.trim() } : {}) }
    fetchProperties(combined, { page, limit: LIMIT, sortBy: sb as any, sortOrder: so as any })
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

  const handleFiltersChange = (f: PropertyFilters) => { setFilters(f) }

  const handleReset = () => {
    setFilters({})
    setCity('')
    setSearchParams({})
  }

  const hasActive = !!(city || filters.type || filters.minPrice || filters.maxPrice ||
    filters.minSurface || filters.bedrooms || filters.furnished)

  return (
    <Layout bodyBackground={BAI.bgBase}>
      <style>{`
        .sl-input:focus { border-color: ${BAI.caramel} !important; outline: none; }
        .sl-select:focus { border-color: ${BAI.caramel} !important; outline: none; }
        @media (max-width: 768px) {
          .sl-sidebar { display: none; }
          .sl-sidebar.open { display: block !important; position: fixed; inset: 0; z-index: 200; overflow-y: auto; border-radius: 0; }
          .sl-desktop-filter { display: none !important; }
        }
      `}</style>

      {/* ── Barre de recherche ── */}
      <div style={{
        background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}`,
        padding: '10px clamp(12px,3vw,32px)', display: 'flex', gap: 8,
        alignItems: 'center', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Champ ville — pleine largeur mobile */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
          <Search size={15} color={BAI.inkFaint} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            className="sl-input"
            type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="Ville, quartier, code postal…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: city ? 28 : 12,
              paddingTop: 10, paddingBottom: 10, borderRadius: 8, minHeight: 44,
              border: `1px solid ${BAI.border}`, background: BAI.bgInput,
              fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {city && (
            <button onClick={() => setCity('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, padding: 2 }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Type — masqué sur mobile */}
        <select
          className="sl-select sl-desktop-filter"
          value={filters.type ?? ''}
          onChange={e => handleFiltersChange({ ...filters, type: (e.target.value as any) || undefined })}
          style={{
            flex: '0 0 auto', background: BAI.bgInput, border: `1px solid ${BAI.border}`,
            borderRadius: 8, padding: '10px 12px', minHeight: 44, fontFamily: BAI.fontBody, fontSize: 14,
            color: filters.type ? BAI.ink : BAI.inkFaint, cursor: 'pointer', outline: 'none',
          }}
        >
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Budget — masqué sur mobile */}
        <select
          className="sl-select sl-desktop-filter"
          value={BUDGETS.find(b => {
            if (!b.value) return false
            const [min, max] = b.value.split('-')
            return filters.minPrice === (min ? Number(min) : undefined) && filters.maxPrice === (max ? Number(max) : undefined)
          })?.value ?? ''}
          onChange={e => {
            const v = e.target.value
            if (!v) { handleFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined }); return }
            const [min, max] = v.split('-')
            handleFiltersChange({ ...filters, minPrice: min ? Number(min) : undefined, maxPrice: max ? Number(max) : undefined })
          }}
          style={{
            flex: '0 0 auto', background: BAI.bgInput, border: `1px solid ${BAI.border}`,
            borderRadius: 8, padding: '10px 12px', minHeight: 44, fontFamily: BAI.fontBody, fontSize: 14,
            color: (filters.minPrice || filters.maxPrice) ? BAI.ink : BAI.inkFaint, cursor: 'pointer', outline: 'none',
          }}
        >
          {BUDGETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>

        {/* Tri — masqué sur mobile */}
        <select
          className="sl-select sl-desktop-filter"
          value={`${sortBy}-${sortOrder}`}
          onChange={e => { const [sb, so] = e.target.value.split('-'); setSortBy(sb as any); setSortOrder(so as any) }}
          style={{
            flex: '0 0 auto', background: BAI.bgInput, border: `1px solid ${BAI.border}`,
            borderRadius: 8, padding: '10px 12px', minHeight: 44, fontFamily: BAI.fontBody, fontSize: 14,
            color: BAI.inkMid, cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="createdAt-desc">Plus récent</option>
          <option value="createdAt-asc">Plus ancien</option>
          <option value="price-asc">Prix ↑</option>
          <option value="price-desc">Prix ↓</option>
        </select>

        {/* Toggle vue — masqué sur mobile */}
        <div className="sl-desktop-filter" style={{ display: 'flex', border: `1px solid ${BAI.border}`, borderRadius: 8, overflow: 'hidden', background: BAI.bgSurface, flexShrink: 0 }}>
          {([{ mode: 'grid', Icon: Grid3x3 }, { mode: 'map', Icon: MapIcon }] as { mode: 'grid' | 'map'; Icon: ElementType }[]).map(({ mode, Icon }, i) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '10px 14px', minHeight: 44, background: viewMode === mode ? BAI.night : 'transparent',
              color: viewMode === mode ? '#fff' : BAI.inkFaint,
              border: 'none', borderLeft: i > 0 ? `1px solid ${BAI.border}` : 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Bouton filtres — visible uniquement sur mobile (flex conditionnel React) */}
        <button
          onClick={() => {
            setShowMobileFilters(v => !v)
            if (!showMobileFilters) document.body.style.overflow = 'hidden'
            else document.body.style.overflow = ''
          }}
          className="sl-mobile-filter-btn flex md:hidden items-center"
          style={{
            gap: 6, padding: '10px 14px', minHeight: 44,
            background: hasActive ? BAI.caramelLight : BAI.bgInput,
            border: `1px solid ${hasActive ? BAI.caramel : BAI.border}`,
            borderRadius: 8, fontFamily: BAI.fontBody, fontSize: 14,
            color: hasActive ? BAI.caramel : BAI.inkMid, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <SlidersHorizontal size={15} /> Filtres{hasActive ? ' •' : ''}
        </button>

        {hasActive && (
          <button onClick={handleReset} style={{ fontSize: 13, color: BAI.caramel, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0, minHeight: 44 }}>
            Effacer
          </button>
        )}
      </div>

      {/* ── Corps : sidebar gauche + contenu ── */}
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: 'clamp(16px,2vw,24px) clamp(12px,3vw,32px)',
        display: 'flex', gap: 24, alignItems: 'flex-start',
      }}>

        {/* Sidebar filtres — toujours visible desktop */}
        <div className="sl-sidebar" style={{ width: 260, flexShrink: 0 }}>
          <FilterPanel
            filters={filters} city={city} onCity={setCity}
            onChange={handleFiltersChange} onReset={handleReset}
            total={totalProperties}
          />
        </div>

        {/* Overlay filtres mobile */}
        {showMobileFilters && (
          <div className="sl-sidebar open" style={{ padding: 20, background: BAI.bgBase }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 20 }}>Filtres</span>
              <button onClick={() => { setShowMobileFilters(false); document.body.style.overflow = '' }} style={{ background: 'none', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color={BAI.inkMid} />
              </button>
            </div>
            <FilterPanel filters={filters} city={city} onCity={setCity} onChange={handleFiltersChange} onReset={handleReset} total={totalProperties} />
          </div>
        )}

        {/* Contenu principal */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Résumé */}
          <div style={{ marginBottom: 16, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>
            {isLoading && allProperties.length === 0
              ? 'Chargement…'
              : <><span style={{ fontWeight: 700, color: BAI.ink }}>{totalProperties}</span> bien{totalProperties > 1 ? 's' : ''} disponible{totalProperties > 1 ? 's' : ''}</>
            }
          </div>

          {/* Carte */}
          {viewMode === 'map' && (
            <div style={{ borderRadius: 12, border: `1px solid ${BAI.border}`, overflow: 'hidden', height: 'calc(100vh - 160px)', minHeight: 'min(500px, 70vh)' }}>
              <SearchMap
                properties={allProperties}
                selectedPropertyId={selectedPropertyId}
                onPropertySelect={p => setSelectedPropertyId(p?.id ?? null)}
              />
            </div>
          )}

          {/* Grille */}
          {viewMode === 'grid' && (
            <>
              {!isLoading && allProperties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <HomeIcon size={48} color={BAI.inkFaint} style={{ opacity: 0.3, margin: '0 auto 16px', display: 'block' }} />
                  <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, color: BAI.inkMid, marginBottom: 8 }}>
                    Aucun bien trouvé.
                  </p>
                  <p style={{ fontSize: 14, color: BAI.inkFaint, marginBottom: 24 }}>Modifiez vos filtres pour voir plus de résultats.</p>
                  {hasActive && (
                    <button onClick={handleReset} style={{ background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Effacer les filtres
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%), 1fr))', gap: 20 }}>
                  {allProperties.map((property, i) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.24 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                {isLoading && allProperties.length > 0 && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${BAI.border}`, borderTopColor: BAI.caramel, animation: 'spin 0.8s linear infinite' }} />
                )}
                {!isLoading && !hasMore && allProperties.length > 0 && (
                  <p style={{ fontSize: 13, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>Tous les biens ont été affichés</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
