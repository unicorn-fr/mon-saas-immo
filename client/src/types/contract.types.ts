export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'

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

  // Documents
  pdfUrl?: string
  signedByTenant?: string
  signedByOwner?: string

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
}

export interface UpdateContractInput {
  startDate?: string
  endDate?: string
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

export interface ContractStatistics {
  total: number
  active: number
  draft: number
  terminated: number
  expired: number
}
