import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  isLoading?: boolean
}

export const CancelBookingModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CancelBookingModalProps) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason.trim()) {
      setError('Veuillez indiquer la raison de l\'annulation')
      return
    }

    if (reason.trim().length < 10) {
      setError('La raison doit contenir au moins 10 caracteres')
      return
    }

    setError('')
    onConfirm(reason.trim())
  }

  const handleClose = () => {
    if (isLoading) return
    setReason('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Annuler la reservation</h2>
                <p className="text-sm text-gray-500">Cette action est irreversible</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <label
              htmlFor="cancel-reason"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Raison de l'annulation <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Indiquez la raison de l'annulation..."
              disabled={isLoading}
              autoFocus
            />

            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Annulation...
                  </>
                ) : (
                  'Confirmer l\'annulation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
