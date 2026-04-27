import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, MapPin, Clock, User, ExternalLink, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Booking, BookingStatus } from '../../types/booking.types'
import { BAI } from '../../constants/bailio-tokens'
import { useNavigate } from 'react-router-dom'

interface CalendarProps {
  bookings: Booking[]
  onDateSelect?: (date: Date) => void
  selectedDate?: Date | null
  minDate?: Date
}

// ─── Couleurs par statut ──────────────────────────────────────────────────────

const STATUS_STYLE: Record<BookingStatus, {
  bg: string; text: string; border: string; dot: string; label: string; Icon: typeof CheckCircle
}> = {
  CONFIRMED: {
    bg: BAI.tenantLight, text: BAI.tenant, border: BAI.tenantBorder, dot: BAI.tenant,
    label: 'Confirmée', Icon: CheckCircle,
  },
  PENDING: {
    bg: '#fdf5ec', text: '#92400e', border: '#f3c99a', dot: '#f59e0b',
    label: 'En attente', Icon: AlertCircle,
  },
  CANCELLED: {
    bg: BAI.errorLight, text: BAI.error, border: '#fca5a5', dot: BAI.error,
    label: 'Annulée', Icon: XCircle,
  },
  COMPLETED: {
    bg: BAI.bgMuted, text: BAI.inkMid, border: BAI.border, dot: BAI.inkFaint,
    label: 'Terminée', Icon: CheckCircle,
  },
}

// ─── Event bar ────────────────────────────────────────────────────────────────

function EventBar({
  booking,
  compact,
  onClick,
}: {
  booking: Booking
  compact?: boolean
  onClick: (b: Booking) => void
}) {
  const s = STATUS_STYLE[booking.status]
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(booking) }}
      title={`${booking.property.title} · ${booking.visitTime}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        width: '100%',
        padding: compact ? '1px 4px' : '2px 6px',
        borderRadius: 4,
        background: s.bg,
        border: `1px solid ${s.border}`,
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: compact ? 16 : 20,
        overflow: 'hidden',
        transition: 'filter 0.12s',
        fontFamily: BAI.fontBody,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(0.94)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: s.dot, flexShrink: 0,
      }} />
      {!compact && (
        <span style={{
          fontSize: 11, fontWeight: 600, color: s.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {booking.visitTime} {booking.property.title}
        </span>
      )}
    </button>
  )
}

// ─── Detail popup ─────────────────────────────────────────────────────────────

function BookingPopup({
  booking,
  onClose,
  viewMode,
}: {
  booking: Booking
  onClose: () => void
  viewMode: 'owner' | 'tenant'
}) {
  const navigate = useNavigate()
  const s = STATUS_STYLE[booking.status]
  const StatusIcon = s.Icon

  const img = booking.property.images?.[0]

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 100,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(360px, 92vw)',
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 14,
        boxShadow: '0 8px 40px rgba(13,12,10,0.18)',
        fontFamily: BAI.fontBody,
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Image ou bandeau coloré */}
      {img ? (
        <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
          <img
            src={img}
            alt={booking.property.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* overlay sombre */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,12,10,0.35)' }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.45)', border: 'none',
              borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, color: '#fff',
            }}
          >
            <X className="w-4 h-4" />
          </button>
          {/* Status badge over image */}
          <div style={{
            position: 'absolute', bottom: 8, left: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 20, padding: '3px 10px',
          }}>
            <StatusIcon className="w-3 h-3" style={{ color: s.text }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: s.text }}>{s.label}</span>
          </div>
        </div>
      ) : (
        <div style={{
          height: 8, background: s.dot,
          borderRadius: '14px 14px 0 0',
        }} />
      )}

      {/* Header sans image */}
      {!img && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
            borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, color: BAI.inkMid,
          }}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Contenu */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Titre */}
        <p style={{
          fontFamily: BAI.fontDisplay,
          fontStyle: 'italic',
          fontSize: 17, fontWeight: 700,
          color: BAI.ink, margin: '0 0 4px',
          lineHeight: 1.25,
          paddingRight: img ? 0 : 32,
        }}>
          {booking.property.title}
        </p>

        {/* Status badge (si image présente, déjà affiché) */}
        {!img && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 20, padding: '3px 10px', marginBottom: 12,
          }}>
            <StatusIcon className="w-3 h-3" style={{ color: s.text }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: s.text }}>{s.label}</span>
          </div>
        )}

        {/* Infos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: BAI.inkMid }}>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BAI.inkFaint }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[booking.property.address, booking.property.city].filter(Boolean).join(', ')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: BAI.inkMid }}>
            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BAI.inkFaint }} />
            <span>
              {format(parseISO(booking.visitDate), "EEEE d MMMM yyyy", { locale: fr })} · {booking.visitTime}
              <span style={{ color: BAI.inkFaint }}> ({booking.duration} min)</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: BAI.inkMid }}>
            <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BAI.inkFaint }} />
            <span>
              {viewMode === 'owner'
                ? `${booking.tenant.firstName} ${booking.tenant.lastName}`
                : `${booking.property.owner.firstName} ${booking.property.owner.lastName}`}
            </span>
          </div>
        </div>

        {/* Notes */}
        {booking.tenantNotes && (
          <div style={{
            marginTop: 10, padding: '8px 10px',
            background: BAI.bgMuted, borderRadius: 8,
            fontSize: 12, color: BAI.inkMid, lineHeight: 1.5,
          }}>
            {booking.tenantNotes}
          </div>
        )}

        {/* CTA → voir le bien */}
        <button
          onClick={() => navigate(`/property/${booking.property.id}`)}
          style={{
            marginTop: 14,
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 16px',
            background: BAI.night, color: '#ffffff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            fontFamily: BAI.fontBody,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Voir le bien
        </button>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export const Calendar = ({
  bookings,
  onDateSelect,
  selectedDate = null,
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Detect owner vs tenant from booking data
  const viewMode: 'owner' | 'tenant' = bookings[0]?.property?.owner ? 'owner' : 'tenant'

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Lun-start padding
  const firstDow = monthStart.getDay() // 0=Sun
  const startPadding = firstDow === 0 ? 6 : firstDow - 1
  const paddingDays = Array(startPadding).fill(null)

  const getBookingsForDate = (date: Date): Booking[] =>
    bookings
      .filter((b) => isSameDay(parseISO(b.visitDate), date))
      .sort((a, b) => a.visitTime.localeCompare(b.visitTime))

  // Close popup on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSelectedBooking(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const MAX_VISIBLE = 3 // max event bars per day cell

  return (
    <div
      ref={wrapperRef}
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 14,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        fontFamily: BAI.fontBody,
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => setSelectedBooking(null)}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${BAI.border}`,
        }}
      >
        <h3 style={{
          fontFamily: BAI.fontDisplay, fontStyle: 'italic',
          fontSize: 20, fontWeight: 700, color: BAI.ink, margin: 0,
          textTransform: 'capitalize',
        }}>
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: BAI.inkMid, transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgSurface }}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedBooking(null) }}
            style={{
              padding: '0 12px', height: 34, borderRadius: 8,
              border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
              fontSize: 12, fontWeight: 600, color: BAI.inkMid,
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgSurface }}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: BAI.inkMid, transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgSurface }}
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Jours de la semaine ───────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: `1px solid ${BAI.border}`,
      }}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              padding: '8px 4px',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: i >= 5 ? BAI.inkFaint : BAI.inkMid,
              borderRight: i < 6 ? `1px solid ${BAI.border}` : 'none',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Grille mensuelle ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {/* Padding jours précédents */}
        {paddingDays.map((_, i) => (
          <div
            key={`pad-${i}`}
            style={{
              minHeight: 96,
              background: BAI.bgMuted,
              borderRight: `1px solid ${BAI.border}`,
              borderBottom: `1px solid ${BAI.border}`,
              opacity: 0.5,
            }}
          />
        ))}

        {/* Jours du mois */}
        {monthDays.map((date, dayIdx) => {
          const dayBookings = getBookingsForDate(date)
          const isCurrentDay = isToday(date)
          const isOtherMonth = !isSameMonth(date, currentMonth)
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false

          const colIndex = (startPadding + dayIdx) % 7
          const isWeekend = colIndex >= 5
          const isLastCol = colIndex === 6

          const visible = dayBookings.slice(0, MAX_VISIBLE)
          const overflow = dayBookings.length - MAX_VISIBLE

          return (
            <div
              key={date.toISOString()}
              onClick={() => { onDateSelect?.(date); setSelectedBooking(null) }}
              style={{
                minHeight: 96,
                padding: '6px 4px 4px',
                borderRight: !isLastCol ? `1px solid ${BAI.border}` : 'none',
                borderBottom: `1px solid ${BAI.border}`,
                background: isSelected
                  ? BAI.ownerLight
                  : isCurrentDay
                  ? '#f0f5ff'
                  : isWeekend
                  ? BAI.bgMuted
                  : BAI.bgSurface,
                cursor: onDateSelect ? 'pointer' : 'default',
                transition: 'background 0.1s',
                position: 'relative',
                verticalAlign: 'top',
              }}
              onMouseEnter={(e) => {
                if (onDateSelect && !isCurrentDay && !isSelected)
                  (e.currentTarget as HTMLElement).style.background = BAI.bgMuted
              }}
              onMouseLeave={(e) => {
                if (isSelected) {
                  (e.currentTarget as HTMLElement).style.background = BAI.ownerLight
                } else if (isCurrentDay) {
                  (e.currentTarget as HTMLElement).style.background = '#f0f5ff'
                } else {
                  (e.currentTarget as HTMLElement).style.background = isWeekend ? BAI.bgMuted : BAI.bgSurface
                }
              }}
            >
              {/* Numéro du jour */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4, paddingRight: 2 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  fontSize: 12, fontWeight: isCurrentDay ? 700 : 500,
                  color: isCurrentDay ? '#ffffff' : isOtherMonth ? BAI.inkFaint : BAI.ink,
                  background: isCurrentDay ? BAI.owner : 'transparent',
                }}>
                  {format(date, 'd')}
                </span>
              </div>

              {/* Barres d'événements */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {visible.map((b) => (
                  <EventBar
                    key={b.id}
                    booking={b}
                    compact={false}
                    onClick={(b) => { setSelectedBooking(b) }}
                  />
                ))}
                {overflow > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: BAI.inkMid,
                    paddingLeft: 4,
                  }}>
                    +{overflow} autre{overflow > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Légende ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 16px',
        padding: '12px 20px',
        borderTop: `1px solid ${BAI.border}`,
        background: BAI.bgMuted,
      }}>
        {(Object.keys(STATUS_STYLE) as BookingStatus[]).map((status) => {
          const s = STATUS_STYLE[status]
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3,
                background: s.bg, border: `1px solid ${s.border}`,
                display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: BAI.inkMid }}>{s.label}</span>
            </div>
          )
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: BAI.owner, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            J
          </span>
          <span style={{ fontSize: 11, color: BAI.inkMid }}>Aujourd'hui</span>
        </div>
      </div>

      {/* ── Popup de détail ───────────────────────────────────────────────── */}
      {selectedBooking && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(13,12,10,0.15)', zIndex: 90 }}
            onClick={() => setSelectedBooking(null)}
          />
          <BookingPopup
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            viewMode={viewMode}
          />
        </>
      )}
    </div>
  )
}

export default Calendar
