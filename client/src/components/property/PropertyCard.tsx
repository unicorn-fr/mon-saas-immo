import { useNavigate } from 'react-router-dom'
import { Property } from '../../types/property.types'
import { MapPin, Bed, Bath, Square, Heart, Eye } from 'lucide-react'
import { useFavoriteStore } from '../../store/favoriteStore'
import { useAuth } from '../../hooks/useAuth'

interface PropertyCardProps {
  property: Property
  variant?: 'default' | 'compact'
  showStats?: boolean
}

export const PropertyCard = ({
  property,
  variant = 'default',
  showStats = false,
}: PropertyCardProps) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { isFavorite, toggleFavorite } = useFavoriteStore()

  const mainImage = property.images[0] || '/placeholder-property.jpg'

  const handleClick = () => {
    navigate(`/property/${property.id}`)
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      await toggleFavorite(property.id)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className="flex gap-3 p-3 rounded-2xl border hover:shadow-card hover:border-primary-100 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
        style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
      >
        <img
          src={mainImage}
          alt={property.title}
          className="w-24 h-20 rounded-xl object-cover flex-shrink-0 group-hover:scale-[1.03] transition-transform duration-300"
          onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate group-hover:text-primary-600 transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center text-xs text-slate-500 mb-1.5">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0 text-primary-400" />
            <span className="truncate">{property.city}, {property.postalCode}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{property.bedrooms}</span>
            <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.bathrooms}</span>
            <span className="flex items-center gap-0.5"><Square className="w-3 h-3" />{property.surface}m²</span>
          </div>
          <p className="text-sm font-bold text-primary-600">{property.price}€/mois</p>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className="group relative rounded-3xl border shadow-card hover:shadow-card-glow-violet hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
      style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
    >
      {/* Image — edge-to-edge, clips dans ses propres coins arrondis */}
      <div className="relative h-52 overflow-hidden rounded-t-3xl">
        <img
          src={mainImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
        />

        {/* Gradient overlay bottom — améliore la lisibilité des badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Favorite Button */}
        {isAuthenticated && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:scale-110 transition-all duration-200 flex items-center justify-center"
            aria-label={isFavorite(property.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite(property.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'
              }`}
            />
          </button>
        )}

        {/* Price Badge — Glassmorphism */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-white/50 shadow-sm">
          <span className="font-bold text-slate-900 text-base">{property.price}€</span>
          <span className="text-xs text-slate-500 ml-1">/mois</span>
        </div>

        {/* Photo Count */}
        {property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-medium">
            {property.images.length} photos
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1.5 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center text-sm text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-primary-400" />
          <span className="line-clamp-1">{property.address}, {property.city}</span>
        </div>

        {/* Characteristics */}
        <div className="flex items-center gap-4 text-sm text-slate-500 pb-3 mb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms} ch.</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} sdb.</span>
          <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{property.surface}m²</span>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {property.furnished && (
            <span className="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full font-medium border border-primary-100">
              Meublé
            </span>
          )}
          {property.hasParking && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium border" style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
              Parking
            </span>
          )}
          {property.hasBalcony && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium border" style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
              Balcon
            </span>
          )}
          {property.hasElevator && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium border" style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
              Ascenseur
            </span>
          )}
        </div>

        {/* Stats or Description */}
        {showStats ? (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{property.views} vues</span>
            <span>·</span>
            <span>{property.contactCount} contacts</span>
          </div>
        ) : (
          <p className="text-sm text-slate-500 line-clamp-2">{property.description}</p>
        )}
      </div>
    </div>
  )
}
