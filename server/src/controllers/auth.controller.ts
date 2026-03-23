import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'
import { validatePasswordStrength } from '../utils/password.util.js'
import { validateEmail, sanitizeInput } from '../utils/validation.util.js'
import { UserRole } from '@prisma/client'
import { isTotpEnabled } from '../services/totp.service.js'
import { prisma } from '../config/database.js'
import { comparePassword } from '../utils/password.util.js'
import { verifyFirebasePhoneToken } from '../utils/firebase.util.js'

class AuthController {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body

      // Validation
      if (!email || !password || !firstName || !role) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: ['email, password, firstName, and role are required'],
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

      // Check if user exists and has TOTP enabled BEFORE full login
      const userCheck = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true, password: true, totpEnabled: true },
      })
      if (userCheck && userCheck.password) {
        const pwValid = await comparePassword(password, userCheck.password)
        if (pwValid && userCheck.totpEnabled) {
          // Password is correct but TOTP is required — don't issue tokens yet
          return res.status(200).json({
            success: true,
            totpRequired: true,
            userId: userCheck.id,
          })
        }
      }

      // Login (no TOTP or TOTP not enabled)
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

      const {
        firstName, lastName, phone, bio,
        birthDate, birthCity, nationality, nationalNumber, documentNumber, documentExpiry,
        profileMeta,
      } = req.body

      const user = await authService.updateProfile(userId, {
        firstName:      firstName      ? sanitizeInput(firstName)      : undefined,
        lastName:       lastName       ? sanitizeInput(lastName)       : undefined,
        phone:          phone          !== undefined ? sanitizeInput(phone) : undefined,
        bio:            bio            !== undefined ? bio.trim()           : undefined,
        birthDate:      birthDate      !== undefined ? sanitizeInput(birthDate)      : undefined,
        birthCity:      birthCity      !== undefined ? sanitizeInput(birthCity)      : undefined,
        nationality:    nationality    !== undefined ? sanitizeInput(nationality)    : undefined,
        nationalNumber: nationalNumber !== undefined ? sanitizeInput(nationalNumber) : undefined,
        documentNumber: documentNumber !== undefined ? sanitizeInput(documentNumber) : undefined,
        documentExpiry: documentExpiry !== undefined ? sanitizeInput(documentExpiry) : undefined,
        // profileMeta: validated JSON object only
        profileMeta:    (profileMeta && typeof profileMeta === 'object' && !Array.isArray(profileMeta))
                          ? profileMeta as Record<string, unknown>
                          : undefined,
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
  /**
   * POST /api/v1/auth/magic-link — envoie un magic link par email
   */
  async sendMagicLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      if (!email) return res.status(400).json({ success: false, message: 'Email requis' })

      const { isNewUser } = await authService.sendMagicLink(email.toLowerCase().trim())

      return res.status(200).json({
        success: true,
        message: 'Lien de connexion envoyé',
        data: { isNewUser },
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/magic-link/verify — vérifie le token et connecte l'utilisateur
   */
  async verifyMagicLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body
      if (!token) return res.status(400).json({ success: false, message: 'Token requis' })

      const result = await authService.verifyMagicLink(token)

      return res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: result,
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/resend-verification-public
   * Renvoyer le lien de vérification sans être connecté (après tentative de login bloquée)
   */
  async resendVerificationPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email requis' })
      }
      await authService.resendVerificationByEmail(email.toLowerCase().trim())
      return res.status(200).json({
        success: true,
        message: 'Si ce compte existe et n\'est pas encore vérifié, un email a été envoyé.',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/auth/verify-phone
   * Vérifie un numéro de téléphone via Firebase Phone Auth.
   * Le client envoie l'ID token Firebase après avoir validé l'OTP SMS.
   */
  async verifyPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const { firebaseIdToken } = req.body
      if (!firebaseIdToken) {
        return res.status(400).json({
          success: false,
          message: 'firebaseIdToken est requis',
        })
      }

      const { phoneNumber } = await verifyFirebasePhoneToken(firebaseIdToken)

      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: phoneNumber,
          phoneVerified: true,
        },
      })

      return res.status(200).json({
        success: true,
        message: 'Numéro de téléphone vérifié avec succès',
        data: { phoneNumber },
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }
}

export const authController = new AuthController()
