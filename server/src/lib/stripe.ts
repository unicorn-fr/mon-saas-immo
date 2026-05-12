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

// ─── PLANS — 2 tiers : FREE (listing) · PRO 9,90€ (tout inclus) ──────────────
// Valeurs numériques null = illimité, 0 = désactivé
// SOLO et EXPERT sont aliasés vers FREE et PRO pour compatibilité DB
export const PLANS = {
  FREE: {
    maxProperties: 1,
    features: {
      quittancesAuto: false,
      quittancesManual: false,     // PRO only
      signatureElectronic: false,  // PRO only
      signatureLimitPerYear: 0,
      sepaPayment: false,
      aiDossierAnalysis: false,    // PRO only
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
      contractCreation: false,     // PRO only
    },
  },
  // SOLO est un alias de PRO (plan retiré du marché)
  SOLO: {
    maxProperties: null as null, // illimité
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
  PRO: {
    maxProperties: null as null, // illimité
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
  // EXPERT est un alias de PRO (plan retiré du marché)
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

// Ordre pour comparaisons (FREE < SOLO = PRO = EXPERT)
export const PLAN_ORDER: Record<PlanType, number> = {
  FREE: 0,
  SOLO: 1,
  PRO: 1,
  EXPERT: 1,
}
