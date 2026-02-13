import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { TimeSlotPicker } from './TimeSlotPicker'
import { useBookings } from '../../hooks/useBookings'

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Réserver une visite</h2>
              <p className="text-sm text-gray-600 mt-1">{propertyTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {showSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Réservation confirmée !
                </h3>
                <p className="text-gray-600">
                  Votre demande de visite a été envoyée au propriétaire.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de visite
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={today}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Durée de la visite : <strong>{visitDuration >= 60 ? `${visitDuration / 60}h${visitDuration % 60 > 0 ? (visitDuration % 60).toString().padStart(2, '0') : ''}` : `${visitDuration} min`}</strong>
                    </span>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Précisez vos préférences ou questions..."
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">À savoir :</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Le propriétaire recevra une notification de votre demande</li>
                      <li>Vous recevrez une confirmation par email une fois validée</li>
                      <li>Vous pouvez annuler votre visite jusqu'à 24h avant</li>
                    </ul>
                  </div>
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{submitError}</p>
                  </div>
                )}

                {/* API Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Footer */}
          {!showSuccess && (
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedTime || isSubmitting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>
  )
}
