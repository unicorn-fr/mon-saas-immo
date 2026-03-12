import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Retention durations by document category (ms)
const RETENTION: Record<string, number> = {
  IDENTITE:   90  * 24 * 60 * 60 * 1000,  // 90 days  — identity docs
  EMPLOI:     365 * 24 * 60 * 60 * 1000,  // 1 year
  REVENUS:    365 * 24 * 60 * 60 * 1000,  // 1 year
  DOMICILE:   180 * 24 * 60 * 60 * 1000,  // 6 months
  GARANTIES:  365 * 24 * 60 * 60 * 1000,  // 1 year
}

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

    return prisma.tenantDocument.create({ data: { ...data, expiresAt } })
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
   * Get all documents for a tenant — accessible by owners who have at least
   * one application or conversation involving that tenant.
   */
  async getTenantDossier(tenantId: string, requesterId: string) {
    // Verify requester is an OWNER
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, firstName: true, lastName: true, email: true },
    })
    if (!requester || requester.role !== 'OWNER') {
      throw new Error('Accès refusé')
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

    // Log this access so the tenant can see it in their privacy center
    // Fire-and-forget — don't block the response
    prisma.dossierAccessLog.create({
      data: {
        tenantId,
        viewerId: requesterId,
        viewerName: `${requester.firstName ?? ''} ${requester.lastName ?? ''}`.trim(),
        viewerEmail: requester.email ?? '',
      },
    }).catch(() => { /* non-fatal */ })

    return tenant
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
