import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
        },
      })
    }

    return prisma.tenantDocument.create({ data })
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
