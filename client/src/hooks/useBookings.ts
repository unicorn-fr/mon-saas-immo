import { useBookingStore } from '../store/bookingStore'

export const useBookings = () => {
  const {
    bookings,
    currentBooking,
    bookingsTotal,
    statistics,
    availableSlots,
    isLoading,
    isLoadingSlots,
    error,
    fetchBookings,
    fetchBookingById,
    createBooking,
    updateBooking,
    cancelBooking,
    confirmBooking,
    fetchAvailableSlots,
    fetchOwnerStatistics,
    setError,
    clearBookings,
  } = useBookingStore()

  return {
    // State
    bookings,
    currentBooking,
    bookingsTotal,
    statistics,
    availableSlots,
    isLoading,
    isLoadingSlots,
    error,

    // Actions
    fetchBookings,
    fetchBookingById,
    createBooking,
    updateBooking,
    cancelBooking,
    confirmBooking,
    fetchAvailableSlots,
    fetchOwnerStatistics,
    setError,
    clearBookings,
  }
}
