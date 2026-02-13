import { apiClient, handleApiError } from './api.service'
import {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
  PropertyPagination,
  PropertyListResponse,
  PropertyStatistics,
} from '../types/property.types'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

class PropertyService {
  /**
   * Get all properties with filters and pagination
   */
  async getProperties(
    filters: PropertyFilters = {},
    pagination: PropertyPagination = { page: 1, limit: 20 }
  ): Promise<PropertyListResponse> {
    try {
      const params = new URLSearchParams()

      // Add filters
      if (filters.city) params.append('city', filters.city)
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters.minSurface) params.append('minSurface', filters.minSurface.toString())
      if (filters.maxSurface) params.append('maxSurface', filters.maxSurface.toString())
      if (filters.bedrooms !== undefined) params.append('bedrooms', filters.bedrooms.toString())
      if (filters.bathrooms !== undefined) params.append('bathrooms', filters.bathrooms.toString())
      if (filters.furnished !== undefined) params.append('furnished', filters.furnished.toString())
      if (filters.hasParking !== undefined) params.append('hasParking', filters.hasParking.toString())
      if (filters.hasBalcony !== undefined) params.append('hasBalcony', filters.hasBalcony.toString())
      if (filters.hasElevator !== undefined) params.append('hasElevator', filters.hasElevator.toString())
      if (filters.hasGarden !== undefined) params.append('hasGarden', filters.hasGarden.toString())
      if (filters.amenities) {
        filters.amenities.forEach((amenity) => params.append('amenities', amenity))
      }

      // Add pagination
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
      if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)

      const response = await apiClient.get<ApiResponse<PropertyListResponse>>(
        `/properties?${params.toString()}`
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Search properties by text
   */
  async searchProperties(
    query: string,
    pagination: PropertyPagination = { page: 1, limit: 20 }
  ): Promise<PropertyListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('q', query)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
      if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)

      const response = await apiClient.get<ApiResponse<PropertyListResponse>>(
        `/properties/search?${params.toString()}`
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string, includeOwner = false): Promise<Property> {
    try {
      const params = includeOwner ? '?includeOwner=true' : ''
      const response = await apiClient.get<ApiResponse<{ property: Property }>>(
        `/properties/${id}${params}`
      )
      return response.data.data.property
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Create property (Owner only)
   */
  async createProperty(data: CreatePropertyInput): Promise<Property> {
    try {
      const response = await apiClient.post<ApiResponse<{ property: Property }>>(
        '/properties',
        data
      )
      return response.data.data.property
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Update property (Owner only)
   */
  async updateProperty(id: string, data: UpdatePropertyInput): Promise<Property> {
    try {
      const response = await apiClient.put<ApiResponse<{ property: Property }>>(
        `/properties/${id}`,
        data
      )
      return response.data.data.property
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Delete property (Owner only)
   */
  async deleteProperty(id: string): Promise<void> {
    try {
      await apiClient.delete(`/properties/${id}`)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Publish property (Owner only)
   */
  async publishProperty(id: string): Promise<Property> {
    try {
      const response = await apiClient.put<ApiResponse<{ property: Property }>>(
        `/properties/${id}/publish`
      )
      return response.data.data.property
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Change property status (Owner only)
   */
  async changePropertyStatus(id: string, status: string): Promise<Property> {
    try {
      const response = await apiClient.put<ApiResponse<{ property: Property }>>(
        `/properties/${id}/status`,
        { status }
      )
      return response.data.data.property
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Mark property as occupied (Owner only)
   */
  async markAsOccupied(id: string): Promise<Property> {
    try {
      const response = await apiClient.put<ApiResponse<{ property: Property }>>(
        `/properties/${id}/occupy`
      )
      return response.data.data.property
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get my properties (Owner only)
   */
  async getMyProperties(
    pagination: PropertyPagination = { page: 1, limit: 20 }
  ): Promise<PropertyListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
      if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)

      const response = await apiClient.get<ApiResponse<PropertyListResponse>>(
        `/properties/owner/me?${params.toString()}`
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get my statistics (Owner only)
   */
  async getMyStatistics(): Promise<PropertyStatistics> {
    try {
      const response = await apiClient.get<ApiResponse<{ statistics: PropertyStatistics }>>(
        '/properties/owner/me/statistics'
      )
      return response.data.data.statistics
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Contact property owner
   */
  async contactProperty(
    id: string,
    contactData: {
      name: string
      email: string
      phone?: string
      message: string
    }
  ): Promise<{ success: boolean; message: string; conversationId?: string }> {
    try {
      const response = await apiClient.post<
        ApiResponse<{
          success: boolean
          message: string
          propertyId: string
          ownerId: string
          conversationId?: string
        }>
      >(`/properties/${id}/contact`, contactData)
      return {
        success: response.data.data.success,
        message: response.data.data.message,
        conversationId: response.data.data.conversationId ?? undefined,
      }
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Upload single image
   */
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await apiClient.post<ApiResponse<{ url: string }>>(
        '/upload/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data.data.url
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(files: File[]): Promise<string[]> {
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('images', file)
      })

      const response = await apiClient.post<ApiResponse<{ urls: string[] }>>(
        '/upload/images',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data.data.urls
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export const propertyService = new PropertyService()
