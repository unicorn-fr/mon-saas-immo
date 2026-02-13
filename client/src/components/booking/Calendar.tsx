import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
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
  isBefore,
  startOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Booking } from '../../types/booking.types'

interface CalendarProps {
  bookings: Booking[]
  onDateSelect?: (date: Date) => void
  selectedDate?: Date | null
  minDate?: Date
}

export const Calendar = ({
  bookings,
  onDateSelect,
  selectedDate = null,
  minDate = new Date(),
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = monthStart.getDay()
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  // Create padding days from previous month
  const paddingDays = Array(startPadding).fill(null)

  // Get bookings by date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.visitDate)
      return isSameDay(bookingDate, date)
    })
  }

  // Check if date is selectable
  const isDateSelectable = (date: Date) => {
    return !isBefore(startOfDay(date), startOfDay(minDate))
  }

  // Get status indicator color
  const getDateIndicator = (date: Date) => {
    const dateBookings = getBookingsForDate(date)
    if (dateBookings.length === 0) return null

    const hasConfirmed = dateBookings.some((b) => b.status === 'CONFIRMED')
    const hasPending = dateBookings.some((b) => b.status === 'PENDING')
    const hasCancelled = dateBookings.some((b) => b.status === 'CANCELLED')

    if (hasConfirmed) return 'bg-green-500'
    if (hasPending) return 'bg-yellow-500'
    if (hasCancelled) return 'bg-red-500'
    return 'bg-gray-400'
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDateClick = (date: Date) => {
    if (isDateSelectable(date) && onDateSelect) {
      onDateSelect(date)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary-600" />
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding days */}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="aspect-square" />
        ))}

        {/* Month days */}
        {monthDays.map((date) => {
          const dateBookings = getBookingsForDate(date)
          const isSelected = selectedDate && isSameDay(date, selectedDate)
          const isCurrentDay = isToday(date)
          const isSelectable = isDateSelectable(date)
          const indicator = getDateIndicator(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={!isSelectable || !onDateSelect}
              className={`
                aspect-square p-2 rounded-lg text-sm font-medium transition-all relative
                ${
                  isSelected
                    ? 'bg-primary-600 text-white ring-2 ring-primary-200'
                    : isCurrentDay
                    ? 'bg-primary-50 text-primary-700 border border-primary-300'
                    : isSameMonth(date, currentMonth)
                    ? isSelectable
                      ? 'text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-300'
                }
                ${!isSelectable || !onDateSelect ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <span className="block">{format(date, 'd')}</span>

              {/* Booking indicators */}
              {dateBookings.length > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {indicator && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${indicator}`}
                      title={`${dateBookings.length} réservation(s)`}
                    />
                  )}
                  {dateBookings.length > 1 && (
                    <span className="text-[10px] font-bold">
                      {dateBookings.length}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Confirmée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Annulée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary-50 border border-primary-300 rounded"></div>
          <span>Aujourd'hui</span>
        </div>
      </div>
    </div>
  )
}
