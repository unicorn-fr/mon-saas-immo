import { apiClient, handleApiError } from './api.service'
import {
  Booking,
  CreateBookingInput,
  UpdateBookingInput,
  BookingFilters,
  BookingPagination,
  BookingListResponse,
  BookingStatistics,
} from '../types/booking.types'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingInput): Promise<Booking> {
    try {
      const response = await apiClient.post<ApiResponse<{ booking: Booking }>>(
        '/bookings',
        data
      )
      return response.data.data.booking
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking> {
    try {
      const response = await apiClient.get<ApiResponse<{ booking: Booking }>>(
        `/bookings/${id}`
      )
      return response.data.data.booking
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get bookings with filters and pagination
   */
  async getBookings(
    filters: BookingFilters = {},
    pagination: BookingPagination = { page: 1, limit: 20 }
  ): Promise<BookingListResponse> {
    try {
      const params = new URLSearchParams()

      // Add filters
      if (filters.propertyId) params.append('propertyId', filters.propertyId)
      if (filters.status) params.append('status', filters.status)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      // Add pagination
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
      if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)

      const response = await apiClient.get<ApiResponse<BookingListResponse>>(
        `/bookings?${params.toString()}`
      )

      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Update booking
   */
  async updateBooking(id: string, data: UpdateBookingInput): Promise<Booking> {
    try {
      const response = await apiClient.put<ApiResponse<{ booking: Booking }>>(
        `/bookings/${id}`,
        data
      )
      return response.data.data.booking
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    try {
      const response = await apiClient.post<ApiResponse<{ booking: Booking }>>(
        `/bookings/${id}/cancel`,
        { reason }
      )
      return response.data.data.booking
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Confirm booking (owner only)
   */
  async confirmBooking(id: string): Promise<Booking> {
    try {
      const response = await apiClient.post<ApiResponse<{ booking: Booking }>>(
        `/bookings/${id}/confirm`
      )
      return response.data.data.booking
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get available time slots for a property on a specific date
   */
  async getAvailableSlots(propertyId: string, date: string): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ availableSlots: string[] }>>(
        `/bookings/property/${propertyId}/available-slots?date=${date}`
      )
      return response.data.data.availableSlots
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get owner booking statistics
   */
  async getOwnerStatistics(): Promise<BookingStatistics> {
    try {
      const response = await apiClient.get<ApiResponse<{ statistics: BookingStatistics }>>(
        '/bookings/owner/statistics'
      )
      return response.data.data.statistics
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export const bookingService = new BookingService()
