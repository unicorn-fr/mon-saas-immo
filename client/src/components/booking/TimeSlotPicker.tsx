import { Clock, Loader } from 'lucide-react'

interface TimeSlotPickerProps {
  selectedDate: string
  selectedTime: string | null
  availableSlots: string[]
  isLoading?: boolean
  onTimeSelect: (time: string) => void
}

export const TimeSlotPicker = ({
  selectedDate,
  selectedTime,
  availableSlots,
  isLoading = false,
  onTimeSelect,
}: TimeSlotPickerProps) => {
  if (!selectedDate) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">Veuillez d'abord sélectionner une date</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-600">Chargement des créneaux disponibles...</p>
      </div>
    )
  }

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-900 font-medium mb-2">Aucun créneau disponible</p>
        <p className="text-sm text-gray-600">
          Tous les créneaux sont réservés pour cette date. Veuillez choisir une autre date.
        </p>
      </div>
    )
  }

  // Group slots by period (morning, afternoon, evening)
  const morningSlots = availableSlots.filter((slot) => {
    const hour = parseInt(slot.split(':')[0])
    return hour >= 9 && hour < 12
  })

  const afternoonSlots = availableSlots.filter((slot) => {
    const hour = parseInt(slot.split(':')[0])
    return hour >= 12 && hour < 17
  })

  const eveningSlots = availableSlots.filter((slot) => {
    const hour = parseInt(slot.split(':')[0])
    return hour >= 17
  })

  const SlotButton = ({ time }: { time: string }) => {
    const isSelected = selectedTime === time
    const isAvailable = availableSlots.includes(time)

    return (
      <button
        onClick={() => isAvailable && onTimeSelect(time)}
        disabled={!isAvailable}
        className={`
          px-4 py-3 rounded-lg font-medium text-sm transition-all
          ${
            isSelected
              ? 'bg-primary-600 text-white ring-2 ring-primary-200 shadow-md'
              : isAvailable
              ? 'bg-white text-gray-700 border border-gray-300 hover:border-primary-400 hover:bg-primary-50'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
          }
        `}
      >
        {time}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>
          {availableSlots.length} créneau{availableSlots.length > 1 ? 'x' : ''} disponible
          {availableSlots.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Morning Slots */}
      {morningSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Matinée (9h - 12h)</h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {morningSlots.map((time) => (
              <SlotButton key={time} time={time} />
            ))}
          </div>
        </div>
      )}

      {/* Afternoon Slots */}
      {afternoonSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Après-midi (12h - 17h)</h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {afternoonSlots.map((time) => (
              <SlotButton key={time} time={time} />
            ))}
          </div>
        </div>
      )}

      {/* Evening Slots */}
      {eveningSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Soirée (17h - 18h)</h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {eveningSlots.map((time) => (
              <SlotButton key={time} time={time} />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-600 rounded"></div>
          <span>Sélectionné</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span>Réservé</span>
        </div>
      </div>
    </div>
  )
}
