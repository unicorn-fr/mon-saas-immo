import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { emailMode } from './lib/email.js'
import { allowedOrigins, env } from './env.js'
import { errorHandler, HttpError } from './lib/http.js'
import { limitPerVisitor } from './lib/rateLimit.js'
import { CHARGES_LIST, LEASE_NOTICE, REPAIRS_LIST, renderNoticePdf } from './pdf/notice.js'
import draftRoutes from './routes/drafts.js'
import candidateRoutes from './routes/candidates.js'
import contactRoutes from './routes/contacts.js'
import tenantLinkRoutes from './routes/tenantLink.js'
import tenantFormRoutes from './routes/tenantForm.js'
import authRoutes from './routes/auth.js'
import accountRoutes from './routes/account.js'
import geoRoutes from './routes/geo.js'
import spaceRoutes from './routes/space.js'
import esignRoutes from './routes/esign.js'
import leaseRoutes from './routes/leases.js'
import todayRoutes from './routes/today.js'
import moneyRoutes from './routes/money.js'
import bankRoutes from './routes/bank.js'
import inventoryRoutes from './routes/inventories.js'

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
  // Signatures dessinées (images) et états des lieux : quelques centaines de Ko.
  app.use(express.json({ limit: '2mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, version: process.env.BAILIO_VERSION ?? 'dev', email: emailMode() }))
  // Erreurs survenues dans le navigateur d'un visiteur : écrites dans le journal du serveur pour les corriger.
  app.post('/api/client-errors', limitPerVisitor(10, 30), express.json({ limit: '20kb' }), (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    const s = (v: unknown, n: number) => String(v ?? '').slice(0, n)
    console.error('[navigateur]', JSON.stringify({ message: s(b.message, 500), where: s(b.where, 60), url: s(b.url, 300), ua: s(req.headers['user-agent'], 300), stack: s(b.stack, 3000) }))
    res.status(204).end()
  })
  // Textes officiels joints au bail (notice d'information, réparations locatives, charges récupérables) : identiques pour
  // tous, donc publics et gardés en mémoire une fois produits.
  const officialPdfs = new Map<string, Promise<Buffer>>()
  const OFFICIAL = { 'notice-information': LEASE_NOTICE, 'reparations-locatives': REPAIRS_LIST, 'charges-recuperables': CHARGES_LIST } as const
  app.get('/api/:name.pdf', async (req, res, next) => {
    const name = req.params.name as keyof typeof OFFICIAL
    if (!(name in OFFICIAL)) return next()
    try {
      if (!officialPdfs.has(name)) officialPdfs.set(name, renderNoticePdf(OFFICIAL[name]))
      const pdf = await officialPdfs.get(name)!
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="${name}.pdf"`)
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.send(pdf)
    } catch (e) {
      officialPdfs.delete(name)
      next(e)
    }
  })
  app.use('/api', candidateRoutes)
  app.use('/api', contactRoutes)
  app.use('/api', tenantLinkRoutes)
  app.use('/api', tenantFormRoutes)
  app.use('/api/drafts', draftRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/geo', geoRoutes)
  app.use('/api', esignRoutes)
  app.use('/api', accountRoutes)
  app.use('/api', todayRoutes)
  app.use('/api', spaceRoutes)
  app.use('/api', leaseRoutes)
  app.use('/api', moneyRoutes)
  app.use('/api', bankRoutes)
  app.use('/api', inventoryRoutes)
  app.use((_req, _res, next) => next(new HttpError(404, 'Page introuvable.')))
  app.use(errorHandler)
  return app
}
