import { useEffect, useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
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
  Calculator,
  Printer,
  Flag,
} from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { useFavoriteStore } from '../../store/favoriteStore'
import { ContactModal } from '../../components/property/ContactModal'
import { PropertyMap } from '../../components/property/PropertyMap'
import { PreQualificationModal } from '../../components/application/PreQualificationModal'
import { BookingModal } from '../../components/booking/BookingModal'
import { AuthGateModal } from '../../components/auth/AuthGateModal'
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
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [pendingAction, setPendingAction] = useState<'apply' | 'contact' | 'book' | 'favorite' | null>(null)
  const [simApport, setSimApport] = useState(20000)
  const [simRate, setSimRate] = useState(4.0)
  const [simInsurance, setSimInsurance] = useState(0.1)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)

  const openAuthGate = (action: typeof pendingAction) => {
    setPendingAction(action)
    setShowAuthGate(true)
  }

  const handleAuthSuccess = () => {
    setShowAuthGate(false)
    if (pendingAction === 'apply') setShowPreQualModal(true)
    if (pendingAction === 'contact') setShowContactModal(true)
    if (pendingAction === 'book') setShowBookingModal(true)
    setPendingAction(null)
  }

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
      openAuthGate('favorite')
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `https://bailio.fr/property/${property.id}`,
    ...(property.images?.[0] ? { image: property.images[0] } : {}),
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'EUR',
      priceSpecification: { '@type': 'UnitPriceSpecification', unitText: 'MON' },
    },
    address: { '@type': 'PostalAddress', addressLocality: property.city, addressCountry: 'FR' },
    numberOfRooms: property.bedrooms,
    ...(property.surface ? { floorSize: { '@type': 'QuantitativeValue', value: property.surface, unitCode: 'MTK' } } : {}),
  }
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
        <div className="pdp-main-container container mx-auto px-4 py-8">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 mb-5 transition-opacity hover:opacity-70"
            style={{ fontFamily: M.body, fontSize: 13, fontWeight: 500, color: M.inkMid, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>

          {/* Hero Hyperbeat — image bg + overlay sombre + glass KPIs */}
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 20, minHeight: 200 }}>
            {/* Image de fond */}
            {images[0] && images[0] !== '/placeholder-property.jpg' ? (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: '#0a0d1a' }} />
            )}
            {/* Overlay sombre */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(10,13,26,0.90) 0%, rgba(10,13,26,0.72) 60%, rgba(10,13,26,0.55) 100%)' }} />
            {/* Contenu du hero */}
            <div style={{ position: 'relative', padding: 'clamp(28px,5vw,48px) clamp(20px,4vw,40px) clamp(20px,4vw,36px)' }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 8px' }}>
                {propertyType?.label ?? 'Location'}
              </p>
              <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,5vw,40px)', color: '#ffffff', margin: '0 0 8px', lineHeight: 1.1 }}>
                {property.title}
              </h1>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
                {property.city}{property.postalCode ? `, ${property.postalCode}` : ''}
              </p>
              {/* Glass KPIs — no duplicates */}
              <div className="flex flex-wrap gap-3" style={{ marginTop: 20 }}>
                {[
                  { label: 'LOYER', value: `${Number(property.price).toLocaleString('fr-FR')} €/mois` },
                  { label: 'SURFACE', value: `${property.surface} m²` },
                  { label: 'PIÈCES', value: `${property.bedrooms} pièce${property.bedrooms > 1 ? 's' : ''}` },
                  ...(property.furnished ? [{ label: 'TYPE', value: 'Meublé' }] : []),
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 16px' }}>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.50)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>{kpi.label}</p>
                    <p style={{ fontFamily: BAI.fontDisplay, fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1.1 }}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 640px) {
              .pdp-gallery-grid { grid-template-columns: 1fr !important; grid-template-rows: auto !important; }
              .pdp-gallery-thumbs { display: none !important; }
              .pdp-gallery-main { grid-row: auto !important; aspect-ratio: 16/9; }
              .pdp-mobile-cta-bar { display: flex !important; }
              .pdp-sidebar { display: none !important; }
              .pdp-main-container { padding-bottom: 88px !important; }
            }
          `}</style>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-5">

              {/* Image Gallery — SeLoger-style grid */}
              <div style={{ borderRadius: 12, overflow: 'hidden', background: M.muted, position: 'relative' }}>
                {images.length === 1 ? (
                  /* Single image: full width */
                  <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                    <img src={images[0]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  </div>
                ) : (
                  /* Multi-image: main + grid (2-col desktop, single col mobile) */
                  <div className="pdp-gallery-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '200px 200px', gap: 3 }}>
                    {/* Main photo spans both rows on desktop, full width on mobile */}
                    <div
                      className="pdp-gallery-main"
                      style={{ gridRow: '1 / 3', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                      onClick={() => setSelectedImage(0)}
                    >
                      <img
                        src={images[selectedImage]}
                        alt={property.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                      {/* Nav arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedImage(prev => (prev - 1 + images.length) % images.length) }}
                            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                          >
                            <ChevronLeft style={{ width: 16, height: 16, color: M.ink }} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedImage(prev => (prev + 1) % images.length) }}
                            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                          >
                            <ChevronRight style={{ width: 16, height: 16, color: M.ink }} />
                          </button>
                        </>
                      )}
                      {/* Counter */}
                      <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(13,12,10,0.55)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#fff', fontFamily: M.body, fontWeight: 500 }}>
                        {selectedImage + 1} / {images.length}
                      </div>
                    </div>
                    {/* Side thumbnails — up to 4, hidden on mobile */}
                    {images.slice(1, 5).map((img, i) => (
                      <div
                        key={i}
                        className="pdp-gallery-thumbs"
                        onClick={() => setSelectedImage(i + 1)}
                        style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                      >
                        <img
                          src={img}
                          alt={`Photo ${i + 2}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', opacity: selectedImage === i + 1 ? 1 : 0.85 }}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                        {/* Last thumb overlay: "+N photos" */}
                        {i === 3 && images.length > 5 && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,12,10,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontFamily: M.body, fontWeight: 600, fontSize: 15 }}>+{images.length - 5} photos</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons (share + fav) */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={handleShare}
                      style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
                    >
                      <Share2 style={{ width: 15, height: 15, color: M.inkMid }} />
                    </button>
                    {showShareMenu && (
                      <div style={{ position: 'absolute', right: 0, top: 44, width: 160, background: M.surface, border: `1px solid ${M.border}`, borderRadius: 10, padding: 6, boxShadow: '0 4px 16px rgba(13,12,10,0.10)', zIndex: 10 }}>
                        <button onClick={handleCopyLink} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 7, fontSize: 13, color: M.inkMid, background: 'none', border: 'none', cursor: 'pointer', fontFamily: M.body }}>
                          Copier le lien
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleFavoriteToggle}
                    title={isFavorite(id || '') ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
                  >
                    <Heart style={{ width: 15, height: 15, color: isFavorite(id || '') ? '#e11d48' : M.inkMid, fill: isFavorite(id || '') ? '#e11d48' : 'none' }} />
                  </button>
                </div>
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
                        fontFamily: M.display,
                        fontStyle: 'italic',
                        fontSize: '28px',
                        fontWeight: 700,
                        color: M.ink,
                        lineHeight: 1.2,
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
                <div className="flex items-baseline gap-1 mt-2" style={{ flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: M.display,
                      fontStyle: 'italic',
                      fontSize: 'clamp(28px, 7vw, 38px)',
                      fontWeight: 700,
                      color: M.caramel,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {Number(property.price).toLocaleString('fr-FR')} €
                  </span>
                  <span style={{ fontFamily: M.body, fontSize: '14px', color: M.inkFaint, whiteSpace: 'nowrap' }}>
                    / mois
                  </span>
                  {property.charges && property.charges > 0 && (
                    <span style={{ fontFamily: M.body, fontSize: '13px', color: M.inkFaint, whiteSpace: 'nowrap', marginLeft: 4 }}>
                      + {Number(property.charges).toLocaleString('fr-FR')} € ch.
                    </span>
                  )}
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

              {/* Simulation de financement — inspiré PAP */}
              <div style={cardStyle} className="p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-4 h-4" style={{ color: M.caramel }} />
                  <p style={{ ...sectionLabel, marginBottom: 0 }}>Simulation de financement</p>
                </div>
                <p style={{ fontFamily: M.body, fontSize: 12, color: M.inkFaint, margin: '4px 0 0' }}>
                  Estimation si vous souhaitez acquérir un bien similaire
                </p>
                <div style={{ borderTop: `1px solid ${M.border}`, margin: '16px 0' }} />

                {(() => {
                  const estValue = Math.round(property.price * 200)
                  const fraisNotaire = Math.round(estValue * 0.08)
                  const emprunt = Math.max(0, estValue + fraisNotaire - simApport)

                  const calcMensualite = (annees: number) => {
                    const n = annees * 12
                    const r = simRate / 100 / 12
                    const ra = simInsurance / 100 / 12
                    if (r === 0 && ra === 0) return emprunt / n
                    const mCredit = r > 0 ? emprunt * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : emprunt / n
                    return mCredit + emprunt * ra
                  }

                  return (
                    <>
                      {/* Prix estimé + frais notaire */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div style={{ background: M.muted, borderRadius: 10, padding: '12px 14px' }}>
                          <p style={{ fontFamily: M.body, fontSize: 11, color: M.inkFaint, margin: '0 0 2px' }}>Prix estimé du bien</p>
                          <p style={{ fontFamily: M.display, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: M.ink, margin: 0 }}>
                            {estValue.toLocaleString('fr-FR')} €
                          </p>
                          <p style={{ fontFamily: M.body, fontSize: 10, color: M.inkFaint, margin: '2px 0 0' }}>loyer × 200</p>
                        </div>
                        <div style={{ background: M.muted, borderRadius: 10, padding: '12px 14px' }}>
                          <p style={{ fontFamily: M.body, fontSize: 11, color: M.inkFaint, margin: '0 0 2px' }}>Frais de notaire (~8%)</p>
                          <p style={{ fontFamily: M.display, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: M.ink, margin: 0 }}>
                            {fraisNotaire.toLocaleString('fr-FR')} €
                          </p>
                          <p style={{ fontFamily: M.body, fontSize: 10, color: M.inkFaint, margin: '2px 0 0' }}>estimation ancien</p>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                          <label style={{ fontFamily: M.body, fontSize: 11, color: M.inkMid, display: 'block', marginBottom: 4 }}>Apport (€)</label>
                          <input
                            type="number"
                            value={simApport}
                            min={0}
                            onChange={e => setSimApport(Math.max(0, Number(e.target.value)))}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${M.border}`, background: M.inputBg, fontFamily: M.body, fontSize: 13, color: M.ink, outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontFamily: M.body, fontSize: 11, color: M.inkMid, display: 'block', marginBottom: 4 }}>Taux crédit (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            max={20}
                            value={simRate}
                            onChange={e => setSimRate(Math.max(0, Number(e.target.value)))}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${M.border}`, background: M.inputBg, fontFamily: M.body, fontSize: 13, color: M.ink, outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontFamily: M.body, fontSize: 11, color: M.inkMid, display: 'block', marginBottom: 4 }}>Assurance (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            max={2}
                            value={simInsurance}
                            onChange={e => setSimInsurance(Math.max(0, Number(e.target.value)))}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${M.border}`, background: M.inputBg, fontFamily: M.body, fontSize: 13, color: M.ink, outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      {/* Montant emprunté */}
                      <div style={{ background: M.caramelLight, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: M.body, fontSize: 13, color: M.inkMid }}>Montant emprunté</span>
                        <span style={{ fontFamily: M.display, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: M.caramel }}>
                          {emprunt.toLocaleString('fr-FR')} €
                        </span>
                      </div>

                      {/* Table durées */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: M.body, fontSize: 13 }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px 12px', color: M.inkFaint, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${M.border}` }}>Durée</th>
                              <th style={{ textAlign: 'right', padding: '8px 12px', color: M.inkFaint, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${M.border}` }}>Mensualité</th>
                              <th style={{ textAlign: 'right', padding: '8px 12px', color: M.inkFaint, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${M.border}` }}>Coût de l'emprunt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[10, 15, 20, 25, 30].map((annees, i) => {
                              const mensualite = calcMensualite(annees)
                              const coutTotal = Math.max(0, mensualite * annees * 12 - emprunt)
                              return (
                                <tr key={annees} style={{ background: i % 2 === 0 ? 'transparent' : M.muted }}>
                                  <td style={{ padding: '10px 12px', color: M.ink, fontWeight: 600 }}>{annees} ans</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: M.caramel, fontFamily: M.display, fontStyle: 'italic', fontSize: 16, fontWeight: 700 }}>
                                    {Math.round(mensualite).toLocaleString('fr-FR')} €/mois
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: M.inkMid }}>
                                    {Math.round(coutTotal).toLocaleString('fr-FR')} €
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      <p style={{ fontFamily: M.body, fontSize: 11, color: M.inkFaint, margin: '12px 0 0', lineHeight: 1.5 }}>
                        * Simulation indicative hors frais annexes. Taux non contractuels.
                      </p>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <Link
                          to="/search"
                          style={{ fontFamily: M.body, fontSize: 13, fontWeight: 600, color: M.caramel, textDecoration: 'none' }}
                        >
                          Affiner ma simulation →
                        </Link>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Actions PAP-style — imprimer, partager, signaler */}
              <div className="flex flex-wrap gap-2 pb-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2"
                  style={{ fontFamily: M.body, fontSize: 12, fontWeight: 500, color: M.inkMid, background: M.muted, border: `1px solid ${M.border}`, borderRadius: 8, cursor: 'pointer' }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer la fiche
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2"
                  style={{ fontFamily: M.body, fontSize: 12, fontWeight: 500, color: M.inkMid, background: M.muted, border: `1px solid ${M.border}`, borderRadius: 8, cursor: 'pointer' }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Envoyer à un ami
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2"
                  style={{ fontFamily: M.body, fontSize: 12, fontWeight: 500, color: M.inkFaint, background: 'transparent', border: `1px solid ${M.border}`, borderRadius: 8, cursor: 'pointer' }}
                >
                  <Flag className="w-3.5 h-3.5" />
                  Signaler un abus
                </button>
              </div>
            </div>

            {/* Sidebar — masquée sur mobile, remplacée par la barre sticky en bas */}
            <div className="pdp-sidebar space-y-4">

              {/* Sticky Contact / CTA Card */}
              <div style={{ ...cardStyle, position: 'sticky', top: '96px' }} className="p-6">

                {/* Price header */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      style={{
                        fontFamily: M.display,
                        fontStyle: 'italic',
                        fontSize: '32px',
                        fontWeight: 700,
                        color: M.caramel,
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
                    onClick={() => openAuthGate('apply')}
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
                  onClick={() => isAuthenticated ? setShowContactModal(true) : openAuthGate('contact')}
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

      {/* ── Barre CTA sticky mobile (visible uniquement sur mobile via CSS) ── */}
      <div
        className="pdp-mobile-cta-bar"
        style={{
          display: 'none', // overridé par @media max-width:640px { display: flex }
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
          background: 'rgba(252,251,249,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: `1px solid ${M.border}`,
          padding: 'clamp(12px,3vw,16px) clamp(12px,4vw,20px)',
          paddingBottom: 'calc(clamp(12px,3vw,16px) + env(safe-area-inset-bottom, 0px))',
          alignItems: 'center', gap: 12,
          boxShadow: '0 -4px 20px rgba(13,12,10,0.08)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: M.display, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: M.caramel, lineHeight: 1 }}>
            {Number(property.price).toLocaleString('fr-FR')} €
          </div>
          <div style={{ fontFamily: M.body, fontSize: 12, color: M.inkFaint }}>/ mois CC</div>
        </div>
        <button
          onClick={() => isAuthenticated ? (user?.role === 'TENANT' ? setShowPreQualModal(true) : undefined) : openAuthGate('apply')}
          style={{
            flexShrink: 0,
            background: M.tenant,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '13px 20px',
            fontFamily: M.body,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 12px rgba(27,94,59,0.30)',
          }}
        >
          <SendHorizonal style={{ width: 15, height: 15 }} />
          Postuler
        </button>
        <button
          onClick={() => isAuthenticated ? setShowContactModal(true) : openAuthGate('contact')}
          style={{
            flexShrink: 0,
            background: M.surface,
            color: M.ink,
            border: `1px solid ${M.border}`,
            borderRadius: 10,
            padding: '13px 14px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <MessageSquare style={{ width: 16, height: 16 }} />
        </button>
      </div>

      </div>

      {/* Auth Gate Modal — affiché quand un visiteur non connecté clique sur une action */}
      <AuthGateModal
        isOpen={showAuthGate}
        onClose={() => { setShowAuthGate(false); setPendingAction(null) }}
        onSuccess={handleAuthSuccess}
        prompt={
          pendingAction === 'apply' ? 'Créez un compte gratuit pour postuler à cette annonce.'
          : pendingAction === 'contact' ? 'Créez un compte gratuit pour contacter le propriétaire.'
          : pendingAction === 'book' ? 'Créez un compte gratuit pour réserver une visite.'
          : 'Créez un compte pour accéder à toutes les fonctionnalités.'
        }
      />

      {/* Modal Signalement */}
      {showReportModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => { setShowReportModal(false); setReportSent(false); setReportReason('') }}
        >
          <div
            style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(13,12,10,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            {!reportSent ? (
              <>
                <h3 style={{ fontFamily: M.display, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: M.ink, margin: '0 0 6px' }}>Signaler une annonce</h3>
                <p style={{ fontFamily: M.body, fontSize: 13, color: M.inkMid, margin: '0 0 18px' }}>
                  Décrivez le problème rencontré avec cette annonce.
                </p>
                <div className="space-y-3">
                  {['Annonce frauduleuse', 'Photos erronées', 'Prix inexact', 'Bien déjà loué', 'Autre'].map(reason => (
                    <label key={reason} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="report-reason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        style={{ accentColor: M.caramel, width: 16, height: 16 }}
                      />
                      <span style={{ fontFamily: M.body, fontSize: 14, color: M.inkMid }}>{reason}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setShowReportModal(false); setReportReason('') }}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${M.border}`, background: 'transparent', fontFamily: M.body, fontSize: 14, fontWeight: 500, color: M.inkMid, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => { if (reportReason) setReportSent(true) }}
                    disabled={!reportReason}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: reportReason ? M.night : M.muted, fontFamily: M.body, fontSize: 14, fontWeight: 600, color: reportReason ? '#fff' : M.inkFaint, cursor: reportReason ? 'pointer' : 'not-allowed' }}
                  >
                    Envoyer
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: M.tenant }} />
                <h3 style={{ fontFamily: M.display, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: M.ink, margin: '0 0 8px' }}>Signalement envoyé</h3>
                <p style={{ fontFamily: M.body, fontSize: 14, color: M.inkMid, margin: '0 0 20px' }}>
                  Merci, notre équipe examinera cette annonce sous 48h.
                </p>
                <button
                  onClick={() => { setShowReportModal(false); setReportSent(false); setReportReason('') }}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: M.night, fontFamily: M.body, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </Layout>
  )
}
