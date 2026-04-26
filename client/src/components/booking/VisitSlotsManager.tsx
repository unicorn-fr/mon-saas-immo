import { useEffect, useState } from 'react'
import { X, Plus, Loader, Clock, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingService } from '../../services/booking.service'
import { VisitSlot } from '../../types/booking.types'

interface Props {
  propertyId: string
  onClose?: () => void
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_OPTIONS = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 0 },
]

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => {
  const h = i + 8
  return `${String(h).padStart(2, '0')}:00`
})
// ['08:00', '09:00', ..., '20:00']

export const VisitSlotsManager = ({ propertyId, onClose }: Props) => {
  const [slots, setSlots] = useState<VisitSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '18:00',
  })

  useEffect(() => {
    loadSlots()
  }, [propertyId])

  const loadSlots = async () => {
    setIsLoading(true)
    try {
      const data = await bookingService.getPropertySlots(propertyId)
      setSlots(data)
    } catch {
      toast.error('Impossible de charger les créneaux')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (slotId: string) => {
    setDeletingId(slotId)
    try {
      await bookingService.deletePropertySlot(propertyId, slotId)
      setSlots((prev) => prev.filter((s) => s.id !== slotId))
      toast.success('Créneau supprimé')
    } catch {
      toast.error('Impossible de supprimer le créneau')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAdd = async () => {
    if (form.endTime <= form.startTime) {
      toast.error("L'heure de fin doit être après l'heure de début")
      return
    }

    const duplicate = slots.find(
      (s) =>
        s.dayOfWeek === form.dayOfWeek &&
        s.startTime === form.startTime &&
        s.endTime === form.endTime
    )
    if (duplicate) {
      toast.error('Ce créneau existe déjà')
      return
    }

    setIsAdding(true)
    try {
      const newSlot = await bookingService.createPropertySlot(propertyId, form)
      setSlots((prev) => [...prev, newSlot])
      toast.success('Créneau ajouté')
    } catch {
      toast.error("Impossible d'ajouter le créneau")
    } finally {
      setIsAdding(false)
    }
  }

  const selectStyle: React.CSSProperties = {
    border: '1px solid #e4e1db',
    background: '#f8f7f4',
    borderRadius: 8,
    color: '#0d0c0a',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 16,
    padding: '10px 10px',
    outline: 'none',
    minHeight: 44,
    width: '100%',
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e4e1db',
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Header — padding et font responsive */}
      <div
        className="flex items-center justify-between px-4 py-4 sm:p-5"
        style={{ borderBottom: '1px solid #e4e1db' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center"
            style={{ background: '#eaf0fb', borderRadius: 9 }}
          >
            <Clock className="w-4 h-4" style={{ color: '#1a3270' }} />
          </div>
          <div className="min-w-0">
            <h3 style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: 600, color: '#0d0c0a' }}>
              Créneaux de visite disponibles
            </h3>
            <p style={{ fontSize: 12, color: '#9e9b96', marginTop: 1 }}>
              Définissez vos plages horaires récurrentes
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 flex items-center justify-center transition-opacity hover:opacity-70"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#f4f2ee',
              border: 'none',
              cursor: 'pointer',
              marginLeft: 12,
            }}
          >
            <X className="w-4 h-4" style={{ color: '#5a5754' }} />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Existing slots */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader className="w-5 h-5 animate-spin" style={{ color: '#1a3270' }} />
          </div>
        ) : slots.length === 0 ? (
          <div
            className="flex gap-3 p-4"
            style={{ background: '#fdf5ec', border: '1px solid #f3c99a', borderRadius: 10 }}
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#92400e' }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
                Aucun créneau configuré
              </p>
              <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                Les locataires dont la candidature est approuvée ne peuvent pas encore réserver de visite pour ce bien.
                Ajoutez vos plages horaires ci-dessous pour les débloquer.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between flex-wrap gap-2 px-4 py-3"
                style={{
                  background: '#eaf0fb',
                  border: '1px solid #b8ccf0',
                  borderRadius: 9,
                }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#1a3270',
                      background: '#ffffff',
                      border: '1px solid #b8ccf0',
                      borderRadius: 6,
                      padding: '4px 8px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {DAYS[slot.dayOfWeek]}
                  </span>
                  <span style={{ fontSize: 13, color: '#1a3270', fontWeight: 500 }}>
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>
                {/* Delete button — touch target 44px */}
                <button
                  onClick={() => handleDelete(slot.id)}
                  disabled={deletingId === slot.id}
                  className="flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    cursor: 'pointer',
                  }}
                >
                  {deletingId === slot.id ? (
                    <Loader className="w-4 h-4 animate-spin" style={{ color: '#9b1c1c' }} />
                  ) : (
                    <X className="w-4 h-4" style={{ color: '#9b1c1c' }} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add slot form — selects en grid 1 col mobile, 3 cols sm+ */}
        <div
          className="p-4 space-y-3"
          style={{ background: '#fafaf8', border: '1px solid #e4e1db', borderRadius: 10 }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: '#5a5754', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Ajouter un créneau
          </p>

          {/* Selects: colonne sur mobile, 3 colonnes sur sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
              style={selectStyle}
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <select
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              style={selectStyle}
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  De {h}
                </option>
              ))}
            </select>

            <select
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              style={selectStyle}
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  À {h}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Ajouter — full width sur mobile, auto sur sm+ */}
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="flex items-center justify-center gap-2 w-full sm:w-auto transition-opacity hover:opacity-80"
            style={{
              background: '#1a3270',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '0 20px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              minHeight: 44,
            }}
          >
            {isAdding ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isAdding ? 'Ajout en cours...' : 'Ajouter ce créneau'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VisitSlotsManager
