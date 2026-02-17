import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle, Info, Loader, Home, MapPin } from 'lucide-react'
import { usePropertyStore } from '../../store/propertyStore'
import { useContractStore } from '../../store/contractStore'

interface CreateLeaseModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  tenantName: string
  onSuccess: (contractId: string) => void
}

export const CreateLeaseModal = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  onSuccess,
}: CreateLeaseModalProps) => {
  const navigate = useNavigate()
  const { myProperties, fetchMyProperties, isLoading: isLoadingProperties } = usePropertyStore()
  const { createContract } = useContractStore()

  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [monthlyRent, setMonthlyRent] = useState<number | ''>('')
  const [charges, setCharges] = useState<number | ''>('')
  const [deposit, setDeposit] = useState<number | ''>('')
  const [terms, setTerms] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)

  const availableProperties = myProperties.filter((p) => p.status === 'AVAILABLE')

  // Fetch properties on open
  useEffect(() => {
    if (isOpen) {
      fetchMyProperties({ page: 1, limit: 100 })
      // Reset form
      setSelectedPropertyId('')
      setStartDate('')
      setEndDate('')
      setMonthlyRent('')
      setCharges('')
      setDeposit('')
      setTerms('')
      setErrors({})
      setSuccess(null)
    }
  }, [isOpen, fetchMyProperties])

  // Pre-fill when property is selected
  useEffect(() => {
    if (!selectedPropertyId) return
    const property = availableProperties.find((p) => p.id === selectedPropertyId)
    if (property) {
      setMonthlyRent(property.price)
      setCharges(property.charges ?? '')
      setDeposit(property.deposit ?? '')
    }
  }, [selectedPropertyId]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProperty = availableProperties.find((p) => p.id === selectedPropertyId)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedPropertyId) {
      newErrors.property = 'Veuillez selectionner une propriete'
    }
    if (!startDate) {
      newErrors.startDate = 'La date de debut est requise'
    }
    if (!endDate) {
      newErrors.endDate = 'La date de fin est requise'
    }
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = 'La date de fin doit etre posterieure a la date de debut'
    }
    if (!monthlyRent || monthlyRent <= 0) {
      newErrors.monthlyRent = 'Le loyer doit etre superieur a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const contract = await createContract({
        propertyId: selectedPropertyId,
        tenantId,
        startDate,
        endDate,
        monthlyRent: Number(monthlyRent),
        charges: charges ? Number(charges) : undefined,
        deposit: deposit ? Number(deposit) : undefined,
        terms: terms || undefined,
      })

      if (contract) {
        setSuccess(contract.id)
        setTimeout(() => {
          onSuccess(contract.id)
          onClose()
          navigate(`/contracts/${contract.id}`)
        }, 1500)
      }
    } catch {
      // Error handled by store
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Success view
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Contrat cree avec succes</h3>
          <p className="text-sm text-gray-600">
            Redirection vers le contrat...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mettre en location</h2>
            <p className="text-sm text-gray-600 mt-1">
              Creer un bail pour {tenantName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Property Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propriete <span className="text-red-500">*</span>
            </label>
            {isLoadingProperties ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                Chargement des proprietes...
              </div>
            ) : availableProperties.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucune propriete disponible. Vos biens doivent avoir le statut "Disponible".
              </p>
            ) : (
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.property ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selectionner une propriete</option>
                {availableProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} - {p.address}, {p.city}
                  </option>
                ))}
              </select>
            )}
            {errors.property && (
              <p className="text-sm text-red-500 mt-1">{errors.property}</p>
            )}
          </div>

          {/* Property Info Card */}
          {selectedProperty && (
            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-4">
              {selectedProperty.images?.[0] ? (
                <img
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.title}
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                  <Home className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{selectedProperty.title}</h4>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {selectedProperty.address}, {selectedProperty.postalCode} {selectedProperty.city}
                </p>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  {selectedProperty.surface && <span>{selectedProperty.surface} m²</span>}
                  {selectedProperty.bedrooms != null && <span>{selectedProperty.bedrooms} ch.</span>}
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de debut <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Financial Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loyer mensuel (EUR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.monthlyRent ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.monthlyRent && (
                <p className="text-sm text-red-500 mt-1">{errors.monthlyRent}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Charges (EUR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={charges}
                onChange={(e) => setCharges(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depot de garantie (EUR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conditions particulieres
            </label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
              placeholder="Conditions specifiques du bail..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Le contrat sera cree en brouillon. Les deux parties devront le signer pour qu'il soit active.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t shrink-0">
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
            onClick={handleSubmit}
            className="btn btn-primary flex-1"
            disabled={isSubmitting || availableProperties.length === 0}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Creation...
              </span>
            ) : (
              'Creer le contrat'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
