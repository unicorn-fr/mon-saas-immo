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

const LAUNCH_MODE   = process.env.LAUNCH_MODE   ?? 'live'
const ADMIN_SECRET  = process.env.ADMIN_SECRET  ?? ''
const ADMIN_EMAILS  = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function requireOpenRegistrations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Mode live → tout le monde peut s'inscrire
  if (LAUNCH_MODE !== 'waitlist') {
    return next()
  }

  // Bypass par secret header
  const headerSecret = req.headers['x-admin-secret'] as string | undefined
  if (ADMIN_SECRET && headerSecret === ADMIN_SECRET) {
    return next()
  }

  // Bypass par email whitelist
  const bodyEmail = (req.body?.email as string | undefined)?.toLowerCase()
  if (bodyEmail && ADMIN_EMAILS.includes(bodyEmail)) {
    return next()
  }

  // Bloqué
  res.status(403).json({
    success: false,
    message: 'Les inscriptions sont fermées. Bailio ouvre bientôt — rejoignez la liste d\'attente.',
    code:    'REGISTRATIONS_CLOSED',
  })
}
