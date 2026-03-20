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

const M = {
  bg: '#fafaf8', surface: '#ffffff', muted: '#f4f2ee', inputBg: '#f8f7f4',
  ink: '#0d0c0a', inkMid: '#5a5754', inkFaint: '#9e9b96',
  night: '#1a1a2e', caramel: '#c4976a', caramelLight: '#fdf5ec',
  owner: '#1a3270', ownerLight: '#eaf0fb', ownerBorder: '#b8ccf0',
  tenant: '#1b5e3b', tenantLight: '#edf7f2', tenantBorder: '#9fd4ba',
  border: '#e4e1db', borderMid: '#ccc9c3',
  danger: '#9b1c1c', dangerBg: '#fef2f2',
  warning: '#92400e', warningBg: '#fdf5ec',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

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

  // Maison style helpers
  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    background: M.inputBg,
    border: `1px solid ${hasError ? '#fca5a5' : M.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    color: M.ink,
    outline: 'none',
    fontFamily: M.body,
    boxSizing: 'border-box',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: M.inkMid,
    marginBottom: 6,
    fontFamily: M.body,
  }

  const cardStyle: React.CSSProperties = {
    background: M.surface,
    border: `1px solid ${M.border}`,
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
    padding: '28px',
    fontFamily: M.body,
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 8,
    background: M.night, color: '#ffffff',
    fontFamily: M.body, fontWeight: 500, fontSize: 13,
    border: 'none', cursor: 'pointer',
  }

  const btnGhost: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 8,
    background: M.surface, color: M.inkMid,
    fontFamily: M.body, fontWeight: 500, fontSize: 13,
    border: `1px solid ${M.border}`, cursor: 'pointer',
  }

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: M.bg, fontFamily: M.body }}>

        {/* Header */}
        <div style={{ background: M.surface, borderBottom: `1px solid ${M.border}` }}>
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/contracts')}
                style={{
                  padding: 8, background: M.surface,
                  border: `1px solid ${M.border}`, borderRadius: 8,
                  color: M.inkMid, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = M.muted)}
                onMouseLeave={e => (e.currentTarget.style.background = M.surface)}
              >
                <ArrowLeft style={{ width: 18, height: 18 }} />
              </button>
              <div>
                <p style={{
                  fontFamily: M.body, fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: M.inkFaint, marginBottom: 4,
                }}>
                  Gestion locative
                </p>
                <h1 style={{
                  fontFamily: M.display, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 32, color: M.ink, lineHeight: 1.1, margin: 0,
                }}>
                  Nouveau Contrat
                </h1>
                <p style={{ fontSize: 13, color: M.inkMid, marginTop: 2 }}>
                  Générateur de bail — Loi ALUR
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">

            {/* Step Indicator */}
            <div className="flex items-center justify-center" style={{ marginBottom: 32 }}>
              {stepLabels.map((label, i) => {
                const stepNum = (i + 1) as WizardStep
                const isActive = step === stepNum
                const isCompleted = step > stepNum
                return (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, fontFamily: M.body,
                        background: isActive ? M.night : isCompleted ? M.tenant : M.muted,
                        color: isActive || isCompleted ? '#ffffff' : M.inkFaint,
                        boxShadow: isActive ? `0 0 0 4px rgba(26,26,46,0.12)` : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {isCompleted ? <Check style={{ width: 18, height: 18 }} /> : stepNum}
                      </div>
                      <span style={{
                        fontSize: 11, marginTop: 6, fontWeight: 500, fontFamily: M.body,
                        color: isActive ? M.night : isCompleted ? M.tenant : M.inkFaint,
                      }}>
                        {label}
                      </span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div style={{
                        width: 64, height: 2, marginLeft: 6, marginRight: 6, marginTop: -20,
                        background: step > stepNum ? M.tenant : M.border,
                      }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Step 1: Property & Tenant */}
            {step === 1 && (
              <div style={cardStyle}>
                <h2 style={{
                  fontFamily: M.display, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 24, color: M.ink, marginBottom: 24,
                }}>
                  Étape 1 — Informations de base
                </h2>

                {/* Property Selection */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>
                    Propriété <span style={{ color: M.danger }}>*</span>
                  </label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    style={inputStyle(!!errors.propertyId)}
                  >
                    <option value="">Sélectionnez une propriété</option>
                    {availableProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {p.address}, {p.city}
                      </option>
                    ))}
                  </select>
                  {errors.propertyId && (
                    <p style={{ fontSize: 11, color: M.danger, marginTop: 4 }}>{errors.propertyId}</p>
                  )}
                </div>

                {/* Property Preview */}
                {selectedProperty && (
                  <div style={{
                    background: M.ownerLight, border: `1px solid ${M.ownerBorder}`,
                    borderRadius: 10, padding: 16,
                    display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24,
                  }}>
                    {selectedProperty.images?.[0] ? (
                      <img
                        src={selectedProperty.images[0]}
                        alt={selectedProperty.title}
                        style={{ width: 96, height: 96, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 96, height: 96, borderRadius: 8, flexShrink: 0,
                        background: M.ownerBorder, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <HomeIcon style={{ width: 28, height: 28, color: M.owner }} />
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: 14, color: M.ink }}>{selectedProperty.title}</h3>
                      <p className="flex items-center" style={{ fontSize: 12, color: M.inkMid, marginTop: 4, gap: 4 }}>
                        <MapPin style={{ width: 12, height: 12, color: M.owner }} />
                        {selectedProperty.address}, {selectedProperty.postalCode} {selectedProperty.city}
                      </p>
                      <div className="flex gap-4" style={{ marginTop: 8, fontSize: 11, color: M.inkFaint }}>
                        {selectedProperty.surface && <span>{selectedProperty.surface} m²</span>}
                        {selectedProperty.bedrooms != null && <span>{selectedProperty.bedrooms} ch.</span>}
                        <span style={{ color: M.caramel, fontWeight: 600 }}>{selectedProperty.price} €/mois</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tenant Email */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>
                    Locataire <span style={{ color: M.danger }}>*</span>
                  </label>

                  {/* Contact sélectionné */}
                  {selectedContact ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                      border: `1px solid ${M.tenantBorder}`, background: M.tenantLight,
                    }}>
                      {selectedContact.avatar ? (
                        <img src={selectedContact.avatar} alt={selectedContact.name}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: M.tenantBorder, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <User style={{ width: 16, height: 16, color: M.tenant }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontWeight: 600, fontSize: 13, color: M.ink }}>{selectedContact.name}</p>
                        <p style={{ fontSize: 11, color: M.inkFaint }}>{selectedContact.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedContact(null); setTenantEmail('') }}
                        style={{
                          padding: 4, background: 'none', border: 'none',
                          cursor: 'pointer', color: M.inkFaint, borderRadius: 4,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = M.tenantBorder)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ) : null}

                  {/* Picker contacts messagerie */}
                  {messagingContacts.length > 0 && !selectedContact && (
                    <div style={{ marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => setShowContactPicker((v) => !v)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 8,
                          border: `1px solid ${M.border}`, background: M.surface,
                          fontSize: 13, fontWeight: 500, color: M.inkMid,
                          cursor: 'pointer', fontFamily: M.body,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = M.muted)}
                        onMouseLeave={e => (e.currentTarget.style.background = M.surface)}
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare style={{ width: 14, height: 14, color: M.owner }} />
                          Choisir depuis mes contacts messagerie
                          <span style={{
                            fontSize: 10, fontWeight: 700, fontFamily: M.body,
                            background: M.ownerLight, color: M.owner,
                            border: `1px solid ${M.ownerBorder}`, borderRadius: 20,
                            padding: '1px 7px',
                          }}>
                            {messagingContacts.length}
                          </span>
                        </span>
                        {showContactPicker
                          ? <ChevronUp style={{ width: 14, height: 14, color: M.inkFaint }} />
                          : <ChevronDown style={{ width: 14, height: 14, color: M.inkFaint }} />
                        }
                      </button>

                      {showContactPicker && (
                        <div style={{
                          marginTop: 4, borderRadius: 8,
                          border: `1px solid ${M.border}`,
                          overflow: 'hidden', background: M.surface,
                          boxShadow: '0 4px 16px rgba(13,12,10,0.08)',
                        }}>
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
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', textAlign: 'left',
                                background: 'none', border: 'none',
                                borderBottom: `1px solid ${M.border}`,
                                cursor: 'pointer', fontFamily: M.body,
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = M.muted)}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                              {contact.avatar ? (
                                <img src={contact.avatar} alt={contact.name}
                                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                              ) : (
                                <div style={{
                                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                  background: M.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <User style={{ width: 14, height: 14, color: M.owner }} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p style={{ fontWeight: 500, fontSize: 13, color: M.ink }}>{contact.name}</p>
                                <p style={{ fontSize: 11, color: M.inkFaint }} className="truncate">{contact.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Séparateur */}
                  {messagingContacts.length > 0 && !selectedContact && (
                    <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 1, background: M.border }} />
                      <span style={{ fontSize: 11, color: M.inkFaint }}>ou saisir manuellement</span>
                      <div style={{ flex: 1, height: 1, background: M.border }} />
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
                        style={inputStyle(!!errors.tenantEmail)}
                      />
                      <p style={{ fontSize: 11, color: M.inkFaint, marginTop: 4 }}>
                        Le locataire doit avoir un compte avec cet email sur la plateforme
                      </p>
                    </>
                  )}

                  {errors.tenantEmail && (
                    <p style={{ fontSize: 11, color: M.danger, marginTop: 4 }}>{errors.tenantEmail}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Juridical Fields */}
            {step === 2 && (
              <div style={cardStyle}>
                <h2 style={{
                  fontFamily: M.display, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 24, color: M.ink, marginBottom: 24,
                }}>
                  Étape 2 — Conditions juridiques
                </h2>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>
                      Date de prise d'effet <span style={{ color: M.danger }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={inputStyle(!!errors.startDate)}
                    />
                    {errors.startDate && (
                      <p style={{ fontSize: 11, color: M.danger, marginTop: 4 }}>{errors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Date de fin du bail <span style={{ color: M.danger }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={inputStyle(!!errors.endDate)}
                    />
                    {errors.endDate && (
                      <p style={{ fontSize: 11, color: M.danger, marginTop: 4 }}>{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Financial */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>
                      Loyer mensuel (€) <span style={{ color: M.danger }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      placeholder="800"
                      style={inputStyle(!!errors.monthlyRent)}
                    />
                    {errors.monthlyRent && (
                      <p style={{ fontSize: 11, color: M.danger, marginTop: 4 }}>{errors.monthlyRent}</p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Charges (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={charges}
                      onChange={(e) => setCharges(e.target.value)}
                      placeholder="50"
                      style={inputStyle()}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Dépôt de garantie (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      placeholder="800"
                      style={inputStyle()}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>Modalité de paiement</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={inputStyle()}
                    >
                      <option value="virement">Virement bancaire</option>
                      <option value="prelevement">Prélèvement automatique</option>
                      <option value="cheque">Chèque</option>
                      <option value="especes">Espèces</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Jour de paiement</label>
                    <select
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      style={inputStyle()}
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
                  <div style={{
                    background: M.caramelLight, border: `1px solid ${M.caramel}`,
                    borderRadius: 8, padding: '12px 16px',
                  }}>
                    <p style={{ fontSize: 13, color: M.inkMid }}>
                      <span style={{ fontWeight: 600, color: M.ink }}>Total mensuel : </span>
                      <span style={{ fontWeight: 700, color: M.caramel, fontSize: 15 }}>
                        {(parseFloat(monthlyRent || '0') + parseFloat(charges || '0')).toFixed(2)} €
                      </span>
                      <span style={{ color: M.inkMid }}>
                        {' '}(loyer {monthlyRent} €{charges ? ` + charges ${charges} €` : ''})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Clauses */}
            {step === 3 && (
              <div style={cardStyle}>
                <h2 style={{
                  fontFamily: M.display, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 24, color: M.ink, marginBottom: 8,
                }}>
                  Étape 3 — Clauses du contrat
                </h2>
                <p style={{ fontSize: 13, color: M.inkFaint, marginBottom: 24 }}>
                  Les clauses standard de la Loi ALUR sont activées par défaut. Vous pouvez les désactiver ou ajouter des clauses personnalisées.
                </p>

                {/* Standard Clauses */}
                <div className="space-y-3" style={{ marginBottom: 32 }}>
                  {clauses.map((clause) => (
                    <div
                      key={clause.id}
                      style={{
                        border: `1px solid ${clause.enabled ? M.tenantBorder : M.border}`,
                        borderRadius: 8, padding: '14px 16px',
                        background: clause.enabled ? M.tenantLight : M.muted,
                        opacity: clause.enabled ? 1 : 0.6,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={clause.enabled}
                          onChange={() => toggleClause(clause.id)}
                          style={{ marginTop: 3 }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 style={{ fontWeight: 600, fontSize: 13, color: M.ink }}>{clause.title}</h4>
                            {clause.isCustom && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, fontFamily: M.body,
                                background: M.caramelLight, color: M.caramel,
                                border: `1px solid ${M.caramel}`, borderRadius: 20,
                                padding: '2px 8px',
                              }}>
                                Personnalisée
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: M.inkMid, marginTop: 4 }}>{clause.description}</p>
                        </div>
                        {clause.isCustom && (
                          <button
                            onClick={() => removeCustomClause(clause.id)}
                            style={{
                              padding: 4, background: 'none', border: 'none',
                              cursor: 'pointer', color: M.inkFaint,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = M.danger)}
                            onMouseLeave={e => (e.currentTarget.style.color = M.inkFaint)}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Clause */}
                <div style={{
                  border: `2px dashed ${M.border}`, borderRadius: 10,
                  padding: '16px', marginBottom: 24,
                }}>
                  <h4 style={{
                    fontWeight: 600, fontSize: 13, color: M.ink, marginBottom: 12,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <Plus style={{ width: 14, height: 14, color: M.owner }} />
                    Ajouter une clause personnalisée
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customClauseTitle}
                      onChange={(e) => setCustomClauseTitle(e.target.value)}
                      placeholder="Titre de la clause"
                      style={inputStyle()}
                    />
                    <textarea
                      value={customClauseDesc}
                      onChange={(e) => setCustomClauseDesc(e.target.value)}
                      placeholder="Description de la clause..."
                      style={{ ...inputStyle(), minHeight: 80, resize: 'none' }}
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={addCustomClause}
                      disabled={!customClauseTitle.trim() || !customClauseDesc.trim()}
                      style={{
                        ...btnGhost, padding: '8px 16px', fontSize: 12,
                        opacity: !customClauseTitle.trim() || !customClauseDesc.trim() ? 0.4 : 1,
                      }}
                    >
                      <Plus style={{ width: 13, height: 13 }} />
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Additional Terms */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Conditions particulières (texte libre)</label>
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Conditions supplémentaires spécifiques à ce bail..."
                    style={{ ...inputStyle(), minHeight: 100, resize: 'none' }}
                    rows={4}
                  />
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 11, color: M.inkFaint, marginBottom: 8 }}>Exemples de conditions particulières :</p>
                    <div className="flex flex-wrap gap-2">
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
                          style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 20,
                            background: M.muted, color: M.inkMid,
                            border: `1px solid ${M.border}`, cursor: 'pointer',
                            fontFamily: M.body,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = M.caramelLight
                            e.currentTarget.style.color = M.caramel
                            e.currentTarget.style.borderColor = M.caramel
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = M.muted
                            e.currentTarget.style.color = M.inkMid
                            e.currentTarget.style.borderColor = M.border
                          }}
                        >
                          + {example.slice(0, 50)}…
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
                          style={{ ...btnGhost, opacity: loading ? 0.5 : 1 }}
                        >
                          {loading ? (
                            'Génération...'
                          ) : (
                            <>
                              <Eye style={{ width: 14, height: 14 }} />
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
            <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
              <button
                type="button"
                onClick={step === 1 ? () => navigate('/contracts') : goPrev}
                style={btnGhost}
                onMouseEnter={e => (e.currentTarget.style.background = M.muted)}
                onMouseLeave={e => (e.currentTarget.style.background = M.surface)}
              >
                <ArrowLeft style={{ width: 15, height: 15 }} />
                {step === 1 ? 'Annuler' : 'Précédent'}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  style={btnPrimary}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Suivant
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  style={{ ...btnPrimary, opacity: isLoading ? 0.5 : 1 }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#ffffff',
                      }} className="animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Save style={{ width: 15, height: 15 }} />
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
