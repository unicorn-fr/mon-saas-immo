// ─── Configuration centralisée des plans Bailio ──────────────────────────────
// Décoy pricing : Free → Solo (atténué) → Pro (dominant) → Expert

export type PlanId = 'free' | 'solo' | 'pro' | 'expert'

export interface PlanFeatureRow {
  label: string
  free: boolean | string
  solo: boolean | string
  pro: boolean | string
  expert: boolean | string
  tooltip?: string
}

export interface Plan {
  id: PlanId
  name: string
  badge?: string          // Ex: "Meilleur rapport qualité/prix" → Pro seulement
  highlight: boolean      // true = bordure verte + ombre forte
  dimmed: boolean         // true = style atténué (Solo)
  monthlyPrice: number    // 0 = gratuit
  annualPrice: number     // Prix total annuel (12 mois)
  annualMonthlyEquiv: number  // annualPrice / 12
  trialDays: number | null
  propertyLimit: number | null  // null = illimité
  sepaRatePct: string | null    // "0,8%" ou null
  priceIds: { monthly: string; annual: string } | null
  features: string[]
  cta: string
  ctaStyle: 'primary' | 'secondary' | 'ghost'
  description: string
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    highlight: false,
    dimmed: false,
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyEquiv: 0,
    trialDays: null,
    propertyLimit: 1,
    sepaRatePct: null,
    priceIds: null,
    description: 'Pour découvrir Bailio et gérer votre premier bien.',
    features: [
      '1 bien publié',
      'Quittances manuelles',
      'Bail PDF généré automatiquement',
      'Messagerie intégrée',
      'Assistant IA (chat)',
    ],
    cta: 'Commencer gratuitement',
    ctaStyle: 'ghost',
  },
  {
    id: 'solo',
    name: 'Solo',
    highlight: false,
    dimmed: true, // Intentionnellement atténué — effet décoy vers Pro
    monthlyPrice: 4.90,
    annualPrice: 49,
    annualMonthlyEquiv: 4.08,
    trialDays: 14,
    propertyLimit: 1,
    sepaRatePct: null,
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_SOLO_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_SOLO_ANNUAL_PRICE_ID ?? '',
    },
    description: 'Automatisez les basiques pour votre bien unique.',
    features: [
      '1 bien publié',
      'Quittances automatiques',
      '1 signature électronique / an',
      'Relances automatiques',
      'Assistant IA (chat)',
    ],
    cta: 'Choisir Solo',
    ctaStyle: 'secondary',
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Meilleur rapport qualité/prix',
    highlight: true,
    dimmed: false,
    monthlyPrice: 9.90,
    annualPrice: 99,
    annualMonthlyEquiv: 8.25,
    trialDays: 14,
    propertyLimit: 5,
    sepaRatePct: '0,8%',
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
    },
    description: 'Tout ce qu\'il faut pour gérer jusqu\'à 5 biens en autonomie complète.',
    features: [
      'Jusqu\'à 5 biens gérés',
      'Quittances automatiques illimitées',
      'Signature électronique illimitée',
      'Relances automatiques (email)',
      'Paiement loyers SEPA automatique',
      'Analyse IA dossiers (10/mois)',
      'Analytics & rapport fiscal',
      'Encadrement des loyers (zones tendues)',
    ],
    cta: 'Commencer avec Pro',
    ctaStyle: 'primary',
  },
  {
    id: 'expert',
    name: 'Expert',
    highlight: false,
    dimmed: false,
    monthlyPrice: 24.90,
    annualPrice: 249,
    annualMonthlyEquiv: 20.75,
    trialDays: 14,
    propertyLimit: null,
    sepaRatePct: '0,6%',
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_EXPERT_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_EXPERT_ANNUAL_PRICE_ID ?? '',
    },
    description: 'Pour les patrimoines ambitieux, les SCI et les gestionnaires.',
    features: [
      'Biens illimités',
      'SEPA automatique (0,6% — taux réduit)',
      'Analyse IA dossiers illimitée',
      'Multi-entités (SCI, SARL de famille)',
      'Export comptable avancé',
      'Accès API Bailio',
      'Support prioritaire (réponse 24h)',
      'Onboarding dédié',
    ],
    cta: 'Choisir Expert',
    ctaStyle: 'secondary',
  },
]

export const FEATURE_TABLE: PlanFeatureRow[] = [
  { label: 'Biens gérés', free: '1', solo: '1', pro: '5', expert: 'Illimité' },
  { label: 'Quittances auto', free: false, solo: true, pro: true, expert: true },
  { label: 'Signature électronique', free: false, solo: '1/an', pro: 'Illimité', expert: 'Illimité' },
  { label: 'Relances automatiques', free: false, solo: true, pro: true, expert: true },
  { label: 'SEPA — paiement loyers auto', free: false, solo: false, pro: '0,8%', expert: '0,6%', tooltip: 'Prélèvement automatique du loyer. Stripe SEPA plafonne à 5€ de frais pour protéger votre marge.' },
  { label: 'Analyse IA — dossiers locataires', free: false, solo: false, pro: '10/mois', expert: 'Illimité' },
  { label: 'Assistant IA (chat)', free: true, solo: true, pro: true, expert: true },
  { label: 'Analytics & rentabilité', free: false, solo: false, pro: true, expert: true },
  { label: 'Rapport fiscal auto', free: false, solo: false, pro: true, expert: true },
  { label: 'Encadrement des loyers', free: false, solo: false, pro: true, expert: true },
  { label: 'Multi-entités (SCI, SARL)', free: false, solo: false, pro: false, expert: true },
  { label: 'Export comptable', free: false, solo: false, pro: 'Basique', expert: 'Avancé' },
  { label: 'Accès API', free: false, solo: false, pro: false, expert: true },
  { label: 'Support prioritaire', free: false, solo: false, pro: false, expert: true },
]

export const FAQ_ITEMS = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Le changement est immédiat et calculé au pro-rata. Upgrade ou downgrade en un clic depuis votre espace compte.',
  },
  {
    q: 'L\'essai gratuit nécessite-t-il une carte bancaire ?',
    a: 'Non. L\'essai de 14 jours démarre sans CB pour les plans Solo, Pro et Expert. Nous demandons un moyen de paiement uniquement si vous continuez après l\'essai.',
  },
  {
    q: 'Que se passe-t-il si je dépasse la limite de biens ?',
    a: 'Vous ne pouvez pas publier de nouveau bien — mais vos biens existants restent actifs. Upgrade en un clic pour débloquer la limite.',
  },
  {
    q: 'Comment fonctionne le paiement SEPA des loyers ?',
    a: 'Le locataire enregistre une fois son IBAN. Bailio prélève automatiquement le loyer chaque mois et reverse au propriétaire, déduction faite des frais Bailio (0,8% Pro, 0,6% Expert). Stripe SEPA plafonne à 5€ de frais bancaires — votre marge est garantie sur tout loyer.',
  },
  {
    q: 'La TVA est-elle incluse dans les prix ?',
    a: 'Non. Les prix sont affichés HT. La TVA française à 20% est appliquée à la facturation.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement. Vous conservez l\'accès jusqu\'à la fin de la période payée, puis votre compte repasse automatiquement en Gratuit.',
  },
]
