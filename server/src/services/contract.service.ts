import { PrismaClient, ContractStatus, Contract } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

export interface CreateContractInput {
  propertyId: string
  tenantId: string
  ownerId: string
  startDate: Date
  endDate: Date
  monthlyRent: number
  charges?: number
  deposit?: number
  terms?: string
  content?: any
  customClauses?: any
}

export interface UpdateContractInput {
  startDate?: Date
  endDate?: Date
  monthlyRent?: number
  charges?: number
  deposit?: number
  terms?: string
  status?: ContractStatus
  content?: any
  customClauses?: any
}

export interface ContractFilters {
  propertyId?: string
  tenantId?: string
  ownerId?: string
  status?: ContractStatus
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const contractIncludes = {
  property: {
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      postalCode: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      surface: true,
      images: true,
    },
  },
  tenant: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
}

class ContractService {
  /**
   * Create a new contract
   */
  async createContract(data: CreateContractInput): Promise<Contract> {
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new Error('End date must be after start date')
    }

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    if (property.ownerId !== data.ownerId) {
      throw new Error('Unauthorized: You do not own this property')
    }

    // Resolve tenant: support both UUID and email
    let tenantLookup: { id: string } | { email: string }
    if (data.tenantId.includes('@')) {
      tenantLookup = { email: data.tenantId }
    } else {
      tenantLookup = { id: data.tenantId }
    }

    const tenant = await prisma.user.findUnique({
      where: tenantLookup,
    })

    if (!tenant) {
      throw new Error('Aucun locataire trouvé avec cet email. Vérifiez que le locataire a bien un compte sur la plateforme.')
    }

    if (tenant.role !== 'TENANT') {
      throw new Error('L\'utilisateur trouvé n\'a pas le rôle locataire.')
    }

    const overlappingContract = await prisma.contract.findFirst({
      where: {
        propertyId: data.propertyId,
        status: {
          in: [ContractStatus.ACTIVE, ContractStatus.DRAFT, ContractStatus.SENT, ContractStatus.COMPLETED],
        },
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          },
        ],
      },
    })

    if (overlappingContract) {
      throw new Error('A contract already exists for this property during this period')
    }

    const contract = await prisma.contract.create({
      data: {
        propertyId: data.propertyId,
        tenantId: tenant.id,
        ownerId: data.ownerId,
        startDate: data.startDate,
        endDate: data.endDate,
        monthlyRent: data.monthlyRent,
        charges: data.charges,
        deposit: data.deposit,
        terms: data.terms,
        content: data.content ?? undefined,
        customClauses: data.customClauses ?? undefined,
        status: ContractStatus.DRAFT,
      },
      include: contractIncludes,
    })

    return contract
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string, userId: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: contractIncludes,
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.tenantId !== userId && contract.ownerId !== userId) {
      throw new Error('Unauthorized: You do not have access to this contract')
    }

    return contract
  }

  /**
   * Update contract
   */
  async updateContract(
    contractId: string,
    userId: string,
    data: UpdateContractInput
  ): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can update this contract')
    }

    if (contract.status === ContractStatus.EXPIRED || contract.status === ContractStatus.COMPLETED || contract.status === ContractStatus.ACTIVE) {
      throw new Error('Cannot update a contract in this status')
    }

    if (data.startDate && data.endDate) {
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new Error('End date must be after start date')
      }
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data,
      include: contractIncludes,
    })

    return updatedContract
  }

  /**
   * Delete contract
   */
  async deleteContract(contractId: string, userId: string): Promise<void> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can delete this contract')
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new Error('Can only delete draft contracts')
    }

    await prisma.contract.delete({
      where: { id: contractId },
    })
  }

  /**
   * Get contracts with filters
   */
  async getContracts(
    filters: ContractFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ contracts: Contract[]; total: number; page: number; limit: number }> {
    const page = pagination.page || 1
    const limit = pagination.limit || 20
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'

    const where: any = {}

    if (filters.propertyId) where.propertyId = filters.propertyId
    if (filters.tenantId) where.tenantId = filters.tenantId
    if (filters.ownerId) where.ownerId = filters.ownerId
    if (filters.status) where.status = filters.status

    const total = await prisma.contract.count({ where })

    const contracts = await prisma.contract.findMany({
      where,
      include: contractIncludes,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { contracts, total, page, limit }
  }

  /**
   * Send contract to tenant (DRAFT -> SENT)
   */
  async sendContract(contractId: string, userId: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can send this contract')
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new Error('Can only send draft contracts')
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.SENT },
      include: contractIncludes,
    })

    // Create notification for tenant
    await prisma.notification.create({
      data: {
        userId: contract.tenantId,
        type: 'contract_sent',
        title: 'Nouveau contrat reçu',
        message: 'Un propriétaire vous a envoyé un contrat de location à signer.',
        actionUrl: `/contracts/${contractId}`,
      },
    })

    return updatedContract
  }

  /**
   * Sign contract with signature image and metadata
   */
  async signContract(
    contractId: string,
    userId: string,
    signatureData?: string,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.tenantId !== userId && contract.ownerId !== userId) {
      throw new Error('Unauthorized: You are not part of this contract')
    }

    const now = new Date()
    const updateData: any = {}

    // Build signature metadata for legal value
    const contractContentStr = JSON.stringify(contract.content || '') + JSON.stringify(contract.customClauses || '')
    const contentHash = createHash('sha256').update(contractContentStr).digest('hex')

    const signatureMeta = {
      timestamp: now.toISOString(),
      ip: meta?.ip || 'unknown',
      userAgent: meta?.userAgent || 'unknown',
      contentHash,
    }

    const isOwner = contract.ownerId === userId
    const isTenant = contract.tenantId === userId

    // Merge existing signature metadata
    const existingContent = (contract.content as Record<string, any>) || {}
    const existingSignatureMetadata = existingContent.signatureMetadata || {}

    if (isOwner) {
      // Owner can sign: DRAFT, SENT, SIGNED_TENANT
      const ownerAllowedStatuses: ContractStatus[] = [ContractStatus.DRAFT, ContractStatus.SENT, ContractStatus.SIGNED_TENANT]
      if (!ownerAllowedStatuses.includes(contract.status as ContractStatus)) {
        throw new Error('This contract cannot be signed in its current status')
      }
      if (contract.signedByOwner) {
        throw new Error('You have already signed this contract')
      }
      updateData.ownerSignature = signatureData || null
      updateData.signedByOwner = now

      existingSignatureMetadata.owner = signatureMeta

      // Determine new status
      if (contract.signedByTenant) {
        updateData.status = ContractStatus.COMPLETED
        updateData.signedAt = now
      } else {
        updateData.status = ContractStatus.SIGNED_OWNER
      }
    } else if (isTenant) {
      // Tenant can sign: SENT, SIGNED_OWNER
      const tenantAllowedStatuses: ContractStatus[] = [ContractStatus.SENT, ContractStatus.SIGNED_OWNER]
      if (!tenantAllowedStatuses.includes(contract.status as ContractStatus)) {
        throw new Error('Ce contrat ne peut pas encore être signé. Il doit d\'abord être envoyé par le propriétaire.')
      }
      if (contract.signedByTenant) {
        throw new Error('You have already signed this contract')
      }
      updateData.tenantSignature = signatureData || null
      updateData.signedByTenant = now

      existingSignatureMetadata.tenant = signatureMeta

      if (contract.signedByOwner) {
        updateData.status = ContractStatus.COMPLETED
        updateData.signedAt = now
      } else {
        updateData.status = ContractStatus.SIGNED_TENANT
      }
    }

    // Store signature metadata in content JSON
    updateData.content = {
      ...existingContent,
      signatureMetadata: existingSignatureMetadata,
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: updateData,
      include: contractIncludes,
    })

    // Notify the other party
    const otherUserId = isOwner ? contract.tenantId : contract.ownerId
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'contract_signed',
        title: 'Contrat signé',
        message: `${isOwner ? 'Le propriétaire' : 'Le locataire'} a signé le contrat.`,
        actionUrl: `/contracts/${contractId}`,
      },
    })

    return updatedContract
  }

  /**
   * Activate contract (COMPLETED -> ACTIVE)
   */
  async activateContract(contractId: string, userId: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { property: true },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can activate this contract')
    }

    if (contract.status !== ContractStatus.COMPLETED) {
      throw new Error('Can only activate completed contracts (both parties must have signed)')
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.ACTIVE },
      include: contractIncludes,
    })

    await prisma.property.update({
      where: { id: contract.propertyId },
      data: { status: 'OCCUPIED' },
    })

    return updatedContract
  }

  /**
   * Terminate contract
   */
  async terminateContract(contractId: string, userId: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { property: true },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can terminate this contract')
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new Error('Can only terminate active contracts')
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.TERMINATED },
      include: contractIncludes,
    })

    await prisma.property.update({
      where: { id: contract.propertyId },
      data: { status: 'AVAILABLE' },
    })

    return updatedContract
  }

  /**
   * Cancel contract (SENT, SIGNED_OWNER, SIGNED_TENANT -> CANCELLED)
   */
  async cancelContract(contractId: string, userId: string, reason?: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can cancel this contract')
    }

    const cancellableStatuses: ContractStatus[] = [
      ContractStatus.SENT,
      ContractStatus.SIGNED_OWNER,
      ContractStatus.SIGNED_TENANT,
      ContractStatus.COMPLETED,
    ]

    if (!cancellableStatuses.includes(contract.status as ContractStatus)) {
      throw new Error('Can only cancel contracts that have been sent or partially signed')
    }

    const existingContent = (contract.content as Record<string, any>) || {}

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.CANCELLED,
        content: {
          ...existingContent,
          cancellation: {
            reason: reason || '',
            cancelledAt: new Date().toISOString(),
            cancelledBy: userId,
            previousStatus: contract.status,
          },
        },
      },
      include: contractIncludes,
    })

    // Notify the tenant
    await prisma.notification.create({
      data: {
        userId: contract.tenantId,
        type: 'contract_cancelled',
        title: 'Contrat annulé',
        message: reason
          ? `Le propriétaire a annulé le contrat. Motif : ${reason}`
          : 'Le propriétaire a annulé le contrat.',
        actionUrl: `/contracts/${contractId}`,
      },
    })

    return updatedContract
  }

  /**
   * Get contract statistics for owner
   */
  async getOwnerStatistics(ownerId: string) {
    const [total, active, draft, sent, completed, terminated, expired] = await Promise.all([
      prisma.contract.count({ where: { ownerId } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.ACTIVE } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.DRAFT } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.SENT } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.COMPLETED } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.TERMINATED } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.EXPIRED } }),
    ])

    return { total, active, draft, sent, completed, terminated, expired }
  }

  /**
   * Get contract statistics for tenant
   */
  async getTenantStatistics(tenantId: string) {
    const [total, active, draft, sent, completed, terminated, expired] = await Promise.all([
      prisma.contract.count({ where: { tenantId } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.ACTIVE } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.DRAFT } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.SENT } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.COMPLETED } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.TERMINATED } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.EXPIRED } }),
    ])

    return { total, active, draft, sent, completed, terminated, expired }
  }

  /**
   * Get contract documents
   */
  async getContractDocuments(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    const documents = await prisma.contractDocument.findMany({
      where: { contractId },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return documents
  }

  /**
   * Upload document to contract
   */
  async uploadDocument(
    contractId: string,
    userId: string,
    fileData: {
      fileName: string
      fileSize: number
      mimeType: string
      category: string
      fileUrl: string
    }
  ) {
    // Check if contract exists and validate permissions
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Only owner or tenant can upload documents
    if (contract.ownerId !== userId && contract.tenantId !== userId) {
      throw new Error('Unauthorized to upload document for this contract')
    }

    // Validate file size (5 KB max)
    const MAX_FILE_SIZE = 5 * 1024 // 5 KB in bytes
    if (fileData.fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of 5 KB. Size: ${(fileData.fileSize / 1024).toFixed(2)} KB`)
    }

    // Create document record
    const document = await prisma.contractDocument.create({
      data: {
        contractId,
        uploadedById: userId,
        category: fileData.category,
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        status: 'UPLOADED',
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    return document
  }

  /**
   * Delete document
   */
  async deleteDocument(contractId: string, documentId: string, userId: string) {
    const document = await prisma.contractDocument.findUnique({
      where: { id: documentId },
      include: { contract: true },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    if (document.contractId !== contractId) {
      throw new Error('Document does not belong to this contract')
    }

    // Only uploader or admin can delete
    if (document.uploadedById !== userId) {
      throw new Error('Unauthorized to delete this document')
    }

    await prisma.contractDocument.delete({
      where: { id: documentId },
    })

    return { success: true }
  }

  /**
   * Validate document (admin only)
   */
  async validateDocument(contractId: string, documentId: string) {
    const document = await prisma.contractDocument.findUnique({
      where: { id: documentId },
    })

    if (!document || document.contractId !== contractId) {
      throw new Error('Document not found')
    }

    const updated = await prisma.contractDocument.update({
      where: { id: documentId },
      data: { status: 'VALIDATED', rejectionReason: null },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    return updated
  }

  /**
   * Reject document (admin only)
   */
  async rejectDocument(
    contractId: string,
    documentId: string,
    rejectionReason: string
  ) {
    const document = await prisma.contractDocument.findUnique({
      where: { id: documentId },
    })

    if (!document || document.contractId !== contractId) {
      throw new Error('Document not found')
    }

    const updated = await prisma.contractDocument.update({
      where: { id: documentId },
      data: { status: 'REJECTED', rejectionReason },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    return updated
  }
}

export const contractService = new ContractService()
