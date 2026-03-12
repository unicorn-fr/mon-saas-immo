/**
 * CleanupService — runs on a cron schedule to auto-delete expired TenantDocuments.
 * Documents with expiresAt < now() are removed from DB + disk.
 */
import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { env } from '../config/env.js'

const prisma = new PrismaClient()

async function deleteExpiredDocuments() {
  const now = new Date()
  const expired = await prisma.tenantDocument.findMany({
    where: { expiresAt: { lte: now } },
    select: { id: true, fileUrl: true, userId: true, docType: true },
  })

  if (expired.length === 0) return

  for (const doc of expired) {
    // Delete physical file if stored locally
    try {
      const relativePath = doc.fileUrl.startsWith('/uploads/')
        ? doc.fileUrl.replace('/uploads/', '')
        : null
      if (relativePath) {
        const filePath = path.join(env.UPLOAD_DIR, relativePath)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      }
    } catch {
      // File may already be gone — non-fatal
    }

    await prisma.tenantDocument.delete({ where: { id: doc.id } })
  }

  console.log(`[Cleanup] ${expired.length} expired document(s) deleted at ${now.toISOString()}`)
}

export function startCleanupCron() {
  // Run every hour at :00
  cron.schedule('0 * * * *', async () => {
    try {
      await deleteExpiredDocuments()
    } catch (err) {
      console.error('[Cleanup] Error during expired document cleanup:', err)
    }
  })

  // Also run once immediately on startup to catch any leftover expired docs
  deleteExpiredDocuments().catch((err) =>
    console.error('[Cleanup] Startup cleanup error:', err)
  )

  console.log('[Cleanup] Document expiry cron started (runs every hour)')
}
