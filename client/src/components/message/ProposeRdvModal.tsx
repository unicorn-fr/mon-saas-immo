import { useState, useEffect } from 'react'
import { X, Plus, Trash2, CalendarCheck, Loader2 } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'

const M = {
  bg:          '#fafaf8',
  surface:     '#ffffff',
  muted:       '#f4f2ee',
  inputBg:     '#f8f7f4',
  ink:         '#0d0c0a',
  inkMid:      '#5a5754',
  inkFaint:    '#9e9b96',
  owner:       '#1a3270',
  ownerLight:  '#eaf0fb',
  ownerBorder: '#b8ccf0',
  border:      '#e4e1db',
  danger:      '#9b1c1c',
  dangerBg:    '#fef2f2',
}

export interface RdvSlot {
  date: string
  time: string
}

export interface RdvProposal {
  __rdv: 'proposal'
  propertyId: string
  propertyTitle: string
  slots: RdvSlot[]
  duration: number
}

interface ProposeRdvModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (proposal: RdvProposal) => Promise<void>
}

export function ProposeRdvModal({ isOpen, onClose, onSubmit }: ProposeRdvModalProps) {
  const { myProperties, fetchMyProperties } = useProperties()
  const [propertyId, setPropertyId] = useState('')
  const [duration, setDuration] = useState(30)
  const [slots, setSlots] = useState<RdvSlot[]>([{ date: '', time: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) fetchMyProperties({ page: 1, limit: 50 })
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) {
      setPropertyId('')
      setSlots([{ date: '', time: '' }])
      setDuration(30)
      setError('')
    }
  }, [isOpen])

  function addSlot() {
    if (slots.length < 4) setSlots(s => [...s, { date: '', time: '' }])
  }

  function removeSlot(i: number) {
    setSlots(s => s.filter((_, idx) => idx !== i))
  }

  function updateSlot(i: number, key: 'date' | 'time', val: string) {
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, [key]: val } : slot))
  }

  async function handleSubmit() {
    setError('')
    if (!propertyId) { setError('Sélectionnez un bien'); return }
    const validSlots = slots.filter(s => s.date && s.time)
    if (validSlots.length === 0) { setError('Ajoutez au moins un créneau'); return }

    const prop = myProperties.find(p => p.id === propertyId)
    const proposal: RdvProposal = {
      __rdv: 'proposal',
      propertyId,
      propertyTitle: prop?.title ?? propertyId,
      slots: validSlots,
      duration,
    }

    setSubmitting(true)
    try {
      await onSubmit(proposal)
      onClose()
    } catch {
      setError('Erreur lors de l\'envoi. Réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const inputStyle: React.CSSProperties = {
    background: M.inputBg, border: `1px solid ${M.border}`, borderRadius: 8,
    padding: '0.5rem 0.75rem', fontFamily: 'DM Sans, system-ui, sans-serif',
    fontSize: 14, color: M.ink, outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(13,12,10,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: M.surface, borderRadius: 20, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(13,12,10,0.2)',
        border: `1px solid ${M.border}`,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${M.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: M.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarCheck size={18} style={{ color: M.owner }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: M.ink, fontFamily: 'DM Sans, system-ui', margin: 0 }}>
                Proposer un RDV
              </p>
              <p style={{ fontSize: 12, color: M.inkFaint, margin: 0 }}>Envoyez des créneaux au locataire</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: M.inkFaint, padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Property selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: M.inkMid, display: 'block', marginBottom: 6 }}>
              Bien concerné
            </label>
            <select
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Sélectionner un bien…</option>
              {myProperties.map(p => (
                <option key={p.id} value={p.id}>{p.title} – {p.city}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: M.inkMid, display: 'block', marginBottom: 6 }}>
              Durée de la visite
            </label>
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ ...inputStyle, maxWidth: 160 }}
            >
              {[15, 20, 30, 45, 60, 90].map(d => (
                <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60}h`}</option>
              ))}
            </select>
          </div>

          {/* Slots */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: M.inkMid }}>
                Créneaux proposés
              </label>
              {slots.length < 4 && (
                <button
                  type="button"
                  onClick={addSlot}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                    fontWeight: 600, color: M.owner, background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Ajouter un créneau
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slots.map((slot, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    value={slot.date}
                    min={today}
                    onChange={e => updateSlot(i, 'date', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="time"
                    value={slot.time}
                    onChange={e => updateSlot(i, 'time', e.target.value)}
                    style={{ ...inputStyle, flex: '0 0 100px' }}
                  />
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: M.inkFaint, padding: 4, flexShrink: 0 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: M.danger, background: M.dangerBg, padding: '8px 12px', borderRadius: 8, margin: 0 }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${M.border}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 10, border: `1px solid ${M.border}`,
              background: M.surface, fontSize: 13, fontWeight: 500, color: M.inkMid, cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
              borderRadius: 10, border: 'none', background: submitting ? '#8a9ac0' : M.owner,
              fontSize: 13, fontWeight: 600, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? <Loader2 size={14} /> : <CalendarCheck size={14} />}
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}
