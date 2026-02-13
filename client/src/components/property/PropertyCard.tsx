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
    // Use /property/:id for public view (singular)
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
        className="flex gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
      >
        <img
          src={mainImage}
          alt={property.title}
          className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-property.jpg'
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{property.title}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">
              {property.city}, {property.postalCode}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms}
            </span>
            <span className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms}
            </span>
            <span className="flex items-center">
              <Square className="w-4 h-4 mr-1" />
              {property.surface}m²
            </span>
          </div>
          <p className="text-lg font-bold text-primary-600">{property.price}€/mois</p>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className="card overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        <img
          src={mainImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-property.jpg'
          }}
        />

        {/* Favorite Button */}
        {isAuthenticated && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors flex items-center justify-center"
            aria-label={isFavorite(property.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite(property.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-lg shadow-md">
          <span className="text-lg font-bold text-primary-600">{property.price}€</span>
          <span className="text-sm text-gray-600">/mois</span>
        </div>

        {/* Image Count Badge */}
        {property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {property.images.length} photos
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">
            {property.address}, {property.city} {property.postalCode}
          </span>
        </div>

        {/* Characteristics */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 pb-3 border-b">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span>{property.bedrooms} ch.</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span>{property.bathrooms} sdb.</span>
          </div>
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            <span>{property.surface}m²</span>
          </div>
        </div>

        {/* Features Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {property.furnished && (
            <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
              Meublé
            </span>
          )}
          {property.hasParking && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
              Parking
            </span>
          )}
          {property.hasBalcony && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
              Balcon
            </span>
          )}
          {property.hasElevator && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
              Ascenseur
            </span>
          )}
        </div>

        {/* Stats (only if showStats is true) */}
        {showStats && (
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {property.views} vues
            </span>
            <span>•</span>
            <span>{property.contactCount} contacts</span>
          </div>
        )}

        {/* Description Preview */}
        {!showStats && (
          <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
        )}
      </div>
    </div>
  )
}
