import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
}

export const dossierService = new DossierService()
