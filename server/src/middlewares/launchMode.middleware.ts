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

export function requireOpenRegistrations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Mode live → tout le monde peut s'inscrire
  if (env.LAUNCH_MODE !== 'waitlist') {
    return next()
  }

  // Bypass par secret header
  const headerSecret = req.headers['x-admin-secret'] as string | undefined
  if (env.ADMIN_SECRET && headerSecret === env.ADMIN_SECRET) {
    return next()
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
