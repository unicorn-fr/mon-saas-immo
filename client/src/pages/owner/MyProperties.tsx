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

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
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

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    AVAILABLE: { label: 'Disponible',   bg: '#f0fdf4', color: '#15803d' },
    OCCUPIED:  { label: 'En location',  bg: '#eff6ff', color: '#1d4ed8' },
    DRAFT:     { label: 'Hors marché',  bg: '#f5f5f7', color: '#64748b' },
    RESERVED:  { label: 'Réservé',      bg: '#fffbeb', color: '#b45309' },
  }

  const counts: Record<TabKey, number> = {
    'tous':        myProperties.length,
    'disponibles': myProperties.filter(p => p.status === 'AVAILABLE').length,
    'en-location': myProperties.filter(p => p.status === 'OCCUPIED').length,
    'hors-marche': myProperties.filter(p => ['DRAFT','RESERVED'].includes(p.status)).length,
  }

  const filtered = TAB_STATUSES[activeTab]
    ? myProperties.filter(p => (TAB_STATUSES[activeTab] as PropertyStatus[]).includes(p.status))
    : myProperties

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'tous',        label: 'Tous' },
    { key: 'disponibles', label: 'Disponibles' },
    { key: 'en-location', label: 'En location' },
    { key: 'hors-marche', label: 'Hors marché' },
  ]

  const PropertyCard = ({ property }: { property: Property }) => {
    const cfg = statusConfig[property.status] || statusConfig['DRAFT']
    const mainImage = property.images[0] || '/placeholder-property.jpg'
    return (
      <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        style={{
          ...cardStyle,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
        }}>

        {/* Image */}
        <div className="relative h-44" style={{ background: '#f0f0f2' }}>
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
          />
          {/* Price badge */}
          <div className="absolute bottom-3 left-3 bg-white px-2.5 py-1 rounded-xl shadow text-sm font-bold"
            style={{ color: '#1d1d1f' }}>
            {property.price}€<span className="font-normal text-xs" style={{ color: '#86868b' }}>/mois</span>
          </div>
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold mb-1 line-clamp-1" style={{ color: '#1d1d1f' }}>{property.title}</h3>
          <div className="flex items-center text-sm mb-3" style={{ color: '#86868b' }}>
            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span className="line-clamp-1">{property.city}, {property.postalCode}</span>
          </div>

          {/* Characteristics */}
          <div className="flex items-center gap-3 text-sm mb-3 pb-3" style={{ color: '#86868b', borderBottom: '1px solid #f0f0f2' }}>
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms} ch.</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} sdb</span>
            <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{property.surface}m²</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs mb-4" style={{ color: '#86868b' }}>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.views} vues</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{property.contactCount} contacts</span>
          </div>

          {/* Primary actions */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => navigate(`/properties/${property.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-slate-50"
              style={{ border: '1px solid #d2d2d7', color: '#515154' }}
            >
              <Eye className="w-3.5 h-3.5" />
              Voir
            </button>
            <button
              onClick={() => navigate(`/properties/${property.id}/edit`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
              style={{ background: '#007AFF' }}
            >
              <Edit className="w-3.5 h-3.5" />
              Modifier
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusModalProperty(property)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-slate-50"
              style={{ border: '1px solid #d2d2d7', color: '#515154' }}
            >
              <RefreshCw className="w-3 h-3" />
              Changer le statut
            </button>
            <button
              onClick={() => handleDelete(property.id, property.title)}
              disabled={deletingId === property.id}
              className="p-1.5 rounded-xl transition-colors hover:bg-red-50 disabled:opacity-50"
              style={{ border: '1px solid #fecaca', color: '#ef4444' }}
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
      <div className="min-h-screen" style={{ background: '#f5f5f7' }}>

        {/* Header */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #d2d2d7' }}>
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-extrabold flex items-center gap-2.5" style={{ color: '#1d1d1f' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                    <Home className="w-5 h-5" style={{ color: '#007AFF' }} />
                  </div>
                  Mes Propriétés
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: '#86868b' }}>
                  <span><strong style={{ color: '#1d1d1f' }}>{myPropertiesTotal}</strong> bien{myPropertiesTotal > 1 ? 's' : ''} au total</span>
                  {counts['en-location'] > 0 && (
                    <>
                      <span style={{ color: '#d2d2d7' }}>|</span>
                      <span><strong style={{ color: '#1d4ed8' }}>{counts['en-location']}</strong> en location</span>
                    </>
                  )}
                  {counts['disponibles'] > 0 && (
                    <>
                      <span style={{ color: '#d2d2d7' }}>|</span>
                      <span><strong style={{ color: '#15803d' }}>{counts['disponibles']}</strong> disponible{counts['disponibles'] > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>
              <Link to="/properties/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
                style={{ background: '#007AFF', boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}>
                <Plus className="w-4 h-4" />
                Ajouter un bien
              </Link>
            </div>
          </div>
        </div>

        {/* Smart Tabs */}
        {myProperties.length > 0 && (
          <div style={{ background: '#ffffff', borderBottom: '1px solid #d2d2d7' }}>
            <div className="container mx-auto px-4">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors"
                    style={{
                      color: activeTab === tab.key ? '#007AFF' : '#86868b',
                      borderBottom: activeTab === tab.key ? '2px solid #007AFF' : '2px solid transparent',
                    }}
                  >
                    {tab.label}
                    {counts[tab.key] > 0 && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: activeTab === tab.key ? '#007AFF' : '#f0f0f2',
                          color: activeTab === tab.key ? '#ffffff' : '#64748b',
                        }}>
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
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
              <div>
                <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
                <button onClick={() => setError(null)} className="text-sm underline mt-1" style={{ color: '#dc2626' }}>Fermer</button>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#007AFF' }} />
            </div>
          )}

          {/* Empty state — no properties at all */}
          {!isLoading && myProperties.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#e8f0fe' }}>
                <Home className="w-8 h-8" style={{ color: '#007AFF' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: '#1d1d1f' }}>Aucune propriété</h2>
              <p className="mb-6" style={{ color: '#86868b' }}>Commencez par ajouter votre premier bien immobilier.</p>
              <Link to="/properties/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#007AFF' }}>
                <Plus className="w-4 h-4" />
                Ajouter un bien
              </Link>
            </div>
          )}

          {/* Empty state — tab filter yields nothing */}
          {!isLoading && myProperties.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#86868b' }}>
                Aucun bien dans cette catégorie.
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
