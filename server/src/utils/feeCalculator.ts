/**
 * Calculateur de frais SEPA — Bailio
 *
 * RÈGLE CRITIQUE : Uniquement SEPA pour les paiements de loyer.
 * - Stripe SEPA = 0,35% + 0,10€ PLAFONNÉ à 5,00€ → toujours profitable
 * - Stripe CB   = 1,5% + 0,25€ sans plafond      → perte garantie à nos taux
 * Ne jamais activer CARD_PAYMENTS_ENABLED pour les loyers.
 */

const STRIPE_SEPA_RATE = 0.0035  // 0,35%
const STRIPE_SEPA_FIXED = 10     // 0,10€ en centimes
const STRIPE_SEPA_CAP = 500      // 5,00€ en centimes (LE plafond qui nous sauve)

// Taux par plan
const PLATFORM_FEE_BPS: Record<'PRO' | 'EXPERT', number> = {
  PRO:    80, // 0,8%
  EXPERT: 60, // 0,6%
}

export function calculateStripeSepaCost(amountCents: number): number {
  const rawCost = Math.round(amountCents * STRIPE_SEPA_RATE) + STRIPE_SEPA_FIXED
  return Math.min(rawCost, STRIPE_SEPA_CAP)
}

export interface FeeBreakdown {
  rentAmountCents: number
  feeRateBps: number
  platformFeeCents: number    // Ce que Bailio perçoit (brut)
  stripeCostCents: number     // Ce que Stripe prélève
  netRevenueCents: number     // Marge nette Bailio
  netToLandlordCents: number  // Ce que le propriétaire reçoit
  isProfit: boolean
}

export function calculatePlatformFee(
  amountCents: number,
  planId: 'PRO' | 'EXPERT'
): FeeBreakdown {
  const feeRateBps = PLATFORM_FEE_BPS[planId]
  const platformFeeCents = Math.round(amountCents * feeRateBps / 10000)
  const stripeCostCents = calculateStripeSepaCost(amountCents)
  const netRevenueCents = platformFeeCents - stripeCostCents
  const netToLandlordCents = amountCents - platformFeeCents

  return {
    rentAmountCents: amountCents,
    feeRateBps,
    platformFeeCents,
    stripeCostCents,
    netRevenueCents,
    netToLandlordCents,
    isProfit: netRevenueCents > 0,
  }
}

/**
 * Point mort : loyer minimum pour être rentable
 *
 * Pro  : ~38€ minimum (en pratique, tout loyer SEPA réaliste est rentable)
 * Expert: ~45€ minimum
 */
export function breakEvenRent(planId: 'PRO' | 'EXPERT'): number {
  const feeRateBps = PLATFORM_FEE_BPS[planId]
  // platformFee = amount * rate; stripeCost = amount * 0.35% + 10¢
  // Profit quand: amount * rate > amount * 0.35% + 10¢
  // ⟹ amount * (rate - 0.35%) > 10¢
  // ⟹ amount > 10¢ / (rate - 0.35%)
  const rateDiff = (feeRateBps - 35) / 10000
  if (rateDiff <= 0) return Infinity
  return Math.ceil(STRIPE_SEPA_FIXED / rateDiff)
}

/*
  Exemples vérifiés (pour tests) :

  Pro  — 700€  : { platformFee: 5.60€, stripeCost: 2.55€, net: 3.05€ } ✓
  Pro  — 1500€ : { platformFee: 12.00€, stripeCost: 5.00€, net: 7.00€ } ✓ (cap!)
  Pro  — 4000€ : { platformFee: 32.00€, stripeCost: 5.00€, net: 27.00€ } ✓ (très profitable)
  Expert — 700€: { platformFee: 4.20€, stripeCost: 2.55€, net: 1.65€ } ✓
*/
