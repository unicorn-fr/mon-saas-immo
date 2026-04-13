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

// ─── Maison tokens ────────────────────────────────────────────────────────────


const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
  padding: 24,
}

// ─── Component ────────────────────────────────────────────────────────────────

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
          style={{ background: BAI.bgBase, fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          <div className="text-center">
            <h2
              className="text-2xl font-semibold mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                color: BAI.ink,
              }}
            >
              Propriété introuvable
            </h2>
            <Link
              to="/properties/owner/me"
              className="text-sm font-medium hover:opacity-70"
              style={{ color: BAI.owner }}
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

  // Status pill styles — Maison palette
  const statusPillStyles: Record<string, React.CSSProperties> = {
    green:  { background: BAI.successLight,   color: BAI.success },
    red:    { background: BAI.errorLight,    color: BAI.error  },
    yellow: { background: BAI.warningLight,   color: BAI.warning },
    amber:  { background: BAI.caramelLight, color: '#a0622a' },
    blue:   { background: BAI.ownerLight,  color: BAI.owner   },
    gray:   { background: BAI.bgMuted,       color: BAI.inkMid  },
  }

  const getStatusBadge = () => {
    if (!propertyStatus) return null
    const style = statusPillStyles[propertyStatus.color] || statusPillStyles['gray']
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold"
        style={style}
      >
        {propertyStatus.label}
      </span>
    )
  }

  return (
    <Layout>
      <div
        className="min-h-screen"
        style={{ background: BAI.bgBase, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {/* Top nav bar */}
        <div style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}` }}>
          <div className="container mx-auto px-4 py-4">
            <Link
              to="/properties/owner/me"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-3 hover:opacity-70 transition-opacity"
              style={{ color: BAI.inkMid }}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à mes propriétés
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="mb-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: 32,
                    color: BAI.ink,
                    lineHeight: 1.15,
                  }}
                >
                  {property.title}
                </h1>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                  <span style={{ fontSize: 13, color: BAI.inkMid }}>{propertyType?.label}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/properties/${property.id}/edit`)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px"
                  style={{ background: BAI.owner, borderRadius: 8 }}
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
                {property.status === 'DRAFT' && (
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-50"
                    style={{ background: BAI.success, borderRadius: 8 }}
                  >
                    {isPublishing ? 'Publication...' : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Publier le bien
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-50"
                  style={{
                    background: BAI.errorLight,
                    border: `1px solid #f5c6c6`,
                    color: BAI.error,
                    borderRadius: 8,
                  }}
                >
                  {isDeleting ? 'Suppression...' : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="container mx-auto px-4 mt-4">
            <div
              className="p-4 flex items-start gap-3"
              style={{
                background: BAI.errorLight,
                border: `1px solid #f5c6c6`,
                borderRadius: 10,
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BAI.error }} />
              <p className="text-sm" style={{ color: '#7f1d1d' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
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
                    className="absolute bottom-4 right-4 text-white text-xs px-3 py-1"
                    style={{
                      background: 'rgba(13,12,10,0.55)',
                      borderRadius: 20,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
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
                  className="uppercase tracking-widest mb-3"
                  style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em' }}
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
                  className="uppercase tracking-widest mb-4"
                  style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em' }}
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
                        <p className="font-semibold" style={{ color: BAI.ink, fontSize: 14 }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${BAI.border}` }}>
                  <p
                    className="uppercase tracking-widest mb-3"
                    style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em' }}
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
                      className="uppercase tracking-widest mb-3"
                      style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em' }}
                    >
                      Autres équipements
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => {
                        const amenityConfig = AMENITIES.find((a) => a.value === amenity)
                        return amenityConfig ? (
                          <span
                            key={amenity}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{
                              background: BAI.bgMuted,
                              border: `1px solid ${BAI.border}`,
                              color: BAI.inkMid,
                              fontSize: 12,
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
                  className="uppercase tracking-widest mb-4"
                  style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em' }}
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
                    <p className="font-medium" style={{ color: BAI.ink }}>{property.address}</p>
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
                  className="uppercase tracking-widest mb-4"
                  style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em' }}
                >
                  Informations financières
                </p>
                <div className="space-y-3">
                  <div>
                    <p style={{ fontSize: 12, color: BAI.inkFaint }}>Loyer mensuel</p>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
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
                      <p
                        className="text-lg font-semibold"
                        style={{ color: BAI.ink }}
                      >
                        {property.charges} €
                      </p>
                    </div>
                  )}
                  {property.deposit && property.deposit > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: BAI.inkFaint }}>Dépôt de garantie</p>
                      <p
                        className="text-lg font-semibold"
                        style={{ color: BAI.ink }}
                      >
                        {property.deposit} €
                      </p>
                    </div>
                  )}
                  <div className="pt-3" style={{ borderTop: `1px solid ${BAI.border}` }}>
                    <p style={{ fontSize: 12, color: BAI.inkFaint }}>Total mensuel</p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: BAI.ink }}
                    >
                      {property.price + (property.charges || 0)} €
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Card */}
              <div style={cardStyle}>
                <p
                  className="uppercase tracking-widest mb-4"
                  style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em' }}
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
                      <span className="font-semibold" style={{ color: BAI.ink }}>{value}</span>
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
                    <p
                      className="text-sm font-semibold"
                      style={{ color: BAI.ink }}
                    >
                      Vérification du propriétaire
                    </p>
                  </div>
                  <p className="text-sm mb-4" style={{ color: BAI.inkMid }}>
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
                      className="p-3 mb-3"
                      style={{
                        background: doc.hasDoc ? BAI.successLight : BAI.bgMuted,
                        border: `1px solid ${doc.hasDoc ? '#a8d5bc' : BAI.border}`,
                        borderRadius: 10,
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
                            <p
                              className="text-sm font-medium"
                              style={{ color: BAI.ink }}
                            >
                              {doc.title}
                            </p>
                            <Lock className="w-3 h-3" style={{ color: BAI.inkFaint }} />
                            <span
                              className="text-xs font-semibold"
                              style={{ color: BAI.error }}
                            >
                              Obligatoire
                            </span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: BAI.inkFaint }}>{doc.desc}</p>
                          {doc.hasDoc ? (
                            <div className="mt-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" style={{ color: BAI.success }} />
                              <span
                                className="text-xs font-medium"
                                style={{ color: BAI.success }}
                              >
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
                                className="text-xs font-medium ml-2 hover:opacity-70"
                                style={{ color: BAI.owner }}
                              >
                                Voir
                              </a>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDocUpload(doc.key)}
                              disabled={uploadingDoc === doc.key}
                              className="mt-2 text-xs flex items-center gap-1 font-medium hover:opacity-70"
                              style={{ color: BAI.owner }}
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
                    className="text-xs p-2"
                    style={{
                      background: BAI.bgMuted,
                      border: `1px solid ${BAI.border}`,
                      borderRadius: 8,
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
                  className="uppercase tracking-widest mb-4"
                  style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em' }}
                >
                  Actions rapides
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/properties/${property.id}/edit`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px"
                    style={{ background: BAI.owner, borderRadius: 8 }}
                  >
                    <Edit className="w-4 h-4" />
                    Modifier le bien
                  </button>
                  {property.status === 'DRAFT' && (
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-50"
                      style={{ background: BAI.success, borderRadius: 8 }}
                    >
                      {isPublishing ? 'Publication...' : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Publier le bien
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-50"
                    style={{
                      background: BAI.errorLight,
                      border: `1px solid #f5c6c6`,
                      color: BAI.error,
                      borderRadius: 8,
                    }}
                  >
                    {isDeleting ? 'Suppression...' : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Supprimer le bien
                      </>
                    )}
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
