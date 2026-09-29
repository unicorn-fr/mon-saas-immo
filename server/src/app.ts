import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { allowedOrigins, env } from './env.js'
import { errorHandler, HttpError } from './lib/http.js'
import draftRoutes from './routes/drafts.js'
import authRoutes from './routes/auth.js'
import accountRoutes from './routes/account.js'
import geoRoutes from './routes/geo.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.disable('x-powered-by')
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || allowedOrigins.has(origin) || (env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'))),
      exposedHeaders: ['Content-Disposition'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Draft-Token'],
    }),
  )
  app.use(express.json({ limit: '200kb' }))

  app.get('/health', (_req, res) => res.json({ ok: true }))
  app.use('/api/drafts', draftRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/geo', geoRoutes)
  app.use('/api', accountRoutes)
  app.use((_req, _res, next) => next(new HttpError(404, 'Page introuvable.')))
  app.use(errorHandler)
  return app
}
