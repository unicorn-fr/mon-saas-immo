import type { Completion, DiagnosticRule, Guarantor, LandlordProfile, LeaseKind, LeaseTerms, PropertyFile, TenantFile } from './contract'
import type { User } from './types'

/** Réponses de l'API de l'espace propriétaire (server/src/routes). */

export type RentKey = 'DRAFT' | 'UPCOMING' | 'PAID' | 'PARTIAL' | 'LATE' | 'EXPECTED'
export interface RentStatus {
  key: RentKey
  label: string
  lateDays: number
}

export type LeaseStatus = 'DRAFT' | 'ACTIVE' | 'ENDED' | 'IMPORTED'

export interface ProfileView {
  profile: LandlordProfile
  completion: Completion
  user?: User
}

export interface PropertySummary {
  id: string
  name: string
  address: string
  city: string | null
  kindLabel: string
  surface: number | null
  rooms: number | null
  floor: string | null
  furnished: boolean | null
  dpeClass: string | null
  completion: number
  status: 'RENTED' | 'AVAILABLE'
  lease: null | {
    id: string
    status: LeaseStatus
    tenantName: string
    totalCents: number
    startDate: string
    endDate: string
    rent: RentStatus
  }
}

export interface Expense {
  id: string
  vendor: string
  description: string | null
  category: 'REPAIR' | 'MAINTENANCE' | 'TAX' | 'COPRO' | 'INSURANCE' | 'OTHER'
  categoryLabel: string
  amountCents: number
  recoverableCents: number
  chargeTo: 'OWNER' | 'TENANT'
  status: 'OK' | 'TO_VERIFY'
  date: string
  documentId: string | null
  propertyId: string | null
  propertyName: string | null
}

export interface DocRow {
  id: string
  kind: DocKind
  title: string
  createdAt: string
  origin: 'GENERATED' | 'UPLOADED' | string
  period: string | null
  leaseId: string | null
  version: number
}

export type DocKind = 'LEASE' | 'LEASE_IMPORTED' | 'RECEIPT' | 'PARTIAL_RECEIPT' | 'RENT_NOTICE' | 'GUARANTEE' | 'INVENTORY' | 'INVOICE' | 'DIAGNOSTIC' | 'LETTER' | 'OTHER'

export interface PropertyDetails extends PropertySummary {
  file: PropertyFile
  completion: never
  diagnostics: DiagnosticRule[]
  energyWarning: string | null
  rentControlLikely: boolean
  leases: Array<{ id: string; status: LeaseStatus; kind: LeaseKind; tenantName: string; startDate: string; endDate: string; rentCents: number; chargesCents: number; depositCents: number; rent: RentStatus }>
  tenants: Array<{ id: string; name: string }>
  year: { year: number; incomeCents: number; expensesCents: number }
  events: Array<{ date: string; kind: string; title: string; detail: string }>
  expenses: Array<Pick<Expense, 'id' | 'vendor' | 'description' | 'amountCents' | 'date' | 'category' | 'status' | 'chargeTo'>>
  documents: DocRow[]
  inventories: Array<{ id: string; kind: 'ENTRY' | 'EXIT'; status: 'DRAFT' | 'SIGNED'; leaseId: string; date: string | null; createdAt: string }>
}
/** La fiche détaillée renvoie la complétude complète (étapes) à la place du pourcentage. */
export interface LeaseBlocker {
  key: string
  label: string
  section: string
  level?: 'ESSENTIAL' | 'RECOMMENDED'
}
/** Mise en location d'un logement, étape par étape (server/src/domain/rental.ts). */
export interface RentalStep {
  key: 'PROPERTY' | 'AD' | 'CANDIDATES' | 'TENANT' | 'LEASE' | 'CHECK' | 'SIGN' | 'INVENTORY' | 'DEPOSIT' | 'INSURANCE' | 'RENT'
  title: string
  text: string
  state: 'DONE' | 'TODO' | 'WAITING' | 'LOCKED' | 'SKIPPED'
  optional?: boolean
  action?: { label: string; to: string }
}
export type PropertyView = Omit<PropertyDetails, 'completion'> & { completion: Completion; leaseMissing?: LeaseBlocker[]; journey?: RentalStep[] }

export interface TenantSummary {
  id: string
  name: string
  initials: string
  email: string | null
  phone: string | null
  property: { id: string; name: string } | null
  totalCents: number | null
  leaseId: string | null
  situation: string
  completion: number
}

export interface TenantView extends Omit<TenantSummary, 'completion'> {
  propertyId: string | null
  homes: Array<{ id: string; name: string; leaseId: string | null; status: string | null; startDate: string | null; endDate: string | null }>
  file: TenantFile
  completion: Completion
  guarantorCompletion: Completion | null
  lease: null | {
    id: string
    status: LeaseStatus
    kind: LeaseKind
    startDate: string
    endDate: string
    rentCents: number
    chargesCents: number
    depositCents: number
    chargesMode: 'PROVISION' | 'PERIODIC' | 'FORFAIT'
    property: { id: string; name: string }
  }
  payments: Payment[]
}

export interface Payment {
  period: string
  amountCents: number
  receivedAt: string
  full: boolean
}

export interface LeaseListItem {
  id: string
  status: LeaseStatus
  kind: LeaseKind
  property: { id: string; name: string }
  tenantName: string
  startDate: string
  endDate: string
  rentCents: number
  chargesCents: number
  rent: RentStatus
}

export interface LeaseComputed {
  kind: LeaseKind
  durationMonths: number
  endDate: string | null
  renewal: string
  noticeMonths: number
  maxDepositCents: number | null
  chargesModes: Array<'PROVISION' | 'PERIODIC' | 'FORFAIT'>
  revisionAllowed: boolean
  energyWarning: string | null
  rentControlLikely: boolean
  firstPayment: null | { fullMonth: boolean; days: number; daysInMonth: number; rentCents: number; chargesCents: number }
  clauseWarnings: Array<{ clause: string; reasons: string[] }>
  diagnostics: DiagnosticRule[]
  reducedAllowed: boolean
}

export interface LeaseView {
  id: string
  status: LeaseStatus
  ready: boolean
  /** Mentions obligatoires manquantes, avec le lien vers la fiche à compléter. */
  checklist: MissingItem[]
  /** Signature en ligne en cours : le contrat est figé. */
  esignPending: boolean
  /** Ancien bail du tunnel enregistré comme signé alors qu'il est incomplet. */
  reopen?: { missing: number; allowed: boolean } | null
  dirty: boolean
  checkedAt?: string | null
  signedAt: string | null
  kind: LeaseKind
  property: { id: string; name: string; address: string }
  tenantIds: string[]
  tenantName: string
  tenants: Array<{ id: string; name: string; email: string | null }>
  guarantors: Array<{ tenantId: string; name: string }>
  terms: LeaseTerms
  contract: { landlord: LandlordProfile; property: PropertyFile; tenants: TenantFile[]; guarantors: Guarantor[] }
  computed: LeaseComputed
  completion: Completion
  columns: { startDate: string; endDate: string; rentCents: number; chargesCents: number; depositCents: number; paymentDay: number }
  rent: RentStatus
  annexes: Array<{ key: string; label: string; status: string; done: boolean }>
  payments: Payment[]
  documents: DocRow[]
  leaseDocumentId: string | null
  inventories: Array<{ id: string; kind: 'ENTRY' | 'EXIT'; status: 'DRAFT' | 'SIGNED'; date: string | null }>
  reminders: Array<{ id: string; type: string; dueDate: string }>
  facts?: { tenantNotice: { receivedDate: string; reduced: boolean; reducedReason: string | null; endDate: string } | null; keysDate: string | null; eReceiptConsent?: { email: string; at: string } | null }
}

export interface Task {
  id: string
  type: 'LATE_RENT' | 'PARTIAL_RENT' | 'REVISION' | 'INSURANCE' | 'INVOICE' | 'INVENTORY' | 'LEASE_END' | 'CHARGES' | 'DRAFT_LEASE' | 'DEPARTURE' | 'SETTLEMENT' | 'BOILER' | 'STEP'
  tag: string
  tone: 'error' | 'owner' | 'caramel' | 'green'
  place: string
  title: string
  text?: string
  leaseId?: string
  propertyId?: string
  reminderId?: string
  expenseId?: string
  inventoryId?: string
  amountCents?: number
  period?: string
  step?: { key: string; label: string; to: string; optional: boolean }
}

export interface TodayView {
  user: User
  date: string
  stats: { rentsExpected: number; rentsReceived: number; cashedCents: number; month: string }
  tasks: Task[]
  upcoming: Array<{ date: string; label: string }>
  properties: Array<{ id: string; name: string; status: { label: string; tone: 'green' | 'error' | 'owner' | 'caramel' | 'muted' } }>
  counts: { properties: number; tenants: number; leases: number; signedLeases?: number }
}

export interface MoneyView {
  year: number
  incomeCents: number
  expensesCents: number
  netCents: number
  byMonth: Array<{ month: number; receivedCents: number; expectedCents: number }>
  expenses: Expense[]
}

export interface DocumentItem {
  id: string
  kind: DocKind
  group: 'LEASES' | 'RECEIPTS' | 'INVENTORIES' | 'INVOICES' | 'DIAGNOSTICS' | 'LETTERS' | 'OTHER'
  title: string
  version: number
  period: string | null
  origin: string
  mimeType: string
  date: string
  leaseId: string | null
  propertyId: string | null
  propertyName: string | null
}

export interface InvoiceReading {
  vendor: string | null
  amountCents: number | null
  date: string | null
  address: string | null
  description: string | null
  category: Expense['category']
  tenantRepairHint: string | null
}

export interface ExpenseDetails extends Expense {
  document: null | { id: string; mimeType: string; title: string; meta: { reading?: InvoiceReading; matchedBy?: string | null } | null; createdAt: string }
}

export type LetterType =
  | 'REVISION'
  | 'INSURANCE'
  | 'REMINDER'
  | 'FORMAL_NOTICE'
  | 'NOTICE_TO_LEAVE'
  | 'TENANT_NOTICE'
  | 'CHARGES'
  | 'DEPOSIT_RETURN'
  | 'GUARANTOR_CALL'
  | 'NUISANCE'
  | 'DAMAGE_REPAIR'
  | 'BOILER'
  | 'SHORT_NOTICE_PROOF'
  | 'RENT_CERTIFICATE'
  | 'DEPOSIT_RECEIPT'
  | 'OWNER_CHANGE'
  | 'SMOKE_DETECTOR'
  | 'E_RECEIPT_CONSENT'
  | 'INSURANCE_CLAIM'
  | 'CONTRACTOR_CLAIM'

export const LETTER_TITLES: Record<LetterType, string> = {
  REVISION: 'Révision annuelle du loyer',
  INSURANCE: 'Demande d’attestation d’assurance',
  REMINDER: 'Relance amiable',
  FORMAL_NOTICE: 'Mise en demeure',
  NOTICE_TO_LEAVE: 'Congé donné par le bailleur',
  TENANT_NOTICE: 'Accusé de réception du congé du locataire',
  CHARGES: 'Régularisation annuelle des charges',
  DEPOSIT_RETURN: 'Restitution du dépôt de garantie et solde de tout compte',
  GUARANTOR_CALL: 'Appel à la caution',
  NUISANCE: 'Mise en demeure de cesser un trouble',
  DAMAGE_REPAIR: 'Demande de réparation des dégradations',
  BOILER: 'Demande d’attestation d’entretien de la chaudière',
  SHORT_NOTICE_PROOF: 'Demande de justificatif pour un préavis d’un mois',
  RENT_CERTIFICATE: 'Attestation de loyer',
  DEPOSIT_RECEIPT: 'Reçu du dépôt de garantie',
  OWNER_CHANGE: 'Changement de propriétaire',
  SMOKE_DETECTOR: 'Attestation d’installation de détecteurs de fumée',
  E_RECEIPT_CONSENT: 'Accord pour recevoir les quittances par email',
  INSURANCE_CLAIM: 'Déclaration de sinistre à l’assureur',
  CONTRACTOR_CLAIM: 'Réclamation à un artisan',
}

export interface LetterDefaults {
  title: string
  letter: Record<string, unknown> & { type: LetterType }
  note: string | null
  recipient: { name: string; address: string }
  /** Saisie en cours enregistrée automatiquement (date), ou null si les valeurs viennent de Bailio. */
  draftSavedAt: string | null
}

export const STATES = ['Neuf', 'Bon', 'Usé', 'Mauvais', 'Hors service'] as const
export type ItemState = (typeof STATES)[number]

export interface InventoryData {
  date?: string | null
  time?: string | null
  present?: string | null
  agent?: string | null
  entryDate?: string | null
  newAddress?: string | null
  meters?: Array<{ key: string; label: string; number?: string | null; index?: string | null; photoId?: string | null; notApplicable?: boolean | null }> | null
  heating?: { state?: ItemState | null; note?: string | null; lastMaintenance?: string | null } | null
  keys?: Array<{ type: string; count: number; destination?: string | null }> | null
  rooms?: Array<{ name: string; done?: boolean | null; items: Array<{ label: string; state?: ItemState | null; note?: string | null; photoIds?: string[] | null }>; note?: string | null }> | null
  furniture?: Array<{ item: string; count: number; state?: ItemState | null; note?: string | null }> | null
  vetusteGrid?: boolean | null
  notes?: string | null
  signatures?: { landlord?: string | null; tenant?: string | null; signedAt?: string | null } | null
}

export interface InventoryView {
  id: string
  kind: 'ENTRY' | 'EXIT'
  status: 'DRAFT' | 'SIGNED'
  data: InventoryData
  progress: { meters: boolean; rooms: number; roomsTotal: number; keys: boolean; signed: boolean }
  lease: { id: string; startDate: string; furnished: boolean }
  property: { id: string; name: string; address: string }
  landlordName: string
  tenantName: string
}

export interface MissingItem {
  key: string
  label: string
  where: 'LANDLORD' | 'PROPERTY' | 'TENANT' | 'TERMS' | 'GUARANTOR'
  to: string
  /** ESSENTIAL : bloque le bail ; RECOMMENDED : le bail laisse une ligne à compléter. */
  level?: 'ESSENTIAL' | 'RECOMMENDED'
}
