import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle, Filter, Loader2 } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { ImageUpload } from '../../components/property/ImageUpload'
import { AvailabilityScheduler } from '../../components/property/AvailabilityScheduler'
import { SelectionCriteriaForm } from '../../components/application/SelectionCriteriaForm'
import {
  PROPERTY_TYPES,
  AMENITIES,
  CreatePropertyInput,
} from '../../types/property.types'
import { DEFAULT_CRITERIA, type SelectionCriteria } from '../../types/application.types'
import { Layout } from '../../components/layout/Layout'

// ─── Shared style constants ───────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '1rem',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
  marginBottom: '1.5rem',
}

const inputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '0.75rem',
  padding: '0.625rem 1rem',
  color: '#1d1d1f',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  fontFamily: '"Plus Jakarta Sans", Inter, system-ui',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#515154',
  marginBottom: '0.375rem',
  fontFamily: '"Plus Jakarta Sans", Inter, system-ui',
}

function onFocusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#007AFF'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'
}
function onBlurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#d2d2d7'
  e.currentTarget.style.boxShadow = 'none'
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-base font-bold mb-5 pb-3"
      style={{
        color: '#1d1d1f',
        borderBottom: '1px solid #d2d2d7',
        fontFamily: '"Plus Jakarta Sans", Inter, system-ui',
      }}
    >
      {children}
    </h2>
  )
}

// ─── Checkbox toggle pill ─────────────────────────────────────────────────────

function CheckPill({
  name,
  checked,
  onChange,
  label,
}: {
  name: string
  checked: boolean | undefined
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  label: string
}) {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer rounded-xl px-3 py-2 transition-all select-none"
      style={{
        background: checked ? '#e8f0fe' : '#f5f5f7',
        border: `1px solid ${checked ? '#aacfff' : '#d2d2d7'}`,
        color: checked ? '#0066d6' : '#515154',
        fontWeight: checked ? 600 : 400,
        fontSize: '0.875rem',
      }}
    >
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span
        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: checked ? '#007AFF' : '#d2d2d7', transition: 'background 0.15s' }}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CreateProperty() {
  const navigate = useNavigate()
  const { createProperty, isLoading, error: apiError, setError } = useProperties()

  const [formData, setFormData] = useState<CreatePropertyInput>({
    title: '',
    description: '',
    type: 'APARTMENT',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    bedrooms: 1,
    bathrooms: 1,
    surface: 0,
    floor: undefined,
    totalFloors: undefined,
    furnished: false,
    price: 0,
    charges: undefined,
    deposit: undefined,
    images: [],
    hasParking: false,
    hasBalcony: false,
    hasElevator: false,
    hasGarden: false,
    amenities: [],
    visitDuration: 30,
    visitAvailabilitySlots: [],
    visitDateOverrides: [],
  })

  const [error, setLocalError] = useState('')
  const [criteria, setCriteria] = useState<SelectionCriteria>(DEFAULT_CRITERIA)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? parseFloat(value) : undefined }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...(prev.amenities || []), amenity],
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.title || !formData.description || !formData.address || !formData.city || !formData.postalCode) {
      setLocalError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    if (formData.surface <= 0) {
      setLocalError('La surface doit être supérieure à 0')
      return false
    }
    if (formData.price <= 0) {
      setLocalError('Le prix doit être supérieur à 0')
      return false
    }
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setError(null)
    if (!validateForm()) return
    try {
      const property = await createProperty({ ...formData, selectionCriteria: criteria })
      navigate(`/properties/${property.id}`)
    } catch (err) {
      console.error('Create failed:', err)
    }
  }

  const displayError = error || apiError

  return (
    <Layout>
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f5f5f7', fontFamily: '"Plus Jakarta Sans", Inter, system-ui' }}>
        <div className="max-w-4xl mx-auto">
          {/* Back link + Header */}
          <div className="mb-6">
            <Link
              to="/properties/owner/me"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-3 transition-colors"
              style={{ color: '#007AFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0066d6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#007AFF')}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à mes propriétés
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: '#1d1d1f' }}>
              Ajouter un bien
            </h1>
            <p className="text-sm mt-1" style={{ color: '#515154' }}>
              Renseignez les informations de votre nouveau bien immobilier
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Error */}
            {displayError && (
              <div
                className="mb-6 p-4 rounded-xl flex items-start gap-3"
                style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                <p className="text-sm" style={{ color: '#b91c1c' }}>{displayError}</p>
              </div>
            )}

            {/* ── Section: Informations générales ── */}
            <div style={cardStyle}>
              <SectionTitle>Informations générales</SectionTitle>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Titre de l'annonce *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: Appartement 3P Centre-Ville"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Type de bien *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Décrivez votre bien en détail..."
                    rows={6}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ── Section: Localisation ── */}
            <div style={cardStyle}>
              <SectionTitle>Localisation</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label style={labelStyle}>Adresse *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="15 Rue de la Loge"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ville *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Montpellier"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Code postal *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="34000"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ── Section: Caractéristiques ── */}
            <div style={cardStyle}>
              <SectionTitle>Caractéristiques</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label style={labelStyle}>Chambres *</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    min="0"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Salles de bain *</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min="0"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Surface (m²) *</label>
                  <input
                    type="number"
                    name="surface"
                    value={formData.surface || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Étage</label>
                  <input
                    type="number"
                    name="floor"
                    value={formData.floor || ''}
                    onChange={handleChange}
                    min="0"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CheckPill name="furnished"  checked={formData.furnished}  onChange={handleChange} label="Meublé" />
                <CheckPill name="hasParking"  checked={formData.hasParking}  onChange={handleChange} label="Parking" />
                <CheckPill name="hasBalcony"  checked={formData.hasBalcony}  onChange={handleChange} label="Balcon" />
                <CheckPill name="hasElevator" checked={formData.hasElevator} onChange={handleChange} label="Ascenseur" />
                <CheckPill name="hasGarden"   checked={formData.hasGarden}   onChange={handleChange} label="Jardin" />
              </div>
            </div>

            {/* ── Section: Informations financières ── */}
            <div style={cardStyle}>
              <SectionTitle>Informations financières</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label style={labelStyle}>Loyer mensuel (€) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
                    min="0"
                    step="10"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Charges (€)</label>
                  <input
                    type="number"
                    name="charges"
                    value={formData.charges || ''}
                    onChange={handleChange}
                    min="0"
                    step="10"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Dépôt de garantie (€)</label>
                  <input
                    type="number"
                    name="deposit"
                    value={formData.deposit || ''}
                    onChange={handleChange}
                    min="0"
                    step="10"
                    style={inputStyle}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  />
                </div>
              </div>
            </div>

            {/* ── Section: Équipements ── */}
            <div style={cardStyle}>
              <SectionTitle>Équipements</SectionTitle>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {AMENITIES.map((amenity) => (
                  <label
                    key={amenity.value}
                    className="flex items-center gap-2 cursor-pointer rounded-xl px-3 py-2 transition-all select-none text-sm"
                    style={{
                      background: formData.amenities?.includes(amenity.value) ? '#e8f0fe' : '#f5f5f7',
                      border: `1px solid ${formData.amenities?.includes(amenity.value) ? '#aacfff' : '#d2d2d7'}`,
                      color: formData.amenities?.includes(amenity.value) ? '#0066d6' : '#515154',
                      fontWeight: formData.amenities?.includes(amenity.value) ? 600 : 400,
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: formData.amenities?.includes(amenity.value) ? '#007AFF' : '#d2d2d7',
                        transition: 'background 0.15s',
                      }}
                    >
                      {formData.amenities?.includes(amenity.value) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.amenities?.includes(amenity.value)}
                      onChange={() => handleAmenityToggle(amenity.value)}
                      className="sr-only"
                    />
                    {amenity.label}
                  </label>
                ))}
              </div>
            </div>

            {/* ── Section: Photos ── */}
            <div style={cardStyle}>
              <SectionTitle>Photos</SectionTitle>
              <ImageUpload
                images={formData.images || []}
                onImagesChange={(images) => setFormData((prev) => ({ ...prev, images }))}
              />
            </div>

            {/* ── Section: Critères de sélection ── */}
            <div style={cardStyle}>
              <div className="flex items-center gap-2 mb-1">
                <Filter className="w-4 h-4" style={{ color: '#007AFF' }} />
                <h2 className="text-base font-bold" style={{ color: '#1d1d1f' }}>
                  Critères de sélection
                </h2>
              </div>
              <p className="text-sm mb-5" style={{ color: '#86868b' }}>
                Définissez les prérequis que les candidats doivent remplir pour postuler.
                Chaque dossier sera automatiquement scoré et classé selon ces critères.
              </p>
              <SelectionCriteriaForm criteria={criteria} onChange={setCriteria} />
            </div>

            {/* ── Section: Disponibilités ── */}
            <AvailabilityScheduler
              recurringSlots={formData.visitAvailabilitySlots || []}
              dateOverrides={formData.visitDateOverrides || []}
              visitDuration={formData.visitDuration || 30}
              onSlotsChange={(slots) =>
                setFormData((prev) => ({ ...prev, visitAvailabilitySlots: slots }))
              }
              onOverridesChange={(overrides) =>
                setFormData((prev) => ({ ...prev, visitDateOverrides: overrides }))
              }
              onDurationChange={(duration) =>
                setFormData((prev) => ({ ...prev, visitDuration: duration }))
              }
            />

            {/* ── Actions ── */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => navigate('/properties/owner/me')}
                disabled={isLoading}
                className="flex-1 rounded-xl font-semibold px-4 py-2.5 text-sm border transition-colors disabled:opacity-50"
                style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-xl font-semibold px-4 py-2.5 text-sm text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#007AFF' }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = '#0066d6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#007AFF')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Créer le bien
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
