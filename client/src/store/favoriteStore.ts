import { create } from 'zustand'
import { favoriteService } from '../services/favorite.service'

interface FavoriteStore {
  favoriteIds: Set<string>
  isLoading: boolean
  error: string | null

  // Actions
  loadFavorites: () => Promise<void>
  addFavorite: (propertyId: string) => Promise<void>
  removeFavorite: (propertyId: string) => Promise<void>
  toggleFavorite: (propertyId: string) => Promise<void>
  isFavorite: (propertyId: string) => boolean
  clearError: () => void
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favoriteIds: new Set<string>(),
  isLoading: false,
  error: null,

  loadFavorites: async () => {
    set({ isLoading: true, error: null })
    try {
      const ids = await favoriteService.getFavoriteIds()
      set({ favoriteIds: new Set(ids), isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load favorites',
        isLoading: false,
      })
    }
  },

  addFavorite: async (propertyId: string) => {
    set({ error: null })
    try {
      await favoriteService.addFavorite(propertyId)
      const favoriteIds = new Set(get().favoriteIds)
      favoriteIds.add(propertyId)
      set({ favoriteIds })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add favorite' })
      throw error
    }
  },

  removeFavorite: async (propertyId: string) => {
    set({ error: null })
    try {
      await favoriteService.removeFavorite(propertyId)
      const favoriteIds = new Set(get().favoriteIds)
      favoriteIds.delete(propertyId)
      set({ favoriteIds })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove favorite' })
      throw error
    }
  },

  toggleFavorite: async (propertyId: string) => {
    const { isFavorite, addFavorite, removeFavorite } = get()
    if (isFavorite(propertyId)) {
      await removeFavorite(propertyId)
    } else {
      await addFavorite(propertyId)
    }
  },

  isFavorite: (propertyId: string) => {
    return get().favoriteIds.has(propertyId)
  },

  clearError: () => set({ error: null }),
}))
