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

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: env.IS_DEVELOPMENT ? ['query', 'error', 'warn'] : ['error'],
  })

if (env.IS_DEVELOPMENT) {
  global.prisma = prisma
}

/**
 * Graceful shutdown
 */
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect()
  console.log('📦 Database disconnected')
}
