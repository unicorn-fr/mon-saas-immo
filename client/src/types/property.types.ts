export type PropertyType = 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'DUPLEX' | 'LOFT'
export type PropertyStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DRAFT'
export type DateOverrideType = 'BLOCKED' | 'EXTRA'

export interface VisitAvailabilitySlot {
  id?: string
  dayOfWeek: number  // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  startTime: string  // "09:00"
  endTime: string    // "18:00"
}

export interface VisitDateOverride {
  id?: string
  date: string       // ISO date string
  type: DateOverrideType
  startTime?: string
  endTime?: string
}

export const DAYS_OF_WEEK: { value: number; label: string }[] = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
]

export interface PropertyOwner {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  avatar: string | null
}

export interface Property {
  id: string
  ownerId: string
  owner?: PropertyOwner

  // Basic Information
  title: string
  description: string
  type: PropertyType
  status: PropertyStatus

  // Location
  address: string
  city: string
  postalCode: string
  country: string
  latitude: number | null
  longitude: number | null

  // Characteristics
  bedrooms: number
  bathrooms: number
  surface: number
  floor: number | null
  totalFloors: number | null
  furnished: boolean

  // Financial
  price: number
  charges: number | null
  deposit: number | null

  // Media
  images: string[]
  virtualTour: string | null

  // Amenities
  hasParking: boolean
  hasBalcony: boolean
  hasElevator: boolean
  hasGarden: boolean
  amenities: string[]

  // Availability
  availableFrom: string | null

  // Statistics
  views: number
  contactCount: number

  // Counts
  _count?: {
    bookings: number
    favorites: number
  }

  // Visit Availability
  visitDuration?: number
  visitAvailabilitySlots?: VisitAvailabilitySlot[]
  visitDateOverrides?: VisitDateOverride[]

  // Timestamps
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface CreatePropertyInput {
  title: string
  description: string
  type: PropertyType
  address: string
  city: string
  postalCode: string
  country?: string
  latitude?: number
  longitude?: number
  bedrooms: number
  bathrooms: number
  surface: number
  floor?: number
  totalFloors?: number
  furnished?: boolean
  price: number
  charges?: number
  deposit?: number
  images?: string[]
  virtualTour?: string
  hasParking?: boolean
  hasBalcony?: boolean
  hasElevator?: boolean
  hasGarden?: boolean
  amenities?: string[]
  availableFrom?: string
  visitDuration?: number
  visitAvailabilitySlots?: VisitAvailabilitySlot[]
  visitDateOverrides?: VisitDateOverride[]
}

export interface UpdatePropertyInput {
  title?: string
  description?: string
  type?: PropertyType
  status?: PropertyStatus
  address?: string
  city?: string
  postalCode?: string
  country?: string
  latitude?: number
  longitude?: number
  bedrooms?: number
  bathrooms?: number
  surface?: number
  floor?: number
  totalFloors?: number
  furnished?: boolean
  price?: number
  charges?: number
  deposit?: number
  images?: string[]
  virtualTour?: string
  hasParking?: boolean
  hasBalcony?: boolean
  hasElevator?: boolean
  hasGarden?: boolean
  amenities?: string[]
  availableFrom?: string
  visitDuration?: number
  visitAvailabilitySlots?: VisitAvailabilitySlot[]
  visitDateOverrides?: VisitDateOverride[]
}

export interface PropertyFilters {
  city?: string
  type?: PropertyType
  status?: PropertyStatus
  minPrice?: number
  maxPrice?: number
  minSurface?: number
  maxSurface?: number
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
  hasParking?: boolean
  hasBalcony?: boolean
  hasElevator?: boolean
  hasGarden?: boolean
  amenities?: string[]
}

export interface PropertyPagination {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PropertyListResponse {
  properties: Property[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

export interface PropertyStatistics {
  totalProperties: number
  availableProperties: number
  occupiedProperties: number
  draftProperties: number
  totalViews: number
  totalContacts: number
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'LOFT', label: 'Loft' },
]

export const PROPERTY_STATUS: { value: PropertyStatus; label: string; color: string; description?: string }[] = [
  { value: 'AVAILABLE', label: 'En recherche de locataire', color: 'green', description: 'Votre bien est visible sur le site et ouvert aux candidatures' },
  { value: 'OCCUPIED', label: 'En location', color: 'blue', description: 'Votre bien est actuellement loue et masque du site' },
  { value: 'DRAFT', label: 'Pas sur le marche', color: 'gray', description: 'Votre bien est masque du site et non disponible' },
]

export const VISIT_DURATIONS: { value: number; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
]

export const AMENITIES: { value: string; label: string }[] = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'fiber', label: 'Fibre optique' },
  { value: 'dishwasher', label: 'Lave-vaisselle' },
  { value: 'washing_machine', label: 'Lave-linge' },
  { value: 'dryer', label: 'Sèche-linge' },
  { value: 'oven', label: 'Four' },
  { value: 'microwave', label: 'Micro-ondes' },
  { value: 'ac', label: 'Climatisation' },
  { value: 'heating', label: 'Chauffage' },
  { value: 'fireplace', label: 'Cheminée' },
  { value: 'garage', label: 'Garage' },
  { value: 'cellar', label: 'Cave' },
  { value: 'terrace', label: 'Terrasse' },
  { value: 'pool', label: 'Piscine' },
  { value: 'security_door', label: 'Porte blindée' },
  { value: 'intercom', label: 'Interphone' },
  { value: 'video_intercom', label: 'Visio-phone' },
  { value: 'alarm', label: 'Alarme' },
]
