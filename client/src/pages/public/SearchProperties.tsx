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
  const [showFilters, setShowFilters] = useState(true)
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
      <div className="bg-gray-50">
        {/* Search Bar Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par ville, adresse, code postal..."
                className="input pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchParams({})
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary">
              Rechercher
            </button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div
            className={`${
              showFilters ? 'w-80' : 'w-0'
            } transition-all duration-300 overflow-hidden flex-shrink-0`}
          >
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtres
                  {hasActiveFilters && (
                    <span className="ml-2 w-2 h-2 bg-white rounded-full"></span>
                  )}
                </button>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{propertiesTotal}</span>{' '}
                  {propertiesTotal > 1 ? 'biens trouvés' : 'bien trouvé'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-')
                    setSortBy(newSortBy as any)
                    setSortOrder(newSortOrder as any)
                    setCurrentPage(1)
                  }}
                  className="input text-sm"
                >
                  <option value="createdAt-desc">Plus récent</option>
                  <option value="createdAt-asc">Plus ancien</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="views-desc">Plus vus</option>
                </select>

                {/* View Mode */}
                <div className="flex border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Vue grille"
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Vue liste"
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 ${
                      viewMode === 'map'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Vue carte"
                  >
                    <MapIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && properties.length === 0 && (
              <div className="text-center py-20">
                <HomeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Aucun bien trouvé
                </h2>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier vos critères de recherche
                </p>
                {hasActiveFilters && (
                  <button onClick={handleResetFilters} className="btn btn-primary">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}

            {/* Properties Grid/List/Map */}
            {!isLoading && properties.length > 0 && (
              <>
                {viewMode === 'map' ? (
                  <div className="h-[calc(100vh-280px)] rounded-lg overflow-hidden border border-gray-200">
                    <SearchMap
                      properties={properties}
                      selectedPropertyId={selectedPropertyId}
                      onPropertySelect={(property) => setSelectedPropertyId(property?.id || null)}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                          : 'space-y-4'
                      }
                    >
                      {properties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          variant={viewMode === 'list' ? 'compact' : 'default'}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2">
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

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 rounded-lg font-medium ${
                                  currentPage === pageNum
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                                }`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
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
