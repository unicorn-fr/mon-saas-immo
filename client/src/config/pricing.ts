// ─── Configuration centralisée des plans Bailio ──────────────────────────────
// 4 plans : FREE · SOLO 4,90€ · PRO 9,90€ · EXPERT 24,90€

export type PlanId = 'free' | 'solo' | 'pro' | 'expert'

export interface PlanFeatureRow {
  label: string
  free: boolean | string
  solo: boolean | string
  pro: boolean | string
  expert: boolean | string
  tooltip?: string
  section?: string
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
  color: string // accent couleur du plan
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
    color: '#9e9b96',
    description: 'Publiez un bien et recevez des candidatures, sans frais.',
    features: [
      '1 bien publié',
      'Annonce visible sur la plateforme',
      'Messagerie pour les visites',
      'Gestion des candidatures',
      'Dossier locatif des candidats',
    ],
    cta: 'Commencer gratuitement',
    ctaStyle: 'ghost',
  },
  {
    id: 'solo',
    name: 'Solo',
    highlight: false,
    monthlyPrice: 4.90,
    annualPrice: 47,
    annualMonthlyEquiv: 3.92,
    trialDays: 14,
    propertyLimit: 3,
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_SOLO_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_SOLO_ANNUAL_PRICE_ID ?? '',
    },
    color: '#5a5754',
    description: 'Le bailleur accidentel. Gérez 3 biens avec les essentiels.',
    features: [
      '3 biens publiés',
      'Rédaction bail conforme loi ALUR',
      'Quittances automatiques',
      'État des lieux guidé',
      'Calculateur de rentabilité',
    ],
    cta: 'Commencer avec Solo',
    ctaStyle: 'secondary',
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Recommandé',
    highlight: true,
    monthlyPrice: 9.90,
    annualPrice: 95,
    annualMonthlyEquiv: 7.92,
    trialDays: 14,
    propertyLimit: 10,
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
    },
    color: '#c4976a',
    description: 'Le propriétaire actif. Tout inclus pour gérer jusqu\'à 10 biens.',
    features: [
      '10 biens publiés',
      'Signature électronique (eIDAS)',
      'Analyse IA des dossiers locataires',
      'Relances automatiques (email)',
      'Rapport fiscal auto',
      'Support prioritaire',
    ],
    cta: 'Essayer Pro 14 jours',
    ctaStyle: 'primary',
  },
  {
    id: 'expert',
    name: 'Expert',
    highlight: false,
    monthlyPrice: 24.90,
    annualPrice: 239,
    annualMonthlyEquiv: 19.92,
    trialDays: 14,
    propertyLimit: null,
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_EXPERT_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_EXPERT_ANNUAL_PRICE_ID ?? '',
    },
    color: '#1a3270',
    description: 'Le multi-bailleur. Biens illimités et outils avancés.',
    features: [
      'Biens illimités',
      'Export comptable avancé',
      'Multi-entités / SCI',
      'Accès API',
      'Support dédié (SLA 4h)',
    ],
    cta: 'Commencer avec Expert',
    ctaStyle: 'secondary',
  },
]

export const FEATURE_TABLE: PlanFeatureRow[] = [
  // Annonces
  { label: 'Biens publiés',           free: '1',  solo: '3',    pro: '10',        expert: 'Illimité', section: 'Annonces & Gestion' },
  { label: 'Mise en ligne annonce',   free: true, solo: true,   pro: true,        expert: true },
  { label: 'Messagerie propriétaire', free: true, solo: true,   pro: true,        expert: true },
  { label: 'Gestion candidatures',    free: true, solo: true,   pro: true,        expert: true },
  { label: 'Dossier locatif IA',      free: true, solo: true,   pro: true,        expert: true },
  // Contrats & juridique
  { label: 'Rédaction bail ALUR',             free: false, solo: true,  pro: true, expert: true, section: 'Contrats & Juridique' },
  { label: 'Signature électronique (eIDAS)',  free: false, solo: false, pro: true, expert: true, tooltip: 'Via Yousign, valeur légale identique à la signature manuscrite' },
  { label: 'État des lieux guidé',            free: false, solo: true,  pro: true, expert: true },
  // Paiements & Finance
  { label: 'Quittances automatiques',  free: false, solo: true,  pro: true, expert: true, section: 'Paiements & Finance' },
  { label: 'Relances automatiques',    free: false, solo: false, pro: true, expert: true },
  { label: 'Calculateur rentabilité',  free: false, solo: true,  pro: true, expert: true },
  { label: 'Rapport fiscal auto',      free: false, solo: false, pro: true, expert: true },
  { label: 'Export comptable',         free: false, solo: false, pro: false, expert: true, tooltip: 'Export CSV/PDF compatible Sage, EBP, FEC' },
  // IA & Analytics
  { label: 'Analyse IA dossiers locataires', free: false, solo: false, pro: true, expert: true, section: 'IA & Analytics' },
  { label: 'Analytics & rentabilité',        free: false, solo: true,  pro: true, expert: true },
  { label: 'Score candidat automatique',     free: false, solo: false, pro: true, expert: true },
  // Pro & API
  { label: 'Multi-entités / SCI',  free: false, solo: false, pro: false, expert: true, section: 'Avancé' },
  { label: 'Accès API',            free: false, solo: false, pro: false, expert: true },
  { label: 'Support',              free: 'Email', solo: 'Email', pro: 'Prioritaire', expert: 'Dédié SLA 4h' },
]

export const FAQ_ITEMS = [
  {
    q: 'Quelle différence entre Solo, Pro et Expert ?',
    a: 'Solo est pour les propriétaires qui gèrent 1 à 3 biens et ont besoin de l\'essentiel (bail, quittances, EDL). Pro ajoute la signature électronique légale, l\'analyse IA des dossiers et les relances automatiques — idéal pour 1 à 10 biens. Expert est pour les multi-bailleurs (SCI, portefeuille > 10 biens) qui ont besoin d\'un export comptable, d\'une API et d\'un support dédié.',
  },
  {
    q: 'Le plan gratuit est-il vraiment gratuit ?',
    a: 'Oui, sans limitation de durée. Vous publiez 1 bien, recevez des candidatures et consultez les dossiers locataires gratuitement. La rédaction des baux, les signatures et les quittances sont réservées aux plans payants.',
  },
  {
    q: 'L\'essai de 14 jours nécessite-t-il une carte bancaire ?',
    a: 'Non. L\'essai démarre sans CB. Nous demandons un moyen de paiement uniquement si vous continuez après l\'essai.',
  },
  {
    q: 'Comment fonctionne le paiement des loyers ?',
    a: 'Les loyers sont versés directement entre locataire et propriétaire (virement bancaire). Bailio gère le suivi des paiements et génère les quittances automatiquement — sans jamais toucher aux fonds.',
  },
  {
    q: 'Puis-je changer de plan en cours d\'abonnement ?',
    a: 'Oui, à tout moment. La montée de plan est effective immédiatement avec prorata. La descente prend effet à la prochaine date de renouvellement.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement. Vous conservez l\'accès jusqu\'à la fin de la période payée, puis votre compte repasse automatiquement en Gratuit.',
  },
  {
    q: 'La TVA est-elle incluse dans les prix ?',
    a: 'Non. Les prix sont affichés HT. La TVA française à 20 % est appliquée à la facturation.',
  },
]
