import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { ImageUpload } from '../../components/property/ImageUpload'
import { AvailabilityScheduler } from '../../components/property/AvailabilityScheduler'
import {
  PROPERTY_TYPES,
  AMENITIES,
  UpdatePropertyInput,
} from '../../types/property.types'
import { Layout } from '../../components/layout/Layout'

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
      await updateProperty(id, formData)
      navigate(`/properties/${id}`)
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const displayError = error || apiError

  if (isLoading && !isInitialized) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!currentProperty) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Propriété introuvable</h2>
            <Link to="/properties/owner/me" className="text-primary-600 hover:text-primary-700">
              Retour à mes propriétés
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/properties/owner/me"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à mes propriétés
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Modifier le bien</h1>
          <p className="text-gray-600 mt-1">{currentProperty.title}</p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{displayError}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Informations générales</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de l'annonce *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de bien *
                </label>
                <select
                  name="type"
                  value={formData.type || ''}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={6}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Localisation</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode || ''}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Characteristics */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Caractéristiques</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chambres *
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms || ''}
                  onChange={handleChange}
                  min="0"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salles de bain *
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms || ''}
                  onChange={handleChange}
                  min="0"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surface (m²) *
                </label>
                <input
                  type="number"
                  name="surface"
                  value={formData.surface || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Étage
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor || ''}
                  onChange={handleChange}
                  min="0"
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="furnished"
                    checked={formData.furnished || false}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Meublé</span>
                </label>
              </div>
            </div>

            {/* Features */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasParking"
                  checked={formData.hasParking || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Parking</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasBalcony"
                  checked={formData.hasBalcony || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Balcon</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasElevator"
                  checked={formData.hasElevator || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Ascenseur</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasGarden"
                  checked={formData.hasGarden || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Jardin</span>
              </label>
            </div>
          </div>

          {/* Financial */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Informations financières</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loyer mensuel (€) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  min="0"
                  step="10"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charges (€)
                </label>
                <input
                  type="number"
                  name="charges"
                  value={formData.charges || ''}
                  onChange={handleChange}
                  min="0"
                  step="10"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dépôt de garantie (€)
                </label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit || ''}
                  onChange={handleChange}
                  min="0"
                  step="10"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Équipements</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AMENITIES.map((amenity) => (
                <label key={amenity.value} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.amenities?.includes(amenity.value)}
                    onChange={() => handleAmenityToggle(amenity.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Photos</h2>
            <ImageUpload
              images={formData.images || []}
              onImagesChange={(images) => setFormData((prev) => ({ ...prev, images }))}
            />
          </div>

          {/* Visit Availability */}
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

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/properties/owner/me')}
              className="btn btn-secondary flex-1"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
