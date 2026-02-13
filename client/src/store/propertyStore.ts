import { create } from 'zustand'
import { propertyService } from '../services/property.service'
import {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
  PropertyPagination,
  PropertyStatistics,
} from '../types/property.types'

interface PropertyState {
  // Properties list
  properties: Property[]
  totalProperties: number
  currentPage: number
  totalPages: number
  hasMore: boolean

  // My properties (owner)
  myProperties: Property[]
  myPropertiesTotal: number

  // Statistics
  statistics: PropertyStatistics | null

  // Current property
  currentProperty: Property | null

  // Loading states
  isLoading: boolean
  isUploadingImages: boolean

  // Error
  error: string | null
}

interface PropertyActions {
  // Fetch properties
  fetchProperties: (filters?: PropertyFilters, pagination?: PropertyPagination) => Promise<void>
  searchProperties: (query: string, pagination?: PropertyPagination) => Promise<void>
  fetchPropertyById: (id: string, includeOwner?: boolean) => Promise<void>

  // My properties (owner)
  fetchMyProperties: (pagination?: PropertyPagination) => Promise<void>
  fetchMyStatistics: () => Promise<void>

  // CRUD operations
  createProperty: (data: CreatePropertyInput) => Promise<Property>
  updateProperty: (id: string, data: UpdatePropertyInput) => Promise<Property>
  deleteProperty: (id: string) => Promise<void>

  // Status updates
  changePropertyStatus: (id: string, status: string) => Promise<Property>
  publishProperty: (id: string) => Promise<Property>
  markAsOccupied: (id: string) => Promise<Property>

  // Upload
  uploadImages: (files: File[]) => Promise<string[]>

  // Actions
  contactProperty: (id: string) => Promise<void>

  // State management
  setCurrentProperty: (property: Property | null) => void
  clearProperties: () => void
  setError: (error: string | null) => void
}

type PropertyStore = PropertyState & PropertyActions

const initialState: PropertyState = {
  properties: [],
  totalProperties: 0,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,

  myProperties: [],
  myPropertiesTotal: 0,

  statistics: null,

  currentProperty: null,

  isLoading: false,
  isUploadingImages: false,

  error: null,
}

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  ...initialState,

  /**
   * Fetch properties with filters
   */
  fetchProperties: async (filters = {}, pagination = { page: 1, limit: 20 }) => {
    set({ isLoading: true, error: null })

    try {
      const response = await propertyService.getProperties(filters, pagination)

      set({
        properties: response.properties,
        totalProperties: response.pagination.total,
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasMore,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch properties'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Search properties by text
   */
  searchProperties: async (query, pagination = { page: 1, limit: 20 }) => {
    set({ isLoading: true, error: null })

    try {
      const response = await propertyService.searchProperties(query, pagination)

      set({
        properties: response.properties,
        totalProperties: response.pagination.total,
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasMore,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Fetch property by ID
   */
  fetchPropertyById: async (id, includeOwner = false) => {
    set({ isLoading: true, error: null })

    try {
      const property = await propertyService.getPropertyById(id, includeOwner)

      set({
        currentProperty: property,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch property'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Fetch my properties (owner)
   */
  fetchMyProperties: async (pagination = { page: 1, limit: 20 }) => {
    set({ isLoading: true, error: null })

    try {
      const response = await propertyService.getMyProperties(pagination)

      set({
        myProperties: response.properties,
        myPropertiesTotal: response.pagination.total,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch properties'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Fetch my statistics (owner)
   */
  fetchMyStatistics: async () => {
    set({ error: null })

    try {
      const statistics = await propertyService.getMyStatistics()

      set({ statistics })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statistics'
      set({ error: errorMessage })
      throw error
    }
  },

  /**
   * Create property
   */
  createProperty: async (data) => {
    set({ isLoading: true, error: null })

    try {
      const property = await propertyService.createProperty(data)

      // Add to my properties
      set((state) => ({
        myProperties: [property, ...state.myProperties],
        myPropertiesTotal: state.myPropertiesTotal + 1,
        isLoading: false,
      }))

      return property
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create property'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Update property
   */
  updateProperty: async (id, data) => {
    set({ isLoading: true, error: null })

    try {
      const property = await propertyService.updateProperty(id, data)

      // Update in lists
      set((state) => ({
        myProperties: state.myProperties.map((p) => (p.id === id ? property : p)),
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        currentProperty: state.currentProperty?.id === id ? property : state.currentProperty,
        isLoading: false,
      }))

      return property
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update property'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Delete property
   */
  deleteProperty: async (id) => {
    set({ isLoading: true, error: null })

    try {
      await propertyService.deleteProperty(id)

      // Remove from lists
      set((state) => ({
        myProperties: state.myProperties.filter((p) => p.id !== id),
        myPropertiesTotal: state.myPropertiesTotal - 1,
        properties: state.properties.filter((p) => p.id !== id),
        totalProperties: state.totalProperties - 1,
        currentProperty: state.currentProperty?.id === id ? null : state.currentProperty,
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete property'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Change property status
   */
  changePropertyStatus: async (id, status) => {
    set({ isLoading: true, error: null })

    try {
      const property = await propertyService.changePropertyStatus(id, status)

      set((state) => ({
        myProperties: state.myProperties.map((p) => (p.id === id ? property : p)),
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        currentProperty: state.currentProperty?.id === id ? property : state.currentProperty,
        isLoading: false,
      }))

      // Refresh statistics after status change
      try {
        const statistics = await propertyService.getMyStatistics()
        set({ statistics })
      } catch {
        // Non-blocking: stats refresh failure shouldn't break the flow
      }

      return property
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change property status'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Publish property
   */
  publishProperty: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const property = await propertyService.publishProperty(id)

      // Update in lists
      set((state) => ({
        myProperties: state.myProperties.map((p) => (p.id === id ? property : p)),
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        currentProperty: state.currentProperty?.id === id ? property : state.currentProperty,
        isLoading: false,
      }))

      return property
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish property'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Mark as occupied
   */
  markAsOccupied: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const property = await propertyService.markAsOccupied(id)

      // Update in lists
      set((state) => ({
        myProperties: state.myProperties.map((p) => (p.id === id ? property : p)),
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        currentProperty: state.currentProperty?.id === id ? property : state.currentProperty,
        isLoading: false,
      }))

      return property
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as occupied'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Upload images
   */
  uploadImages: async (files) => {
    set({ isUploadingImages: true, error: null })

    try {
      const urls = await propertyService.uploadImages(files)

      set({ isUploadingImages: false })

      return urls
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images'
      set({ isUploadingImages: false, error: errorMessage })
      throw error
    }
  },

  /**
   * Contact property owner
   */
  contactProperty: async (id) => {
    try {
      await propertyService.contactProperty(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to contact owner'
      set({ error: errorMessage })
      throw error
    }
  },

  /**
   * Set current property
   */
  setCurrentProperty: (property) => {
    set({ currentProperty: property })
  },

  /**
   * Clear properties
   */
  clearProperties: () => {
    set({
      properties: [],
      totalProperties: 0,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
    })
  },

  /**
   * Set error
   */
  setError: (error) => {
    set({ error })
  },
}))
