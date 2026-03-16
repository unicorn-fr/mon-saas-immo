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

// ─── Maison tokens ────────────────────────────────────────────────────────────

const M = {
  bg:           '#fafaf8',
  surface:      '#ffffff',
  muted:        '#f4f2ee',
  inputBg:      '#f8f7f4',
  ink:          '#0d0c0a',
  inkMid:       '#5a5754',
  inkFaint:     '#9e9b96',
  caramel:      '#c4976a',
  caramelLight: '#fdf5ec',
  owner:        '#1a3270',
  ownerLight:   '#eaf0fb',
  ownerBorder:  '#b8ccf0',
  border:       '#e4e1db',
  borderMid:    '#ccc9c3',
  danger:       '#9b1c1c',
  dangerBg:     '#fef2f2',
  warning:      '#92400e',
  warningBg:    '#fdf5ec',
  success:      '#1b5e3b',
  successBg:    '#edf7f2',
}

const cardStyle: React.CSSProperties = {
  background: M.surface,
  border: `1px solid ${M.border}`,
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

const inputStyle: React.CSSProperties = {
  background: M.inputBg,
  border: `1px solid ${M.border}`,
  borderRadius: 8,
  padding: '0.625rem 1rem',
  color: M.ink,
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  fontFamily: "'DM Sans', system-ui, sans-serif",
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
    {
      label: 'Total',
      value: statistics.total,
      icon: <CalendarIcon className="w-5 h-5" />,
      bg: M.ownerLight,
      border: M.ownerBorder,
      color: M.owner,
    },
    {
      label: 'En attente',
      value: statistics.pending,
      icon: <Clock className="w-5 h-5" />,
      bg: M.warningBg,
      border: '#e8c98b',
      color: M.warning,
    },
    {
      label: 'Confirmées',
      value: statistics.confirmed,
      icon: <CheckCircle className="w-5 h-5" />,
      bg: M.successBg,
      border: '#a8d5bc',
      color: M.success,
    },
    {
      label: 'Annulées',
      value: statistics.cancelled,
      icon: <XCircle className="w-5 h-5" />,
      bg: M.dangerBg,
      border: '#f5c6c6',
      color: M.danger,
    },
    {
      label: 'Terminées',
      value: statistics.completed,
      icon: <TrendingUp className="w-5 h-5" />,
      bg: M.muted,
      border: M.border,
      color: M.inkMid,
    },
  ] : []

  return (
    <Layout>
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: M.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Page header — Maison style */}
          <div className="mb-8">
            <p
              className="uppercase tracking-widest mb-1"
              style={{ fontSize: 10, color: M.inkFaint, letterSpacing: '0.12em' }}
            >
              Propriétaire
            </p>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 40,
                color: M.ink,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Visites
            </h1>
            <p className="mt-1.5" style={{ fontSize: 14, color: M.inkMid }}>
              Gérez les demandes de visite de vos propriétés
            </p>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {statCards.map(({ label, value, icon, bg, border, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 p-5"
                  style={cardStyle}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg, border: `1px solid ${border}`, color }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: M.inkFaint, marginBottom: 2 }}>{label}</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: M.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters and View Toggle */}
          <div
            className="p-5 mb-6"
            style={cardStyle}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: M.inkFaint }}
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = M.owner
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${M.ownerLight}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = M.border
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Property Filter */}
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = M.owner
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${M.ownerLight}`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = M.border
                  e.currentTarget.style.boxShadow = 'none'
                }}
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
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = M.owner
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${M.ownerLight}`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = M.border
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmées</option>
                <option value="CANCELLED">Annulées</option>
                <option value="COMPLETED">Terminées</option>
              </select>

              {/* View Toggle */}
              <div
                className="flex items-center gap-1 p-1"
                style={{ background: M.muted, border: `1px solid ${M.border}`, borderRadius: 10 }}
              >
                <button
                  onClick={() => setViewMode('list')}
                  className="flex-1 py-2 px-3 text-sm font-semibold transition-all"
                  style={
                    viewMode === 'list'
                      ? {
                          background: M.surface,
                          color: M.owner,
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                        }
                      : { background: 'transparent', color: M.inkMid, borderRadius: 8 }
                  }
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className="flex-1 py-2 px-3 text-sm font-semibold transition-all"
                  style={
                    viewMode === 'calendar'
                      ? {
                          background: M.surface,
                          color: M.owner,
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                        }
                      : { background: 'transparent', color: M.inkMid, borderRadius: 8 }
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
              className="p-4 mb-6 flex items-start gap-3"
              style={{
                background: M.dangerBg,
                border: `1px solid #f5c6c6`,
                borderRadius: 10,
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: M.danger }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: M.danger }}>Erreur</p>
                <p className="text-sm" style={{ color: '#7f1d1d' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading && !bookings.length ? (
            <div
              className="flex items-center justify-center py-16"
              style={cardStyle}
            >
              <Loader className="w-7 h-7 animate-spin" style={{ color: M.owner }} />
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
                  className="p-12 text-center"
                  style={cardStyle}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: M.ownerLight }}
                  >
                    <CalendarIcon className="w-8 h-8" style={{ color: M.owner }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: 22,
                      color: M.ink,
                      marginBottom: 8,
                    }}
                  >
                    Aucune visite
                  </h3>
                  <p style={{ fontSize: 13, color: M.inkMid }}>
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
            <div
              className="mt-6 text-center text-sm"
              style={{ color: M.inkFaint }}
            >
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
