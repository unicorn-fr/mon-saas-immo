import { create } from 'zustand'
import { bookingService } from '../services/booking.service'
import {
  Booking,
  CreateBookingInput,
  UpdateBookingInput,
  BookingFilters,
  BookingPagination,
  BookingStatistics,
} from '../types/booking.types'

interface BookingStore {
  // State
  bookings: Booking[]
  currentBooking: Booking | null
  bookingsTotal: number
  statistics: BookingStatistics | null
  availableSlots: string[]
  isLoading: boolean
  isLoadingSlots: boolean
  error: string | null

  // Actions
  fetchBookings: (filters?: BookingFilters, pagination?: BookingPagination) => Promise<void>
  fetchBookingById: (id: string) => Promise<void>
  createBooking: (data: CreateBookingInput) => Promise<Booking>
  updateBooking: (id: string, data: UpdateBookingInput) => Promise<void>
  cancelBooking: (id: string, reason?: string) => Promise<void>
  confirmBooking: (id: string) => Promise<void>
  fetchAvailableSlots: (propertyId: string, date: string) => Promise<void>
  fetchOwnerStatistics: () => Promise<void>
  setError: (error: string | null) => void
  clearBookings: () => void
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  // Initial state
  bookings: [],
  currentBooking: null,
  bookingsTotal: 0,
  statistics: null,
  availableSlots: [],
  isLoading: false,
  isLoadingSlots: false,
  error: null,

  // Actions
  fetchBookings: async (filters = {}, pagination = { page: 1, limit: 20 }) => {
    set({ isLoading: true, error: null })
    try {
      const result = await bookingService.getBookings(filters, pagination)
      set({
        bookings: result.bookings,
        bookingsTotal: result.pagination.total,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch bookings',
        isLoading: false,
      })
    }
  },

  fetchBookingById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const booking = await bookingService.getBookingById(id)
      set({ currentBooking: booking, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch booking',
        isLoading: false,
      })
    }
  },

  createBooking: async (data: CreateBookingInput) => {
    set({ isLoading: true, error: null })
    try {
      const booking = await bookingService.createBooking(data)

      // Add to bookings list
      const currentBookings = get().bookings
      set({
        bookings: [booking, ...currentBookings],
        bookingsTotal: get().bookingsTotal + 1,
        isLoading: false,
      })

      return booking
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create booking',
        isLoading: false,
      })
      throw error
    }
  },

  updateBooking: async (id: string, data: UpdateBookingInput) => {
    set({ isLoading: true, error: null })
    try {
      const updatedBooking = await bookingService.updateBooking(id, data)

      // Update in bookings list
      const bookings = get().bookings.map((b) => (b.id === id ? updatedBooking : b))
      set({ bookings, isLoading: false })

      // Update current booking if it's the one being updated
      if (get().currentBooking?.id === id) {
        set({ currentBooking: updatedBooking })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update booking',
        isLoading: false,
      })
      throw error
    }
  },

  cancelBooking: async (id: string, reason?: string) => {
    set({ isLoading: true, error: null })
    try {
      const cancelledBooking = await bookingService.cancelBooking(id, reason)

      // Update in bookings list
      const bookings = get().bookings.map((b) => (b.id === id ? cancelledBooking : b))
      set({ bookings, isLoading: false })

      // Update current booking if it's the one being cancelled
      if (get().currentBooking?.id === id) {
        set({ currentBooking: cancelledBooking })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to cancel booking',
        isLoading: false,
      })
      throw error
    }
  },

  confirmBooking: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const confirmedBooking = await bookingService.confirmBooking(id)

      // Update in bookings list
      const bookings = get().bookings.map((b) => (b.id === id ? confirmedBooking : b))
      set({ bookings, isLoading: false })

      // Update current booking if it's the one being confirmed
      if (get().currentBooking?.id === id) {
        set({ currentBooking: confirmedBooking })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to confirm booking',
        isLoading: false,
      })
      throw error
    }
  },

  fetchAvailableSlots: async (propertyId: string, date: string) => {
    set({ isLoadingSlots: true, error: null })
    try {
      const slots = await bookingService.getAvailableSlots(propertyId, date)
      set({ availableSlots: slots, isLoadingSlots: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch available slots',
        isLoadingSlots: false,
      })
    }
  },

  fetchOwnerStatistics: async () => {
    set({ isLoading: true, error: null })
    try {
      const statistics = await bookingService.getOwnerStatistics()
      set({ statistics, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch statistics',
        isLoading: false,
      })
    }
  },

  setError: (error: string | null) => set({ error }),

  clearBookings: () =>
    set({
      bookings: [],
      currentBooking: null,
      bookingsTotal: 0,
      error: null,
    }),
}))
