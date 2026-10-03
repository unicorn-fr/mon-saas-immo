/**
 * Fiches Bailio côté site : mêmes champs que le serveur (server/src/domain/contract.ts).
 * Tout est facultatif : une fiche se remplit petit à petit.
 */

type N<T> = T | null | undefined

export type Civility = 'MADAME' | 'MONSIEUR'
export type LandlordKind = 'PERSON' | 'COUPLE' | 'SCI' | 'COMPANY'
export type Dpe = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type LeaseKind = 'VIDE' | 'MEUBLE' | 'ETUDIANT' | 'MOBILITE'

export interface LandlordProfile {
  kind?: N<LandlordKind>
  sciFamily?: N<boolean>
  civility?: N<Civility>
  lastName?: N<string>
  usageName?: N<string>
  firstNames?: N<string>
  birthName?: N<string>
  birthDate?: N<string>
  birthPlace?: N<string>
  coOwners?: N<Array<{ civility?: N<Civility>; firstNames?: N<string>; lastName?: N<string> }>>
  company?: N<{ name?: N<string>; form?: N<string>; siren?: N<string>; seat?: N<string>; representedBy?: N<string>; representativeRole?: N<string> }>
  address?: N<string>
  postalCode?: N<string>
  city?: N<string>
  email?: N<string>
  phone?: N<string>
  agent?: N<{ enabled?: N<boolean>; name?: N<string>; address?: N<string>; cardNumber?: N<string>; cardIssuer?: N<string> }>
  payment?: N<{ holder?: N<string>; iban?: N<string> }>
  signature?: N<string>
}

export const EQUIPMENTS = {
  kitchen: 'Cuisine équipée',
  hob: 'Plaques de cuisson',
  oven: 'Four',
  hood: 'Hotte',
  bathtub: 'Baignoire',
  shower: 'Douche',
  washer: 'Lave-linge',
  shutters: 'Volets roulants',
  doubleGlazing: 'Double vitrage',
  alarm: 'Alarme',
  gate: 'Portail motorisé',
  smokeDetector: 'Détecteur de fumée',
  intercom: 'Interphone',
} as const
export const ANNEXES = {
  garage: 'Garage',
  garden: 'Jardin privatif',
  cellar: 'Cave',
  parking: 'Place de parking',
  balcony: 'Balcon',
  terrace: 'Terrasse',
  attic: 'Grenier',
  shed: 'Abri de jardin',
} as const
export const COMMON_AREAS = {
  elevator: 'Ascenseur',
  bikes: 'Local vélos',
  green: 'Espaces verts',
  bins: 'Local poubelles',
  caretaker: 'Gardien',
  laundry: 'Laverie',
} as const
export const FURNITURE_REQUIRED = {
  bedding: 'Literie avec couette ou couverture',
  blackout: 'Occultation des fenêtres des chambres',
  hob: 'Plaques de cuisson',
  oven: 'Four ou micro-ondes',
  fridge: 'Réfrigérateur avec compartiment congélation',
  dishes: 'Vaisselle pour les repas',
  utensils: 'Ustensiles de cuisine',
  table: 'Table et sièges',
  shelves: 'Étagères de rangement',
  lights: 'Luminaires',
  cleaning: 'Matériel d’entretien ménager',
} as const
export const TENANT_DOCUMENTS = {
  identity: 'Pièce d’identité',
  home: 'Justificatif de domicile',
  activity: 'Justificatif d’activité professionnelle',
  taxNotice: 'Dernier avis d’imposition',
  income: 'Justificatifs de ressources',
} as const
export const MOBILITY_REASONS = {
  FORMATION: 'Formation professionnelle',
  ETUDES: 'Études supérieures',
  APPRENTISSAGE: 'Contrat d’apprentissage',
  STAGE: 'Stage',
  SERVICE_CIVIQUE: 'Service civique',
  MUTATION: 'Mutation professionnelle',
  MISSION: 'Mission temporaire',
} as const

export type EquipmentKey = keyof typeof EQUIPMENTS
export type AnnexKey = keyof typeof ANNEXES
export type CommonKey = keyof typeof COMMON_AREAS
export type FurnitureKey = keyof typeof FURNITURE_REQUIRED

interface Diag {
  date?: N<string>
  fileId?: N<string>
  note?: N<string>
}

export interface PropertyFile {
  label?: N<string>
  address?: N<string>
  postalCode?: N<string>
  city?: N<string>
  inseeCode?: N<string>
  banId?: N<string>
  building?: N<string>
  floorDoor?: N<string>
  lotNumber?: N<string>
  fiscalId?: N<string>
  habitat?: N<'COLLECTIVE' | 'INDIVIDUAL'>
  legalRegime?: N<'MONO' | 'COPRO'>
  furnished?: N<boolean>
  destination?: N<'HABITATION' | 'MIXTE'>
  copro?: N<{ syndic?: N<string>; quotePart?: N<string>; extractsProvided?: N<boolean> }>
  constructionPeriod?: N<'BEFORE_1949' | '1949_1974' | '1975_1989' | '1990_2005' | 'AFTER_2005'>
  permitBefore1997?: N<boolean>
  surface?: N<number>
  rooms?: N<number>
  roomList?: N<Array<{ name: string; level?: N<string>; note?: N<string> }>>
  heating?: N<{ mode?: N<'INDIVIDUAL' | 'COLLECTIVE'>; energy?: N<'GAS' | 'ELECTRIC' | 'HEAT_PUMP' | 'FUEL' | 'WOOD' | 'NETWORK'>; appliance?: N<string>; lastMaintenance?: N<string>; split?: N<string> }>
  hotWater?: N<{ mode?: N<'INDIVIDUAL' | 'COLLECTIVE'>; split?: N<string> }>
  equipments?: N<EquipmentKey[]>
  otherEquipments?: N<string>
  annexes?: N<AnnexKey[]>
  garageNumber?: N<string>
  gardenArea?: N<number>
  commonAreas?: N<CommonKey[]>
  tv?: N<'INDIVIDUAL' | 'COLLECTIVE' | 'CABLE' | 'SATELLITE' | 'NONE'>
  internet?: N<'FIBER' | 'ADSL' | 'NONE'>
  diagnostics?: N<{
    dpe?: N<Diag & { class?: N<Dpe>; ges?: N<Dpe>; number?: N<string>; costMin?: N<number>; costMax?: N<number>; costYear?: N<number> }>
    erp?: N<Diag>
    electricity?: N<Diag & { installOver15?: N<boolean> }>
    gas?: N<Diag & { hasGas?: N<boolean>; installOver15?: N<boolean> }>
    lead?: N<Diag>
    asbestos?: N<Diag>
    noise?: N<Diag & { inZone?: N<boolean> }>
  }>
  market?: N<{ tense?: N<boolean>; refRentCentsM2?: N<number>; refRentMaxCentsM2?: N<number> }>
  furniture?: N<{ present?: N<FurnitureKey[]>; inventory?: N<Array<{ room?: N<string>; item: string; count: number; state?: N<string> }>> }>
  photos?: N<string[]>
  /** Autorisation préalable de mise en location (« permis de louer »). */
  rentalPermit?: N<{ required?: N<boolean>; reference?: N<string>; date?: N<string> }>
  /** Détecteurs de fumée installés (au moins un, obligatoire). */
  smokeDetectors?: N<number>
  /** Clés et moyens d'accès remis : « 2 clés, 1 badge ». */
  keys?: N<string>
  /** Loyer du logement, saisi une fois et repris par l'annonce et le bail. */
  rent?: N<{ rentCents?: N<number>; chargesCents?: N<number>; chargesMode?: N<'PROVISION' | 'PERIODIC' | 'FORFAIT'>; depositCents?: N<number>; paymentDay?: N<number> }>
  ad?: N<{ title?: N<string>; description?: N<string>; rentCents?: N<number>; chargesCents?: N<number>; chargesMode?: N<'PROVISION' | 'FORFAIT'>; depositCents?: N<number>; complementCents?: N<number>; availableFrom?: N<string>; requestedDocs?: N<TenantDocKey[]>; guarantorDocs?: N<boolean> }>
}

export type Situation = 'EMPLOYEE' | 'SELF_EMPLOYED' | 'STUDENT' | 'APPRENTICE' | 'RETIRED' | 'OTHER'
export type DocEntry = { category: TenantDocKey; label?: N<string>; received: boolean; fileId?: N<string> }

export interface Guarantor {
  civility?: N<Civility>
  lastName?: N<string>
  firstNames?: N<string>
  birthDate?: N<string>
  birthPlace?: N<string>
  link?: N<string>
  address?: N<string>
  email?: N<string>
  phone?: N<string>
  situation?: N<Situation>
  employer?: N<string>
  monthlyIncomeCents?: N<number>
  documents?: N<DocEntry[]>
  engagement?: N<'SOLIDAIRE' | 'SIMPLE'>
  duration?: N<'FIXED' | 'OPEN'>
  until?: N<string>
  maxCents?: N<number>
  signMode?: N<'PAPER' | 'ELECTRONIC'>
  signedAt?: N<string>
}

export type TenantDocKey = keyof typeof TENANT_DOCUMENTS

export interface TenantFile {
  civility?: N<Civility>
  lastName?: N<string>
  firstNames?: N<string>
  usageName?: N<string>
  birthDate?: N<string>
  birthPlace?: N<string>
  email?: N<string>
  phone?: N<string>
  currentAddress?: N<string>
  situation?: N<Situation>
  employer?: N<string>
  occupation?: N<string>
  monthlyIncomeCents?: N<number>
  living?: N<'ALONE' | 'COUPLE' | 'COLOCATION'>
  coTenants?: N<Array<{ civility?: N<Civility>; firstNames?: N<string>; lastName?: N<string>; email?: N<string> }>>
  guarantee?: N<'CAUTION' | 'VISALE' | 'GLI' | 'NONE'>
  visaleNumber?: N<string>
  dossierFacileUrl?: N<string>
  guarantor?: N<Guarantor>
  documents?: N<DocEntry[]>
  insurance?: N<{ insurer?: N<string>; expiresAt?: N<string>; fileId?: N<string> }>
  newAddress?: N<string>
}

export interface LeaseTerms {
  kind?: N<LeaseKind>
  colocation?: N<boolean>
  startDate?: N<string>
  durationMonths?: N<number>
  reduced?: N<{ enabled?: N<boolean>; reason?: N<string> }>
  mobilityReason?: N<keyof typeof MOBILITY_REASONS>
  rentCents?: N<number>
  chargesCents?: N<number>
  chargesMode?: N<'PROVISION' | 'PERIODIC' | 'FORFAIT'>
  depositCents?: N<number>
  paymentDay?: N<number>
  paymentTerm?: N<'ADVANCE' | 'ARREARS'>
  paymentMethod?: N<'TRANSFER' | 'CHEQUE' | 'CASH' | 'OTHER'>
  paymentPlace?: N<string>
  zone?: N<{ tense?: N<boolean>; control?: N<boolean>; refRentCentsM2?: N<number>; refRentMaxCentsM2?: N<number>; complementCents?: N<number>; complementJustification?: N<string> }>
  previous?: N<{ rentedWithin18Months?: N<boolean>; lastRentCents?: N<number>; lastPaymentDate?: N<string>; lastRevisionDate?: N<string> }>
  revision?: N<{ enabled?: N<boolean>; date?: N<string>; irlQuarter?: N<string>; irlValue?: N<number> }>
  works?: N<{ sinceLast?: N<string>; increase?: N<string>; decrease?: N<string>; energyContribution?: N<{ enabled?: N<boolean>; monthlyCents?: N<number>; description?: N<string> }> }>
  clauses?: N<{ resolutoire?: N<boolean>; solidarite?: N<boolean>; custom?: N<string[]> }>
  fees?: N<{ tenantVisitFileCents?: N<number>; tenantInventoryCents?: N<number>; landlordCents?: N<number> }>
  signature?: N<{ place?: N<string>; date?: N<string>; mode?: N<'PAPER' | 'ELECTRONIC'> }>
}

export interface Step {
  key: string
  label: string
  done: boolean
  applicable: boolean
}
export interface Completion {
  steps: Step[]
  percent: number
}

export interface DiagnosticRule {
  key: 'dpe' | 'erp' | 'electricity' | 'gas' | 'lead' | 'asbestos' | 'noise'
  label: string
  required: boolean
  reason: string
  validity: string
  annexed: boolean
}

export const KIND_LABEL: Record<LeaseKind, string> = {
  VIDE: 'Location vide',
  MEUBLE: 'Location meublée',
  ETUDIANT: 'Bail étudiant',
  MOBILITE: 'Bail mobilité',
}

export const CONSTRUCTION_LABEL = {
  BEFORE_1949: 'Avant 1949',
  '1949_1974': 'De 1949 à 1974',
  '1975_1989': 'De 1975 à 1989',
  '1990_2005': 'De 1990 à 2005',
  AFTER_2005: 'Après 2005',
} as const

export const ENERGY_LABEL = { GAS: 'Gaz', ELECTRIC: 'Électricité', HEAT_PUMP: 'Pompe à chaleur', FUEL: 'Fioul', WOOD: 'Bois', NETWORK: 'Réseau de chaleur' } as const

export const SITUATION_LABEL = {
  EMPLOYEE: 'Salarié',
  SELF_EMPLOYED: 'Indépendant',
  STUDENT: 'Étudiant',
  APPRENTICE: 'Apprenti',
  RETIRED: 'Retraité',
  OTHER: 'Autre',
} as const

/** Nom affiché d'une personne d'une fiche. */
export function fullName(p: { firstNames?: N<string>; lastName?: N<string>; usageName?: N<string> } | null | undefined): string {
  if (!p) return ''
  return [p.firstNames?.split(/\s+/)[0], p.usageName || p.lastName].filter(Boolean).join(' ')
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}
