import { ANNEXES, COMMON_AREAS, EQUIPMENTS, PARKING_TYPES, type ContractInput, type Guarantor, type LandlordProfile, type LeaseKind, type PartyName, type PropertyFile } from '../domain/contract.js'
import { formatDateFr, formatEuros, parseIsoDate } from '../domain/lease.js'
import { isLegalPerson } from '../domain/rules.js'

/** Libellés en français des fiches, communs à tous les documents. */

export const civ = (c?: string | null) => (c === 'MADAME' ? 'Madame' : c === 'MONSIEUR' ? 'Monsieur' : '')
export const civShort = (c?: string | null) => (c === 'MADAME' ? 'Mme' : c === 'MONSIEUR' ? 'M.' : '')

export function personName(p: PartyName & { usageName?: string | null }, withCivility = true): string {
  const name = [p.firstNames, p.usageName || p.lastName].filter(Boolean).join(' ')
  return [withCivility ? civ(p.civility) : '', name].filter(Boolean).join(' ').trim()
}

/** « Madame Sophie Leroy, née le 14/02/1996 à Toulouse » */
export function personWithBirth(p: PartyName & { birthDate?: string | null; birthPlace?: string | null; usageName?: string | null }): string {
  const name = personName(p)
  if (!p.birthDate && !p.birthPlace) return name
  const born = p.civility === 'MADAME' ? 'née' : 'né'
  const date = p.birthDate ? ` le ${dateShort(p.birthDate)}` : ''
  const place = p.birthPlace ? ` à ${p.birthPlace}` : ''
  return `${name}, ${born}${date}${place}`
}

export const dateShort = (iso?: string | null) => (iso ? iso.split('-').reverse().join('/') : '')
export const dateLong = (iso?: string | null) => (iso ? formatDateFr(parseIsoDate(iso)) : '')
export const euros = (cents?: number | null) => (cents === null || cents === undefined ? '' : formatEuros(cents))

export function landlordName(l: LandlordProfile): string {
  if ((l.kind === 'SCI' || l.kind === 'COMPANY') && l.company?.name) return [l.company.form, l.company.name].filter(Boolean).join(' ')
  const main = personName({ civility: l.civility, firstNames: l.firstNames, lastName: l.lastName, usageName: l.usageName })
  const others = (l.coOwners ?? []).map((o) => personName(o)).filter(Boolean)
  return [main, ...others].filter(Boolean).join(' et ')
}

export function landlordQuality(l: LandlordProfile): string {
  if (l.kind === 'SCI') return l.sciFamily ? 'Société civile immobilière familiale' : 'Personne morale (société civile immobilière)'
  if (l.kind === 'COMPANY') return 'Personne morale'
  if (l.kind === 'COUPLE') return 'Personnes physiques (couple ou indivision)'
  return 'Personne physique'
}

export const landlordAddress = (l: LandlordProfile) => ((l.kind === 'SCI' || l.kind === 'COMPANY') && l.company?.seat ? l.company.seat : l.address ?? '')

export function propertyAddress(p: PropertyFile): string {
  const extra = [p.building ? `bâtiment ${p.building}` : '', p.floorDoor].filter(Boolean).join(', ')
  return [p.address, extra].filter(Boolean).join(', ')
}

/** « Box fermé n° 12, niveau -1 » : l'emplacement loué seul, sans l'adresse. */
export function parkingLabel(p: PropertyFile): string {
  const k = p.parking
  return [k?.type ? PARKING_TYPES[k.type] : 'Emplacement de stationnement', k?.number ? `n° ${k.number}` : '', k?.level ? `niveau ${k.level}` : ''].filter(Boolean).join(', ').replace(/, n°/, ' n°')
}

export const CONSTRUCTION: Record<string, string> = {
  BEFORE_1949: 'Avant 1949',
  '1949_1974': 'De 1949 à 1974',
  '1975_1989': 'De 1975 à 1989',
  '1990_2005': 'De 1990 à 2005',
  AFTER_2005: 'Depuis 2005',
}
export const ENERGY: Record<string, string> = { GAS: 'gaz', ELECTRIC: 'électricité', HEAT_PUMP: 'pompe à chaleur', FUEL: 'fioul', WOOD: 'bois', NETWORK: 'réseau de chaleur' }
export const TV: Record<string, string> = { INDIVIDUAL: 'Antenne individuelle', COLLECTIVE: 'Antenne collective', CABLE: 'Câble', SATELLITE: 'Satellite', NONE: 'Aucune' }
export const NET: Record<string, string> = { FIBER: 'fibre optique', ADSL: 'ADSL', NONE: 'aucun raccordement' }

export const listOf = <T extends Record<string, string>>(dict: T, keys?: (keyof T)[] | null) => (keys ?? []).map((k) => dict[k]).filter(Boolean)
export const equipmentsLabel = (p: PropertyFile) => [...listOf(EQUIPMENTS, p.equipments), p.otherEquipments].filter(Boolean).join(', ')
export const annexesLabel = (p: PropertyFile) => {
  const list = listOf(ANNEXES, p.annexes)
  return list
    .map((a) => (a === 'Garage' && p.garageNumber ? `Garage n° ${p.garageNumber}` : a === 'Place de parking' && p.garageNumber ? `Place de parking n° ${p.garageNumber}` : a === 'Jardin privatif' && p.gardenArea ? `Jardin privatif de ${p.gardenArea} m²` : a))
    .join(', ')
}
export const commonAreasLabel = (p: PropertyFile) => listOf(COMMON_AREAS, p.commonAreas).join(', ')

export function kindTitle(kind: LeaseKind, colocation: boolean): string {
  const base = { VIDE: 'Logement vide', MEUBLE: 'Logement meublé', ETUDIANT: 'Logement meublé, bail étudiant de neuf mois', MOBILITE: 'Bail mobilité, logement meublé', PARKING: 'Garage ou place de stationnement' }[kind]
  return colocation ? `${base}, colocation` : base
}

export const durationText = (months: number) => (months % 12 === 0 ? `${months / 12 === 1 ? 'un (1) an' : months / 12 === 3 ? 'trois (3) ans' : months / 12 === 6 ? 'six (6) ans' : `${months / 12} ans`}` : `${months} mois`)

export function guarantorName(g: Guarantor): string {
  return personName({ civility: g.civility, firstNames: g.firstNames, lastName: g.lastName })
}

/** Nombre d'originaux : un par partie (bailleur, chaque locataire) et un pour chaque garant. */
export function originalsCount(c: ContractInput): number {
  return 1 + Math.max(1, c.tenants.length) + c.guarantors.length
}

export const isCompany = (l: LandlordProfile) => isLegalPerson(l) || l.kind === 'SCI'
