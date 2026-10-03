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
export function tenantLeaseMissing(t: TenantFile): Array<FileMissing & { ask: boolean; level: 'ESSENTIAL' | 'RECOMMENDED' }> {
  // Primordial : le nom du locataire (rubrique I) et ce que l'acte de caution exige. La naissance est recommandée.
  const essentialKeys = new Set(['name', 'guarantor.name', 'guarantor.address'])
  const recommendedKeys = new Set(['birthDate', 'birthPlace', 'guarantor.birth', 'visaleNumber'])
  const out: Array<FileMissing & { ask: boolean; level: 'ESSENTIAL' | 'RECOMMENDED' }> = tenantMissing(t)
    .filter((m) => essentialKeys.has(m.key) || recommendedKeys.has(m.key))
    .map((m) => ({ ...m, ask: true, level: essentialKeys.has(m.key) ? 'ESSENTIAL' : 'RECOMMENDED' }))
  if (t.guarantee === 'CAUTION') {
    const g = t.guarantor ?? {}
    if (!g.maxCents) out.push({ key: 'guarantor.max', label: 'Le montant maximum garanti par la caution', who: 'GUARANTOR', kind: 'INFO', ask: false, level: 'ESSENTIAL' })
    if (!g.duration || (g.duration === 'FIXED' && !g.until)) out.push({ key: 'guarantor.duration', label: 'La durée de l’engagement de la caution', who: 'GUARANTOR', kind: 'INFO', ask: false, level: 'ESSENTIAL' })
  }
  return out
}

const FIELD_LABELS: Record<string, string> = {
  civility: 'Civilité', firstNames: 'Prénom(s)', lastName: 'Nom', usageName: 'Nom d’usage', birthDate: 'Date de naissance', birthPlace: 'Lieu de naissance',
  email: 'Email', phone: 'Téléphone', currentAddress: 'Adresse actuelle', address: 'Adresse', situation: 'Situation professionnelle', employer: 'Employeur ou activité',
  occupation: 'Métier ou formation', monthlyIncomeCents: 'Revenus nets par mois', visaleNumber: 'Numéro du visa Visale',
}

export interface ReviewItem {
  key: string
  label: string
  who: 'TENANT' | 'GUARANTOR'
  kind: 'INFO' | 'DOCUMENT'
  value?: string | number | null
  fileId?: string | null
}

/** Ce que le locataire a envoyé depuis son lien et que le propriétaire n'a pas encore vérifié. */
export function pendingReview(t: TenantFile): ReviewItem[] {
  const out: ReviewItem[] = []
  for (const key of t.review ?? []) {
    const guarantor = key.startsWith('guarantor.')
    const field = guarantor ? key.slice(10) : key
    const src = (guarantor ? t.guarantor : t) as Record<string, unknown> | null | undefined
    out.push({ key, label: `${FIELD_LABELS[field] ?? field}${guarantor ? ' du garant' : ''}`, who: guarantor ? 'GUARANTOR' : 'TENANT', kind: 'INFO', value: (src?.[field] as string | number | null) ?? null })
  }
  for (const d of t.documents ?? []) if (d.source === 'TENANT' && d.received && !d.verifiedAt) out.push({ key: `doc.${d.category}`, label: TENANT_DOCUMENTS[d.category as DocKey], who: 'TENANT', kind: 'DOCUMENT', fileId: d.fileId ?? null })
  for (const d of t.guarantor?.documents ?? []) if (d.source === 'TENANT' && d.received && !d.verifiedAt) out.push({ key: `guarantor.doc.${d.category}`, label: `${TENANT_DOCUMENTS[d.category as DocKey]} du garant`, who: 'GUARANTOR', kind: 'DOCUMENT', fileId: d.fileId ?? null })
  return out
}

/**
 * Décision du propriétaire sur un élément envoyé par le locataire : conforme (il est marqué vérifié),
 * ou à corriger (il est retiré et redevient « à fournir », pour être redemandé).
 */
export function applyReview(t: TenantFile, key: string, ok: boolean, now: string): TenantFile {
  const next: TenantFile = { ...t, review: (t.review ?? []).filter((k) => k !== key) }
  const docMatch = /^(guarantor\.)?doc\.(\w+)$/.exec(key)
  if (docMatch) {
    const guarantor = Boolean(docMatch[1])
    const category = docMatch[2]
    const update = (docs: TenantFile['documents']) => (docs ?? []).flatMap((d) => (d.category !== category ? [d] : ok ? [{ ...d, verifiedAt: now }] : []))
    if (guarantor) next.guarantor = { ...t.guarantor, documents: update(t.guarantor?.documents) }
    else next.documents = update(t.documents)
    return next
  }
  if (!ok) {
    const guarantor = key.startsWith('guarantor.')
    const field = guarantor ? key.slice(10) : key
    if (guarantor) next.guarantor = { ...t.guarantor, [field]: null }
    else (next as Record<string, unknown>)[field] = null
  }
  return next
}
