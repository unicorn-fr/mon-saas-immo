export type ContractStatus = 'DRAFT' | 'SENT' | 'SIGNED_OWNER' | 'SIGNED_TENANT' | 'COMPLETED' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'

export interface ContractClause {
  id: string
  title: string
  description: string
  enabled: boolean
  isCustom?: boolean
}

export interface Contract {
  id: string
  propertyId: string
  tenantId: string
  ownerId: string
  status: ContractStatus

  // Contract details
  startDate: string
  endDate: string

  // Financial terms
  monthlyRent: number
  charges?: number
  deposit?: number

  // Structured content
  content?: Record<string, any>
  customClauses?: ContractClause[]

  // Documents
  pdfUrl?: string

  // Signatures
  ownerSignature?: string
  tenantSignature?: string
  signedByTenant?: string
  signedByOwner?: string
  signedAt?: string

  // Additional terms
  terms?: string

  // Timestamps
  createdAt: string
  updatedAt: string

  // Relations
  property?: {
    id: string
    title: string
    address: string
    city: string
    postalCode: string
    type?: string
    bedrooms?: number
    bathrooms?: number
    surface?: number
    images?: string[]
  }
  tenant?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  owner?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
}

export interface CreateContractInput {
  propertyId: string
  tenantId: string
  startDate: string
  endDate: string
  monthlyRent: number
  charges?: number
  deposit?: number
  terms?: string
  content?: Record<string, any>
  customClauses?: ContractClause[]
}

export interface UpdateContractInput {
  startDate?: string
  endDate?: string
  monthlyRent?: number
  charges?: number
  deposit?: number
  terms?: string
  status?: ContractStatus
  content?: Record<string, any>
  customClauses?: ContractClause[]
}

export interface ContractFilters {
  propertyId?: string
  tenantId?: string
  ownerId?: string
  status?: ContractStatus
}

export interface ContractStatistics {
  total: number
  active: number
  draft: number
  sent: number
  completed: number
  terminated: number
  expired: number
}
