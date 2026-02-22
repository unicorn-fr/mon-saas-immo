import { apiClient, handleApiError } from './api.service'
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from '../types/auth.types'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

/** Thrown by authService.login when the server requires a TOTP code */
export class TotpRequiredError extends Error {
  userId: string
  constructor(userId: string) {
    super('TOTP_REQUIRED')
    this.userId = userId
  }
}

class AuthService {
  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        data
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      if (response.data.totpRequired) {
        throw new TotpRequiredError(response.data.userId)
      }
      return (response.data as ApiResponse<AuthResponse>).data
    } catch (error) {
      if (error instanceof TotpRequiredError) throw error
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', { refreshToken })
    } catch (error) {
      console.error('Logout error:', error)
      // Don't throw error, still clear local data
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    try {
      const response = await apiClient.post<
        ApiResponse<{ accessToken: string; refreshToken: string }>
      >('/auth/refresh', { refreshToken })
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>(
        '/auth/me'
      )
      return response.data.data.user
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/logout-all')
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: {
    firstName?: string
    lastName?: string
    phone?: string
    bio?: string
  }): Promise<User> {
    try {
      const response = await apiClient.patch<ApiResponse<{ user: User }>>(
        '/auth/profile',
        data
      )
      return response.data.data.user
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/verify-email', { token })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(): Promise<void> {
    try {
      await apiClient.post('/auth/resend-verification')
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  // ── TOTP / 2FA ────────────────────────────────────────────────────────────

  async totpStatus(): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ totpEnabled: boolean }>>('/auth/totp/status')
      return response.data.data.totpEnabled
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  async totpSetup(): Promise<{ qrCodeDataUrl: string; secret: string }> {
    try {
      const response = await apiClient.get<ApiResponse<{ qrCodeDataUrl: string; secret: string }>>('/auth/totp/setup')
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  async totpEnable(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/totp/enable', { token })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  async totpDisable(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/totp/disable', { token })
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  async totpVerify(userId: string, token: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/totp/verify', { userId, token })
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }

  /**
   * Google OAuth login
   */
  async googleAuth(idToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/google',
        { idToken }
      )
      return response.data.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  }
}

export const authService = new AuthService()
