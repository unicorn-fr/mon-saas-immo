/**
 * PrivacyService — RGPD compliance features:
 *   - exportUserData: full personal data export (portability, art. 20 RGPD)
 *   - deleteAccount: permanent erasure of account + all data (art. 17 RGPD)
 *   - getAccessLog: list of owners who viewed the tenant's dossier
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { env } from '../config/env.js'

const prisma = new PrismaClient()

export class PrivacyService {
  /**
   * Returns all personal data for a user as a structured object.
   * Complies with RGPD Art. 20 (right to data portability).
   */
  async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        birthDate: true,
        birthCity: true,
        nationality: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        profileMeta: true,
        tenantDocuments: {
          select: {
            id: true, category: true, docType: true, status: true,
            fileName: true, fileSize: true, mimeType: true,
            createdAt: true, expiresAt: true,
          },
        },
        applications: {
          select: {
            id: true, status: true, score: true, coverLetter: true,
            hasGuarantor: true, guarantorType: true, createdAt: true,
            property: { select: { id: true, title: true, address: true, city: true } },
          },
        },
        bookings: {
          select: {
            id: true, visitDate: true, visitTime: true, status: true,
            tenantNotes: true, createdAt: true,
            property: { select: { id: true, title: true, address: true, city: true } },
          },
        },
        tenantContracts: {
          select: {
            id: true, status: true, startDate: true, endDate: true,
            monthlyRent: true, createdAt: true,
            property: { select: { id: true, title: true, address: true } },
          },
        },
        favorites: {
          select: {
            createdAt: true,
            property: { select: { id: true, title: true, city: true } },
          },
        },
      },
    })

    if (!user) throw new Error('Utilisateur introuvable')

    const accessLogs = await prisma.dossierAccessLog.findMany({
      where: { tenantId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, viewerName: true, viewerEmail: true,
        propertyTitle: true, createdAt: true,
      },
    })

    return {
      exportDate: new Date().toISOString(),
      exportedBy: 'ImmoParticuliers — RGPD Art. 20',
      profile: user,
      dossierAccessHistory: accessLogs,
    }
  }

  /**
   * Permanently deletes the user account and all associated data.
   * Files on disk are also removed.
   * Complies with RGPD Art. 17 (right to erasure / "droit à l'oubli").
   */
  async deleteAccount(userId: string) {
    // Get all tenant document file paths before deletion
    const docs = await prisma.tenantDocument.findMany({
      where: { userId },
      select: { fileUrl: true },
    })

    // Delete physical files
    for (const doc of docs) {
      try {
        const relativePath = doc.fileUrl.startsWith('/uploads/')
          ? doc.fileUrl.replace('/uploads/', '')
          : null
        if (relativePath) {
          const filePath = path.join(env.UPLOAD_DIR, relativePath)
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }
      } catch {
        // Non-fatal
      }
    }

    // Cascade delete via Prisma (all relations have onDelete: Cascade)
    await prisma.user.delete({ where: { id: userId } })
  }

  /**
   * Returns the list of owners who accessed this tenant's dossier.
   */
  async getAccessLog(tenantId: string) {
    return prisma.dossierAccessLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }
}

export const privacyService = new PrivacyService()
