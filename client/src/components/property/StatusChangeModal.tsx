import { useState } from 'react'
import { X } from 'lucide-react'
import { PropertyStatus, PROPERTY_STATUS } from '../../types/property.types'

interface StatusChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (status: PropertyStatus) => Promise<void>
  propertyTitle: string
  currentStatus: PropertyStatus
}

export const StatusChangeModal = ({
  isOpen,
  onClose,
  onConfirm,
  propertyTitle,
  currentStatus,
}: StatusChangeModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<PropertyStatus>(currentStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (selectedStatus === currentStatus) return
    setIsSubmitting(true)
    try {
      await onConfirm(selectedStatus)
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const colorClasses: Record<string, { radio: string; border: string; bg: string; text: string }> = {
    green: {
      radio: 'text-green-600 focus:ring-green-500',
      border: 'border-green-300 bg-green-50',
      bg: 'bg-green-100',
      text: 'text-green-800',
    },
    blue: {
      radio: 'text-blue-600 focus:ring-blue-500',
      border: 'border-blue-300 bg-blue-50',
      bg: 'bg-blue-100',
      text: 'text-blue-800',
    },
    gray: {
      radio: 'text-gray-600 focus:ring-gray-500',
      border: 'border-gray-300 bg-gray-50',
      bg: 'bg-gray-100',
      text: 'text-gray-800',
    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Changer le statut</h2>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{propertyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {PROPERTY_STATUS.map((statusOption) => {
            const isSelected = selectedStatus === statusOption.value
            const isCurrent = currentStatus === statusOption.value
            const colors = colorClasses[statusOption.color] || colorClasses.gray

            return (
              <label
                key={statusOption.value}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected ? colors.border : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="propertyStatus"
                  value={statusOption.value}
                  checked={isSelected}
                  onChange={() => setSelectedStatus(statusOption.value)}
                  className={`mt-0.5 h-4 w-4 ${colors.radio}`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {statusOption.label}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-gray-500 font-medium">(actuel)</span>
                    )}
                  </div>
                  {statusOption.description && (
                    <p className="text-sm text-gray-600 mt-1">{statusOption.description}</p>
                  )}
                </div>
              </label>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary flex-1"
            disabled={isSubmitting || selectedStatus === currentStatus}
          >
            {isSubmitting ? 'Mise a jour...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}
