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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteStore } from '../../store/favoriteStore'
import { ContactModal } from '../../components/property/ContactModal'
import { PropertyMap } from '../../components/property/PropertyMap'
import { PreQualificationModal } from '../../components/application/PreQualificationModal'
import { BookingModal } from '../../components/booking/BookingModal'
import { PROPERTY_TYPES, AMENITIES } from '../../types/property.types'
import { Layout } from '../../components/layout/Layout'
import { applicationService } from '../../services/application.service'
import { dossierService } from '../../services/dossier.service'
import type { Application } from '../../types/application.types'
import { DEFAULT_CRITERIA } from '../../types/application.types'

const M = {
  bg: '#fafaf8',
  surface: '#ffffff',
  muted: '#f4f2ee',
  inputBg: '#f8f7f4',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  caramel: '#c4976a',
  caramelLight: '#fdf5ec',
  tenant: '#1b5e3b',
  tenantLight: '#edf7f2',
  tenantBorder: '#9fd4ba',
  owner: '#1a3270',
  ownerLight: '#eaf0fb',
  border: '#e4e1db',
  borderMid: '#ccc9c3',
  danger: '#9b1c1c',
  dangerBg: '#fef2f2',
  warning: '#92400e',
  warningBg: '#fdf5ec',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

export default function PropertyDetailsPublic() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { currentProperty, fetchPropertyById, isLoading, error } = useProperties()
  const { isFavorite, toggleFavorite, loadFavorites } = useFavoriteStore()

  const [selectedImage, setSelectedImage] = useState(0)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showPreQualModal, setShowPreQualModal] = useState(false)
  const [myApplication, setMyApplication] = useState<Application | null | undefined>(undefined)
  const REQUIRED_DOC_CATEGORIES = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE']
  const [docCategories, setDocCategories] = useState<string[]>([])
  const dossierComplete = REQUIRED_DOC_CATEGORIES.every(c => docCategories.includes(c))
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPropertyById(id, true)
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites()
    }
  }, [isAuthenticated, loadFavorites])

  useEffect(() => {
    if (!isAuthenticated || !id || user?.role !== 'TENANT') return
    Promise.all([
      applicationService.list(id).then((apps) => {
        const mine = apps.find((a) => a.tenantId === user?.id && a.propertyId === id)
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
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ background: M.bg, fontFamily: M.body }}
        >
          <div
            className="animate-spin rounded-full h-10 w-10"
            style={{ borderBottom: `2px solid ${M.tenant}` }}
          />
        </div>
      </Layout>
    )
  }

  if (!currentProperty) {
    return (
      <Layout>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: M.bg, fontFamily: M.body }}
        >
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: M.ownerLight }}
            >
              <HomeIcon className="w-8 h-8" style={{ color: M.owner }} />
            </div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: M.ink, fontFamily: M.body }}
            >
              Propriété introuvable
            </h2>
            <Link
              to="/search"
              className="text-sm font-medium"
              style={{ color: M.tenant }}
            >
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

  const cardStyle: React.CSSProperties = {
    background: M.surface,
    border: `1px solid ${M.border}`,
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily: M.body,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: M.inkFaint,
    marginBottom: '12px',
  }

  return (
    <Layout>
      <div style={{ background: M.bg, fontFamily: M.body }} className="min-h-screen">

        {/* Error Message */}
        {error && (
          <div className="container mx-auto px-4 pt-4">
            <div
              className="p-4 flex items-start gap-3 rounded-xl"
              style={{ background: M.dangerBg, border: `1px solid ${M.danger}30` }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: M.danger }} />
              <p className="text-sm" style={{ color: M.danger }}>{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 mb-5 transition-opacity hover:opacity-70"
            style={{ fontFamily: M.body, fontSize: 13, fontWeight: 500, color: M.inkMid, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-5">

              {/* Image Gallery */}
              <div style={{ ...cardStyle, overflow: 'hidden' }}>
                <div className="relative" style={{ aspectRatio: '16/9', background: M.muted }}>
                  <img
                    src={images[selectedImage]}
                    alt={`${property.title} - Image ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />

                  {/* Prev / Next arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: M.surface, border: `1px solid ${M.border}` }}
                      >
                        <ChevronLeft className="w-4 h-4" style={{ color: M.ink }} />
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: M.surface, border: `1px solid ${M.border}` }}
                      >
                        <ChevronRight className="w-4 h-4" style={{ color: M.ink }} />
                      </button>
                    </>
                  )}

                  {/* Image counter pill */}
                  <div
                    className="absolute bottom-3 right-3 text-white text-xs px-3 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(13,12,10,0.60)', fontFamily: M.body }}
                  >
                    {selectedImage + 1} / {images.length}
                  </div>

                  {/* Action Buttons Overlay */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="relative">
                      <button
                        onClick={handleShare}
                        className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: M.surface, border: `1px solid ${M.border}` }}
                      >
                        <Share2 className="w-4 h-4" style={{ color: M.inkMid }} />
                      </button>

                      {showShareMenu && (
                        <div
                          className="absolute right-0 mt-2 w-48 p-2 z-10 rounded-xl"
                          style={{ background: M.surface, border: `1px solid ${M.border}`, boxShadow: '0 4px 16px rgba(13,12,10,0.10)' }}
                        >
                          <button
                            onClick={handleCopyLink}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                            style={{ color: M.inkMid }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            Copier le lien
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleFavoriteToggle}
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                      style={{ background: M.surface, border: `1px solid ${M.border}` }}
                      title={isFavorite(id || '') ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart
                        className="w-4 h-4 transition-colors"
                        style={{
                          color: isFavorite(id || '') ? '#e53e3e' : M.inkMid,
                          fill: isFavorite(id || '') ? '#e53e3e' : 'none',
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="p-4 grid grid-cols-6 gap-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className="aspect-square overflow-hidden transition-all"
                        style={{
                          borderRadius: '8px',
                          border: selectedImage === index
                            ? `2px solid ${M.night}`
                            : `1px solid ${M.border}`,
                          outline: selectedImage === index ? `3px solid ${M.night}20` : 'none',
                          outlineOffset: '1px',
                        }}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title, Type & Price */}
              <div style={cardStyle} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Property type badge */}
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3"
                      style={{
                        background: M.ownerLight,
                        color: M.owner,
                        fontFamily: M.body,
                      }}
                    >
                      {propertyType?.label}
                    </span>

                    {/* Title */}
                    <h1
                      className="mb-2"
                      style={{
                        fontFamily: M.body,
                        fontSize: '20px',
                        fontWeight: 600,
                        color: M.ink,
                        lineHeight: 1.3,
                      }}
                    >
                      {property.title}
                    </h1>

                    {/* Location */}
                    <div className="flex items-center gap-1.5" style={{ color: M.inkFaint }}>
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span style={{ fontFamily: M.body, fontSize: '13px' }}>
                        {property.city}, {property.postalCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mt-2" style={{ flexWrap: 'nowrap' }}>
                  <span
                    style={{
                      fontFamily: M.display,
                      fontSize: '36px',
                      fontWeight: 700,
                      color: M.ink,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {Number(property.price).toLocaleString('fr-FR')} €
                  </span>
                  <span style={{ fontFamily: M.body, fontSize: '14px', color: M.inkFaint, whiteSpace: 'nowrap' }}>
                    / mois
                  </span>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{ background: M.muted, color: M.inkMid, fontFamily: M.body, fontSize: '13px' }}
                  >
                    <Bed className="w-3.5 h-3.5" />
                    {property.bedrooms} chambre{property.bedrooms > 1 ? 's' : ''}
                  </span>
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{ background: M.muted, color: M.inkMid, fontFamily: M.body, fontSize: '13px' }}
                  >
                    <Bath className="w-3.5 h-3.5" />
                    {property.bathrooms} sdb
                  </span>
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{ background: M.muted, color: M.inkMid, fontFamily: M.body, fontSize: '13px' }}
                  >
                    <Square className="w-3.5 h-3.5" />
                    {property.surface} m²
                  </span>
                  {property.furnished && (
                    <span
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                      style={{ background: M.tenantLight, color: M.tenant, fontFamily: M.body, fontSize: '13px', border: `1px solid ${M.tenantBorder}` }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Meublé
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={cardStyle} className="p-6">
                <p style={sectionLabel}>Description</p>
                <div style={{ borderTop: `1px solid ${M.border}`, marginBottom: '16px' }} />
                <p
                  className="whitespace-pre-line"
                  style={{
                    fontFamily: M.body,
                    fontSize: '15px',
                    color: M.inkMid,
                    lineHeight: 1.7,
                  }}
                >
                  {property.description}
                </p>
              </div>

              {/* Characteristics */}
              <div style={cardStyle} className="p-6">
                <p style={sectionLabel}>Caractéristiques</p>
                <div style={{ borderTop: `1px solid ${M.border}`, marginBottom: '20px' }} />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: M.muted }}
                    >
                      <Bed className="w-5 h-5" style={{ color: M.inkMid }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint }}>Chambres</p>
                      <p style={{ fontFamily: M.body, fontWeight: 600, color: M.ink }}>{property.bedrooms}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: M.muted }}
                    >
                      <Bath className="w-5 h-5" style={{ color: M.inkMid }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint }}>Salles de bain</p>
                      <p style={{ fontFamily: M.body, fontWeight: 600, color: M.ink }}>{property.bathrooms}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: M.muted }}
                    >
                      <Square className="w-5 h-5" style={{ color: M.inkMid }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint }}>Surface</p>
                      <p style={{ fontFamily: M.body, fontWeight: 600, color: M.ink }}>{property.surface} m²</p>
                    </div>
                  </div>

                  {property.floor !== null && property.floor !== undefined && (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: M.muted }}
                      >
                        <HomeIcon className="w-5 h-5" style={{ color: M.inkMid }} />
                      </div>
                      <div>
                        <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint }}>Étage</p>
                        <p style={{ fontFamily: M.body, fontWeight: 600, color: M.ink }}>{property.floor}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: M.muted }}
                    >
                      {property.furnished ? (
                        <Check className="w-5 h-5" style={{ color: M.tenant }} />
                      ) : (
                        <X className="w-5 h-5" style={{ color: M.inkFaint }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint }}>Meublé</p>
                      <p style={{ fontFamily: M.body, fontWeight: 600, color: M.ink }}>
                        {property.furnished ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div
                  className="mt-6 pt-5"
                  style={{ borderTop: `1px solid ${M.border}` }}
                >
                  <p style={sectionLabel}>Équipements</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { flag: property.hasParking, label: 'Parking' },
                      { flag: property.hasBalcony, label: 'Balcon' },
                      { flag: property.hasElevator, label: 'Ascenseur' },
                      { flag: property.hasGarden, label: 'Jardin' },
                    ].map(({ flag, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        {flag ? (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: M.tenant }} />
                        ) : (
                          <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: M.borderMid }} />
                        )}
                        <span style={{ fontFamily: M.body, fontSize: '14px', color: flag ? M.inkMid : M.inkFaint }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div
                    className="mt-5 pt-5"
                    style={{ borderTop: `1px solid ${M.border}` }}
                  >
                    <p style={sectionLabel}>Autres équipements</p>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => {
                        const amenityConfig = AMENITIES.find((a) => a.value === amenity)
                        return amenityConfig ? (
                          <span
                            key={amenity}
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: M.muted,
                              border: `1px solid ${M.border}`,
                              color: M.inkMid,
                              fontFamily: M.body,
                            }}
                          >
                            {amenityConfig.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Trust section */}
              <div
                className="p-5 rounded-xl"
                style={{
                  background: M.tenantLight,
                  border: `1px solid ${M.tenantBorder}`,
                  borderLeftWidth: '3px',
                }}
              >
                <p
                  className="mb-3"
                  style={{ fontFamily: M.body, fontSize: '13px', fontWeight: 600, color: M.tenant }}
                >
                  Bon à savoir
                </p>
                <ul className="space-y-2">
                  {[
                    'Contact direct avec le propriétaire',
                    'Aucun frais d\'agence',
                    'Visite possible rapidement',
                    'Réponse rapide garantie',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: M.tenant }} />
                      <span style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Location */}
              <div style={cardStyle} className="p-6">
                <p style={sectionLabel}>Localisation</p>
                <div style={{ borderTop: `1px solid ${M.border}`, marginBottom: '16px' }} />
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

              {/* Sticky Contact / CTA Card */}
              <div style={{ ...cardStyle, position: 'sticky', top: '96px' }} className="p-6">

                {/* Price header */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      style={{
                        fontFamily: M.display,
                        fontSize: '32px',
                        fontWeight: 700,
                        color: M.ink,
                        lineHeight: 1,
                      }}
                    >
                      {Number(property.price).toLocaleString('fr-FR')} €
                    </span>
                    <span style={{ fontFamily: M.body, fontSize: '13px', color: M.inkFaint, whiteSpace: 'nowrap' }}>/ mois</span>
                  </div>
                  {property.charges && property.charges > 0 && (
                    <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint, marginTop: '4px' }}>
                      + {property.charges}€ charges
                    </p>
                  )}
                </div>

                {/* Financial breakdown */}
                <div
                  className="rounded-lg p-4 mb-5 space-y-2"
                  style={{ background: M.muted }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: M.body, fontSize: '13px', color: M.inkMid }}>Loyer mensuel</span>
                    <span style={{ fontFamily: M.body, fontSize: '14px', fontWeight: 600, color: M.ink }}>
                      {property.price}€
                    </span>
                  </div>
                  {property.charges && property.charges > 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: M.body, fontSize: '13px', color: M.inkMid }}>Charges</span>
                      <span style={{ fontFamily: M.body, fontSize: '14px', fontWeight: 600, color: M.ink }}>
                        {property.charges}€
                      </span>
                    </div>
                  )}
                  {property.deposit && property.deposit > 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: M.body, fontSize: '13px', color: M.inkMid }}>Dépôt de garantie</span>
                      <span style={{ fontFamily: M.body, fontSize: '14px', fontWeight: 600, color: M.ink }}>
                        {property.deposit}€
                      </span>
                    </div>
                  )}
                  <div
                    className="pt-2 flex items-center justify-between"
                    style={{ borderTop: `1px solid ${M.border}` }}
                  >
                    <span style={{ fontFamily: M.body, fontSize: '13px', fontWeight: 600, color: M.ink }}>
                      Total mensuel
                    </span>
                    <span
                      style={{
                        fontFamily: M.display,
                        fontSize: '20px',
                        fontWeight: 700,
                        color: M.ink,
                      }}
                    >
                      {property.price + (property.charges || 0)}€
                    </span>
                  </div>
                </div>

                {/* Smart CTA */}
                {!isAuthenticated ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-3 transition-opacity hover:opacity-90"
                    style={{
                      background: M.tenant,
                      color: '#ffffff',
                      fontFamily: M.body,
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <SendHorizonal className="w-4 h-4" />
                    Postuler à cette annonce
                  </button>
                ) : user?.role === 'TENANT' ? (
                  <>
                    {myApplication?.status === 'APPROVED' ? (
                      <button
                        onClick={() => setShowBookingModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-3 transition-opacity hover:opacity-90"
                        style={{
                          background: M.tenant,
                          color: '#ffffff',
                          fontFamily: M.body,
                          fontSize: '14px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          minHeight: 44,
                        }}
                      >
                        <Calendar className="w-4 h-4" />
                        Réserver une visite
                      </button>
                    ) : myApplication?.status === 'PENDING' ? (
                      <div
                        className="w-full flex items-center justify-center gap-2 rounded-lg py-3 mb-3 text-sm font-medium"
                        style={{
                          background: M.warningBg,
                          border: `1px solid #f6d860`,
                          color: M.warning,
                          fontFamily: M.body,
                        }}
                      >
                        <Clock className="w-4 h-4" />
                        Candidature en cours d'examen
                      </div>
                    ) : myApplication?.status === 'REJECTED' ? (
                      <div
                        className="w-full rounded-lg py-3 mb-3 text-sm font-medium text-center"
                        style={{
                          background: M.dangerBg,
                          border: `1px solid ${M.danger}30`,
                          color: M.danger,
                          fontFamily: M.body,
                        }}
                      >
                        Candidature non retenue
                      </div>
                    ) : dossierComplete ? (
                      <button
                        onClick={() => setShowPreQualModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-3 transition-opacity hover:opacity-90"
                        style={{
                          background: M.tenant,
                          color: '#ffffff',
                          fontFamily: M.body,
                          fontSize: '14px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <SendHorizonal className="w-4 h-4" />
                        Postuler à cette annonce
                      </button>
                    ) : (
                      <div style={{ marginBottom: 12 }}>
                        <div
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2"
                          style={{
                            background: '#f4f2ee',
                            color: '#9e9b96',
                            fontFamily: M.body,
                            fontSize: '14px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: '1px solid #e4e1db',
                            cursor: 'not-allowed',
                          }}
                        >
                          <SendHorizonal className="w-4 h-4" />
                          Postuler à cette annonce
                        </div>
                        <p style={{ fontFamily: M.body, fontSize: 12, color: '#9b1c1c', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                          Dossier locatif incomplet.{' '}
                          <a href="/dossier" style={{ color: '#9b1c1c', fontWeight: 600, textDecoration: 'underline' }}>
                            Complétez-le pour postuler.
                          </a>
                        </p>
                      </div>
                    )}
                  </>
                ) : user?.role === 'OWNER' ? (
                  <div
                    className="w-full text-center text-xs py-2 mb-3"
                    style={{ color: M.inkFaint, fontFamily: M.body }}
                  >
                    Votre annonce — candidatures via le tableau de bord
                  </div>
                ) : null}

                {/* Secondary: contact button */}
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 transition-colors"
                  style={{
                    background: M.surface,
                    border: `1px solid ${M.border}`,
                    color: M.ink,
                    fontFamily: M.body,
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
                >
                  <MessageSquare className="w-4 h-4" style={{ color: M.inkMid }} />
                  Contacter le propriétaire
                </button>

                <p
                  className="text-center mt-3"
                  style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint }}
                >
                  Réponse généralement sous 24h
                </p>
              </div>

              {/* Published Date */}
              <div style={cardStyle} className="p-4">
                <div className="flex items-center gap-2" style={{ color: M.inkFaint }}>
                  <Calendar className="w-4 h-4" />
                  <span style={{ fontFamily: M.body, fontSize: '12px' }}>
                    Publié le {new Date(property.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal — locataire APPROVED */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          propertyId={property.id}
          propertyTitle={property.title}
          visitDuration={property.visitDuration ?? 30}
          onSuccess={() => { setShowBookingModal(false); navigate('/my-bookings') }}
        />

        {/* Contact Modal */}
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          propertyId={property.id}
          propertyTitle={property.title}
          ownerName={property.owner ? `${property.owner.firstName ?? ''} ${property.owner.lastName ?? ''}`.trim() || 'Propriétaire' : 'Propriétaire'}
          ownerId={property.ownerId}
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
            tenantFirstName={user?.firstName ?? undefined}
            tenantLastName={user?.lastName ?? undefined}
            tenantBirthDate={user?.birthDate ?? undefined}
            tenantBirthCity={user?.birthCity ?? undefined}
            tenantNationality={user?.nationality ?? undefined}
            ownerId={property.ownerId}
            onClose={() => setShowPreQualModal(false)}
            onSuccess={() => {
              setShowPreQualModal(false)
              setMyApplication({
                id: '',
                propertyId: property.id,
                tenantId: user?.id ?? '',
                status: 'PENDING',
                score: 0,
                matchDetails: null,
                coverLetter: null,
                hasGuarantor: false,
                guarantorType: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            }}
          />
        )}

      </div>
    </Layout>
  )
}
