import { Calendar, Clock, MapPin, User, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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
    color: '#1b5e3b',
    bgColor: '#edf7f2',
    borderColor: '#9fd4ba',
  },
  CANCELLED: {
    label: 'Annulée',
    icon: XCircle,
    color: '#9b1c1c',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  COMPLETED: {
    label: 'Terminée',
    icon: CheckCircle,
    color: '#5a5754',
    bgColor: '#f4f2ee',
    borderColor: '#e4e1db',
  },
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

  // Format date and time
  const visitDate = new Date(booking.visitDate)
  const formattedDateShort = format(visitDate, 'd MMM yyyy', { locale: fr })

  // Check if booking is in the past
  const isPast = visitDate < new Date()
  const canConfirm = viewMode === 'owner' && booking.status === 'PENDING' && !isPast
  const canCancel = booking.status === 'PENDING' && !isPast

  return (
    <div
      className="bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md"
      style={{ borderColor: statusConfig.borderColor }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Property Info */}
          <div className="flex-1">
            <h3
              onClick={() => navigate(`/property/${booking.property.id}`)}
              className="text-lg font-bold cursor-pointer transition-colors"
              style={{ color: '#0d0c0a' }}
            >
              {booking.property.title}
            </h3>
            <div className="flex items-center gap-2 text-sm mt-1" style={{ color: '#5a5754' }}>
              <MapPin className="w-4 h-4" />
              <span>
                {booking.property.city}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border"
            style={{
              background: statusConfig.bgColor,
              color: statusConfig.color,
              borderColor: statusConfig.borderColor,
            }}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </div>
        </div>

        {/* Visit Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#eaf0fb' }}
            >
              <Calendar className="w-5 h-5" style={{ color: '#1a3270' }} />
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#5a5754' }}>Date de visite</p>
              <p className="font-semibold" style={{ color: '#0d0c0a' }}>{formattedDateShort}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#eaf0fb' }}
            >
              <Clock className="w-5 h-5" style={{ color: '#1a3270' }} />
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#5a5754' }}>Horaire</p>
              <p className="font-semibold" style={{ color: '#0d0c0a' }}>
                {booking.visitTime} ({booking.duration} min)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#eaf0fb' }}
            >
              <User className="w-5 h-5" style={{ color: '#1a3270' }} />
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#5a5754' }}>
                {viewMode === 'owner' ? 'Visiteur' : 'Propriétaire'}
              </p>
              <p className="font-semibold" style={{ color: '#0d0c0a' }}>
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
          <div className="rounded-xl p-4 mb-4" style={{ background: '#f4f2ee' }}>
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#5a5754' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: '#5a5754' }}>Notes</p>
                <p className="text-sm" style={{ color: '#0d0c0a' }}>{booking.tenantNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Reason */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div className="rounded-xl p-4 mb-4" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#9b1c1c' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: '#9b1c1c' }}>Raison de l'annulation</p>
                <p className="text-sm" style={{ color: '#9b1c1c' }}>{booking.cancellationReason}</p>
                <p className="text-xs mt-1" style={{ color: '#9b1c1c' }}>
                  Annulée le {format(new Date(booking.cancelledAt!), 'Pp', { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {(canConfirm || canCancel) && (
          <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: '#e4e1db' }}>
            {canConfirm && onConfirm && (
              <button
                onClick={() => onConfirm(booking.id)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: '#1a1a2e', color: '#ffffff' }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirmer la visite
                  </>
                )}
              </button>
            )}

            {canCancel && onCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: '#ffffff', color: '#9b1c1c', border: '1px solid #fca5a5' }}
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            )}
          </div>
        )}

        {/* Booking Info Footer */}
        <div
          className="flex items-center justify-between pt-4 mt-4 border-t text-xs"
          style={{ borderColor: '#e4e1db', color: '#9e9b96' }}
        >
          <span>Réservation #{booking.id.slice(0, 8)}</span>
          <span>Créée le {format(new Date(booking.createdAt), 'Pp', { locale: fr })}</span>
        </div>
      </div>
    </div>
  )
}
