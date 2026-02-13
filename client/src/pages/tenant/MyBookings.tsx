import { useEffect, useState } from 'react'
import {
  Calendar as CalendarIcon,
  Filter,
  Loader,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Home,
} from 'lucide-react'
import { useBookings } from '../../hooks/useBookings'
import { BookingCard } from '../../components/booking/BookingCard'
import { CancelBookingModal } from '../../components/booking/CancelBookingModal'
import { Calendar } from '../../components/booking/Calendar'
import { BookingStatus } from '../../types/booking.types'
import { Layout } from '../../components/layout/Layout'

type ViewMode = 'list' | 'calendar'

export const MyBookings = () => {
  const {
    bookings,
    bookingsTotal,
    isLoading,
    error,
    fetchBookings,
    cancelBooking,
  } = useBookings()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null)

  useEffect(() => {
    const filters: any = {}
    if (selectedStatus !== 'all') filters.status = selectedStatus
    fetchBookings(filters)
  }, [selectedStatus, fetchBookings])

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

  // Calculate statistics from bookings
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes réservations</h1>
          <p className="text-gray-600">
            Consultez et gérez vos demandes de visite
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as BookingStatus | 'all')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmées</option>
                <option value="CANCELLED">Annulées</option>
                <option value="COMPLETED">Terminées</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
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
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
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
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune réservation
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedStatus !== 'all'
                    ? 'Aucune réservation ne correspond à votre filtre.'
                    : 'Vous n\'avez pas encore de réservations. Commencez à explorer des propriétés !'}
                </p>
                {selectedStatus === 'all' && (
                  <a
                    href="/search"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    Explorer les propriétés
                  </a>
                )}
              </div>
            ) : (
              bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  viewMode="tenant"
                  onCancel={handleCancelBooking}
                  isLoading={actionLoading === booking.id}
                />
              ))
            )}
          </div>
        )}

        {/* Pagination Info */}
        {bookings.length > 0 && viewMode === 'list' && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Affichage de {bookings.length} sur {bookingsTotal} réservation
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

export default MyBookings
