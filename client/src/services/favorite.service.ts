import { apiClient, handleApiError } from './api.service'

interface Favorite {
  id: string
  userId: string
  propertyId: string
  createdAt: string
  property: any
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

class FavoriteService {
  /**
   * Add property to favorites
   */
  async addFavorite(propertyId: string): Promise<Favorite> {
    try {
      const response = await apiClient.post<ApiResponse<{ favorite: Favorite }>>(
        `/favorites/${propertyId}`
      )
      return response.data.data.favorite
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Remove property from favorites
   */
  async removeFavorite(propertyId: string): Promise<void> {
    try {
      await apiClient.delete(`/favorites/${propertyId}`)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get user's favorites
   */
  async getFavorites(): Promise<Favorite[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ favorites: Favorite[]; total: number }>>(
        '/favorites'
      )
      return response.data.data.favorites
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Check if property is favorited
   */
  async checkFavorite(propertyId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ isFavorite: boolean }>>(
        `/favorites/${propertyId}/check`
      )
      return response.data.data.isFavorite
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get favorite property IDs
   */
  async getFavoriteIds(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ propertyIds: string[] }>>(
        '/favorites/ids'
      )
      return response.data.data.propertyIds
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export const favoriteService = new FavoriteService()
