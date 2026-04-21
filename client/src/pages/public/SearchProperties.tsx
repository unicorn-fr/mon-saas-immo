import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteStore } from '../../store/favoriteStore'
import { PropertyCard } from '../../components/property/PropertyCard'
import { SearchFilters } from '../../components/property/SearchFilters'
import { PropertyFilters } from '../../types/property.types'
import { Layout } from '../../components/layout/Layout'
import {
  Search,
  Grid3x3,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
} from 'lucide-react'
import { SearchMap } from '../../components/property/SearchMap'

const M = {
  bg: '#fafaf8', surface: '#ffffff', muted: '#f4f2ee', inputBg: '#f8f7f4',
  ink: '#0d0c0a', inkMid: '#5a5754', inkFaint: '#9e9b96',
  tenant: '#1b5e3b', tenantLight: '#edf7f2', tenantBorder: '#9fd4ba',
  border: '#e4e1db', borderMid: '#ccc9c3',
  danger: '#9b1c1c', dangerBg: '#fef2f2',
  warning: '#92400e', warningBg: '#fdf5ec',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

export default function SearchProperties() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { loadFavorites } = useFavoriteStore()
  const {
    properties,
    totalProperties: propertiesTotal,
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
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'views'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filters State
  const [filters, setFilters] = useState<PropertyFilters>({
    city: searchParams.get('city') || undefined,
    type: (searchParams.get('type') as any) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  })

  const itemsPerPage = 12

  // Load favorites on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites()
    }
  }, [isAuthenticated, loadFavorites])

  // Fetch properties on filter/sort/page change
  useEffect(() => {
    if (searchQuery.trim()) {
      searchProperties(searchQuery, {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
      })
    } else {
      fetchProperties(filters, {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
      })
    }
  }, [filters, currentPage, sortBy, sortOrder, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery })
    } else {
      setSearchParams({})
    }
  }

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setFilters({})
    setSearchQuery('')
    setSearchParams({})
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(propertiesTotal / itemsPerPage)

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
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: M.inkFaint }}
                />
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
                    fontSize: 14,
                    outline: 'none',
                  }}
                  className="w-full pl-9 pr-9 py-2.5 transition-colors"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = M.tenant
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${M.tenantLight}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = M.border
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchParams({}) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: M.inkFaint }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = M.inkMid }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = M.inkFaint }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                style={{
                  background: M.tenant,
                  color: '#fff',
                  borderRadius: 8,
                  fontFamily: M.body,
                  fontWeight: 600,
                  fontSize: 14,
                  border: 'none',
                  padding: '0 16px',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  minHeight: 44,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                Rechercher
              </button>
            </form>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Filters Sidebar — mobile: collapsible full-width; desktop: side panel */}
            {showFilters && (
              <div className="w-full lg:w-80 flex-shrink-0">
                <div style={{
                  background: M.surface,
                  border: `1px solid ${M.border}`,
                  borderRadius: 12,
                  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                }}>
                  <SearchFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onReset={handleResetFilters}
                  />
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">

              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Filtres toggle — touch target ≥ 44px */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                    style={{
                      borderRadius: 8,
                      border: `1px solid ${showFilters ? M.tenant : M.border}`,
                      background: showFilters ? M.tenant : M.surface,
                      color: showFilters ? '#fff' : M.inkMid,
                      fontFamily: M.body,
                      cursor: 'pointer',
                      padding: '0 16px',
                      minHeight: 44,
                    }}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtres
                    {hasActiveFilters && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: showFilters ? '#fff' : M.tenant,
                        display: 'inline-block', marginLeft: 2,
                      }} />
                    )}
                  </button>
                  <p style={{ color: M.inkMid, fontSize: 14, fontFamily: M.body }}>
                    <span style={{ fontWeight: 600, color: M.ink }}>{propertiesTotal}</span>{' '}
                    {propertiesTotal > 1 ? 'biens trouvés' : 'bien trouvé'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sort */}
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-')
                      setSortBy(newSortBy as any)
                      setSortOrder(newSortOrder as any)
                      setCurrentPage(1)
                    }}
                    style={{
                      padding: '0 12px',
                      borderRadius: 8,
                      border: `1px solid ${M.border}`,
                      background: M.inputBg,
                      color: M.inkMid,
                      fontFamily: M.body,
                      fontSize: 14,
                      outline: 'none',
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    <option value="createdAt-desc">Plus récent</option>
                    <option value="createdAt-asc">Plus ancien</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="views-desc">Plus vus</option>
                  </select>

                  {/* View Mode — touch targets ≥ 44px */}
                  <div style={{ display: 'flex', border: `1px solid ${M.border}`, borderRadius: 8, overflow: 'hidden', background: M.surface }}>
                    {[
                      { mode: 'grid', Icon: Grid3x3, title: 'Vue grille' },
                      { mode: 'list', Icon: List, title: 'Vue liste' },
                      { mode: 'map', Icon: MapIcon, title: 'Vue carte' },
                    ].map(({ mode, Icon, title }, idx) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode as any)}
                        title={title}
                        style={{
                          padding: '0 14px',
                          minHeight: 44,
                          minWidth: 44,
                          background: viewMode === mode ? M.tenant : 'transparent',
                          color: viewMode === mode ? '#fff' : M.inkFaint,
                          border: 'none',
                          borderLeft: idx > 0 ? `1px solid ${M.border}` : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
                  background: M.dangerBg,
                  border: `1px solid #fca5a5`,
                  borderRadius: 12,
                }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: M.danger }} />
                  <p style={{ color: M.danger, fontSize: 14, fontFamily: M.body }}>{error}</p>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex justify-center items-center py-20">
                  <div
                    className="animate-spin rounded-full h-10 w-10"
                    style={{ border: `3px solid ${M.border}`, borderTopColor: M.tenant }}
                  />
                </div>
              )}

              {/* Empty State */}
              {!isLoading && properties.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{
                    background: M.tenantLight,
                    borderRadius: 16,
                  }}>
                    <HomeIcon className="w-8 h-8" style={{ color: M.tenant }} />
                  </div>
                  <h2 style={{ fontFamily: M.display, fontWeight: 700, fontStyle: 'italic', fontSize: 28, color: M.ink }} className="mb-2">
                    Aucun bien trouvé
                  </h2>
                  <p style={{ color: M.inkFaint, fontSize: 14, fontFamily: M.body }} className="mb-6">
                    Essayez de modifier vos critères de recherche
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      style={{
                        background: M.tenant,
                        color: '#fff',
                        borderRadius: 8,
                        fontFamily: M.body,
                        fontWeight: 600,
                        fontSize: 14,
                        border: 'none',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        minHeight: 44,
                      }}
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}

              {/* Properties Grid / List / Map */}
              {!isLoading && properties.length > 0 && (
                <>
                  {viewMode === 'map' ? (
                    <div className="h-[50dvh] sm:h-[calc(100vh-280px)] overflow-hidden" style={{
                      borderRadius: 12,
                      border: `1px solid ${M.border}`,
                    }}>
                      <SearchMap
                        properties={properties}
                        selectedPropertyId={selectedPropertyId}
                        onPropertySelect={(property) => setSelectedPropertyId(property?.id || null)}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Grid: 1 col mobile → 2 col sm → 3 col lg */}
                      <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                      }>
                        {properties.map((property) => (
                          <PropertyCard
                            key={property.id}
                            property={property}
                            variant={viewMode === 'list' ? 'compact' : 'default'}
                          />
                        ))}
                      </div>

                      {/* Pagination — centrée, boutons min 40px */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              border: `1px solid ${M.border}`,
                              background: M.surface,
                              color: M.inkMid,
                              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                              opacity: currentPage === 1 ? 0.4 : 1,
                              transition: 'background 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.background = M.muted }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = M.surface }}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }
                              const isActive = currentPage === pageNum
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  style={{
                                    width: 44, height: 44,
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    fontFamily: M.body,
                                    border: `1px solid ${isActive ? M.tenant : M.border}`,
                                    background: isActive ? M.tenant : M.surface,
                                    color: isActive ? '#fff' : M.inkMid,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              border: `1px solid ${M.border}`,
                              background: M.surface,
                              color: M.inkMid,
                              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                              opacity: currentPage === totalPages ? 0.4 : 1,
                              transition: 'background 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.background = M.muted }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = M.surface }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
