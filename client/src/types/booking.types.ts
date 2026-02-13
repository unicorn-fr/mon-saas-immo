export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface Booking {
  id: string
  propertyId: string
  property: {
    id: string
    title: string
    address: string
    city: string
    images: string[]
    owner: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone?: string
    }
  }
  tenantId: string
  tenant: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  visitDate: string
  visitTime: string
  duration: number
  status: BookingStatus
  tenantNotes?: string
  ownerNotes?: string
  confirmedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export interface CreateBookingInput {
  propertyId: string
  visitDate: string
  visitTime: string
  duration?: number
  tenantNotes?: string
}

export interface UpdateBookingInput {
  visitDate?: string
  visitTime?: string
  duration?: number
  tenantNotes?: string
  ownerNotes?: string
  status?: BookingStatus
}

export interface BookingFilters {
  propertyId?: string
  tenantId?: string
  ownerId?: string
  status?: BookingStatus
  dateFrom?: string
  dateTo?: string
}

export interface BookingPagination {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BookingListResponse {
  bookings: Booking[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

export interface BookingStatistics {
  total: number
  pending: number
  confirmed: number
  cancelled: number
  completed: number
}

export const BOOKING_STATUS: Array<{ value: BookingStatus; label: string; color: string }> = [
  { value: 'PENDING', label: 'En attente', color: 'yellow' },
  { value: 'CONFIRMED', label: 'Confirmée', color: 'green' },
  { value: 'CANCELLED', label: 'Annulée', color: 'red' },
  { value: 'COMPLETED', label: 'Terminée', color: 'gray' },
]

// Time slots for booking (9:00 - 18:00, every 30 minutes)
export const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
]

export const BOOKING_DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 heure' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 heures' },
]
