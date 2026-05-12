// ─── Configuration centralisée des plans Bailio ──────────────────────────────
// 2 plans : Gratuit (listing) · Pro 9,90€ (tout inclus)

export type PlanId = 'free' | 'pro'

export interface PlanFeatureRow {
  label: string
  free: boolean | string
  pro: boolean | string
  tooltip?: string
}

export interface Plan {
  id: PlanId
  name: string
  badge?: string
  highlight: boolean
  monthlyPrice: number
  annualPrice: number
  annualMonthlyEquiv: number
  trialDays: number | null
  propertyLimit: number | null  // null = illimité
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
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyEquiv: 0,
    trialDays: null,
    propertyLimit: 1,
    priceIds: null,
    description: 'Mettez votre bien en ligne gratuitement et recevez des candidatures.',
    features: [
      '1 bien publié',
      'Annonce visible sur la plateforme',
      'Messagerie pour les visites',
      'Gestion des candidatures',
    ],
    cta: 'Commencer gratuitement',
    ctaStyle: 'ghost',
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Tout inclus',
    highlight: true,
    monthlyPrice: 9.90,
    annualPrice: 99,
    annualMonthlyEquiv: 8.25,
    trialDays: 14,
    propertyLimit: null,
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
    },
    description: 'Gérez tout en ligne : bail, signature, quittances, dossiers locataires.',
    features: [
      'Biens illimités',
      'Rédaction bail conforme loi ALUR',
      'Signature électronique (eIDAS)',
      'Quittances automatiques',
      'Relances automatiques (email)',
      'Analyse IA des dossiers locataires',
      'Analytics & rentabilité',
      'Rapport fiscal auto',
      'État des lieux guidé',
      'Support prioritaire',
    ],
    cta: 'Commencer avec Pro',
    ctaStyle: 'primary',
  },
]

export const FEATURE_TABLE: PlanFeatureRow[] = [
  { label: 'Biens publiés', free: '1', pro: 'Illimité' },
  { label: 'Mise en ligne annonce', free: true, pro: true },
  { label: 'Messagerie propriétaire', free: true, pro: true },
  { label: 'Gestion candidatures', free: true, pro: true },
  { label: 'Rédaction bail ALUR', free: false, pro: true },
  { label: 'Signature électronique (eIDAS)', free: false, pro: true },
  { label: 'Quittances automatiques', free: false, pro: true },
  { label: 'Relances automatiques', free: false, pro: true },
  { label: 'Analyse IA — dossiers locataires', free: false, pro: true },
  { label: 'Analytics & rentabilité', free: false, pro: true },
  { label: 'Rapport fiscal auto', free: false, pro: true },
  { label: 'État des lieux guidé', free: false, pro: true },
  { label: 'Support prioritaire', free: false, pro: true },
]

export const FAQ_ITEMS = [
  {
    q: 'Le plan gratuit est-il vraiment gratuit ?',
    a: 'Oui, sans limitation de durée. Vous pouvez publier 1 bien, recevoir des visites et des candidatures gratuitement. Pour rédiger les baux, signer électroniquement et envoyer les quittances, passez au Pro.',
  },
  {
    q: 'L\'essai Pro nécessite-t-il une carte bancaire ?',
    a: 'Non. L\'essai de 14 jours démarre sans CB. Nous demandons un moyen de paiement uniquement si vous continuez après l\'essai.',
  },
  {
    q: 'Combien de biens puis-je gérer avec le Pro ?',
    a: 'Illimité. Que vous ayez 1 ou 50 biens, le tarif reste le même : 9,90 € HT/mois.',
  },
  {
    q: 'Comment fonctionne le paiement des loyers ?',
    a: 'Les loyers sont versés directement entre locataire et propriétaire (virement bancaire, chèque…), selon les modalités convenues dans le bail. Bailio gère le suivi des paiements et génère les quittances automatiquement.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement. Vous conservez l\'accès Pro jusqu\'à la fin de la période payée, puis votre compte repasse automatiquement en Gratuit.',
  },
  {
    q: 'La TVA est-elle incluse dans les prix ?',
    a: 'Non. Les prix sont affichés HT. La TVA française à 20% est appliquée à la facturation.',
  },
]
