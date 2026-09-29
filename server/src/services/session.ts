import type { NextFunction, Request, Response } from 'express'
import type { User } from '@prisma/client'
import { prisma } from '../db.js'
import { hashToken, newToken } from '../lib/tokens.js'
import { HttpError } from '../lib/http.js'

const SESSION_DAYS = 60

declare module 'express-serve-static-core' {
  interface Request {
    user?: User
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = newToken()
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) },
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
  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

/** Attache l'utilisateur s'il est connecté, sans l'exiger. */
export async function optionalUser(req: Request, _res: Response, next: NextFunction) {
  req.user = (await loadUser(req)) ?? undefined
  next()
}

export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  const user = await loadUser(req)
  if (!user) return next(new HttpError(401, 'Votre session a expiré. Reconnectez-vous.'))
  req.user = user
  next()
}

export function sessionToken(req: Request): string | null {
  return bearer(req)
}
