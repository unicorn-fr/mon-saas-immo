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
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <p
              className="uppercase tracking-widest mb-1"
              style={{ fontSize: 10, color: '#9e9b96', letterSpacing: '0.12em' }}
            >
              Espace locataire
            </p>
            <div className="flex items-baseline gap-3">
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: 40,
                  color: '#0d0c0a',
                  lineHeight: 1,
                }}
              >
                Mes favoris
              </h1>
              {favoriteProperties.length > 0 && (
                <span
                  style={{
                    background: '#edf7f2',
                    color: '#1b5e3b',
                    border: '1px solid #9fd4ba',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 10px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {favoriteProperties.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 14, color: '#5a5754', marginTop: 6 }}>
              {favoriteProperties.length} propriété{favoriteProperties.length > 1 ? 's' : ''}{' '}
              sauvegardée{favoriteProperties.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Filters Bar */}
          <div
            className="p-4 mb-6"
            style={{
              background: '#ffffff',
              border: '1px solid #e4e1db',
              borderRadius: 12,
              boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: '#9e9b96' }}
                />
                <input
                  type="text"
                  placeholder="Rechercher dans mes favoris…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm outline-none transition-all"
                  style={{
                    border: '1px solid #e4e1db',
                    background: '#f8f7f4',
                    borderRadius: 8,
                    color: '#0d0c0a',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1b5e3b'
                    e.target.style.boxShadow = '0 0 0 2px rgba(27,94,59,0.10)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e4e1db'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 text-sm outline-none transition-all"
                style={{
                  border: '1px solid #e4e1db',
                  background: '#f8f7f4',
                  borderRadius: 8,
                  color: '#0d0c0a',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1b5e3b'
                  e.target.style.boxShadow = '0 0 0 2px rgba(27,94,59,0.10)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e4e1db'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="date">Plus récents</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>

              {/* View Toggle */}
              <div
                className="flex items-center gap-1 p-1"
                style={{ background: '#f4f2ee', borderRadius: 10 }}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  className="flex-1 py-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={
                    viewMode === 'grid'
                      ? {
                          background: '#ffffff',
                          color: '#1b5e3b',
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }
                      : { color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif" }
                  }
                >
                  <Grid className="w-4 h-4" />
                  Grille
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="flex-1 py-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={
                    viewMode === 'list'
                      ? {
                          background: '#ffffff',
                          color: '#1b5e3b',
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }
                      : { color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif" }
                  }
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
              <Loader className="w-8 h-8 animate-spin" style={{ color: '#1b5e3b' }} />
            </div>
          ) : sortedProperties.length === 0 ? (
            <div
              className="p-12 text-center"
              style={{
                background: '#ffffff',
                border: '1px solid #e4e1db',
                borderRadius: 12,
                boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
              }}
            >
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                style={{ background: '#f4f2ee', borderRadius: '50%' }}
              >
                <Heart className="w-7 h-7" style={{ color: '#9e9b96' }} />
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 22,
                  fontStyle: 'italic',
                  color: '#0d0c0a',
                  marginBottom: 8,
                }}
              >
                {favoriteProperties.length === 0 ? 'Aucun favori' : 'Aucun résultat'}
              </p>
              <p style={{ fontSize: 13, color: '#5a5754', marginBottom: 20 }}>
                {favoriteProperties.length === 0
                  ? 'Commencez à sauvegarder des propriétés pour les retrouver facilement ici.'
                  : 'Aucune propriété ne correspond à votre recherche.'}
              </p>
              {favoriteProperties.length === 0 && (
                <a
                  href="/search"
                  className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
                  style={{
                    background: '#1b5e3b',
                    color: '#ffffff',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
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
            <div className="mt-8 text-center" style={{ fontSize: 13, color: '#9e9b96' }}>
              Affichage de {sortedProperties.length} sur {favoriteProperties.length} propriété
              {favoriteProperties.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
