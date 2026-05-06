/**
 * Routes — Registre Central
 *
 * Toutes les routes applicatives sont enregistrées ici via registerRoutes().
 * La route webhook Stripe (raw body) reste dans app.ts car elle doit
 * être montée AVANT express.json().
 *
 * Usage dans app.ts :
 *   import { registerRoutes } from './routes/index.js'
 *   registerRoutes(app, API_PREFIX)
 */

import { Application } from 'express'

import authRoutes from './auth.routes.js'
import propertyRoutes from './property.routes.js'
import uploadRoutes from './upload.routes.js'
import favoriteRoutes from './favorite.routes.js'
import bookingRoutes from './booking.routes.js'
import messageRoutes from './message.routes.js'
import notificationRoutes from './notification.routes.js'
import contractRoutes from './contract.routes.js'
import documentRoutes from './document.routes.js'
import dossierRoutes from './dossier.routes.js'
import adminRoutes from './admin.routes.js'
import superAdminRoutes from './superAdmin.routes.js'
import marketRoutes from './market.routes.js'
import applicationRoutes from './application.routes.js'
import privacyRoutes from './privacy.routes.js'
import bugsRoutes from './bugs.routes.js'
import stripeRoutes from './stripe.routes.js'
import paymentRoutes from './payment.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import waitlistRoutes from './waitlist.routes.js'
import edlRoutes from './edl.routes.js'
import ocrRoutes from './ocr.routes.js'
import financeRoutes from './finance.routes.js'
import maintenanceRoutes from './maintenance.routes.js'
import sepaRoutes from './sepa.routes.js'
import connectRoutes from './connect.routes.js'

/**
 * Register all application routes on the Express app.
 *
 * Route auth requirements:
 * - Public routes: /auth, /properties (GET public subset), /market
 * - Auth enforced per-route in each router file
 *
 * @param app       Express application instance
 * @param prefix    API version prefix, e.g. "/api/v1"
 */
export function registerRoutes(app: Application, prefix: string): void {
  // ── Public / mixed ──────────────────────────────────────────────────────
  app.use(`${prefix}/waitlist`, waitlistRoutes)
  app.use(`${prefix}/auth`, authRoutes)
  app.use(`${prefix}/properties`, propertyRoutes)
  app.use(`${prefix}/market`, marketRoutes)

  // ── Authenticated ───────────────────────────────────────────────────────
  app.use(`${prefix}/upload`, uploadRoutes)
  app.use(`${prefix}/favorites`, favoriteRoutes)
  app.use(`${prefix}/bookings`, bookingRoutes)
  app.use(`${prefix}/messages`, messageRoutes)
  app.use(`${prefix}/notifications`, notificationRoutes)
  app.use(`${prefix}/contracts`, contractRoutes)
  app.use(`${prefix}/documents`, documentRoutes)
  app.use(`${prefix}/dossier`, dossierRoutes)
  app.use(`${prefix}/applications`, applicationRoutes)
  app.use(`${prefix}/privacy`, privacyRoutes)
  app.use(`${prefix}/bugs`, bugsRoutes)

  // ── Billing ─────────────────────────────────────────────────────────────
  app.use(`${prefix}/stripe`, stripeRoutes)
  app.use(`${prefix}/payments`, paymentRoutes)
  app.use(`${prefix}/sepa`, sepaRoutes)
  app.use(`${prefix}/connect`, connectRoutes)

  // ── Aggregation ─────────────────────────────────────────────────────────
  app.use(`${prefix}/dashboard`, dashboardRoutes)

  // ── EDL Synchrone ───────────────────────────────────────────────────────
  app.use(`${prefix}/edl`, edlRoutes)

  // ── OCR (Claude Haiku) ──────────────────────────────────────────────────
  app.use(`${prefix}/ocr`, ocrRoutes)

  // ── Finances & Maintenance ──────────────────────────────────────────────
  app.use(`${prefix}/finances`, financeRoutes)
  app.use(`${prefix}/maintenance`, maintenanceRoutes)

  // ── Administration ──────────────────────────────────────────────────────
  app.use(`${prefix}/admin`, adminRoutes)
  app.use(`${prefix}/super-admin`, superAdminRoutes)
}
