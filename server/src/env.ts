import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),
  // URL publique du site (liens des emails) et origines autorisées, séparées par des virgules.
  // FRONTEND_URL et CORS_ORIGIN : anciens noms, encore acceptés.
  CLIENT_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().default(''),
  CORS_ORIGIN: z.string().default(''),
  EMAIL_FROM: z.string().default('Bailio <bonjour@bailio.fr>'),
  // Emails : SMTP authentifié (Ionos). Sans SMTP, les emails sont écrits dans les logs (développement).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Ancien service d'envoi (États-Unis), utilisé seulement sans SMTP : à retirer une fois le SMTP en place.
  RESEND_API_KEY: z.string().optional(),
})

const parsed = schema.parse(process.env)

export const env = {
  ...parsed,
  CLIENT_URL: (parsed.CLIENT_URL ?? parsed.FRONTEND_URL ?? (parsed.NODE_ENV === 'production' ? 'https://bailio.fr' : 'http://localhost:5173')).replace(/\/$/, ''),
  // Adresse nue (ancien format) → « Bailio <adresse> ».
  EMAIL_FROM: parsed.EMAIL_FROM.includes('<') ? parsed.EMAIL_FROM : `Bailio <${parsed.EMAIL_FROM.trim()}>`,
}

export const allowedOrigins = new Set(
  [env.CLIENT_URL, 'https://bailio.eu', 'https://www.bailio.eu', 'https://bailio.fr', 'https://www.bailio.fr', ...`${env.CORS_ORIGINS},${env.CORS_ORIGIN}`.split(',')]
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
)
