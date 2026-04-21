import { useEffect, useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  MapPin,
} from 'lucide-react'
import { format, parseISO, isAfter } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useBookings } from '../../hooks/useBookings'
import { useProperties } from '../../hooks/useProperties'
import { BookingCard } from '../../components/booking/BookingCard'
import { CancelBookingModal } from '../../components/booking/CancelBookingModal'
import { Calendar } from '../../components/booking/Calendar'
import { VisitSlotsManager } from '../../components/booking/VisitSlotsManager'
import { BookingStatus } from '../../types/booking.types'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'

type ViewMode = 'list' | 'calendar'

// ─── Maison tokens ────────────────────────────────────────────────────────────


const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

const inputStyle: React.CSSProperties = {
  background: BAI.bgInput,
  border: `1px solid ${BAI.border}`,
  borderRadius: 8,
  padding: '0.625rem 1rem',
  color: BAI.ink,
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

  // ── Prochains RDV confirmés ───────────────────────────────────────────────
  const upcomingConfirmed = useMemo(() => {
    const now = new Date()
    return bookings
      .filter((b) => {
        if (b.status !== 'CONFIRMED') return false
        try {
          const dt = parseISO(`${b.visitDate}T${b.visitTime}`)
          return isAfter(dt, now)
        } catch {
          return false
        }
      })
      .sort((a, b) => {
        const da = parseISO(`${a.visitDate}T${a.visitTime}`)
        const db = parseISO(`${b.visitDate}T${b.visitTime}`)
        return da.getTime() - db.getTime()
      })
      .slice(0, 3)
  }, [bookings])

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
      (booking.property?.title ?? '').toLowerCase().includes(query) ||
      (booking.tenant?.firstName ?? '').toLowerCase().includes(query) ||
      (booking.tenant?.lastName ?? '').toLowerCase().includes(query) ||
      (booking.tenant?.email ?? '').toLowerCase().includes(query)
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
      bg: BAI.ownerLight,
      border: BAI.ownerBorder,
      color: BAI.owner,
    },
    {
      label: 'En attente',
      value: statistics.pending,
      icon: <Clock className="w-5 h-5" />,
      bg: BAI.warningLight,
      border: '#e8c98b',
      color: BAI.warning,
    },
    {
      label: 'Confirmées',
      value: statistics.confirmed,
      icon: <CheckCircle className="w-5 h-5" />,
      bg: BAI.successLight,
      border: '#a8d5bc',
      color: BAI.success,
    },
    {
      label: 'Annulées',
      value: statistics.cancelled,
      icon: <XCircle className="w-5 h-5" />,
      bg: BAI.errorLight,
      border: '#f5c6c6',
      color: BAI.error,
    },
    {
      label: 'Terminées',
      value: statistics.completed,
      icon: <TrendingUp className="w-5 h-5" />,
      bg: BAI.bgMuted,
      border: BAI.border,
      color: BAI.inkMid,
    },
  ] : []

  return (
    <Layout>
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: BAI.bgBase, fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Page header — Maison style */}
          <div className="mb-8">
            <p
              className="uppercase tracking-widest mb-1"
              style={{ fontSize: 10, color: BAI.inkFaint, letterSpacing: '0.12em' }}
            >
              Propriétaire
            </p>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 40,
                color: BAI.ink,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Visites
            </h1>
            <p className="mt-1.5" style={{ fontSize: 14, color: BAI.inkMid }}>
              Gérez les demandes de visite de vos propriétés
            </p>
          </div>

          {/* Prochains rendez-vous */}
          {upcomingConfirmed.length > 0 && (
            <div className="mb-8">
              <p
                className="uppercase tracking-widest mb-3"
                style={{ fontSize: 10, color: BAI.inkFaint, letterSpacing: '0.12em' }}
              >
                Prochains rendez-vous
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingConfirmed.map((booking) => {
                  let visitDt: Date | null = null
                  try { visitDt = parseISO(`${booking.visitDate}T${booking.visitTime}`) } catch { /* */ }
                  return (
                    <div
                      key={booking.id}
                      className="flex items-start gap-4 p-4"
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${BAI.tenantBorder}`,
                        borderRadius: 12,
                        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                      }}
                    >
                      {/* Icône date */}
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                        style={{ background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}` }}
                      >
                        {visitDt ? (
                          <>
                            <span style={{ fontSize: 9, color: BAI.tenant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
                              {format(visitDt, 'MMM', { locale: fr })}
                            </span>
                            <span style={{ fontSize: 20, color: BAI.tenant, fontWeight: 700, lineHeight: 1 }}>
                              {format(visitDt, 'd')}
                            </span>
                          </>
                        ) : (
                          <CheckCircle className="w-5 h-5" style={{ color: BAI.tenant }} />
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, marginBottom: 2 }}>
                          {booking.tenant?.firstName ?? 'Locataire'} {booking.tenant?.lastName ?? ''}
                        </p>
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: BAI.inkFaint }} />
                          <p className="truncate" style={{ fontSize: 12, color: BAI.inkMid }}>
                            {booking.property?.title ?? 'Logement'}
                          </p>
                        </div>
                        {visitDt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" style={{ color: BAI.inkFaint }} />
                            <p style={{ fontSize: 12, color: BAI.inkFaint }}>
                              {format(visitDt, "EEEE d MMMM · HH'h'mm", { locale: fr })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
                    <p style={{ fontSize: 12, color: BAI.inkFaint, marginBottom: 2 }}>{label}</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: BAI.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}
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
                  style={{ color: BAI.inkFaint }}
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = BAI.owner
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${BAI.ownerLight}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = BAI.border
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
                  e.currentTarget.style.borderColor = BAI.owner
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${BAI.ownerLight}`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BAI.border
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
                  e.currentTarget.style.borderColor = BAI.owner
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${BAI.ownerLight}`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BAI.border
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
                style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 10 }}
              >
                <button
                  onClick={() => setViewMode('list')}
                  className="flex-1 py-2 px-3 text-sm font-semibold transition-all"
                  style={
                    viewMode === 'list'
                      ? {
                          background: BAI.bgSurface,
                          color: BAI.owner,
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                        }
                      : { background: 'transparent', color: BAI.inkMid, borderRadius: 8 }
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
                          background: BAI.bgSurface,
                          color: BAI.owner,
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                        }
                      : { background: 'transparent', color: BAI.inkMid, borderRadius: 8 }
                  }
                >
                  Calendrier
                </button>
              </div>
            </div>
          </div>

          {/* Visit Slots Manager */}
          {selectedProperty !== 'all' && (
            <div className="mb-6">
              <VisitSlotsManager propertyId={selectedProperty} />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              className="p-4 mb-6 flex items-start gap-3"
              style={{
                background: BAI.errorLight,
                border: `1px solid #f5c6c6`,
                borderRadius: 10,
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BAI.error }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: BAI.error }}>Erreur</p>
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
              <Loader className="w-7 h-7 animate-spin" style={{ color: BAI.owner }} />
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
                    style={{ background: BAI.ownerLight }}
                  >
                    <CalendarIcon className="w-8 h-8" style={{ color: BAI.owner }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: 22,
                      color: BAI.ink,
                      marginBottom: 8,
                    }}
                  >
                    Aucune visite
                  </h3>
                  <p style={{ fontSize: 13, color: BAI.inkMid }}>
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
              style={{ color: BAI.inkFaint }}
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
