export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'

export interface SelectionCriteria {
  minSalaryRatio?: number            // e.g. 3 → salary ≥ 3× rent
  requiredGuarantor?: boolean
  acceptedGuarantorTypes?: string[]  // ["physique", "visale"]
  requiredDocCategories?: string[]   // ["IDENTITE", "REVENUS", "SITUATION_PRO"]
  preferredContractTypes?: string[]  // ["CDI"]
  autoPilot?: boolean                // auto-approve qualifying candidates
  minScore?: number                  // 0-100, default 70
}

export interface MatchDetail {
  label: string
  points: number
  maxPoints: number
  status: 'pass' | 'partial' | 'fail' | 'na'
  explanation: string
}

export interface MatchResult {
  score: number
  verdict: 'ELIGIBLE' | 'PARTIAL' | 'INELIGIBLE'
  details: {
    salary: MatchDetail
    guarantor: MatchDetail
    documents: MatchDetail
    contractType: MatchDetail
  }
}

export interface Application {
  id: string
  propertyId: string
  tenantId: string
  status: ApplicationStatus
  score: number
  matchDetails: MatchResult['details'] | null
  coverLetter: string | null
  hasGuarantor: boolean
  guarantorType: string | null
  createdAt: string
  updatedAt: string
  tenant?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    profileMeta?: Record<string, unknown>
  }
  property?: {
    id: string
    title: string
    price: number
    city: string
    address?: string
    images?: string[]
    selectionCriteria?: SelectionCriteria
    ownerId?: string
  }
}

export interface CreateApplicationInput {
  propertyId: string
  coverLetter?: string
  hasGuarantor?: boolean
  guarantorType?: string
}

export const GUARANTOR_TYPES = [
  { value: 'physique', label: 'Garant physique (personne réelle)' },
  { value: 'visale', label: 'Visale (cautionnement Action Logement)' },
]

export const DEFAULT_CRITERIA: SelectionCriteria = {
  minSalaryRatio: 3,
  requiredGuarantor: false,
  acceptedGuarantorTypes: ['physique', 'visale'],
  requiredDocCategories: ['IDENTITE', 'REVENUS', 'SITUATION_PRO'],
  preferredContractTypes: ['CDI'],
  autoPilot: false,
  minScore: 70,
}

export const VERDICT_CONFIG = {
  ELIGIBLE: {
    label: 'Éligible',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '✓',
  },
  PARTIAL: {
    label: 'Dossier incomplet',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: '⚠',
  },
  INELIGIBLE: {
    label: 'Non éligible',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: '✗',
  },
}
