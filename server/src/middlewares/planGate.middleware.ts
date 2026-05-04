import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database.js'
import { PLANS, PLAN_ORDER, PlanType } from '../lib/stripe.js'

/**
 * Middleware — vérifie que l'utilisateur a au minimum le plan requis.
 * Usage : router.post('/sign', authenticate, requirePlan('PRO'), signContract)
 */
export function requirePlan(minPlan: 'SOLO' | 'PRO' | 'EXPERT') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
      select: { plan: true, status: true },
    })

    const currentPlan = (sub?.plan ?? 'FREE') as PlanType
    const isActive = !sub || ['ACTIVE', 'TRIALING'].includes(sub.status)

    if (!isActive || PLAN_ORDER[currentPlan] < PLAN_ORDER[minPlan]) {
      return res.status(403).json({
        error: 'PLAN_REQUIRED',
        currentPlan,
        requiredPlan: minPlan,
        upgradeUrl: '/pricing',
      })
    }

    next()
  }
}

/**
 * Middleware — vérifie que le propriétaire n'a pas atteint sa limite de biens.
 * Usage : router.post('/', authenticate, checkPropertyLimit, createProperty)
 */
export async function checkPropertyLimit(req: Request, res: Response, next: NextFunction) {
  const sub = await prisma.subscription.findUnique({
    where: { userId: req.user!.id },
    select: { plan: true },
  })

  const plan = (sub?.plan ?? 'FREE') as PlanType
  const maxProperties = PLANS[plan].maxProperties

  if (maxProperties !== Infinity) {
    const currentCount = await prisma.property.count({
      where: { ownerId: req.user!.id },
    })

    if (currentCount >= maxProperties) {
      const upgradeRequired = plan === 'FREE' ? 'SOLO' : plan === 'SOLO' ? 'PRO' : 'EXPERT'
      return res.status(403).json({
        error: 'PROPERTY_LIMIT_REACHED',
        currentCount,
        maxAllowed: maxProperties,
        requiredPlan: upgradeRequired,
        upgradeUrl: '/pricing',
      })
    }
  }

  next()
}
