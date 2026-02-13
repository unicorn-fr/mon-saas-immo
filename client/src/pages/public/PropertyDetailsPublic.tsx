import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Home as HomeIcon,
  CheckCircle,
  XCircle,
  Euro,
  Calendar,
  Share2,
  Heart,
  MessageSquare,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteStore } from '../../store/favoriteStore'
import { ContactModal } from '../../components/property/ContactModal'
import { PropertyMap } from '../../components/property/PropertyMap'
import { BookingModal } from '../../components/booking/BookingModal'
import { PROPERTY_TYPES, AMENITIES } from '../../types/property.types'
import { Layout } from '../../components/layout/Layout'

export default function PropertyDetailsPublic() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { currentProperty, fetchPropertyById, incrementViews, isLoading, error } = useProperties()
  const { isFavorite, toggleFavorite, loadFavorites } = useFavoriteStore()

  const [selectedImage, setSelectedImage] = useState(0)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPropertyById(id, true) // true = public view, will increment views
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites()
    }
  }, [isAuthenticated, loadFavorites])

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: currentProperty?.title,
          text: currentProperty?.description,
          url: window.location.href,
        })
        .catch(console.error)
    } else {
      setShowShareMenu(!showShareMenu)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowShareMenu(false)
    // Could show a toast notification here
  }

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login')
      return
    }

    if (!id) return

    try {
      await toggleFavorite(id)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!currentProperty) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Propriété introuvable</h2>
            <Link to="/search" className="text-primary-600 hover:text-primary-700">
              Retour à la recherche
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const property = currentProperty
  const propertyType = PROPERTY_TYPES.find((t) => t.value === property.type)
  const images = property.images.length > 0 ? property.images : ['/placeholder-property.jpg']

  return (
    <Layout>
      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="card overflow-hidden">
              <div className="relative aspect-video bg-gray-200">
                <img
                  src={images[selectedImage]}
                  alt={`${property.title} - Image ${selectedImage + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-property.jpg'
                  }}
                />
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded">
                  {selectedImage + 1} / {images.length}
                </div>

                {/* Action Buttons Overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="relative">
                    <button
                      onClick={handleShare}
                      className="w-10 h-10 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <Share2 className="w-5 h-5 text-gray-700" />
                    </button>

                    {/* Share Menu */}
                    {showShareMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border p-2">
                        <button
                          onClick={handleCopyLink}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                        >
                          Copier le lien
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleFavoriteToggle}
                    className="w-10 h-10 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                    title={isFavorite(id || '') ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        isFavorite(id || '') ? 'fill-red-500 text-red-500' : 'text-gray-700'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {images.length > 1 && (
                <div className="p-4 grid grid-cols-6 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-primary-600 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-property.jpg'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Type */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>{propertyType?.label}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.city}, {property.postalCode}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-3xl font-bold text-primary-600">
                {property.price}€
                <span className="text-lg text-gray-600 font-normal">/mois</span>
              </div>
            </div>

            {/* Description */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Characteristics */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Caractéristiques</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Bed className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chambres</p>
                    <p className="font-semibold">{property.bedrooms}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Bath className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salles de bain</p>
                    <p className="font-semibold">{property.bathrooms}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Square className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Surface</p>
                    <p className="font-semibold">{property.surface}m²</p>
                  </div>
                </div>

                {property.floor !== null && property.floor !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <HomeIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Étage</p>
                      <p className="font-semibold">{property.floor}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    {property.furnished ? (
                      <Check className="w-5 h-5 text-primary-600" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meublé</p>
                    <p className="font-semibold">{property.furnished ? 'Oui' : 'Non'}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Équipements</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    {property.hasParking ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                    <span className="text-sm">Parking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {property.hasBalcony ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                    <span className="text-sm">Balcon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {property.hasElevator ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                    <span className="text-sm">Ascenseur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {property.hasGarden ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                    <span className="text-sm">Jardin</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Autres équipements</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity) => {
                      const amenityConfig = AMENITIES.find((a) => a.value === amenity)
                      return amenityConfig ? (
                        <span
                          key={amenity}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {amenityConfig.label}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Localisation</h2>
              <PropertyMap
                address={property.address}
                city={property.city}
                postalCode={property.postalCode}
                latitude={property.latitude}
                longitude={property.longitude}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="card sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Intéressé par ce bien ?</h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Loyer mensuel</span>
                  <span className="text-xl font-bold text-primary-600">{property.price}€</span>
                </div>
                {property.charges && property.charges > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Charges</span>
                    <span className="font-semibold">{property.charges}€</span>
                  </div>
                )}
                {property.deposit && property.deposit > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Dépôt de garantie</span>
                    <span className="font-semibold">{property.deposit}€</span>
                  </div>
                )}
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total mensuel</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {property.price + (property.charges || 0)}€
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="btn btn-primary w-full justify-center text-lg py-3 mb-3"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Réserver une visite
              </button>

              <button
                onClick={() => setShowContactModal(true)}
                className="btn btn-secondary w-full justify-center text-lg py-3 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Contacter le propriétaire
              </button>

              <p className="text-xs text-gray-600 text-center mt-3">
                Réponse généralement sous 24h
              </p>
            </div>

            {/* Info Card */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <h3 className="font-semibold mb-3">💡 Bon à savoir</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Contact direct avec le propriétaire</li>
                <li>✓ Aucun frais d'agence</li>
                <li>✓ Visite possible rapidement</li>
                <li>✓ Réponse rapide garantie</li>
              </ul>
            </div>

            {/* Published Date */}
            <div className="card">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Publié le {new Date(property.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        ownerName={property.owner?.firstName + ' ' + property.owner?.lastName}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        visitDuration={property.visitDuration || 30}
        onSuccess={() => {
          // Optionally navigate to my bookings page after successful booking
          // navigate('/my-bookings')
        }}
      />
    </Layout>
  )
}
