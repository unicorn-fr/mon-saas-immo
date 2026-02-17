import { useEffect, useState } from 'react'
import { Heart, Loader, Search, Grid, List } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { useFavoriteStore } from '../../store/favoriteStore'
import { PropertyCard } from '../../components/property/PropertyCard'
import { Layout } from '../../components/layout/Layout'

type ViewMode = 'grid' | 'list'
type SortBy = 'date' | 'price-asc' | 'price-desc'

export default function Favorites() {
  const { properties, fetchProperties, isLoading } = useProperties()
  const { favoriteIds, loadFavorites } = useFavoriteStore()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadFavorites()
    fetchProperties()
  }, [loadFavorites, fetchProperties])

  // Filter favorite properties
  const favoriteProperties = properties.filter((p) => favoriteIds.has(p.id))

  // Filter by search query
  const filteredProperties = favoriteProperties.filter((property) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      property.title.toLowerCase().includes(query) ||
      property.city.toLowerCase().includes(query) ||
      property.description.toLowerCase().includes(query)
    )
  })

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-600" />
            Mes Favoris
          </h1>
          <p className="text-gray-600">
            {favoriteProperties.length} propriété{favoriteProperties.length > 1 ? 's' : ''}{' '}
            sauvegardée{favoriteProperties.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans mes favoris..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date">Plus récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`
                  flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Grid className="w-4 h-4" />
                Grille
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`
                  flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <List className="w-4 h-4" />
                Liste
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && favoriteProperties.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : sortedProperties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {favoriteProperties.length === 0
                ? 'Aucun favori'
                : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 mb-6">
              {favoriteProperties.length === 0
                ? 'Commencez à sauvegarder des propriétés pour les retrouver facilement ici.'
                : 'Aucune propriété ne correspond à votre recherche.'}
            </p>
            {favoriteProperties.length === 0 && (
              <a
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Search className="w-5 h-5" />
                Explorer les propriétés
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} variant="default" />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {sortedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} variant="compact" />
                ))}
              </div>
            )}
          </>
        )}

        {/* Results Count */}
        {sortedProperties.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Affichage de {sortedProperties.length} sur {favoriteProperties.length} propriété
            {favoriteProperties.length > 1 ? 's' : ''}
          </div>
        )}
        </div>
      </div>
    </Layout>
  )
}
