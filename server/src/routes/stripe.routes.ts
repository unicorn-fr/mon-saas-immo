import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
  createCheckoutSession,
  createPortalSession,
  syncSubscriptionFromStripe,
  mapStripeStatus,
} from '../services/stripe.service.js'
import { stripe } from '../lib/stripe.js'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'

const router = Router()

// ─── ROUTES AUTHENTIFIÉES ─────────────────────────────────────────────────────

// POST /stripe/checkout — démarre une souscription
router.post('/checkout', authenticate, async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })
    const { priceId } = req.body
    if (!priceId) return res.status(400).json({ error: 'priceId requis' })

    const session = await createCheckoutSession(
      req.user!.id,
      priceId,
      `${env.FRONTEND_URL}/dashboard?upgrade=success`,
      `${env.FRONTEND_URL}/pricing?upgrade=canceled`
    )

    return res.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ error: msg })
  }
})

// POST /stripe/portal — accès au portail client Stripe
router.post('/portal', authenticate, async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })
    const session = await createPortalSession(req.user!.id, `${env.FRONTEND_URL}/dashboard`)
    return res.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ error: msg })
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

// POST /stripe/identity-verify — démarre une session de vérification d'identité
router.post('/identity-verify', authenticate, async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })

    const userId = req.user!.id

    // Créer une VerificationSession Stripe Identity
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: { userId },
      options: {
        document: {
          allowed_types: ['driving_license', 'id_card', 'passport'],
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
    })

    // Sauvegarder l'ID de session
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeIdentitySessionId: session.id,
        stripeIdentityStatus: 'requires_input',
      },
    })

    return res.json({ clientSecret: session.client_secret, sessionId: session.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    console.error('[Stripe Identity]', msg)
    return res.status(500).json({ error: msg })
  }
})

// GET /stripe/identity-status — statut de vérification d'identité
router.get('/identity-status', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { stripeIdentityStatus: true, stripeIdentitySessionId: true, isVerifiedOwner: true },
    })
    return res.json({
      status: user?.stripeIdentityStatus ?? null,
      isVerified: user?.isVerifiedOwner ?? false,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ error: msg })
  }
})

export default router

// ─── WEBHOOK HANDLER (raw body — monté AVANT express.json dans app.ts) ────────

export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!stripe) return res.status(503).json({ error: 'Stripe non configuré' })

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).send('Signature manquante')

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Signature invalide'
    console.error('[Stripe webhook] Signature invalide:', msg)
    return res.status(400).send(`Webhook Error: ${msg}`)
  }

  // ── Idempotence : ignorer les événements déjà traités ──────────────────────
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
    select: { processed: true },
  })
  if (existingEvent?.processed) {
    return res.json({ received: true, skipped: 'already_processed' })
  }

  // Enregistrer l'événement (upsert au cas où il y aurait une race condition)
  await prisma.stripeEvent.upsert({
    where: { id: event.id },
    create: { id: event.id, type: event.type, payload: event as object },
    update: {},
  })

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

      case 'invoice.payment_failed': {
        const invoice = event.data.object as { customer: string; customer_email?: string }
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: invoice.customer },
          data: { status: 'PAST_DUE' },
        })
        console.log(`[Stripe] Paiement échoué — customer=${invoice.customer}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as { customer: string }
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: invoice.customer },
          data: { status: 'ACTIVE' },
        })
        break
      }

      case 'identity.verification_session.verified': {
        const vs = event.data.object as { id: string; metadata?: { userId?: string } }
        const userId = vs.metadata?.userId
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeIdentityStatus: 'verified',
              isVerifiedOwner: true,
            },
          })
          console.log(`[Stripe Identity] Vérifié: userId=${userId}`)
        }
        break
      }

      case 'identity.verification_session.canceled': {
        const vs = event.data.object as { id: string; metadata?: { userId?: string } }
        const userId = vs.metadata?.userId
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeIdentityStatus: 'canceled' },
          })
        }
        break
      }

      case 'identity.verification_session.requires_input': {
        const vs = event.data.object as { id: string; metadata?: { userId?: string } }
        const userId = vs.metadata?.userId
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeIdentityStatus: 'requires_input' },
          })
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as {
          mode: string
          subscription?: string
          customer?: string
          metadata?: { userId?: string }
        }
        if (session.mode === 'subscription' && session.subscription) {
          await syncSubscriptionFromStripe(session.subscription)
        }
        break
      }

      default:
        break
    }

    // Marquer comme traité
    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: { processed: true, processedAt: new Date() },
    })

    return res.json({ received: true })
  } catch (err) {
    console.error('[Stripe webhook] Erreur traitement:', err)
    return res.status(500).send('Erreur interne')
  }
}
