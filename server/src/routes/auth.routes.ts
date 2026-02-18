import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

/**
 * Public routes
 */

// POST /api/v1/auth/register - Register new user
router.post('/register', authController.register.bind(authController))

// POST /api/v1/auth/login - Login user
router.post('/login', authController.login.bind(authController))

// POST /api/v1/auth/refresh - Refresh access token
router.post('/refresh', authController.refresh.bind(authController))

// POST /api/v1/auth/logout - Logout user
router.post('/logout', authController.logout.bind(authController))

// POST /api/v1/auth/forgot-password - Request password reset
router.post(
  '/forgot-password',
  authController.forgotPassword.bind(authController)
)

// POST /api/v1/auth/verify-email - Verify email with token
router.post('/verify-email', authController.verifyEmail.bind(authController))

// POST /api/v1/auth/reset-password - Reset password with token
router.post('/reset-password', authController.resetPassword.bind(authController))

// POST /api/v1/auth/google - Google OAuth login
router.post('/google', authController.googleAuth.bind(authController))

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

// POST /api/v1/auth/resend-verification - Resend verification email
router.post(
  '/resend-verification',
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

export default router
