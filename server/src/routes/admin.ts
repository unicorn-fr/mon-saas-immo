import { Router, type NextFunction, type Request, type Response } from 'express'
import { prisma } from '../db.js'
import { computeMetrics } from '../domain/metrics.js'
import { HttpError } from '../lib/http.js'
import { isAdmin } from '../services/admin.js'
import { requireUser } from '../services/session.js'

/**
 * Pilotage : indicateurs de Bailio, réservés aux adresses de ADMIN_EMAILS. Pour tout autre compte, l'adresse
 * répond « Page introuvable », comme si elle n'existait pas. Seuls des nombres sortent d'ici, jamais une donnée
 * d'un propriétaire ou d'un locataire.
 */
const router = Router()

function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!isAdmin(req.user?.email)) return next(new HttpError(404, 'Page introuvable.'))
  next()
}

router.use('/admin', requireUser, requireAdmin)

router.get('/admin/metrics', async (_req, res) => {
  // Les comptes du pilotage eux-mêmes ne comptent pas dans les chiffres.
  const users = (await prisma.user.findMany({ select: { id: true, email: true, createdAt: true, followUpSince: true } })).filter((u) => !isAdmin(u.email))
  const [sessions, properties, leases, payments, drafts] = await Promise.all([
    prisma.session.findMany({ select: { userId: true, createdAt: true, lastSeenAt: true } }),
    prisma.property.findMany({ select: { userId: true } }),
    prisma.lease.findMany({ select: { userId: true, createdAt: true, signedAt: true } }),
    prisma.payment.findMany({ select: { userId: true, createdAt: true } }),
    prisma.draft.findMany({ select: { createdAt: true } }),
  ])
  res.json({ success: true, data: computeMetrics({ now: new Date(), users, sessions, properties, leases, payments, drafts }) })
})

export default router
