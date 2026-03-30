import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
  createCheckoutSession,
  createPortalSession,
  syncSubscriptionFromStripe,
} from '../services/stripe.service.js'
import { stripe } from '../lib/stripe.js'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'

const router = Router()

// ─── ROUTES AUTHENTIFIÉES ─────────────────────────────────────────────────────

// POST /stripe/checkout — démarre une souscription
router.post('/checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const { priceId } = req.body
    if (!priceId) return res.status(400).json({ error: 'priceId requis' })

    const session = await createCheckoutSession(
      req.user!.id,
      priceId,
      `${env.FRONTEND_URL}/dashboard?upgrade=success`,
      `${env.FRONTEND_URL}/pricing?upgrade=canceled`
    )

    return res.json({ url: session.url })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// POST /stripe/portal — accès au portail client Stripe
router.post('/portal', authenticate, async (req: Request, res: Response) => {
  try {
    const session = await createPortalSession(req.user!.id, `${env.FRONTEND_URL}/dashboard`)
    return res.json({ url: session.url })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// GET /stripe/subscription — abonnement courant
router.get('/subscription', authenticate, async (req: Request, res: Response) => {
  const sub = await prisma.subscription.findUnique({
    where: { userId: req.user!.id },
    select: {
      plan: true, status: true, currentPeriodEnd: true,
      cancelAtPeriodEnd: true, trialEndsAt: true, billingCycle: true,
    },
  })
  return res.json(sub ?? { plan: 'FREE', status: 'ACTIVE' })
})

export default router

// ─── WEBHOOK HANDLER (raw body — à monter AVANT express.json dans app.ts) ────

export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).send('Signature manquante')

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[Stripe webhook] Signature invalide:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscriptionFromStripe(event.data.object.id)
        break

      case 'customer.subscription.deleted':
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: event.data.object.id },
          data: { plan: 'FREE', status: 'CANCELED', stripeSubscriptionId: null },
        })
        break

      case 'invoice.payment_failed':
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: (event.data.object as any).customer as string },
          data: { status: 'PAST_DUE' },
        })
        break

      case 'invoice.payment_succeeded':
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: (event.data.object as any).customer as string },
          data: { status: 'ACTIVE' },
        })
        break

      default:
        break
    }
  } catch (err) {
    console.error('[Stripe webhook] Erreur traitement:', err)
    return res.status(500).send('Erreur interne')
  }

  return res.json({ received: true })
}
