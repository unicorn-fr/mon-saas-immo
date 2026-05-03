import { Router, Request, Response } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import * as totpController from '../controllers/totp.controller.js'
import { loginRateLimiter, emailRateLimiter } from '../middlewares/security.middleware.js'
import { requireOpenRegistrations } from '../middlewares/launchMode.middleware.js'
import { prisma } from '../config/database.js'

const router = Router()

/**
 * Public routes
 */

// POST /api/v1/auth/register — bloqué en mode waitlist
router.post('/register', requireOpenRegistrations, authController.register.bind(authController))

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

// POST /api/v1/auth/verify-email - Verify email with token (legacy)
router.post('/verify-email', authController.verifyEmail.bind(authController))

// POST /api/v1/auth/verify-email-code - Verify email with 6-digit code
router.post('/verify-email-code', authController.verifyEmailCode.bind(authController))

// POST /api/v1/auth/reset-password - Reset password with token
router.post('/reset-password', authController.resetPassword.bind(authController))

// POST /api/v1/auth/google - Google OAuth login (waitlist check inside service for new users only)
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

// GET /auth/fiscal-settings — get current user's fiscal settings
router.get('/fiscal-settings', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { fiscalSettings: true },
    })
    return res.json({ success: true, data: { fiscalSettings: user?.fiscalSettings ?? null } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /auth/fiscal-settings — save current user's fiscal settings
router.put('/fiscal-settings', authenticate, async (req: Request, res: Response) => {
  try {
    const { hasSociety, currentRegime, annualRevenue, realCharges, isFurnished, savedAt } = req.body
    // Basic validation
    const validRegimes = ['unknown', 'micro_foncier', 'reel', 'micro_bic', 'bic_reel', 'is']
    const validSocieties = ['non', 'sci_ir', 'sci_is', 'sarl_sas', 'autre']
    if (currentRegime && !validRegimes.includes(currentRegime)) {
      return res.status(400).json({ success: false, message: 'Régime invalide' })
    }
    if (hasSociety && !validSocieties.includes(hasSociety)) {
      return res.status(400).json({ success: false, message: 'Structure invalide' })
    }
    const fiscalSettings = {
      hasSociety: hasSociety ?? 'non',
      currentRegime: currentRegime ?? 'unknown',
      annualRevenue: Number(annualRevenue) || 0,
      realCharges: Number(realCharges) || 0,
      isFurnished: Boolean(isFurnished),
      savedAt: savedAt ?? new Date().toISOString(),
    }
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { fiscalSettings: fiscalSettings as object },
    })
    return res.json({ success: true, data: { fiscalSettings } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
