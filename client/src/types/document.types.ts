export type DocumentCategory =
  | 'DDT_DPE'
  | 'DDT_ERP'
  | 'DDT_CREP'
  | 'DDT_ELECTRICITE'
  | 'DDT_GAZ'
  | 'DDT_BRUIT'
  | 'REGLEMENT_COPRO'
  | 'NOTICE_INFO'
  | 'RIB_BAILLEUR'
  | 'IDENTITE_LOCATAIRE'
  | 'JUSTIFICATIF_DOMICILE'
  | 'CONTRAT_TRAVAIL'
  | 'FICHE_PAIE_1'
  | 'FICHE_PAIE_2'
  | 'FICHE_PAIE_3'
  | 'AVIS_IMPOSITION'
  | 'ATTESTATION_ASSURANCE'
  | 'CAUTIONNEMENT'
  | 'EDL_ENTREE'
  | 'EDL_SORTIE'
  | 'BAIL_SIGNE'
  | 'AUTRE'

export type DocumentStatus = 'PENDING' | 'UPLOADED' | 'VALIDATED' | 'REJECTED'

export interface ContractDocument {
  id: string
  contractId: string
  uploadedBy: string
  category: DocumentCategory
  status: DocumentStatus
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  uploader?: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface DocumentChecklistItem {
  category: DocumentCategory
  label: string
  description: string
  role: 'OWNER' | 'TENANT' | 'BOTH'
  required: boolean
  acceptedTypes: string[] // MIME types
  maxSizeMB: number
}

/**
 * Checklist des documents requis pour un dossier de location complet
 */
export const OWNER_DOCUMENT_CHECKLIST: DocumentChecklistItem[] = [
  {
    category: 'DDT_DPE',
    label: 'Diagnostic de Performance Energetique (DPE)',
    description: 'Obligatoire pour toute mise en location. Valable 10 ans.',
    role: 'OWNER',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'DDT_ERP',
    label: 'Etat des Risques et Pollutions (ERP)',
    description: 'Obligatoire. Valable 6 mois. A renouveler si necessaire.',
    role: 'OWNER',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'DDT_CREP',
    label: 'Constat de Risque d\'Exposition au Plomb (CREP)',
    description: 'Obligatoire pour les immeubles construits avant le 1er janvier 1949.',
    role: 'OWNER',
    required: false,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'DDT_ELECTRICITE',
    label: 'Diagnostic Electricite',
    description: 'Obligatoire si l\'installation electrique a plus de 15 ans. Valable 6 ans.',
    role: 'OWNER',
    required: false,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'DDT_GAZ',
    label: 'Diagnostic Gaz',
    description: 'Obligatoire si l\'installation de gaz a plus de 15 ans. Valable 6 ans.',
    role: 'OWNER',
    required: false,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'DDT_BRUIT',
    label: 'Diagnostic Bruit',
    description: 'Obligatoire si le bien est situe dans une zone d\'exposition au bruit des aerodromes.',
    role: 'OWNER',
    required: false,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'REGLEMENT_COPRO',
    label: 'Reglement de copropriete (extraits)',
    description: 'Extraits relatifs a la destination de l\'immeuble, la jouissance et l\'usage des parties privatives et communes.',
    role: 'OWNER',
    required: false,
    acceptedTypes: ['application/pdf'],
    maxSizeMB: 10,
  },
  {
    category: 'NOTICE_INFO',
    label: 'Notice d\'information',
    description: 'Notice d\'information relative aux obligations du bailleur et du locataire (generee automatiquement).',
    role: 'OWNER',
    required: true,
    acceptedTypes: ['application/pdf'],
    maxSizeMB: 5,
  },
  {
    category: 'RIB_BAILLEUR',
    label: 'RIB du bailleur',
    description: 'Releve d\'Identite Bancaire pour le versement du loyer.',
    role: 'OWNER',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 2,
  },
]

export const TENANT_DOCUMENT_CHECKLIST: DocumentChecklistItem[] = [
  {
    category: 'IDENTITE_LOCATAIRE',
    label: 'Piece d\'identite',
    description: 'Carte nationale d\'identite, passeport ou titre de sejour en cours de validite.',
    role: 'TENANT',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'JUSTIFICATIF_DOMICILE',
    label: 'Justificatif de domicile',
    description: 'Quittance de loyer, facture EDF, attestation d\'hebergement... de moins de 3 mois.',
    role: 'TENANT',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'CONTRAT_TRAVAIL',
    label: 'Contrat de travail ou attestation employeur',
    description: 'Contrat de travail, attestation de l\'employeur, ou certificat de scolarite.',
    role: 'TENANT',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'FICHE_PAIE_1',
    label: 'Fiche de paie (mois M-1)',
    description: 'Bulletin de salaire du mois precedent.',
    role: 'TENANT',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'FICHE_PAIE_2',
    label: 'Fiche de paie (mois M-2)',
    description: 'Bulletin de salaire de l\'avant-dernier mois.',
    role: 'TENANT',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'FICHE_PAIE_3',
    label: 'Fiche de paie (mois M-3)',
    description: 'Bulletin de salaire du mois M-3.',
    role: 'TENANT',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'AVIS_IMPOSITION',
    label: 'Dernier avis d\'imposition',
    description: 'Avis d\'imposition ou de non-imposition sur les revenus N-1.',
    role: 'TENANT',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
  {
    category: 'ATTESTATION_ASSURANCE',
    label: 'Attestation d\'assurance habitation',
    description: 'Attestation d\'assurance couvrant les risques locatifs. A fournir avant la remise des cles.',
    role: 'TENANT',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 5,
  },
]

export const ALL_DOCUMENT_CHECKLIST = [...OWNER_DOCUMENT_CHECKLIST, ...TENANT_DOCUMENT_CHECKLIST]
