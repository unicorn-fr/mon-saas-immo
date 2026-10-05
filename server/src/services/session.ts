import type { NextFunction, Request, Response } from 'express'
import type { User } from '@prisma/client'
import { accessScope, prisma } from '../db.js'
import { isSelfPath, routeDenied, type AccessRole, type Scope } from '../domain/access.js'
import { hashToken, newToken } from '../lib/tokens.js'
import { HttpError } from '../lib/http.js'
import { clientIp } from '../lib/rateLimit.js'

const SESSION_DAYS = 60
/** Sans aucune visite pendant ce délai, la session expire (appareil oublié, perdu, partagé). */
export const IDLE_DAYS = 30
/** L'heure de dernière visite est enregistrée au plus toutes les 5 minutes. */
const TOUCH_MS = 5 * 60_000

declare module 'express-serve-static-core' {
  interface Request {
    user?: User
    sessionId?: string
    /** Espace partagé : la personne réellement connectée (req.user est alors le propriétaire). */
    actor?: User
    access?: { id: string; role: AccessRole; propertyIds: string[] }
  }
}

export async function createSession(userId: string, req?: Request): Promise<string> {
  const token = newToken()
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
      lastSeenAt: new Date(),
      ip: req ? clientIp(req).slice(0, 80) : null,
      userAgent: req ? String(req.headers['user-agent'] ?? '').slice(0, 300) : null,
    },
  })
  return token
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
}

function bearer(req: Request): string | null {
  const h = req.headers.authorization
  return h?.startsWith('Bearer ') ? h.slice(7).trim() || null : null
}

async function loadUser(req: Request): Promise<User | null> {
  const token = bearer(req)
  if (!token) return null
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } })
  if (!session) return null
  const now = Date.now()
  const lastSeen = (session.lastSeenAt ?? session.createdAt).getTime()
  if (session.expiresAt.getTime() < now || now - lastSeen > IDLE_DAYS * 86_400_000) {
    await prisma.session.deleteMany({ where: { id: session.id } })
    return null
  }
  if (now - lastSeen > TOUCH_MS) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now), ip: clientIp(req).slice(0, 80), userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300) } }).catch(() => undefined)
  }
  req.sessionId = session.id
  return session.user
}

/** Attache l'utilisateur s'il est connecté, sans l'exiger. */
export async function optionalUser(req: Request, _res: Response, next: NextFunction) {
  req.user = (await loadUser(req)) ?? undefined
  next()
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  // Plusieurs routeurs partagent le préfixe /api : la session n'est lue qu'une fois par requête.
  if (req.user) return next()
  const user = await loadUser(req)
  if (!user) return next(new HttpError(401, 'Votre session a expiré. Reconnectez-vous.'))
  const space = String(req.headers['x-bailio-space'] ?? '').trim()
  // Chemin complet sous /api (dans un sous-routeur, req.path est raccourci).
  const path = req.originalUrl.split('?')[0].replace(/^\/api(?=\/|$)/, '') || '/'
  if (!space || isSelfPath(path)) {
    req.user = user
    return next()
  }
  // Espace partagé : la personne travaille dans l'espace du propriétaire, limitée aux logements partagés.
  const access = await prisma.access.findFirst({ where: { id: space, memberId: user.id, acceptedAt: { not: null }, revokedAt: null }, include: { owner: true } })
  if (!access) return next(new HttpError(403, 'Cet accès partagé n’existe plus. Revenez à votre espace.'))
  const role = access.role as AccessRole
  const refused = routeDenied(role, req.method, path)
  if (refused) return next(new HttpError(403, refused))
  const properties = await prisma.property.findMany({ where: { userId: access.ownerId, id: { in: access.propertyIds } }, select: { id: true, structureId: true } })
  const propertyIds = properties.map((p) => p.id)
  const leases = await prisma.lease.findMany({ where: { userId: access.ownerId, propertyId: { in: propertyIds } }, select: { id: true, tenantIds: true } })
  const scope: Scope = {
    ownerId: access.ownerId,
    role,
    propertyIds,
    leaseIds: leases.map((l) => l.id),
    tenantIds: [...new Set(leases.flatMap((l) => l.tenantIds))],
    structureIds: [...new Set(properties.map((p) => p.structureId).filter((x): x is string => Boolean(x)))],
  }
  req.user = access.owner
  req.actor = user
  req.access = { id: access.id, role, propertyIds }
  res.setHeader('Cache-Control', 'no-store')
  accessScope.run(scope, () => next())
}

export function sessionToken(req: Request): string | null {
  return bearer(req)
}
