import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Home as HomeIcon,
  CheckCircle,
  XCircle,
  Calendar,
  Share2,
  Heart,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  SendHorizonal,
  Clock,
} from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteStore } from '../../store/favoriteStore'
import { ContactModal } from '../../components/property/ContactModal'
import { PropertyMap } from '../../components/property/PropertyMap'
import { BookingModal } from '../../components/booking/BookingModal'
import { PreQualificationModal } from '../../components/application/PreQualificationModal'
import { PROPERTY_TYPES, AMENITIES } from '../../types/property.types'
import { Layout } from '../../components/layout/Layout'
import { applicationService } from '../../services/application.service'
import { dossierService } from '../../services/dossierService'
import type { Application } from '../../types/application.types'
import { DEFAULT_CRITERIA } from '../../types/application.types'

export default function PropertyDetailsPublic() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { currentProperty, fetchPropertyById, isLoading, error } = useProperties()
  const { isFavorite, toggleFavorite, loadFavorites } = useFavoriteStore()

  const [selectedImage, setSelectedImage] = useState(0)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showPreQualModal, setShowPreQualModal] = useState(false)
  const [myApplication, setMyApplication] = useState<Application | null | undefined>(undefined)
  const [docCategories, setDocCategories] = useState<string[]>([])

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

  // Load tenant's existing application + doc categories for pre-qual
  useEffect(() => {
    if (!isAuthenticated || !id || user?.role !== 'TENANT') return
    Promise.all([
      applicationService.list(id).then((apps) => {
        const mine = apps.find((a) => a.tenantId === user?.id)
        setMyApplication(mine ?? null)
      }).catch(() => setMyApplication(null)),
      dossierService.getDocuments().then((docs) => {
        setDocCategories([...new Set(docs.map((d) => d.category))])
      }).catch(() => setDocCategories([])),
    ])
  }, [isAuthenticated, id, user?.id, user?.role]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f5f7' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#007AFF]"></div>
        </div>
      </Layout>
    )
  }

  if (!currentProperty) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-[#e8f0fe] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HomeIcon className="w-8 h-8 text-[#007AFF]" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Propriété introuvable</h2>
            <Link to="/search" className="text-[#007AFF] hover:text-[#0066d6] text-sm font-medium">
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

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #d2d2d7',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
  }

  return (
    <Layout>
      <div style={{ background: '#f5f5f7' }} className="min-h-screen">
        {/* Error Message */}
        {error && (
          <div className="container mx-auto px-4 pt-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div style={cardStyle} className="overflow-hidden">
                <div className="relative aspect-video bg-slate-100">
                  <img
                    src={images[selectedImage]}
                    alt={`${property.title} - Image ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-property.jpg'
                    }}
                  />
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-lg font-medium">
                    {selectedImage + 1} / {images.length}
                  </div>

                  {/* Action Buttons Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <div className="relative">
                      <button
                        onClick={handleShare}
                        className="w-9 h-9 bg-white rounded-xl shadow-md hover:bg-slate-50 transition-colors flex items-center justify-center"
                      >
                        <Share2 className="w-4 h-4 text-slate-600" />
                      </button>

                      {showShareMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#d2d2d7] p-2 z-10">
                          <button
                            onClick={handleCopyLink}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700"
                          >
                            Copier le lien
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleFavoriteToggle}
                      className="w-9 h-9 bg-white rounded-xl shadow-md hover:bg-slate-50 transition-colors flex items-center justify-center"
                      title={isFavorite(id || '') ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFavorite(id || '') ? 'fill-red-500 text-red-500' : 'text-slate-600'
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
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index
                            ? 'border-[#007AFF] ring-2 ring-[#007AFF]/20'
                            : 'border-[#d2d2d7] hover:border-slate-300'
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
              <div style={cardStyle} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{property.title}</h1>
                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                      <span className="px-2.5 py-0.5 bg-[#e8f0fe] text-[#007AFF] rounded-full text-xs font-semibold">{propertyType?.label}</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {property.city}, {property.postalCode}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-3xl font-extrabold text-[#007AFF]">
                  {property.price}€
                  <span className="text-base text-slate-500 font-normal ml-1">/mois</span>
                </div>
              </div>

              {/* Description */}
              <div style={cardStyle} className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Description</h2>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed text-sm">
                  {property.description}
                </p>
              </div>

              {/* Characteristics */}
              <div style={cardStyle} className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Caractéristiques</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e8f0fe] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bed className="w-5 h-5 text-[#007AFF]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Chambres</p>
                      <p className="font-semibold text-slate-900">{property.bedrooms}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e8f0fe] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bath className="w-5 h-5 text-[#007AFF]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Salles de bain</p>
                      <p className="font-semibold text-slate-900">{property.bathrooms}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e8f0fe] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Square className="w-5 h-5 text-[#007AFF]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Surface</p>
                      <p className="font-semibold text-slate-900">{property.surface}m²</p>
                    </div>
                  </div>

                  {property.floor !== null && property.floor !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#e8f0fe] rounded-xl flex items-center justify-center flex-shrink-0">
                        <HomeIcon className="w-5 h-5 text-[#007AFF]" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Étage</p>
                        <p className="font-semibold text-slate-900">{property.floor}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e8f0fe] rounded-xl flex items-center justify-center flex-shrink-0">
                      {property.furnished ? (
                        <Check className="w-5 h-5 text-[#007AFF]" />
                      ) : (
                        <X className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Meublé</p>
                      <p className="font-semibold text-slate-900">{property.furnished ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6 pt-5 border-t border-[#d2d2d7]">
                  <h3 className="font-semibold text-slate-900 mb-3 text-sm">Équipements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      {property.hasParking ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-600">Parking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {property.hasBalcony ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-600">Balcon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {property.hasElevator ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-600">Ascenseur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {property.hasGarden ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-600">Jardin</span>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-[#d2d2d7]">
                    <h3 className="font-semibold text-slate-900 mb-3 text-sm">Autres équipements</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => {
                        const amenityConfig = AMENITIES.find((a) => a.value === amenity)
                        return amenityConfig ? (
                          <span
                            key={amenity}
                            className="px-3 py-1 bg-[#f5f5f7] border border-[#d2d2d7] text-slate-600 rounded-full text-xs font-medium"
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
              <div style={cardStyle} className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Localisation</h2>
                <PropertyMap
                  address={property.address}
                  city={property.city}
                  postalCode={property.postalCode}
                  latitude={property.latitude ?? undefined}
                  longitude={property.longitude ?? undefined}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contact Card */}
              <div style={{ ...cardStyle, position: 'sticky', top: '96px' }} className="p-6">
                <h2 className="text-base font-bold text-slate-900 mb-4">Intéressé par ce bien ?</h2>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Loyer mensuel</span>
                    <span className="text-xl font-extrabold text-[#007AFF]">{property.price}€</span>
                  </div>
                  {property.charges && property.charges > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Charges</span>
                      <span className="font-semibold text-slate-900">{property.charges}€</span>
                    </div>
                  )}
                  {property.deposit && property.deposit > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Dépôt de garantie</span>
                      <span className="font-semibold text-slate-900">{property.deposit}€</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#d2d2d7] flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">Total mensuel</span>
                    <span className="text-xl font-extrabold text-slate-900">
                      {property.price + (property.charges || 0)}€
                    </span>
                  </div>
                </div>

                {/* Smart CTA */}
                {!isAuthenticated ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#007AFF] text-white font-semibold text-sm hover:bg-[#0066d6] transition-colors mb-3"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    Postuler à cette annonce
                  </button>
                ) : user?.role === 'TENANT' ? (
                  <>
                    {myApplication?.status === 'APPROVED' ? (
                      <button
                        onClick={() => setShowBookingModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#007AFF] text-white font-semibold text-sm hover:bg-[#0066d6] transition-colors mb-3"
                      >
                        <Calendar className="w-4 h-4" />
                        Réserver une visite
                      </button>
                    ) : myApplication?.status === 'PENDING' ? (
                      <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium py-3 mb-3">
                        <Clock className="w-4 h-4" />
                        Candidature en cours d'examen
                      </div>
                    ) : myApplication?.status === 'REJECTED' ? (
                      <div className="w-full rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium p-3 mb-3 text-center">
                        Candidature non retenue
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPreQualModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#007AFF] text-white font-semibold text-sm hover:bg-[#0066d6] transition-colors mb-3"
                      >
                        <SendHorizonal className="w-4 h-4" />
                        Postuler à cette annonce
                      </button>
                    )}
                  </>
                ) : user?.role === 'OWNER' ? (
                  <div className="w-full text-center text-xs text-slate-500 py-2 mb-3">
                    Votre annonce — candidatures via le tableau de bord
                  </div>
                ) : null}

                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-[#d2d2d7] text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contacter le propriétaire
                </button>

                <p className="text-xs text-slate-400 text-center mt-3">
                  Réponse généralement sous 24h
                </p>
              </div>

              {/* Info Card */}
              <div style={{ background: '#e8f0fe', border: '1px solid #aacfff', borderRadius: '1rem' }} className="p-5">
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">Bon a savoir</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
                    Contact direct avec le proprietaire
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
                    Aucun frais d'agence
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
                    Visite possible rapidement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
                    Reponse rapide garantie
                  </li>
                </ul>
              </div>

              {/* Published Date */}
              <div style={cardStyle} className="p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
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
            navigate('/my-bookings')
          }}
        />

        {/* Pre-Qualification Modal */}
        {showPreQualModal && (
          <PreQualificationModal
            propertyId={property.id}
            propertyTitle={property.title}
            propertyPrice={property.price}
            criteria={property.selectionCriteria ?? DEFAULT_CRITERIA}
            tenantProfileMeta={(user?.profileMeta as Record<string, unknown>) ?? null}
            tenantDocCategories={docCategories}
            onClose={() => setShowPreQualModal(false)}
            onSuccess={() => {
              setShowPreQualModal(false)
              setMyApplication({ id: '', propertyId: property.id, tenantId: user?.id ?? '', status: 'PENDING', score: 0, matchDetails: null, coverLetter: null, hasGuarantor: false, guarantorType: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
            }}
          />
        )}
      </div>
    </Layout>
  )
}
