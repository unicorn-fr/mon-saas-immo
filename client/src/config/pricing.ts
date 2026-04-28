// ─── Configuration centralisée des plans Bailio ──────────────────────────────
// Les price IDs Stripe sont des identifiants publics — pas de sécurité à protéger.
// Modifier les VITE_ vars dans client/.env pour pointer vers tes vrais produits Stripe.

export interface PlanFeature {
  label: string
  available: boolean
}

export interface Plan {
  id: 'essentiel' | 'starter' | 'pro'
  name: string
  badge?: string
  highlight: boolean
  monthlyPrice: number | null   // null = gratuit
  annualPrice: number | null    // prix annuel total
  annualMonthlyEquiv: number | null  // prix mensualisé si annuel
  trialDays: number | null
  propertyLimit: string
  priceIds: {
    monthly: string
    annual: string
  } | null
  features: string[]
  cta: string
  ctaLink?: string
}

export const PLANS: Plan[] = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    highlight: false,
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyEquiv: 0,
    trialDays: null,
    propertyLimit: '1 bien',
    priceIds: null,
    features: [
      '1 bien publié',
      'Quittances & avis d\'échéance',
      'Gestion d\'un locataire',
      'Accès lecture documents',
      '1 bail par an (PDF)',
    ],
    cta: 'Commencer gratuitement',
    ctaLink: '/register',
  },
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Le plus populaire',
    highlight: true,
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    annualMonthlyEquiv: 8.33,
    trialDays: 14,
    propertyLimit: 'Jusqu\'à 3 biens',
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID ?? '',
    },
    features: [
      'Jusqu\'à 3 biens gérés',
      'Quittances automatiques illimitées',
      'Signature électronique (5 actes/mois)',
      'Suivi des loyers & relances automatiques',
      'État des lieux numérique',
      'Tableau de bord & analytics',
      'Support email (réponse sous 72h)',
    ],
    cta: 'Démarrer l\'essai gratuit',
  },
  {
    id: 'pro',
    name: 'Pro',
    highlight: false,
    monthlyPrice: 19.99,
    annualPrice: 199,
    annualMonthlyEquiv: 16.58,
    trialDays: 14,
    propertyLimit: 'Biens illimités',
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
      annual:  import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
    },
    features: [
      'Biens illimités',
      'Signature électronique illimitée',
      'Vérification IA dossiers locataires',
      'Export comptable annuel',
      'Multi-utilisateurs (2 accès)',
      'Analytics avancés',
      'API Bailio (lecture + écriture)',
      'Support prioritaire (réponse sous 24h)',
    ],
    cta: 'Démarrer l\'essai gratuit',
  },
]

export const FAQ_ITEMS = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Le changement est immédiat et calculé au pro-rata de la période en cours. Tu passes à un plan supérieur ou inférieur sans friction depuis ton espace compte.',
  },
  {
    q: 'Est-ce que je peux annuler à tout moment ?',
    a: 'Oui, sans engagement. L\'annulation se fait en un clic depuis ton espace compte. Tu conserves ton accès jusqu\'à la fin de la période payée, puis ton compte repasse automatiquement en Essentiel (gratuit).',
  },
  {
    q: 'La TVA est-elle incluse dans les prix affichés ?',
    a: 'Non. Les prix sont affichés HT (hors taxes). La TVA française à 20 % est ajoutée à la facturation selon les règles en vigueur.',
  },
  {
    q: 'Que se passe-t-il après les 14 jours d\'essai ?',
    a: 'Si tu n\'as pas ajouté de moyen de paiement avant la fin de l\'essai, ton compte repasse automatiquement en plan Essentiel (gratuit). Aucun prélèvement n\'est effectué sans ton accord.',
  },
  {
    q: 'L\'essai gratuit nécessite-t-il une carte bancaire ?',
    a: 'Non. L\'essai de 14 jours démarre sans CB. On te demande un moyen de paiement uniquement si tu souhaites continuer après la période d\'essai.',
  },
]
