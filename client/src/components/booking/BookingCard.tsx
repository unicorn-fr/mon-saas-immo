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
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  CONFIRMED: {
    label: 'Confirmée',
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  CANCELLED: {
    label: 'Annulée',
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  COMPLETED: {
    label: 'Terminée',
    icon: CheckCircle,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
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
      className={`
        bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md
        ${statusConfig.borderColor}
      `}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Property Info */}
          <div className="flex-1">
            <h3
              onClick={() => navigate(`/property/${booking.property.id}`)}
              className="text-lg font-bold text-gray-900 hover:text-primary-600 cursor-pointer transition-colors"
            >
              {booking.property.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              <span>
                {booking.property.city}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border
            `}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </div>
        </div>

        {/* Visit Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Date de visite</p>
              <p className="font-semibold text-gray-900">{formattedDateShort}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Horaire</p>
              <p className="font-semibold text-gray-900">
                {booking.visitTime} ({booking.duration} min)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">
                {viewMode === 'owner' ? 'Visiteur' : 'Propriétaire'}
              </p>
              <p className="font-semibold text-gray-900">
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
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600 mb-1">Notes</p>
                <p className="text-sm text-gray-900">{booking.tenantNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Reason */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div className="bg-red-50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-red-600 mb-1">Raison de l'annulation</p>
                <p className="text-sm text-red-900">{booking.cancellationReason}</p>
                <p className="text-xs text-red-600 mt-1">
                  Annulée le {format(new Date(booking.cancelledAt!), 'Pp', { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {(canConfirm || canCancel) && (
          <div className="flex items-center gap-3 pt-4 border-t">
            {canConfirm && onConfirm && (
              <button
                onClick={() => onConfirm(booking.id)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="flex-1 px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            )}
          </div>
        )}

        {/* Booking Info Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t text-xs text-gray-500">
          <span>Réservation #{booking.id.slice(0, 8)}</span>
          <span>Créée le {format(new Date(booking.createdAt), 'Pp', { locale: fr })}</span>
        </div>
      </div>
    </div>
  )
}
