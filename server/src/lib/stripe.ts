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

// ─── PLANS — Features granulaires ────────────────────────────────────────────
// Valeurs numériques null = illimité, 0 = désactivé
export const PLANS = {
  FREE: {
    maxProperties: 1,
    sepaRateBps: null as null,
    features: {
      quittancesAuto: false,
      quittancesManual: true,
      signatureElectronic: false,
      signatureLimitPerYear: 0,
      sepaPayment: false,
      aiDossierAnalysis: false,
      aiDossierLimitPerMonth: 0,
      aiAssistant: true,
      relancesAuto: false,
      analyticsFonciers: false,
      rapportFiscal: false,
      encadrementLoyers: false,
      multiEntities: false,
      apiAccess: false,
      prioritySupport: false,
      exportComptable: false as false,
    },
  },
  SOLO: {
    maxProperties: 1,
    sepaRateBps: null as null,
    features: {
      quittancesAuto: true,
      quittancesManual: true,
      signatureElectronic: true,
      signatureLimitPerYear: 1,
      sepaPayment: false,
      aiDossierAnalysis: false,
      aiDossierLimitPerMonth: 0,
      aiAssistant: true,
      relancesAuto: true,
      analyticsFonciers: false,
      rapportFiscal: false,
      encadrementLoyers: false,
      multiEntities: false,
      apiAccess: false,
      prioritySupport: false,
      exportComptable: false as false,
    },
  },
  PRO: {
    maxProperties: 5,
    sepaRateBps: 80, // 0.8%
    features: {
      quittancesAuto: true,
      quittancesManual: true,
      signatureElectronic: true,
      signatureLimitPerYear: null as null, // illimité
      sepaPayment: true,
      aiDossierAnalysis: true,
      aiDossierLimitPerMonth: 10,
      aiAssistant: true,
      relancesAuto: true,
      analyticsFonciers: true,
      rapportFiscal: true,
      encadrementLoyers: true,
      multiEntities: false,
      apiAccess: false,
      prioritySupport: false,
      exportComptable: 'basic' as 'basic',
    },
  },
  EXPERT: {
    maxProperties: Infinity,
    sepaRateBps: 60, // 0.6%
    features: {
      quittancesAuto: true,
      quittancesManual: true,
      signatureElectronic: true,
      signatureLimitPerYear: null as null,
      sepaPayment: true,
      aiDossierAnalysis: true,
      aiDossierLimitPerMonth: null as null, // illimité
      aiAssistant: true,
      relancesAuto: true,
      analyticsFonciers: true,
      rapportFiscal: true,
      encadrementLoyers: true,
      multiEntities: true,
      apiAccess: true,
      prioritySupport: true,
      exportComptable: 'advanced' as 'advanced',
    },
  },
} as const

export type PlanType = keyof typeof PLANS

// Ordre pour comparaisons (FREE < SOLO < PRO < EXPERT)
export const PLAN_ORDER: Record<PlanType, number> = {
  FREE: 0,
  SOLO: 1,
  PRO: 2,
  EXPERT: 3,
}
