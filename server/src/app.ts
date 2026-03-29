import express, { Application, Request, Response } from 'express'
import cors from 'cors'
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
// MIDDLEWARES
// ============================================

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

// CORS — origins from env + hardcoded production fallbacks
const allowedOrigins = [
  ...env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  'https://bailio.fr',
  'https://www.bailio.fr',
]

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    console.warn(`[CORS] Blocked origin: ${origin}`)
    callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

// Handle OPTIONS preflight for all routes first
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

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

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  })
})

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
