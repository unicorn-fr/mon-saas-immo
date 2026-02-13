import { prisma } from '../config/database.js'

class FavoriteService {
  /**
   * Add property to favorites
   */
  async addFavorite(userId: string, propertyId: string) {
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    })

    if (existing) {
      throw new Error('Property is already in favorites')
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        propertyId,
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
                avatar: true,
              },
            },
          },
        },
      },
    })

    return favorite
  }

  /**
   * Remove property from favorites
   */
  async removeFavorite(userId: string, propertyId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    })

    if (!favorite) {
      throw new Error('Favorite not found')
    }

    await prisma.favorite.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    })

    return { success: true, message: 'Property removed from favorites' }
  }

  /**
   * Get user's favorites
   */
  async getFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return favorites
  }

  /**
   * Check if property is favorited by user
   */
  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    })

    return !!favorite
  }

  /**
   * Get favorite IDs for user (for bulk checking)
   */
  async getFavoriteIds(userId: string): Promise<string[]> {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: {
        propertyId: true,
      },
    })

    return favorites.map((f) => f.propertyId)
  }

  /**
   * Get favorites count for user
   */
  async getFavoritesCount(userId: string): Promise<number> {
    return await prisma.favorite.count({
      where: { userId },
    })
  }
}

export const favoriteService = new FavoriteService()
