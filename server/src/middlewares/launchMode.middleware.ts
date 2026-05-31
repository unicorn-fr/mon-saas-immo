/**
 * launchMode.middleware.ts
 *
 * Bloque les inscriptions publiques quand LAUNCH_MODE=waitlist.
 * Désactiver simplement en passant LAUNCH_MODE=live le jour du lancement.
 *
 * Bypass autorisé si :
 *   - Header  x-admin-secret = ADMIN_SECRET
 *   - Email du body dans ADMIN_EMAILS (liste comma-separated)
 */
import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'
import { timingSafeEqual } from 'crypto'

export function requireOpenRegistrations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Mode live → tout le monde peut s'inscrire
  if (env.LAUNCH_MODE !== 'waitlist') {
    return next()
  }

  // Bypass par secret header (comparaison timing-safe)
  const headerSecret = req.headers['x-admin-secret'] as string | undefined
  if (env.ADMIN_SECRET && headerSecret) {
    try {
      const a = Buffer.from(headerSecret)
      const b = Buffer.from(env.ADMIN_SECRET)
      if (a.length === b.length && timingSafeEqual(a, b)) return next()
    } catch { /* fall through */ }
  }

  // Bypass par email whitelist
  const bodyEmail = (req.body?.email as string | undefined)?.toLowerCase()
  if (bodyEmail && env.ADMIN_EMAILS.includes(bodyEmail)) {
    return next()
  }

  // Bloqué
  res.status(403).json({
    success: false,
    message: 'Les inscriptions sont fermées. Bailio ouvre bientôt — rejoignez la liste d\'attente.',
    code:    'REGISTRATIONS_CLOSED',
  })
}
