import { Request, Response, NextFunction } from 'express'
import { bookingService } from '../services/booking.service.js'
import { BookingStatus } from '@prisma/client'

class BookingController {
  /**
   * POST /api/v1/bookings
   * Create a new booking
   */
  async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, visitDate, visitTime, duration, tenantNotes } = req.body
      const tenantId = req.user?.id

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      // Validation
      if (!propertyId || !visitDate || !visitTime) {
        return res.status(400).json({
          success: false,
          message: 'Property ID, visit date, and visit time are required',
        })
      }

      const booking = await bookingService.createBooking({
        propertyId,
        tenantId,
        visitDate: new Date(visitDate),
        visitTime,
        duration,
        tenantNotes,
      })

      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: { booking },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({
            success: false,
            message: 'Property not found',
          })
        }
        if (
          error.message.includes('not available') ||
          error.message.includes('already booked') ||
          error.message.includes('must be in the future')
        ) {
          return res.status(400).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/bookings/:id
   * Get booking by ID
   */
  async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id
      const userRole = req.user?.role

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const booking = await bookingService.getBookingById(id, userId, userRole)

      return res.status(200).json({
        success: true,
        data: { booking },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Booking not found') {
          return res.status(404).json({
            success: false,
            message: 'Booking not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/bookings
   * Get all bookings with filters
   */
  async getBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      const userRole = req.user?.role

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      // Parse filters from query
      const filters: any = {}

      if (req.query.propertyId) filters.propertyId = req.query.propertyId as string
      if (req.query.status) filters.status = req.query.status as BookingStatus

      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string)
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string)
      }

      // Role-based filtering
      if (userRole === 'TENANT') {
        filters.tenantId = userId
      } else if (userRole === 'OWNER') {
        filters.ownerId = userId
      }
      // ADMIN can see all bookings

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: (req.query.sortBy as string) || 'visitDate',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      }

      const result = await bookingService.getBookings(filters, pagination)

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/v1/bookings/:id
   * Update booking
   */
  async updateBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id
      const userRole = req.user?.role

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const { visitDate, visitTime, duration, tenantNotes, ownerNotes, status } = req.body

      const updateData: any = {}
      if (visitDate) updateData.visitDate = new Date(visitDate)
      if (visitTime) updateData.visitTime = visitTime
      if (duration) updateData.duration = duration
      if (tenantNotes !== undefined) updateData.tenantNotes = tenantNotes
      if (ownerNotes !== undefined) updateData.ownerNotes = ownerNotes
      if (status) updateData.status = status

      const booking = await bookingService.updateBooking(id, userId, userRole, updateData)

      return res.status(200).json({
        success: true,
        message: 'Booking updated successfully',
        data: { booking },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Booking not found') {
          return res.status(404).json({
            success: false,
            message: 'Booking not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
        if (error.message.includes('already booked')) {
          return res.status(400).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/bookings/:id/cancel
   * Cancel booking
   */
  async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { reason } = req.body
      const userId = req.user?.id
      const userRole = req.user?.role

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const booking = await bookingService.cancelBooking(id, userId, userRole, reason)

      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: { booking },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Booking not found') {
          return res.status(404).json({
            success: false,
            message: 'Booking not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
        if (error.message.includes('Cannot cancel')) {
          return res.status(400).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/bookings/:id/confirm
   * Confirm booking (owner only)
   */
  async confirmBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const ownerId = req.user?.id

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const booking = await bookingService.confirmBooking(id, ownerId)

      return res.status(200).json({
        success: true,
        message: 'Booking confirmed successfully',
        data: { booking },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Booking not found') {
          return res.status(404).json({
            success: false,
            message: 'Booking not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
        if (error.message.includes('Only pending')) {
          return res.status(400).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/bookings/property/:propertyId/available-slots
   * Get available time slots for a property on a specific date
   */
  async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params
      const { date } = req.query

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date is required',
        })
      }

      const availableSlots = await bookingService.getAvailableSlots(
        propertyId,
        new Date(date as string)
      )

      return res.status(200).json({
        success: true,
        data: { availableSlots },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/bookings/owner/statistics
   * Get booking statistics for owner
   */
  async getOwnerStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user?.id

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const statistics = await bookingService.getOwnerStatistics(ownerId)

      return res.status(200).json({
        success: true,
        data: { statistics },
      })
    } catch (error) {
      next(error)
    }
  }
}

export const bookingController = new BookingController()
