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
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // required for Google Sign-In popups
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

// Trust proxy (required for rate-limit behind Railway/Render/Vercel reverse proxy)
app.set('trust proxy', 1)

// Request timeout — abort long-running requests before Railway's 30s hard kill
// Uploads get a longer timeout (60s), everything else is capped at 25s.
app.use((req, res, next) => {
  const isUpload = req.path.includes('/upload') || req.path.includes('/dossier')
  const timeoutMs = isUpload ? 60_000 : 25_000
  res.setTimeout(timeoutMs, () => {
    res.status(503).json({ success: false, message: 'Request timeout — please retry.' })
  })
  next()
})

// ── WEBHOOK STRIPE (raw body — DOIT être AVANT express.json) ────────────────
app.post(
  `/api/${env.API_VERSION}/stripe/webhook`,
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
)

// Body parsing — 10mb for JSON (PDF content), 20mb for file uploads
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// Global input sanitization (null bytes, control chars, injection patterns)
app.use(sanitizeInput)

// Logging
if (env.IS_DEVELOPMENT) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Rate limiting
// Polling endpoints are excluded globally — they are called every few seconds
// by authenticated clients and would instantly saturate any reasonable limit.
const POLLING_PATHS = [
  '/messages/unread-count',
  '/messages/conversations',
  '/notifications',
]

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  // 500 req / window for production — enough for intensive authenticated usage
  max: env.IS_DEVELOPMENT ? 10000 : Math.max(env.RATE_LIMIT.MAX_REQUESTS, 500),
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Always skip polling endpoints — they are authenticated and high-frequency
    const apiPath = req.path.replace(/^\/v\d+/, '') // strip /v1 prefix
    return POLLING_PATHS.some((p) => apiPath.endsWith(p) || apiPath.includes(p))
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
