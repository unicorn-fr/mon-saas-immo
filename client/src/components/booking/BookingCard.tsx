import { Calendar, Clock, MapPin, User, MessageSquare, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Booking, BookingStatus } from '../../types/booking.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'

interface BookingCardProps {
  booking: Booking
  viewMode: 'owner' | 'tenant'
  onConfirm?: (id: string) => void
  onCancel?: (id: string) => void
  isLoading?: boolean
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
    color: '#92400e',
    bgColor: '#fdf5ec',
    borderColor: '#f3c99a',
  },
  CONFIRMED: {
    label: 'Confirmée',
    icon: CheckCircle,
    color: BAI.tenant,
    bgColor: BAI.tenantLight,
    borderColor: BAI.tenantBorder,
  },
  CANCELLED: {
    label: 'Annulée',
    icon: XCircle,
    color: BAI.error,
    bgColor: BAI.errorLight,
    borderColor: '#fca5a5',
  },
  COMPLETED: {
    label: 'Terminée',
    icon: CheckCircle,
    color: BAI.inkMid,
    bgColor: BAI.bgMuted,
    borderColor: BAI.border,
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
        background: BAI.bgSurface,
        border: `1px solid ${statusConfig.borderColor}`,
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease',
        fontFamily: BAI.fontBody,
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
                color: BAI.ink,
                marginBottom: 4,
                lineHeight: 1.3,
                fontFamily: BAI.fontBody,
              }}
            >
              {booking.property.title}
            </h3>
            <div className="flex items-center gap-1.5" style={{ color: BAI.inkMid, fontSize: 13 }}>
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
              style={{ background: BAI.ownerLight, borderRadius: 10 }}
            >
              <Calendar className="w-4 h-4" style={{ color: BAI.owner }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Date</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink }}>{formattedDateShort}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ background: BAI.ownerLight, borderRadius: 10 }}
            >
              <Clock className="w-4 h-4" style={{ color: BAI.owner }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Horaire</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink }}>
                {booking.visitTime} · {booking.duration} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ background: BAI.ownerLight, borderRadius: 10 }}
            >
              <User className="w-4 h-4" style={{ color: BAI.owner }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>
                {viewMode === 'owner' ? 'Visiteur' : 'Propriétaire'}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink }}>
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
            style={{ background: BAI.bgMuted, borderRadius: 8 }}
          >
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BAI.inkMid }} />
            <div>
              <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Notes</p>
              <p style={{ fontSize: 13, color: BAI.ink }}>{booking.tenantNotes}</p>
            </div>
          </div>
        )}

        {/* Cancellation Reason */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div
            className="flex items-start gap-2 p-3 mb-4"
            style={{ background: BAI.errorLight, border: `1px solid #fca5a5`, borderRadius: 8 }}
          >
            <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BAI.error }} />
            <div>
              <p style={{ fontSize: 11, color: BAI.error, marginBottom: 2 }}>Raison de l'annulation</p>
              <p style={{ fontSize: 13, color: BAI.error }}>{booking.cancellationReason}</p>
              {booking.cancelledAt && (
                <p style={{ fontSize: 11, color: BAI.error, opacity: 0.7, marginTop: 2 }}>
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
              background: BAI.tenantLight,
              border: `1px solid ${BAI.tenantBorder}`,
              borderRadius: 10,
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: BAI.tenant }} />
              <p style={{ fontSize: 13, color: BAI.tenant, fontWeight: 500 }}>
                Visite confirmée — ajoutez-la à votre agenda
              </p>
            </div>
            <a
              href={buildGoogleCalendarUrl(booking)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5"
              style={{
                background: BAI.tenant,
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: BAI.fontBody,
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
            style={{ borderTop: `1px solid ${BAI.border}` }}
          >
            {canConfirm && onConfirm && (
              <button
                onClick={() => onConfirm(booking.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4"
                style={{
                  background: BAI.night,
                  color: '#ffffff',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  fontFamily: BAI.fontBody,
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
                  background: BAI.bgSurface,
                  color: BAI.error,
                  border: `1px solid #fca5a5`,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  fontFamily: BAI.fontBody,
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
          style={{ borderTop: `1px solid ${BAI.border}`, fontSize: 11, color: BAI.inkFaint }}
        >
          <span>Réservation #{booking.id.slice(0, 8)}</span>
          <span>Créée le {format(new Date(booking.createdAt), 'Pp', { locale: fr })}</span>
        </div>
      </div>
    </div>
  )
}
