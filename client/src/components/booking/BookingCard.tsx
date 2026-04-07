import { Calendar, Clock, MapPin, User, MessageSquare, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Booking, BookingStatus } from '../../types/booking.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

interface BookingCardProps {
  booking: Booking
  viewMode: 'owner' | 'tenant'
  onConfirm?: (id: string) => void
  onCancel?: (id: string) => void
  isLoading?: boolean
}

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
  tenant:       '#1b5e3b',
  tenantLight:  '#edf7f2',
  tenantBorder: '#9fd4ba',
  border:       '#e4e1db',
  borderMid:    '#ccc9c3',
  night:        '#1a1a2e',
  danger:       '#9b1c1c',
  dangerBg:     '#fef2f2',
  dangerBorder: '#fca5a5',
  warning:      '#92400e',
  warningBg:    '#fdf5ec',
  warningBorder:'#f3c99a',
  body:         "'DM Sans', system-ui, sans-serif",
  display:      "'Cormorant Garamond', Georgia, serif",
}

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string
    icon: typeof CheckCircle
    color: string
    bgColor: string
    borderColor: string
  }
> = {
  PENDING: {
    label: 'En attente',
    icon: AlertCircle,
    color: M.warning,
    bgColor: M.warningBg,
    borderColor: M.warningBorder,
  },
  CONFIRMED: {
    label: 'Confirmée',
    icon: CheckCircle,
    color: M.tenant,
    bgColor: M.tenantLight,
    borderColor: M.tenantBorder,
  },
  CANCELLED: {
    label: 'Annulée',
    icon: XCircle,
    color: M.danger,
    bgColor: M.dangerBg,
    borderColor: M.dangerBorder,
  },
  COMPLETED: {
    label: 'Terminée',
    icon: CheckCircle,
    color: M.inkMid,
    bgColor: M.muted,
    borderColor: M.border,
  },
}

/**
 * Build a Google Calendar "add event" URL for a confirmed visit.
 * Dates format: YYYYMMDDTHHmmss (local time, no Z)
 */
function buildGoogleCalendarUrl(booking: Booking): string {
  const visitDate = new Date(booking.visitDate)
  const [h, m] = (booking.visitTime || '10:00').split(':').map(Number)
  visitDate.setHours(h, m, 0, 0)

  const endDate = new Date(visitDate.getTime() + (booking.duration || 30) * 60_000)

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

  const title = encodeURIComponent(`Visite — ${booking.property.title}`)
  const location = encodeURIComponent(
    [booking.property.address, booking.property.city].filter(Boolean).join(', ')
  )
  const details = encodeURIComponent(
    `Visite du bien "${booking.property.title}" à ${booking.property.city}.\nRéservation #${booking.id.slice(0, 8)}`
  )

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(visitDate)}/${fmt(endDate)}&details=${details}&location=${location}`
}

export const BookingCard = ({
  booking,
  viewMode,
  onConfirm,
  onCancel,
  isLoading = false,
}: BookingCardProps) => {
  const navigate = useNavigate()
  const statusConfig = STATUS_CONFIG[booking.status]
  const StatusIcon = statusConfig.icon

  const visitDate = new Date(booking.visitDate)
  const formattedDateShort = format(visitDate, 'd MMM yyyy', { locale: fr })

  const isPast = visitDate < new Date()
  const canConfirm = viewMode === 'owner' && booking.status === 'PENDING' && !isPast
  const canCancel = booking.status === 'PENDING' && !isPast
  const canAddToCalendar = booking.status === 'CONFIRMED' && !isPast

  return (
    <div
      style={{
        background: M.surface,
        border: `1px solid ${statusConfig.borderColor}`,
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease',
        fontFamily: M.body,
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <h3
              onClick={() => navigate(`/property/${booking.property.id}`)}
              className="cursor-pointer"
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: M.ink,
                marginBottom: 4,
                lineHeight: 1.3,
                fontFamily: M.body,
              }}
            >
              {booking.property.title}
            </h3>
            <div className="flex items-center gap-1.5" style={{ color: M.inkMid, fontSize: 13 }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{booking.property.city}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0"
            style={{
              background: statusConfig.bgColor,
              color: statusConfig.color,
              border: `1px solid ${statusConfig.borderColor}`,
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.label}
          </div>
        </div>

        {/* Visit Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ background: M.ownerLight, borderRadius: 10 }}
            >
              <Calendar className="w-4 h-4" style={{ color: M.owner }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: M.inkFaint, marginBottom: 2 }}>Date</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: M.ink }}>{formattedDateShort}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ background: M.ownerLight, borderRadius: 10 }}
            >
              <Clock className="w-4 h-4" style={{ color: M.owner }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: M.inkFaint, marginBottom: 2 }}>Horaire</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: M.ink }}>
                {booking.visitTime} · {booking.duration} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ background: M.ownerLight, borderRadius: 10 }}
            >
              <User className="w-4 h-4" style={{ color: M.owner }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: M.inkFaint, marginBottom: 2 }}>
                {viewMode === 'owner' ? 'Visiteur' : 'Propriétaire'}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: M.ink }}>
                {viewMode === 'owner'
                  ? `${booking.tenant.firstName} ${booking.tenant.lastName}`
                  : booking.property.owner
                  ? `${booking.property.owner.firstName} ${booking.property.owner.lastName}`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.tenantNotes && (
          <div
            className="flex items-start gap-2 p-3 mb-4"
            style={{ background: M.muted, borderRadius: 8 }}
          >
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: M.inkMid }} />
            <div>
              <p style={{ fontSize: 11, color: M.inkFaint, marginBottom: 2 }}>Notes</p>
              <p style={{ fontSize: 13, color: M.ink }}>{booking.tenantNotes}</p>
            </div>
          </div>
        )}

        {/* Cancellation Reason */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div
            className="flex items-start gap-2 p-3 mb-4"
            style={{ background: M.dangerBg, border: `1px solid ${M.dangerBorder}`, borderRadius: 8 }}
          >
            <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: M.danger }} />
            <div>
              <p style={{ fontSize: 11, color: M.danger, marginBottom: 2 }}>Raison de l'annulation</p>
              <p style={{ fontSize: 13, color: M.danger }}>{booking.cancellationReason}</p>
              {booking.cancelledAt && (
                <p style={{ fontSize: 11, color: M.danger, opacity: 0.7, marginTop: 2 }}>
                  Le {format(new Date(booking.cancelledAt), 'Pp', { locale: fr })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Google Calendar CTA — visites confirmées à venir */}
        {canAddToCalendar && (
          <div
            className="flex items-center justify-between p-3 mb-4"
            style={{
              background: M.tenantLight,
              border: `1px solid ${M.tenantBorder}`,
              borderRadius: 10,
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: M.tenant }} />
              <p style={{ fontSize: 13, color: M.tenant, fontWeight: 500 }}>
                Visite confirmée — ajoutez-la à votre agenda
              </p>
            </div>
            <a
              href={buildGoogleCalendarUrl(booking)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5"
              style={{
                background: M.tenant,
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: M.body,
                flexShrink: 0,
              }}
            >
              <ExternalLink className="w-3 h-3" />
              Google Calendar
            </a>
          </div>
        )}

        {/* Actions */}
        {(canConfirm || canCancel) && (
          <div
            className="flex items-center gap-3 pt-4"
            style={{ borderTop: `1px solid ${M.border}` }}
          >
            {canConfirm && onConfirm && (
              <button
                onClick={() => onConfirm(booking.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4"
                style={{
                  background: M.night,
                  color: '#ffffff',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  fontFamily: M.body,
                }}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirmer la visite
              </button>
            )}

            {canCancel && onCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4"
                style={{
                  background: M.surface,
                  color: M.danger,
                  border: `1px solid ${M.dangerBorder}`,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  fontFamily: M.body,
                }}
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 mt-3"
          style={{ borderTop: `1px solid ${M.border}`, fontSize: 11, color: M.inkFaint }}
        >
          <span>Réservation #{booking.id.slice(0, 8)}</span>
          <span>Créée le {format(new Date(booking.createdAt), 'Pp', { locale: fr })}</span>
        </div>
      </div>
    </div>
  )
}
