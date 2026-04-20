import Stripe from 'stripe'
import { env } from '../config/env.js'

// stripe is null when STRIPE_SECRET_KEY is missing — billing routes return 503
let stripe: Stripe | null = null

if (env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
    console.log('[stripe] Configured')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe] Init failed:', msg)
  }
} else {
  console.warn('[stripe] STRIPE_SECRET_KEY missing — billing disabled')
}

export { stripe }

export const PLANS = {
  FREE:   { maxProperties: 10,       hasAI: false, hasSignature: false, hasAnalytics: false },
  PRO:    { maxProperties: 5,        hasAI: true,  hasSignature: true,  hasAnalytics: true  },
  EXPERT: { maxProperties: Infinity, hasAI: true,  hasSignature: true,  hasAnalytics: true  },
} as const

export type PlanType = keyof typeof PLANS
