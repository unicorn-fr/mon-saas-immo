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

// ─── PLANS — 4 tiers : FREE · SOLO 4,90€ · PRO 9,90€ · EXPERT 24,90€ ────────
// maxProperties: null = illimité
export const PLANS = {
  FREE: {
    maxProperties: 1,
    features: {
      quittancesAuto: false,
      quittancesManual: false,
      signatureElectronic: false,
      signatureLimitPerYear: 0,
      sepaPayment: false,
      aiDossierAnalysis: false,
      aiDossierLimitPerMonth: 0,
      aiAssistant: false,
      relancesAuto: false,
      analyticsFonciers: false,
      rapportFiscal: false,
      encadrementLoyers: false,
      multiEntities: false,
      apiAccess: false,
      prioritySupport: false,
      exportComptable: false as false,
      contractCreation: false,
    },
  },
  // SOLO — 3 biens, gestion basique (bail, quittances, EDL)
  SOLO: {
    maxProperties: 3,
    features: {
      quittancesAuto: true,
      quittancesManual: true,
      signatureElectronic: false,
      signatureLimitPerYear: 0,
      sepaPayment: false,
      aiDossierAnalysis: false,
      aiDossierLimitPerMonth: 0,
      aiAssistant: false,
      relancesAuto: false,
      analyticsFonciers: true,
      rapportFiscal: false,
      encadrementLoyers: true,
      multiEntities: false,
      apiAccess: false,
      prioritySupport: false,
      exportComptable: false as false,
      contractCreation: true,
    },
  },
  // PRO — 10 biens, tout inclus pour le propriétaire actif
  PRO: {
    maxProperties: 10,
    features: {
      quittancesAuto: true,
      quittancesManual: true,
      signatureElectronic: true,
      signatureLimitPerYear: null as null,
      sepaPayment: false,
      aiDossierAnalysis: true,
      aiDossierLimitPerMonth: null as null,
      aiAssistant: true,
      relancesAuto: true,
      analyticsFonciers: true,
      rapportFiscal: true,
      encadrementLoyers: true,
      multiEntities: false,
      apiAccess: false,
      prioritySupport: true,
      exportComptable: false as false,
      contractCreation: true,
    },
  },
  // EXPERT — biens illimités, multi-entités, API, export comptable
  EXPERT: {
    maxProperties: null as null,
    features: {
      quittancesAuto: true,
      quittancesManual: true,
      signatureElectronic: true,
      signatureLimitPerYear: null as null,
      sepaPayment: false,
      aiDossierAnalysis: true,
      aiDossierLimitPerMonth: null as null,
      aiAssistant: true,
      relancesAuto: true,
      analyticsFonciers: true,
      rapportFiscal: true,
      encadrementLoyers: true,
      multiEntities: true,
      apiAccess: true,
      prioritySupport: true,
      exportComptable: 'advanced' as 'advanced',
      contractCreation: true,
    },
  },
} as const

export type PlanType = keyof typeof PLANS

// Ordre croissant pour comparaisons de plan (requirePlan middleware)
export const PLAN_ORDER: Record<PlanType, number> = {
  FREE:   0,
  SOLO:   1,
  PRO:    2,
  EXPERT: 3,
}
