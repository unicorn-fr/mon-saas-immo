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
import { BAI } from '../../constants/bailio-tokens'

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
          <h2 className="text-lg font-semibold" style={{ color: BAI.ink }}>Disponibilites de visite</h2>
          <p className="text-sm mt-1" style={{ color: BAI.inkFaint }}>
            {totalConfig === 0
              ? 'Par defaut : tous les jours de 9h a 18h'
              : `${dateOverrides.length} date(s) specifique(s), ${recurringSlots.length} creneau(x) recurrent(s)`}
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5" style={{ color: BAI.inkFaint }} />
        ) : (
          <ChevronDown className="w-5 h-5" style={{ color: BAI.inkFaint }} />
        )}
      </button>

      {isOpen && (
        <div className="mt-6">
          {/* Info banner */}
          <div
            className="rounded-xl p-3 mb-4 flex gap-2"
            style={{
              background: BAI.ownerLight,
              border: `1px solid ${BAI.ownerBorder}`,
            }}
          >
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BAI.owner }} />
            <p className="text-xs" style={{ color: BAI.owner }}>
              Configurez vos disponibilites pour les visites. Sans configuration, les locataires
              pourront reserver tous les jours de 9h a 18h.
            </p>
          </div>

          {/* Visit Duration Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: BAI.inkMid }}>
              <Clock className="w-4 h-4 inline mr-1.5" />
              Duree des visites
            </label>
            <div className="flex flex-wrap gap-2">
              {VISIT_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => onDurationChange(d.value)}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                  style={
                    visitDuration === d.value
                      ? {
                          background: BAI.night,
                          color: BAI.bgSurface,
                          outline: `2px solid ${BAI.ownerBorder}`,
                          outlineOffset: '2px',
                        }
                      : {
                          background: BAI.bgSurface,
                          color: BAI.inkMid,
                          border: `1px solid ${BAI.border}`,
                        }
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex mb-4"
            style={{ borderBottom: `1px solid ${BAI.border}` }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('dates')}
              className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              style={
                activeTab === 'dates'
                  ? { borderColor: BAI.owner, color: BAI.owner }
                  : { borderColor: 'transparent', color: BAI.inkFaint }
              }
            >
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Dates specifiques
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recurring')}
              className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              style={
                activeTab === 'recurring'
                  ? { borderColor: BAI.owner, color: BAI.owner }
                  : { borderColor: 'transparent', color: BAI.inkFaint }
              }
            >
              <Clock className="w-4 h-4 inline mr-1.5" />
              Recurrent hebdomadaire
            </button>
          </div>

          {/* === TAB: Dates specifiques === */}
          {activeTab === 'dates' && (
            <div className="space-y-4">
              {/* Calendar */}
              <div
                className="rounded-xl p-3"
                style={{ border: `1px solid ${BAI.border}` }}
              >
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1 rounded"
                    onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: BAI.inkMid }} />
                  </button>
                  <h4 className="text-sm font-semibold" style={{ color: BAI.ink }}>
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </h4>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 rounded"
                    onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ChevronRight className="w-5 h-5" style={{ color: BAI.inkMid }} />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_HEADERS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium py-1" style={{ color: BAI.inkFaint }}>
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

                    let cellStyle: React.CSSProperties = {}

                    if (isPast) {
                      cellStyle = { color: BAI.inkFaint, cursor: 'not-allowed' }
                    } else if (isBlocked) {
                      cellStyle = {
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '2px solid #fca5a5',
                        cursor: 'pointer',
                      }
                    } else if (isAvailable) {
                      cellStyle = {
                        background: BAI.tenantLight,
                        color: BAI.tenant,
                        border: `2px solid ${BAI.tenantBorder}`,
                        cursor: 'pointer',
                      }
                    } else if (isSelected) {
                      cellStyle = {
                        background: BAI.ownerLight,
                        color: BAI.owner,
                        border: `2px solid ${BAI.ownerBorder}`,
                        cursor: 'pointer',
                      }
                    } else if (isToday) {
                      cellStyle = {
                        background: BAI.bgMuted,
                        color: BAI.ink,
                        border: `1px solid ${BAI.border}`,
                        cursor: 'pointer',
                      }
                    } else {
                      cellStyle = {
                        color: BAI.inkMid,
                        border: '1px solid transparent',
                        cursor: 'pointer',
                      }
                    }

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => !isPast && handleDateClick(date)}
                        disabled={isPast}
                        className="h-9 w-full rounded-md text-sm font-medium transition-all"
                        style={cellStyle}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div
                  className="flex flex-wrap gap-3 mt-3 pt-3"
                  style={{ borderTop: `1px solid ${BAI.border}` }}
                >
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: BAI.inkFaint }}>
                    <div
                      className="w-3 h-3 rounded"
                      style={{ background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}` }}
                    />
                    Disponible
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: BAI.inkFaint }}>
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                    Bloque
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: BAI.inkFaint }}>
                    <div
                      className="w-3 h-3 rounded"
                      style={{ background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}` }}
                    />
                    Selectionne
                  </div>
                </div>
              </div>

              {/* Selected date configuration */}
              {selectedDate && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: BAI.bgMuted,
                    border: `1px solid ${BAI.border}`,
                  }}
                >
                  <p className="text-sm font-semibold mb-3" style={{ color: BAI.ink }}>
                    {formatDateFR(selectedDate)} - Configurer la disponibilite
                  </p>

                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: BAI.inkFaint }}>De</label>
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
                      <label className="block text-xs mb-1" style={{ color: BAI.inkFaint }}>A</label>
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
                  <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: BAI.inkFaint }}>
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
                            className="flex items-center justify-between rounded-xl px-3 py-2 border text-sm"
                            style={
                              override.type === 'BLOCKED'
                                ? { background: '#fef2f2', borderColor: '#fca5a5', color: '#9b1c1c' }
                                : { background: BAI.tenantLight, borderColor: BAI.tenantBorder, color: BAI.tenant }
                            }
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
              <p className="text-xs" style={{ color: BAI.inkFaint }}>
                Les creneaux recurrents s'appliquent chaque semaine. Les dates specifiques sont
                prioritaires.
              </p>

              {/* Existing recurring slots */}
              {recurringSlots.length > 0 && (
                <div className="space-y-1.5">
                  {recurringSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl px-3 py-2"
                      style={{
                        background: BAI.ownerLight,
                        border: `1px solid ${BAI.ownerBorder}`,
                      }}
                    >
                      <span className="text-sm" style={{ color: BAI.owner }}>
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
                  <label className="block text-xs mb-1" style={{ color: BAI.inkFaint }}>Jour</label>
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
                  <label className="block text-xs mb-1" style={{ color: BAI.inkFaint }}>De</label>
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
                  <label className="block text-xs mb-1" style={{ color: BAI.inkFaint }}>A</label>
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
