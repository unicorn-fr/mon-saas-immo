/**
 * Cloudflare Turnstile middleware
 * Verifies the `cf-turnstile-response` token sent by the frontend.
 * Skipped in development if TURNSTILE_SECRET_KEY is not set.
 */

import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(req: Request, res: Response, next: NextFunction) {
  // Skip if secret not configured (dev mode / not yet set up)
  if (!env.TURNSTILE_SECRET_KEY) {
    return next()
  }

  const token = req.body['cf-turnstile-response'] || req.headers['x-turnstile-token']

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Vérification anti-bot requise. Veuillez recharger la page.',
    })
  }

  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token as string,
      remoteip: req.ip || '',
    })

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const data = (await response.json()) as { success: boolean; 'error-codes'?: string[] }

    if (!data.success) {
      return res.status(400).json({
        success: false,
        message: 'Vérification anti-bot échouée. Veuillez réessayer.',
      })
    }

    next()
  } catch {
    // Network error verifying Turnstile — fail open in dev, closed in prod
    if (env.IS_PRODUCTION) {
      return res.status(500).json({ success: false, message: 'Erreur de vérification anti-bot.' })
    }
    next()
  }
}
