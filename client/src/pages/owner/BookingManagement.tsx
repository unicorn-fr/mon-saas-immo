import { useEffect, useState } from 'react'
import {
  Calendar as CalendarIcon,
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

const inputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '0.75rem',
  padding: '0.625rem 1rem',
  color: '#1d1d1f',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  fontFamily: '"Plus Jakarta Sans", Inter, system-ui',
}

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

  const handleCancelBooking = (id: string) => {
    setCancelModalBookingId(id)
  }

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

  const statCards = statistics ? [
    { label: 'Total',      value: statistics.total,     icon: <CalendarIcon className="w-5 h-5" />, bg: '#e8f0fe', border: '#aacfff', color: '#007AFF' },
    { label: 'En attente', value: statistics.pending,   icon: <Clock className="w-5 h-5" />,        bg: '#fffbeb', border: '#fde68a', color: '#d97706' },
    { label: 'Confirmées', value: statistics.confirmed, icon: <CheckCircle className="w-5 h-5" />,  bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
    { label: 'Annulées',   value: statistics.cancelled, icon: <XCircle className="w-5 h-5" />,      bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
    { label: 'Terminées',  value: statistics.completed, icon: <TrendingUp className="w-5 h-5" />,   bg: '#f5f5f7', border: '#d2d2d7', color: '#64748b' },
  ] : []

  return (
    <Layout>
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f5f5f7', fontFamily: '"Plus Jakarta Sans", Inter, system-ui' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#1d1d1f' }}>
              Gestion des réservations
            </h1>
            <p className="text-sm" style={{ color: '#515154' }}>
              Gérez les demandes de visite de vos propriétés
            </p>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {statCards.map(({ label, value, icon, bg, border, color }) => (
                <div
                  key={label}
                  className="rounded-2xl p-5 flex items-center gap-4"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #d2d2d7',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg, border: `1px solid ${border}`, color }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: '#86868b' }}>{label}</p>
                    <p className="text-2xl font-bold" style={{ color: '#1d1d1f' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters and View Toggle */}
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: '#ffffff',
              border: '1px solid #d2d2d7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#86868b' }} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#007AFF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#d2d2d7'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Property Filter */}
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#007AFF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d2d2d7'; e.currentTarget.style.boxShadow = 'none' }}
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
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#007AFF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d2d2d7'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmées</option>
                <option value="CANCELLED">Annulées</option>
                <option value="COMPLETED">Terminées</option>
              </select>

              {/* View Toggle */}
              <div
                className="flex items-center gap-1 p-1 rounded-xl"
                style={{ background: '#f5f5f7', border: '1px solid #d2d2d7' }}
              >
                <button
                  onClick={() => setViewMode('list')}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
                  style={
                    viewMode === 'list'
                      ? { background: '#ffffff', color: '#1d1d1f', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { background: 'transparent', color: '#86868b' }
                  }
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
                  style={
                    viewMode === 'calendar'
                      ? { background: '#ffffff', color: '#1d1d1f', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { background: 'transparent', color: '#86868b' }
                  }
                >
                  Calendrier
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div
              className="rounded-xl p-4 mb-6 flex items-start gap-3"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#dc2626' }}>Erreur</p>
                <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading && !bookings.length ? (
            <div
              className="flex items-center justify-center py-16 rounded-2xl"
              style={{ background: '#ffffff', border: '1px solid #d2d2d7' }}
            >
              <Loader className="w-7 h-7 animate-spin" style={{ color: '#007AFF' }} />
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
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #d2d2d7',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: '#e8f0fe' }}
                  >
                    <CalendarIcon className="w-8 h-8" style={{ color: '#007AFF' }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#1d1d1f' }}>
                    Aucune réservation
                  </h3>
                  <p className="text-sm" style={{ color: '#515154' }}>
                    {searchQuery || selectedProperty !== 'all' || selectedStatus !== 'all'
                      ? 'Aucune réservation ne correspond à vos filtres.'
                      : "Vous n'avez pas encore reçu de demandes de visite."}
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
            <div className="mt-6 text-center text-sm" style={{ color: '#86868b' }}>
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
