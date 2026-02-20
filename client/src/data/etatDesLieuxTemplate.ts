/**
 * Template Etat des Lieux (EDL)
 * Conforme au decret n°2016-382 du 30 mars 2016
 * et a la Loi ALUR du 24 mars 2014
 *
 * Utilise pour l'entree ET la sortie (champ typeEDL)
 */

export type EDLType = 'ENTREE' | 'SORTIE'

export type EtatElement = 'BON' | 'USAGE' | 'MAUVAIS' | 'NEUF' | 'NA'

export interface EDLRoom {
  id: string
  name: string
  elements: EDLElement[]
}

export interface EDLElement {
  id: string
  label: string
  etat: EtatElement
  observation: string
}

export interface EDLCompteur {
  type: 'EAU_FROIDE' | 'EAU_CHAUDE' | 'ELECTRICITE' | 'GAZ'
  label: string
  numero: string
  releve: string
}

export interface EDLCle {
  type: string
  quantite: number
  description: string
}

export interface EtatDesLieux {
  type: EDLType
  date: string

  // Parties
  bailleur: {
    nom: string
    prenom: string
    represente?: string // Mandataire ou representant
  }
  locataire: {
    nom: string
    prenom: string
  }

  // Bien
  adresse: string
  codePostal: string
  ville: string
  typeLogement: string
  surface: number
  etage?: string

  // Pieces et elements
  rooms: EDLRoom[]

  // Compteurs
  compteurs: EDLCompteur[]

  // Cles
  cles: EDLCle[]

  // Observations generales
  observationsGenerales: string

  // Signatures
  signatureBailleur?: string
  signatureLocataire?: string
  dateSignature?: string
}

/**
 * Liste des pieces par defaut et leurs elements a inspecter
 */
export const DEFAULT_EDL_ROOMS: EDLRoom[] = [
  {
    id: 'entree',
    name: 'Entree / Couloir',
    elements: [
      { id: 'entree_porte', label: 'Porte d\'entree (etat, serrure, seuil)', etat: 'BON', observation: '' },
      { id: 'entree_interphone', label: 'Interphone / Digicode', etat: 'BON', observation: '' },
      { id: 'entree_sol', label: 'Sol (type et etat)', etat: 'BON', observation: '' },
      { id: 'entree_murs', label: 'Murs (peinture, papier peint)', etat: 'BON', observation: '' },
      { id: 'entree_plafond', label: 'Plafond', etat: 'BON', observation: '' },
      { id: 'entree_eclairage', label: 'Eclairage / Interrupteur', etat: 'BON', observation: '' },
      { id: 'entree_prises', label: 'Prises electriques', etat: 'BON', observation: '' },
      { id: 'entree_placard', label: 'Placard(s)', etat: 'NA', observation: '' },
    ],
  },
  {
    id: 'sejour',
    name: 'Sejour / Salon',
    elements: [
      { id: 'sejour_sol', label: 'Sol (type et etat)', etat: 'BON', observation: '' },
      { id: 'sejour_murs', label: 'Murs (peinture, papier peint)', etat: 'BON', observation: '' },
      { id: 'sejour_plafond', label: 'Plafond', etat: 'BON', observation: '' },
      { id: 'sejour_fenetres', label: 'Fenetres (vitrage, joints, volets)', etat: 'BON', observation: '' },
      { id: 'sejour_eclairage', label: 'Eclairage / Interrupteurs', etat: 'BON', observation: '' },
      { id: 'sejour_prises', label: 'Prises electriques / TV / Telephone', etat: 'BON', observation: '' },
      { id: 'sejour_chauffage', label: 'Radiateur / Chauffage', etat: 'BON', observation: '' },
      { id: 'sejour_detecteur', label: 'Detecteur de fumee', etat: 'BON', observation: '' },
    ],
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    elements: [
      { id: 'cuisine_sol', label: 'Sol (type et etat)', etat: 'BON', observation: '' },
      { id: 'cuisine_murs', label: 'Murs (peinture, carrelage)', etat: 'BON', observation: '' },
      { id: 'cuisine_plafond', label: 'Plafond', etat: 'BON', observation: '' },
      { id: 'cuisine_fenetre', label: 'Fenetre (vitrage, joints)', etat: 'BON', observation: '' },
      { id: 'cuisine_eclairage', label: 'Eclairage / Interrupteurs', etat: 'BON', observation: '' },
      { id: 'cuisine_prises', label: 'Prises electriques', etat: 'BON', observation: '' },
      { id: 'cuisine_evier', label: 'Evier et robinetterie', etat: 'BON', observation: '' },
      { id: 'cuisine_plaques', label: 'Plaques de cuisson', etat: 'BON', observation: '' },
      { id: 'cuisine_four', label: 'Four', etat: 'NA', observation: '' },
      { id: 'cuisine_hotte', label: 'Hotte aspirante', etat: 'NA', observation: '' },
      { id: 'cuisine_meubles', label: 'Meubles de cuisine (haut/bas)', etat: 'BON', observation: '' },
      { id: 'cuisine_ventilation', label: 'Ventilation / VMC', etat: 'BON', observation: '' },
    ],
  },
  {
    id: 'chambre1',
    name: 'Chambre 1',
    elements: [
      { id: 'ch1_sol', label: 'Sol (type et etat)', etat: 'BON', observation: '' },
      { id: 'ch1_murs', label: 'Murs (peinture, papier peint)', etat: 'BON', observation: '' },
      { id: 'ch1_plafond', label: 'Plafond', etat: 'BON', observation: '' },
      { id: 'ch1_fenetres', label: 'Fenetres (vitrage, joints, volets)', etat: 'BON', observation: '' },
      { id: 'ch1_eclairage', label: 'Eclairage / Interrupteurs', etat: 'BON', observation: '' },
      { id: 'ch1_prises', label: 'Prises electriques', etat: 'BON', observation: '' },
      { id: 'ch1_chauffage', label: 'Radiateur / Chauffage', etat: 'BON', observation: '' },
      { id: 'ch1_placard', label: 'Placard(s)', etat: 'NA', observation: '' },
    ],
  },
  {
    id: 'chambre2',
    name: 'Chambre 2',
    elements: [
      { id: 'ch2_sol', label: 'Sol (type et etat)', etat: 'BON', observation: '' },
      { id: 'ch2_murs', label: 'Murs (peinture, papier peint)', etat: 'BON', observation: '' },
      { id: 'ch2_plafond', label: 'Plafond', etat: 'BON', observation: '' },
      { id: 'ch2_fenetres', label: 'Fenetres (vitrage, joints, volets)', etat: 'BON', observation: '' },
      { id: 'ch2_eclairage', label: 'Eclairage / Interrupteurs', etat: 'BON', observation: '' },
      { id: 'ch2_prises', label: 'Prises electriques', etat: 'BON', observation: '' },
      { id: 'ch2_chauffage', label: 'Radiateur / Chauffage', etat: 'BON', observation: '' },
      { id: 'ch2_placard', label: 'Placard(s)', etat: 'NA', observation: '' },
    ],
  },
  {
    id: 'sdb',
    name: 'Salle de bain',
    elements: [
      { id: 'sdb_sol', label: 'Sol (type et etat)', etat: 'BON', observation: '' },
      { id: 'sdb_murs', label: 'Murs (peinture, carrelage, joints)', etat: 'BON', observation: '' },
      { id: 'sdb_plafond', label: 'Plafond', etat: 'BON', observation: '' },
      { id: 'sdb_fenetre', label: 'Fenetre', etat: 'NA', observation: '' },
      { id: 'sdb_eclairage', label: 'Eclairage / Interrupteurs', etat: 'BON', observation: '' },
      { id: 'sdb_prises', label: 'Prises electriques', etat: 'BON', observation: '' },
      { id: 'sdb_baignoire', label: 'Baignoire / Douche', etat: 'BON', observation: '' },
      { id: 'sdb_lavabo', label: 'Lavabo et robinetterie', etat: 'BON', observation: '' },
      { id: 'sdb_wc', label: 'WC (cuvette, chasse d\'eau)', etat: 'BON', observation: '' },
      { id: 'sdb_miroir', label: 'Miroir', etat: 'NA', observation: '' },
      { id: 'sdb_ventilation', label: 'Ventilation / VMC', etat: 'BON', observation: '' },
      { id: 'sdb_chauffage', label: 'Seche-serviettes / Radiateur', etat: 'NA', observation: '' },
    ],
  },
  {
    id: 'wc',
    name: 'WC separe',
    elements: [
      { id: 'wc_sol', label: 'Sol (type et etat)', etat: 'BON', observation: '' },
      { id: 'wc_murs', label: 'Murs', etat: 'BON', observation: '' },
      { id: 'wc_plafond', label: 'Plafond', etat: 'BON', observation: '' },
      { id: 'wc_cuvette', label: 'Cuvette et chasse d\'eau', etat: 'BON', observation: '' },
      { id: 'wc_lavabo', label: 'Lave-mains', etat: 'NA', observation: '' },
      { id: 'wc_eclairage', label: 'Eclairage', etat: 'BON', observation: '' },
      { id: 'wc_ventilation', label: 'Ventilation', etat: 'BON', observation: '' },
    ],
  },
  {
    id: 'exterieur',
    name: 'Exterieur / Parties privatives',
    elements: [
      { id: 'ext_balcon', label: 'Balcon / Terrasse', etat: 'NA', observation: '' },
      { id: 'ext_jardin', label: 'Jardin', etat: 'NA', observation: '' },
      { id: 'ext_cave', label: 'Cave', etat: 'NA', observation: '' },
      { id: 'ext_parking', label: 'Parking / Garage', etat: 'NA', observation: '' },
      { id: 'ext_boite_lettres', label: 'Boite aux lettres', etat: 'BON', observation: '' },
    ],
  },
]

export const DEFAULT_COMPTEURS: EDLCompteur[] = [
  { type: 'ELECTRICITE', label: 'Electricite', numero: '', releve: '' },
  { type: 'GAZ', label: 'Gaz', numero: '', releve: '' },
  { type: 'EAU_FROIDE', label: 'Eau froide', numero: '', releve: '' },
  { type: 'EAU_CHAUDE', label: 'Eau chaude', numero: '', releve: '' },
]

export const DEFAULT_CLES: EDLCle[] = [
  { type: 'Cle porte d\'entree immeuble', quantite: 0, description: '' },
  { type: 'Cle porte d\'entree logement', quantite: 0, description: '' },
  { type: 'Cle boite aux lettres', quantite: 0, description: '' },
  { type: 'Cle cave', quantite: 0, description: '' },
  { type: 'Badge / Bip parking', quantite: 0, description: '' },
  { type: 'Telecommande portail', quantite: 0, description: '' },
]

export const ETAT_LABELS: Record<EtatElement, string> = {
  NEUF: 'Neuf',
  BON: 'Bon etat',
  USAGE: 'Etat d\'usage',
  MAUVAIS: 'Mauvais etat',
  NA: 'Non applicable',
}

export const ETAT_COLORS: Record<EtatElement, string> = {
  NEUF: 'text-blue-600 bg-blue-50',
  BON: 'text-green-600 bg-green-50',
  USAGE: 'text-yellow-600 bg-yellow-50',
  MAUVAIS: 'text-red-600 bg-red-50',
  NA: 'text-gray-400 bg-gray-50',
}

/**
 * Cree un nouvel etat des lieux vierge
 */
export function createEmptyEDL(type: EDLType): EtatDesLieux {
  return {
    type,
    date: new Date().toISOString().split('T')[0],
    bailleur: { nom: '', prenom: '' },
    locataire: { nom: '', prenom: '' },
    adresse: '',
    codePostal: '',
    ville: '',
    typeLogement: '',
    surface: 0,
    rooms: DEFAULT_EDL_ROOMS.map(room => ({
      ...room,
      elements: room.elements.map(el => ({ ...el })),
    })),
    compteurs: DEFAULT_COMPTEURS.map(c => ({ ...c })),
    cles: DEFAULT_CLES.map(c => ({ ...c })),
    observationsGenerales: '',
  }
}

/**
 * Pre-remplit un EDL a partir des donnees d'un contrat
 */
export function prefillEDLFromContract(
  type: EDLType,
  contract: {
    owner?: { firstName: string; lastName: string }
    tenant?: { firstName: string; lastName: string }
    property?: { address: string; city: string; postalCode: string; type?: string; surface?: number }
  }
): EtatDesLieux {
  const edl = createEmptyEDL(type)
  edl.bailleur = {
    nom: contract.owner?.lastName || '',
    prenom: contract.owner?.firstName || '',
  }
  edl.locataire = {
    nom: contract.tenant?.lastName || '',
    prenom: contract.tenant?.firstName || '',
  }
  edl.adresse = contract.property?.address || ''
  edl.codePostal = contract.property?.postalCode || ''
  edl.ville = contract.property?.city || ''
  edl.typeLogement = contract.property?.type || ''
  edl.surface = contract.property?.surface || 0
  return edl
}
