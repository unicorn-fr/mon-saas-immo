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
  Euro,
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

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
  padding: 24,
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
    if (!currentProperty.ownerIdDocument || !currentProperty.propertyProofDocument) {
      toast.error('Vous devez fournir les documents de verification avant de publier le bien.')
      return
    }
    setIsPublishing(true)
    try {
      await publishProperty(currentProperty.id)
      toast.success('Bien publié avec succès')
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f5f7' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#007AFF' }} />
        </div>
      </Layout>
    )
  }

  if (!currentProperty) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1d1d1f' }}>Propriété introuvable</h2>
            <Link to="/properties/owner/me" className="text-sm font-medium hover:opacity-70" style={{ color: '#007AFF' }}>
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

  const statusStyles: Record<string, { bg: string; color: string }> = {
    green:  { bg: '#f0fdf4', color: '#15803d' },
    red:    { bg: '#fef2f2', color: '#dc2626' },
    yellow: { bg: '#fffbeb', color: '#b45309' },
    gray:   { bg: '#f5f5f7', color: '#64748b' },
  }

  const getStatusBadge = () => {
    if (!propertyStatus) return null
    const style = statusStyles[propertyStatus.color] || statusStyles['gray']
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium" style={style}>
        {propertyStatus.label}
      </span>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: '#f5f5f7' }}>
        {/* Header */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #d2d2d7' }}>
          <div className="container mx-auto px-4 py-4">
            <Link to="/properties/owner/me"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-3 hover:opacity-70 transition-opacity"
              style={{ color: '#515154' }}>
              <ArrowLeft className="w-4 h-4" />
              Retour à mes propriétés
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#1d1d1f' }}>{property.title}</h1>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                  <span className="text-sm" style={{ color: '#515154' }}>{propertyType?.label}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/properties/${property.id}/edit`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
                  style={{ background: '#007AFF' }}>
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
                {property.status === 'DRAFT' && (
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-50"
                    style={{ background: '#16a34a' }}>
                    {isPublishing ? 'Publication...' : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Publier
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-50"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
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
            <div className="p-4 rounded-xl flex items-start gap-3"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
              <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Image Gallery */}
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div className="relative aspect-video" style={{ background: '#f0f0f2' }}>
                  <img
                    src={images[selectedImage]}
                    alt={`${property.title} - Image ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
                  />
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-lg">
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
                          border: selectedImage === index ? '2px solid #007AFF' : '2px solid #d2d2d7',
                          boxShadow: selectedImage === index ? '0 0 0 2px #aacfff' : 'none',
                        }}>
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
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#1d1d1f' }}>Description</h2>
                <p className="whitespace-pre-line" style={{ color: '#515154' }}>{property.description}</p>
              </div>

              {/* Characteristics */}
              <div style={cardStyle}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#1d1d1f' }}>Caractéristiques</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: <Bed className="w-5 h-5" style={{ color: '#007AFF' }} />, label: 'Chambres', value: property.bedrooms },
                    { icon: <Bath className="w-5 h-5" style={{ color: '#007AFF' }} />, label: 'Salles de bain', value: property.bathrooms },
                    { icon: <Square className="w-5 h-5" style={{ color: '#007AFF' }} />, label: 'Surface', value: `${property.surface}m²` },
                    ...(property.floor !== null && property.floor !== undefined
                      ? [{ icon: <Home className="w-5 h-5" style={{ color: '#007AFF' }} />, label: 'Étage', value: property.floor }]
                      : []),
                    {
                      icon: property.furnished
                        ? <Check className="w-5 h-5" style={{ color: '#007AFF' }} />
                        : <X className="w-5 h-5" style={{ color: '#86868b' }} />,
                      label: 'Meublé',
                      value: property.furnished ? 'Oui' : 'Non',
                    },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: '#86868b' }}>{label}</p>
                        <p className="font-semibold" style={{ color: '#1d1d1f' }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="mt-6 pt-6" style={{ borderTop: '1px solid #d2d2d7' }}>
                  <h3 className="font-semibold mb-3" style={{ color: '#1d1d1f' }}>Équipements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Parking',   value: property.hasParking },
                      { label: 'Balcon',    value: property.hasBalcony },
                      { label: 'Ascenseur', value: property.hasElevator },
                      { label: 'Jardin',    value: property.hasGarden },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-2">
                        {value
                          ? <CheckCircle className="w-5 h-5" style={{ color: '#16a34a' }} />
                          : <XCircle className="w-5 h-5" style={{ color: '#b0b0b8' }} />
                        }
                        <span className="text-sm" style={{ color: value ? '#1d1d1f' : '#86868b' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mt-6 pt-6" style={{ borderTop: '1px solid #d2d2d7' }}>
                    <h3 className="font-semibold mb-3" style={{ color: '#1d1d1f' }}>Autres équipements</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => {
                        const amenityConfig = AMENITIES.find((a) => a.value === amenity)
                        return amenityConfig ? (
                          <span key={amenity} className="px-3 py-1 rounded-full text-sm"
                            style={{ background: '#f5f5f7', border: '1px solid #d2d2d7', color: '#515154' }}>
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
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#1d1d1f' }}>Localisation</h2>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#e8f0fe' }}>
                    <MapPin className="w-5 h-5" style={{ color: '#007AFF' }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#1d1d1f' }}>{property.address}</p>
                    <p style={{ color: '#515154' }}>{property.city}, {property.postalCode}</p>
                    <p style={{ color: '#515154' }}>{property.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">

              {/* Price Card */}
              <div style={cardStyle}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                    <Euro className="w-5 h-5" style={{ color: '#007AFF' }} />
                  </div>
                  <h2 className="text-base font-semibold" style={{ color: '#1d1d1f' }}>Informations financières</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm" style={{ color: '#86868b' }}>Loyer mensuel</p>
                    <p className="text-2xl font-extrabold" style={{ color: '#007AFF' }}>{property.price}€</p>
                  </div>
                  {property.charges && property.charges > 0 && (
                    <div>
                      <p className="text-sm" style={{ color: '#86868b' }}>Charges</p>
                      <p className="text-lg font-semibold" style={{ color: '#1d1d1f' }}>{property.charges}€</p>
                    </div>
                  )}
                  {property.deposit && property.deposit > 0 && (
                    <div>
                      <p className="text-sm" style={{ color: '#86868b' }}>Dépôt de garantie</p>
                      <p className="text-lg font-semibold" style={{ color: '#1d1d1f' }}>{property.deposit}€</p>
                    </div>
                  )}
                  <div className="pt-3" style={{ borderTop: '1px solid #d2d2d7' }}>
                    <p className="text-sm" style={{ color: '#86868b' }}>Total mensuel</p>
                    <p className="text-xl font-bold" style={{ color: '#1d1d1f' }}>
                      {property.price + (property.charges || 0)}€
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Card */}
              <div style={cardStyle}>
                <h2 className="text-base font-semibold mb-4" style={{ color: '#1d1d1f' }}>Statistiques</h2>
                <div className="space-y-3">
                  {[
                    { icon: <Eye className="w-4 h-4" style={{ color: '#007AFF' }} />, label: 'Vues', value: property.views },
                    { icon: <MessageSquare className="w-4 h-4" style={{ color: '#007AFF' }} />, label: 'Contacts', value: property.contactCount },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>{icon}</div>
                        <span className="text-sm" style={{ color: '#515154' }}>{label}</span>
                      </div>
                      <span className="font-semibold" style={{ color: '#1d1d1f' }}>{value}</span>
                    </div>
                  ))}
                  <div className="pt-3 space-y-2" style={{ borderTop: '1px solid #d2d2d7' }}>
                    {[
                      { label: 'Créé le', value: new Date(property.createdAt).toLocaleDateString('fr-FR') },
                      { label: 'Mis à jour le', value: new Date(property.updatedAt).toLocaleDateString('fr-FR') },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                            <Calendar className="w-4 h-4" style={{ color: '#007AFF' }} />
                          </div>
                          <span className="text-sm" style={{ color: '#515154' }}>{label}</span>
                        </div>
                        <span className="text-sm" style={{ color: '#86868b' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verification Documents Card (only for DRAFT) */}
              {property.status === 'DRAFT' && (
                <div style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                      <Shield className="w-5 h-5" style={{ color: '#007AFF' }} />
                    </div>
                    <h2 className="text-base font-semibold" style={{ color: '#1d1d1f' }}>Vérification du propriétaire</h2>
                  </div>
                  <p className="text-sm mb-4" style={{ color: '#515154' }}>
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
                      desc: 'Carte nationale d\'identité ou passeport en cours de validité.',
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
                    <div key={doc.key}
                      className="p-3 rounded-xl border mb-3"
                      style={{
                        background: doc.hasDoc ? '#f0fdf4' : '#f5f5f7',
                        border: `1px solid ${doc.hasDoc ? '#bbf7d0' : '#d2d2d7'}`,
                      }}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={true} disabled
                          className="mt-1 rounded" style={{ opacity: 0.5 }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium" style={{ color: '#1d1d1f' }}>{doc.title}</p>
                            <Lock className="w-3 h-3" style={{ color: '#86868b' }} />
                            <span className="text-xs font-medium" style={{ color: '#dc2626' }}>Obligatoire</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: '#86868b' }}>{doc.desc}</p>
                          {doc.hasDoc ? (
                            <div className="mt-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" style={{ color: '#16a34a' }} />
                              <span className="text-xs font-medium" style={{ color: '#15803d' }}>Document fourni</span>
                              <a
                                href={doc.docUrl!.startsWith('http') ? doc.docUrl! : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${doc.docUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium ml-2 hover:opacity-70"
                                style={{ color: '#007AFF' }}>
                                Voir
                              </a>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDocUpload(doc.key)}
                              disabled={uploadingDoc === doc.key}
                              className="mt-2 text-xs flex items-center gap-1 font-medium hover:opacity-70"
                              style={{ color: '#007AFF' }}>
                              <Upload className="w-3.5 h-3.5" />
                              {uploadingDoc === doc.key ? 'Envoi en cours...' : 'Télécharger le document'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="text-xs p-2 rounded-xl" style={{ background: '#f5f5f7', border: '1px solid #d2d2d7', color: '#86868b' }}>
                    Format : PDF uniquement — Taille max : 5 Mo
                  </div>
                </div>
              )}

              {/* Actions Card */}
              <div style={cardStyle}>
                <h2 className="text-base font-semibold mb-4" style={{ color: '#1d1d1f' }}>Actions rapides</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/properties/${property.id}/edit`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
                    style={{ background: '#007AFF' }}>
                    <Edit className="w-4 h-4" />
                    Modifier le bien
                  </button>
                  {property.status === 'DRAFT' && (
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-50"
                      style={{ background: '#16a34a' }}>
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-50"
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
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
