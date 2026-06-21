import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

let isRedirecting = false

/**
 * Access token: in-memory only (never persisted) — stolen by XSS = 15min exposure max.
 * Refresh token: localStorage — needed to survive page refresh (httpOnly cookie migration is P1 tech debt).
 */
let _accessToken: string | null = null
let _refreshToken: string | null = localStorage.getItem('refreshToken')

// Mutex: prevents concurrent refresh storms when multiple 401s fire simultaneously
let _refreshPromise: Promise<void> | null = null

/**
 * Set tokens — access token stays in memory only, refresh token persisted to localStorage.
 */
export const setApiTokens = (accessToken: string | null, refreshToken: string | null) => {
  _accessToken = accessToken
  _refreshToken = refreshToken

  if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
  else localStorage.removeItem('refreshToken')
}

/**
 * Get current in-memory tokens (for use by auth store)
 */
export const getApiTokens = () => ({ accessToken: _accessToken, refreshToken: _refreshToken })

/**
 * Create Axios instance with default configuration
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 30s : Render free tier cold starts can take 30-50s
  timeout: 30000,
})

/**
 * Request interceptor - Add auth token from in-memory storage
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${_accessToken}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor - Handle errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // If 403 with IDENTITY_REQUIRED, redirect to verification page
    if (error.response?.status === 403) {
      const data = error.response.data as { code?: string } | undefined
      if (data?.code === 'IDENTITY_REQUIRED') {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/verify-identity?redirect=${returnTo}`
        return Promise.reject(error)
      }
    }

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (!_refreshToken) {
          throw new Error('No refresh token')
        }

        // Mutex: if a refresh is already in-flight, wait for it instead of firing another
        if (!_refreshPromise) {
          _refreshPromise = (async () => {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken: _refreshToken,
              })
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data
              setApiTokens(newAccessToken, newRefreshToken)
            } finally {
              _refreshPromise = null
            }
          })()
        }

        await _refreshPromise

        // Retry original request with the freshly-set access token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${_accessToken}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        setApiTokens(null, null)
        localStorage.removeItem('user')
        localStorage.removeItem('auth-storage')

        if (!isRedirecting) {
          isRedirecting = true
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

/**
 * Generic API error handler
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errors?: string[] }>

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }

    if (axiosError.response?.data?.errors) {
      return axiosError.response.data.errors.join(', ')
    }

    if (axiosError.message) {
      return axiosError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}
