import { tenantFileSchema, type TenantFile } from './contract.js'

/**
 * Règles de conservation des dossiers de locataires, d'après le référentiel « gestion locative » de la CNIL
 * (délibération n° 2021-057 du 6 mai 2021) :
 * - après la fin du bail : 3 ans (prescription des actions nées du bail, loi du 6 juillet 1989, art. 7-1) ;
 * - candidat ou dossier sans bail : 3 mois au plus après le dernier échange.
 * Passé ce délai, le dossier est réduit au nom et à l'email : justificatifs et informations devenues inutiles effacés.
 */
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
