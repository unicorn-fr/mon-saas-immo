import { useEffect, useState } from 'react'
import { Heart, Loader, Search, Grid, List } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { useFavoriteStore } from '../../store/favoriteStore'
import { PropertyCard } from '../../components/property/PropertyCard'
import { Layout } from '../../components/layout/Layout'

type ViewMode = 'grid' | 'list'
type SortBy = 'date' | 'price-asc' | 'price-desc'

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
}

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
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f5f5f7' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1 flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500" />
              Mes Favoris
            </h1>
            <p className="text-slate-500 text-sm">
              {favoriteProperties.length} propriété{favoriteProperties.length > 1 ? 's' : ''}{' '}
              sauvegardée{favoriteProperties.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="p-5 mb-5 rounded-2xl" style={cardStyle}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans mes favoris..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-slate-700 outline-none transition-all"
                  style={{ border: '1px solid #d2d2d7', background: '#ffffff' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d2d2d7'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-4 py-2 rounded-xl text-sm text-slate-700 outline-none transition-all"
                style={{ border: '1px solid #d2d2d7', background: '#ffffff' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d2d2d7'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="date">Plus récents</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  style={viewMode === 'grid'
                    ? { background: '#ffffff', color: '#1d1d1f', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { color: '#64748b' }}
                >
                  <Grid className="w-4 h-4" />
                  Grille
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  style={viewMode === 'list'
                    ? { background: '#ffffff', color: '#1d1d1f', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { color: '#64748b' }}
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
              <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : sortedProperties.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={cardStyle}>
              <Heart className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {favoriteProperties.length === 0
                  ? 'Aucun favori'
                  : 'Aucun résultat'}
              </h3>
              <p className="text-slate-500 mb-6 text-sm">
                {favoriteProperties.length === 0
                  ? 'Commencez à sauvegarder des propriétés pour les retrouver facilement ici.'
                  : 'Aucune propriété ne correspond à votre recherche.'}
              </p>
              {favoriteProperties.length === 0 && (
                <a
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
                  style={{ background: '#3b82f6' }}
                >
                  <Search className="w-4 h-4" />
                  Explorer les propriétés
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <div className="mt-8 text-center text-sm text-slate-400">
              Affichage de {sortedProperties.length} sur {favoriteProperties.length} propriété
              {favoriteProperties.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
