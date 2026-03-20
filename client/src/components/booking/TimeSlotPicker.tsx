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
        <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: '#ccc9c3' }} />
        <p style={{ color: '#5a5754' }}>Veuillez d'abord sélectionner une date</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#1a1a2e' }} />
        <p style={{ color: '#5a5754' }}>Chargement des créneaux disponibles...</p>
      </div>
    )
  }

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: '#ccc9c3' }} />
        <p className="font-medium mb-2" style={{ color: '#0d0c0a' }}>Aucun créneau disponible</p>
        <p className="text-sm" style={{ color: '#5a5754' }}>
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
        className="px-4 py-3 rounded-xl font-medium text-sm transition-all"
        style={
          isSelected
            ? { background: '#1a1a2e', color: '#ffffff', boxShadow: '0 2px 8px rgba(26,26,46,0.2)' }
            : isAvailable
            ? { background: '#ffffff', color: '#5a5754', border: '1px solid #e4e1db' }
            : { background: '#f4f2ee', color: '#9e9b96', cursor: 'not-allowed', opacity: 0.5 }
        }
      >
        {time}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: '#5a5754' }}>
        <Clock className="w-4 h-4" />
        <span>
          {availableSlots.length} créneau{availableSlots.length > 1 ? 'x' : ''} disponible
          {availableSlots.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Morning Slots */}
      {morningSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3" style={{ color: '#5a5754' }}>Matinée (9h - 12h)</h4>
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
          <h4 className="text-sm font-medium mb-3" style={{ color: '#5a5754' }}>Après-midi (12h - 17h)</h4>
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
          <h4 className="text-sm font-medium mb-3" style={{ color: '#5a5754' }}>Soirée (17h - 18h)</h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {eveningSlots.map((time) => (
              <SlotButton key={time} time={time} />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        className="flex items-center gap-4 text-xs pt-4 border-t"
        style={{ color: '#5a5754', borderColor: '#e4e1db' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: '#1a1a2e' }}></div>
          <span>Sélectionné</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: '#ffffff', border: '1px solid #e4e1db' }}></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: '#f4f2ee' }}></div>
          <span>Réservé</span>
        </div>
      </div>
    </div>
  )
}
