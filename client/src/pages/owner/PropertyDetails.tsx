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

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${currentProperty.title}" ?`)) {
      return
    }

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
      toast.success('Bien publie avec succes')
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
      toast.error('Seuls les fichiers PDF sont acceptes')
      setUploadingDoc(null)
      if (docInputRef.current) docInputRef.current.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas depasser 5 Mo')
      setUploadingDoc(null)
      if (docInputRef.current) docInputRef.current.value = ''
      return
    }

    try {
      await propertyService.uploadVerificationDocument(currentProperty.id, uploadingDoc, file)
      toast.success('Document televerse avec succes')
      // Refresh property data
      if (id) fetchPropertyById(id, false)
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du telechargement')
    } finally {
      setUploadingDoc(null)
      if (docInputRef.current) docInputRef.current.value = ''
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
            <Link to="/properties/owner/me" className="text-primary-600 hover:text-primary-700">
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

  const getStatusBadge = () => {
    if (!propertyStatus) return null

    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          colorClasses[propertyStatus.color as keyof typeof colorClasses]
        }`}
      >
        {propertyStatus.label}
      </span>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/properties/owner/me"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à mes propriétés
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                <span className="text-gray-600">{propertyType?.label}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/properties/${property.id}/edit`)}
                className="btn btn-primary"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
              {property.status === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="btn btn-success"
                >
                  {isPublishing ? (
                    'Publication...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Publier
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? (
                  'Suppression...'
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
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

            {/* Description */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
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
                      <Home className="w-5 h-5 text-primary-600" />
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
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="font-medium">{property.address}</p>
                  <p className="text-gray-600">
                    {property.city}, {property.postalCode}
                  </p>
                  <p className="text-gray-600">{property.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Euro className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold">Informations financières</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Loyer mensuel</p>
                  <p className="text-2xl font-bold text-primary-600">{property.price}€</p>
                </div>
                {property.charges && property.charges > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Charges</p>
                    <p className="text-lg font-semibold">{property.charges}€</p>
                  </div>
                )}
                {property.deposit && property.deposit > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Dépôt de garantie</p>
                    <p className="text-lg font-semibold">{property.deposit}€</p>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Total mensuel</p>
                  <p className="text-xl font-bold">
                    {property.price + (property.charges || 0)}€
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Vues</span>
                  </div>
                  <span className="font-semibold">{property.views}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Contacts</span>
                  </div>
                  <span className="font-semibold">{property.contactCount}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Créé le</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(property.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Mis à jour le</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(property.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Documents Card (only for DRAFT) */}
            {property.status === 'DRAFT' && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-semibold">Verification du proprietaire</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Documents obligatoires avant la mise en ligne du bien (anti-arnaque).
                </p>

                <input
                  ref={docInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleDocFileChange}
                />

                {/* Owner ID Document */}
                <div className={`p-3 rounded-lg border mb-3 ${property.ownerIdDocument ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-1 rounded border-gray-300 text-primary-600 opacity-60"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">Piece d'identite</p>
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-red-500 font-medium">Obligatoire</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Carte nationale d'identite ou passeport en cours de validite.</p>
                      {property.ownerIdDocument ? (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-700 font-medium">Document fourni</span>
                          <a
                            href={property.ownerIdDocument.startsWith('http') ? property.ownerIdDocument : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${property.ownerIdDocument}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline ml-2"
                          >
                            Voir
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDocUpload('ownerIdDocument')}
                          disabled={uploadingDoc === 'ownerIdDocument'}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingDoc === 'ownerIdDocument' ? 'Envoi en cours...' : 'Telecharger le document'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Property Proof Document */}
                <div className={`p-3 rounded-lg border mb-3 ${property.propertyProofDocument ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-1 rounded border-gray-300 text-primary-600 opacity-60"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">Preuve de propriete</p>
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-red-500 font-medium">Obligatoire</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Titre de propriete ou dernier avis de taxe fonciere.</p>
                      {property.propertyProofDocument ? (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-700 font-medium">Document fourni</span>
                          <a
                            href={property.propertyProofDocument.startsWith('http') ? property.propertyProofDocument : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${property.propertyProofDocument}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline ml-2"
                          >
                            Voir
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDocUpload('propertyProofDocument')}
                          disabled={uploadingDoc === 'propertyProofDocument'}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingDoc === 'propertyProofDocument' ? 'Envoi en cours...' : 'Telecharger le document'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                  Format : PDF uniquement - Taille max : 5 Mo
                </div>
              </div>
            )}

            {/* Actions Card */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/properties/${property.id}/edit`)}
                  className="btn btn-primary w-full justify-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier le bien
                </button>
                {property.status === 'DRAFT' && (
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="btn btn-success w-full justify-center"
                  >
                    {isPublishing ? (
                      'Publication...'
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Publier le bien
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn btn-danger w-full justify-center"
                >
                  {isDeleting ? (
                    'Suppression...'
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer le bien
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
