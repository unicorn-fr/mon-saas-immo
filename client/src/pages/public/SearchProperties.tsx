import { useState, useEffect, useRef, useCallback, type ElementType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteStore } from '../../store/favoriteStore'
import { PropertyCard } from '../../components/property/PropertyCard'
import { SearchFilters } from '../../components/property/SearchFilters'
import { PropertyFilters, Property } from '../../types/property.types'
import { Layout } from '../../components/layout/Layout'
import { apiClient } from '../../services/api.service'
import {
  Search,
  Grid3x3,
  Map as MapIcon,
  SlidersHorizontal,
  X,
  AlertCircle,
  Home as HomeIcon,
  Sparkles,
  Smartphone,
} from 'lucide-react'
import { SearchMap } from '../../components/property/SearchMap'
import { SwipeStack } from '../../components/property/SwipeStack'
import { SavedSearches } from '../../components/search/SavedSearches'
import { SearchOnboarding } from '../../components/search/SearchOnboarding'

const M = {
  bg: '#fafaf8', surface: '#ffffff', muted: '#f4f2ee', inputBg: '#f8f7f4',
  ink: '#0d0c0a', inkMid: '#5a5754', inkFaint: '#9e9b96',
  tenant: '#1b5e3b', tenantLight: '#edf7f2', tenantBorder: '#9fd4ba',
  border: '#e4e1db', borderMid: '#ccc9c3',
  danger: '#9b1c1c', dangerBg: '#fef2f2',
  caramel: '#c4976a', caramelLight: '#fdf5ec',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

interface NLChip {
  label: string
  value: string
}

export default function SearchProperties() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { loadFavorites, toggleFavorite, isFavorite } = useFavoriteStore()
  const {
    properties,
    totalProperties: propertiesTotal,
    hasMore,
    fetchProperties,
    searchProperties,
    isLoading,
    error,
  } = useProperties()

  // UI State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'swipe'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'views'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1)
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // NL Search state
  const [nlQuery, setNlQuery] = useState('')
  const [nlChips, setNlChips] = useState<NLChip[]>([])
  const [nlLoading, setNlLoading] = useState(false)

  // Filters State
  const [filters, setFilters] = useState<PropertyFilters>({
    city: searchParams.get('city') || undefined,
    type: (searchParams.get('type') as any) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  })

  const itemsPerPage = 12

  useEffect(() => {
    if (isAuthenticated) loadFavorites()
  }, [isAuthenticated, loadFavorites])

  // Accumulate results for infinite scroll
  useEffect(() => {
    if (currentPage === 1) {
      setAllProperties(properties)
    } else {
      setAllProperties(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const newOnes = properties.filter(p => !existingIds.has(p.id))
        return [...prev, ...newOnes]
      })
    }
  }, [properties]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch on filter/sort/page change
  useEffect(() => {
    if (searchQuery.trim()) {
      searchProperties(searchQuery, { page: currentPage, limit: itemsPerPage, sortBy, sortOrder })
    } else {
      fetchProperties(filters, { page: currentPage, limit: itemsPerPage, sortBy, sortOrder })
    }
  }, [filters, currentPage, sortBy, sortOrder, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver for infinite scroll
  const handleSentinel = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting && hasMore && !isLoading) {
      setCurrentPage(p => p + 1)
    }
  }, [hasMore, isLoading])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(handleSentinel, { rootMargin: '200px' })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [handleSentinel])

  // Restore last search on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bailio_last_search')
      if (raw) {
        const { filters: f, chips, nlQuery: q } = JSON.parse(raw)
        if (f && Object.keys(f).length > 0) {
          setFilters(f)
          setNlChips(chips ?? [])
          setNlQuery(q ?? '')
        }
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save last search
  useEffect(() => {
    if (Object.keys(filters).length > 0 || nlChips.length > 0) {
      localStorage.setItem('bailio_last_search', JSON.stringify({ filters, chips: nlChips, nlQuery }))
    }
  }, [filters, nlChips, nlQuery])

  // Onboarding: show once
  useEffect(() => {
    if (!localStorage.getItem('bailio_onboarded')) {
      const t = setTimeout(() => setShowOnboarding(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const resetPage = () => {
    setCurrentPage(1)
    setAllProperties([])
  }

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters)
    resetPage()
  }

  const handleResetFilters = () => {
    setFilters({})
    setSearchQuery('')
    setNlChips([])
    setNlQuery('')
    setSearchParams({})
    resetPage()
  }

  const handleNLSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nlQuery.trim()) return
    setNlLoading(true)
    try {
      const res = await apiClient.post<{ success: boolean; data: { filters: PropertyFilters; chips: NLChip[] } }>(
        '/properties/parse-query',
        { query: nlQuery }
      )
      const { filters: parsed, chips } = res.data.data
      setNlChips(chips)
      setFilters(prev => ({ ...prev, ...parsed }))
      resetPage()
    } catch {
      // silently ignore
    } finally {
      setNlLoading(false)
    }
  }

  const removeNlChip = (chip: NLChip) => {
    const labelToFilter: Record<string, keyof PropertyFilters> = {
      'Prix max': 'maxPrice',
      'Prix min': 'minPrice',
      'Surface min': 'minSurface',
      'Surface max': 'maxSurface',
      'Chambres': 'bedrooms',
      'Type': 'type',
      'Meublé': 'furnished',
      'Parking': 'hasParking',
      'Ascenseur': 'hasElevator',
      'Jardin': 'hasGarden',
      'Terrasse': 'hasGarden',
      'Balcon': 'hasBalcony',
      'Ville': 'city',
    }
    const key = labelToFilter[chip.label]
    if (key) {
      setFilters(prev => { const n = { ...prev }; delete n[key]; return n })
    }
    setNlChips(prev => prev.filter(c => c !== chip))
    resetPage()
  }

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof PropertyFilters]
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== ''
  })

  return (
    <Layout>
      <div style={{ background: M.bg, fontFamily: M.body }} className="min-h-screen">

        {/* ── Dark hero search ───────────────────────────────────────────── */}
        <div style={{ background: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>
          {/* ambient clouds */}
          <div style={{ position: 'absolute', width: 380, height: 110, top: '10%', right: -100, borderRadius: '50%', background: 'rgba(196,151,106,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 280, height: 90, bottom: 0, left: '10%', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(50px)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(20px,4vh,64px) clamp(16px,5vw,48px) clamp(20px,3vh,48px)', position: 'relative', zIndex: 2, textAlign: 'center' }}>

            {/* eyebrow pill — masquée sur mobile pour gagner de la place */}
            <span className="hidden sm:inline-flex" style={{
              alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 999, padding: '6px 14px', marginBottom: 16,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: M.caramel,
              fontFamily: M.body,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: M.caramel, display: 'inline-block', flexShrink: 0, animation: 'pulseDot 1.8s infinite' }} />
              Recherche propulsée par l'IA
            </span>

            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(22px,4.5vw,52px)',
              color: '#fff', lineHeight: 1.1, margin: '0 0 8px',
            }}>
              Décris ton logement <em style={{ color: M.caramel }}>idéal.</em>
            </h1>
            <p className="hidden sm:block" style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', fontFamily: M.body }}>
              Une phrase suffit. L'IA fait le tri parmi tous les biens disponibles.
            </p>
            <div className="block sm:hidden" style={{ height: 16 }} />

            {/* ── AI Box ── */}
            <div
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 14, padding: '6px 6px 6px 8px', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)', transition: 'all .25s',
              }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = M.caramel; e.currentTarget.style.boxShadow = '0 8px 32px rgba(196,151,106,0.18)' }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
            >
              <form onSubmit={handleNLSearch} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Sparkles style={{ width: 18, height: 18, color: M.caramel, flexShrink: 0, marginLeft: 6 }} />
                <input
                  type="text"
                  value={nlQuery}
                  onChange={e => setNlQuery(e.target.value)}
                  placeholder="T2 Lyon centre, moins de 800 €, avec parking…"
                  style={{
                    flex: 1, background: 'transparent', border: 0, outline: 0,
                    fontFamily: M.body, color: '#fff', fontSize: 15,
                    padding: '14px 8px', minWidth: 0,
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleNLSearch(e as any) } }}
                />
                <button type="submit" disabled={nlLoading} style={{
                  background: nlLoading ? '#6a6a8a' : M.caramel, color: '#fff', border: 0, borderRadius: 10,
                  padding: '0 18px', height: 44, fontFamily: M.body, fontWeight: 600, fontSize: 14,
                  cursor: nlLoading ? 'not-allowed' : 'pointer', flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .2s', whiteSpace: 'nowrap',
                }}>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{nlLoading ? '…' : 'Chercher'}</span>
                </button>
              </form>
            </div>

            {/* Preset chips — masqués sur mobile */}
            {nlChips.length === 0 && !nlLoading && (
              <div className="hidden sm:flex" style={{ flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 18 }}>
                {['Studio Paris 11e < 1 100 €', 'T3 Lyon avec balcon', 'Meublé Bordeaux centre', 'Maison Nantes avec jardin'].map(preset => (
                  <button key={preset} onClick={() => setNlQuery(preset)}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.85)', padding: '8px 14px', borderRadius: 999,
                      fontSize: 12.5, cursor: 'pointer', fontFamily: M.body, transition: 'all .18s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,151,106,0.15)'; (e.currentTarget as HTMLButtonElement).style.borderColor = M.caramel; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)'; (e.currentTarget as HTMLButtonElement).style.transform = '' }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}

            {/* Loading dots */}
            {nlLoading && (
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: M.body }}>
                <span style={{ display: 'inline-flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, background: M.caramel, borderRadius: '50%', display: 'inline-block', animation: `bounce 1.2s ${i * 0.16}s infinite ease-in-out` }} />
                  ))}
                </span>
                L'IA analyse ta demande…
              </div>
            )}

            {/* Criteria pills */}
            {nlChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                {nlChips.map((chip, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(196,151,106,0.18)', border: '1px solid rgba(196,151,106,0.4)',
                    color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontFamily: M.body,
                  }}>
                    <span style={{ color: M.caramel, fontWeight: 600 }}>{chip.label} :</span>
                    {chip.value}
                    <button onClick={() => removeNlChip(chip)} style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button onClick={() => { setNlChips([]); handleResetFilters() }} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', fontFamily: M.body }}>
                  Tout effacer
                </button>
              </div>
            )}

            <SavedSearches
              currentFilters={filters}
              currentChips={nlChips}
              currentNlQuery={nlQuery}
              hasChips={nlChips.length > 0}
              onApply={(saved) => {
                setFilters(saved.filters)
                setNlChips(saved.chips)
                setNlQuery(saved.nlQuery)
                resetPage()
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Filters Sidebar */}
            {showFilters && (
              <div className="w-full lg:w-80 flex-shrink-0">
                <div style={{
                  background: M.surface, border: `1px solid ${M.border}`,
                  borderRadius: 12, boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                }}>
                  <SearchFilters filters={filters} onFiltersChange={handleFiltersChange} onReset={handleResetFilters} />
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">

              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2" style={{
                    borderRadius: 8, border: `1px solid ${showFilters ? M.tenant : M.border}`,
                    background: showFilters ? M.tenant : M.surface, color: showFilters ? '#fff' : M.inkMid,
                    fontFamily: M.body, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    padding: '0 16px', minHeight: 44,
                  }}>
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtres
                    {hasActiveFilters && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: showFilters ? '#fff' : M.tenant, display: 'inline-block', marginLeft: 2,
                      }} />
                    )}
                  </button>
                  <p style={{ color: M.inkMid, fontSize: 14, fontFamily: M.body }}>
                    <span style={{ fontWeight: 600, color: M.ink }}>{propertiesTotal}</span>{' '}
                    {propertiesTotal > 1 ? 'biens trouvés' : 'bien trouvé'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-')
                      setSortBy(newSortBy as any)
                      setSortOrder(newSortOrder as any)
                      resetPage()
                    }}
                    style={{
                      padding: '0 12px', borderRadius: 8, border: `1px solid ${M.border}`,
                      background: M.inputBg, color: M.inkMid, fontFamily: M.body,
                      fontSize: 16, outline: 'none', cursor: 'pointer', minHeight: 44,
                    }}
                  >
                    <option value="createdAt-desc">Plus récent</option>
                    <option value="createdAt-asc">Plus ancien</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="views-desc">Plus vus</option>
                  </select>

                  <div style={{ display: 'flex', border: `1px solid ${M.border}`, borderRadius: 8, overflow: 'hidden', background: M.surface }}>
                    {([
                      { mode: 'grid', Icon: Grid3x3, title: 'Vue grille' },
                      { mode: 'map', Icon: MapIcon, title: 'Vue carte' },
                      { mode: 'swipe', Icon: Smartphone, title: 'Mode swipe' },
                    ] as { mode: 'grid' | 'map' | 'swipe'; Icon: ElementType; title: string }[]).map(({ mode, Icon, title }, idx) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        title={title}
                        style={{
                          padding: '0 14px', minHeight: 44, minWidth: 44,
                          background: viewMode === mode ? M.tenant : 'transparent',
                          color: viewMode === mode ? '#fff' : M.inkFaint,
                          border: 'none', borderLeft: idx > 0 ? `1px solid ${M.border}` : 'none',
                          cursor: 'pointer', transition: 'background 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 flex items-start gap-3 p-4" style={{
                  background: M.dangerBg, border: `1px solid #fca5a5`, borderRadius: 12,
                }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: M.danger }} />
                  <p style={{ color: M.danger, fontSize: 14, fontFamily: M.body }}>{error}</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && allProperties.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ background: M.tenantLight, borderRadius: 16 }}>
                    <HomeIcon className="w-8 h-8" style={{ color: M.tenant }} />
                  </div>
                  <h2 style={{ fontFamily: M.display, fontWeight: 700, fontStyle: 'italic', fontSize: 28, color: M.ink }} className="mb-2">
                    Aucun bien trouvé
                  </h2>
                  <p style={{ color: M.inkFaint, fontSize: 14, fontFamily: M.body }} className="mb-6">
                    Essayez de modifier vos critères de recherche
                  </p>
                  {(hasActiveFilters || nlChips.length > 0) && (
                    <button onClick={handleResetFilters} style={{
                      background: M.tenant, color: '#fff', borderRadius: 8,
                      fontFamily: M.body, fontWeight: 600, fontSize: 14, border: 'none',
                      padding: '10px 20px', cursor: 'pointer', minHeight: 44,
                    }}>
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}

              {/* Map View */}
              {viewMode === 'map' && allProperties.length > 0 && (
                <div style={{
                  borderRadius: 12, border: `1px solid ${M.border}`, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  height: 'calc(100dvh - 200px)', minHeight: 520,
                }}>
                  {/* Compact filter bar for map mode */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px',
                    borderBottom: `1px solid ${M.border}`, background: M.surface,
                    alignItems: 'center',
                  }}>
                    <input
                      type="text"
                      placeholder="Ville…"
                      value={filters.city ?? ''}
                      onChange={e => { handleFiltersChange({ ...filters, city: e.target.value || undefined }) }}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: `1px solid ${M.border}`,
                        background: M.inputBg, color: M.ink, fontFamily: M.body, fontSize: 13,
                        outline: 'none', minWidth: 110, flex: '1 1 110px', maxWidth: 200,
                      }}
                    />
                    <select
                      value={filters.type ?? ''}
                      onChange={e => handleFiltersChange({ ...filters, type: (e.target.value as any) || undefined })}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: `1px solid ${M.border}`,
                        background: M.inputBg, color: filters.type ? M.ink : M.inkFaint,
                        fontFamily: M.body, fontSize: 13, outline: 'none', cursor: 'pointer',
                        flex: '1 1 120px', maxWidth: 180,
                      }}
                    >
                      <option value="">Tous types</option>
                      <option value="APARTMENT">Appartement</option>
                      <option value="HOUSE">Maison</option>
                      <option value="STUDIO">Studio</option>
                      <option value="LOFT">Loft</option>
                      <option value="ROOM">Chambre</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1 1 180px', maxWidth: 280 }}>
                      <input
                        type="number"
                        placeholder="Prix min"
                        value={filters.minPrice ?? ''}
                        onChange={e => handleFiltersChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                        style={{
                          padding: '6px 10px', borderRadius: 8, border: `1px solid ${M.border}`,
                          background: M.inputBg, color: M.ink, fontFamily: M.body, fontSize: 13,
                          outline: 'none', width: '80px', flex: 1,
                        }}
                      />
                      <span style={{ color: M.inkFaint, fontSize: 12 }}>–</span>
                      <input
                        type="number"
                        placeholder="Prix max"
                        value={filters.maxPrice ?? ''}
                        onChange={e => handleFiltersChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                        style={{
                          padding: '6px 10px', borderRadius: 8, border: `1px solid ${M.border}`,
                          background: M.inputBg, color: M.ink, fontFamily: M.body, fontSize: 13,
                          outline: 'none', width: '80px', flex: 1,
                        }}
                      />
                      <span style={{ color: M.inkFaint, fontSize: 12 }}>€</span>
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: `1px solid ${M.border}`,
                          background: 'transparent', color: M.danger, fontFamily: M.body, fontSize: 12,
                          fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  {/* Map — flex-1 to fill remaining space */}
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <SearchMap
                      properties={allProperties}
                      selectedPropertyId={selectedPropertyId}
                      onPropertySelect={(property) => setSelectedPropertyId(property?.id || null)}
                    />
                  </div>
                </div>
              )}

              {/* Swipe View */}
              {viewMode === 'swipe' && allProperties.length > 0 && (
                <SwipeStack
                  properties={allProperties}
                  onFavorite={async (id) => { await toggleFavorite(id) }}
                  isFavorite={(id) => isFavorite(id)}
                />
              )}

              {/* Grid View */}
              {viewMode !== 'map' && viewMode !== 'swipe' && allProperties.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                    />
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel + spinner */}
              {viewMode !== 'map' && viewMode !== 'swipe' && (
                <div ref={sentinelRef} className="flex justify-center items-center py-10">
                  {isLoading && (
                    <div className="animate-spin rounded-full h-8 w-8"
                      style={{ border: `3px solid ${M.border}`, borderTopColor: M.tenant }} />
                  )}
                  {!isLoading && !hasMore && allProperties.length > 0 && (
                    <p style={{ color: M.inkFaint, fontSize: 13, fontFamily: M.body }}>
                      Tous les biens ont été affichés
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {showOnboarding && (
        <SearchOnboarding
          onClose={() => {
            localStorage.setItem('bailio_onboarded', '1')
            setShowOnboarding(false)
          }}
        />
      )}
    </Layout>
  )
}
