import type { NextFunction, Request, Response } from 'express'
import type { User } from '@prisma/client'
import { prisma } from '../db.js'
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

export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  // Plusieurs routeurs partagent le préfixe /api : la session n'est lue qu'une fois par requête.
  if (req.user) return next()
  const user = await loadUser(req)
  if (!user) return next(new HttpError(401, 'Votre session a expiré. Reconnectez-vous.'))
  req.user = user
  next()
}

export function sessionToken(req: Request): string | null {
  return bearer(req)
}
