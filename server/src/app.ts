import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { env } from './config/env.js'
import { errorHandler } from './middlewares/error.middleware.js'

// Routes
import authRoutes from './routes/auth.routes.js'
import propertyRoutes from './routes/property.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import favoriteRoutes from './routes/favorite.routes.js'
import bookingRoutes from './routes/booking.routes.js'
import messageRoutes from './routes/message.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import contractRoutes from './routes/contract.routes.js'
import documentRoutes from './routes/document.routes.js'
import adminRoutes from './routes/admin.routes.js'
import marketRoutes from './routes/market.routes.js'
// import userRoutes from './routes/user.routes.js'

const app: Application = express()

// ============================================
// MIDDLEWARES
// ============================================

// Security headers
app.use(helmet())

// CORS - restrict to allowed origin in production
app.use(
  cors({
    origin: env.IS_PRODUCTION ? env.CORS_ORIGIN : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Trust proxy (required for rate-limit behind Render/Vercel reverse proxy)
if (env.IS_PRODUCTION) {
  app.set('trust proxy', 1)
}

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
if (env.IS_DEVELOPMENT) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Serve static files (uploads)
app.use('/uploads', express.static(env.UPLOAD_DIR))

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

// API routes
const API_PREFIX = `/api/${env.API_VERSION}`

app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/properties`, propertyRoutes)
app.use(`${API_PREFIX}/upload`, uploadRoutes)
app.use(`${API_PREFIX}/favorites`, favoriteRoutes)
app.use(`${API_PREFIX}/bookings`, bookingRoutes)
app.use(`${API_PREFIX}/messages`, messageRoutes)
app.use(`${API_PREFIX}/notifications`, notificationRoutes)
app.use(`${API_PREFIX}/contracts`, contractRoutes)
app.use(`${API_PREFIX}/documents`, documentRoutes)
app.use(`${API_PREFIX}/admin`, adminRoutes)
app.use(`${API_PREFIX}/market`, marketRoutes)
// app.use(`${API_PREFIX}/users`, userRoutes)

// API root
app.get(API_PREFIX, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ImmoParticuliers API',
    version: env.API_VERSION,
    endpoints: {
      health: '/health',
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
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
