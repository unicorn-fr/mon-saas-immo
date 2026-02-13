import { useState } from 'react'
import { PropertyFilters, PROPERTY_TYPES, AMENITIES } from '../../types/property.types'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface SearchFiltersProps {
  filters: PropertyFilters
  onFiltersChange: (filters: PropertyFilters) => void
  onReset: () => void
}

export const SearchFilters = ({ filters, onFiltersChange, onReset }: SearchFiltersProps) => {
  const [showAmenities, setShowAmenities] = useState(false)
  const [showFeatures, setShowFeatures] = useState(true)

  const handleChange = (key: keyof PropertyFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || []
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity]

    onFiltersChange({ ...filters, amenities: newAmenities })
  }

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof PropertyFilters]
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== ''
  })

  return (
    <div className="card sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de bien
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleChange('type', e.target.value || undefined)}
            className="input"
          >
            <option value="">Tous les types</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix (€/mois)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) =>
                handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input"
              min="0"
            />
          </div>
        </div>

        {/* Surface Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Surface (m²)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minSurface || ''}
              onChange={(e) =>
                handleChange('minSurface', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxSurface || ''}
              onChange={(e) =>
                handleChange('maxSurface', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input"
              min="0"
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chambres</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => handleChange('bedrooms', filters.bedrooms === num ? undefined : num)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  filters.bedrooms === num
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                }`}
              >
                {num === 5 ? '5+' : num}
              </button>
            ))}
          </div>
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salles de bain
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() =>
                  handleChange('bathrooms', filters.bathrooms === num ? undefined : num)
                }
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  filters.bathrooms === num
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                }`}
              >
                {num === 4 ? '4+' : num}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
          >
            <span>Caractéristiques</span>
            {showFeatures ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showFeatures && (
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.furnished || false}
                  onChange={(e) => handleChange('furnished', e.target.checked || undefined)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Meublé</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasParking || false}
                  onChange={(e) => handleChange('hasParking', e.target.checked || undefined)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Parking</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasBalcony || false}
                  onChange={(e) => handleChange('hasBalcony', e.target.checked || undefined)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Balcon</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasElevator || false}
                  onChange={(e) => handleChange('hasElevator', e.target.checked || undefined)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Ascenseur</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasGarden || false}
                  onChange={(e) => handleChange('hasGarden', e.target.checked || undefined)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Jardin</span>
              </label>
            </div>
          )}
        </div>

        {/* Amenities */}
        <div>
          <button
            onClick={() => setShowAmenities(!showAmenities)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
          >
            <span>
              Équipements
              {filters.amenities && filters.amenities.length > 0 && (
                <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                  {filters.amenities.length}
                </span>
              )}
            </span>
            {showAmenities ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showAmenities && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {AMENITIES.map((amenity) => (
                <label key={amenity.value} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.amenities?.includes(amenity.value) || false}
                    onChange={() => handleAmenityToggle(amenity.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
