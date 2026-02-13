import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import app from './app.js'
import { env } from './config/env.js'

// Create HTTP server
const httpServer = createServer(app)

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id)

  // Handle user authentication
  socket.on('authenticate', (userId: string) => {
    socket.join(`user:${userId}`)
    console.log(`👤 User ${userId} authenticated`)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id)
  })
})

// Make io accessible in app
app.set('io', io)

// ============================================
// START SERVER
// ============================================

const PORT = env.PORT || 5000

httpServer.listen(PORT, () => {
  console.log('='.repeat(50))
  console.log('🚀 Server started successfully!')
  console.log('='.repeat(50))
  console.log(`📍 Environment: ${env.NODE_ENV}`)
  console.log(`🌐 Server running on: http://localhost:${PORT}`)
  console.log(`📡 API available at: http://localhost:${PORT}/api/${env.API_VERSION}`)
  console.log(`💚 Health check: http://localhost:${PORT}/health`)
  console.log('='.repeat(50))
})

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} signal received: closing HTTP server`)
  httpServer.close(() => {
    console.log('✅ HTTP server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export { io }
