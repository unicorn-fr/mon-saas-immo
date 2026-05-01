export type MaintenanceCategory = 'PLOMBERIE' | 'ELECTRICITE' | 'CHAUFFAGE' | 'SERRURERIE' | 'AUTRE'
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  PLOMBERIE: 'Plomberie',
  ELECTRICITE: 'Électricité',
  CHAUFFAGE: 'Chauffage',
  SERRURERIE: 'Serrurerie',
  AUTRE: 'Autre',
}

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  URGENT: 'Urgent',
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
}

export interface AiAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost: { min: number; max: number; currency: 'EUR' }
  advice: string
  platforms: Array<{ name: string; url: string; description: string }>
}

export interface MaintenanceRequest {
  id: string
  propertyId: string
  ownerId: string
  tenantId?: string
  title: string
  description: string
  category: MaintenanceCategory
  priority: MaintenancePriority
  status: MaintenanceStatus
  aiAnalysis?: AiAnalysis
  createdAt: string
  updatedAt: string
  property?: { title: string }
  tenant?: { firstName: string; lastName: string }
}

export interface CreateMaintenanceInput {
  propertyId: string
  title: string
  description: string
  category: MaintenanceCategory
  priority: MaintenancePriority
}
