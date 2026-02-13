import { PrismaClient, ContractStatus, Contract } from '@prisma/client'

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
}

export interface UpdateContractInput {
  startDate?: Date
  endDate?: Date
  monthlyRent?: number
  charges?: number
  deposit?: number
  terms?: string
  status?: ContractStatus
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

class ContractService {
  /**
   * Create a new contract
   */
  async createContract(data: CreateContractInput): Promise<Contract> {
    // Validate dates
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new Error('End date must be after start date')
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    // Check if owner owns the property
    if (property.ownerId !== data.ownerId) {
      throw new Error('Unauthorized: You do not own this property')
    }

    // Check if tenant exists
    const tenant = await prisma.user.findUnique({
      where: { id: data.tenantId },
    })

    if (!tenant || tenant.role !== 'TENANT') {
      throw new Error('Tenant not found or invalid role')
    }

    // Check for overlapping active contracts for this property
    const overlappingContract = await prisma.contract.findFirst({
      where: {
        propertyId: data.propertyId,
        status: {
          in: [ContractStatus.ACTIVE, ContractStatus.DRAFT],
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

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        startDate: data.startDate,
        endDate: data.endDate,
        monthlyRent: data.monthlyRent,
        charges: data.charges,
        deposit: data.deposit,
        terms: data.terms,
        status: ContractStatus.DRAFT,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            postalCode: true,
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
      },
    })

    return contract
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string, userId: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
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
      },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Check authorization
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
      include: { property: true },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Only owner can update contract
    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can update this contract')
    }

    // Cannot update active or expired contracts
    if (contract.status === ContractStatus.EXPIRED) {
      throw new Error('Cannot update expired contract')
    }

    // Validate dates if provided
    if (data.startDate && data.endDate) {
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new Error('End date must be after start date')
      }
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            postalCode: true,
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
      },
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

    // Only owner can delete contract
    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can delete this contract')
    }

    // Can only delete draft contracts
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

    // Build where clause
    const where: any = {}

    if (filters.propertyId) where.propertyId = filters.propertyId
    if (filters.tenantId) where.tenantId = filters.tenantId
    if (filters.ownerId) where.ownerId = filters.ownerId
    if (filters.status) where.status = filters.status

    // Count total
    const total = await prisma.contract.count({ where })

    // Fetch contracts
    const contracts = await prisma.contract.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            postalCode: true,
            images: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    })

    return {
      contracts,
      total,
      page,
      limit,
    }
  }

  /**
   * Activate contract (both parties have signed)
   */
  async activateContract(contractId: string, userId: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { property: true },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Only owner can activate
    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can activate this contract')
    }

    // Must be in DRAFT status
    if (contract.status !== ContractStatus.DRAFT) {
      throw new Error('Can only activate draft contracts')
    }

    // Both parties must have signed
    if (!contract.signedByTenant || !contract.signedByOwner) {
      throw new Error('Both parties must sign before activation')
    }

    // Update contract status
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.ACTIVE },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Update property status to OCCUPIED
    await prisma.property.update({
      where: { id: contract.propertyId },
      data: { status: 'OCCUPIED' },
    })

    return updatedContract
  }

  /**
   * Sign contract (tenant or owner)
   */
  async signContract(contractId: string, userId: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Check authorization
    if (contract.tenantId !== userId && contract.ownerId !== userId) {
      throw new Error('Unauthorized: You are not part of this contract')
    }

    // Must be in DRAFT status
    if (contract.status !== ContractStatus.DRAFT) {
      throw new Error('Can only sign draft contracts')
    }

    const now = new Date()
    const updateData: any = {}

    if (contract.tenantId === userId) {
      if (contract.signedByTenant) {
        throw new Error('You have already signed this contract')
      }
      updateData.signedByTenant = now
    } else if (contract.ownerId === userId) {
      if (contract.signedByOwner) {
        throw new Error('You have already signed this contract')
      }
      updateData.signedByOwner = now
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
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

    // Only owner can terminate
    if (contract.ownerId !== userId) {
      throw new Error('Unauthorized: Only the owner can terminate this contract')
    }

    // Must be ACTIVE
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new Error('Can only terminate active contracts')
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.TERMINATED },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Update property status back to AVAILABLE
    await prisma.property.update({
      where: { id: contract.propertyId },
      data: { status: 'AVAILABLE' },
    })

    return updatedContract
  }

  /**
   * Get contract statistics for owner
   */
  async getOwnerStatistics(ownerId: string) {
    const [total, active, draft, terminated, expired] = await Promise.all([
      prisma.contract.count({ where: { ownerId } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.ACTIVE } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.DRAFT } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.TERMINATED } }),
      prisma.contract.count({ where: { ownerId, status: ContractStatus.EXPIRED } }),
    ])

    return {
      total,
      active,
      draft,
      terminated,
      expired,
    }
  }

  /**
   * Get contract statistics for tenant
   */
  async getTenantStatistics(tenantId: string) {
    const [total, active, draft, terminated, expired] = await Promise.all([
      prisma.contract.count({ where: { tenantId } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.ACTIVE } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.DRAFT } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.TERMINATED } }),
      prisma.contract.count({ where: { tenantId, status: ContractStatus.EXPIRED } }),
    ])

    return {
      total,
      active,
      draft,
      terminated,
      expired,
    }
  }
}

export const contractService = new ContractService()
