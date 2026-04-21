import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle, Info, Loader, Home, MapPin } from 'lucide-react'
import { usePropertyStore } from '../../store/propertyStore'
import { useContractStore } from '../../store/contractStore'
import { BAI } from '../../constants/bailio-tokens'

const inputStyle = (hasError?: boolean) => ({
  width: '100%',
  padding: '10px 16px',
  border: `1px solid ${hasError ? '#fca5a5' : BAI.border}`,
  borderRadius: '12px',
  background: BAI.bgInput,
  color: BAI.ink,
  fontSize: '14px',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: 'none',
})

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

  useEffect(() => {
    if (isOpen) {
      fetchMyProperties({ page: 1, limit: 100 })
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
    if (!selectedPropertyId) newErrors.property = 'Veuillez selectionner une propriete'
    if (!startDate) newErrors.startDate = 'La date de debut est requise'
    if (!endDate) newErrors.endDate = 'La date de fin est requise'
    if (startDate && endDate && new Date(endDate) <= new Date(startDate))
      newErrors.endDate = 'La date de fin doit etre posterieure a la date de debut'
    if (!monthlyRent || monthlyRent <= 0)
      newErrors.monthlyRent = 'Le loyer doit etre superieur a 0'
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

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="rounded-2xl max-w-md w-full p-8 text-center"
          style={{ background: BAI.bgSurface, boxShadow: '0 8px 40px rgba(13,12,10,0.15)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: BAI.tenantLight }}>
            <CheckCircle className="w-8 h-8" style={{ color: BAI.tenant }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: BAI.ink }}>Contrat cree avec succes</h3>
          <p className="text-sm" style={{ color: BAI.inkMid }}>Redirection vers le contrat...</p>
        </div>
      </div>
    )
  }

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, color: BAI.inkMid, marginBottom: '6px', fontFamily: "'DM Sans', system-ui, sans-serif" }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        style={{ background: BAI.bgSurface, boxShadow: '0 8px 40px rgba(13,12,10,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0"
          style={{ borderColor: BAI.border }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: BAI.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Mettre en location
            </h2>
            <p className="text-sm mt-1" style={{ color: BAI.inkMid }}>
              Creer un bail pour {tenantName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: BAI.inkFaint }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Property Select */}
          <div>
            <label style={labelStyle}>
              Propriete <span style={{ color: '#9b1c1c' }}>*</span>
            </label>
            {isLoadingProperties ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: BAI.inkFaint }}>
                <Loader className="w-4 h-4 animate-spin" />
                Chargement des proprietes...
              </div>
            ) : availableProperties.length === 0 ? (
              <p className="text-sm" style={{ color: BAI.inkFaint }}>
                Aucune propriete disponible. Vos biens doivent avoir le statut "Disponible".
              </p>
            ) : (
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                style={inputStyle(!!errors.property)}
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
              <p className="text-sm mt-1" style={{ color: '#9b1c1c' }}>{errors.property}</p>
            )}
          </div>

          {/* Property Info Card */}
          {selectedProperty && (
            <div className="rounded-xl p-4 flex items-start gap-4"
              style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}` }}>
              {selectedProperty.images?.[0] ? (
                <img
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.title}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: BAI.border }}>
                  <Home className="w-8 h-8" style={{ color: BAI.inkFaint }} />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-semibold truncate" style={{ color: BAI.ink }}>{selectedProperty.title}</h4>
                <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: BAI.inkMid }}>
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {selectedProperty.address}, {selectedProperty.postalCode} {selectedProperty.city}
                </p>
                <div className="flex gap-3 mt-1 text-xs" style={{ color: BAI.inkFaint }}>
                  {selectedProperty.surface && <span>{selectedProperty.surface} m²</span>}
                  {selectedProperty.bedrooms != null && <span>{selectedProperty.bedrooms} ch.</span>}
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>
                Date de debut <span style={{ color: '#9b1c1c' }}>*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle(!!errors.startDate)}
              />
              {errors.startDate && (
                <p className="text-sm mt-1" style={{ color: '#9b1c1c' }}>{errors.startDate}</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>
                Date de fin <span style={{ color: '#9b1c1c' }}>*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle(!!errors.endDate)}
              />
              {errors.endDate && (
                <p className="text-sm mt-1" style={{ color: '#9b1c1c' }}>{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Financial Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>
                Loyer mensuel (EUR) <span style={{ color: '#9b1c1c' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                style={inputStyle(!!errors.monthlyRent)}
              />
              {errors.monthlyRent && (
                <p className="text-sm mt-1" style={{ color: '#9b1c1c' }}>{errors.monthlyRent}</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Charges (EUR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={charges}
                onChange={(e) => setCharges(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle}>Depot de garantie (EUR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                style={inputStyle()}
              />
            </div>
          </div>

          {/* Terms */}
          <div>
            <label style={labelStyle}>Conditions particulieres</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
              placeholder="Conditions specifiques du bail..."
              style={{ ...inputStyle(), resize: 'none' }}
            />
          </div>

          {/* Info Banner */}
          <div className="rounded-xl p-4 flex gap-3"
            style={{ background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}` }}>
            <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: BAI.owner }} />
            <p className="text-sm" style={{ color: BAI.owner }}>
              Le contrat sera cree en brouillon. Les deux parties devront le signer pour qu'il soit active.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 sm:p-6 border-t shrink-0" style={{ borderColor: BAI.border }}>
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
