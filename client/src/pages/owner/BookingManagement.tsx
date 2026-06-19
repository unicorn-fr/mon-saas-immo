import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import {
  Calendar as CalendarIcon,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  MapPin,
  Info,
  History,
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
import { BAI } from '../../constants/bailio-tokens'
import toast from 'react-hot-toast'

type ViewMode = 'list' | 'calendar'

const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 14,
  boxShadow: BAI.shadowMd,
}

const inputStyle: React.CSSProperties = {
  background: BAI.bgInput,
  border: `1px solid ${BAI.border}`,
  borderRadius: 8,
  padding: '0.625rem 1rem',
  color: BAI.ink,
  fontSize: '16px',
  outline: 'none',
  width: '100%',
  fontFamily: BAI.fontBody,
  minHeight: 44,
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

  const { myProperties: properties, fetchMyProperties: fetchProperties } = useProperties()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)

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

  const filteredBookings = useMemo(() => {
    const now = new Date()
    return bookings.filter((booking) => {
      // In list mode, hide past visits by default
      if (viewMode === 'list' && !showPast) {
        try {
          const dt = parseISO(`${booking.visitDate}T${booking.visitTime}`)
          if (!isAfter(dt, now)) return false
        } catch { /* keep */ }
      }
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        (booking.property?.title ?? '').toLowerCase().includes(query) ||
        (booking.tenant?.firstName ?? '').toLowerCase().includes(query) ||
        (booking.tenant?.lastName ?? '').toLowerCase().includes(query) ||
        (booking.tenant?.email ?? '').toLowerCase().includes(query)
      )
    })
  }, [bookings, viewMode, showPast, searchQuery])

  const handleConfirmBooking = async (id: string) => {
    setActionLoading(id)
    try {
      await confirmBooking(id)
    } catch (err) {
      console.error('Failed to confirm booking:', err)
      toast.error('Impossible de confirmer la visite. Veuillez réessayer.')
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
      toast.error('Impossible d\'annuler la visite. Veuillez réessayer.')
    } finally {
      setActionLoading(null)
    }
  }

  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768

  const statCards = statistics ? [
    {
      label: 'En attente',
      value: statistics.pending,
      icon: <Clock size={20} />,
      bg: BAI.warningLight,
      border: '#e8c98b',
      color: BAI.warning,
      accent: BAI.warning,
    },
    {
      label: 'Confirmées',
      value: statistics.confirmed,
      icon: <CheckCircle size={20} />,
      bg: BAI.successLight,
      border: '#a8d5bc',
      color: BAI.success,
      accent: BAI.success,
    },
    {
      label: 'Annulées',
      value: statistics.cancelled,
      icon: <XCircle size={20} />,
      bg: BAI.errorLight,
      border: '#f5c6c6',
      color: BAI.error,
      accent: BAI.error,
    },
  ] : []

  return (
    <>      <div
        style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(20px,4vw,48px) clamp(16px,3vw,32px)' }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 36 }}
          >
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 8,
            }}>
              Gestion des visites
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic',
              fontSize: 'clamp(26px, 4vw, 40px)', color: BAI.ink, lineHeight: 1.1, margin: '0 0 8px',
            }}>
              Visites
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
              Gérez les demandes de visite de vos propriétés
            </p>
          </motion.div>

          {/* ── Prochains rendez-vous ─────────────────────────────────── */}
          {upcomingConfirmed.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.28 }}
              style={{ marginBottom: 32 }}
            >
              <p style={{
                fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 14,
              }}>
                Prochains rendez-vous
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingConfirmed.map((booking) => {
                  let visitDt: Date | null = null
                  try { visitDt = parseISO(`${booking.visitDate}T${booking.visitTime}`) } catch { /* */ }
                  return (
                    <div
                      key={booking.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 16,
                        padding: 16,
                        background: BAI.bgSurface,
                        border: `1px solid ${BAI.tenantBorder}`,
                        borderRadius: 14,
                        boxShadow: BAI.shadowMd,
                        borderTop: `3px solid ${BAI.tenant}`,
                      }}
                    >
                      {/* Icône date */}
                      <div
                        style={{
                          flexShrink: 0, width: 52, height: 52, borderRadius: 12,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                        }}
                      >
                        {visitDt ? (
                          <>
                            <span style={{ fontSize: 9, color: BAI.tenant, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
                              {format(visitDt, 'MMM', { locale: fr })}
                            </span>
                            <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, color: BAI.tenant, fontWeight: 700, lineHeight: 1 }}>
                              {format(visitDt, 'd')}
                            </span>
                          </>
                        ) : (
                          <CheckCircle size={20} style={{ color: BAI.tenant }} />
                        )}
                      </div>

                      {/* Infos */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: BAI.ink, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {booking.tenant?.firstName ?? 'Locataire'} {booking.tenant?.lastName ?? ''}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <MapPin size={11} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: BAI.inkMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.property?.title ?? 'Logement'}
                          </p>
                        </div>
                        {visitDt && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
                            <p style={{ fontSize: 12, color: BAI.inkFaint }}>
                              {format(visitDt, "d MMM · HH'h'mm", { locale: fr })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Statistics ──────────────────────────────────────────────── */}
          {statistics && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
              {statCards.map(({ label, value, icon, bg, border, color, accent }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 + i * 0.08, duration: 0.26 }}
                  whileHover={{ y: -2 }}
                  style={{
                    ...cardStyle,
                    display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                    borderTop: `3px solid ${accent}`,
                  }}
                >
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 11,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: bg, border: `1px solid ${border}`, color,
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 4 }}>
                      {label}
                    </p>
                    <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,4vw,32px)', color: BAI.ink, lineHeight: 1 }}>
                      {value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Filters and View Toggle ────────────────────────────────── */}
          <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: 24 }}>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint, pointerEvents: 'none' }}
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

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
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
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: 4,
                    background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                    borderRadius: 10, minHeight: 44,
                  }}
                >
                  <button
                    onClick={() => setViewMode('list')}
                    className="flex-1 py-2 px-3 text-sm font-semibold transition-all"
                    style={
                      viewMode === 'list'
                        ? { background: BAI.bgSurface, color: BAI.owner, borderRadius: 7, boxShadow: '0 1px 3px rgba(13,12,10,0.08)' }
                        : { background: 'transparent', color: BAI.inkMid, borderRadius: 7 }
                    }
                  >
                    Liste
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className="flex-1 py-2 px-3 text-sm font-semibold transition-all"
                    style={
                      viewMode === 'calendar'
                        ? { background: BAI.bgSurface, color: BAI.owner, borderRadius: 7, boxShadow: '0 1px 3px rgba(13,12,10,0.08)' }
                        : { background: 'transparent', color: BAI.inkMid, borderRadius: 7 }
                    }
                  >
                    Calendrier
                  </button>
                </div>

                {/* Past toggle — list mode only */}
                {viewMode === 'list' && (
                  <button
                    onClick={() => setShowPast(p => !p)}
                    title={showPast ? 'Masquer l\'historique' : 'Voir l\'historique'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: showPast ? BAI.ownerLight : 'transparent',
                      border: `1px solid ${showPast ? BAI.ownerBorder : BAI.border}`,
                      borderRadius: 8, padding: '8px 12px',
                      fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 500,
                      color: showPast ? BAI.owner : BAI.inkMid,
                      cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 44,
                      ...(isMobile ? { gridColumn: 'span 2' } : {}),
                    }}
                  >
                    <History size={15} />
                    {showPast ? 'Masquer l\'historique' : 'Historique'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Guide de démarrage */}
          {!isLoading && bookings.length === 0 && selectedProperty === 'all' && !searchQuery && selectedStatus === 'all' && (
            <div
              style={{
                display: 'flex', gap: 16, padding: '18px 20px', marginBottom: 24,
                background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, borderRadius: 14,
              }}
            >
              <Info size={18} style={{ color: BAI.owner, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.owner, marginBottom: 8 }}>
                  Comment activer les visites ?
                </p>
                <ol style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.owner, paddingLeft: 18, lineHeight: 1.7, margin: 0 }}>
                  <li>Sélectionnez un bien dans le filtre ci-dessus</li>
                  <li>Configurez vos créneaux de disponibilité (jours + plages horaires)</li>
                  <li>Approuvez les candidatures des locataires dans <strong>Candidatures</strong></li>
                  <li>Les locataires approuvés pourront alors réserver un créneau</li>
                </ol>
              </div>
            </div>
          )}

          {/* Visit Slots Manager */}
          {selectedProperty !== 'all' && (
            <div style={{ marginBottom: 24 }}>
              <VisitSlotsManager propertyId={selectedProperty} />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, marginBottom: 24,
                background: BAI.errorLight, border: `1px solid #f5c6c6`, borderRadius: 12,
              }}
            >
              <AlertCircle size={18} style={{ color: BAI.error, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13.5, color: BAI.error }}>Erreur</p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: '#7f1d1d' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading && !bookings.length ? (
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
              <Loader size={28} style={{ color: BAI.owner, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : viewMode === 'calendar' ? (
            <Calendar
              bookings={bookings}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              minDate={new Date(new Date().setMonth(new Date().getMonth() - 6))}
              viewMode="owner"
            />
          ) : (
            <div>
              {filteredBookings.length === 0 ? (
                <div style={{ ...cardStyle, padding: '64px 24px', textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    background: BAI.ownerLight,
                  }}>
                    <CalendarIcon size={28} style={{ color: BAI.owner }} />
                  </div>
                  <h3 style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 24, fontWeight: 700,
                    color: BAI.ink, marginBottom: 8,
                  }}>
                    Aucune visite
                  </h3>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13.5, color: BAI.inkMid }}>
                    {searchQuery || selectedProperty !== 'all' || selectedStatus !== 'all'
                      ? 'Aucune réservation ne correspond à vos filtres.'
                      : "Vous n'avez pas encore reçu de demandes de visite."}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      viewMode="owner"
                      onConfirm={handleConfirmBooking}
                      onCancel={handleCancelBooking}
                      isLoading={actionLoading === booking.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination Info */}
          {filteredBookings.length > 0 && viewMode === 'list' && (
            <div style={{ marginTop: 24, textAlign: 'center', fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint }}>
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
    </>  )
}

export default BookingManagement
