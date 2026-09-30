import type { NextFunction, Request, Response } from 'express'
import { ZodError, z } from 'zod'

// Messages de validation en français : ils sont affichés tels quels au propriétaire.
z.config(z.locales.fr())

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message)
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message, details: err.details })
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0]?.message ?? 'Données invalides',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
  }
  console.error(err)
  return res.status(500).json({ success: false, message: 'Une erreur est survenue. Réessayez dans un instant.' })
}
