import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useProperties } from '../../hooks/useProperties'
import { FileText, ArrowLeft, Save } from 'lucide-react'
import { format } from 'date-fns'

export default function CreateContract() {
  const navigate = useNavigate()
  const { createContract, isLoading } = useContractStore()
  const { myProperties, fetchMyProperties } = useProperties()

  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    tenantEmail: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    charges: '',
    deposit: '',
    terms: '',
  })

  useEffect(() => {
    fetchMyProperties({ page: 1, limit: 100 })
  }, [fetchMyProperties])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.propertyId || !formData.tenantEmail || !formData.startDate || !formData.endDate || !formData.monthlyRent) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    const contractData = {
      propertyId: formData.propertyId,
      tenantId: formData.tenantEmail, // In real app, would search for tenant by email
      startDate: formData.startDate,
      endDate: formData.endDate,
      monthlyRent: parseFloat(formData.monthlyRent),
      charges: formData.charges ? parseFloat(formData.charges) : undefined,
      deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
      terms: formData.terms || undefined,
    }

    const contract = await createContract(contractData)
    if (contract) {
      navigate(`/contracts/${contract.id}`)
    }
  }

  const selectedProperty = myProperties.find((p) => p.id === formData.propertyId)

  // Pre-fill rent if property is selected
  useEffect(() => {
    if (selectedProperty && !formData.monthlyRent) {
      setFormData((prev) => ({
        ...prev,
        monthlyRent: selectedProperty.price.toString(),
        charges: selectedProperty.charges?.toString() || '',
        deposit: selectedProperty.deposit?.toString() || '',
      }))
    }
  }, [selectedProperty])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/contracts')}
              className="btn btn-ghost p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-7 h-7 text-primary-600" />
                Nouveau Contrat
              </h1>
              <p className="text-gray-600 mt-1">Créez un contrat de location</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Informations du contrat
            </h2>

            {/* Property Selection */}
            <div className="mb-6">
              <label className="label">
                Propriété <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.propertyId}
                onChange={(e) =>
                  setFormData({ ...formData, propertyId: e.target.value })
                }
                className="input"
                required
              >
                <option value="">Sélectionnez une propriété</option>
                {myProperties
                  .filter((p) => p.status === 'AVAILABLE')
                  .map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title} - {property.city}
                    </option>
                  ))}
              </select>
            </div>

            {/* Tenant Email */}
            <div className="mb-6">
              <label className="label">
                Email du locataire <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.tenantEmail}
                onChange={(e) =>
                  setFormData({ ...formData, tenantEmail: e.target.value })
                }
                placeholder="locataire@example.com"
                className="input"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Le locataire doit avoir un compte sur la plateforme
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="label">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>
            </div>

            {/* Financial Terms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="label">
                  Loyer mensuel (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthlyRent}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyRent: e.target.value })
                  }
                  placeholder="800"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Charges (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges}
                  onChange={(e) =>
                    setFormData({ ...formData, charges: e.target.value })
                  }
                  placeholder="50"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Dépôt de garantie (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.deposit}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit: e.target.value })
                  }
                  placeholder="800"
                  className="input"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="mb-6">
              <label className="label">Conditions particulières</label>
              <textarea
                value={formData.terms}
                onChange={(e) =>
                  setFormData({ ...formData, terms: e.target.value })
                }
                placeholder="Ajoutez des conditions particulières au contrat..."
                className="input min-h-[120px]"
                rows={5}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/contracts')}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Créer le contrat
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
