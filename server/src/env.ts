import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),
  // Origines autorisées (séparées par des virgules) et URL publique du site, utilisée dans les emails.
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default(''),
  // Emails : sans clé Resend, les emails sont écrits dans les logs (développement).
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Bailio <bonjour@bailio.fr>'),
  // Connexion Google (facultative).
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Lecture des baux importés par l'IA (facultative).
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-opus-5'),
})

export const env = schema.parse(process.env)

export const allowedOrigins = new Set(
  [env.CLIENT_URL, ...env.CORS_ORIGINS.split(',')].map((o) => o.trim().replace(/\/$/, '')).filter(Boolean),
)
