/**
 * Vérifie que toutes les variables d'environnement critiques sont présentes.
 * Appelé en tout premier au démarrage — plante intentionnellement en prod si une var manque.
 */
export function checkRequiredEnvVars() {
  const required: Record<string, string> = {
    // Base
    DATABASE_URL:   'URL de connexion PostgreSQL',
    JWT_SECRET:     'Clé secrète JWT (min 32 caractères)',
    FRONTEND_URL:   'URL du frontend (ex: https://bailio.fr)',

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: 'Nom du cloud Cloudinary',
    CLOUDINARY_API_KEY:    'Clé API Cloudinary',
    CLOUDINARY_API_SECRET: 'Secret API Cloudinary',

    // Stripe
    STRIPE_SECRET_KEY:            'Clé secrète Stripe (sk_live_... ou sk_test_...)',
    STRIPE_WEBHOOK_SECRET:        'Secret webhook Stripe (whsec_...)',
    STRIPE_PRO_MONTHLY_PRICE_ID:  'Price ID Stripe pour Pro mensuel',
    STRIPE_PRO_ANNUAL_PRICE_ID:   'Price ID Stripe pour Pro annuel',
    STRIPE_EXPERT_MONTHLY_PRICE_ID: 'Price ID Stripe pour Expert mensuel',
    STRIPE_EXPERT_ANNUAL_PRICE_ID:  'Price ID Stripe pour Expert annuel',

    // Email
    SMTP_HOST: 'Hôte SMTP pour les emails',
    EMAIL_FROM: 'Adresse email expéditeur',
  }

  const missing: string[] = []

  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key]) {
      missing.push(`  MISSING: ${key} - ${description}`)
    }
  }

  if (missing.length > 0) {
    console.error('\n[env] Missing environment variables:')
    console.error(missing.join('\n'))
    console.error('\nConfigurer ces variables avant de démarrer en production.\n')

    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    } else {
      console.warn('[env] Development mode - starting anyway\n')
    }
  } else {
    console.log('[env] All environment variables configured')
  }
}
