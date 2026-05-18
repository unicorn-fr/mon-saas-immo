import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, MapPin, Clock, User, ExternalLink, CheckCircle, AlertCircle, XCircle, FolderOpen } from 'lucide-react'
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
  viewMode?: 'owner' | 'tenant'
}

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

// ─── Barre d'événement compacte ───────────────────────────────────────────────

function EventBar({ booking, onClick }: { booking: Booking; onClick: (b: Booking) => void }) {
  const s = STATUS_STYLE[booking.status]
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(booking) }}
      title={`${booking.visitTime} · ${booking.property.title}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 3,
        width: '100%', padding: '2px 5px',
        borderRadius: 3,
        background: s.bg,
        border: `1px solid ${s.border}`,
        cursor: 'pointer',
        textAlign: 'left',
        overflow: 'hidden',
        minHeight: 18,
        fontFamily: BAI.fontBody,
        flexShrink: 0,
        transition: 'filter 0.1s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(0.93)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: s.text, flexShrink: 0, lineHeight: 1 }}>
        {booking.visitTime}
      </span>
      <span style={{
        fontSize: 10, color: s.text, opacity: 0.8,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        flex: 1, lineHeight: 1,
      }}>
        &nbsp;{booking.property.title}
      </span>
    </button>
  )
}

// ─── Popup de détail (position: fixed — jamais clippé par le calendrier) ─────

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
    <>
      {/* Backdrop fixe */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(13,12,10,0.20)',
          zIndex: 999,
        }}
        onClick={onClose}
      />
      {/* Popup centrée dans le viewport */}
      <div
        style={{
          position: 'fixed',
          top: '50vh', left: '50vw',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          width: 'min(360px, 92vw)',
          background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`,
          borderRadius: 14,
          boxShadow: '0 8px 40px rgba(13,12,10,0.22)',
          fontFamily: BAI.fontBody,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image ou bande de couleur */}
        {img ? (
          <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
            <img src={img} alt={booking.property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,12,10,0.35)' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, color: '#fff' }}>
              <X className="w-4 h-4" />
            </button>
            <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 10px' }}>
              <StatusIcon className="w-3 h-3" style={{ color: s.text }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: s.text }}>{s.label}</span>
            </div>
          </div>
        ) : (
          <div style={{ height: 5, background: s.dot }} />
        )}

        {/* Bouton fermer (sans image) */}
        {!img && (
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, color: BAI.inkMid }}>
            <X className="w-4 h-4" />
          </button>
        )}

        <div style={{ padding: '14px 16px 16px' }}>
          <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 17, fontWeight: 700, color: BAI.ink, margin: '0 0 4px', lineHeight: 1.25, paddingRight: img ? 0 : 36 }}>
            {booking.property.title}
          </p>

          {!img && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 10px', marginBottom: 10 }}>
              <StatusIcon className="w-3 h-3" style={{ color: s.text }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: s.text }}>{s.label}</span>
            </div>
          )}

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
                {format(parseISO(booking.visitDate), "EEEE d MMMM yyyy", { locale: fr })}
                {' · '}{booking.visitTime}
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

          {booking.tenantNotes && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: BAI.bgMuted, borderRadius: 8, fontSize: 12, color: BAI.inkMid, lineHeight: 1.5 }}>
              {booking.tenantNotes}
            </div>
          )}

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => navigate(`/property/${booking.property.id}`)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: BAI.fontBody, transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Voir le bien
            </button>

            {viewMode === 'owner' && (
              <button
                onClick={() => navigate(`/owner/tenants/${booking.tenantId}`)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', background: BAI.ownerLight, color: BAI.owner, border: `1px solid ${BAI.ownerBorder}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: BAI.fontBody, transition: 'filter 0.12s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(0.94)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Dossier de {booking.tenant.firstName} {booking.tenant.lastName}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export const Calendar = ({
  bookings,
  onDateSelect,
  selectedDate = null,
  viewMode = 'owner',
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDow = monthStart.getDay()
  const startPadding = firstDow === 0 ? 6 : firstDow - 1
  const paddingDays = Array(startPadding).fill(null)

  const getBookingsForDate = (date: Date): Booking[] =>
    bookings
      .filter((b) => isSameDay(parseISO(b.visitDate), date))
      .sort((a, b) => a.visitTime.localeCompare(b.visitTime))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSelectedBooking(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const MAX_VISIBLE = 3

  // Nombre de lignes = ceil((paddingDays + monthDays) / 7)
  const totalCells = paddingDays.length + monthDays.length
  const rowCount = Math.ceil(totalCells / 7)

  return (
    <div
      ref={wrapperRef}
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 14,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        fontFamily: BAI.fontBody,
        // PAS de overflow: hidden — le popup est en position: fixed
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: `1px solid ${BAI.border}`,
        borderRadius: '14px 14px 0 0',
        background: BAI.bgSurface,
      }}>
        <h3 style={{
          fontFamily: BAI.fontDisplay, fontStyle: 'italic',
          fontSize: 20, fontWeight: 700, color: BAI.ink, margin: 0,
          textTransform: 'capitalize',
        }}>
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)) }}
            aria-label="Mois précédent"
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: BAI.inkMid, transition: 'background 0.12s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgSurface }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(new Date()); setSelectedBooking(null) }}
            style={{ padding: '0 12px', height: 34, borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgSurface, fontSize: 12, fontWeight: 600, color: BAI.inkMid, cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgSurface }}
          >
            Aujourd'hui
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)) }}
            aria-label="Mois suivant"
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: BAI.inkMid, transition: 'background 0.12s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgSurface }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Noms des jours ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        borderBottom: `1px solid ${BAI.border}`,
      }}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', padding: '8px 4px',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: i >= 5 ? BAI.inkFaint : BAI.inkMid,
            borderRight: i < 6 ? `1px solid ${BAI.border}` : 'none',
            overflow: 'hidden',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Grille mensuelle — hauteur fixe, jamais variable ────────────── */}
      {/*
        gridAutoRows: hauteur fixe 100px par ligne — le calendrier ne grandit
        jamais même si une cellule a beaucoup d'événements.
        minmax(0, 1fr) = les colonnes peuvent descendre en dessous de leur contenu.
      */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gridTemplateRows: `repeat(${rowCount}, 100px)`,
        border: 'none',
      }}>
        {/* Jours du mois précédent (padding) */}
        {paddingDays.map((_, i) => {
          const isLastPadCol = (i + 1) % 7 === 0
          return (
            <div key={`pad-${i}`} style={{
              background: BAI.bgMuted,
              borderRight: !isLastPadCol ? `1px solid ${BAI.border}` : 'none',
              borderBottom: `1px solid ${BAI.border}`,
              overflow: 'hidden',
            }} />
          )
        })}

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
              onClick={(e) => { e.stopPropagation(); setSelectedBooking(null); onDateSelect?.(date) }}
              style={{
                padding: '5px 4px 4px',
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
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
              onMouseEnter={(e) => {
                if (onDateSelect && !isCurrentDay && !isSelected)
                  (e.currentTarget as HTMLElement).style.background = BAI.bgMuted
              }}
              onMouseLeave={(e) => {
                if (isSelected) (e.currentTarget as HTMLElement).style.background = BAI.ownerLight
                else if (isCurrentDay) (e.currentTarget as HTMLElement).style.background = '#f0f5ff'
                else (e.currentTarget as HTMLElement).style.background = isWeekend ? BAI.bgMuted : BAI.bgSurface
              }}
            >
              {/* Numéro du jour — aligné à droite */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  fontSize: 11, fontWeight: isCurrentDay ? 700 : 500, lineHeight: 1,
                  color: isCurrentDay ? '#fff' : isOtherMonth ? BAI.inkFaint : BAI.ink,
                  background: isCurrentDay ? BAI.owner : 'transparent',
                  flexShrink: 0,
                }}>
                  {format(date, 'd')}
                </span>
              </div>

              {/* Barres d'événements */}
              {visible.map((b) => (
                <EventBar key={b.id} booking={b} onClick={(b) => { setSelectedBooking(b) }} />
              ))}
              {overflow > 0 && (
                <span style={{ fontSize: 9, fontWeight: 600, color: BAI.inkMid, paddingLeft: 3, flexShrink: 0 }}>
                  +{overflow}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Légende ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 16px',
        padding: '10px 20px',
        borderTop: `1px solid ${BAI.border}`,
        background: BAI.bgMuted,
        borderRadius: '0 0 14px 14px',
      }}>
        {(Object.keys(STATUS_STYLE) as BookingStatus[]).map((status) => {
          const s = STATUS_STYLE[status]
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.bg, border: `1px solid ${s.border}`, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: BAI.inkMid }}>{s.label}</span>
            </div>
          )
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: BAI.owner, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            J
          </span>
          <span style={{ fontSize: 11, color: BAI.inkMid }}>Aujourd'hui</span>
        </div>
      </div>

      {/* ── Popup de détail (fixed, jamais clippé) ─────────────────────── */}
      {selectedBooking && (
        <BookingPopup
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}

export default Calendar
