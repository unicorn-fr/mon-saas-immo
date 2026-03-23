import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import * as totpController from '../controllers/totp.controller.js'
import { loginRateLimiter, emailRateLimiter } from '../middlewares/security.middleware.js'

const router = Router()

/**
 * Public routes
 */

// POST /api/v1/auth/register
router.post('/register', authController.register.bind(authController))

// POST /api/v1/auth/login - Login user (brute-force protected: 10 attempts / 15 min)
router.post('/login', loginRateLimiter, authController.login.bind(authController))

// POST /api/v1/auth/refresh - Refresh access token
router.post('/refresh', authController.refresh.bind(authController))

// POST /api/v1/auth/logout - Logout user
router.post('/logout', authController.logout.bind(authController))

// POST /api/v1/auth/forgot-password - Request password reset (5 per hour)
router.post(
  '/forgot-password',
  emailRateLimiter,
  authController.forgotPassword.bind(authController)
)

// POST /api/v1/auth/verify-email - Verify email with token
router.post('/verify-email', authController.verifyEmail.bind(authController))

// POST /api/v1/auth/reset-password - Reset password with token
router.post('/reset-password', authController.resetPassword.bind(authController))

// POST /api/v1/auth/google - Google OAuth login
router.post('/google', authController.googleAuth.bind(authController))

// POST /api/v1/auth/magic-link — envoie un magic link (5 tentatives / heure)
router.post('/magic-link', emailRateLimiter, authController.sendMagicLink.bind(authController))

// POST /api/v1/auth/magic-link/verify — vérifie le token magic link
router.post('/magic-link/verify', authController.verifyMagicLink.bind(authController))

// POST /api/v1/auth/resend-verification-public - Renvoyer le lien (sans être connecté)
router.post(
  '/resend-verification-public',
  emailRateLimiter,
  authController.resendVerificationPublic.bind(authController)
)

/**
 * Protected routes (require authentication)
 */

// GET /api/v1/auth/me - Get current user profile
router.get('/me', authenticate, authController.getMe.bind(authController))

// PATCH /api/v1/auth/profile - Update user profile
router.patch(
  '/profile',
  authenticate,
  authController.updateProfile.bind(authController)
)

// POST /api/v1/auth/resend-verification - Resend verification email (5 per hour)
router.post(
  '/resend-verification',
  emailRateLimiter,
  authenticate,
  authController.resendVerification.bind(authController)
)

// POST /api/v1/auth/change-password - Change password
router.post(
  '/change-password',
  authenticate,
  authController.changePassword.bind(authController)
)

// POST /api/v1/auth/logout-all - Logout from all devices
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll.bind(authController)
)

// POST /api/v1/auth/verify-phone - Vérification téléphone via Firebase OTP
router.post(
  '/verify-phone',
  authenticate,
  authController.verifyPhone.bind(authController)
)

/**
 * TOTP / 2FA routes
 */

// POST /api/v1/auth/totp/verify - Verify code during login (public)
router.post('/totp/verify', totpController.verify)

// GET /api/v1/auth/totp/status - Get 2FA status (protected)
router.get('/totp/status', authenticate, totpController.status)

// GET /api/v1/auth/totp/setup - Generate QR code (protected)
router.get('/totp/setup', authenticate, totpController.setup)

// POST /api/v1/auth/totp/enable - Enable 2FA after scanning (protected)
router.post('/totp/enable', authenticate, totpController.enable)

// POST /api/v1/auth/totp/disable - Disable 2FA (protected)
router.post('/totp/disable', authenticate, totpController.disable)

export default router
