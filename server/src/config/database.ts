import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

/**
 * Prisma Client Singleton
 * Prevents multiple instances in development due to hot reloading
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Connection pool tuning:
// - connection_limit: max simultaneous DB connections per Prisma instance
//   Railway PostgreSQL free tier supports ~20 connections total.
//   Keep this at 10 to leave headroom for migrations and monitoring.
// - pool_timeout: seconds to wait for a free connection before throwing
// - connect_timeout: seconds for the initial TCP handshake
const buildDatabaseUrl = (): string => {
  const url = env.DATABASE_URL
  if (!url) return url
  try {
    const parsed = new URL(url)
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '10')
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '30')
    }
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '10')
    }
    return parsed.toString()
  } catch {
    return url
  }
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: env.IS_DEVELOPMENT ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: { url: buildDatabaseUrl() },
    },
  })

if (env.IS_DEVELOPMENT) {
  global.prisma = prisma
}

/**
 * Graceful shutdown
 */
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect()
  console.log('[db] Database disconnected')
}
