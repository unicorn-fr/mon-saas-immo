import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { TimeSlotPicker } from './TimeSlotPicker'
import { useBookings } from '../../hooks/useBookings'
import { BAI } from '../../constants/bailio-tokens'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  propertyTitle: string
  visitDuration?: number
  onSuccess?: () => void
}

export const BookingModal = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  visitDuration = 30,
  onSuccess,
}: BookingModalProps) => {
  const { createBooking, fetchAvailableSlots, availableSlots, isLoadingSlots, error } =
    useBookings()

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0]

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && propertyId) {
      fetchAvailableSlots(propertyId, selectedDate)
      setSelectedTime(null) // Reset time when date changes
    }
  }, [selectedDate, propertyId, fetchAvailableSlots])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation
      setTimeout(() => {
        setSelectedDate('')
        setSelectedTime(null)
        setNotes('')
        setSubmitError(null)
        setShowSuccess(false)
      }, 300)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime) {
      setSubmitError('Veuillez sélectionner une date et une heure')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await createBooking({
        propertyId,
        visitDate: selectedDate,
        visitTime: selectedTime,
        duration: visitDuration,
        tenantNotes: notes.trim() || undefined,
      })

      setShowSuccess(true)

      // Close modal after success
      setTimeout(() => {
        onClose()
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la réservation')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(13,12,10,0.5)',
        display: 'flex', alignItems: 'flex-end',
        overflowY: 'auto',
      }}
      className="sm:items-center sm:justify-center sm:p-4"
    >
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0 }}
        onClick={onClose}
      />

      {/* Modal — bottom sheet mobile, modal centré sm+ */}
      <div
        style={{
          position: 'relative',
          background: '#ffffff',
          boxShadow: '0 -4px 40px rgba(13,12,10,0.14)',
          width: '100%',
          maxWidth: 680,
          maxHeight: '95dvh',
          overflowY: 'auto',
          borderRadius: '20px 20px 0 0',
        }}
        className="sm:rounded-xl sm:shadow-2xl"
      >
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e4e1db' }} />
        </div>

          {/* Header */}
          <div
            className="flex items-start justify-between p-5 sm:p-6"
            style={{ borderBottom: `1px solid ${BAI.border}` }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(20px, 5vw, 26px)',
                  color: BAI.ink, margin: 0,
                }}
              >Réserver une visite</h2>
              <p className="text-sm mt-1" style={{ color: BAI.inkMid }}>{propertyTitle}</p>
            </div>
            <button
              onClick={onClose}
              style={{ color: BAI.inkFaint }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {showSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: BAI.tenant }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: BAI.ink }}>
                  Réservation confirmée !
                </h3>
                <p style={{ color: BAI.inkMid }}>
                  Votre demande de visite a été envoyée au propriétaire.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: BAI.inkMid }}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de visite
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={today}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{
                      border: `1px solid ${BAI.border}`,
                      outline: 'none',
                      background: BAI.bgSurface,
                      color: BAI.ink,
                    }}
                    required
                  />
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: BAI.inkMid }}>
                      <Clock className="w-4 h-4 inline mr-2" />
                      Heure de visite
                    </label>
                    <TimeSlotPicker
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      availableSlots={availableSlots}
                      isLoading={isLoadingSlots}
                      onTimeSelect={setSelectedTime}
                    />
                  </div>
                )}

                {/* Duration Info */}
                {selectedTime && (
                  <div
                    className="flex items-center gap-2 text-sm rounded-xl px-4 py-2"
                    style={{ background: BAI.bgMuted, color: BAI.inkMid }}
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      Durée de la visite : <strong>{visitDuration >= 60 ? `${visitDuration / 60}h${visitDuration % 60 > 0 ? (visitDuration % 60).toString().padStart(2, '0') : ''}` : `${visitDuration} min`}</strong>
                    </span>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-2" style={{ color: BAI.inkMid }}>
                    Notes (optionnel)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl resize-none"
                    style={{
                      border: `1px solid ${BAI.border}`,
                      outline: 'none',
                      background: BAI.bgSurface,
                      color: BAI.ink,
                    }}
                    placeholder="Précisez vos préférences ou questions..."
                  />
                </div>

                {/* Info Box */}
                <div
                  className="rounded-xl p-4 flex gap-3"
                  style={{
                    background: BAI.ownerLight,
                    border: `1px solid ${BAI.ownerBorder}`,
                  }}
                >
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BAI.owner }} />
                  <div className="text-sm" style={{ color: BAI.owner }}>
                    <p className="font-medium mb-1">À savoir :</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Le propriétaire recevra une notification de votre demande</li>
                      <li>Vous recevrez une confirmation par email une fois validée</li>
                      <li>Vous pouvez annuler votre visite jusqu'à 24h avant</li>
                    </ul>
                  </div>
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="rounded-xl p-4 flex gap-3" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#9b1c1c' }} />
                    <p className="text-sm" style={{ color: '#9b1c1c' }}>{submitError}</p>
                  </div>
                )}

                {/* API Error */}
                {error && (
                  <div className="rounded-xl p-4 flex gap-3" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#9b1c1c' }} />
                    <p className="text-sm" style={{ color: '#9b1c1c' }}>{error}</p>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Footer */}
          {!showSuccess && (
            <div
              className="flex items-center justify-end gap-3 p-6"
              style={{ borderTop: `1px solid ${BAI.border}`, background: BAI.bgMuted }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl transition-colors disabled:opacity-50"
                style={{
                  color: BAI.inkMid,
                  background: BAI.bgSurface,
                  border: `1px solid ${BAI.border}`,
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedTime || isSubmitting}
                className="px-6 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: BAI.night, color: BAI.bgSurface }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Réservation...
                  </>
                ) : (
                  'Confirmer la réservation'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
  )
}
