/**
 * Accès partagés (table Access) : un invité travaille dans l'espace du propriétaire, limité aux logements partagés.
 * Deux verrous, tous deux « refusé par défaut » :
 * - routeDenied : ce que le rôle peut appeler (méthode et adresse) ;
 * - scopeQuery : le filtre ajouté à chaque requête en base, table par table (un logement non partagé n'existe pas).
 */

export const ACCESS_ROLES = ['ASSOCIATE', 'ACCOUNTANT', 'CONTRACTOR'] as const
export type AccessRole = (typeof ACCESS_ROLES)[number]

export const ROLE_LABEL: Record<AccessRole, string> = {
  ASSOCIATE: 'Associé ou co-propriétaire',
  ACCOUNTANT: 'Comptable',
  CONTRACTOR: 'Intervenant',
}

export interface Scope {
  ownerId: string
  role: AccessRole
  propertyIds: string[]
  leaseIds: string[]
  tenantIds: string[]
  structureIds: string[]
}

/** Adresses qui concernent toujours la personne connectée elle-même : l'en-tête d'espace y est ignoré. */
export const SELF_PATHS = ['/auth', '/account', '/access', '/spaces', '/invitations', '/drafts', '/geo']

export const isSelfPath = (path: string) => SELF_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

/** null si la requête est permise pour ce rôle, sinon le message (en français) à afficher. */
export function routeDenied(role: AccessRole, method: string, path: string): string | null {
  const m = method.toUpperCase()
  const read = m === 'GET' || m === 'HEAD'
  if (path === '/trash' || path.startsWith('/trash/')) return 'La corbeille reste réservée au propriétaire.'
  if (role === 'CONTRACTOR') return read && path === '/shared/view' ? null : 'Votre accès d’intervenant ne permet de voir que la fiche d’intervention du logement.'
  if (role === 'ACCOUNTANT') return read ? null : 'Votre accès de comptable est en lecture seule.'
  // Associé : tout sur les logements partagés, sauf supprimer, créer un logement et toucher au compte ou aux structures.
  if (m === 'DELETE') return 'Votre accès ne permet pas de supprimer. Demandez au propriétaire.'
  if (m === 'POST' && path === '/properties') return 'Seul le propriétaire peut ajouter un logement.'
  if (/^\/properties\/[^/]+\/structure$/.test(path)) return 'Seul le propriétaire peut changer la structure d’un logement.'
  if (!read && (path === '/structures' || path.startsWith('/structures/'))) return 'Seul le propriétaire peut modifier ses structures.'
  if (!read && path === '/profile') return 'Seul le propriétaire peut modifier son profil.'
  return null
}

export type ScopeResult = { kind: 'ALLOW' } | { kind: 'DENY' } | { kind: 'FILTER'; where: Record<string, unknown> } | { kind: 'CHECK'; ok: boolean } | { kind: 'UPSERT'; where: Record<string, unknown> | null; ok: boolean }

const READ_OPS = new Set(['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'])
const FILTER_WRITE_OPS = new Set(['update', 'updateMany', 'delete', 'deleteMany', 'updateManyAndReturn'])
const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn', 'upsert'])

const inList = (ids: string[]) => ({ in: ids })

/** Filtre de lecture d'une table, ou null si la table n'est pas liée à un logement. */
function readFilter(model: string, s: Scope): Record<string, unknown> | 'DENY' | null {
  switch (model) {
    case 'Property':
      return { id: inList(s.propertyIds) }
    case 'Lease':
    case 'Expense':
    case 'Candidate':
    case 'Intervention':
      return { propertyId: inList(s.propertyIds) }
    case 'Tenant':
      return { OR: [{ propertyId: inList(s.propertyIds) }, { id: inList(s.tenantIds) }] }
    case 'Document':
      return { OR: [{ propertyId: inList(s.propertyIds) }, { leaseId: inList(s.leaseIds) }, { tenantId: inList(s.tenantIds) }] }
    case 'Payment':
    case 'Inventory':
    case 'Reminder':
    case 'SignatureRequest':
      return { leaseId: inList(s.leaseIds) }
    case 'Signer':
      return { request: { leaseId: inList(s.leaseIds) } }
    case 'Structure':
      return { id: inList(s.structureIds) }
    case 'Contact':
    case 'FileBlob':
      return s.role === 'CONTRACTOR' ? 'DENY' : null
    case 'User':
      return { id: s.ownerId }
    default:
      // Corbeille, brouillons, codes, sessions, accès, liens de connexion : jamais dans un espace partagé.
      return 'DENY'
  }
}

const one = (v: unknown) => (Array.isArray(v) ? v : [v])
const idOf = (data: Record<string, unknown>, field: string, relation: string): string | undefined => {
  const direct = data[field]
  if (typeof direct === 'string') return direct
  const rel = data[relation] as { connect?: { id?: unknown } } | undefined
  return typeof rel?.connect?.id === 'string' ? rel.connect.id : undefined
}

/** Une création est permise si elle porte sur un logement, un bail ou un locataire partagé. */
function createAllowed(model: string, rows: Record<string, unknown>[], s: Scope): boolean {
  const has = (list: string[], id: string | undefined) => id !== undefined && list.includes(id)
  return rows.every((d) => {
    switch (model) {
      case 'Lease':
      case 'Expense':
      case 'Candidate':
      case 'Intervention':
      case 'Tenant':
        return has(s.propertyIds, idOf(d, 'propertyId', 'property'))
      case 'Payment':
      case 'Inventory':
      case 'Reminder':
      case 'SignatureRequest':
        return has(s.leaseIds, idOf(d, 'leaseId', 'lease'))
      case 'Document':
        return has(s.propertyIds, idOf(d, 'propertyId', 'property')) || has(s.leaseIds, idOf(d, 'leaseId', 'lease')) || has(s.tenantIds, idOf(d, 'tenantId', 'tenant'))
      case 'Signer':
        return true
      case 'Contact':
      case 'FileBlob':
        return s.role === 'ASSOCIATE'
      default:
        return false
    }
  })
}

/** Ce qu'il faut faire d'une requête en base dans un espace partagé. */
export function scopeQuery(model: string, operation: string, args: Record<string, unknown> | undefined, s: Scope): ScopeResult {
  const filter = readFilter(model, s)
  if (READ_OPS.has(operation)) {
    if (filter === 'DENY') return { kind: 'DENY' }
    return filter ? { kind: 'FILTER', where: filter } : { kind: 'ALLOW' }
  }
  if (model === 'User') return { kind: 'DENY' }
  if (FILTER_WRITE_OPS.has(operation)) {
    if (filter === 'DENY') return { kind: 'DENY' }
    return filter ? { kind: 'FILTER', where: filter } : { kind: 'ALLOW' }
  }
  if (CREATE_OPS.has(operation)) {
    if (operation === 'upsert') {
      // Mise à jour limitée aux lignes visibles, création limitée aux logements partagés.
      if (filter === 'DENY') return { kind: 'DENY' }
      return { kind: 'UPSERT', where: filter, ok: createAllowed(model, [(args?.create ?? {}) as Record<string, unknown>], s) }
    }
    const data = (args?.data ?? {}) as Record<string, unknown> | Record<string, unknown>[]
    return { kind: 'CHECK', ok: createAllowed(model, one(data) as Record<string, unknown>[], s) }
  }
  return { kind: 'DENY' }
}
