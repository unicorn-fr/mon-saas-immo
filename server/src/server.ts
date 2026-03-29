import { checkRequiredEnvVars } from './utils/checkEnv.js'

// Vérification des variables d'env en tout premier (plante en prod si manquantes)
checkRequiredEnvVars()

import { createServer } from 'http'
import app from './app.js'
import { env } from './config/env.js'
import { connectRedis } from './utils/cache.js'
import cron from 'node-cron'
import { generateMonthlyPayments } from './jobs/generateMonthlyPayments.js'

// Create HTTP server
const httpServer = createServer(app)

// ============================================
// START SERVER
// ============================================

const PORT = env.PORT || 5000

// Connect Redis (non-blocking — app starts even if Redis unavailable)
connectRedis().catch((err) => {
  console.warn('[Redis] Non disponible au démarrage, mode sans cache:', err.message)
})

// Cron mensuel : génération des paiements de loyer attendus (1er du mois, 8h00)
cron.schedule('0 8 1 * *', async () => {
  console.log('[Cron] Génération des loyers mensuels...')
  await generateMonthlyPayments().catch((err) =>
    console.error('[Cron] generateMonthlyPayments error:', err)
  )
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50))
  console.log('Server started successfully!')
  console.log('='.repeat(50))
  console.log(`Environment: ${env.NODE_ENV}`)
  console.log(`Server running on: http://0.0.0.0:${PORT}`)
  console.log(`API available at: http://0.0.0.0:${PORT}/api/${env.API_VERSION}`)
  console.log(`Health check: http://0.0.0.0:${PORT}/health`)
  console.log('='.repeat(50))
})

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} signal received: closing HTTP server`)
  httpServer.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
