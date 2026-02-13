import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/auth.service'
import { setApiTokens } from '../services/api.service'
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthState,
} from '../types/auth.types'

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<User>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  loadUser: () => Promise<void>
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Login user
       */
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authService.login(credentials)

          // Store tokens in memory + localStorage
          setApiTokens(response.accessToken, response.refreshToken)

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return response.user
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Login failed'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      /**
       * Register new user
       */
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authService.register(data)

          // Store tokens in memory + localStorage
          setApiTokens(response.accessToken, response.refreshToken)

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Registration failed'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        const { refreshToken } = get()

        try {
          if (refreshToken) {
            await authService.logout(refreshToken)
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear tokens from memory + localStorage
          setApiTokens(null, null)
          localStorage.removeItem('user')

          // Reset state
          set({
            ...initialState,
          })
        }
      },

      /**
       * Set user
       */
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      /**
       * Set tokens
       */
      setTokens: (accessToken: string, refreshToken: string) => {
        setApiTokens(accessToken, refreshToken)

        set({
          accessToken,
          refreshToken,
        })
      },

      /**
       * Clear authentication
       */
      clearAuth: () => {
        setApiTokens(null, null)
        localStorage.removeItem('user')

        set({
          ...initialState,
        })
      },

      /**
       * Load user from token
       */
      loadUser: async () => {
        // Read from in-memory tokens (initialized from localStorage on module load)
        const { getApiTokens } = await import('../services/api.service')
        const { accessToken, refreshToken } = getApiTokens()

        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        set({ isLoading: true })

        try {
          const user = await authService.getCurrentUser()

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error('Failed to load user:', error)

          // Clear invalid tokens
          setApiTokens(null, null)

          set({
            ...initialState,
            isLoading: false,
          })
        }
      },

      /**
       * Set loading state
       */
      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },

      /**
       * Set error
       */
      setError: (error: string | null) => {
        set({ error })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
