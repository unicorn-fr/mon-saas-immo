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

  // Prisma Errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400
    message = 'Database Error'
  }

  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Log error in development
  if (env.IS_DEVELOPMENT) {
    console.error('❌ Error:', err)
  }

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
