import { tenantFileSchema, type TenantFile } from './contract.js'

/**
 * Règles de conservation des dossiers de locataires, d'après le référentiel « gestion locative » de la CNIL
 * (délibération n° 2021-057 du 6 mai 2021) :
 * - après la fin du bail : 3 ans (prescription des actions nées du bail, loi du 6 juillet 1989, art. 7-1) ;
 * - candidat ou dossier sans bail : 3 mois au plus après le dernier échange.
 * Passé ce délai, le dossier est réduit au nom et à l'email : justificatifs et informations devenues inutiles effacés.
 * Les justificatifs (pièce d'identité, revenus…) ne servent qu'à choisir le locataire et à préparer le bail : gardés
 * pendant toute la location (renouvellements compris), ils sont effacés 30 jours après sa fin, le propriétaire étant
 * prévenu 7 jours avant. Restent le bail, les états des lieux, les quittances et les courriers.
 */
export const DOCS_DAYS_AFTER_LEASE = 30
export const DOCS_WARN_DAYS = 7
export const DOSSIER_YEARS = 3
export const PHOTO_YEARS = 3
export const NO_LEASE_MONTHS = 3

export const yearsAgo = (n: number, now: Date) => new Date(Date.UTC(now.getUTCFullYear() - n, now.getUTCMonth(), now.getUTCDate()))
export const monthsAgo = (n: number, now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, now.getUTCDate()))

/** Dossier réduit : identité et email gardés, le reste effacé. Renvoie aussi les fichiers à supprimer. */
export function minimizeTenantFile(f: TenantFile, label: string): { file: TenantFile; fileIds: string[] } {
  const fileIds = [...(f.documents ?? []), ...(f.guarantor?.documents ?? [])].map((d) => d.fileId).filter((x): x is string => Boolean(x))
  const clear = (docs: TenantFile['documents']) => (docs ?? []).map((d) => ({ ...d, fileId: null, label }))
  const g = f.guarantor
  const file = tenantFileSchema.parse({
    ...f,
    birthDate: null,
    birthPlace: null,
    phone: null,
    currentAddress: null,
    situation: null,
    employer: null,
    occupation: null,
    monthlyIncomeCents: null,
    visaleNumber: null,
    dossierFacileUrl: null,
    review: [],
    documents: clear(f.documents),
    ...(g ? { guarantor: { civility: g.civility, firstNames: g.firstNames, lastName: g.lastName, documents: clear(g.documents) } } : {}),
  })
  return { file, fileIds }
}

/** Dossier sans aucun bail, inchangé depuis plus de 3 mois : à réduire. */
export const staleWithoutLease = (t: { updatedAt: Date; hasLease: boolean; purged: boolean }, now: Date) =>
  !t.hasLease && !t.purged && t.updatedAt < monthsAgo(NO_LEASE_MONTHS, now)

const DAY = 86_400_000

/** Date d'effacement des justificatifs : 30 jours après la fin du dernier bail. */
export const docsPurgeDate = (end: Date) => new Date(end.getTime() + DOCS_DAYS_AFTER_LEASE * DAY)

/** Ce qu'il faut faire des justificatifs d'un ancien locataire aujourd'hui. */
export function docsAction(t: { lastEnd: Date; stillTenant: boolean; hasFiles: boolean; warned: boolean; purged: boolean }, now: Date): 'PURGE' | 'WARN' | null {
  if (t.stillTenant || !t.hasFiles || t.purged) return null
  const purgeAt = docsPurgeDate(t.lastEnd)
  if (now >= purgeAt) return 'PURGE'
  if (!t.warned && now.getTime() >= purgeAt.getTime() - DOCS_WARN_DAYS * DAY) return 'WARN'
  return null
}

/** Justificatifs effacés, informations gardées (elles suivent la règle des 3 ans). */
export function clearTenantDocs(f: TenantFile, label: string): { file: TenantFile; fileIds: string[] } {
  const fileIds = [...(f.documents ?? []), ...(f.guarantor?.documents ?? [])].map((d) => d.fileId).filter((x): x is string => Boolean(x))
  const clear = (docs: TenantFile['documents']) => (docs ?? []).map((d) => (d.fileId ? { ...d, fileId: null, label } : d))
  const file = tenantFileSchema.parse({ ...f, documents: clear(f.documents), ...(f.guarantor ? { guarantor: { ...f.guarantor, documents: clear(f.guarantor.documents) } } : {}) })
  return { file, fileIds }
}
