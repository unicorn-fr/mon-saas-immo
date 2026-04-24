// ============================================
// GLOBAL ERROR HANDLERS — AVANT TOUT IMPORT
// ============================================
process.on('uncaughtException', (err) => {
  console.error('[CRASH] uncaughtException:', err.message)
  console.error(err.stack)
  // Ne pas exit — Railway verra l'erreur dans les logs
})

process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason)
  console.error('[CRASH] unhandledRejection:', msg)
})

import { createServer } from 'http'
import app from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/database.js'
import { connectRedis } from './utils/cache.js'
import { checkRequiredEnvVars } from './utils/checkEnv.js'
import cron from 'node-cron'
import { generateMonthlyPayments } from './jobs/generateMonthlyPayments.js'

checkRequiredEnvVars()

const PORT = Number(process.env.PORT) || 5000

console.log('[server] Starting...')
console.log(`[server] NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`[server] PORT: ${PORT}`)
console.log(`[server] DATABASE_URL present: ${!!process.env.DATABASE_URL}`)
console.log(`[server] JWT_SECRET present: ${!!process.env.JWT_SECRET}`)
console.log(`[server] REFRESH_TOKEN_SECRET present: ${!!process.env.REFRESH_TOKEN_SECRET}`)

const httpServer = createServer(app)

// ============================================
// BIND PORT IMMÉDIATEMENT — avant tout le reste
// Railway healthcheck /health doit répondre le plus vite possible
// ============================================
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50))
  console.log(`[server] Listening on 0.0.0.0:${PORT}`)
  console.log(`[server] /health is ready`)
  console.log('='.repeat(50))
})

httpServer.on('error', (err) => {
  console.error('[server] httpServer error:', err.message)
})

// ============================================
// CONNEXIONS AUX SERVICES — en arrière-plan
// Ne doivent PAS bloquer le listen ci-dessus
// ============================================
setImmediate(async () => {
  // Prisma connection check
  try {
    await prisma.$connect()
    console.log('[db] PostgreSQL connected')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[db] PostgreSQL connection failed:', msg)
    // Ne pas crasher — le serveur reste up pour les healthchecks
  }

  // Redis (non-bloquant)
  connectRedis().catch((err: Error) => {
    console.warn('[redis] Unavailable, running without cache:', err.message)
  })

  // Cron mensuel : génération des paiements de loyer attendus (1er du mois, 8h00)
  cron.schedule('0 8 1 * *', async () => {
    console.log('[cron] Génération des loyers mensuels...')
    await generateMonthlyPayments().catch((err: Error) =>
      console.error('[cron] generateMonthlyPayments error:', err)
    )
  })

  console.log(`[server] API available at: http://0.0.0.0:${PORT}/api/${env.API_VERSION}`)
})

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = (signal: string) => {
  console.log(`[server] ${signal} received — shutting down`)
  httpServer.close(async () => {
    await prisma.$disconnect().catch(() => {})
    console.log('[server] HTTP server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
