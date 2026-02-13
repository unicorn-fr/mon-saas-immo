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
        role: 'TENANT' | 'OWNER' | 'ADMIN'
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

    // Verify token using our utility
    const decoded = verifyAccessToken(token)

    // Verify user still exists
    const user = await authService.getUserById(decoded.userId)

    if (!user) {
      throw new AppError(401, 'User not found')
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'TENANT' | 'OWNER' | 'ADMIN',
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
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role as 'TENANT' | 'OWNER' | 'ADMIN',
        }
      }
    }
  } catch {
    // Silently ignore auth errors - user stays unauthenticated
  }
  next()
}

// Role-based access control
export const authorize = (...roles: ('TENANT' | 'OWNER' | 'ADMIN')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'))
    }

    next()
  }
}
