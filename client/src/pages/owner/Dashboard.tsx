import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { Layout } from '../../components/layout/Layout'
import {
  Home,
  Plus,
  TrendingUp,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  ArrowRight,
  MapPin,
  Bed,
  Bath,
  Square,
  FileText,
  Send,
  PenLine,
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    statistics,
    myProperties,
    fetchMyStatistics,
    fetchMyProperties,
    isLoading,
  } = useProperties()

  const {
    contracts,
    statistics: contractStats,
    fetchContracts,
    fetchStatistics: fetchContractStatistics,
  } = useContractStore()

  useEffect(() => {
    fetchMyStatistics()
    fetchMyProperties({ page: 1, limit: 5 })
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate monthly revenue from active contracts
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE')
  const monthlyRevenue = activeContracts.reduce((sum, c) => sum + c.monthlyRent + (c.charges || 0), 0)
  const recentContracts = contracts.slice(0, 3)

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
    color = 'primary',
    onClick,
  }: {
    icon: any
    label: string
    value: string | number
    subtext?: string
    color?: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'purple'
    onClick?: () => void
  }) => {
    const colorClasses = {
      primary: 'bg-primary-100 text-primary-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
    }

    return (
      <div
        className={`card hover:shadow-lg transition-shadow ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
          </div>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    )
  }

  const PropertyQuickCard = ({ property }: { property: any }) => {
    const mainImage = property.images[0] || '/placeholder-property.jpg'

    return (
      <div
        className="flex gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/properties/${property.id}`)}
      >
        <img
          src={mainImage}
          alt={property.title}
          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-property.jpg'
          }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1 truncate">{property.title}</h4>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">
              {property.city}, {property.postalCode}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center">
              <Bed className="w-3 h-3 mr-1" />
              {property.bedrooms}
            </span>
            <span className="flex items-center">
              <Bath className="w-3 h-3 mr-1" />
              {property.bathrooms}
            </span>
            <span className="flex items-center">
              <Square className="w-3 h-3 mr-1" />
              {property.surface}m2
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-primary-600">{property.price}EUR</p>
          <p className="text-xs text-gray-500">/ mois</p>
        </div>
      </div>
    )
  }

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'DRAFT': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'SENT': return <Send className="w-4 h-4 text-blue-600" />
      case 'SIGNED_OWNER':
      case 'SIGNED_TENANT': return <PenLine className="w-4 h-4 text-indigo-600" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-emerald-600" />
      default: return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getContractStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT: 'Envoye',
      SIGNED_OWNER: 'Signe (proprio)',
      SIGNED_TENANT: 'Signe (locataire)',
      COMPLETED: 'Signe',
      ACTIVE: 'Actif',
      EXPIRED: 'Expire',
      TERMINATED: 'Resilie',
    }
    return labels[status] || status
  }

  if (isLoading && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="bg-gray-50">

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Home}
            label="Total Biens"
            value={statistics?.totalProperties || 0}
            subtext="Proprietes enregistrees"
            color="primary"
            onClick={() => navigate('/properties/owner/me')}
          />
          <StatCard
            icon={CheckCircle}
            label="En recherche"
            value={statistics?.availableProperties || 0}
            subtext={`${statistics?.totalProperties ? Math.round(((statistics.availableProperties || 0) / statistics.totalProperties) * 100) : 0}% du total`}
            color="green"
          />
          <StatCard
            icon={XCircle}
            label="En location"
            value={statistics?.occupiedProperties || 0}
            subtext={`${statistics?.totalProperties ? Math.round(((statistics.occupiedProperties || 0) / statistics.totalProperties) * 100) : 0}% du total`}
            color="blue"
          />
          <StatCard
            icon={Euro}
            label="Revenus mensuels"
            value={`${monthlyRevenue.toFixed(0)}EUR`}
            subtext={`${activeContracts.length} contrat(s) actif(s)`}
            color="green"
          />
        </div>

        {/* Contract Stats */}
        {contractStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card text-center bg-green-50 border-green-200">
              <p className="text-sm text-gray-600 mb-1">Contrats actifs</p>
              <p className="text-2xl font-bold text-green-600">{contractStats.active}</p>
            </div>
            <div className="card text-center bg-blue-50 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">En attente signature</p>
              <p className="text-2xl font-bold text-blue-600">{contractStats.sent + contractStats.completed}</p>
            </div>
            <div className="card text-center bg-yellow-50 border-yellow-200">
              <p className="text-sm text-gray-600 mb-1">Brouillons</p>
              <p className="text-2xl font-bold text-yellow-600">{contractStats.draft}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-1">Total contrats</p>
              <p className="text-2xl font-bold text-gray-900">{contractStats.total}</p>
            </div>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Eye}
            label="Vues Totales"
            value={statistics?.totalViews || 0}
            subtext={`~${statistics?.totalProperties ? Math.round((statistics.totalViews || 0) / statistics.totalProperties) : 0} vues/bien en moyenne`}
            color="blue"
          />
          <StatCard
            icon={MessageSquare}
            label="Contacts Recus"
            value={statistics?.totalContacts || 0}
            subtext="Messages de locataires"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Taux de Conversion"
            value={
              statistics?.totalViews && statistics?.totalContacts
                ? `${Math.round((statistics.totalContacts / statistics.totalViews) * 100)}%`
                : '0%'
            }
            subtext="Contacts / Vues"
            color="green"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Properties */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Proprietes Recentes
                </h2>
                <Link
                  to="/properties/owner/me"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  Voir tout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {myProperties.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Aucune propriete pour le moment</p>
                  <Link to="/properties/new" className="btn btn-primary inline-flex">
                    <Plus className="w-4 h-4 mr-2" />
                    Creer votre premiere propriete
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myProperties.slice(0, 5).map((property) => (
                    <PropertyQuickCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Contracts */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Contrats Recents
                </h2>
                <Link
                  to="/contracts"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  Voir mes contrats
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {recentContracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Aucun contrat pour le moment</p>
                  <Link to="/contracts/new" className="btn btn-primary inline-flex">
                    <Plus className="w-4 h-4 mr-2" />
                    Creer un contrat
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                    >
                      {getContractStatusIcon(contract.status)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {contract.property?.title || 'Contrat'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {contract.tenant?.firstName} {contract.tenant?.lastName} - {contract.monthlyRent}EUR/mois
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-500">
                        {getContractStatusLabel(contract.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Tips */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Actions Rapides
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/properties/new')}
                  className="btn btn-primary w-full justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un bien
                </button>
                <button
                  onClick={() => navigate('/contracts/new')}
                  className="btn btn-secondary w-full justify-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Nouveau contrat
                </button>
                <button
                  onClick={() => navigate('/properties/owner/me')}
                  className="btn btn-secondary w-full justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Mes proprietes
                </button>
                <button
                  onClick={() => navigate('/contracts')}
                  className="btn btn-secondary w-full justify-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Voir mes contrats
                </button>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Performance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Taux d'occupation</span>
                  <span className="font-semibold text-gray-900">
                    {statistics?.totalProperties
                      ? Math.round(((statistics.occupiedProperties || 0) / statistics.totalProperties) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        statistics?.totalProperties
                          ? Math.round(((statistics.occupiedProperties || 0) / statistics.totalProperties) * 100)
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-700">Biens publies</span>
                  <span className="font-semibold text-gray-900">
                    {statistics?.totalProperties
                      ? Math.round(
                          (((statistics.availableProperties || 0) + (statistics.occupiedProperties || 0)) /
                            statistics.totalProperties) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        statistics?.totalProperties
                          ? Math.round(
                              (((statistics.availableProperties || 0) + (statistics.occupiedProperties || 0)) /
                                statistics.totalProperties) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Euro className="w-5 h-5 text-green-600" />
                Revenus Mensuels
              </h3>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-700">{monthlyRevenue.toFixed(2)}EUR</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Contrats actifs</span>
                  <span className="font-semibold text-gray-900">
                    {activeContracts.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">Conseil du jour</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Des photos de qualite augmentent jusqu'a 40% les chances de location. Pensez
                a mettre a jour vos images regulierement !
              </p>
            </div>
          </div>
        </div>

        {/* Empty State for First Time Users */}
        {statistics?.totalProperties === 0 && (
          <div className="card text-center py-12 mt-6">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenue sur votre tableau de bord !
              </h2>
              <p className="text-gray-600 mb-6">
                Commencez par ajouter votre premiere propriete pour voir vos statistiques
                apparaitre ici.
              </p>
              <Link to="/properties/new" className="btn btn-primary inline-flex">
                <Plus className="w-5 h-5 mr-2" />
                Creer ma premiere propriete
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </Layout>
  )
}
