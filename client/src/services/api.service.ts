import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

/**
 * In-memory token storage (per-tab, not shared between browser tabs)
 * This prevents the bug where two tabs with different accounts
 * overwrite each other's tokens in localStorage.
 */
let _accessToken: string | null = localStorage.getItem('accessToken')
let _refreshToken: string | null = localStorage.getItem('refreshToken')

/**
 * Set tokens in memory AND persist to localStorage for page refresh
 */
export const setApiTokens = (accessToken: string | null, refreshToken: string | null) => {
  _accessToken = accessToken
  _refreshToken = refreshToken

  if (accessToken) localStorage.setItem('accessToken', accessToken)
  else localStorage.removeItem('accessToken')

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
  timeout: 10000,
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

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (!_refreshToken) {
          throw new Error('No refresh token')
        }

        // Refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: _refreshToken,
        })

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data.data

        // Update tokens in memory and localStorage
        setApiTokens(newAccessToken, newRefreshToken)

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        setApiTokens(null, null)
        localStorage.removeItem('user')

        window.location.href = '/login'

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
