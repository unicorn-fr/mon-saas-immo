/**
 * Rate Limiter Middleware — Bailio
 *
 * Re-exports all rate limiters for discoverability.
 * The actual limiter logic lives in security.middleware.ts.
 * Import from here in route files.
 *
 * Usage:
 *   import { loginRateLimiter, uploadLimiter } from '../middlewares/rateLimiter.middleware.js'
 */

export {
  loginRateLimiter,
  emailRateLimiter,
  superAdminRateLimiter,
} from './security.middleware.js'

import { rateLimit } from 'express-rate-limit'

/**
 * Upload rate limiter — 20 uploads per hour per IP.
 * Applied on POST /api/v1/upload/*.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: "Limite d'upload atteinte. Réessayez dans 1 heure." },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Registration rate limiter — 5 account creations per hour per IP.
 * Prevents mass fake account creation.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Trop de créations de compte. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Promo code rate limiter — 5 attempts per 15 min per user IP.
 * Blocks brute-force guessing of promo codes.
 */
export const promoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Password reset rate limiter — 3 requests per 15 min per IP.
 * Blocks email enumeration and brute-force of reset codes.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Trop de demandes. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})
