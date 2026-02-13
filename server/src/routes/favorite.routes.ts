import { Router } from 'express'
import { favoriteController } from '../controllers/favorite.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

/**
 * All favorite routes require authentication
 */

// GET /api/v1/favorites - Get user's favorites
router.get('/', authenticate, favoriteController.getFavorites.bind(favoriteController))

// GET /api/v1/favorites/ids - Get favorite property IDs
router.get('/ids', authenticate, favoriteController.getFavoriteIds.bind(favoriteController))

// GET /api/v1/favorites/:propertyId/check - Check if property is favorited
router.get(
  '/:propertyId/check',
  authenticate,
  favoriteController.checkFavorite.bind(favoriteController)
)

// POST /api/v1/favorites/:propertyId - Add to favorites
router.post(
  '/:propertyId',
  authenticate,
  favoriteController.addFavorite.bind(favoriteController)
)

// DELETE /api/v1/favorites/:propertyId - Remove from favorites
router.delete(
  '/:propertyId',
  authenticate,
  favoriteController.removeFavorite.bind(favoriteController)
)

export default router
