import { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Calendar,
  CalendarOff,
  Info,
} from 'lucide-react'
import {
  VisitAvailabilitySlot,
  VisitDateOverride,
  DAYS_OF_WEEK,
  VISIT_DURATIONS,
} from '../../types/property.types'

interface AvailabilitySchedulerProps {
  recurringSlots: VisitAvailabilitySlot[]
  dateOverrides: VisitDateOverride[]
  visitDuration: number
  onSlotsChange: (slots: VisitAvailabilitySlot[]) => void
  onOverridesChange: (overrides: VisitDateOverride[]) => void
  onDurationChange: (duration: number) => void
}

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 21; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
  }
}

const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
]

const DAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

type TabMode = 'dates' | 'recurring'

export function AvailabilityScheduler({
  recurringSlots,
  dateOverrides,
  visitDuration,
  onSlotsChange,
  onOverridesChange,
  onDurationChange,
}: AvailabilitySchedulerProps) {
  const [isOpen, setIsOpen] = useState(recurringSlots.length > 0 || dateOverrides.length > 0)
  const [activeTab, setActiveTab] = useState<TabMode>('dates')

  // Calendar state
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())

  // Selected date for adding availability
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('18:00')

  // Recurring slot form
  const [newSlotDay, setNewSlotDay] = useState(6) // Samedi par defaut
  const [newSlotStart, setNewSlotStart] = useState('09:00')
  const [newSlotEnd, setNewSlotEnd] = useState('18:00')

  // Build a map of date -> override for quick lookup
  const overrideMap = useMemo(() => {
    const map = new Map<string, VisitDateOverride>()
    dateOverrides.forEach((o) => {
      const key = o.date.split('T')[0] // handle ISO strings
      map.set(key, o)
    })
    return map
  }, [dateOverrides])

  // Calendar generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1)
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0)

    // Monday = 0 in our grid, Sunday = 6
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days: (Date | null)[] = []

    // Fill empty cells before first day
    for (let i = 0; i < startDow; i++) {
      days.push(null)
    }

    // Fill actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(calendarYear, calendarMonth, d))
    }

    return days
  }, [calendarMonth, calendarYear])

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(calendarYear - 1)
    } else {
      setCalendarMonth(calendarMonth - 1)
    }
  }

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(calendarYear + 1)
    } else {
      setCalendarMonth(calendarMonth + 1)
    }
  }

  const handleDateClick = (date: Date) => {
    const key = toDateKey(date)
    if (date < today) return // Can't select past dates

    const existing = overrideMap.get(key)
    if (existing) {
      // Toggle off: remove the override
      onOverridesChange(dateOverrides.filter((o) => o.date.split('T')[0] !== key))
      if (selectedDate === key) setSelectedDate(null)
    } else {
      // Select this date for configuration
      setSelectedDate(key)
      setNewStart('09:00')
      setNewEnd('18:00')
    }
  }

  const addDateAvailability = () => {
    if (!selectedDate || newStart >= newEnd) return

    const override: VisitDateOverride = {
      date: selectedDate,
      type: 'EXTRA',
      startTime: newStart,
      endTime: newEnd,
    }

    // Replace if already exists for this date
    const filtered = dateOverrides.filter((o) => o.date.split('T')[0] !== selectedDate)
    onOverridesChange([...filtered, override])
    setSelectedDate(null)
  }

  const blockDate = () => {
    if (!selectedDate) return

    const override: VisitDateOverride = {
      date: selectedDate,
      type: 'BLOCKED',
    }

    const filtered = dateOverrides.filter((o) => o.date.split('T')[0] !== selectedDate)
    onOverridesChange([...filtered, override])
    setSelectedDate(null)
  }

  const removeOverride = (dateStr: string) => {
    onOverridesChange(dateOverrides.filter((o) => o.date.split('T')[0] !== dateStr))
    if (selectedDate === dateStr) setSelectedDate(null)
  }

  const addRecurringSlot = () => {
    if (newSlotStart >= newSlotEnd) return
    onSlotsChange([
      ...recurringSlots,
      { dayOfWeek: newSlotDay, startTime: newSlotStart, endTime: newSlotEnd },
    ])
  }

  const removeRecurringSlot = (index: number) => {
    onSlotsChange(recurringSlots.filter((_, i) => i !== index))
  }

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || ''
  }

  const totalConfig = recurringSlots.length + dateOverrides.length

  return (
    <div className="card mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h2 className="text-lg font-semibold">Disponibilites de visite</h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalConfig === 0
              ? 'Par defaut : tous les jours de 9h a 18h'
              : `${dateOverrides.length} date(s) specifique(s), ${recurringSlots.length} creneau(x) recurrent(s)`}
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-6">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Configurez vos disponibilites pour les visites. Sans configuration, les locataires
              pourront reserver tous les jours de 9h a 18h.
            </p>
          </div>

          {/* Visit Duration Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1.5" />
              Duree des visites
            </label>
            <div className="flex flex-wrap gap-2">
              {VISIT_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => onDurationChange(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    visitDuration === d.value
                      ? 'bg-primary-600 text-white ring-2 ring-primary-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('dates')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dates'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Dates specifiques
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recurring')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'recurring'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1.5" />
              Recurrent hebdomadaire
            </button>
          </div>

          {/* === TAB: Dates specifiques === */}
          {activeTab === 'dates' && (
            <div className="space-y-4">
              {/* Calendar */}
              <div className="border border-gray-200 rounded-lg p-3">
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h4 className="text-sm font-semibold text-gray-800">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </h4>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_HEADERS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, i) => {
                    if (!date) {
                      return <div key={`empty-${i}`} className="h-9" />
                    }

                    const key = toDateKey(date)
                    const isPast = date < today
                    const isToday = key === toDateKey(today)
                    const override = overrideMap.get(key)
                    const isSelected = selectedDate === key
                    const isAvailable = override?.type === 'EXTRA'
                    const isBlocked = override?.type === 'BLOCKED'

                    let cellClass = 'h-9 w-full rounded-md text-sm font-medium transition-all '

                    if (isPast) {
                      cellClass += 'text-gray-300 cursor-not-allowed'
                    } else if (isBlocked) {
                      cellClass +=
                        'bg-red-100 text-red-700 border-2 border-red-300 cursor-pointer hover:bg-red-200'
                    } else if (isAvailable) {
                      cellClass +=
                        'bg-green-100 text-green-700 border-2 border-green-300 cursor-pointer hover:bg-green-200'
                    } else if (isSelected) {
                      cellClass +=
                        'bg-primary-100 text-primary-700 border-2 border-primary-400 cursor-pointer'
                    } else if (isToday) {
                      cellClass +=
                        'bg-gray-100 text-gray-900 border border-gray-300 cursor-pointer hover:bg-primary-50'
                    } else {
                      cellClass +=
                        'text-gray-700 hover:bg-primary-50 cursor-pointer border border-transparent'
                    }

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => !isPast && handleDateClick(date)}
                        disabled={isPast}
                        className={cellClass}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
                    Disponible
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                    Bloque
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-primary-100 border border-primary-400" />
                    Selectionne
                  </div>
                </div>
              </div>

              {/* Selected date configuration */}
              {selectedDate && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    {formatDateFR(selectedDate)} - Configurer la disponibilite
                  </p>

                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">De</label>
                      <select
                        value={newStart}
                        onChange={(e) => setNewStart(e.target.value)}
                        className="input text-sm py-1.5"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">A</label>
                      <select
                        value={newEnd}
                        onChange={(e) => setNewEnd(e.target.value)}
                        className="input text-sm py-1.5"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={addDateAvailability}
                      disabled={newStart >= newEnd}
                      className="btn btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Disponible
                    </button>

                    <button
                      type="button"
                      onClick={blockDate}
                      className="btn text-sm py-1.5 px-3 flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    >
                      <CalendarOff className="w-4 h-4" />
                      Bloquer
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="btn btn-secondary text-sm py-1.5 px-3"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* List of configured dates */}
              {dateOverrides.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Dates configurees ({dateOverrides.length})
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {[...dateOverrides]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((override) => {
                        const key = override.date.split('T')[0]
                        return (
                          <div
                            key={key}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 border text-sm ${
                              override.type === 'BLOCKED'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-green-50 border-green-200 text-green-800'
                            }`}
                          >
                            <span>
                              <strong>{formatDateFR(key)}</strong>
                              {override.type === 'EXTRA' && (
                                <> &mdash; {override.startTime} a {override.endTime}</>
                              )}
                              {override.type === 'BLOCKED' && <> &mdash; Bloque</>}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeOverride(key)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === TAB: Creneaux recurrents === */}
          {activeTab === 'recurring' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Les creneaux recurrents s'appliquent chaque semaine. Les dates specifiques sont
                prioritaires.
              </p>

              {/* Existing recurring slots */}
              {recurringSlots.length > 0 && (
                <div className="space-y-1.5">
                  {recurringSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-blue-800">
                        <strong>{getDayLabel(slot.dayOfWeek)}</strong> de {slot.startTime} a{' '}
                        {slot.endTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRecurringSlot(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add recurring slot form */}
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Jour</label>
                  <select
                    value={newSlotDay}
                    onChange={(e) => setNewSlotDay(parseInt(e.target.value))}
                    className="input text-sm py-1.5"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">De</label>
                  <select
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="input text-sm py-1.5"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">A</label>
                  <select
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="input text-sm py-1.5"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={addRecurringSlot}
                  disabled={newSlotStart >= newSlotEnd}
                  className="btn btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
