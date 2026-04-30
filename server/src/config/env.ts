import { config } from 'dotenv'
import { z } from 'zod'

// Load environment variables
config()

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  MAX_FILE_SIZE: z.string().default('5242880'),
  UPLOAD_DIR: z.string().default('./uploads'),

  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('500'),

  LOG_LEVEL: z.string().default('info'),

  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Firebase Admin (JSON stringifié de la clé de service)
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),

  // Public URL of this server (used to build absolute file URLs when Cloudinary is not configured)
  // Example: https://mon-saas-immo.onrender.com
  SERVER_URL: z.string().optional(),

  // Cloudinary — stockage persistant des fichiers (optionnel, fallback disque local)
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Stripe — abonnements et paiements
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Plan Starter (UI) = PRO en base
  STRIPE_STARTER_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_STARTER_ANNUAL_PRICE_ID: z.string().optional(),
  // Plan Pro (UI) = EXPERT en base
  // Plan Pro (UI) = EXPERT en base (anciennement STRIPE_PRO_* → alias legacy)
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().optional(),
  STRIPE_EXPERT_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_EXPERT_ANNUAL_PRICE_ID: z.string().optional(),

  // Waitlist
  NOTIFY_SECRET: z.string().optional(),
  LAUNCH_DATE: z.string().optional(),

  // Launch mode — controls registration gating
  LAUNCH_MODE: z.enum(['waitlist', 'live']).default('live'),
  ADMIN_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
})

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('[env] ⚠️  Invalid/missing environment variables:')
  console.error(JSON.stringify(parsedEnv.error.flatten().fieldErrors, null, 2))
  console.warn('[env] Starting with partial configuration — check Railway Variables tab')
  // Do NOT process.exit(1) — let the server bind so /health responds and Railway shows real logs
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = parsedEnv.success ? parsedEnv.data : {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || '5000',
  API_VERSION: process.env.API_VERSION || 'v1',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || '',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '5242880',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '500',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
  SERVER_URL: process.env.SERVER_URL,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_STARTER_MONTHLY_PRICE_ID: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
  STRIPE_STARTER_ANNUAL_PRICE_ID: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  STRIPE_PRO_ANNUAL_PRICE_ID: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  STRIPE_EXPERT_MONTHLY_PRICE_ID: process.env.STRIPE_EXPERT_MONTHLY_PRICE_ID,
  STRIPE_EXPERT_ANNUAL_PRICE_ID: process.env.STRIPE_EXPERT_ANNUAL_PRICE_ID,
  NOTIFY_SECRET: process.env.NOTIFY_SECRET,
  LAUNCH_DATE: process.env.LAUNCH_DATE,
  LAUNCH_MODE: (process.env.LAUNCH_MODE as 'waitlist' | 'live') || 'live',
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
}

export const env = {
  NODE_ENV: data.NODE_ENV,
  PORT: parseInt(data.PORT, 10),
  API_VERSION: data.API_VERSION,
  IS_PRODUCTION: data.NODE_ENV === 'production',
  IS_DEVELOPMENT: data.NODE_ENV === 'development',

  DATABASE_URL: data.DATABASE_URL,
  REDIS_URL: data.REDIS_URL,

  JWT_SECRET: data.JWT_SECRET,
  JWT_ACCESS_EXPIRATION: data.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: data.REFRESH_TOKEN_SECRET,
  JWT_REFRESH_EXPIRATION: data.REFRESH_TOKEN_EXPIRES_IN,

  CORS_ORIGIN: data.CORS_ORIGIN,
  FRONTEND_URL: data.FRONTEND_URL,

  GOOGLE_CLIENT_ID: data.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: data.GOOGLE_CLIENT_SECRET,
  ANTHROPIC_API_KEY: data.ANTHROPIC_API_KEY || '',

  MAX_FILE_SIZE: parseInt(data.MAX_FILE_SIZE, 10),
  UPLOAD_DIR: data.UPLOAD_DIR,

  RESEND_API_KEY: data.RESEND_API_KEY || '',
  SMTP_HOST: data.SMTP_HOST || '',
  SMTP_PORT: data.SMTP_PORT ? parseInt(data.SMTP_PORT, 10) : 587,
  SMTP_USER: data.SMTP_USER || '',
  SMTP_PASS: data.SMTP_PASS || '',
  EMAIL_FROM: data.EMAIL_FROM || 'contact@bailio.fr',

  RATE_LIMIT: {
    WINDOW_MS: parseInt(data.RATE_LIMIT_WINDOW_MS, 10),
    MAX_REQUESTS: parseInt(data.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  LOG_LEVEL: data.LOG_LEVEL,

  TURNSTILE_SECRET_KEY: data.TURNSTILE_SECRET_KEY,

  FIREBASE_SERVICE_ACCOUNT: data.FIREBASE_SERVICE_ACCOUNT,

  SERVER_URL: data.SERVER_URL || '',

  STRIPE_SECRET_KEY: data.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: data.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_STARTER_MONTHLY_PRICE_ID: data.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
  STRIPE_STARTER_ANNUAL_PRICE_ID: data.STRIPE_STARTER_ANNUAL_PRICE_ID || '',
  STRIPE_PRO_MONTHLY_PRICE_ID: data.STRIPE_PRO_MONTHLY_PRICE_ID || '',
  STRIPE_PRO_ANNUAL_PRICE_ID: data.STRIPE_PRO_ANNUAL_PRICE_ID || '',
  STRIPE_EXPERT_MONTHLY_PRICE_ID: data.STRIPE_EXPERT_MONTHLY_PRICE_ID || '',
  STRIPE_EXPERT_ANNUAL_PRICE_ID: data.STRIPE_EXPERT_ANNUAL_PRICE_ID || '',

  NOTIFY_SECRET: data.NOTIFY_SECRET || '',
  LAUNCH_DATE: data.LAUNCH_DATE || '2026-06-01T00:00:00Z',

  LAUNCH_MODE: (data.LAUNCH_MODE || 'live') as 'waitlist' | 'live',
  ADMIN_SECRET: data.ADMIN_SECRET || '',
  ADMIN_EMAILS: (data.ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean) as string[],
}
