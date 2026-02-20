import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Heart,
  MessageSquare,
  Search,
  Home,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  Loader,
  CheckCircle,
  Eye,
  FileText,
  Euro,
  PenTool,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useBookings } from '../../hooks/useBookings'
import { useFavoriteStore } from '../../store/favoriteStore'
import { useMessages } from '../../hooks/useMessages'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { Layout } from '../../components/layout/Layout'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function TenantDashboard() {
  const { user } = useAuth()
  const { bookings, fetchBookings, isLoading: isLoadingBookings } = useBookings()
  const { favoriteIds, loadFavorites } = useFavoriteStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const { properties, fetchProperties, isLoading: isLoadingProperties } = useProperties()
  const {
    contracts,
    statistics: contractStats,
    fetchContracts,
    fetchStatistics: fetchContractStatistics,
  } = useContractStore()

  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([])

  useEffect(() => {
    fetchBookings()
    loadFavorites()
    fetchUnreadCount()
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
  }, [fetchBookings, loadFavorites, fetchUnreadCount, fetchContracts, fetchContractStatistics])

  // Fetch favorite properties details
  useEffect(() => {
    const fetchFavoriteProperties = async () => {
      if (favoriteIds.size > 0) {
        await fetchProperties()
      }
    }
    fetchFavoriteProperties()
  }, [favoriteIds, fetchProperties])

  // Filter favorite properties
  useEffect(() => {
    if (properties.length > 0) {
      const favProps = properties.filter((p) => favoriteIds.has(p.id))
      setFavoriteProperties(favProps.slice(0, 4))
    }
  }, [properties, favoriteIds])

  // Get upcoming bookings
  const upcomingBookings = bookings
    .filter((b) => {
      const visitDate = new Date(b.visitDate)
      const isPendingOrConfirmed = b.status === 'PENDING' || b.status === 'CONFIRMED'
      return isPendingOrConfirmed && visitDate >= new Date()
    })
    .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
    .slice(0, 3)

  // Contract data
  const activeContract = contracts.find((c) => c.status === 'ACTIVE')
  const pendingSignatureContracts = contracts.filter(
    (c) => ['SENT', 'SIGNED_OWNER'].includes(c.status) && !c.signedByTenant
  )

  // Calculate stats
  const stats = {
    bookings: {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    },
    favorites: favoriteIds.size,
    messages: unreadCount,
    contracts: contractStats?.total || 0,
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour {user?.firstName}
          </h1>
          <p className="text-gray-600">
            Bienvenue sur votre tableau de bord. Voici un apercu de votre activite.
          </p>
        </div>

        {/* Signature Alert Banner */}
        {pendingSignatureContracts.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-300 rounded-xl flex items-start gap-3">
            <PenTool className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-orange-900">
                {pendingSignatureContracts.length === 1
                  ? 'Un contrat attend votre signature'
                  : `${pendingSignatureContracts.length} contrats attendent votre signature`}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Un proprietaire vous a envoye un contrat de location. Lisez-le et signez-le pour finaliser votre bail.
              </p>
              <Link
                to={`/contracts/${pendingSignatureContracts[0].id}`}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                <PenTool className="w-4 h-4" />
                Voir et signer le contrat
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Bookings */}
          <Link
            to="/my-bookings"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mes visites</p>
                <p className="text-3xl font-bold text-gray-900">{stats.bookings.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.bookings.pending} en attente
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Link>

          {/* Favorites */}
          <Link
            to="/favorites"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Favoris</p>
                <p className="text-3xl font-bold text-gray-900">{stats.favorites}</p>
                <p className="text-xs text-gray-500 mt-1">Proprietes sauvegardees</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Link>

          {/* Messages */}
          <Link
            to="/messages"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Messages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.messages}</p>
                <p className="text-xs text-gray-500 mt-1">Non lus</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Link>

          {/* Contracts */}
          <Link
            to="/contracts"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Contrats</p>
                <p className="text-3xl font-bold text-gray-900">{stats.contracts}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {contractStats?.active || 0} actif(s)
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Link>

          {/* Search CTA */}
          <Link
            to="/search"
            className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-100 mb-1">Nouvelle recherche</p>
                <p className="text-2xl font-bold">Trouver un bien</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Lease / Mon bail */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Mon bail
                </h2>
                <Link
                  to="/contracts"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Tous mes contrats
                </Link>
              </div>

              {activeContract ? (
                <Link
                  to={`/contracts/${activeContract.id}`}
                  className="block p-4 border border-green-200 bg-green-50/50 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {activeContract.property?.title}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {activeContract.property?.address}, {activeContract.property?.city}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3" />
                      Actif
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Loyer</p>
                      <p className="text-lg font-bold text-primary-600 flex items-center">
                        <Euro className="w-4 h-4 mr-0.5" />
                        {activeContract.monthlyRent}
                        <span className="text-sm font-normal text-gray-500">/mois</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Debut</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(activeContract.startDate), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fin</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(activeContract.endDate), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  {activeContract.charges != null && activeContract.charges > 0 && (
                    <p className="text-xs text-gray-500 mt-3">
                      + {activeContract.charges}EUR charges/mois | Total: {(activeContract.monthlyRent + activeContract.charges).toFixed(2)}EUR/mois
                    </p>
                  )}
                </Link>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Aucun bail actif</p>
                  <p className="text-sm text-gray-500">
                    Votre contrat de location apparaitra ici une fois active par le proprietaire.
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Visits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  Visites a venir
                </h2>
                <Link
                  to="/my-bookings"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>

              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Aucune visite programmee</p>
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Rechercher un bien
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      to={`/property/${booking.property.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {booking.property.images?.[0] ? (
                          <img
                            src={booking.property.images[0]}
                            alt={booking.property.title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Home className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 truncate">
                            {booking.property.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {booking.property.city}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-700">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(booking.visitDate), 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="flex items-center gap-1 text-gray-700">
                              <Clock className="w-4 h-4" />
                              {booking.visitTime}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {booking.status === 'CONFIRMED' ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Confirmee
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  En attente
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Properties */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Mes favoris
                </h2>
                <Link
                  to="/favorites"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>

              {isLoadingProperties ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : favoriteProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Aucun favori pour le moment</p>
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Decouvrir des biens
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteProperties.map((property) => (
                    <Link
                      key={property.id}
                      to={`/property/${property.id}`}
                      className="block border border-gray-200 rounded-lg overflow-hidden hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                          <Home className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 truncate">
                          {property.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {property.city}
                        </p>
                        <p className="text-lg font-bold text-primary-600">
                          {property.price}EUR<span className="text-sm font-normal">/mois</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Link
                  to="/search"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Rechercher</p>
                    <p className="text-xs text-gray-600">Trouver un bien</p>
                  </div>
                </Link>

                <Link
                  to="/my-bookings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mes visites</p>
                    <p className="text-xs text-gray-600">Gerer reservations</p>
                  </div>
                </Link>

                <Link
                  to="/contracts"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mes contrats</p>
                    <p className="text-xs text-gray-600">Voir mes baux</p>
                  </div>
                </Link>

                <Link
                  to="/messages"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Messages</p>
                    <p className="text-xs text-gray-600">Contacter proprietaires</p>
                  </div>
                </Link>

                <Link
                  to="/favorites"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Favoris</p>
                    <p className="text-xs text-gray-600">Mes biens sauvegardes</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Conseils
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Visitez plusieurs biens avant de decider</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Preparez vos questions avant la visite</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Verifiez l'etat general du logement</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Renseignez-vous sur le quartier</span>
                </li>
              </ul>
            </div>

            {/* Activity Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Activite recente</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Recherches effectuees</span>
                  <span className="ml-auto font-semibold text-gray-900">-</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Visites reservees</span>
                  <span className="ml-auto font-semibold text-gray-900">
                    {stats.bookings.total}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Biens favoris</span>
                  <span className="ml-auto font-semibold text-gray-900">{stats.favorites}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Contrats</span>
                  <span className="ml-auto font-semibold text-gray-900">{stats.contracts}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
