import type { ContractInput } from './contract.js'
import { diagnosticsFor } from './rules.js'

/**
 * Ce qu'il faut savoir avant de produire un document qui engage : chaque information manquante
 * est nommée simplement, avec la fiche où la compléter. Le bail n'est signé qu'une fois la liste vide.
 * Les mentions suivent le contrat type (décret n° 2015-587) et l'article 3 de la loi du 6 juillet 1989.
 */

export type Where = 'LANDLORD' | 'PROPERTY' | 'TENANT' | 'TERMS' | 'GUARANTOR'

export interface Missing {
  key: string
  label: string
  where: Where
  /** Étape de la fiche à ouvrir (ancre). */
  section: string
  /** Rang du locataire concerné (fiches locataire et caution). */
  tenant?: number
  /**
   * ESSENTIAL : sans elle, pas de bail (création et signature bloquées).
   * RECOMMENDED : mention à compléter si possible ; le bail se fait, avec une ligne à remplir.
   */
  level?: 'ESSENTIAL' | 'RECOMMENDED'
}

/** Mentions que le propriétaire peut ne pas avoir sous la main : le bail laisse une ligne à compléter. */
const RECOMMENDED = [/^property\.(fiscalId|dpeCost|equipments|tv|smoke|heatingSplit|hotWaterSplit|furniture)$/, /^property\.diag\./, /^terms\.irl$/]
export const levelOf = (key: string): 'ESSENTIAL' | 'RECOMMENDED' => (RECOMMENDED.some((r) => r.test(key)) ? 'RECOMMENDED' : 'ESSENTIAL')
const withLevel = (list: Missing[]) => list.map((m) => ({ ...m, level: levelOf(m.key) }))
export const essential = (list: Missing[]) => withLevel(list).filter((m) => m.level === 'ESSENTIAL')

const has = (v: unknown) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)

/** Bailleur, locataires, logement : ce que toute quittance ou tout courrier doit indiquer. */
export function partiesMissing(c: ContractInput): Missing[] {
  const out: Missing[] = []
  const l = c.landlord
  const company = l.kind === 'SCI' || l.kind === 'COMPANY'
  if (company ? !has(l.company?.name) : !has(l.lastName) || !has(l.firstNames)) out.push({ key: 'landlord.name', label: company ? 'Le nom de la société bailleresse' : 'Vos nom et prénom', where: 'LANDLORD', section: company ? 'company' : 'identity' })
  if (company ? !has(l.company?.seat) && !has(l.address) : !has(l.address)) out.push({ key: 'landlord.address', label: company ? 'L’adresse du siège de la société' : 'Votre adresse', where: 'LANDLORD', section: company ? 'company' : 'address' })
  if (!c.tenants.length) out.push({ key: 'tenant', label: 'Au moins un locataire', where: 'TERMS', section: 'parties' })
  c.tenants.forEach((t, i) => {
    if (!has(t.lastName) || !has(t.firstNames)) out.push({ key: `tenant.${i}.name`, label: `Les nom et prénom du locataire${c.tenants.length > 1 ? ` ${i + 1}` : ''}`, where: 'TENANT', section: 'identity', tenant: i })
  })
  if (!has(c.property.address)) out.push({ key: 'property.address', label: 'L’adresse du logement', where: 'PROPERTY', section: 'address' })
  return out
}

/** Logement : tout ce que la rubrique II du contrat type, les diagnostics et le mobilier exigent avant le bail. */
export function propertyLeaseMissing(p: ContractInput['property'], kind: NonNullable<ContractInput['terms']['kind']>): Missing[] {
  const out: Missing[] = []
  const push = (key: string, label: string, where: Where, section: string) => out.push({ key, label, where, section })
  // Garage, box ou place loué seul (Code civil) : il suffit de désigner l'emplacement.
  if (kind === 'PARKING' || p.nature === 'PARKING') {
    if (!has(p.parking?.type)) push('property.parkingType', 'Garage, box ou place de stationnement', 'PROPERTY', 'parking')
    return withLevel(out)
  }
  if (!has(p.habitat) || !has(p.legalRegime)) push('property.type', 'Maison ou appartement, copropriété ou non', 'PROPERTY', 'type')
  if (!has(p.constructionPeriod)) push('property.period', 'La période de construction', 'PROPERTY', 'size')
  if (!has(p.surface)) push('property.surface', 'La surface habitable', 'PROPERTY', 'size')
  if (!has(p.rooms)) push('property.rooms', 'Le nombre de pièces principales', 'PROPERTY', 'size')
  if (!has(p.heating?.mode)) push('property.heating', 'Le mode de chauffage', 'PROPERTY', 'heating')
  if (!has(p.hotWater?.mode)) push('property.hotWater', 'Le mode de production d’eau chaude', 'PROPERTY', 'heating')
  if (!has(p.equipments) && !has(p.otherEquipments)) push('property.equipments', 'Les équipements du logement', 'PROPERTY', 'equipments')
  if (!(p.smokeDetectors && p.smokeDetectors > 0) && !p.equipments?.includes('smokeDetector')) push('property.smoke', 'Le nombre de détecteurs de fumée (au moins un est obligatoire)', 'PROPERTY', 'equipments')
  if (!has(p.tv) || !has(p.internet)) push('property.tv', 'La réception de la télévision et l’accès à internet', 'PROPERTY', 'tv')
  if (!has(p.diagnostics?.dpe?.class)) push('property.dpe', 'La classe énergie du DPE', 'PROPERTY', 'diagnostics')
  if (!has(p.diagnostics?.dpe?.costMin) || !has(p.diagnostics?.dpe?.costMax) || !has(p.diagnostics?.dpe?.costYear)) push('property.dpeCost', 'Les dépenses d’énergie estimées par le DPE (fourchette et année des prix)', 'PROPERTY', 'diagnostics')
  if (!has(p.fiscalId)) push('property.fiscalId', 'L’identifiant fiscal du logement', 'PROPERTY', 'address')
  if (p.heating?.mode === 'COLLECTIVE' && !has(p.heating.split)) push('property.heatingSplit', 'La répartition de la consommation de chauffage collectif', 'PROPERTY', 'heating')
  if (p.hotWater?.mode === 'COLLECTIVE' && !has(p.hotWater.split)) push('property.hotWaterSplit', 'La répartition de la consommation d’eau chaude collective', 'PROPERTY', 'heating')
  for (const d of diagnosticsFor(p).filter((x) => x.required && x.annexed && x.key !== 'dpe')) {
    const v = p.diagnostics?.[d.key]
    if (!has(v?.date) && !has(v?.fileId)) push(`property.diag.${d.key}`, `Le diagnostic « ${d.label} » (date ou fichier)`, 'PROPERTY', 'diagnostics')
  }
  if (kind !== 'VIDE' && (p.furniture?.present?.length ?? 0) < 11) push('property.furniture', 'Les 11 éléments de mobilier obligatoires', 'PROPERTY', 'furniture')

  return withLevel(out)
}

/** Tout ce que le contrat type exige pour un bail complet, sans ligne laissée en blanc. */
export function leaseMissing(c: ContractInput): Missing[] {
  const out = partiesMissing(c)
  const p = c.property
  const t = c.terms
  const kind = t.kind ?? (p.furnished ? 'MEUBLE' : 'VIDE')
  const push = (key: string, label: string, where: Where, section: string, tenant?: number) => out.push({ key, label, where, section, tenant })

  const l = c.landlord
  if ((l.kind === 'SCI' || l.kind === 'COMPANY') && !has(l.company?.representedBy)) push('landlord.representative', 'Qui signe pour la société', 'LANDLORD', 'company')
  if (l.agent?.enabled && !has(l.agent.name)) push('landlord.agent', 'Le nom de votre mandataire', 'LANDLORD', 'agent')

  out.push(...propertyLeaseMissing(p, kind))

  // Conditions (rubriques III à VI)
  if (!has(t.startDate)) push('terms.start', 'La date d’entrée dans les lieux', 'TERMS', 'dates')
  if (kind === 'MOBILITE' && (!has(t.durationMonths) || !has(t.mobilityReason))) push('terms.mobility', 'La durée et le motif du bail mobilité', 'TERMS', 'dates')
  if (t.reduced?.enabled && !has(t.reduced.reason)) push('terms.reduced', 'L’événement qui justifie une durée réduite', 'TERMS', 'dates')
  if (!has(t.rentCents)) push('terms.rent', 'Le montant du loyer', 'TERMS', 'rent')
  if (!has(t.paymentDay)) push('terms.paymentDay', 'Le jour de paiement du loyer', 'TERMS', 'rent')
  const housing = kind !== 'PARKING'
  if (housing && (t.zone?.tense === undefined || t.zone?.tense === null)) push('terms.zone', 'Si la commune est en zone tendue', 'TERMS', 'zone')
  if (t.zone?.control && (!has(t.zone.refRentCentsM2) || !has(t.zone.refRentMaxCentsM2))) push('terms.control', 'Les loyers de référence (encadrement)', 'TERMS', 'zone')
  if (t.zone?.complementCents && !has(t.zone.complementJustification)) push('terms.complement', 'La justification du complément de loyer', 'TERMS', 'zone')
  const prev = t.previous
  if (housing && !(prev?.rentedWithin18Months === false || (has(prev?.lastRentCents) && has(prev?.lastPaymentDate)))) push('terms.previous', 'Le loyer du locataire précédent (ou « pas loué depuis 18 mois »)', 'TERMS', 'previous')
  if (kind !== 'MOBILITE' && t.revision?.enabled !== false && !has(t.revision?.irlQuarter)) push('terms.irl', 'Le trimestre de référence de l’IRL', 'TERMS', 'revision')
  if (!has(t.chargesMode) || t.chargesCents === undefined || t.chargesCents === null) push('terms.charges', 'Le montant et le mode des charges', 'TERMS', 'charges')
  if (kind !== 'MOBILITE' && (t.depositCents === undefined || t.depositCents === null)) push('terms.deposit', 'Le dépôt de garantie', 'TERMS', 'deposit')
  if (l.agent?.enabled && (!has(t.fees?.tenantVisitFileCents) || !has(t.fees?.landlordCents))) push('terms.fees', 'Les honoraires du mandataire', 'TERMS', 'clauses')
  if (!has(t.signature?.place) || !has(t.signature?.mode)) push('terms.signature', 'Le lieu et le mode de signature', 'TERMS', 'signature')

  // Cautions (article 22-1 et Code civil, art. 2297)
  c.tenants.forEach((tn, i) => {
    if (tn.guarantee !== 'CAUTION') return
    const g = tn.guarantor
    if (!g || !has(g.lastName) || !has(g.firstNames) || !has(g.address)) push(`guarantor.${i}.identity`, 'L’identité et l’adresse du garant', 'GUARANTOR', 'guarantor', i)
    if (!g?.maxCents) push(`guarantor.${i}.max`, 'Le montant maximum garanti par la caution', 'GUARANTOR', 'duration', i)
    if (!g?.duration || (g.duration === 'FIXED' && !has(g.until))) push(`guarantor.${i}.duration`, 'La durée de l’engagement de la caution', 'GUARANTOR', 'duration', i)
  })
  return withLevel(out)
}
