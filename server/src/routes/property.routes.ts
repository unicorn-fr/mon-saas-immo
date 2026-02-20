import { Router } from 'express'
import { propertyController } from '../controllers/property.controller.js'
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.middleware.js'
import { uploadFile } from '../utils/upload.util.js'

const router = Router()

/**
 * Public routes
 */

// GET /api/v1/properties - Get all properties with filters
router.get('/', propertyController.getProperties.bind(propertyController))

// GET /api/v1/properties/search - Search properties
router.get('/search', propertyController.searchProperties.bind(propertyController))

// GET /api/v1/properties/advanced-search - Advanced search with filters
router.get('/advanced-search', propertyController.advancedSearch.bind(propertyController))

// GET /api/v1/properties/:id - Get property by ID
router.get('/:id', propertyController.getPropertyById.bind(propertyController))

/**
 * Protected routes - Owner only
 */

// POST /api/v1/properties - Create property
router.post(
  '/',
  authenticate,
  authorize('OWNER'),
  propertyController.createProperty.bind(propertyController)
)

// GET /api/v1/properties/owner/me - Get my properties
router.get(
  '/owner/me',
  authenticate,
  authorize('OWNER'),
  propertyController.getMyProperties.bind(propertyController)
)

// GET /api/v1/properties/owner/me/statistics - Get my statistics
router.get(
  '/owner/me/statistics',
  authenticate,
  authorize('OWNER'),
  propertyController.getMyStatistics.bind(propertyController)
)

// PUT /api/v1/properties/:id - Update property
router.put(
  '/:id',
  authenticate,
  authorize('OWNER'),
  propertyController.updateProperty.bind(propertyController)
)

// DELETE /api/v1/properties/:id - Delete property
router.delete(
  '/:id',
  authenticate,
  authorize('OWNER'),
  propertyController.deleteProperty.bind(propertyController)
)

// PUT /api/v1/properties/:id/status - Change property status
router.put(
  '/:id/status',
  authenticate,
  authorize('OWNER'),
  propertyController.changeStatus.bind(propertyController)
)

// PUT /api/v1/properties/:id/publish - Publish property
router.put(
  '/:id/publish',
  authenticate,
  authorize('OWNER'),
  propertyController.publishProperty.bind(propertyController)
)

// PUT /api/v1/properties/:id/occupy - Mark as occupied
router.put(
  '/:id/occupy',
  authenticate,
  authorize('OWNER'),
  propertyController.markAsOccupied.bind(propertyController)
)

// POST /api/v1/properties/:id/verification-document - Upload verification document
router.post(
  '/:id/verification-document',
  authenticate,
  authorize('OWNER'),
  uploadFile.single('file'),
  propertyController.uploadVerificationDocument.bind(propertyController)
)

/**
 * Public routes - Optional authentication
 */

// POST /api/v1/properties/:id/contact - Contact property owner (public, auth optional)
router.post('/:id/contact', optionalAuthenticate, propertyController.contactProperty.bind(propertyController))

export default router
