import { useEffect, useState } from 'react'
import {
  Calendar as CalendarIcon,
  Filter,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
} from 'lucide-react'
import { useBookings } from '../../hooks/useBookings'
import { useProperties } from '../../hooks/useProperties'
import { BookingCard } from '../../components/booking/BookingCard'
import { CancelBookingModal } from '../../components/booking/CancelBookingModal'
import { Calendar } from '../../components/booking/Calendar'
import { BookingStatus } from '../../types/booking.types'
import { Layout } from '../../components/layout/Layout'

type ViewMode = 'list' | 'calendar'

export const BookingManagement = () => {
  const {
    bookings,
    bookingsTotal,
    statistics,
    isLoading,
    error,
    fetchBookings,
    fetchOwnerStatistics,
    confirmBooking,
    cancelBooking,
  } = useBookings()

  const { properties, fetchProperties } = useProperties()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOwnerStatistics()
    fetchProperties()
  }, [fetchOwnerStatistics, fetchProperties])

  useEffect(() => {
    const filters: any = {}
    if (selectedProperty !== 'all') filters.propertyId = selectedProperty
    if (selectedStatus !== 'all') filters.status = selectedStatus

    fetchBookings(filters)
  }, [selectedProperty, selectedStatus, fetchBookings])

  // Filter bookings by search query
  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      booking.property.title.toLowerCase().includes(query) ||
      booking.tenant.firstName.toLowerCase().includes(query) ||
      booking.tenant.lastName.toLowerCase().includes(query) ||
      booking.tenant.email.toLowerCase().includes(query)
    )
  })

  // Handle confirm booking
  const handleConfirmBooking = async (id: string) => {
    setActionLoading(id)
    try {
      await confirmBooking(id)
    } catch (err) {
      console.error('Failed to confirm booking:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle cancel booking - open modal
  const handleCancelBooking = (id: string) => {
    setCancelModalBookingId(id)
  }

  // Handle cancel confirm from modal
  const handleCancelConfirm = async (reason: string) => {
    if (!cancelModalBookingId) return

    setActionLoading(cancelModalBookingId)
    try {
      await cancelBooking(cancelModalBookingId, reason)
      setCancelModalBookingId(null)
    } catch (err) {
      console.error('Failed to cancel booking:', err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des réservations</h1>
          <p className="text-gray-600">
            Gérez les demandes de visite de vos propriétés
          </p>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statistics.pending}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Confirmées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.confirmed}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Annulées</p>
                  <p className="text-2xl font-bold text-red-600">
                    {statistics.cancelled}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Terminées</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {statistics.completed}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Property Filter */}
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Toutes les propriétés</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as BookingStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="CONFIRMED">Confirmées</option>
              <option value="CANCELLED">Annulées</option>
              <option value="COMPLETED">Terminées</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`
                  flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`
                  flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    viewMode === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                Calendrier
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Erreur</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading && !bookings.length ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : viewMode === 'calendar' ? (
          <Calendar
            bookings={bookings}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            minDate={new Date(new Date().setMonth(new Date().getMonth() - 6))}
          />
        ) : (
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune réservation
                </h3>
                <p className="text-gray-600">
                  {searchQuery || selectedProperty !== 'all' || selectedStatus !== 'all'
                    ? 'Aucune réservation ne correspond à vos filtres.'
                    : 'Vous n\'avez pas encore reçu de demandes de visite.'}
                </p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  viewMode="owner"
                  onConfirm={handleConfirmBooking}
                  onCancel={handleCancelBooking}
                  isLoading={actionLoading === booking.id}
                />
              ))
            )}
          </div>
        )}

        {/* Pagination Info */}
        {filteredBookings.length > 0 && viewMode === 'list' && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Affichage de {filteredBookings.length} sur {bookingsTotal} réservation
            {bookingsTotal > 1 ? 's' : ''}
          </div>
        )}
        </div>
      </div>

      {/* Cancel Booking Modal */}
      <CancelBookingModal
        isOpen={cancelModalBookingId !== null}
        onClose={() => setCancelModalBookingId(null)}
        onConfirm={handleCancelConfirm}
        isLoading={actionLoading !== null}
      />
    </Layout>
  )
}

export default BookingManagement
