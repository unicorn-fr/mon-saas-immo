import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error
  let statusCode = 500
  let message = 'Internal Server Error'
  let errors: any = undefined

  // AppError (custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // Zod Validation Error
  else if (err instanceof ZodError) {
    statusCode = 400
    message = 'Validation Error'
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))
  }

  // Prisma Errors — differentiated by error code
  else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as { code?: string }
    if (prismaErr.code === 'P2002') {
      // Unique constraint violation
      statusCode = 409
      message = 'Cette ressource existe déjà.'
    } else if (prismaErr.code === 'P2025') {
      // Record not found
      statusCode = 404
      message = 'Ressource introuvable.'
    } else if (prismaErr.code === 'P2003') {
      // Foreign key constraint violation
      statusCode = 409
      message = 'Référence vers une ressource inexistante.'
    } else {
      statusCode = 400
      message = 'Erreur de base de données.'
    }
  }

  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Log error always (visible in Render logs)
  console.error(`[error] [${statusCode}] ${req.method} ${req.path} - ${err.name}: ${err.message}`)
  if (env.IS_DEVELOPMENT) console.error(err.stack)

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.IS_DEVELOPMENT && { stack: err.stack }),
  })
}

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
