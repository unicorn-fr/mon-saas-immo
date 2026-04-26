import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Filter,
  Loader,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  MapPin,
  Euro,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useBookings } from '../../hooks/useBookings'
import { BookingCard } from '../../components/booking/BookingCard'
import { CancelBookingModal } from '../../components/booking/CancelBookingModal'
import { Calendar } from '../../components/booking/Calendar'
import { BookingStatus, CalendarInviteWithProperty } from '../../types/booking.types'
import { Layout } from '../../components/layout/Layout'
import { bookingService } from '../../services/booking.service'
import { applicationService } from '../../services/application.service'
import toast from 'react-hot-toast'

type ViewMode = 'list' | 'calendar'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:5000'

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAYS_AHEAD = 14

function InvitePanel({ invite }: { invite: CalendarInviteWithProperty }) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingSlot, setBookingSlot] = useState<string | null>(null)
  const { property } = invite

  const dates = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  // Filter dates to days that have slots configured
  const slotDays = new Set((property?.visitAvailabilitySlots ?? []).map(s => s.dayOfWeek))
  const validDates = slotDays.size === 0 ? dates : dates.filter(d => slotDays.has(new Date(d + 'T00:00:00').getDay()))

  async function handleSelectDate(date: string) {
    if (!property?.id) return
    setSelectedDate(date)
    setAvailableSlots([])
    setLoadingSlots(true)
    try {
      const slots = await bookingService.getAvailableSlots(property.id, date)
      setAvailableSlots(slots)
    } catch { toast.error('Impossible de charger les créneaux') }
    finally { setLoadingSlots(false) }
  }

  async function handleBook(time: string) {
    if (!property?.id) return
    setBookingSlot(time)
    try {
      await bookingService.createBooking({ propertyId: property.id, visitDate: selectedDate, visitTime: time })
      toast.success('Visite réservée ! Le propriétaire va confirmer.')
      setAvailableSlots(prev => prev.filter(s => s !== time))
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur'
      toast.error(msg)
    } finally { setBookingSlot(null) }
  }

  const imgSrc = property?.images?.[0]
    ? property.images[0].startsWith('http') ? property.images[0] : `${SERVER_BASE}${property.images[0]}`
    : null

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
      {/* Card header — always visible, tap to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {/* Image responsive: 120px mobile, 160px sm+ */}
        <div className="w-full sm:w-auto flex-shrink-0">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={property?.title ?? 'Logement'}
              className="w-full sm:w-16 object-cover rounded-xl"
              style={{
                height: 120,
                border: '1px solid #e4e1db',
              }}
            />
          ) : (
            <div
              className="w-full sm:w-16 rounded-xl flex items-center justify-center"
              style={{ height: 120, background: '#f4f2ee' }}
            >
              <Home className="w-7 h-7" style={{ color: '#9e9b96' }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0d0c0a', marginBottom: 2 }} className="truncate">{property?.title ?? 'Logement'}</p>
          <p className="flex items-center gap-1 flex-wrap" style={{ fontSize: 12, color: '#9e9b96' }}>
            <MapPin className="w-3 h-3 flex-shrink-0" />{property?.city ?? ''}
            <span className="mx-1">·</span>
            <Euro className="w-3 h-3 flex-shrink-0" />{Number(property?.price ?? 0).toLocaleString('fr-FR')} /mois
          </p>
          <p style={{ fontSize: 11, color: '#c4976a', fontWeight: 500, marginTop: 4 }}>
            Invité par {invite.owner.firstName} {invite.owner.lastName}
          </p>
        </div>
        <div style={{ color: '#9e9b96', flexShrink: 0, alignSelf: 'flex-start' }} className="hidden sm:block">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #e4e1db', background: '#fafaf8', padding: '16px' }}>
          {/* Date picker — 14 jours */}
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9e9b96', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Choisir une date
          </p>
          <div className="flex gap-2 flex-wrap mb-4">
            {validDates.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9e9b96' }}>Le propriétaire n'a pas encore configuré de créneaux de visite.</p>
            ) : validDates.map(date => {
              const d = new Date(date + 'T00:00:00')
              const isSelected = selectedDate === date
              return (
                <button key={date} onClick={() => handleSelectDate(date)}
                  style={{
                    background: isSelected ? '#1a1a2e' : '#ffffff',
                    border: `1px solid ${isSelected ? '#1a1a2e' : '#e4e1db'}`,
                    color: isSelected ? '#ffffff' : '#0d0c0a',
                    borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: isSelected ? 600 : 400,
                    minHeight: 44,
                  }}>
                  <span style={{ display: 'block', fontSize: 10, opacity: 0.7 }}>{DAY_LABELS[d.getDay()]}</span>
                  {d.getDate()}/{d.getMonth() + 1}
                </button>
              )
            })}
          </div>

          {/* Créneaux disponibles — grid 2 cols mobile, 3 cols sm+ */}
          {selectedDate && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9e9b96', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Créneaux disponibles
              </p>
              {loadingSlots ? (
                <p style={{ fontSize: 13, color: '#9e9b96' }}>Chargement…</p>
              ) : availableSlots.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9e9b96' }}>Aucun créneau disponible à cette date. Essayez un autre jour.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlots.map(time => (
                    <button key={time} onClick={() => handleBook(time)}
                      disabled={bookingSlot === time}
                      style={{
                        background: bookingSlot === time ? '#f4f2ee' : '#eaf0fb',
                        border: '1px solid #b8ccf0', color: '#1a3270',
                        borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600,
                        cursor: bookingSlot === time ? 'not-allowed' : 'pointer',
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        opacity: bookingSlot === time ? 0.6 : 1,
                        minHeight: 44,
                      }}>
                      {bookingSlot === time ? '…' : time}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
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

  const [invites, setInvites] = useState<CalendarInviteWithProperty[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null)

  useEffect(() => {
    // Load both explicit invites AND approved applications (auto-fallback for historical data)
    Promise.all([
      bookingService.getMyInvites().catch(() => [] as CalendarInviteWithProperty[]),
      applicationService.list().catch(() => [] as any[]),
    ]).then(([fetchedInvites, apps]) => {
      const invitedPropertyIds = new Set(fetchedInvites.map((i: CalendarInviteWithProperty) => i.propertyId))
      // Build synthetic invites for approved apps that don't have an explicit invite yet
      const approvedApps = (apps as any[]).filter((a: any) =>
        a.status === 'APPROVED' && a.property && !invitedPropertyIds.has(a.propertyId)
      )
      const syntheticInvites: CalendarInviteWithProperty[] = approvedApps.map((a: any) => ({
        id: `app-${a.id}`,
        propertyId: a.propertyId,
        tenantId: a.tenantId,
        ownerId: a.property.ownerId ?? '',
        createdAt: a.createdAt,
        property: {
          id: a.property.id,
          title: a.property.title,
          address: a.property.address ?? '',
          city: a.property.city,
          price: a.property.price,
          images: a.property.images ?? [],
          visitDuration: 30,
          visitAvailabilitySlots: [], // slots chargés dynamiquement via getAvailableSlots
        },
        owner: { id: a.property.ownerId ?? '', firstName: 'le', lastName: 'propriétaire' },
      }))
      setInvites([...fetchedInvites, ...syntheticInvites])
    })
  }, [])

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
        className="min-h-screen px-4 py-6 lg:p-8"
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
                fontSize: 'clamp(28px, 6vw, 40px)',
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

          {/* Invitations calendrier */}
          {invites.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-4 h-4" style={{ color: '#c4976a' }} />
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0d0c0a', margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Logements à visiter
                </h2>
                <span style={{ fontSize: 11, background: '#fdf5ec', color: '#c4976a', border: '1px solid #f3c99a', borderRadius: 20, padding: '1px 8px', fontWeight: 600 }}>
                  {invites.length}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#9e9b96', marginBottom: 14 }}>
                Votre candidature a été approuvée — choisissez un créneau pour visiter.
              </p>
              <div className="flex flex-col gap-3">
                {invites.map(invite => (
                  <InvitePanel key={invite.id} invite={invite} />
                ))}
              </div>
            </div>
          )}

          {/* Statistics — 2 cols mobile, 4 cols sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, valueColor, iconBg, icon }) => (
              <div
                key={label}
                className="p-4 sm:p-5"
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
                    className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center"
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
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#9e9b96' }} />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as BookingStatus | 'all')}
                  className="flex-1 min-w-0 px-3 outline-none transition-all"
                  style={{
                    border: '1px solid #e4e1db',
                    background: '#f8f7f4',
                    borderRadius: 8,
                    color: '#0d0c0a',
                    fontSize: 16,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    minHeight: 44,
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

              {/* View Toggle — touch targets ≥ 44px */}
              <div
                className="flex items-center gap-1 p-1 flex-shrink-0"
                style={{ background: '#f4f2ee', borderRadius: 10 }}
              >
                <button
                  onClick={() => setViewMode('list')}
                  className="px-4 text-sm font-medium transition-all"
                  style={
                    viewMode === 'list'
                      ? {
                          background: '#ffffff',
                          color: '#1b5e3b',
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                          minHeight: 36,
                        }
                      : { color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: 36 }
                  }
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className="px-4 text-sm font-medium transition-all"
                  style={
                    viewMode === 'calendar'
                      ? {
                          background: '#ffffff',
                          color: '#1b5e3b',
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(13,12,10,0.08)',
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                          minHeight: 36,
                        }
                      : { color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: 36 }
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
                  className="p-8 sm:p-12 text-center"
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
                    <Link
                      to="/search"
                      className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
                      style={{
                        background: '#1b5e3b',
                        color: '#ffffff',
                        borderRadius: 8,
                        padding: '12px 20px',
                        fontSize: 13,
                        fontWeight: 500,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        minHeight: 44,
                      }}
                    >
                      <Home className="w-4 h-4" />
                      Explorer les propriétés
                    </Link>
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
