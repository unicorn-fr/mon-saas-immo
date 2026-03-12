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

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
}

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

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      valueColor: '#1d1d1f',
      iconBg: '#eff6ff',
      icon: <Home className="w-5 h-5" style={{ color: '#3b82f6' }} />,
    },
    {
      label: 'En attente',
      value: stats.pending,
      valueColor: '#d97706',
      iconBg: '#fffbeb',
      icon: <Clock className="w-5 h-5" style={{ color: '#d97706' }} />,
    },
    {
      label: 'Confirmées',
      value: stats.confirmed,
      valueColor: '#059669',
      iconBg: '#ecfdf5',
      icon: <CheckCircle className="w-5 h-5" style={{ color: '#059669' }} />,
    },
    {
      label: 'Annulées',
      value: stats.cancelled,
      valueColor: '#dc2626',
      iconBg: '#fef2f2',
      icon: <XCircle className="w-5 h-5" style={{ color: '#dc2626' }} />,
    },
  ]

  return (
    <Layout>
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f5f5f7' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Mes réservations</h1>
            <p className="text-slate-500 text-sm">
              Consultez et gérez vos demandes de visite
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, valueColor, iconBg, icon }) => (
              <div key={label} className="p-5 rounded-2xl" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold" style={{ color: valueColor }}>{value}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters and View Toggle */}
          <div className="p-5 mb-5 rounded-2xl" style={cardStyle}>
            <div className="flex items-center gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as BookingStatus | 'all')}
                  className="flex-1 px-4 py-2 rounded-xl text-sm text-slate-700 outline-none transition-all"
                  style={{
                    border: '1px solid #d2d2d7',
                    background: '#ffffff',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d2d2d7'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="CONFIRMED">Confirmées</option>
                  <option value="CANCELLED">Annulées</option>
                  <option value="COMPLETED">Terminées</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={viewMode === 'list'
                    ? { background: '#ffffff', color: '#1d1d1f', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { color: '#64748b' }}
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={viewMode === 'calendar'
                    ? { background: '#ffffff', color: '#1d1d1f', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { color: '#64748b' }}
                >
                  Calendrier
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-2xl p-4 mb-5 flex items-start gap-3"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Erreur</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading && !bookings.length ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-400 animate-spin" />
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
                <div className="rounded-2xl p-12 text-center" style={cardStyle}>
                  <CalendarIcon className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Aucune réservation
                  </h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    {selectedStatus !== 'all'
                      ? 'Aucune réservation ne correspond à votre filtre.'
                      : 'Vous n\'avez pas encore de réservations. Commencez à explorer des propriétés !'}
                  </p>
                  {selectedStatus === 'all' && (
                    <a
                      href="/search"
                      className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
                      style={{ background: '#3b82f6' }}
                    >
                      <Home className="w-4 h-4" />
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
            <div className="mt-6 text-center text-sm text-slate-400">
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
