/**
 * Security Middleware — Hardening Layer
 *
 * Covers:
 *  1. Brute-force / rate limiting (login, super-admin)
 *  2. Input sanitization (null bytes, control chars, oversized payloads)
 *  3. Zod schema validation helpers
 *  4. 2FA enforcement for SUPER_ADMIN routes
 *  5. Suspicious pattern detection (SQL/XSS injection attempts)
 */

import { Request, Response, NextFunction } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z, ZodSchema } from 'zod'
import { AppError } from './error.middleware.js'

// ─────────────────────────────────────────────────────────────────────────────
// 1. RATE LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login brute-force protection — 10 attempts per 15 minutes per IP.
 * After that the IP is blocked until the window expires.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
})

/**
 * Forgot-password / resend-email — 5 per hour per IP.
 */
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Trop de demandes. Réessayez dans une heure.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Super Admin routes — 60 requests per minute per IP.
 * Much stricter than the global limiter.
 */
export const superAdminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Trop de requêtes sur le panel admin.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. INPUT SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Patterns that indicate injection attempts.
 * We log these and return 400 without revealing why.
 */
const INJECTION_PATTERNS = [
  // SQL injection keywords
  /(\bUNION\b.*\bSELECT\b)/i,
  /(\bDROP\b.*\b(TABLE|DATABASE|SCHEMA)\b)/i,
  /(\bINSERT\b.*\bINTO\b)/i,
  /(\bDELETE\b.*\bFROM\b)/i,
  /(\bUPDATE\b.*\bSET\b)/i,
  /(\bEXEC(UTE)?\b.*\()/i,
  /(\bxp_cmdshell\b)/i,
  // Script injection
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on(load|error|click|mouseover|focus)\s*=/i,
  // Path traversal
  /\.\.[\/\\]/,
  // Null bytes
  /\0/,
]

/**
 * Recursively sanitize string values in an object:
 * - strip null bytes
 * - strip control characters (except \n\r\t)
 * - enforce max string length (32 KB)
 */
function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 10) return value // Guard against deep nesting
  if (typeof value === 'string') {
    return value
      .replace(/\0/g, '') // null bytes
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars (keep \t\n\r)
      .slice(0, 32768) // max 32 KB per field
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v, depth + 1))
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Sanitize key too (prevent prototype pollution)
      const safeKey = k.replace(/[^\w.\-[\]]/g, '').slice(0, 128)
      if (safeKey === '__proto__' || safeKey === 'constructor' || safeKey === 'prototype') continue
      result[safeKey] = sanitizeValue(v, depth + 1)
    }
    return result
  }
  return value
}

/**
 * Scan a string for injection patterns.
 */
function hasInjectionPattern(value: unknown, depth = 0): boolean {
  if (depth > 10) return false
  if (typeof value === 'string') {
    return INJECTION_PATTERNS.some((p) => p.test(value))
  }
  if (Array.isArray(value)) {
    return value.some((v) => hasInjectionPattern(v, depth + 1))
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((v) =>
      hasInjectionPattern(v, depth + 1)
    )
  }
  return false
}

/**
 * Global sanitization middleware — applied to ALL routes.
 * Sanitizes req.body, req.query, req.params.
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body) as Record<string, unknown>
  }

  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as Record<string, string>
  }

  // Detect injection attempts in all inputs — log & block
  const allInputs = { body: req.body, query: req.query, params: req.params }
  if (hasInjectionPattern(allInputs)) {
    console.warn(
      `[SECURITY] Injection attempt detected — IP: ${req.ip} — Path: ${req.path} — UA: ${req.get('user-agent')}`
    )
    return res.status(400).json({
      success: false,
      message: 'Requête invalide.',
    })
  }

  next()
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ZOD VALIDATION HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Factory: returns an Express middleware that validates req.body against a Zod schema.
 */
export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new AppError(400, result.error.errors[0].message))
    }
    req.body = result.data
    next()
  }

/**
 * Factory: validates req.query.
 */
export const validateQuery =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      return next(new AppError(400, result.error.errors[0].message))
    }
    req.query = result.data as any
    next()
  }

// ─────────────────────────────────────────────────────────────────────────────
// 4. SUPER ADMIN SCHEMAS (Zod)
// ─────────────────────────────────────────────────────────────────────────────

export const UpdateRoleSchema = z.object({
  role: z.enum(['TENANT', 'OWNER', 'ADMIN', 'SUPER_ADMIN']),
})

export const UpdateDocStatusSchema = z.object({
  status: z.enum(['PENDING', 'UPLOADED', 'VALIDATED', 'REJECTED']),
  note: z.string().max(1000).optional(),
})

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(9999).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. 2FA ENFORCEMENT FOR SUPER_ADMIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware: blocks access if the SUPER_ADMIN does not have TOTP enabled.
 * This forces every super admin to set up 2FA before using the panel.
 *
 * Note: we import prisma here lazily to avoid circular deps.
 */
export const require2FA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError(401, 'Authentication required'))

    if (req.user.role !== 'SUPER_ADMIN') return next()

    // Lazy import to avoid circular dependency
    const { prisma } = await import('../config/database.js')
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { totpEnabled: true },
    })

    if (!user?.totpEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé : la double authentification (2FA) est obligatoire pour le panel Super Admin. Activez-la dans votre profil.',
        code: '2FA_REQUIRED',
      })
    }

    next()
  } catch (e) {
    next(e)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SAFE TABLE NAME VALIDATOR (DB Explorer)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_TABLES = new Set([
  'users', 'properties', 'bookings', 'contracts', 'contract_documents',
  'tenant_documents', 'conversations', 'messages', 'notifications',
  'favorites', 'audit_logs', 'visit_availability_slots', 'visit_date_overrides',
])

/** Only lowercase letters and underscores — nothing else. */
const TABLE_NAME_REGEX = /^[a-z_]+$/

export const validateTableName = (table: string): boolean => {
  return (
    typeof table === 'string' &&
    table.length > 0 &&
    table.length <= 64 &&
    TABLE_NAME_REGEX.test(table) &&
    ALLOWED_TABLES.has(table)
  )
}
