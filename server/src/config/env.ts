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

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  LOG_LEVEL: z.string().default('info'),

  TURNSTILE_SECRET_KEY: z.string().optional(),
})

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  NODE_ENV: parsedEnv.data.NODE_ENV,
  PORT: parseInt(parsedEnv.data.PORT, 10),
  API_VERSION: parsedEnv.data.API_VERSION,
  IS_PRODUCTION: parsedEnv.data.NODE_ENV === 'production',
  IS_DEVELOPMENT: parsedEnv.data.NODE_ENV === 'development',

  DATABASE_URL: parsedEnv.data.DATABASE_URL,
  REDIS_URL: parsedEnv.data.REDIS_URL,

  JWT_SECRET: parsedEnv.data.JWT_SECRET,
  JWT_ACCESS_EXPIRATION: parsedEnv.data.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: parsedEnv.data.REFRESH_TOKEN_SECRET,
  JWT_REFRESH_EXPIRATION: parsedEnv.data.REFRESH_TOKEN_EXPIRES_IN,

  CORS_ORIGIN: parsedEnv.data.CORS_ORIGIN,
  FRONTEND_URL: parsedEnv.data.FRONTEND_URL,

  GOOGLE_CLIENT_ID: parsedEnv.data.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: parsedEnv.data.GOOGLE_CLIENT_SECRET,

  MAX_FILE_SIZE: parseInt(parsedEnv.data.MAX_FILE_SIZE, 10),
  UPLOAD_DIR: parsedEnv.data.UPLOAD_DIR,

  SMTP: {
    HOST: parsedEnv.data.SMTP_HOST,
    PORT: parsedEnv.data.SMTP_PORT ? parseInt(parsedEnv.data.SMTP_PORT, 10) : undefined,
    USER: parsedEnv.data.SMTP_USER,
    PASS: parsedEnv.data.SMTP_PASS,
  },
  EMAIL_FROM: parsedEnv.data.EMAIL_FROM || 'noreply@immoparticuliers.fr',

  RATE_LIMIT: {
    WINDOW_MS: parseInt(parsedEnv.data.RATE_LIMIT_WINDOW_MS, 10),
    MAX_REQUESTS: parseInt(parsedEnv.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  LOG_LEVEL: parsedEnv.data.LOG_LEVEL,

  TURNSTILE_SECRET_KEY: parsedEnv.data.TURNSTILE_SECRET_KEY,
}
