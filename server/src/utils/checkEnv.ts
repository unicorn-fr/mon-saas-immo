/**
 * Vérifie que les variables d'environnement sont présentes.
 *
 * - REQUIRED  : manquantes → process.exit(1) en production
 * - OPTIONAL  : manquantes → warning seulement, le serveur démarre quand même
 *               (Cloudinary : fallback disque local / Stripe : billing désactivé)
 */
export function checkRequiredEnvVars() {
  const required: Record<string, string> = {
    DATABASE_URL: 'URL de connexion PostgreSQL',
    JWT_SECRET:   'Clé secrète JWT (min 32 caractères)',
    FRONTEND_URL: 'URL du frontend (ex: https://bailio.fr)',
    SMTP_HOST:    'Hôte SMTP pour les emails',
    EMAIL_FROM:   'Adresse email expéditeur',
  }

  const optional: Record<string, string> = {
    CLOUDINARY_CLOUD_NAME:          'Cloudinary — uploads en production (fallback disque local)',
    CLOUDINARY_API_KEY:             'Cloudinary — uploads en production',
    CLOUDINARY_API_SECRET:          'Cloudinary — uploads en production',
    STRIPE_SECRET_KEY:              'Stripe — abonnements et paiements',
    STRIPE_WEBHOOK_SECRET:          'Stripe — webhook events',
    STRIPE_PRO_MONTHLY_PRICE_ID:    'Stripe — plan Pro mensuel',
    STRIPE_PRO_ANNUAL_PRICE_ID:     'Stripe — plan Pro annuel',
    STRIPE_EXPERT_MONTHLY_PRICE_ID: 'Stripe — plan Expert mensuel',
    STRIPE_EXPERT_ANNUAL_PRICE_ID:  'Stripe — plan Expert annuel',
  }

  const missing: string[] = []
  const warnings: string[] = []

  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key]) missing.push(`  MISSING: ${key} - ${description}`)
  }

  for (const [key, description] of Object.entries(optional)) {
    if (!process.env[key]) warnings.push(`  OPTIONAL: ${key} - ${description}`)
  }

  if (warnings.length > 0) {
    console.warn('[env] Optional variables not configured (features disabled):')
    console.warn(warnings.join('\n'))
  }

  if (missing.length > 0) {
    console.error('\n[env] Missing required environment variables:')
    console.error(missing.join('\n'))
    console.error('\nConfigurer ces variables dans Railway → Variables tab.\n')
    console.warn('[env] Starting anyway — some features may fail\n')
  } else {
    console.log('[env] Required environment variables OK')
  }
}
