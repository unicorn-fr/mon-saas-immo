export type LeaseType = 'UNFURNISHED' | 'FURNISHED'

export interface Person {
  firstName?: string
  lastName?: string
}

export interface DraftData {
  type?: LeaseType
  property?: {
    address?: string
    postalCode?: string
    city?: string
    inseeCode?: string
    banId?: string
    surface?: number
    rooms?: number
    dpeClass?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
    dpeNumber?: string
  }
  landlord?: Person & { address?: string }
  tenants?: Array<Person & { email?: string }>
  guarantor?: (Person & { address?: string }) | null
  rent?: {
    rentCents?: number
    chargesCents?: number
    depositCents?: number
    startDate?: string
    paymentDay?: number
  }
  source?: 'tunnel' | 'import'
}

export interface Draft {
  data: DraftData
  step: string
  leaseId: string | null
  hasImportFile: boolean
}

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  emailVerified: boolean
  followUpActive: boolean
}

export type ReminderType = 'RENT_RECEIPT' | 'INSURANCE' | 'RENT_REVISION' | 'LEASE_END' | 'INVENTORY_ENTRY'

export interface Reminder {
  id: string
  type: ReminderType
  status: 'TODO' | 'DONE'
  dueDate: string
  leaseId: string
  address: string
  tenantName: string
  tenantEmail: string | null
  rentCents: number
  chargesCents: number
  revision: { blocked: boolean; message: string; newRentCents?: number } | null
}

export interface LeaseSummary {
  id: string
  type: LeaseType
  status: 'ACTIVE' | 'ENDED' | 'IMPORTED'
  startDate: string
  endDate: string
  rentCents: number
  chargesCents: number
  depositCents: number
  paymentDay: number
  property: { id: string; address: string; city: string | null; surface: number | null; rooms: number | null; dpeClass: string | null }
  landlord: { firstName: string; lastName: string; address: string }
  tenants: Array<{ firstName: string; lastName: string; email?: string }>
  guarantor: { firstName: string; lastName: string; address: string } | null
}

export interface LeaseDetails extends LeaseSummary {
  documents: Array<{ id: string; kind: 'LEASE' | 'LEASE_IMPORTED'; version: number; title: string; createdAt: string }>
  reminders: Array<{ id: string; type: ReminderType; dueDate: string }>
}

export interface Today {
  user: User
  summary: { leases: number; rentsExpected: number; rentsReceived: number }
  reminders: Reminder[]
  upcoming: Reminder[]
  leases: LeaseSummary[]
}
