import { PrismaClient, ApplicationStatus } from '@prisma/client'
import { sendEmail } from '../utils/email.util.js'
import { computeMatchScore } from './application.service.js'

const prisma = new PrismaClient()

// Retention durations by document category (ms)
const RETENTION: Record<string, number> = {
  IDENTITE:   90  * 24 * 60 * 60 * 1000,  // 90 days  — identity docs
  EMPLOI:     365 * 24 * 60 * 60 * 1000,  // 1 year
  REVENUS:    365 * 24 * 60 * 60 * 1000,  // 1 year
  DOMICILE:   180 * 24 * 60 * 60 * 1000,  // 6 months
  GARANTIES:  365 * 24 * 60 * 60 * 1000,  // 1 year
}

// Default share duration: 7 days
const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface ProfileData {
  firstName?: string
  lastName?: string
  birthDate?: string
  birthCity?: string
  nationality?: string
  documentNumber?: string
  documentExpiry?: string
  nationalNumber?: string
  address?: string
  employerName?: string
  contractType?: string
  netSalary?: number | null
}

export interface CreateTenantDocumentInput {
  userId: string
  category: string
  docType: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

class DossierService {
  async getDocuments(userId: string) {
    return prisma.tenantDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createDocument(data: CreateTenantDocumentInput) {
    // Compute auto-deletion date based on category
    const retentionMs = RETENTION[data.category] ?? RETENTION['EMPLOI']
    const expiresAt = new Date(Date.now() + retentionMs)

    // Replace existing doc if same category + docType for this user
    const existing = await prisma.tenantDocument.findFirst({
      where: { userId: data.userId, category: data.category, docType: data.docType },
    })

    if (existing) {
      return prisma.tenantDocument.update({
        where: { id: existing.id },
        data: {
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          status: 'UPLOADED',
          note: null,
          expiresAt,
        },
      })
    }

    const doc = await prisma.tenantDocument.create({ data: { ...data, expiresAt } })
    await this.recalculateTenantScore(data.userId)
    return doc
  }

  /**
   * Recalcule et persiste le score dossier du locataire (0-100).
   * Appelé après chaque upload de document.
   */
  async recalculateTenantScore(userId: string): Promise<number> {
    const documents = await prisma.tenantDocument.findMany({
      where: { userId },
      select: { category: true, status: true },
    })

    const weights: Record<string, number> = {
      IDENTITE:     25,
      EMPLOI:       20,
      REVENUS:      30,
      DOMICILE:     15,
      GARANTIES:    10,
    }

    const validatedCategories = new Set(
      documents
        .filter((d) => d.status === 'VALIDATED' || d.status === 'UPLOADED')
        .map((d) => d.category)
    )

    let score = 0
    for (const [category, weight] of Object.entries(weights)) {
      if (validatedCategories.has(category)) score += weight
    }

    await prisma.user.update({
      where: { id: userId },
      data: { tenantScore: score, tenantScoreAt: new Date() },
    })

    return score
  }

  async reassignDocument(id: string, userId: string, category: string, docType: string) {
    const doc = await prisma.tenantDocument.findUnique({ where: { id } })
    if (!doc) throw new Error('Document introuvable')
    if (doc.userId !== userId) throw new Error('Accès refusé')

    // If target slot is occupied → swap atomically
    const occupant = await prisma.tenantDocument.findFirst({
      where: { userId, category, docType, NOT: { id } },
    })

    if (occupant) {
      await prisma.$transaction([
        prisma.tenantDocument.update({
          where: { id: occupant.id },
          data: { category: doc.category, docType: doc.docType },
        }),
        prisma.tenantDocument.update({
          where: { id },
          data: { category, docType },
        }),
      ])
      return { swapped: true }
    }

    await prisma.tenantDocument.update({ where: { id }, data: { category, docType } })
    return { swapped: false }
  }

  /**
   * Get all documents for a tenant — the owner MUST have an active DossierShare
   * granted by the tenant. This is the core anti-fraud access control.
   *
   * Flow:
   *   1. Verify requester is OWNER and not banned
   *   2. Check active DossierShare exists (tenant explicitly authorised this owner)
   *   3. Log access (fire-and-forget)
   *   4. Send security alert email to tenant
   */
  async getTenantDossier(tenantId: string, requesterId: string) {
    // Verify requester is an active, non-banned OWNER
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, firstName: true, lastName: true, email: true, isBanned: true },
    })
    if (!requester || requester.role !== 'OWNER') throw new Error('Accès refusé')
    if (requester.isBanned) throw new Error('Compte suspendu — accès refusé')

    // ── Vérification d'accès : share OU candidature active OU contrat actif ──
    const share = await prisma.dossierShare.findUnique({
      where: { tenantId_ownerId: { tenantId, ownerId: requesterId } },
    })

    const shareValid = share && !share.revokedAt && share.expiresAt >= new Date()

    if (!shareValid) {
      // Fallback 1 : candidature active du locataire sur un bien du propriétaire
      const activeApp = await prisma.application.findFirst({
        where: {
          tenantId,
          status: { not: 'WITHDRAWN' },
          property: { ownerId: requesterId },
        },
      })
      // Fallback 2 : contrat (y compris brouillon) entre les deux parties
      const activeContract = !activeApp && await prisma.contract.findFirst({
        where: {
          tenantId,
          ownerId: requesterId,
          status: { in: ['DRAFT', 'SENT', 'SIGNED_TENANT', 'SIGNED_OWNER', 'COMPLETED', 'ACTIVE'] },
        },
      })

      if (!activeApp && !activeContract) {
        throw new Error('SHARE_REQUIRED: Le locataire n\'a pas partagé son dossier avec vous')
      }
    }

    // Fetch tenant basic info + documents
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileMeta: true,
        birthDate: true,
        birthCity: true,
        nationality: true,
        tenantDocuments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!tenant) throw new Error('Locataire introuvable')

    const viewerName = `${requester.firstName ?? ''} ${requester.lastName ?? ''}`.trim()

    // Log access (fire-and-forget)
    prisma.dossierAccessLog.create({
      data: {
        tenantId,
        viewerId: requesterId,
        viewerName,
        viewerEmail: requester.email ?? '',
      },
    }).catch(() => { /* non-fatal */ })

    // Send security alert email to tenant (fire-and-forget)
    this.sendDossierAccessAlert(tenant.email, tenant.firstName ?? '', viewerName, requester.email ?? '')

    return tenant
  }

  /**
   * Security alert: notify the tenant their dossier was just accessed.
   */
  private async sendDossierAccessAlert(
    tenantEmail: string,
    tenantFirstName: string,
    viewerName: string,
    viewerEmail: string,
  ): Promise<void> {
    try {
      const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
      await sendEmail({
        to: tenantEmail,
        subject: 'Votre dossier locataire a été consulté',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto">
            <h2 style="color:#0f172a">Accès à votre dossier</h2>
            <p>Bonjour <strong>${tenantFirstName}</strong>,</p>
            <p>
              Votre dossier locataire vient d'être consulté par
              <strong>${viewerName}</strong> (<code>${viewerEmail}</code>)
              le <strong>${now}</strong>.
            </p>
            <p>
              Tous les documents consultés sont <em>filigranés</em> avec l'identité
              du propriétaire et la date, ce qui les rend traçables en cas d'usage frauduleux.
            </p>
            <hr style="margin:24px 0;border-color:#e2e8f0"/>
            <p style="color:#475569;font-size:13px">
              Si vous n'avez pas partagé votre dossier avec cette personne, ou si quelque chose
              vous semble suspect, <a href="${process.env.FRONTEND_URL ?? ''}/privacy">révoquez immédiatement l'accès</a>
              depuis votre centre de confidentialité.
            </p>
          </div>
        `,
      })
    } catch {
      // Email failure must never break the dossier response
    }
  }

  // ── DOSSIER SHARE MANAGEMENT ─────────────────────────────────────────────

  /**
   * Tenant grants an owner access to their dossier for a given duration.
   * If a share already exists (even revoked / expired), it is refreshed.
   */
  async grantShare(tenantId: string, ownerId: string, propertyId?: string, durationDays = 7) {
    if (tenantId === ownerId) throw new Error('Vous ne pouvez pas partager avec vous-même')

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true, isBanned: true, firstName: true, lastName: true, email: true },
    })
    if (!owner || owner.role !== 'OWNER') throw new Error('Destinataire invalide (doit être un propriétaire)')
    if (owner.isBanned) throw new Error('Ce propriétaire a été suspendu pour fraude')

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

    const share = await prisma.dossierShare.upsert({
      where: { tenantId_ownerId: { tenantId, ownerId } },
      update: { expiresAt, revokedAt: null, propertyId: propertyId ?? null },
      create: { tenantId, ownerId, propertyId: propertyId ?? null, expiresAt },
    })

    // Auto-create candidature when propertyId is provided (tenant contacts owner for a property)
    if (propertyId) {
      try {
        const property = await prisma.property.findUnique({ where: { id: propertyId } })
        if (property && property.status === 'AVAILABLE') {
          const existing = await prisma.application.findUnique({
            where: { propertyId_tenantId: { propertyId, tenantId } },
          })
          if (!existing) {
            const match = await computeMatchScore(propertyId, tenantId)
            const criteria = (property.selectionCriteria ?? {}) as { autoPilot?: boolean; minScore?: number }
            const autoApprove = (criteria.autoPilot ?? false) && match.score >= (criteria.minScore ?? 70)
            await prisma.application.create({
              data: {
                propertyId,
                tenantId,
                score: match.score,
                matchDetails: match.details as object,
                status: autoApprove ? ApplicationStatus.APPROVED : ApplicationStatus.PENDING,
              },
            })
          }
        }
      } catch {
        // Silent — share succeeded even if application creation fails
      }
    }

    // Notify the tenant by log entry (access log for transparency)
    await prisma.notification.create({
      data: {
        userId: tenantId,
        type: 'dossier_shared',
        title: 'Dossier partagé',
        message: `Vous avez partagé votre dossier avec ${owner.firstName} ${owner.lastName} jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
        actionUrl: '/dossier',
      },
    })

    return share
  }

  /**
   * Tenant revokes an owner's access immediately.
   */
  async revokeShare(tenantId: string, ownerId: string) {
    const share = await prisma.dossierShare.findUnique({
      where: { tenantId_ownerId: { tenantId, ownerId } },
    })
    if (!share) throw new Error('Partage introuvable')
    if (share.tenantId !== tenantId) throw new Error('Accès refusé')

    return prisma.dossierShare.update({
      where: { id: share.id },
      data: { revokedAt: new Date() },
    })
  }

  /**
   * List all active and past shares for a tenant.
   */
  async listShares(tenantId: string) {
    const shares = await prisma.dossierShare.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            trustScore: true,
            isVerifiedOwner: true,
          },
        },
      },
    })
    return shares
  }

  /**
   * Check if a specific owner has active access to a tenant's dossier.
   */
  async hasActiveShare(tenantId: string, ownerId: string): Promise<boolean> {
    const share = await prisma.dossierShare.findUnique({
      where: { tenantId_ownerId: { tenantId, ownerId } },
    })
    return !!(share && !share.revokedAt && share.expiresAt > new Date())
  }

  /**
   * Unified access check for document viewing.
   * Returns true if the requester (owner) is allowed to view documents of `tenantId`.
   * Uses the same logic as getTenantDossier to stay in sync.
   * Throws with a 403-compatible message if access is denied.
   */
  async assertDocumentAccess(tenantId: string, requesterId: string): Promise<void> {
    const share = await prisma.dossierShare.findUnique({
      where: { tenantId_ownerId: { tenantId, ownerId: requesterId } },
    })
    if (share && !share.revokedAt && share.expiresAt >= new Date()) return

    const activeApp = await prisma.application.findFirst({
      where: {
        tenantId,
        status: { not: 'WITHDRAWN' },
        property: { ownerId: requesterId },
      },
    })
    if (activeApp) return

    const activeContract = await prisma.contract.findFirst({
      where: {
        tenantId,
        ownerId: requesterId,
        status: { in: ['DRAFT', 'SENT', 'SIGNED_TENANT', 'SIGNED_OWNER', 'COMPLETED', 'ACTIVE'] },
      },
    })
    if (activeContract) return

    throw new Error('Accès non autorisé — le locataire ne vous a pas partagé son dossier')
  }

  // ── FRAUD REPORTING ───────────────────────────────────────────────────────

  async reportUser(reporterId: string, targetId: string, reason: string, details?: string) {
    if (reporterId === targetId) throw new Error('Impossible de se signaler soi-même')

    const report = await prisma.fraudReport.create({
      data: { reporterId, targetId, reason, details: details ?? null },
    })

    // Increment target's reportCount (atomic)
    await prisma.user.update({
      where: { id: targetId },
      data: { reportCount: { increment: 1 } },
    })

    // Auto-reduce trust score when reportCount crosses thresholds
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { reportCount: true, trustScore: true } })
    if (target) {
      let newScore = target.trustScore
      if (target.reportCount >= 5)  newScore = Math.min(newScore, 20)
      else if (target.reportCount >= 3) newScore = Math.min(newScore, 35)
      else if (target.reportCount >= 1) newScore = Math.min(newScore, 50)
      await prisma.user.update({ where: { id: targetId }, data: { trustScore: newScore } })
    }

    return report
  }

  async listFraudReports(targetId: string) {
    return prisma.fraudReport.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, reason: true, status: true, createdAt: true },
    })
  }

  // ── TRUST SCORE ───────────────────────────────────────────────────────────

  async getPublicProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        phoneVerified: true,
        trustScore: true,
        isVerifiedOwner: true,
        reportCount: true,
        isBanned: true,
      },
    })
  }

  async deleteDocument(id: string, userId: string) {
    const doc = await prisma.tenantDocument.findUnique({ where: { id } })
    if (!doc) throw new Error('Document introuvable')
    if (doc.userId !== userId) throw new Error('Acces refuse')
    return prisma.tenantDocument.delete({ where: { id } })
  }

  /**
   * Save AI-extracted profile data into the user's account.
   * Merges professional/address data into profileMeta._composed,
   * and writes identity fields (birthDate, nationality, etc.) directly on the User row.
   */
  async saveProfile(userId: string, data: ProfileData) {
    // Fetch existing profileMeta to merge rather than overwrite
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileMeta: true },
    })
    const existingMeta = (current?.profileMeta as Record<string, unknown>) ?? {}

    const profileMeta = {
      ...existingMeta,
      _composed: {
        address: data.address,
        employerName: data.employerName,
        contractType: data.contractType,
        netSalary: data.netSalary ?? null,
      },
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName ? { firstName: data.firstName } : {}),
        ...(data.lastName  ? { lastName:  data.lastName  } : {}),
        birthDate:      data.birthDate      ?? null,
        birthCity:      data.birthCity      ?? null,
        nationality:    data.nationality    ?? null,
        documentNumber: data.documentNumber ?? null,
        documentExpiry: data.documentExpiry ?? null,
        nationalNumber: data.nationalNumber ?? null,
        profileMeta,
      },
    })
  }
}

export const dossierService = new DossierService()
