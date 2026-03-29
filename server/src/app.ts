import express, { Application, Request, Response } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { env } from './config/env.js'
import { errorHandler } from './middlewares/error.middleware.js'
import { sanitizeInput } from './middlewares/security.middleware.js'

// Routes
import { stripeWebhookHandler } from './routes/stripe.routes.js'
import { registerRoutes } from './routes/index.js'

import { startCleanupCron } from './services/cleanup.service.js'

const app: Application = express()

// ============================================
// /health — FIRST, before ALL middleware
// Must respond even if DB/Redis/env are broken
// ============================================
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', ts: Date.now() })
})

// ============================================
// MIDDLEWARES
// ============================================

// CORS — MUST be before helmet, to handle preflight OPTIONS correctly
const allowedOrigins = new Set([
  'https://bailio.fr',
  'https://www.bailio.fr',
  'http://localhost:5173',
  'http://localhost:3000',
  ...env.CORS_ORIGIN.split(',').map((o: string) => o.trim()).filter(Boolean),
])

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})

// Security headers — hardened CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // allow PDF/image loads
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
  })
)

// Trust proxy (required for rate-limit behind Render/Vercel reverse proxy)
if (env.IS_PRODUCTION) {
  app.set('trust proxy', 1)
}

// ── WEBHOOK STRIPE (raw body — DOIT être AVANT express.json) ────────────────
app.post(
  `/api/${process.env.API_VERSION ?? 'v1'}/stripe/webhook`,
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Global input sanitization (null bytes, control chars, injection patterns)
app.use(sanitizeInput)

// Logging
if (env.IS_DEVELOPMENT) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  max: env.IS_DEVELOPMENT ? 10000 : env.RATE_LIMIT.MAX_REQUESTS,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for high-frequency polling endpoints in development
    if (env.IS_DEVELOPMENT) {
      const pollingPaths = ['/api/messages', '/api/notifications']
      return pollingPaths.some((p) => req.path.startsWith(p))
    }
    return false
  },
})
app.use('/api', limiter)

// ============================================
// ROUTES
// ============================================

// API routes — see server/src/routes/index.ts for full registry
const API_PREFIX = `/api/${env.API_VERSION}`
registerRoutes(app, API_PREFIX)

// Start background cron jobs
startCleanupCron()

// API root
app.get(API_PREFIX, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Bailio API',
    version: env.API_VERSION,
    endpoints: {
      health: '/health',
      auth: `${API_PREFIX}/auth`,
      properties: `${API_PREFIX}/properties`,
      bookings: `${API_PREFIX}/bookings`,
      messages: `${API_PREFIX}/messages`,
      contracts: `${API_PREFIX}/contracts`,
      favorites: `${API_PREFIX}/favorites`,
      notifications: `${API_PREFIX}/notifications`,
      upload: `${API_PREFIX}/upload`,
    },
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler)

export default app
