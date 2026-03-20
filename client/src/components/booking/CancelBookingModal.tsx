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
                <h2 className="text-lg font-bold" style={{ color: '#0d0c0a' }}>Annuler la reservation</h2>
                <p className="text-sm" style={{ color: '#9e9b96' }}>Cette action est irreversible</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="transition-colors"
              style={{ color: '#9e9b96' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <label
              htmlFor="cancel-reason"
              className="block text-sm font-medium mb-2"
              style={{ color: '#0d0c0a' }}
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
              className="w-full px-4 py-2 border rounded-xl resize-none outline-none"
              style={{
                background: '#f8f7f4',
                borderColor: error ? '#fca5a5' : '#e4e1db',
                color: '#0d0c0a',
              }}
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
                className="px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                style={{ color: '#5a5754', background: '#ffffff', border: '1px solid #e4e1db' }}
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
