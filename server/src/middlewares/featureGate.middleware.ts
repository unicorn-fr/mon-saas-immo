import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database.js'
import { PLANS, PlanType } from '../lib/stripe.js'
import { env } from '../config/env.js'

export type Feature =
  | 'quittances_auto'
  | 'signature_electronic'
  | 'sepa_payment'
  | 'ai_dossier_analysis'
  | 'ai_assistant'
  | 'relances_auto'
  | 'analytics_fonciers'
  | 'rapport_fiscal'
  | 'encadrement_loyers'
  | 'multi_entities'
  | 'api_access'
  | 'priority_support'

// Plan minimum requis par feature (pour le message d'upgrade)
const FEATURE_MIN_PLAN: Record<Feature, PlanType> = {
  quittances_auto:      'SOLO',
  signature_electronic: 'SOLO',
  relances_auto:        'SOLO',
  sepa_payment:         'PRO',
  ai_dossier_analysis:  'PRO',
  analytics_fonciers:   'PRO',
  rapport_fiscal:       'PRO',
  encadrement_loyers:   'PRO',
  multi_entities:       'EXPERT',
  api_access:           'EXPERT',
  priority_support:     'EXPERT',
  ai_assistant:         'FREE', // gratuit pour tous
}

// ─── Vérification programmatique (utilisable dans les services) ───────────────
export async function checkFeatureAccess(
  userId: string,
  feature: Feature
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: PlanType }> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  })

  const plan = (sub?.plan ?? 'FREE') as PlanType
  const isActive = !sub || ['ACTIVE', 'TRIALING'].includes(sub?.status ?? 'ACTIVE')
  const planFeatures = PLANS[plan].features

  // Map feature → clé dans PLANS
  const featureKeyMap: Record<Feature, keyof typeof planFeatures> = {
    quittances_auto:      'quittancesAuto',
    signature_electronic: 'signatureElectronic',
    sepa_payment:         'sepaPayment',
    ai_dossier_analysis:  'aiDossierAnalysis',
    ai_assistant:         'aiAssistant',
    relances_auto:        'relancesAuto',
    analytics_fonciers:   'analyticsFonciers',
    rapport_fiscal:       'rapportFiscal',
    encadrement_loyers:   'encadrementLoyers',
    multi_entities:       'multiEntities',
    api_access:           'apiAccess',
    priority_support:     'prioritySupport',
  }

  const featureKey = featureKeyMap[feature]
  const hasFeature = isActive && planFeatures[featureKey]

  if (!hasFeature) {
    return {
      allowed: false,
      reason: `Feature "${feature}" non disponible dans le plan ${plan}.`,
      upgradeRequired: FEATURE_MIN_PLAN[feature],
    }
  }

  // ── Vérification quota IA (analyses dossiers) ────────────────────────────
  if (feature === 'ai_dossier_analysis') {
    const limit = planFeatures.aiDossierLimitPerMonth
    if (limit !== null && limit > 0) {
      const now = new Date()
      const usage = await prisma.aiUsageTracking.findUnique({
        where: {
          userId_usageType_periodMonth_periodYear: {
            userId,
            usageType: 'dossier_analysis',
            periodMonth: now.getMonth() + 1,
            periodYear: now.getFullYear(),
          },
        },
        select: { usageCount: true },
      })
      const currentUsage = usage?.usageCount ?? 0
      if (currentUsage >= limit) {
        return {
          allowed: false,
          reason: `Quota IA atteint : ${currentUsage}/${limit} analyses ce mois. Passez en Expert pour un quota illimité.`,
          upgradeRequired: 'EXPERT',
        }
      }
    }
  }

  // ── Vérification SEPA activé globalement ────────────────────────────────
  if (feature === 'sepa_payment' && !env.SEPA_PAYMENTS_ENABLED) {
    return {
      allowed: false,
      reason: 'Paiement SEPA en cours d\'activation. Disponible très prochainement.',
    }
  }

  return { allowed: true }
}

// ─── Middleware Express ───────────────────────────────────────────────────────
export function requireFeature(feature: Feature) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const access = await checkFeatureAccess(userId, feature)

    if (!access.allowed) {
      return res.status(403).json({
        error: 'feature_not_available',
        message: access.reason,
        upgrade_required: access.upgradeRequired,
        upgrade_url: '/pricing',
      })
    }

    next()
  }
}

// ─── Incrémenter compteur usage IA ───────────────────────────────────────────
export async function trackAiUsage(userId: string, usageType: 'dossier_analysis' | 'assistant_message') {
  const now = new Date()
  await prisma.aiUsageTracking.upsert({
    where: {
      userId_usageType_periodMonth_periodYear: {
        userId,
        usageType,
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
      },
    },
    create: {
      userId,
      usageType,
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      usageCount: 1,
    },
    update: { usageCount: { increment: 1 } },
  })
}
