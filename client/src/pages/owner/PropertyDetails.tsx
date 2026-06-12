import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Bed,
  Bath,
  Square,
  Home,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  AlertCircle,
  Check,
  X,
  Upload,
  Shield,
  Lock,
} from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { propertyService } from '../../services/property.service'
import { PROPERTY_TYPES, PROPERTY_STATUS, AMENITIES } from '../../types/property.types'
import { Layout } from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'

const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 12,
  boxShadow: BAI.shadowMd,
  padding: 24,
}

const glassBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  borderRadius: 8,
  padding: '8px 16px',
  fontFamily: BAI.fontBody,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
}

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentProperty,
    fetchPropertyById,
    deleteProperty,
    publishProperty,
    isLoading,
    error,
  } = useProperties()

  const [selectedImage, setSelectedImage] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<'ownerIdDocument' | 'propertyProofDocument' | null>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) {
      fetchPropertyById(id, false)
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!currentProperty) return
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${currentProperty.title}" ?`)) return
    setIsDeleting(true)
    try {
      await deleteProperty(currentProperty.id)
      navigate('/properties/owner/me')
    } catch (err) {
      console.error('Delete failed:', err)
      setIsDeleting(false)
    }
  }

  const handlePublish = async () => {
    if (!currentProperty) return
    setIsPublishing(true)
    try {
      await publishProperty(currentProperty.id)
      toast.success('Bien publié avec succès !')
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la publication')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDocUpload = (type: 'ownerIdDocument' | 'propertyProofDocument') => {
    setUploadingDoc(type)
    docInputRef.current?.click()
  }

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingDoc || !currentProperty) return
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés')
      setUploadingDoc(null)
      if (docInputRef.current) docInputRef.current.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5 Mo')
      setUploadingDoc(null)
      if (docInputRef.current) docInputRef.current.value = ''
      return
    }
    try {
      await propertyService.uploadVerificationDocument(currentProperty.id, uploadingDoc, file)
      toast.success('Document téléversé avec succès')
      if (id) fetchPropertyById(id, false)
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du téléchargement')
    } finally {
      setUploadingDoc(null)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ background: BAI.bgBase }}
        >
          <div
            className="animate-spin rounded-full h-10 w-10 border-b-2"
            style={{ borderColor: BAI.owner }}
          />
        </div>
      </Layout>
    )
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!currentProperty) {
    return (
      <Layout>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
        >
          <div className="text-center">
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: 24,
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: 8,
              }}
            >
              Propriété introuvable
            </h2>
            <Link
              to="/properties/owner/me"
              style={{ fontSize: 14, fontWeight: 500, color: BAI.owner, textDecoration: 'none' }}
            >
              Retour à mes propriétés
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const property = currentProperty
  const propertyType = PROPERTY_TYPES.find((t) => t.value === property.type)
  const propertyStatus = PROPERTY_STATUS.find((s) => s.value === property.status)
  const images = property.images.length > 0 ? property.images : ['/placeholder-property.jpg']

  const statusPillStyles: Record<string, React.CSSProperties> = {
    green:  { background: BAI.successLight,  color: BAI.success },
    red:    { background: BAI.errorLight,    color: BAI.error   },
    yellow: { background: BAI.warningLight,  color: BAI.warning },
    amber:  { background: BAI.caramelLight,  color: '#a0622a'   },
    blue:   { background: BAI.ownerLight,    color: BAI.owner   },
    gray:   { background: BAI.bgMuted,       color: BAI.inkMid  },
  }

  const getStatusBadge = (dark = false) => {
    if (!propertyStatus) return null
    if (dark) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: BAI.fontBody,
            padding: '4px 12px',
            borderRadius: 99,
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#fff',
          }}
        >
          {propertyStatus.label}
        </span>
      )
    }
    const style = statusPillStyles[propertyStatus.color] || statusPillStyles['gray']
    return (
      <span
        style={{
          ...style,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: BAI.fontBody,
          padding: '3px 10px',
          borderRadius: 99,
        }}
      >
        {propertyStatus.label}
      </span>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}>

        {/* === DARK HERO === */}
        <div
          style={{
            background: '#0a0d1a',
            padding: 'clamp(36px,5vw,64px) clamp(16px,4vw,48px) clamp(28px,4vw,48px)',
          }}
        >
          {/* Back link */}
          <Link
            to="/properties/owner/me"
            style={{
              fontFamily: BAI.fontBody,
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              marginBottom: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={15} />
            Retour à mes propriétés
          </Link>

          {/* Title row */}
          <div className="flex items-start justify-between flex-wrap gap-4" style={{ marginTop: 4 }}>
            <div>
              <p
                style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: BAI.caramel,
                  margin: '0 0 6px',
                }}
              >
                Détail du bien
              </p>
              <h1
                style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 'clamp(26px,5vw,42px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: '#ffffff',
                  margin: '0 0 10px',
                  lineHeight: 1.1,
                }}
              >
                {property.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(true)}
                <span
                  style={{
                    fontFamily: BAI.fontBody,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {propertyType?.label}
                </span>
              </div>
            </div>

            {/* Action buttons — glass style on dark */}
            <div className="flex gap-2 flex-wrap" style={{ alignSelf: 'flex-start' }}>
              <button
                onClick={() => navigate(`/properties/${property.id}/edit`)}
                style={glassBtn}
              >
                <Edit size={14} />
                Modifier
              </button>
              {property.status === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  style={{ ...glassBtn, opacity: isPublishing ? 0.6 : 1 }}
                >
                  <CheckCircle size={14} />
                  {isPublishing ? 'Publication...' : 'Publier'}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  ...glassBtn,
                  background: 'rgba(155,28,28,0.35)',
                  border: '1px solid rgba(255,100,100,0.3)',
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                <Trash2 size={14} />
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>

          {/* Glass KPI cards */}
          <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 16,
                padding: '16px 24px',
                minWidth: 130,
              }}
            >
              <p
                style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 4px',
                }}
              >
                Loyer
              </p>
              <p
                style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 36,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {property.price} €
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 16,
                padding: '16px 24px',
                minWidth: 130,
              }}
            >
              <p
                style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 4px',
                }}
              >
                Surface
              </p>
              <p
                style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 36,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {property.surface} m²
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 16,
                padding: '16px 24px',
                minWidth: 130,
              }}
            >
              <p
                style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 4px',
                }}
              >
                Type
              </p>
              <p
                style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 28,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {propertyType?.label ?? property.type}
              </p>
            </div>
          </div>
        </div>

        {/* === LIGHT CONTENT === */}
        <div
          style={{
            background: BAI.bgBase,
            padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)',
          }}
        >
          {/* Error Message */}
          {error && (
            <div
              className="flex items-start gap-3 mb-6"
              style={{
                background: BAI.errorLight,
                border: `1px solid #f5c6c6`,
                borderRadius: 10,
                padding: '14px 18px',
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BAI.error }} />
              <p style={{ fontSize: 14, color: '#7f1d1d', fontFamily: BAI.fontBody }}>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Hero image gallery */}
              <div
                style={{
                  ...cardStyle,
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: 16,
                }}
              >
                <div
                  className="relative aspect-video"
                  style={{ background: BAI.bgMuted }}
                >
                  <img
                    src={images[selectedImage]}
                    alt={`${property.title} - Image ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
                  />
                  <div
                    className="absolute bottom-4 right-4 text-xs px-3 py-1"
                    style={{
                      background: 'rgba(13,12,10,0.55)',
                      borderRadius: 20,
                      fontFamily: BAI.fontBody,
                      color: '#fff',
                    }}
                  >
                    {selectedImage + 1} / {images.length}
                  </div>
                </div>
                {images.length > 1 && (
                  <div className="p-4 grid grid-cols-6 gap-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className="aspect-square rounded-xl overflow-hidden transition-all"
                        style={{
                          border: selectedImage === index
                            ? `2px solid ${BAI.owner}`
                            : `2px solid ${BAI.border}`,
                          boxShadow: selectedImage === index
                            ? `0 0 0 2px ${BAI.ownerLight}`
                            : 'none',
                        }}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={cardStyle}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: BAI.inkFaint,
                    marginBottom: 12,
                  }}
                >
                  Description
                </p>
                <p
                  className="whitespace-pre-line leading-relaxed"
                  style={{ color: BAI.inkMid, fontSize: 14 }}
                >
                  {property.description}
                </p>
              </div>

              {/* Characteristics */}
              <div style={cardStyle}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: BAI.inkFaint,
                    marginBottom: 16,
                  }}
                >
                  Caractéristiques
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: <Bed className="w-5 h-5" style={{ color: BAI.owner }} />,    label: 'Chambres',      value: property.bedrooms },
                    { icon: <Bath className="w-5 h-5" style={{ color: BAI.owner }} />,   label: 'Salles de bain', value: property.bathrooms },
                    { icon: <Square className="w-5 h-5" style={{ color: BAI.owner }} />, label: 'Surface',       value: `${property.surface}m²` },
                    ...(property.floor !== null && property.floor !== undefined
                      ? [{ icon: <Home className="w-5 h-5" style={{ color: BAI.owner }} />, label: 'Étage', value: property.floor }]
                      : []),
                    {
                      icon: property.furnished
                        ? <Check className="w-5 h-5" style={{ color: BAI.owner }} />
                        : <X className="w-5 h-5" style={{ color: BAI.inkFaint }} />,
                      label: 'Meublé',
                      value: property.furnished ? 'Oui' : 'Non',
                    },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: BAI.ownerLight }}
                      >
                        {icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: BAI.inkFaint }}>{label}</p>
                        <p style={{ fontWeight: 600, color: BAI.ink, fontSize: 14 }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${BAI.border}` }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: BAI.inkFaint,
                      marginBottom: 12,
                    }}
                  >
                    Équipements
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Parking',   value: property.hasParking },
                      { label: 'Balcon',    value: property.hasBalcony },
                      { label: 'Ascenseur', value: property.hasElevator },
                      { label: 'Jardin',    value: property.hasGarden },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-2">
                        {value
                          ? <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: BAI.success }} />
                          : <XCircle    className="w-5 h-5 flex-shrink-0" style={{ color: BAI.borderStrong }} />
                        }
                        <span style={{ fontSize: 13, color: value ? BAI.ink : BAI.inkFaint }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${BAI.border}` }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: BAI.inkFaint,
                        marginBottom: 12,
                      }}
                    >
                      Autres équipements
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => {
                        const amenityConfig = AMENITIES.find((a) => a.value === amenity)
                        return amenityConfig ? (
                          <span
                            key={amenity}
                            style={{
                              background: BAI.bgMuted,
                              border: `1px solid ${BAI.border}`,
                              color: BAI.inkMid,
                              fontSize: 12,
                              padding: '4px 12px',
                              borderRadius: 99,
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

              {/* Location */}
              <div style={cardStyle}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: BAI.inkFaint,
                    marginBottom: 16,
                  }}
                >
                  Localisation
                </p>
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: BAI.ownerLight }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: BAI.owner }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, color: BAI.ink }}>{property.address}</p>
                    <p style={{ color: BAI.inkMid }}>{property.city}, {property.postalCode}</p>
                    <p style={{ color: BAI.inkMid }}>{property.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sidebar ────────────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Price Card */}
              <div style={cardStyle}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: BAI.inkFaint,
                    marginBottom: 16,
                  }}
                >
                  Informations financières
                </p>
                <div className="space-y-3">
                  <div>
                    <p style={{ fontSize: 12, color: BAI.inkFaint }}>Loyer mensuel</p>
                    <p
                      style={{
                        fontFamily: BAI.fontDisplay,
                        fontWeight: 700,
                        fontSize: 36,
                        color: BAI.owner,
                        lineHeight: 1.1,
                      }}
                    >
                      {property.price} €
                    </p>
                  </div>
                  {property.charges && property.charges > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: BAI.inkFaint }}>Charges</p>
                      <p style={{ fontSize: 18, fontWeight: 600, color: BAI.ink }}>
                        {property.charges} €
                      </p>
                    </div>
                  )}
                  {property.deposit && property.deposit > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: BAI.inkFaint }}>Dépôt de garantie</p>
                      <p style={{ fontSize: 18, fontWeight: 600, color: BAI.ink }}>
                        {property.deposit} €
                      </p>
                    </div>
                  )}
                  <div className="pt-3" style={{ borderTop: `1px solid ${BAI.border}` }}>
                    <p style={{ fontSize: 12, color: BAI.inkFaint }}>Total mensuel</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: BAI.ink }}>
                      {property.price + (property.charges || 0)} €
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Card */}
              <div style={cardStyle}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: BAI.inkFaint,
                    marginBottom: 16,
                  }}
                >
                  Statistiques
                </p>
                <div className="space-y-3">
                  {[
                    { icon: <Eye className="w-4 h-4" style={{ color: BAI.owner }} />,          label: 'Vues',     value: property.views },
                    { icon: <MessageSquare className="w-4 h-4" style={{ color: BAI.owner }} />, label: 'Contacts', value: property.contactCount },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: BAI.ownerLight }}
                        >
                          {icon}
                        </div>
                        <span style={{ fontSize: 13, color: BAI.inkMid }}>{label}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: BAI.ink }}>{value}</span>
                    </div>
                  ))}
                  <div className="pt-3 space-y-2" style={{ borderTop: `1px solid ${BAI.border}` }}>
                    {[
                      { label: 'Créé le',      value: new Date(property.createdAt).toLocaleDateString('fr-FR') },
                      { label: 'Mis à jour le', value: new Date(property.updatedAt).toLocaleDateString('fr-FR') },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: BAI.ownerLight }}
                          >
                            <Calendar className="w-4 h-4" style={{ color: BAI.owner }} />
                          </div>
                          <span style={{ fontSize: 13, color: BAI.inkMid }}>{label}</span>
                        </div>
                        <span style={{ fontSize: 13, color: BAI.inkFaint }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verification Documents Card (only for DRAFT) */}
              {property.status === 'DRAFT' && (
                <div style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: BAI.ownerLight }}
                    >
                      <Shield className="w-5 h-5" style={{ color: BAI.owner }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink }}>
                      Vérification du propriétaire
                    </p>
                  </div>
                  <p style={{ fontSize: 14, color: BAI.inkMid, marginBottom: 16 }}>
                    Documents obligatoires avant la mise en ligne du bien (anti-arnaque).
                  </p>

                  <input
                    ref={docInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleDocFileChange}
                  />

                  {[
                    {
                      key: 'ownerIdDocument' as const,
                      title: "Pièce d'identité",
                      desc: "Carte nationale d'identité ou passeport en cours de validité.",
                      hasDoc: !!property.ownerIdDocument,
                      docUrl: property.ownerIdDocument,
                    },
                    {
                      key: 'propertyProofDocument' as const,
                      title: 'Preuve de propriété',
                      desc: 'Titre de propriété ou dernier avis de taxe foncière.',
                      hasDoc: !!property.propertyProofDocument,
                      docUrl: property.propertyProofDocument,
                    },
                  ].map((doc) => (
                    <div
                      key={doc.key}
                      style={{
                        background: doc.hasDoc ? BAI.successLight : BAI.bgMuted,
                        border: `1px solid ${doc.hasDoc ? '#a8d5bc' : BAI.border}`,
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked
                          disabled
                          className="mt-1 rounded"
                          style={{ opacity: 0.5 }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ fontSize: 14, fontWeight: 500, color: BAI.ink }}>
                              {doc.title}
                            </p>
                            <Lock className="w-3 h-3" style={{ color: BAI.inkFaint }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: BAI.error }}>
                              Obligatoire
                            </span>
                          </div>
                          <p style={{ fontSize: 12, marginTop: 2, color: BAI.inkFaint }}>{doc.desc}</p>
                          {doc.hasDoc ? (
                            <div className="mt-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" style={{ color: BAI.success }} />
                              <span style={{ fontSize: 12, fontWeight: 500, color: BAI.success }}>
                                Document fourni
                              </span>
                              <a
                                href={
                                  doc.docUrl!.startsWith('http')
                                    ? doc.docUrl!
                                    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${doc.docUrl}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 12, fontWeight: 500, color: BAI.owner, textDecoration: 'none', marginLeft: 8 }}
                              >
                                Voir
                              </a>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDocUpload(doc.key)}
                              disabled={uploadingDoc === doc.key}
                              className="mt-2 flex items-center gap-1"
                              style={{ fontSize: 12, fontWeight: 500, color: BAI.owner, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {uploadingDoc === doc.key ? 'Envoi en cours...' : 'Télécharger le document'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      background: BAI.bgMuted,
                      border: `1px solid ${BAI.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: BAI.inkFaint,
                    }}
                  >
                    Format : PDF uniquement — Taille max : 5 Mo
                  </div>
                </div>
              )}

              {/* Actions Card */}
              <div style={cardStyle}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: BAI.inkFaint,
                    marginBottom: 16,
                  }}
                >
                  Actions rapides
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/properties/${property.id}/edit`)}
                    className="w-full flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                    style={{
                      background: BAI.owner,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 20px',
                      fontFamily: BAI.fontBody,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Modifier le bien
                  </button>
                  {property.status === 'DRAFT' && (
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="w-full flex items-center justify-center gap-2 transition-all hover:-translate-y-px disabled:opacity-50"
                      style={{
                        background: BAI.success,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 20px',
                        fontFamily: BAI.fontBody,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isPublishing ? 'Publication...' : 'Publier le bien'}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 transition-all hover:-translate-y-px disabled:opacity-50"
                    style={{
                      background: BAI.errorLight,
                      border: `1px solid #f5c6c6`,
                      color: BAI.error,
                      borderRadius: 8,
                      padding: '10px 20px',
                      fontFamily: BAI.fontBody,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Suppression...' : 'Supprimer le bien'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
