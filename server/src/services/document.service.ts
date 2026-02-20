import { PrismaClient, DocumentStatus } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateDocumentInput {
  contractId: string
  uploadedById: string
  category: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

class DocumentService {
  /**
   * Upload a document for a contract
   */
  async createDocument(data: CreateDocumentInput) {
    // Verify contract exists and user has access
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
    })

    if (!contract) {
      throw new Error('Contrat introuvable')
    }

    if (data.uploadedById !== contract.ownerId && data.uploadedById !== contract.tenantId) {
      throw new Error('Acces refuse : vous n\'etes pas partie a ce contrat')
    }

    // Check if a document for this category already exists
    const existing = await prisma.contractDocument.findFirst({
      where: {
        contractId: data.contractId,
        category: data.category,
      },
    })

    // If exists, update it (replace the file)
    if (existing) {
      return prisma.contractDocument.update({
        where: { id: existing.id },
        data: {
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          status: 'UPLOADED',
          rejectionReason: null,
          uploadedById: data.uploadedById,
        },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      })
    }

    return prisma.contractDocument.create({
      data: {
        contractId: data.contractId,
        uploadedById: data.uploadedById,
        category: data.category,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: 'UPLOADED',
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })
  }

  /**
   * Get all documents for a contract
   */
  async getDocumentsByContract(contractId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contrat introuvable')
    }

    if (userId !== contract.ownerId && userId !== contract.tenantId) {
      throw new Error('Acces refuse')
    }

    return prisma.contractDocument.findMany({
      where: { contractId },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string) {
    const doc = await prisma.contractDocument.findUnique({
      where: { id: documentId },
      include: { contract: true },
    })

    if (!doc) {
      throw new Error('Document introuvable')
    }

    // Only the uploader or the contract owner can delete
    if (doc.uploadedById !== userId && doc.contract.ownerId !== userId) {
      throw new Error('Acces refuse')
    }

    return prisma.contractDocument.delete({
      where: { id: documentId },
    })
  }

  /**
   * Validate or reject a document (owner only)
   */
  async updateDocumentStatus(documentId: string, userId: string, status: DocumentStatus, rejectionReason?: string) {
    const doc = await prisma.contractDocument.findUnique({
      where: { id: documentId },
      include: { contract: true },
    })

    if (!doc) {
      throw new Error('Document introuvable')
    }

    // Only contract owner can validate/reject
    if (doc.contract.ownerId !== userId) {
      throw new Error('Seul le proprietaire peut valider ou refuser les documents')
    }

    return prisma.contractDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })
  }

  /**
   * Get document checklist completion status for a contract
   */
  async getChecklistStatus(contractId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contrat introuvable')
    }

    if (userId !== contract.ownerId && userId !== contract.tenantId) {
      throw new Error('Acces refuse')
    }

    const documents = await prisma.contractDocument.findMany({
      where: { contractId },
      select: {
        category: true,
        status: true,
        fileName: true,
      },
    })

    return {
      contractId,
      documents: documents.map(d => ({
        category: d.category,
        status: d.status,
        fileName: d.fileName,
      })),
    }
  }
}

export const documentService = new DocumentService()
