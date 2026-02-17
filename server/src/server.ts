import { createServer } from 'http'
import app from './app.js'
import { env } from './config/env.js'

// Create HTTP server
const httpServer = createServer(app)

// ============================================
// START SERVER
// ============================================

const PORT = env.PORT || 5000

if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, () => {
    console.log('='.repeat(50))
    console.log('Server started successfully!')
    console.log('='.repeat(50))
    console.log(`Environment: ${env.NODE_ENV}`)
    console.log(`Server running on: http://localhost:${PORT}`)
    console.log(`API available at: http://localhost:${PORT}/api/${env.API_VERSION}`)
    console.log(`Health check: http://localhost:${PORT}/health`)
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
}
