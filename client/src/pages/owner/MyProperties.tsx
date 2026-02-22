import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { Property, PropertyStatus } from '../../types/property.types'
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
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { StatusChangeModal } from '../../components/property/StatusChangeModal'

type TabKey = 'tous' | 'disponibles' | 'en-location' | 'hors-marche'

const TAB_STATUSES: Record<TabKey, PropertyStatus[] | null> = {
  'tous':        null,
  'disponibles': ['AVAILABLE'],
  'en-location': ['OCCUPIED'],
  'hors-marche': ['DRAFT', 'RESERVED'],
}

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
  const [activeTab, setActiveTab] = useState<TabKey>('tous')

  useEffect(() => {
    fetchMyProperties()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Etes-vous sur de vouloir supprimer "${title}" ?`)) return
    setDeletingId(id)
    try {
      await deleteProperty(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleChangeStatus = async (status: PropertyStatus, tenantId?: string) => {
    if (!statusModalProperty) return
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

  // Status config
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    AVAILABLE: { label: 'Disponible',    bg: 'bg-green-100', text: 'text-green-700' },
    OCCUPIED:  { label: 'En location',   bg: 'bg-blue-100',  text: 'text-blue-700' },
    DRAFT:     { label: 'Hors marche',   bg: 'bg-gray-100',  text: 'text-gray-600' },
    RESERVED:  { label: 'Reserve',       bg: 'bg-yellow-100',text: 'text-yellow-700' },
  }

  // Counts per tab
  const counts: Record<TabKey, number> = {
    'tous':        myProperties.length,
    'disponibles': myProperties.filter(p => p.status === 'AVAILABLE').length,
    'en-location': myProperties.filter(p => p.status === 'OCCUPIED').length,
    'hors-marche': myProperties.filter(p => ['DRAFT','RESERVED'].includes(p.status)).length,
  }

  const filtered = TAB_STATUSES[activeTab]
    ? myProperties.filter(p => (TAB_STATUSES[activeTab] as PropertyStatus[]).includes(p.status))
    : myProperties

  const tabs: { key: TabKey; label: string; color: string; activeColor: string }[] = [
    { key: 'tous',        label: 'Tous',         color: 'text-gray-700',   activeColor: 'bg-gray-800' },
    { key: 'disponibles', label: 'Disponibles',  color: 'text-green-600',  activeColor: 'bg-green-600' },
    { key: 'en-location', label: 'En location',  color: 'text-blue-600',   activeColor: 'bg-blue-600' },
    { key: 'hors-marche', label: 'Hors marche',  color: 'text-gray-500',   activeColor: 'bg-gray-500' },
  ]

  const PropertyCard = ({ property }: { property: Property }) => {
    const cfg = statusConfig[property.status] || statusConfig['DRAFT']
    const mainImage = property.images[0] || '/placeholder-property.jpg'
    return (
      <div className="bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow">

        {/* Image */}
        <div className="relative h-44 bg-gray-100">
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
          />
          {/* Price badge */}
          <div className="absolute bottom-3 left-3 bg-white bg-opacity-95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow text-sm font-bold text-gray-900">
            {property.price}€<span className="font-normal text-gray-500 text-xs">/mois</span>
          </div>
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span className="line-clamp-1">{property.city}, {property.postalCode}</span>
          </div>

          {/* Characteristics */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3 pb-3 border-b border-gray-100">
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms} ch.</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} sdb</span>
            <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{property.surface}m²</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.views} vues</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{property.contactCount} contacts</span>
          </div>

          {/* Primary actions */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => navigate(`/properties/${property.id}`)}
              className="btn btn-secondary flex-1 text-sm py-2"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Voir
            </button>
            <button
              onClick={() => navigate(`/properties/${property.id}/edit`)}
              className="btn btn-primary flex-1 text-sm py-2"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Modifier
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusModalProperty(property)}
              className="btn btn-secondary flex-1 text-xs py-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Changer le statut
            </button>
            <button
              onClick={() => handleDelete(property.id, property.title)}
              disabled={deletingId === property.id}
              className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Home className="w-7 h-7 text-primary-600" />
                  Mes Proprietes
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span><strong className="text-gray-900">{myPropertiesTotal}</strong> bien{myPropertiesTotal > 1 ? 's' : ''} au total</span>
                  {counts['en-location'] > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span><strong className="text-blue-600">{counts['en-location']}</strong> en location</span>
                    </>
                  )}
                  {counts['disponibles'] > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span><strong className="text-green-600">{counts['disponibles']}</strong> disponible{counts['disponibles'] > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>
              <Link to="/properties/new" className="btn btn-primary">
                <Plus className="w-5 h-5 mr-2" />
                Ajouter un bien
              </Link>
            </div>
          </div>
        </div>

        {/* Smart Tabs */}
        {myProperties.length > 0 && (
          <div className="bg-white border-b">
            <div className="container mx-auto px-4">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? `${tab.color} border-current`
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    {counts[tab.key] > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? `${tab.activeColor} text-white`
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {counts[tab.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-6">

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
                <button onClick={() => setError(null)} className="text-sm text-red-600 underline mt-1">Fermer</button>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          )}

          {/* Empty state — no properties at all */}
          {!isLoading && myProperties.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucune propriete</h2>
              <p className="text-gray-400 mb-6">Commencez par ajouter votre premier bien immobilier.</p>
              <Link to="/properties/new" className="btn btn-primary inline-flex">
                <Plus className="w-5 h-5 mr-2" />
                Ajouter un bien
              </Link>
            </div>
          )}

          {/* Empty state — tab filter yields nothing */}
          {!isLoading && myProperties.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">
                Aucun bien dans cette categorie.
              </p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
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
