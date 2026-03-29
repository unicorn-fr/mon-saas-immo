import Stripe from 'stripe'
import { env } from '../config/env.js'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PLANS = {
  FREE:   { maxProperties: 1,        hasAI: false, hasSignature: false, hasAnalytics: false },
  PRO:    { maxProperties: 5,        hasAI: true,  hasSignature: true,  hasAnalytics: true  },
  EXPERT: { maxProperties: Infinity, hasAI: true,  hasSignature: true,  hasAnalytics: true  },
} as const

export type PlanType = keyof typeof PLANS
