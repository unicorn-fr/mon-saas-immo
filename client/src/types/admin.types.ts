export interface PlatformStatistics {
  users: {
    total: number
    owners: number
    tenants: number
    admins: number
    newThisMonth: number
  }
  properties: {
    total: number
    available: number
    occupied: number
    draft: number
  }
  bookings: {
    total: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
  }
  contracts: {
    total: number
    active: number
    draft: number
    terminated: number
    expired: number
  }
  activity: {
    totalViews: number
    totalContacts: number
    totalMessages: number
  }
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'OWNER' | 'TENANT' | 'ADMIN'
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  lastLoginAt?: string
  _count: {
    ownedProperties: number
    bookings: number
    sentMessages: number
  }
}

export interface RecentActivity {
  users: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    createdAt: string
  }>
  properties: Array<{
    id: string
    title: string
    city: string
    status: string
    owner: {
      firstName: string
      lastName: string
    }
    createdAt: string
  }>
  bookings: Array<{
    id: string
    visitDate: string
    status: string
    property: {
      title: string
    }
    tenant: {
      firstName: string
      lastName: string
    }
    createdAt: string
  }>
  contracts: Array<{
    id: string
    status: string
    startDate: string
    property: {
      title: string
    }
    tenant: {
      firstName: string
      lastName: string
    }
    owner: {
      firstName: string
      lastName: string
    }
    createdAt: string
  }>
}
