import { storage } from './storage'

/** Espace partagé ouvert (invité d'un propriétaire) : chaque appel à l'API le précise (en-tête X-Bailio-Space). */
export interface SharedSpace {
  id: string
  role: 'ASSOCIATE' | 'ACCOUNTANT' | 'CONTRACTOR'
  ownerName: string
}

export const SPACE_KEY = 'bailio.space'

export const ROLE_LABEL: Record<SharedSpace['role'], string> = {
  ASSOCIATE: 'Associé ou co-propriétaire',
  ACCOUNTANT: 'Comptable',
  CONTRACTOR: 'Intervenant',
}

export const ROLE_RIGHTS: Record<SharedSpace['role'], string> = {
  ASSOCIATE: 'Vous pouvez tout faire sur les logements partagés, sauf supprimer.',
  ACCOUNTANT: 'Vous consultez les logements partagés, sans rien modifier.',
  CONTRACTOR: 'Vous voyez l’adresse, le contact du locataire et les interventions.',
}

export function getSpace(): SharedSpace | null {
  const raw = storage.get(SPACE_KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as SharedSpace
    return s && typeof s.id === 'string' && ['ASSOCIATE', 'ACCOUNTANT', 'CONTRACTOR'].includes(s.role) ? s : null
  } catch {
    return null
  }
}

export function setSpace(s: SharedSpace | null) {
  storage.set(SPACE_KEY, s ? JSON.stringify(s) : null)
}

/** Entrer dans un espace ou revenir au sien : la page est rechargée pour repartir de données propres. */
export function switchSpace(s: SharedSpace | null) {
  setSpace(s)
  window.location.assign(s?.role === 'CONTRACTOR' ? '/espace/partage' : '/espace')
}
