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

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      valueColor: '#0d0c0a',
      iconBg: '#f4f2ee',
      icon: <Home className="w-5 h-5" style={{ color: '#5a5754' }} />,
    },
    {
      label: 'En attente',
      value: stats.pending,
      valueColor: '#92400e',
      iconBg: '#fdf5ec',
      icon: <Clock className="w-5 h-5" style={{ color: '#92400e' }} />,
    },
    {
      label: 'Confirmées',
      value: stats.confirmed,
      valueColor: '#1b5e3b',
      iconBg: '#edf7f2',
      icon: <CheckCircle className="w-5 h-5" style={{ color: '#1b5e3b' }} />,
    },
    {
      label: 'Annulées',
      value: stats.cancelled,
      valueColor: '#9b1c1c',
      iconBg: '#fef2f2',
      icon: <XCircle className="w-5 h-5" style={{ color: '#9b1c1c' }} />,
    },
  ]

  return (
    <Layout>
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <p
              className="uppercase tracking-widest mb-1"
              style={{ fontSize: 10, color: '#9e9b96', letterSpacing: '0.12em' }}
            >
              Espace locataire
            </p>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 40,
                color: '#0d0c0a',
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              Mes visites
            </h1>
            <p style={{ fontSize: 14, color: '#5a5754' }}>
              Consultez et gérez vos demandes de visite
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, valueColor, iconBg, icon }) => (
              <div
                key={label}
                className="p-5"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e4e1db',
                  borderRadius: 12,
                  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 12, color: '#9e9b96', marginBottom: 4 }}>{label}</p>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 28,
                        fontWeight: 700,
                        color: valueColor,
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                  <div
                    className="w-11 h-11 flex items-center justify-center"
                    style={{ background: iconBg, borderRadius: 10 }}
                  >
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters and View Toggle */}
          <div
            className="p-4 mb-5"
            style={{
              background: '#ffffff',
              border: '1px solid #e4e1db',
              borderRadius: 12,
              boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
            }}
          >
            <div className="flex items-center gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-4 h-4" style={{ color: '#9e9b96' }} />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as BookingStatus | 'all')}
                  className="flex-1 px-3 py-2 text-sm outline-none transition-all"
                  style={{
                    border: '1px solid #e4e1db',
                    background: '#f8f7f4',
                    borderRadius: 8,
                    color: '#0d0c0a',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1b5e3b'
                    e.target.style.boxShadow = '0 0 0 2px rgba(27,94,59,0.10)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e4e1db'
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
              <div
                className="flex items-center gap-1 p-1"
                style={{ background: '#f4f2ee', borderRadius: 10 }}
              >
                <button
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 text-sm font-medium transition-all"
                  style={
                    viewMode === 'list'
                      ? {
                          background: '#ffffff',
                          color: '#1b5e3b',
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }
                      : { color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif" }
                  }
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className="px-4 py-2 text-sm font-medium transition-all"
                  style={
                    viewMode === 'calendar'
                      ? {
                          background: '#ffffff',
                          color: '#1b5e3b',
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }
                      : { color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif" }
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
              className="p-4 mb-5 flex items-start gap-3"
              style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10 }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#9b1c1c' }} />
              <div>
                <p style={{ fontWeight: 600, color: '#9b1c1c', fontSize: 14 }}>Erreur</p>
                <p style={{ fontSize: 13, color: '#9b1c1c', opacity: 0.8 }}>{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading && !bookings.length ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin" style={{ color: '#1b5e3b' }} />
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
                <div
                  className="p-12 text-center"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e4e1db',
                    borderRadius: 12,
                    boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                  }}
                >
                  <div
                    className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                    style={{ background: '#f4f2ee', borderRadius: '50%' }}
                  >
                    <CalendarIcon className="w-7 h-7" style={{ color: '#9e9b96' }} />
                  </div>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 22,
                      fontStyle: 'italic',
                      color: '#0d0c0a',
                      marginBottom: 8,
                    }}
                  >
                    Aucune visite
                  </p>
                  <p style={{ fontSize: 13, color: '#5a5754', marginBottom: 20 }}>
                    {selectedStatus !== 'all'
                      ? 'Aucune réservation ne correspond à votre filtre.'
                      : 'Vous n\'avez pas encore de visites. Commencez à explorer des propriétés\u00a0!'}
                  </p>
                  {selectedStatus === 'all' && (
                    <a
                      href="/search"
                      className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
                      style={{
                        background: '#1b5e3b',
                        color: '#ffffff',
                        borderRadius: 8,
                        padding: '10px 20px',
                        fontSize: 13,
                        fontWeight: 500,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}
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
            <div className="mt-6 text-center" style={{ fontSize: 13, color: '#9e9b96' }}>
              Affichage de {bookings.length} sur {bookingsTotal} visite
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
