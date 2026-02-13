import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
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
  BarChart3,
  ArrowRight,
  MapPin,
  Bed,
  Bath,
  Square,
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

  useEffect(() => {
    fetchMyStatistics()
    fetchMyProperties({ page: 1, limit: 5 }) // Fetch only 5 most recent
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
              {property.surface}m²
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-primary-600">{property.price}€</p>
          <p className="text-xs text-gray-500">/ mois</p>
        </div>
      </div>
    )
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
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-primary-600" />
                Tableau de Bord
              </h1>
              <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Home}
            label="Total Biens"
            value={statistics?.totalProperties || 0}
            subtext="Propriétés enregistrées"
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
            icon={Clock}
            label="Pas sur le marché"
            value={statistics?.draftProperties || 0}
            subtext="Non publiés"
            color="yellow"
          />
        </div>

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
            label="Contacts Reçus"
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
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Propriétés Récentes
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
                  <p className="text-gray-600 mb-4">Aucune propriété pour le moment</p>
                  <Link to="/properties/new" className="btn btn-primary inline-flex">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer votre première propriété
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
                  onClick={() => navigate('/properties/owner/me')}
                  className="btn btn-secondary w-full justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Mes propriétés
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
                  <span className="text-sm text-gray-700">Biens publiés</span>
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

            {/* Revenue Estimate (if properties have prices) */}
            {statistics && statistics.total > 0 && (
              <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Euro className="w-5 h-5 text-green-600" />
                  Revenus Potentiels
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Propriétés en location</span>
                    <span className="font-semibold text-gray-900">
                      {statistics.occupiedProperties || 0} biens
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Conseil : Vérifiez régulièrement vos propriétés disponibles pour
                    maximiser votre taux d'occupation.
                  </p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">💡 Conseil du jour</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Des photos de qualité augmentent jusqu'à 40% les chances de location. Pensez
                à mettre à jour vos images régulièrement !
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
                Commencez par ajouter votre première propriété pour voir vos statistiques
                apparaître ici.
              </p>
              <Link to="/properties/new" className="btn btn-primary inline-flex">
                <Plus className="w-5 h-5 mr-2" />
                Créer ma première propriété
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </Layout>
  )
}
