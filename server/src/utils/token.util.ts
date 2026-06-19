import crypto from 'crypto'

/**
 * Generate a cryptographically secure random token (hex)
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate a short, unambiguous reset code (8 chars).
 * Excludes confusable chars: 0/O, 1/I/L — same pattern as Amazon/Stripe.
 * 27^8 ≈ 282 billion combinations. With 15-min expiry + rate limiting: unguessable.
 */
const SAFE_CHARS = 'ACDEFGHJKMNPQRTWXYZ23456789'
export function generateResetCode(length = 8): string {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes).map(b => SAFE_CHARS[b % SAFE_CHARS.length]).join('')
}

/**
 * SHA-256 hash of a token — used to store reset codes without exposing plaintext in DB.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
