import { TENANT_DOCUMENTS, type TenantFile } from './contract.js'

/**
 * Ce qu'il manque au dossier d'un locataire (et de sa caution) : informations pour le bail et l'acte de caution,
 * et pièces que la loi autorise à demander (décret n° 2015-1437). Ce qui manque peut être demandé au locataire
 * par email ou par courrier : il complète lui-même son dossier, sans compte.
 */
export interface FileMissing {
  key: string
  label: string
  who: 'TENANT' | 'GUARANTOR'
  kind: 'INFO' | 'DOCUMENT'
}

const has = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== ''
export type DocKey = keyof typeof TENANT_DOCUMENTS
export const DOC_KEYS = Object.keys(TENANT_DOCUMENTS) as DocKey[]

export function tenantMissing(t: TenantFile): FileMissing[] {
  const out: FileMissing[] = []
  const info = (key: string, label: string, who: FileMissing['who'] = 'TENANT') => out.push({ key, label, who, kind: 'INFO' })
  const doc = (key: string, label: string, who: FileMissing['who'] = 'TENANT') => out.push({ key, label, who, kind: 'DOCUMENT' })

  if (!has(t.civility)) info('civility', 'Civilité')
  if (!has(t.firstNames) || !has(t.lastName)) info('name', 'Prénom et nom, comme sur la pièce d’identité')
  if (!has(t.birthDate)) info('birthDate', 'Date de naissance')
  if (!has(t.birthPlace)) info('birthPlace', 'Lieu de naissance')
  if (!has(t.email)) info('email', 'Adresse email')
  if (!has(t.phone)) info('phone', 'Numéro de téléphone')
  if (!has(t.currentAddress)) info('currentAddress', 'Adresse actuelle')
  if (!has(t.situation)) info('situation', 'Situation professionnelle')
  const received = new Set((t.documents ?? []).filter((d) => d.received).map((d) => d.category))
  for (const k of DOC_KEYS) if (!received.has(k)) doc(`doc.${k}`, TENANT_DOCUMENTS[k])

  if (t.guarantee === 'VISALE' && !has(t.visaleNumber)) info('visaleNumber', 'Numéro du visa Visale')
  if (t.guarantee === 'CAUTION') {
    const g = t.guarantor ?? {}
    if (!has(g.firstNames) || !has(g.lastName)) info('guarantor.name', 'Prénom et nom du garant', 'GUARANTOR')
    if (!has(g.birthDate) || !has(g.birthPlace)) info('guarantor.birth', 'Date et lieu de naissance du garant', 'GUARANTOR')
    if (!has(g.address)) info('guarantor.address', 'Adresse du garant', 'GUARANTOR')
    if (!has(g.email) && !has(g.phone)) info('guarantor.contact', 'Email ou téléphone du garant', 'GUARANTOR')
    const gReceived = new Set((g.documents ?? []).filter((d) => d.received).map((d) => d.category))
    for (const k of DOC_KEYS) if (!gReceived.has(k)) doc(`guarantor.doc.${k}`, `${TENANT_DOCUMENTS[k]} du garant`, 'GUARANTOR')
  }
  return out
}

/** Informations que le locataire peut lui-même compléter depuis son lien (jamais le loyer, la durée ou le montant garanti). */
export const TENANT_EDITABLE = ['civility', 'firstNames', 'lastName', 'usageName', 'birthDate', 'birthPlace', 'email', 'phone', 'currentAddress', 'situation', 'employer', 'occupation', 'monthlyIncomeCents', 'visaleNumber'] as const
export const GUARANTOR_EDITABLE = ['civility', 'firstNames', 'lastName', 'birthDate', 'birthPlace', 'address', 'email', 'phone', 'situation', 'employer', 'monthlyIncomeCents'] as const

/**
 * Ce qui doit être connu avant le bail : identité complète du locataire (nom, naissance) et, s'il y a une caution,
 * de quoi établir l'acte de caution. `ask` : le locataire peut le compléter lui-même ; sinon, c'est au propriétaire.
 */
export function tenantLeaseMissing(t: TenantFile): Array<FileMissing & { ask: boolean }> {
  const lease = new Set(['name', 'birthDate', 'birthPlace', 'guarantor.name', 'guarantor.birth', 'guarantor.address', 'visaleNumber'])
  const out: Array<FileMissing & { ask: boolean }> = tenantMissing(t).filter((m) => lease.has(m.key)).map((m) => ({ ...m, ask: true }))
  if (t.guarantee === 'CAUTION') {
    const g = t.guarantor ?? {}
    if (!g.maxCents) out.push({ key: 'guarantor.max', label: 'Le montant maximum garanti par la caution', who: 'GUARANTOR', kind: 'INFO', ask: false })
    if (!g.duration || (g.duration === 'FIXED' && !g.until)) out.push({ key: 'guarantor.duration', label: 'La durée de l’engagement de la caution', who: 'GUARANTOR', kind: 'INFO', ask: false })
  }
  if (!t.guarantee) out.push({ key: 'guarantee', label: 'La garantie (caution, Visale, assurance ou aucune)', who: 'TENANT', kind: 'INFO', ask: false })
  return out
}
