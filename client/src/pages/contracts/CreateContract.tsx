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

  // Contacts depuis la messagerie (l'autre utilisateur de chaque conversation)
  const messagingContacts = conversations
    .map((conv) => {
      const other = conv.user1Id === user?.id ? conv.user2 : conv.user1
      return { id: other.id, name: `${other.firstName} ${other.lastName}`, email: other.email || '', avatar: other.avatar || undefined }
    })
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i) // déduplique

  const availableProperties = myProperties.filter((p) => p.status === 'AVAILABLE')
  const selectedProperty = availableProperties.find((p) => p.id === propertyId)

  // Pre-fill financial fields when property is selected
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
      if (!propertyId) newErrors.propertyId = 'Selectionnez une propriete'
      if (!tenantEmail) {
        newErrors.tenantEmail = 'Renseignez l\'email du locataire'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantEmail)) {
        newErrors.tenantEmail = 'Format d\'email invalide'
      }
    }

    if (s === 2) {
      if (!startDate) newErrors.startDate = 'Date de debut requise'
      if (!endDate) newErrors.endDate = 'Date de fin requise'
      if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        newErrors.endDate = 'La date de fin doit etre posterieure'
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
      tenantId: tenantEmail, // Backend resolves email to user ID
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
    owner: { id: '', firstName: '[Votre prenom]', lastName: '[Votre nom]', email: '' },
    tenant: { id: '', firstName: '[Prenom locataire]', lastName: '[Nom locataire]', email: tenantEmail },
  }

  const stepLabels = ['Propriete', 'Conditions', 'Clauses']

  return (
    <Layout>
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/contracts')} className="btn btn-secondary p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-7 h-7 text-primary-600" />
                Nouveau Contrat
              </h1>
              <p className="text-slate-600 mt-1">Generateur de bail - Loi ALUR</p>
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : isCompleted
                          ? 'bg-success-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'text-primary-600 font-semibold' : 'text-slate-500'}`}>
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 mt-[-12px] ${step > stepNum ? 'bg-success-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step 1: Property & Tenant */}
          {step === 1 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Etape 1 : Informations de base
              </h2>

              {/* Property Selection */}
              <div className="mb-6">
                <label className="label">
                  Propriete <span className="text-red-500">*</span>
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className={`input ${errors.propertyId ? 'border-red-300' : ''}`}
                >
                  <option value="">Selectionnez une propriete</option>
                  {availableProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} - {p.address}, {p.city}
                    </option>
                  ))}
                </select>
                {errors.propertyId && <p className="text-sm text-red-500 mt-1">{errors.propertyId}</p>}
              </div>

              {/* Property Preview */}
              {selectedProperty && (
                <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-4 mb-6">
                  {selectedProperty.images?.[0] ? (
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      className="w-24 h-24 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                      <HomeIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{selectedProperty.title}</h3>
                    <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedProperty.address}, {selectedProperty.postalCode} {selectedProperty.city}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      {selectedProperty.surface && <span>{selectedProperty.surface} m2</span>}
                      {selectedProperty.bedrooms != null && <span>{selectedProperty.bedrooms} ch.</span>}
                      <span>{selectedProperty.price} EUR/mois</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tenant Email */}
              <div className="mb-6">
                <label className="label">
                  Locataire <span className="text-red-500">*</span>
                </label>

                {/* Contact sélectionné */}
                {selectedContact ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border mb-3"
                    style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
                    {selectedContact.avatar ? (
                      <img src={selectedContact.avatar} alt={selectedContact.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{selectedContact.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{selectedContact.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedContact(null); setTenantEmail('') }}
                      className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Changer de locataire"
                    >
                      <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  </div>
                ) : null}

                {/* Picker contacts messagerie */}
                {messagingContacts.length > 0 && !selectedContact && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setShowContactPicker((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-slate-50"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-card)' }}
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary-500" />
                        Choisir depuis mes contacts messagerie
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                          {messagingContacts.length}
                        </span>
                      </span>
                      {showContactPicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showContactPicker && (
                      <div className="mt-1 rounded-xl border overflow-hidden shadow-card"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-card)' }}>
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
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b last:border-b-0"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            {contact.avatar ? (
                              <img src={contact.avatar} alt={contact.name}
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{contact.name}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{contact.email}</p>
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
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>ou saisir manuellement</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                  </div>
                )}

                {/* Saisie manuelle (masquée si contact sélectionné) */}
                {!selectedContact && (
                  <>
                    <input
                      type="email"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      placeholder="locataire@example.com"
                      className={`input ${errors.tenantEmail ? 'border-red-300' : ''}`}
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Le locataire doit avoir un compte avec cet email sur la plateforme
                    </p>
                  </>
                )}

                {errors.tenantEmail && <p className="text-sm text-red-500 mt-1">{errors.tenantEmail}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Juridical Fields */}
          {step === 2 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Etape 2 : Conditions juridiques
              </h2>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="label">
                    Date de prise d'effet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`input ${errors.startDate ? 'border-red-300' : ''}`}
                  />
                  {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="label">
                    Date de fin du bail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`input ${errors.endDate ? 'border-red-300' : ''}`}
                  />
                  {errors.endDate && <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="label">
                    Loyer mensuel (EUR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder="800"
                    className={`input ${errors.monthlyRent ? 'border-red-300' : ''}`}
                  />
                  {errors.monthlyRent && <p className="text-sm text-red-500 mt-1">{errors.monthlyRent}</p>}
                </div>
                <div>
                  <label className="label">Charges (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={charges}
                    onChange={(e) => setCharges(e.target.value)}
                    placeholder="50"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Depot de garantie (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="800"
                    className="input"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="label">Modalite de paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="prelevement">Prelevement automatique</option>
                    <option value="cheque">Cheque</option>
                    <option value="especes">Especes</option>
                  </select>
                </div>
                <div>
                  <label className="label">Jour de paiement</label>
                  <select
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(e.target.value)}
                    className="input"
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
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                  <p className="text-sm text-primary-700">
                    <span className="font-semibold">Total mensuel : </span>
                    {(parseFloat(monthlyRent || '0') + parseFloat(charges || '0')).toFixed(2)} EUR
                    (loyer {monthlyRent} EUR{charges ? ` + charges ${charges} EUR` : ''})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Clauses */}
          {step === 3 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Etape 3 : Clauses du contrat
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Les clauses standard de la Loi ALUR sont activees par defaut. Vous pouvez les desactiver ou ajouter des clauses personnalisees.
              </p>

              {/* Standard Clauses */}
              <div className="space-y-3 mb-8">
                {clauses.map((clause) => (
                  <div
                    key={clause.id}
                    className={`border rounded-xl p-4 transition-colors ${
                      clause.enabled
                        ? 'border-primary-200 bg-primary-50/30'
                        : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={clause.enabled}
                        onChange={() => toggleClause(clause.id)}
                        className="mt-1 h-4 w-4 text-primary-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{clause.title}</h4>
                          {clause.isCustom && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                              Personnalisee
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{clause.description}</p>
                      </div>
                      {clause.isCustom && (
                        <button
                          onClick={() => removeCustomClause(clause.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Clause */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter une clause personnalisee
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customClauseTitle}
                    onChange={(e) => setCustomClauseTitle(e.target.value)}
                    placeholder="Titre de la clause"
                    className="input"
                  />
                  <textarea
                    value={customClauseDesc}
                    onChange={(e) => setCustomClauseDesc(e.target.value)}
                    placeholder="Description de la clause..."
                    className="input min-h-[80px]"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={addCustomClause}
                    disabled={!customClauseTitle.trim() || !customClauseDesc.trim()}
                    className="btn btn-secondary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Additional Terms */}
              <div className="mb-6">
                <label className="label">Conditions particulieres (texte libre)</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Conditions supplementaires specifiques a ce bail..."
                  className="input min-h-[100px]"
                  rows={4}
                />
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-2">Exemples de conditions particulieres :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Le locataire s\'engage a souscrire un contrat d\'entretien annuel de la chaudiere.',
                      'Les animaux domestiques sont autorises sous reserve qu\'ils ne causent aucun trouble de voisinage ni degradation.',
                      'Le logement est loue meuble conformement a l\'inventaire joint en annexe.',
                      'Le locataire s\'engage a entretenir le jardin et les espaces verts.',
                      'Le stationnement est attribue au locataire (place n°__).',
                      'Le locataire devra maintenir les detecteurs de fumee en etat de fonctionnement.',
                    ].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setTerms(prev => prev ? `${prev}\n${example}` : example)}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
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
                      <button type="button" className="btn btn-secondary" disabled={loading}>
                        {loading ? (
                          'Generation...'
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Previsualiser le PDF
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
              className="btn btn-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Annuler' : 'Precedent'}
            </button>

            {step < 3 ? (
              <button type="button" onClick={goNext} className="btn btn-primary">
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Creation...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Creer le contrat
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
