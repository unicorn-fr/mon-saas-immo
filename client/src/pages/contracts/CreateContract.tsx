import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useProperties } from '../../hooks/useProperties'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { ContractClause } from '../../types/contract.types'
import { DEFAULT_CLAUSES } from '../../data/loiAlurClauses'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ContractPDF } from '../../components/contract/ContractPDF'
import { Layout } from '../../components/layout/Layout'
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Home as HomeIcon,
  MapPin,
  Plus,
  Trash2,
  Eye,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'

type WizardStep = 1 | 2 | 3

export default function CreateContract() {
  const navigate = useNavigate()
  const { createContract, isLoading } = useContractStore()
  const { myProperties, fetchMyProperties } = useProperties()
  const { conversations, fetchConversations } = useMessages()
  const { user } = useAuth()

  const [step, setStep] = useState<WizardStep>(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [selectedContact, setSelectedContact] = useState<{ name: string; email: string; avatar?: string } | null>(null)

  // Step 1: Property & Tenant
  const [propertyId, setPropertyId] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')

  // Step 2: Juridical fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [charges, setCharges] = useState('')
  const [deposit, setDeposit] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('virement')
  const [paymentDay, setPaymentDay] = useState('5')

  // Step 3: Clauses
  const [clauses, setClauses] = useState<ContractClause[]>(DEFAULT_CLAUSES)
  const [customClauseTitle, setCustomClauseTitle] = useState('')
  const [customClauseDesc, setCustomClauseDesc] = useState('')
  const [terms, setTerms] = useState('')

  useEffect(() => {
    fetchMyProperties({ page: 1, limit: 100 })
    fetchConversations()
  }, [fetchMyProperties, fetchConversations])

  // Contacts depuis la messagerie
  const messagingContacts = conversations
    .map((conv) => {
      const other = conv.user1Id === user?.id ? conv.user2 : conv.user1
      return { id: other.id, name: `${other.firstName} ${other.lastName}`, email: other.email || '', avatar: other.avatar || undefined }
    })
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)

  const availableProperties = myProperties.filter((p) => p.status === 'AVAILABLE')
  const selectedProperty = availableProperties.find((p) => p.id === propertyId)

  useEffect(() => {
    if (selectedProperty) {
      setMonthlyRent(selectedProperty.price.toString())
      setCharges(selectedProperty.charges?.toString() || '')
      setDeposit(selectedProperty.deposit?.toString() || '')
    }
  }, [selectedProperty])

  const toggleClause = (id: string) => {
    setClauses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    )
  }

  const addCustomClause = () => {
    if (!customClauseTitle.trim() || !customClauseDesc.trim()) return
    const newClause: ContractClause = {
      id: `custom_${Date.now()}`,
      title: customClauseTitle.trim(),
      description: customClauseDesc.trim(),
      enabled: true,
      isCustom: true,
    }
    setClauses((prev) => [...prev, newClause])
    setCustomClauseTitle('')
    setCustomClauseDesc('')
  }

  const removeCustomClause = (id: string) => {
    setClauses((prev) => prev.filter((c) => c.id !== id))
  }

  const validateStep = (s: WizardStep): boolean => {
    const newErrors: Record<string, string> = {}

    if (s === 1) {
      if (!propertyId) newErrors.propertyId = 'Sélectionnez une propriété'
      if (!tenantEmail) {
        newErrors.tenantEmail = "Renseignez l'email du locataire"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantEmail)) {
        newErrors.tenantEmail = "Format d'email invalide"
      }
    }

    if (s === 2) {
      if (!startDate) newErrors.startDate = 'Date de début requise'
      if (!endDate) newErrors.endDate = 'Date de fin requise'
      if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        newErrors.endDate = 'La date de fin doit être postérieure'
      }
      if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
        newErrors.monthlyRent = 'Loyer requis et > 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 3) as WizardStep)
    }
  }

  const goPrev = () => {
    setStep((s) => Math.max(s - 1, 1) as WizardStep)
  }

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return

    const content = {
      paymentMethod,
      paymentDay,
      propertyTitle: selectedProperty?.title,
      propertyAddress: `${selectedProperty?.address}, ${selectedProperty?.postalCode} ${selectedProperty?.city}`,
    }

    const contract = await createContract({
      propertyId,
      tenantId: tenantEmail,
      startDate,
      endDate,
      monthlyRent: parseFloat(monthlyRent),
      charges: charges ? parseFloat(charges) : undefined,
      deposit: deposit ? parseFloat(deposit) : undefined,
      terms: terms || undefined,
      content,
      customClauses: clauses,
    })

    if (contract) {
      navigate(`/contracts/${contract.id}`)
    }
  }

  // Build preview contract object for PDF
  const previewContract = {
    id: 'preview',
    propertyId,
    tenantId: '',
    ownerId: '',
    status: 'DRAFT' as const,
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date().toISOString(),
    monthlyRent: parseFloat(monthlyRent) || 0,
    charges: charges ? parseFloat(charges) : undefined,
    deposit: deposit ? parseFloat(deposit) : undefined,
    terms,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    property: selectedProperty
      ? {
          id: selectedProperty.id,
          title: selectedProperty.title,
          address: selectedProperty.address,
          city: selectedProperty.city,
          postalCode: selectedProperty.postalCode,
          type: selectedProperty.type,
          bedrooms: selectedProperty.bedrooms,
          bathrooms: selectedProperty.bathrooms,
          surface: selectedProperty.surface,
        }
      : undefined,
    owner: { id: '', firstName: '[Votre prénom]', lastName: '[Votre nom]', email: '' },
    tenant: { id: '', firstName: '[Prénom locataire]', lastName: '[Nom locataire]', email: tenantEmail },
  }

  const stepLabels = ['Propriété', 'Conditions', 'Clauses']

  const inputClass = (hasError?: boolean) =>
    `w-full bg-white border rounded-xl px-3 py-2.5 text-sm text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b] ${
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-[#d2d2d7] focus:border-[#3b82f6] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]'
    }`

  const labelClass = 'block text-sm font-medium text-[#515154] mb-1.5'

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Header */}
        <div className="bg-white border-b border-[#d2d2d7]">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/contracts')}
                className="p-2 bg-white border border-[#d2d2d7] rounded-xl text-[#515154] hover:bg-[#f5f5f7] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#1d1d1f] flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                  Nouveau Contrat
                </h1>
                <p className="text-[#86868b] mt-0.5 text-sm">Générateur de bail — Loi ALUR</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              {stepLabels.map((label, i) => {
                const stepNum = (i + 1) as WizardStep
                const isActive = step === stepNum
                const isCompleted = step > stepNum
                return (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          isActive
                            ? 'bg-[#3b82f6] text-white ring-4 ring-[rgba(59,130,246,0.15)]'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[#f0f0f2] text-[#86868b]'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                      </div>
                      <span className={`text-xs mt-1.5 font-medium ${isActive ? 'text-[#3b82f6]' : isCompleted ? 'text-emerald-600' : 'text-[#86868b]'}`}>
                        {label}
                      </span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 -mt-5 ${step > stepNum ? 'bg-emerald-400' : 'bg-[#d2d2d7]'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Step 1: Property & Tenant */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}>
                <h2 className="text-xl font-semibold text-[#1d1d1f] mb-6">
                  Étape 1 : Informations de base
                </h2>

                {/* Property Selection */}
                <div className="mb-6">
                  <label className={labelClass}>
                    Propriété <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className={inputClass(!!errors.propertyId)}
                  >
                    <option value="">Sélectionnez une propriété</option>
                    {availableProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {p.address}, {p.city}
                      </option>
                    ))}
                  </select>
                  {errors.propertyId && <p className="text-xs text-red-500 mt-1">{errors.propertyId}</p>}
                </div>

                {/* Property Preview */}
                {selectedProperty && (
                  <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4 flex items-start gap-4 mb-6">
                    {selectedProperty.images?.[0] ? (
                      <img
                        src={selectedProperty.images[0]}
                        alt={selectedProperty.title}
                        className="w-24 h-24 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-[#bfdbfe] flex items-center justify-center shrink-0">
                        <HomeIcon className="w-8 h-8 text-[#3b82f6]" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-[#1d1d1f]">{selectedProperty.title}</h3>
                      <p className="text-sm text-[#515154] flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#3b82f6]" />
                        {selectedProperty.address}, {selectedProperty.postalCode} {selectedProperty.city}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-[#86868b]">
                        {selectedProperty.surface && <span>{selectedProperty.surface} m²</span>}
                        {selectedProperty.bedrooms != null && <span>{selectedProperty.bedrooms} ch.</span>}
                        <span className="text-[#3b82f6] font-semibold">{selectedProperty.price} €/mois</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tenant Email */}
                <div className="mb-6">
                  <label className={labelClass}>
                    Locataire <span className="text-red-500">*</span>
                  </label>

                  {/* Contact sélectionné */}
                  {selectedContact ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] mb-3">
                      {selectedContact.avatar ? (
                        <img src={selectedContact.avatar} alt={selectedContact.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#bfdbfe] flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#3b82f6]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#1d1d1f]">{selectedContact.name}</p>
                        <p className="text-xs text-[#86868b]">{selectedContact.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedContact(null); setTenantEmail('') }}
                        className="p-1 rounded-lg hover:bg-[#bfdbfe] transition-colors"
                      >
                        <X className="w-4 h-4 text-[#86868b]" />
                      </button>
                    </div>
                  ) : null}

                  {/* Picker contacts messagerie */}
                  {messagingContacts.length > 0 && !selectedContact && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => setShowContactPicker((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#d2d2d7] bg-white text-sm font-medium text-[#515154] hover:bg-[#f5f5f7] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#3b82f6]" />
                          Choisir depuis mes contacts messagerie
                          <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#3b82f6]">
                            {messagingContacts.length}
                          </span>
                        </span>
                        {showContactPicker ? <ChevronUp className="w-4 h-4 text-[#86868b]" /> : <ChevronDown className="w-4 h-4 text-[#86868b]" />}
                      </button>

                      {showContactPicker && (
                        <div className="mt-1 rounded-xl border border-[#d2d2d7] overflow-hidden bg-white shadow-sm">
                          {messagingContacts.map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              onClick={() => {
                                setSelectedContact({ name: contact.name, email: contact.email, avatar: contact.avatar })
                                setTenantEmail(contact.email)
                                setShowContactPicker(false)
                                setErrors((e) => ({ ...e, tenantEmail: '' }))
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f5f5f7] transition-colors border-b border-[#f0f0f2] last:border-b-0"
                            >
                              {contact.avatar ? (
                                <img src={contact.avatar} alt={contact.name}
                                  className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-[#3b82f6]" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-[#1d1d1f]">{contact.name}</p>
                                <p className="text-xs truncate text-[#86868b]">{contact.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Séparateur */}
                  {messagingContacts.length > 0 && !selectedContact && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-[#d2d2d7]" />
                      <span className="text-xs text-[#86868b]">ou saisir manuellement</span>
                      <div className="flex-1 h-px bg-[#d2d2d7]" />
                    </div>
                  )}

                  {/* Saisie manuelle */}
                  {!selectedContact && (
                    <>
                      <input
                        type="email"
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        placeholder="locataire@example.com"
                        className={inputClass(!!errors.tenantEmail)}
                      />
                      <p className="text-xs text-[#86868b] mt-1">
                        Le locataire doit avoir un compte avec cet email sur la plateforme
                      </p>
                    </>
                  )}

                  {errors.tenantEmail && <p className="text-xs text-red-500 mt-1">{errors.tenantEmail}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Juridical Fields */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}>
                <h2 className="text-xl font-semibold text-[#1d1d1f] mb-6">
                  Étape 2 : Conditions juridiques
                </h2>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClass}>
                      Date de prise d'effet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputClass(!!errors.startDate)}
                    />
                    {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Date de fin du bail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={inputClass(!!errors.endDate)}
                    />
                    {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                  </div>
                </div>

                {/* Financial */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className={labelClass}>
                      Loyer mensuel (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      placeholder="800"
                      className={inputClass(!!errors.monthlyRent)}
                    />
                    {errors.monthlyRent && <p className="text-xs text-red-500 mt-1">{errors.monthlyRent}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Charges (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={charges}
                      onChange={(e) => setCharges(e.target.value)}
                      placeholder="50"
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Dépôt de garantie (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      placeholder="800"
                      className={inputClass()}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClass}>Modalité de paiement</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="virement">Virement bancaire</option>
                      <option value="prelevement">Prélèvement automatique</option>
                      <option value="cheque">Chèque</option>
                      <option value="especes">Espèces</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Jour de paiement</label>
                    <select
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className={inputClass()}
                    >
                      {[1, 5, 10, 15].map((d) => (
                        <option key={d} value={d.toString()}>
                          Le {d} du mois
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Total Preview */}
                {monthlyRent && (
                  <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#bfdbfe]">
                    <p className="text-sm text-[#3b82f6]">
                      <span className="font-semibold text-[#1d1d1f]">Total mensuel : </span>
                      <span className="font-bold">
                        {(parseFloat(monthlyRent || '0') + parseFloat(charges || '0')).toFixed(2)} €
                      </span>
                      <span className="text-[#515154]">
                        {' '}(loyer {monthlyRent} €{charges ? ` + charges ${charges} €` : ''})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Clauses */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}>
                <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">
                  Étape 3 : Clauses du contrat
                </h2>
                <p className="text-sm text-[#86868b] mb-6">
                  Les clauses standard de la Loi ALUR sont activées par défaut. Vous pouvez les désactiver ou ajouter des clauses personnalisées.
                </p>

                {/* Standard Clauses */}
                <div className="space-y-3 mb-8">
                  {clauses.map((clause) => (
                    <div
                      key={clause.id}
                      className={`border rounded-xl p-4 transition-all ${
                        clause.enabled
                          ? 'border-[#bfdbfe] bg-[#f8faff]'
                          : 'border-[#d2d2d7] bg-[#f5f5f7] opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={clause.enabled}
                          onChange={() => toggleClause(clause.id)}
                          className="mt-1 h-4 w-4 text-[#3b82f6] rounded border-[#d2d2d7] focus:ring-[rgba(59,130,246,0.2)]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-[#1d1d1f]">{clause.title}</h4>
                            {clause.isCustom && (
                              <span className="text-xs bg-[#eff6ff] text-[#3b82f6] border border-[#bfdbfe] px-2 py-0.5 rounded-full">
                                Personnalisée
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#515154] mt-1">{clause.description}</p>
                        </div>
                        {clause.isCustom && (
                          <button
                            onClick={() => removeCustomClause(clause.id)}
                            className="p-1 text-[#86868b] hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Clause */}
                <div className="border-2 border-dashed border-[#d2d2d7] rounded-xl p-4 mb-6">
                  <h4 className="font-medium text-[#1d1d1f] mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#3b82f6]" />
                    Ajouter une clause personnalisée
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customClauseTitle}
                      onChange={(e) => setCustomClauseTitle(e.target.value)}
                      placeholder="Titre de la clause"
                      className={inputClass()}
                    />
                    <textarea
                      value={customClauseDesc}
                      onChange={(e) => setCustomClauseDesc(e.target.value)}
                      placeholder="Description de la clause..."
                      className={`${inputClass()} min-h-[80px] resize-none`}
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={addCustomClause}
                      disabled={!customClauseTitle.trim() || !customClauseDesc.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-medium hover:bg-[#f5f5f7] disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Additional Terms */}
                <div className="mb-6">
                  <label className={labelClass}>Conditions particulières (texte libre)</label>
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Conditions supplémentaires spécifiques à ce bail..."
                    className={`${inputClass()} min-h-[100px] resize-none`}
                    rows={4}
                  />
                  <div className="mt-2">
                    <p className="text-xs text-[#86868b] mb-2">Exemples de conditions particulières :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Le locataire s'engage à souscrire un contrat d'entretien annuel de la chaudière.",
                        'Les animaux domestiques sont autorisés sous réserve qu\'ils ne causent aucun trouble de voisinage ni dégradation.',
                        "Le logement est loué meublé conformément à l'inventaire joint en annexe.",
                        "Le locataire s'engage à entretenir le jardin et les espaces verts.",
                        'Le stationnement est attribué au locataire (place n°__).',
                        'Le locataire devra maintenir les détecteurs de fumée en état de fonctionnement.',
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setTerms(prev => prev ? `${prev}\n${example}` : example)}
                          className="text-xs px-2.5 py-1 rounded-full bg-[#f0f0f2] text-[#515154] hover:bg-[#eff6ff] hover:text-[#3b82f6] transition-colors"
                        >
                          + {example.slice(0, 50)}...
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PDF Preview */}
                {selectedProperty && (
                  <div className="flex gap-3">
                    <PDFDownloadLink
                      document={<ContractPDF contract={previewContract} clauses={clauses.filter((c) => c.enabled)} />}
                      fileName={`contrat-${selectedProperty.title.replace(/\s+/g, '-').toLowerCase()}-brouillon.pdf`}
                    >
                      {({ loading }) => (
                        <button
                          type="button"
                          disabled={loading}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-semibold hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
                        >
                          {loading ? (
                            'Génération...'
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Prévisualiser le PDF
                            </>
                          )}
                        </button>
                      )}
                    </PDFDownloadLink>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={step === 1 ? () => navigate('/contracts') : goPrev}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-semibold hover:bg-[#f5f5f7] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 1 ? 'Annuler' : 'Précédent'}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white rounded-xl text-sm font-semibold hover:bg-[#2563eb] transition-colors"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white rounded-xl text-sm font-semibold hover:bg-[#2563eb] disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Créer le contrat
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
