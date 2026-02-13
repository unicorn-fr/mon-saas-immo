import { Request, Response, NextFunction } from 'express'
import { favoriteService } from '../services/favorite.service.js'

class FavoriteController {
  /**
   * POST /api/v1/favorites/:propertyId
   * Add property to favorites
   */
  async addFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const favorite = await favoriteService.addFavorite(userId, propertyId)

      return res.status(201).json({
        success: true,
        message: 'Property added to favorites',
        data: { favorite },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({
            success: false,
            message: 'Property not found',
          })
        }
        if (error.message.includes('already in favorites')) {
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
   * DELETE /api/v1/favorites/:propertyId
   * Remove property from favorites
   */
  async removeFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const result = await favoriteService.removeFavorite(userId, propertyId)

      return res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Favorite not found') {
          return res.status(404).json({
            success: false,
            message: 'Favorite not found',
          })
        }
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/favorites
   * Get user's favorites
   */
  async getFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const favorites = await favoriteService.getFavorites(userId)

      return res.status(200).json({
        success: true,
        data: {
          favorites,
          total: favorites.length,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/favorites/:propertyId/check
   * Check if property is favorited
   */
  async checkFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const isFavorite = await favoriteService.isFavorite(userId, propertyId)

      return res.status(200).json({
        success: true,
        data: { isFavorite },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/favorites/ids
   * Get favorite property IDs
   */
  async getFavoriteIds(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const ids = await favoriteService.getFavoriteIds(userId)

      return res.status(200).json({
        success: true,
        data: { propertyIds: ids },
      })
    } catch (error) {
      next(error)
    }
  }
}

export const favoriteController = new FavoriteController()
