import { Request, Response, NextFunction } from 'express'
import { AppError } from './error.middleware.js'
import { verifyAccessToken } from '../utils/jwt.util.js'
import { authService } from '../services/auth.service.js'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: 'TENANT' | 'OWNER' | 'ADMIN' | 'SUPER_ADMIN'
        emailVerified?: boolean
      }
    }
  }
}

// Type alias for authenticated requests
export type AuthRequest = Request

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      throw new AppError(401, 'Authentication required')
    }

    // Verify token — payload contient id, email, role (signés cryptographiquement)
    const decoded = verifyAccessToken(token)

    // Attach user from JWT payload — pas de DB call sur chaque requête.
    // Les tokens sont invalidés à la déconnexion via rotation des refresh tokens.
    // Pour les cas critiques (ban, changement de rôle), les tokens expirent en 15min.
    req.user = {
      id: decoded.userId,
      email: decoded.email ?? '',
      role: decoded.role as 'TENANT' | 'OWNER' | 'ADMIN' | 'SUPER_ADMIN',
    }

    next()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Token') || error.message.includes('token')) {
        return next(new AppError(401, 'Invalid or expired token'))
      }
    }
    next(error)
  }
}

// Optional authentication - sets req.user if token is valid, but doesn't fail if missing
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (token) {
      const decoded = verifyAccessToken(token)
      const user = await authService.getUserById(decoded.userId)
      if (user && !(user as any).isBanned) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role as 'TENANT' | 'OWNER' | 'ADMIN' | 'SUPER_ADMIN',
        }
      }
    }
  } catch {
    // Silently ignore auth errors - user stays unauthenticated
  }
  next()
}

// Role-based access control
export const authorize = (...roles: ('TENANT' | 'OWNER' | 'ADMIN' | 'SUPER_ADMIN')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'))
    }

    if (!roles.includes(req.user.role as any)) {
      return next(new AppError(403, 'Insufficient permissions'))
    }

    next()
  }
}
