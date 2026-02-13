import { Router } from 'express'
import { bookingController } from '../controllers/booking.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'

const router = Router()

/**
 * All booking routes require authentication
 */

// GET /api/v1/bookings - Get all bookings (filtered by role)
router.get('/', authenticate, bookingController.getBookings.bind(bookingController))

// GET /api/v1/bookings/owner/statistics - Get owner statistics
router.get(
  '/owner/statistics',
  authenticate,
  authorize('OWNER'),
  bookingController.getOwnerStatistics.bind(bookingController)
)

// GET /api/v1/bookings/property/:propertyId/available-slots - Get available slots (public)
router.get(
  '/property/:propertyId/available-slots',
  bookingController.getAvailableSlots.bind(bookingController)
)

// GET /api/v1/bookings/:id - Get booking by ID
router.get('/:id', authenticate, bookingController.getBookingById.bind(bookingController))

// POST /api/v1/bookings - Create new booking (authenticated users)
router.post('/', authenticate, bookingController.createBooking.bind(bookingController))

// PUT /api/v1/bookings/:id - Update booking
router.put('/:id', authenticate, bookingController.updateBooking.bind(bookingController))

// POST /api/v1/bookings/:id/cancel - Cancel booking
router.post(
  '/:id/cancel',
  authenticate,
  bookingController.cancelBooking.bind(bookingController)
)

// POST /api/v1/bookings/:id/confirm - Confirm booking (owner only)
router.post(
  '/:id/confirm',
  authenticate,
  authorize('OWNER'),
  bookingController.confirmBooking.bind(bookingController)
)

export default router
