/**
 * Stripe Connect Service — Paiements loyers entre locataires et propriétaires
 *
 * Architecture :
 * - Propriétaire → Stripe Express Account (KYC géré par Stripe, payout automatique)
 * - Locataire    → SetupIntent SEPA (mandat réutilisable chaque mois)
 * - Paiement     → Destination Charge (Bailio collecte + prélève commission + transfère au propriétaire)
 *
 * Flux mensuel :
 * 1. PaymentIntent(amount=loyer, application_fee=commission, transfer_data.destination=landlordAccountId)
 * 2. Stripe prélève via SEPA le locataire
 * 3. Stripe vire automatiquement (montant - commission) sur le compte bancaire du propriétaire
 * 4. Bailio garde application_fee comme revenu
 */

import { stripe } from '../lib/stripe.js'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import { calculatePlatformFee } from '../utils/feeCalculator.js'
import { PLANS } from '../lib/stripe.js'
import type { PlanType } from '../lib/stripe.js'

// ─── PROPRIÉTAIRE : Onboarding Stripe Connect Express ────────────────────────

export async function createConnectOnboardingLink(
  userId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) throw new Error('Stripe non configuré')

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true, stripeAccountId: true },
  })

  let accountId = user.stripeAccountId

  // Créer le compte si inexistant
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: user.email,
      // Propriétaire = particulier qui reçoit des loyers
      // On ne demande que "transfers" (recevoir des virements)
      // Pas sepa_debit_payments : les owners ne débitent pas directement → évite les questions "secteur d'activité"
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      // Pré-remplir les infos pour réduire les questions posées (style Vinted)
      individual: {
        email: user.email,
        first_name: user.firstName ?? undefined,
        last_name: user.lastName ?? undefined,
      },
      // Pas de business_profile.url ni product_description → évite les champs "site web" et "secteur"
      metadata: { userId },
      settings: {
        payouts: {
          schedule: { interval: 'weekly', weekly_anchor: 'monday' },
        },
      },
    })

    accountId = account.id

    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: accountId, stripeAccountStatus: 'pending' },
    })
  }

  // Créer le lien d'onboarding — uniquement les champs strictement requis (KYC identité + IBAN)
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
    collection_options: {
      fields: 'currently_due', // Seulement ce qui est obligatoire → pas de secteur d'activité
    },
  })

  return accountLink.url
}

// ─── PROPRIÉTAIRE : Statut du compte Connect ─────────────────────────────────

export async function getConnectAccountStatus(userId: string): Promise<{
  status: string
  accountId: string | null
  payoutsEnabled: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  requirements: string[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripeAccountStatus: true },
  })

  if (!user?.stripeAccountId) {
    return { status: 'not_created', accountId: null, payoutsEnabled: false, chargesEnabled: false, detailsSubmitted: false, requirements: [] }
  }

  if (!stripe) throw new Error('Stripe non configuré')

  const account = await stripe.accounts.retrieve(user.stripeAccountId)

  const newStatus = account.payouts_enabled && account.charges_enabled
    ? 'active'
    : account.details_submitted
    ? 'restricted'
    : 'pending'

  // Synchroniser le statut en base
  if (newStatus !== user.stripeAccountStatus) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountStatus: newStatus },
    })
  }

  return {
    status: newStatus,
    accountId: user.stripeAccountId,
    payoutsEnabled: account.payouts_enabled ?? false,
    chargesEnabled: account.charges_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    requirements: [
      ...(account.requirements?.currently_due ?? []),
      ...(account.requirements?.past_due ?? []),
    ],
  }
}

// ─── PROPRIÉTAIRE : Lien tableau de bord Stripe ──────────────────────────────

export async function createConnectDashboardLink(userId: string): Promise<string> {
  if (!stripe) throw new Error('Stripe non configuré')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  })

  if (!user?.stripeAccountId) throw new Error('Compte Stripe Connect non configuré')

  const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId)
  return loginLink.url
}

// ─── LOCATAIRE : Créer un SetupIntent SEPA ───────────────────────────────────

export async function createSepaSetupIntent(
  tenantId: string,
  contractId: string,
  landlordStripeAccountId: string
): Promise<{ clientSecret: string; setupIntentId: string }> {
  if (!stripe) throw new Error('Stripe non configuré')

  const tenant = await prisma.user.findUniqueOrThrow({
    where: { id: tenantId },
    select: { email: true, firstName: true, lastName: true },
  })

  // Créer ou récupérer le Customer Stripe du locataire
  const existingMandate = await prisma.sepaMandate.findUnique({
    where: { contractId },
    select: { stripeSetupIntentId: true, isActive: true },
  })

  if (existingMandate?.isActive) {
    throw new Error('Un mandat SEPA actif existe déjà pour ce contrat')
  }

  // Créer un Customer pour le locataire (nécessaire pour le SetupIntent)
  const customer = await stripe.customers.create({
    email: tenant.email,
    name: `${tenant.firstName} ${tenant.lastName}`.trim(),
    metadata: { tenantId, contractId },
  })

  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ['sepa_debit'],
    usage: 'off_session', // Pour prélèvements automatiques futurs
    metadata: { tenantId, contractId, landlordAccountId: landlordStripeAccountId },
  })

  // Créer/mettre à jour le mandat en base (inactif jusqu'à confirmation)
  await prisma.sepaMandate.upsert({
    where: { contractId },
    create: {
      contractId,
      tenantId,
      stripeSetupIntentId: setupIntent.id,
      isActive: false,
    },
    update: {
      stripeSetupIntentId: setupIntent.id,
      isActive: false,
      revokedAt: null,
    },
  })

  return {
    clientSecret: setupIntent.client_secret!,
    setupIntentId: setupIntent.id,
  }
}

// ─── LOCATAIRE : Confirmer le mandat après setup réussi ──────────────────────

export async function confirmSepaMandate(setupIntentId: string): Promise<void> {
  if (!stripe) throw new Error('Stripe non configuré')

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
    expand: ['payment_method', 'mandate'],
  })

  if (setupIntent.status !== 'succeeded') {
    throw new Error(`SetupIntent non confirmé (status: ${setupIntent.status})`)
  }

  const pm = setupIntent.payment_method as import('stripe').Stripe.PaymentMethod | null
  const sepaDetails = pm?.sepa_debit

  const contractId = setupIntent.metadata?.contractId
  if (!contractId) throw new Error('contractId manquant dans les metadata du SetupIntent')

  await prisma.sepaMandate.update({
    where: { contractId },
    data: {
      stripePaymentMethodId: pm?.id ?? null,
      stripeMandateId: typeof setupIntent.mandate === 'string'
        ? setupIntent.mandate
        : setupIntent.mandate?.id ?? null,
      ibanLast4: sepaDetails?.last4 ?? null,
      bankName: sepaDetails?.bank_code ?? null,
      holderName: pm?.billing_details?.name ?? null,
      isActive: true,
    },
  })
}

// ─── PAIEMENT : Déclencher un prélèvement loyer ──────────────────────────────

export async function collectRentPayment(rentPaymentId: string): Promise<void> {
  if (!stripe) throw new Error('Stripe non configuré')

  const rentPayment = await prisma.rentPayment.findUniqueOrThrow({
    where: { id: rentPaymentId },
    include: {
      contract: {
        include: {
          sepaMandate: true,
        },
      },
      landlord: {
        select: {
          stripeAccountId: true,
          stripeAccountStatus: true,
          subscription: { select: { plan: true } },
        },
      },
    },
  })

  const mandate = rentPayment.contract.sepaMandate
  if (!mandate?.isActive || !mandate.stripePaymentMethodId) {
    throw new Error('Pas de mandat SEPA actif pour ce contrat')
  }

  const landlordAccountId = rentPayment.landlord.stripeAccountId
  if (!landlordAccountId || rentPayment.landlord.stripeAccountStatus !== 'active') {
    throw new Error('Le propriétaire n\'a pas de compte Stripe Connect actif')
  }

  const plan = (rentPayment.landlord.subscription?.plan ?? 'PRO') as PlanType
  const sepaRateBps = PLANS[plan].sepaRateBps
  if (!sepaRateBps) throw new Error('Ce plan ne supporte pas SEPA')

  const fees = calculatePlatformFee(rentPayment.totalAmountCents, plan as 'PRO' | 'EXPERT')

  // PaymentIntent avec Destination Charge
  // → Bailio collecte le total, Stripe reverse (total - commission) au propriétaire
  const paymentIntent = await stripe.paymentIntents.create({
    amount: rentPayment.totalAmountCents,
    currency: 'eur',
    customer: undefined, // Le customer est attaché au payment method
    payment_method: mandate.stripePaymentMethodId,
    payment_method_types: ['sepa_debit'],
    confirm: true,
    off_session: true,
    mandate: mandate.stripeMandateId ?? undefined,
    // Destination charge → propriétaire reçoit net
    transfer_data: {
      destination: landlordAccountId,
      amount: fees.netToLandlordCents, // Ce que le propriétaire reçoit
    },
    application_fee_amount: fees.platformFeeCents, // Commission Bailio
    metadata: {
      rentPaymentId,
      contractId: rentPayment.contractId,
      landlordId: rentPayment.landlordId,
      tenantId: rentPayment.tenantId,
      periodMonth: rentPayment.periodMonth.toString(),
      periodYear: rentPayment.periodYear.toString(),
    },
    description: `Loyer ${rentPayment.periodMonth}/${rentPayment.periodYear} — contrat ${rentPayment.contractId.slice(-6)}`,
  })

  // Mettre à jour en base
  await prisma.rentPayment.update({
    where: { id: rentPaymentId },
    data: {
      status: paymentIntent.status === 'succeeded' ? 'SUCCEEDED' : 'PROCESSING',
      pspPaymentIntentId: paymentIntent.id,
      pspMandateId: mandate.stripeMandateId,
      platformFeeBps: fees.feeRateBps,
      platformFeeCents: fees.platformFeeCents,
      stripeCostCents: fees.stripeCostCents,
      netRevenueCents: fees.netRevenueCents,
      processedAt: paymentIntent.status === 'succeeded' ? new Date() : null,
    },
  })
}

// ─── WEBHOOK : Traiter les événements Connect ─────────────────────────────────

export async function handleConnectWebhookEvent(
  event: import('stripe').Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'setup_intent.succeeded': {
      const si = event.data.object as import('stripe').Stripe.SetupIntent
      await confirmSepaMandate(si.id)
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as import('stripe').Stripe.PaymentIntent
      const { rentPaymentId } = pi.metadata
      if (rentPaymentId) {
        await prisma.rentPayment.update({
          where: { id: rentPaymentId },
          data: { status: 'SUCCEEDED', processedAt: new Date() },
        })
        // Mettre à jour le paiement (Payment) correspondant comme PAID
        const rentPayment = await prisma.rentPayment.findUnique({
          where: { id: rentPaymentId },
          select: { contractId: true, periodMonth: true, periodYear: true },
        })
        if (rentPayment) {
          await prisma.payment.updateMany({
            where: {
              contractId: rentPayment.contractId,
              month: rentPayment.periodMonth,
              year: rentPayment.periodYear,
            },
            data: { status: 'PAID', paidDate: new Date() },
          })
        }
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as import('stripe').Stripe.PaymentIntent
      const { rentPaymentId } = pi.metadata
      if (rentPaymentId) {
        await prisma.rentPayment.update({
          where: { id: rentPaymentId },
          data: {
            status: 'FAILED',
            failureReason: pi.last_payment_error?.message ?? 'Paiement refusé',
            retryCount: { increment: 1 },
          },
        })
      }
      break
    }

    case 'account.updated': {
      const account = event.data.object as import('stripe').Stripe.Account
      const userId = account.metadata?.userId
      if (userId) {
        const newStatus = account.payouts_enabled && account.charges_enabled
          ? 'active'
          : account.details_submitted
          ? 'restricted'
          : 'pending'
        await prisma.user.updateMany({
          where: { stripeAccountId: account.id },
          data: { stripeAccountStatus: newStatus },
        })
      }
      break
    }
  }
}
