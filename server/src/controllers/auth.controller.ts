import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'
import { validatePasswordStrength } from '../utils/password.util.js'
import { validateEmail, sanitizeInput } from '../utils/validation.util.js'
import { UserRole } from '@prisma/client'

class AuthController {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body

      // Validation
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: ['email, password, firstName, lastName, and role are required'],
        })
      }

      // Validate email
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        })
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors,
        })
      }

      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
          errors: ['Role must be TENANT or OWNER'],
        })
      }

      // Sanitize inputs
      const sanitizedData = {
        email: email.toLowerCase().trim(),
        password,
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        role,
        phone: phone ? sanitizeInput(phone) : undefined,
      }

      // Register user
      const result = await authService.register(sanitizedData)

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return res.status(409).json({
            success: false,
            message: error.message,
          })
        }
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        })
      }

      // Login
      const result = await authService.login({
        email: email.toLowerCase().trim(),
        password,
      })

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
          })
        }
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        })
      }

      const result = await authService.refreshAccessToken(refreshToken)

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user (invalidate refresh token)
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        })
      }

      await authService.logout(refreshToken)

      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/logout-all
   * Logout from all devices
   */
  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      await authService.logoutAllDevices(userId)

      return res.status(200).json({
        success: true,
        message: 'Logged out from all devices',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        })
      }

      await authService.requestPasswordReset(email.toLowerCase().trim())

      // Always return success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/change-password
   * Change password (authenticated)
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      const { currentPassword, newPassword } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        })
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'New password does not meet requirements',
          errors: passwordValidation.errors,
        })
      }

      await authService.changePassword(userId, currentPassword, newPassword)

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('incorrect')) {
          return res.status(401).json({
            success: false,
            message: error.message,
          })
        }
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const user = await authService.getUserById(userId)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      return res.status(200).json({
        success: true,
        data: { user },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /api/v1/auth/profile
   * Update user profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const { firstName, lastName, phone, bio } = req.body

      const user = await authService.updateProfile(userId, {
        firstName: firstName ? sanitizeInput(firstName) : undefined,
        lastName: lastName ? sanitizeInput(lastName) : undefined,
        phone: phone !== undefined ? sanitizeInput(phone) : undefined,
        bio: bio !== undefined ? bio.trim() : undefined,
      })

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/verify-email
   * Verify email with token
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required',
        })
      }

      await authService.verifyEmailWithToken(token)

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/resend-verification
   * Resend verification email
   */
  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      await authService.resendVerificationEmail(userId)

      return res.status(200).json({
        success: true,
        message: 'Verification email sent',
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required',
        })
      }

      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors,
        })
      }

      await authService.resetPasswordWithToken(token, newPassword)

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/google
   * Google OAuth login
   */
  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'Google ID token is required',
        })
      }

      const result = await authService.googleAuth(idToken)

      return res.status(200).json({
        success: true,
        message: 'Google authentication successful',
        data: result,
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }
}

export const authController = new AuthController()
