import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { Property, PropertyStatus, PROPERTY_STATUS } from '../../types/property.types'
import {
  Home,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Bed,
  Bath,
  Square,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { StatusChangeModal } from '../../components/property/StatusChangeModal'

export default function MyProperties() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    myProperties,
    myPropertiesTotal,
    isLoading,
    error,
    fetchMyProperties,
    deleteProperty,
    changePropertyStatus,
    setError,
  } = useProperties()
  const { createContract } = useContractStore()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusModalProperty, setStatusModalProperty] = useState<Property | null>(null)

  useEffect(() => {
    fetchMyProperties()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) {
      return
    }

    setDeletingId(id)
    try {
      await deleteProperty(id)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleChangeStatus = async (status: PropertyStatus, tenantId?: string) => {
    if (!statusModalProperty) return

    // If setting to OCCUPIED with a tenant, create a draft contract
    if (status === 'OCCUPIED' && tenantId && user) {
      const now = new Date()
      const oneYearLater = new Date(now)
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)

      await createContract({
        propertyId: statusModalProperty.id,
        tenantId,
        startDate: now.toISOString().split('T')[0],
        endDate: oneYearLater.toISOString().split('T')[0],
        monthlyRent: statusModalProperty.price,
        charges: statusModalProperty.charges || undefined,
        deposit: statusModalProperty.deposit || undefined,
      })
    }

    await changePropertyStatus(statusModalProperty.id, status)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = PROPERTY_STATUS.find((s) => s.value === status)
    if (!statusConfig) return null

    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colorClasses[statusConfig.color as keyof typeof colorClasses]
        }`}
      >
        {statusConfig.label}
      </span>
    )
  }

  const PropertyCard = ({ property }: { property: Property }) => {
    const mainImage = property.images[0] || '/placeholder-property.jpg'

    return (
      <div className="card overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-property.jpg'
            }}
          />
          <div className="absolute top-3 right-3">
            {getStatusBadge(property.status)}
          </div>
          <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-lg text-sm font-semibold">
            {property.price}€/mois
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
            {property.title}
          </h3>

          <div className="flex items-center text-gray-600 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="line-clamp-1">{property.city}, {property.postalCode}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms}
            </div>
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms}
            </div>
            <div className="flex items-center">
              <Square className="w-4 h-4 mr-1" />
              {property.surface}m²
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Eye className="w-4 h-4" />
            <span>{property.views} vues</span>
            <span className="mx-2">•</span>
            <span>{property.contactCount} contacts</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/properties/${property.id}`)}
              className="btn btn-secondary flex-1 text-sm"
            >
              <Eye className="w-4 h-4 mr-1" />
              Voir
            </button>
            <button
              onClick={() => navigate(`/properties/${property.id}/edit`)}
              className="btn btn-primary flex-1 text-sm"
            >
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </button>
          </div>

          {/* Status Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setStatusModalProperty(property)}
              className="btn btn-secondary flex-1 text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Changer le statut
            </button>
            <button
              onClick={() => handleDelete(property.id, property.title)}
              disabled={deletingId === property.id}
              className="btn btn-danger text-sm"
            >
              {deletingId === property.id ? (
                'Suppression...'
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Propriétés</h1>
              <p className="text-gray-600 mt-1">
                {myPropertiesTotal} {myPropertiesTotal > 1 ? 'biens' : 'bien'}
              </p>
            </div>
            <Link to="/properties/new" className="btn btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un bien
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 underline mt-1"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && myProperties.length === 0 && (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Aucune propriété
            </h2>
            <p className="text-gray-600 mb-6">
              Commencez par ajouter votre premier bien immobilier
            </p>
            <Link to="/properties/new" className="btn btn-primary inline-flex">
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un bien
            </Link>
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && myProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {statusModalProperty && (
        <StatusChangeModal
          isOpen={true}
          onClose={() => setStatusModalProperty(null)}
          onConfirm={handleChangeStatus}
          propertyTitle={statusModalProperty.title}
          currentStatus={statusModalProperty.status}
        />
      )}
    </Layout>
  )
}
