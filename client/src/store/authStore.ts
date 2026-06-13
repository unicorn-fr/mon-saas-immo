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
  register: (data: RegisterData) => Promise<{ emailVerified: boolean }>
  logout: () => Promise<void>
  updateProfile: (data: {
    firstName?: string; lastName?: string; phone?: string; bio?: string; address?: string; role?: string
    city?: string; onboardingCompleted?: boolean
    birthDate?: string; birthCity?: string; nationality?: string
    nationalNumber?: string; documentNumber?: string; documentExpiry?: string
    profileMeta?: Record<string, Record<string, unknown>>
  }) => Promise<User>
  googleLogin: (idToken: string, role?: string) => Promise<{ user: User; isNewUser: boolean }>
  setAuthFromPopup: (data: { user: User; accessToken: string; refreshToken: string; isNewUser: boolean }) => void
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
          const result = await authService.register(data)
          set({ isLoading: false, error: null })
          return result
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
       * Update user profile
       */
      updateProfile: async (data) => {
        try {
          const user = await authService.updateProfile(data)
          set({ user })
          return user
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Profile update failed'
          throw new Error(errorMessage)
        }
      },

      /**
       * Google OAuth login
       */
      googleLogin: async (idToken: string, role?: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authService.googleAuth(idToken, role)

          setApiTokens(response.accessToken, response.refreshToken)

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return { user: response.user, isNewUser: response.isNewUser ?? false }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Google login failed'
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

      setAuthFromPopup: (data) => {
        setApiTokens(data.accessToken, data.refreshToken)
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
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
          isAuthenticated: true,
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
       * Load user from token — timeout 6s max pour ne pas bloquer l'UI au cold start
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

        // Race: vérification token vs timeout 6s
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('INIT_TIMEOUT')), 6000)
        )

        try {
          const user = await Promise.race([
            authService.getCurrentUser(),
            timeoutPromise,
          ])

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          // Token invalide ou serveur indisponible → on laisse l'utilisateur se connecter
          setApiTokens(null, null)
          set({ ...initialState, isLoading: false })
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
