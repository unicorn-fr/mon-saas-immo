import { BookingStatus, Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'

export interface CreateBookingInput {
  propertyId: string
  tenantId: string
  visitDate: Date
  visitTime: string
  duration?: number
  tenantNotes?: string
}

export interface UpdateBookingInput {
  visitDate?: Date
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
  dateFrom?: Date
  dateTo?: Date
}

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingInput) {
    // Check if property exists and is available
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { owner: true },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    if (property.status !== 'AVAILABLE') {
      throw new Error('Property is not available for booking')
    }

    // Check if the date/time slot is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: data.propertyId,
        visitDate: data.visitDate,
        visitTime: data.visitTime,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    })

    if (existingBooking) {
      throw new Error('This time slot is already booked')
    }

    // Check if visit date is in the future
    const visitDateTime = new Date(data.visitDate)
    if (visitDateTime < new Date()) {
      throw new Error('Visit date must be in the future')
    }

    // Validate that the requested time slot is within the property's availability
    const availableSlots = await this.getAvailableSlots(data.propertyId, data.visitDate)
    if (!availableSlots.includes(data.visitTime)) {
      throw new Error('This time slot is not available for this property')
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        visitDate: data.visitDate,
        visitTime: data.visitTime,
        duration: data.duration || 30,
        tenantNotes: data.tenantNotes,
        status: 'PENDING',
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // TODO: Send notification to property owner
    // await notificationService.notifyNewBooking(property.ownerId, booking)

    return booking
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Check authorization
    if (
      userRole !== 'ADMIN' &&
      booking.tenantId !== userId &&
      booking.property.ownerId !== userId
    ) {
      throw new Error('Unauthorized to view this booking')
    }

    return booking
  }

  /**
   * Get bookings with filters
   */
  async getBookings(
    filters: BookingFilters = {},
    pagination: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {
      page: 1,
      limit: 20,
    }
  ) {
    const { page, limit, sortBy = 'visitDate', sortOrder = 'asc' } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.BookingWhereInput = {}

    // Apply filters
    if (filters.propertyId) where.propertyId = filters.propertyId
    if (filters.tenantId) where.tenantId = filters.tenantId
    if (filters.status) where.status = filters.status

    // Owner filter - get bookings for owner's properties
    if (filters.ownerId) {
      where.property = {
        ownerId: filters.ownerId,
      }
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.visitDate = {}
      if (filters.dateFrom) where.visitDate.gte = filters.dateFrom
      if (filters.dateTo) where.visitDate.lte = filters.dateTo
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: {
            include: {
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }
  }

  /**
   * Update booking
   */
  async updateBooking(id: string, userId: string, userRole: string, data: UpdateBookingInput) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
      },
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Check authorization
    const isOwner = booking.property.ownerId === userId
    const isTenant = booking.tenantId === userId

    if (userRole !== 'ADMIN' && !isOwner && !isTenant) {
      throw new Error('Unauthorized to update this booking')
    }

    // If changing date/time, check availability
    if (data.visitDate || data.visitTime) {
      const newDate = data.visitDate || booking.visitDate
      const newTime = data.visitTime || booking.visitTime

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          propertyId: booking.propertyId,
          visitDate: newDate,
          visitTime: newTime,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          id: {
            not: id,
          },
        },
      })

      if (conflictingBooking) {
        throw new Error('This time slot is already booked')
      }
    }

    // Tenants can only update certain fields
    const updateData: any = {}
    if (isTenant && !isOwner) {
      if (data.visitDate) updateData.visitDate = data.visitDate
      if (data.visitTime) updateData.visitTime = data.visitTime
      if (data.tenantNotes !== undefined) updateData.tenantNotes = data.tenantNotes
    }

    // Owners can update additional fields
    if (isOwner) {
      if (data.ownerNotes !== undefined) updateData.ownerNotes = data.ownerNotes
      if (data.status) {
        updateData.status = data.status
        if (data.status === 'CONFIRMED') {
          updateData.confirmedAt = new Date()
        } else if (data.status === 'CANCELLED') {
          updateData.cancelledAt = new Date()
        }
      }
    }

    // Admins can update everything
    if (userRole === 'ADMIN') {
      Object.assign(updateData, data)
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return updatedBooking
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, userId: string, userRole: string, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Check authorization
    const isOwner = booking.property.ownerId === userId
    const isTenant = booking.tenantId === userId

    if (userRole !== 'ADMIN' && !isOwner && !isTenant) {
      throw new Error('Unauthorized to cancel this booking')
    }

    // Cannot cancel completed bookings
    if (booking.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed booking')
    }

    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // TODO: Notify the other party
    // if (isTenant) {
    //   await notificationService.notifyBookingCancelled(booking.property.ownerId, cancelledBooking)
    // } else {
    //   await notificationService.notifyBookingCancelled(booking.tenantId, cancelledBooking)
    // }

    return cancelledBooking
  }

  /**
   * Confirm booking (owner only)
   */
  async confirmBooking(id: string, ownerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    if (booking.property.ownerId !== ownerId) {
      throw new Error('Unauthorized to confirm this booking')
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Only pending bookings can be confirmed')
    }

    const confirmedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // TODO: Notify tenant
    // await notificationService.notifyBookingConfirmed(booking.tenantId, confirmedBooking)

    return confirmedBooking
  }

  /**
   * Generate time slots within a time window based on visit duration
   */
  private generateSlotsInWindow(startTime: string, endTime: string, slotDuration: number = 30): string[] {
    const slots: string[] = []
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
      const h = Math.floor(m / 60)
      const min = m % 60
      slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
    }
    return slots
  }

  /**
   * Get available time slots for a property on a specific date
   */
  async getAvailableSlots(propertyId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Fetch property with availability config
    // We need ALL overrides to know if the property has any config,
    // plus the specific overrides for this date
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        visitAvailabilitySlots: true,
        visitDateOverrides: true,
      },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    // Check if the property has ANY availability config at all
    const hasAnyConfig =
      property.visitAvailabilitySlots.length > 0 ||
      property.visitDateOverrides.length > 0

    // Get overrides for this specific date
    const dayOverrides = property.visitDateOverrides.filter((o) => {
      const overrideDate = new Date(o.date)
      overrideDate.setHours(0, 0, 0, 0)
      return overrideDate.getTime() === startOfDay.getTime()
    })

    // Determine the time windows for this date
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    let timeWindows: { startTime: string; endTime: string }[] = []

    if (dayOverrides.length > 0) {
      // Date overrides take priority for this specific date
      const blocked = dayOverrides.some((o) => o.type === 'BLOCKED')
      if (blocked) {
        return [] // No slots for blocked dates
      }

      // EXTRA overrides replace the recurring schedule for this date
      const extraOverrides = dayOverrides.filter((o) => o.type === 'EXTRA')
      timeWindows = extraOverrides.map((o) => ({
        startTime: o.startTime!,
        endTime: o.endTime!,
      }))
    } else if (property.visitAvailabilitySlots.length > 0) {
      // Use recurring schedule
      const daySlots = property.visitAvailabilitySlots.filter(
        (s) => s.dayOfWeek === dayOfWeek
      )
      if (daySlots.length === 0) {
        return [] // No recurring slots for this day
      }
      timeWindows = daySlots.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    } else if (hasAnyConfig) {
      // Property has date overrides but none for this day => no availability
      return []
    } else {
      // No config at all: fallback default 9h-18h (backwards compatibility)
      timeWindows = [{ startTime: '09:00', endTime: '18:00' }]
    }

    // Generate all possible slots from time windows using property's visit duration
    const slotDuration = property.visitDuration || 30
    const allSlots: string[] = []
    for (const window of timeWindows) {
      allSlots.push(...this.generateSlotsInWindow(window.startTime, window.endTime, slotDuration))
    }

    // Remove duplicates and sort
    const uniqueSlots = [...new Set(allSlots)].sort()

    // Get existing bookings for this date
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        visitDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        visitTime: true,
        duration: true,
      },
    })

    // Filter out booked slots
    const bookedTimes = bookings.map((b) => b.visitTime)
    const availableSlots = uniqueSlots.filter((slot) => !bookedTimes.includes(slot))

    return availableSlots
  }

  /**
   * Get booking statistics for owner
   */
  async getOwnerStatistics(ownerId: string) {
    const properties = await prisma.property.findMany({
      where: { ownerId },
      select: { id: true },
    })

    const propertyIds = properties.map((p) => p.id)

    const [total, pending, confirmed, cancelled, completed] = await Promise.all([
      prisma.booking.count({
        where: { propertyId: { in: propertyIds } },
      }),
      prisma.booking.count({
        where: { propertyId: { in: propertyIds }, status: 'PENDING' },
      }),
      prisma.booking.count({
        where: { propertyId: { in: propertyIds }, status: 'CONFIRMED' },
      }),
      prisma.booking.count({
        where: { propertyId: { in: propertyIds }, status: 'CANCELLED' },
      }),
      prisma.booking.count({
        where: { propertyId: { in: propertyIds }, status: 'COMPLETED' },
      }),
    ])

    return {
      total,
      pending,
      confirmed,
      cancelled,
      completed,
    }
  }
}

export const bookingService = new BookingService()
