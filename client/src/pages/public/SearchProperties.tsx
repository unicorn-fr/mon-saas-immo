import { useState, useEffect, useRef, useCallback } from 'react'
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
  List,
  Map as MapIcon,
  SlidersHorizontal,
  X,
  AlertCircle,
  Home as HomeIcon,
  Sparkles,
} from 'lucide-react'
import { SearchMap } from '../../components/property/SearchMap'

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
  const { loadFavorites } = useFavoriteStore()
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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'views'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1)
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // NL Search state
  const [nlMode, setNlMode] = useState(false)
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

  const resetPage = () => {
    setCurrentPage(1)
    setAllProperties([])
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    resetPage()
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery })
    } else {
      setSearchParams({})
    }
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

        {/* Search Bar */}
        <div style={{ background: M.surface, borderBottom: `1px solid ${M.border}`, boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
          <div className="container mx-auto px-4 py-4 space-y-3">

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setNlMode(false)}
                style={{
                  fontSize: 12, fontWeight: 600, fontFamily: M.body,
                  padding: '4px 12px', borderRadius: 20,
                  border: `1px solid ${!nlMode ? M.tenant : M.border}`,
                  background: !nlMode ? M.tenantLight : 'transparent',
                  color: !nlMode ? M.tenant : M.inkFaint,
                  cursor: 'pointer',
                }}
              >
                Classique
              </button>
              <button
                onClick={() => setNlMode(true)}
                className="inline-flex items-center gap-1.5"
                style={{
                  fontSize: 12, fontWeight: 600, fontFamily: M.body,
                  padding: '4px 12px', borderRadius: 20,
                  border: `1px solid ${nlMode ? M.caramel : M.border}`,
                  background: nlMode ? M.caramelLight : 'transparent',
                  color: nlMode ? M.caramel : M.inkFaint,
                  cursor: 'pointer',
                }}
              >
                <Sparkles className="w-3 h-3" />
                Recherche IA
              </button>
            </div>

            {/* Classic search bar */}
            {!nlMode && (
              <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: M.inkFaint }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ville, adresse, code postal…"
                    style={{
                      background: M.inputBg,
                      border: `1px solid ${M.border}`,
                      borderRadius: 8,
                      color: M.ink,
                      fontFamily: M.body,
                      fontSize: 16,
                      outline: 'none',
                    }}
                    className="w-full pl-9 pr-9 py-2.5"
                    onFocus={(e) => { e.currentTarget.style.borderColor = M.tenant; e.currentTarget.style.boxShadow = `0 0 0 3px ${M.tenantLight}` }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = M.border; e.currentTarget.style.boxShadow = 'none' }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => { setSearchQuery(''); setSearchParams({}) }}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: M.inkFaint }}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button type="submit" style={{
                  background: M.tenant, color: '#fff', borderRadius: 8,
                  fontFamily: M.body, fontWeight: 600, fontSize: 14, border: 'none',
                  padding: '0 20px', cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap',
                }}>
                  Rechercher
                </button>
              </form>
            )}

            {/* NL search bar */}
            {nlMode && (
              <div className="space-y-2">
                <form onSubmit={handleNLSearch} className="flex gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: M.caramel }} />
                    <input
                      type="text"
                      value={nlQuery}
                      onChange={(e) => setNlQuery(e.target.value)}
                      placeholder="Ex: appartement moins de 800€ avec parking et jardin à Lyon…"
                      style={{
                        background: M.caramelLight,
                        border: `1px solid ${M.caramel}`,
                        borderRadius: 8,
                        color: M.ink,
                        fontFamily: M.body,
                        fontSize: 15,
                        outline: 'none',
                      }}
                      className="w-full pl-9 pr-9 py-2.5"
                      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${M.caramelLight}` }}
                      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                    />
                    {nlQuery && (
                      <button type="button" onClick={() => { setNlQuery(''); setNlChips([]) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: M.inkFaint }}>
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button type="submit" disabled={nlLoading} style={{
                    background: M.caramel, color: '#fff', borderRadius: 8,
                    fontFamily: M.body, fontWeight: 600, fontSize: 14, border: 'none',
                    padding: '0 20px', cursor: nlLoading ? 'wait' : 'pointer',
                    minHeight: 44, whiteSpace: 'nowrap', opacity: nlLoading ? 0.7 : 1,
                  }}>
                    {nlLoading ? '…' : 'Analyser'}
                  </button>
                </form>

                {/* NL chips */}
                {nlChips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {nlChips.map((chip, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5" style={{
                        background: M.caramelLight, border: `1px solid ${M.caramel}`,
                        borderRadius: 20, padding: '3px 10px', fontSize: 12,
                        fontFamily: M.body, color: M.caramel, fontWeight: 600,
                      }}>
                        <span style={{ color: M.inkMid, fontWeight: 400 }}>{chip.label} :</span>
                        {chip.value}
                        <button onClick={() => removeNlChip(chip)} style={{ color: M.caramel, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button onClick={() => { setNlChips([]); handleResetFilters() }} style={{
                      fontSize: 12, fontFamily: M.body, color: M.inkFaint,
                      background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px',
                    }}>
                      Tout effacer
                    </button>
                  </div>
                )}
              </div>
            )}
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
                      { mode: 'list', Icon: List, title: 'Vue liste' },
                      { mode: 'map', Icon: MapIcon, title: 'Vue carte' },
                    ] as const).map(({ mode, Icon, title }, idx) => (
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
                <div className="h-[60dvh] sm:h-[calc(100vh-300px)] overflow-hidden" style={{
                  borderRadius: 12, border: `1px solid ${M.border}`,
                }}>
                  <SearchMap
                    properties={allProperties}
                    selectedPropertyId={selectedPropertyId}
                    onPropertySelect={(property) => setSelectedPropertyId(property?.id || null)}
                  />
                </div>
              )}

              {/* Grid / List View */}
              {viewMode !== 'map' && allProperties.length > 0 && (
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
                }>
                  {allProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                    />
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel + spinner */}
              {viewMode !== 'map' && (
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
    </Layout>
  )
}
