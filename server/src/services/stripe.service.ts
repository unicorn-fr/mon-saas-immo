import { stripe, PlanType } from '../lib/stripe.js'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'

// ─── CRÉER OU RÉCUPÉRER UN CUSTOMER STRIPE ──────────────────────────────────
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  if (!stripe) throw new Error('Stripe non configuré — STRIPE_SECRET_KEY manquante')

  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  })

  if (existing?.stripeCustomerId) return existing.stripeCustomerId

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    metadata: { userId },
  })

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: customer.id, plan: 'FREE' },
    update: { stripeCustomerId: customer.id },
  })

  return customer.id
}

// ─── CRÉER SESSION CHECKOUT ──────────────────────────────────────────────────
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) throw new Error('Stripe non configuré')
  const customerId = await getOrCreateStripeCustomer(userId)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId },
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    payment_method_types: ['card'],
    // TVA française automatique
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto' },
    locale: 'fr',
  })

  return session
}

// ─── CRÉER SESSION PORTAIL CLIENT ────────────────────────────────────────────
export async function createPortalSession(userId: string, returnUrl: string) {
  if (!stripe) throw new Error('Stripe non configuré')
  const customerId = await getOrCreateStripeCustomer(userId)

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// ─── SYNCHRONISER ABONNEMENT DEPUIS STRIPE ───────────────────────────────────
export async function syncSubscriptionFromStripe(stripeSubId: string) {
  if (!stripe) throw new Error('Stripe non configuré')
  const sub = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ['items.data.price'],
  })

  const priceId = sub.items.data[0]?.price.id
  const plan = mapPriceIdToPlan(priceId)
  const billingCycle = sub.items.data[0]?.price.recurring?.interval === 'year' ? 'ANNUAL' : 'MONTHLY'

  await prisma.subscription.updateMany({
    where: { stripeCustomerId: sub.customer as string },
    data: {
      stripeSubscriptionId: sub.id,
      plan,
      billingCycle,
      status: mapStripeStatus(sub.status),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    },
  })
}

// ─── ABONNEMENT COURANT (avec features du plan) ───────────────────────────────
export async function getUserSubscription(userId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
      billingCycle: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      trialEndsAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  })
  return sub ?? { plan: 'FREE' as PlanType, status: 'ACTIVE' as const }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function mapPriceIdToPlan(priceId: string | undefined): PlanType {
  if (!priceId) return 'FREE'
  const mapping: Record<string, PlanType> = {
    // Solo
    [env.STRIPE_SOLO_MONTHLY_PRICE_ID]: 'SOLO',
    [env.STRIPE_SOLO_ANNUAL_PRICE_ID]:  'SOLO',
    // Pro
    [env.STRIPE_PRO_MONTHLY_PRICE_ID]:  'PRO',
    [env.STRIPE_PRO_ANNUAL_PRICE_ID]:   'PRO',
    // Expert
    [env.STRIPE_EXPERT_MONTHLY_PRICE_ID]: 'EXPERT',
    [env.STRIPE_EXPERT_ANNUAL_PRICE_ID]:  'EXPERT',
  }
  // Filtrer les clés vides
  const filtered = Object.fromEntries(
    Object.entries(mapping).filter(([k]) => k && k.length > 0)
  )
  return filtered[priceId] ?? 'FREE'
}

export function mapStripeStatus(status: string): 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' {
  const mapping: Record<string, 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID'> = {
    trialing:           'TRIALING',
    active:             'ACTIVE',
    past_due:           'PAST_DUE',
    canceled:           'CANCELED',
    unpaid:             'UNPAID',
    incomplete:         'PAST_DUE',
    incomplete_expired: 'CANCELED',
    paused:             'ACTIVE',
  }
  return mapping[status] ?? 'ACTIVE'
}
