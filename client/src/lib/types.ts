export type LeaseType = 'UNFURNISHED' | 'FURNISHED'

export interface Person {
  civility?: 'MADAME' | 'MONSIEUR'
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
    floorDoor?: string
    habitat?: 'COLLECTIVE' | 'INDIVIDUAL'
    legalRegime?: 'MONO' | 'COPRO'
    constructionPeriod?: 'BEFORE_1949' | '1949_1974' | '1975_1989' | '1990_2005' | 'AFTER_2005'
    heatingMode?: 'INDIVIDUAL' | 'COLLECTIVE'
    heatingEnergy?: 'GAS' | 'ELECTRIC' | 'HEAT_PUMP' | 'FUEL' | 'WOOD' | 'NETWORK'
    hotWaterMode?: 'INDIVIDUAL' | 'COLLECTIVE'
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
    chargesMode?: 'PROVISION' | 'FORFAIT'
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
  notifyWeekly?: boolean
  notifyUrgent?: boolean
}
