import type { Guarantor, LandlordProfile, LeaseTerms, PropertyFile, TenantFile } from './contract.js'

/**
 * Étapes de chaque fiche, dans l'ordre de la maquette, avec ce qui les rend complètes.
 * Une étape « sans objet » (société pour un particulier, copropriété pour une maison…) ne compte pas.
 */
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

const filled = (...v: unknown[]) => v.every((x) => x !== undefined && x !== null && x !== '' && !(Array.isArray(x) && x.length === 0))

function summarize(steps: Step[]): Completion {
  const counted = steps.filter((s) => s.applicable)
  const percent = counted.length ? Math.round((counted.filter((s) => s.done).length / counted.length) * 100) : 0
  return { steps, percent }
}

export function landlordCompletion(p: LandlordProfile): Completion {
  // Qui détient les logements (personne, SCI, société) se renseigne dans les structures, pas ici.
  return summarize([
    { key: 'identity', label: 'Identité', done: filled(p.civility, p.lastName, p.firstNames), applicable: true },
    { key: 'address', label: 'Adresse', done: filled(p.address), applicable: true },
    { key: 'contact', label: 'Contact', done: filled(p.email) || filled(p.phone), applicable: true },
    { key: 'agent', label: 'Mandataire', done: p.agent?.enabled === false || filled(p.agent?.name), applicable: true },
    { key: 'payment', label: 'Paiement', done: filled(p.payment?.iban), applicable: true },
    { key: 'signature', label: 'Signature', done: filled(p.signature), applicable: true },
  ])
}

export function propertyCompletion(p: PropertyFile): Completion {
  const d = p.diagnostics ?? {}
  if (p.nature === 'PARKING')
    return summarize([
      { key: 'address', label: 'Adresse', done: filled(p.address), applicable: true },
      { key: 'parking', label: 'Emplacement', done: filled(p.parking?.type), applicable: true },
      { key: 'photos', label: 'Photos', done: (p.photos?.length ?? 0) > 0, applicable: true },
    ])
  return summarize([
    { key: 'address', label: 'Adresse et identifiant fiscal', done: filled(p.address, p.fiscalId), applicable: true },
    { key: 'type', label: 'Type et régime', done: filled(p.habitat, p.legalRegime) && p.furnished !== undefined && p.furnished !== null, applicable: true },
    { key: 'copro', label: 'Copropriété', done: filled(p.copro?.syndic) || p.copro?.extractsProvided === true, applicable: p.legalRegime === 'COPRO' },
    { key: 'size', label: 'Construction et surface', done: filled(p.constructionPeriod, p.surface, p.rooms), applicable: true },
    { key: 'rooms', label: 'Pièces', done: (p.roomList?.length ?? 0) > 0, applicable: true },
    { key: 'heating', label: 'Chauffage', done: filled(p.heating?.mode, p.heating?.energy, p.hotWater?.mode), applicable: true },
    { key: 'equipments', label: 'Équipements', done: (p.equipments?.length ?? 0) > 0, applicable: true },
    { key: 'annexes', label: 'Annexes', done: p.annexes !== undefined && p.annexes !== null, applicable: true },
    { key: 'common', label: 'Parties communes', done: p.commonAreas !== undefined && p.commonAreas !== null, applicable: p.habitat === 'COLLECTIVE' },
    { key: 'tv', label: 'TV et internet', done: filled(p.tv, p.internet), applicable: true },
    { key: 'diagnostics', label: 'Diagnostics', done: filled(d.dpe?.class, d.dpe?.costMin, d.dpe?.costMax, d.erp?.date), applicable: true },
    { key: 'market', label: 'Loyer de marché', done: p.market?.tense !== undefined && p.market?.tense !== null, applicable: true },
    { key: 'furniture', label: 'Mobilier', done: (p.furniture?.present?.length ?? 0) === 11, applicable: p.furnished === true },
    { key: 'photos', label: 'Photos', done: (p.photos?.length ?? 0) > 0, applicable: true },
  ])
}

export function tenantCompletion(t: TenantFile, hasEnded = false): Completion {
  return summarize([
    { key: 'identity', label: 'Identité', done: filled(t.civility, t.lastName, t.firstNames, t.birthDate, t.birthPlace), applicable: true },
    { key: 'contact', label: 'Coordonnées', done: filled(t.email) || filled(t.phone), applicable: true },
    { key: 'situation', label: 'Situation', done: filled(t.situation), applicable: true },
    { key: 'colocation', label: 'Colocation', done: t.living === 'ALONE' || (t.coTenants?.length ?? 0) > 0, applicable: true },
    { key: 'guarantee', label: 'Garantie', done: t.guarantee === 'NONE' || t.guarantee === 'GLI' || (t.guarantee === 'VISALE' && filled(t.visaleNumber)) || (t.guarantee === 'CAUTION' && filled(t.guarantor?.lastName)), applicable: true },
    { key: 'documents', label: 'Justificatifs', done: (t.documents ?? []).some((d) => d.received), applicable: true },
    { key: 'insurance', label: 'Assurance', done: filled(t.insurance?.expiresAt), applicable: true },
    { key: 'departure', label: 'Départ', done: filled(t.newAddress), applicable: hasEnded },
  ])
}

export function guarantorCompletion(g: Guarantor): Completion {
  const identity = filled(g.civility, g.lastName, g.firstNames, g.address)
  return summarize([
    { key: 'guarantor', label: 'Garant', done: identity, applicable: true },
    { key: 'engagement', label: 'Engagement', done: filled(g.engagement), applicable: true },
    { key: 'duration', label: 'Durée et plafond', done: filled(g.duration, g.maxCents) && (g.duration === 'OPEN' || filled(g.until)), applicable: true },
    { key: 'mentions', label: 'Mentions', done: identity && filled(g.engagement), applicable: true },
    { key: 'signature', label: 'Signature', done: filled(g.signMode), applicable: true },
  ])
}

export function termsCompletion(t: LeaseTerms, ctx: { hasLandlord: boolean; hasProperty: boolean; hasTenant: boolean; tense: boolean }): Completion {
  const prev = t.previous
  const housing = t.kind !== 'PARKING'
  return summarize([
    { key: 'type', label: 'Type', done: filled(t.kind), applicable: true },
    { key: 'parties', label: 'Parties', done: ctx.hasLandlord && ctx.hasTenant, applicable: true },
    { key: 'property', label: 'Logement', done: ctx.hasProperty, applicable: true },
    { key: 'dates', label: 'Date et durée', done: filled(t.startDate) && (t.kind !== 'MOBILITE' || filled(t.durationMonths, t.mobilityReason)), applicable: true },
    { key: 'rent', label: 'Loyer', done: filled(t.rentCents, t.paymentDay), applicable: true },
    { key: 'zone', label: 'Encadrement', done: t.zone?.tense !== undefined && t.zone?.tense !== null, applicable: housing },
    { key: 'previous', label: 'Locataire précédent', done: prev?.rentedWithin18Months === false || filled(prev?.lastRentCents, prev?.lastPaymentDate), applicable: housing },
    { key: 'revision', label: 'Révision', done: t.revision?.enabled === false || filled(t.revision?.irlQuarter), applicable: t.kind !== 'MOBILITE' },
    { key: 'charges', label: 'Charges', done: filled(t.chargesMode) && t.chargesCents !== undefined && t.chargesCents !== null, applicable: true },
    { key: 'first', label: 'Première échéance', done: filled(t.startDate, t.rentCents), applicable: true },
    { key: 'works', label: 'Travaux', done: t.works !== undefined && t.works !== null, applicable: housing && t.kind !== 'MOBILITE' },
    { key: 'deposit', label: 'Dépôt', done: t.depositCents !== undefined && t.depositCents !== null, applicable: t.kind !== 'MOBILITE' },
    { key: 'clauses', label: 'Clauses', done: t.clauses !== undefined && t.clauses !== null, applicable: true },
    { key: 'annexes', label: 'Annexes', done: ctx.hasProperty, applicable: true },
    { key: 'signature', label: 'Signature', done: filled(t.signature?.place, t.signature?.mode), applicable: true },
  ])
}
