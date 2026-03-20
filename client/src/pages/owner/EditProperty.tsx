import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle, Filter, Loader2 } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { ImageUpload } from '../../components/property/ImageUpload'
import { AvailabilityScheduler } from '../../components/property/AvailabilityScheduler'
import { SelectionCriteriaForm } from '../../components/application/SelectionCriteriaForm'
import {
  PROPERTY_TYPES,
  AMENITIES,
  UpdatePropertyInput,
} from '../../types/property.types'
import { DEFAULT_CRITERIA, type SelectionCriteria } from '../../types/application.types'
import { Layout } from '../../components/layout/Layout'

// ─── Maison tokens ────────────────────────────────────────────────────────────
const M = {
  bg:          '#fafaf8',
  surface:     '#ffffff',
  muted:       '#f4f2ee',
  inputBg:     '#f8f7f4',
  ink:         '#0d0c0a',
  inkMid:      '#5a5754',
  inkFaint:    '#9e9b96',
  owner:       '#1a3270',
  ownerLight:  '#eaf0fb',
  ownerBorder: '#b8ccf0',
  border:      '#e4e1db',
  borderMid:   '#ccc9c3',
  danger:      '#9b1c1c',
  dangerBg:    '#fef2f2',
}

// ─── Shared style constants ───────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: M.surface,
  border: `1px solid ${M.border}`,
  borderRadius: 12,
  padding: '1.5rem',
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
  marginBottom: '1.5rem',
}

const inputStyle: React.CSSProperties = {
  background: M.inputBg,
  border: `1px solid ${M.border}`,
  borderRadius: 8,
  padding: '0.625rem 1rem',
  color: M.ink,
  fontSize: 13,
  outline: 'none',
  width: '100%',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: M.inkMid,
  marginBottom: '0.375rem',
  fontFamily: "'DM Sans', system-ui, sans-serif",
}

function onFocusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = M.owner
  e.currentTarget.style.boxShadow = `0 0 0 3px ${M.ownerLight}`
}
function onBlurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = M.border
  e.currentTarget.style.boxShadow = 'none'
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 pb-3" style={{ borderBottom: `1px solid ${M.border}` }}>
      <p
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: M.inkFaint,
        }}
      >
        {children}
      </p>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function EditProperty() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentProperty,
    fetchPropertyById,
    updateProperty,
    isLoading,
    error: apiError,
    setError,
  } = useProperties()

  const [formData, setFormData] = useState<UpdatePropertyInput>({})
  const [criteria, setCriteria] = useState<SelectionCriteria>(DEFAULT_CRITERIA)
  const [error, setLocalError] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPropertyById(id, false)
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentProperty && !isInitialized) {
      setFormData({
        title: currentProperty.title,
        description: currentProperty.description,
        type: currentProperty.type,
        address: currentProperty.address,
        city: currentProperty.city,
        postalCode: currentProperty.postalCode,
        country: currentProperty.country,
        bedrooms: currentProperty.bedrooms,
        bathrooms: currentProperty.bathrooms,
        surface: currentProperty.surface,
        floor: currentProperty.floor || undefined,
        totalFloors: currentProperty.totalFloors || undefined,
        furnished: currentProperty.furnished,
        price: currentProperty.price,
        charges: currentProperty.charges || undefined,
        deposit: currentProperty.deposit || undefined,
        images: currentProperty.images,
        hasParking: currentProperty.hasParking,
        hasBalcony: currentProperty.hasBalcony,
        hasElevator: currentProperty.hasElevator,
        hasGarden: currentProperty.hasGarden,
        amenities: currentProperty.amenities,
        visitDuration: currentProperty.visitDuration || 30,
        visitAvailabilitySlots: currentProperty.visitAvailabilitySlots?.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })) || [],
        visitDateOverrides: currentProperty.visitDateOverrides?.map((o) => ({
          date: o.date,
          type: o.type,
          startTime: o.startTime,
          endTime: o.endTime,
        })) || [],
      })
      if (currentProperty.selectionCriteria) {
        setCriteria(currentProperty.selectionCriteria as SelectionCriteria)
      }
      setIsInitialized(true)
    }
  }, [currentProperty, isInitialized])

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
    if (formData.surface && formData.surface <= 0) {
      setLocalError('La surface doit être supérieure à 0')
      return false
    }
    if (formData.price && formData.price <= 0) {
      setLocalError('Le prix doit être supérieur à 0')
      return false
    }
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    setLocalError('')
    setError(null)
    if (!validateForm()) return
    try {
      await updateProperty(id, { ...formData, selectionCriteria: criteria })
      navigate(`/properties/${id}`)
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const displayError = error || apiError

  // Loading state
  if (isLoading && !isInitialized) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: M.bg }}>
          <div
            className="animate-spin rounded-full"
            style={{ width: 40, height: 40, borderWidth: 2, borderStyle: 'solid', borderColor: M.border, borderTopColor: M.owner }}
          />
        </div>
      </Layout>
    )
  }

  // Not found
  if (!currentProperty) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: M.bg }}>
          <div className="text-center">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 22,
                fontStyle: 'italic',
                fontWeight: 600,
                color: M.ink,
                marginBottom: 12,
              }}
            >
              Propriété introuvable
            </h2>
            <Link
              to="/properties/owner/me"
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: M.owner,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#142860')}
              onMouseLeave={(e) => (e.currentTarget.style.color = M.owner)}
            >
              Retour à mes propriétés
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 lg:py-8" style={{ background: M.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="max-w-4xl mx-auto">

          {/* ── Back link + Header ── */}
          <div className="mb-8">
            <Link
              to="/properties/owner/me"
              className="inline-flex items-center gap-1.5 mb-4 transition-colors"
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: M.owner,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#142860')}
              onMouseLeave={(e) => (e.currentTarget.style.color = M.owner)}
            >
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Retour à mes propriétés
            </Link>

            {/* Overline */}
            <p
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: M.inkFaint,
                marginBottom: 6,
              }}
            >
              Propriétaire — Modifier
            </p>
            {/* Title */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 40,
                fontWeight: 700,
                fontStyle: 'italic',
                color: M.ink,
                lineHeight: 1.1,
                marginBottom: 6,
              }}
            >
              Modifier le bien
            </h1>
            {/* Subtitle */}
            <p
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 14,
                color: M.inkMid,
              }}
            >
              {currentProperty.title}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Error */}
            {displayError && (
              <div
                className="mb-6 p-4 flex items-start gap-3"
                style={{ background: M.dangerBg, border: `1px solid ${M.danger}44`, borderRadius: 12 }}
              >
                <AlertCircle style={{ width: 18, height: 18, color: M.danger, flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: M.danger }}>{displayError}</p>
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
                    value={formData.title || ''}
                    onChange={handleChange}
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
                    value={formData.type || ''}
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
                    value={formData.description || ''}
                    onChange={handleChange}
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
                    value={formData.address || ''}
                    onChange={handleChange}
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
                    value={formData.city || ''}
                    onChange={handleChange}
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
                    value={formData.postalCode || ''}
                    onChange={handleChange}
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
                    value={formData.bedrooms || ''}
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
                    value={formData.bathrooms || ''}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'furnished',  checked: formData.furnished  || false, label: 'Meublé' },
                  { name: 'hasParking',  checked: formData.hasParking  || false, label: 'Parking' },
                  { name: 'hasBalcony',  checked: formData.hasBalcony  || false, label: 'Balcon' },
                  { name: 'hasElevator', checked: formData.hasElevator || false, label: 'Ascenseur' },
                  { name: 'hasGarden',   checked: formData.hasGarden   || false, label: 'Jardin' },
                ].map(({ name, checked, label }) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2 transition-all select-none"
                    style={{
                      background: checked ? M.ownerLight : M.muted,
                      border: `1px solid ${checked ? M.ownerBorder : M.border}`,
                      borderRadius: 8,
                      color: checked ? M.owner : M.inkMid,
                      fontWeight: checked ? 600 : 400,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: 13,
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: checked ? M.owner : M.borderMid, transition: 'background 0.15s' }}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <input type="checkbox" name={name} checked={checked} onChange={handleChange} className="sr-only" />
                    {label}
                  </label>
                ))}
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
                {AMENITIES.map((amenity) => {
                  const checked = formData.amenities?.includes(amenity.value) ?? false
                  return (
                    <label
                      key={amenity.value}
                      className="flex items-center gap-2 cursor-pointer px-3 py-2 transition-all select-none"
                      style={{
                        background: checked ? M.ownerLight : M.muted,
                        border: `1px solid ${checked ? M.ownerBorder : M.border}`,
                        borderRadius: 8,
                        color: checked ? M.owner : M.inkMid,
                        fontWeight: checked ? 600 : 400,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontSize: 13,
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: checked ? M.owner : M.borderMid, transition: 'background 0.15s' }}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleAmenityToggle(amenity.value)}
                        className="sr-only"
                      />
                      {amenity.label}
                    </label>
                  )
                })}
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
                <Filter style={{ width: 15, height: 15, color: M.owner }} />
                <p
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: M.inkFaint,
                  }}
                >
                  Critères de sélection
                </p>
              </div>
              <p className="mb-5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: M.inkMid }}>
                Définissez les prérequis que les candidats doivent remplir pour postuler.
              </p>
              <div style={{ borderTop: `1px solid ${M.border}`, paddingTop: '1rem' }}>
                <SelectionCriteriaForm criteria={criteria} onChange={setCriteria} />
              </div>
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
                className="flex-1 flex items-center justify-center px-4 py-2.5 disabled:opacity-50"
                style={{
                  background: M.surface,
                  border: `1px solid ${M.border}`,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: M.inkMid,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
                onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-50"
                style={{
                  background: M.owner,
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = '#142860')}
                onMouseLeave={(e) => (e.currentTarget.style.background = M.owner)}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save style={{ width: 15, height: 15 }} />
                    Enregistrer les modifications
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
