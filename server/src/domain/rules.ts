import type { LandlordProfile, LeaseKind, LeaseTerms, PropertyFile } from './contract.js'
import { addDays, addMonths, parseIsoDate, toIsoDate as toIso } from './lease.js'
import { RENT_CONTROL_COMMUNES, RENT_CONTROL_END } from './data/encadrement.js'
import { ZONES_TENDUES } from './data/zonesTendues.js'

/**
 * Règles de la loi n° 89-462 du 6 juillet 1989 appliquées aux fiches Bailio.
 * Chaque règle cite son article ; toute modification s'accompagne d'un test (rules.test.ts).
 */

/** Personne morale au sens de l'art. 10 : société ou SCI non familiale. Bail vide de 6 ans. */
export function isLegalPerson(landlord: Pick<LandlordProfile, 'kind' | 'sciFamily'>): boolean {
  if (landlord.kind === 'COMPANY') return true
  if (landlord.kind === 'SCI') return !landlord.sciFamily
  return false
}

/**
 * Durée du bail en mois.
 * - Vide : 3 ans (personne physique, SCI familiale), 6 ans (personne morale), art. 10 ;
 *   durée réduite d'au moins 1 an pour un événement familial ou professionnel précis, art. 11.
 * - Meublé : 1 an, art. 25-7 ; étudiant : 9 mois, non reconduit.
 * - Mobilité : de 1 à 10 mois, non renouvelable, art. 25-14.
 * - Garage loué seul (Code civil, art. 1709 et suivants) : durée libre, convenue au contrat, 12 mois par défaut.
 */
export function leaseDurationMonths(kind: LeaseKind, landlord: Pick<LandlordProfile, 'kind' | 'sciFamily'>, terms: Pick<LeaseTerms, 'durationMonths' | 'reduced'> = {}): number {
  switch (kind) {
    case 'VIDE': {
      const full = isLegalPerson(landlord) ? 72 : 36
      if (terms.reduced?.enabled && !isLegalPerson(landlord) && terms.durationMonths) {
        return Math.min(35, Math.max(12, terms.durationMonths))
      }
      return full
    }
    case 'MEUBLE':
      return 12
    case 'ETUDIANT':
      return 9
    case 'MOBILITE':
      return Math.min(10, Math.max(1, terms.durationMonths ?? 10))
    case 'PARKING':
      return terms.durationMonths ?? 12
  }
}

/** Ce qui se passe à l'échéance, en une phrase. */
export function renewalLabel(kind: LeaseKind, landlord: Pick<LandlordProfile, 'kind' | 'sciFamily'>, terms: Pick<LeaseTerms, 'durationMonths'> = {}): string {
  switch (kind) {
    case 'VIDE':
      return isLegalPerson(landlord) ? 'Reconduit tacitement pour 6 ans' : 'Reconduit tacitement pour 3 ans'
    case 'MEUBLE':
      return 'Reconduit tacitement pour 1 an'
    case 'ETUDIANT':
      return 'Prend fin à son terme, sans reconduction'
    case 'MOBILITE':
      return 'Prend fin à son terme : ni renouvelé, ni reconduit'
    case 'PARKING': {
      const months = terms.durationMonths ?? 12
      return `Reconduit tacitement pour ${months % 12 === 0 ? `${months / 12} an${months > 12 ? 's' : ''}` : `${months} mois`}`
    }
  }
}

/**
 * Dépôt de garantie maximum : 1 mois (vide, art. 22), 2 mois (meublé, art. 25-6), interdit en bail mobilité (art. 25-17).
 * Garage loué seul : aucun plafond légal (Code civil), Bailio propose 2 mois au plus, comme l'usage.
 */
export function maxDepositFor(kind: LeaseKind, rentCents: number): number {
  if (kind === 'MOBILITE') return 0
  return kind === 'VIDE' ? rentCents : rentCents * 2
}

/**
 * Préavis du bailleur avant l'échéance : 6 mois (vide, art. 15), 3 mois (meublé, art. 25-8). Aucun congé en bail mobilité
 * ou étudiant 9 mois. Garage loué seul : préavis convenu au contrat (`noticeMonths`), 1 mois par défaut.
 */
export function landlordNoticeMonthsFor(kind: LeaseKind, terms: Pick<LeaseTerms, 'noticeMonths'> = {}): number | null {
  if (kind === 'VIDE') return 6
  if (kind === 'MEUBLE') return 3
  if (kind === 'PARKING') return terms.noticeMonths ?? 1
  return null
}

/** Bail d'habitation (loi de 1989) : tout sauf le garage loué seul. */
export const isHousing = (kind: LeaseKind) => kind !== 'PARKING'

/** Bail meublé au sens de la loi de 1989 (meublé, étudiant, mobilité). Le garage loué seul n'est jamais meublé. */
export const isFurnished = (kind: LeaseKind) => kind === 'MEUBLE' || kind === 'ETUDIANT' || kind === 'MOBILITE'

/**
 * Modes de récupération des charges autorisés (art. 23, 8-1, 25-10, 25-16) :
 * vide : provisions ou paiement périodique, forfait seulement en colocation ; meublé : tous ; mobilité : forfait uniquement ;
 * garage loué seul : libre (Code civil).
 */
export function allowedChargesModes(kind: LeaseKind, colocation: boolean): ('PROVISION' | 'PERIODIC' | 'FORFAIT')[] {
  if (kind === 'MOBILITE') return ['FORFAIT']
  if (kind === 'VIDE' && !colocation) return ['PROVISION', 'PERIODIC']
  return ['PROVISION', 'PERIODIC', 'FORFAIT']
}

/** Loyer gelé pour les logements classés F ou G (loi Climat et résilience, art. 17-1 : depuis le 24 août 2022). */
export function rentRevisionAllowed(dpe: string | null | undefined): boolean {
  return dpe !== 'F' && dpe !== 'G'
}

/**
 * Décence énergétique (art. 6 et décret 2002-120) : logements classés G interdits à la location depuis le 1er janvier 2025,
 * F à partir du 1er janvier 2028, E à partir du 1er janvier 2034. Renvoie un avertissement ou null.
 */
export function energyRentalWarning(dpe: string | null | undefined, onDate = new Date()): string | null {
  const y = onDate.getUTCFullYear()
  if (dpe === 'G') return 'Classe G : le logement ne peut plus être loué depuis le 1er janvier 2025 (logement non décent).'
  if (dpe === 'F') return y >= 2028 ? 'Classe F : le logement ne peut plus être loué depuis le 1er janvier 2028.' : 'Classe F : le loyer ne peut pas augmenter, et le logement ne pourra plus être loué à partir du 1er janvier 2028.'
  if (dpe === 'E' && y >= 2031) return 'Classe E : le logement ne pourra plus être loué à partir du 1er janvier 2034.'
  return null
}

/**
 * Logement interdit à la location à cette date (critère de performance énergétique de la décence : art. 6 de la loi
 * et décret n° 2002-120) : classe G depuis le 1er janvier 2025, F au 1er janvier 2028, E au 1er janvier 2034.
 * Aucun nouveau bail ne peut être fait ni signé. Renvoie le motif, ou null.
 */
export function rentalForbidden(dpe: string | null | undefined, onDate = new Date()): string | null {
  const day = onDate.toISOString().slice(0, 10)
  const from: Record<string, string> = { G: '2025-01-01', F: '2028-01-01', E: '2034-01-01' }
  const start = dpe ? from[dpe] : undefined
  if (!start || day < start) return null
  return `Logement classé ${dpe} au DPE : il ne peut plus être loué depuis le ${start === '2025-01-01' ? '1er janvier 2025' : start === '2028-01-01' ? '1er janvier 2028' : '1er janvier 2034'} (logement non décent, article 6 de la loi du 6 juillet 1989). Des travaux de rénovation énergétique et un nouveau DPE sont nécessaires avant de signer un bail.`
}

export interface RentIssue {
  code: 'CEILING' | 'COMPLEMENT_ENERGY' | 'COMPLEMENT_NO_CONTROL' | 'RELET_ENERGY' | 'RELET_TENSE'
  message: string
}

/**
 * Plafonds du loyer d'un nouveau bail, vérifiés avant la signature :
 * - encadrement (loi ELAN, art. 140) : loyer de base au plus égal au loyer de référence majoré × surface habitable ;
 *   complément de loyer seulement en zone encadrée, et jamais pour un logement classé F ou G ;
 * - logement classé F ou G (art. 17 et 17-1, loi Climat et résilience) : pas plus que le loyer du locataire précédent ;
 * - zone tendue (décret n° 2017-1198, reconduit chaque année) : pas plus que le loyer du locataire précédent,
 *   sauf exception à justifier (révision non appliquée, travaux importants, loyer manifestement sous-évalué).
 */
export function rentIssues(input: {
  rentCents?: number | null
  surface?: number | null
  dpe?: string | null
  zone?: LeaseTerms['zone']
  previous?: LeaseTerms['previous']
}): RentIssue[] {
  const out: RentIssue[] = []
  const rent = input.rentCents ?? null
  const z = input.zone ?? {}
  const complement = z.complementCents ?? 0
  const energy = input.dpe === 'F' || input.dpe === 'G'
  const eur = (c: number) => `${(c / 100).toLocaleString('fr-FR', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`
  if (rent !== null && z.control && z.refRentMaxCentsM2 && input.surface) {
    const cap = Math.round(z.refRentMaxCentsM2 * input.surface)
    if (rent - complement > cap) out.push({ code: 'CEILING', message: `Le loyer de base (${eur(rent - complement)}) dépasse le loyer de référence majoré : ${eur(cap)} pour ${String(input.surface).replace('.', ',')} m². Baissez le loyer, ou justifiez un complément de loyer.` })
  }
  if (complement > 0 && !z.control) out.push({ code: 'COMPLEMENT_NO_CONTROL', message: 'Le complément de loyer n’existe que dans les communes où les loyers sont encadrés. Retirez-le, ou indiquez que la commune est encadrée.' })
  if (complement > 0 && energy) out.push({ code: 'COMPLEMENT_ENERGY', message: `Logement classé ${input.dpe} : aucun complément de loyer n’est permis.` })
  const prev = input.previous
  if (rent !== null && prev?.rentedWithin18Months && prev.lastRentCents && rent > prev.lastRentCents) {
    if (energy) out.push({ code: 'RELET_ENERGY', message: `Logement classé ${input.dpe} : le loyer ne peut pas dépasser celui du locataire précédent (${eur(prev.lastRentCents)}).` })
    else if (z.tense && !prev.increaseReason?.trim())
      out.push({ code: 'RELET_TENSE', message: `Zone tendue : le loyer ne peut pas dépasser celui du locataire précédent (${eur(prev.lastRentCents)}), sauf si la dernière révision n’a pas été faite, après des travaux importants, ou si l’ancien loyer était manifestement sous-évalué. Indiquez le motif, ou baissez le loyer.` })
  }
  return out
}

/**
 * Fin de validité d'un diagnostic fait à cette date (null : sans limite, ou date inconnue).
 * DPE : 10 ans, mais ceux réalisés entre 2013 et 2017 ne valent plus depuis le 1er janvier 2023, et ceux réalisés
 * entre le 1er janvier 2018 et le 30 juin 2021 depuis le 1er janvier 2025 (décret n° 2020-1610). État des risques :
 * moins de 6 mois à la signature. Électricité et gaz : 6 ans. Plomb : 6 ans (illimité sans plomb, à vérifier sur le
 * constat). Amiante et bruit : sans limite.
 */
export function diagnosticValidUntil(key: DiagnosticRule['key'], date: string | null | undefined): string | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const add = (months: number) => toIso(addMonths(parseIsoDate(date), months))
  switch (key) {
    case 'dpe':
      if (date < '2013-01-01') return '2017-12-31'
      if (date < '2018-01-01') return '2022-12-31'
      if (date < '2021-07-01') return '2024-12-31'
      return add(120)
    case 'erp':
      return add(6)
    case 'electricity':
    case 'gas':
    case 'lead':
      return add(72)
    default:
      return null
  }
}

/** Diagnostics exigés et joints au bail qui ne seront plus valables à la date de signature. */
export function expiredDiagnostics(p: PropertyFile, onDate = new Date()): Array<{ key: DiagnosticRule['key']; label: string; until: string }> {
  const day = onDate.toISOString().slice(0, 10)
  return diagnosticsFor(p)
    .filter((d) => d.required && d.annexed)
    .map((d) => ({ key: d.key, label: d.label, until: diagnosticValidUntil(d.key, p.diagnostics?.[d.key]?.date) }))
    .filter((d): d is { key: DiagnosticRule['key']; label: string; until: string } => Boolean(d.until && d.until < day))
}

export interface DiagnosticRule {
  key: 'dpe' | 'erp' | 'electricity' | 'gas' | 'lead' | 'asbestos' | 'noise'
  label: string
  /** Exigé pour ce logement. */
  required: boolean
  /** Explication courte de la règle appliquée. */
  reason: string
  validity: string
  /** Joint au bail (dossier de diagnostic technique) ou seulement tenu à disposition. */
  annexed: boolean
}

/** Dossier de diagnostic technique (art. 3-3) selon la période de construction et les installations. */
export function diagnosticsFor(p: PropertyFile): DiagnosticRule[] {
  // Garage, box ou place loué seul : aucun diagnostic n'est exigé (ce n'est pas un logement).
  if (p.nature === 'PARKING') return []
  const period = p.constructionPeriod
  const before1949 = period === 'BEFORE_1949'
  const before1997 = p.permitBefore1997 ?? (period ? ['BEFORE_1949', '1949_1974', '1975_1989'].includes(period) : true)
  const hasGas = p.diagnostics?.gas?.hasGas ?? p.heating?.energy === 'GAS'
  const elecOld = p.diagnostics?.electricity?.installOver15 ?? true
  const gasOld = p.diagnostics?.gas?.installOver15 ?? true
  return [
    { key: 'dpe', label: 'Performance énergétique (DPE)', required: true, reason: 'Toujours exigé', validity: '10 ans', annexed: true },
    { key: 'erp', label: 'État des risques et pollutions', required: true, reason: 'Toujours exigé', validity: '6 mois', annexed: true },
    { key: 'electricity', label: 'Installation électrique', required: elecOld, reason: 'Installation de plus de 15 ans', validity: '6 ans', annexed: true },
    { key: 'gas', label: 'Installation de gaz', required: Boolean(hasGas) && gasOld, reason: hasGas ? 'Installation de gaz de plus de 15 ans' : 'Pas d’installation de gaz', validity: '6 ans', annexed: true },
    { key: 'lead', label: 'Plomb (CREP)', required: before1949, reason: before1949 ? 'Construit avant 1949' : 'Construit après 1949', validity: 'Illimitée si absence de plomb, 6 ans sinon', annexed: true },
    { key: 'asbestos', label: 'Amiante, parties privatives', required: before1997, reason: before1997 ? 'Permis de construire avant juillet 1997' : 'Permis après juillet 1997', validity: 'Illimitée si négatif', annexed: false },
    { key: 'noise', label: 'Bruit des aérodromes', required: Boolean(p.diagnostics?.noise?.inZone), reason: p.diagnostics?.noise?.inZone ? 'Logement dans une zone d’exposition au bruit' : 'Hors zone d’exposition au bruit', validity: 'Lié au plan en vigueur', annexed: true },
  ]
}

/** Arrondissements de Paris, Lyon et Marseille : rattachés au code de la commune. */
export function communeCode(inseeCode: string | null | undefined): string | null {
  if (!inseeCode) return null
  if (/^751(0[1-9]|1\d|20)$/.test(inseeCode)) return '75056'
  if (/^6938[1-9]$/.test(inseeCode)) return '69123'
  if (/^132(0[1-9]|1[0-6])$/.test(inseeCode)) return '13055'
  return inseeCode
}

/**
 * Zone tendue au sens de la loi du 6 juillet 1989 (préavis d'un mois, loyer plafonné à la relocation), d'après la
 * liste officielle des communes (décret n° 2013-392 modifié). null : commune inconnue.
 */
export function isTenseZone(inseeCode: string | null | undefined): boolean | null {
  const c = communeCode(inseeCode)
  return c ? ZONES_TENDUES.has(c) : null
}

/** Encadrement des loyers (loi ELAN, art. 140) : toute la commune, une partie seulement, ou pas d'encadrement. */
export function rentControlFor(inseeCode: string | null | undefined, onDate = new Date()): 'full' | 'partial' | null {
  const c = communeCode(inseeCode)
  if (!c) return null
  // Après la fin de l'expérimentation, sauf prolongation votée : le propriétaire confirme lui-même.
  if (onDate.toISOString().slice(0, 10) > RENT_CONTROL_END) return null
  return RENT_CONTROL_COMMUNES[c] ?? null
}

export function rentControlLikely(inseeCode: string | null | undefined): boolean {
  return rentControlFor(inseeCode) !== null
}

/** Montant à payer pour le premier mois, au prorata des jours si l'entrée a lieu en cours de mois. */
export function firstPayment(startIso: string, rentCents: number, chargesCents: number): { fullMonth: boolean; days: number; daysInMonth: number; rentCents: number; chargesCents: number } {
  const start = parseIsoDate(startIso)
  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
  const days = daysInMonth - start.getUTCDate() + 1
  if (days === daysInMonth) return { fullMonth: true, days, daysInMonth, rentCents, chargesCents }
  return {
    fullMonth: false,
    days,
    daysInMonth,
    rentCents: Math.round((rentCents * days) / daysInMonth),
    chargesCents: Math.round((chargesCents * days) / daysInMonth),
  }
}

/** Date de fin du bail (veille de la date anniversaire). */
export function contractEndDate(startIso: string, months: number): Date {
  return addDays(addMonths(parseIsoDate(startIso), months), -1)
}

/**
 * Honoraires de location à la charge du locataire (décret n° 2014-890) : plafond par m² de surface habitable
 * pour la visite, le dossier et le bail (12 € zone très tendue, 10 € zone tendue, 8 € ailleurs), plus 3 € pour l'état des lieux.
 */
export function feeCapsCents(surface: number, zone: 'VERY_TENSE' | 'TENSE' | 'OTHER'): { visitFileLease: number; inventory: number } {
  const perM2 = zone === 'VERY_TENSE' ? 1200 : zone === 'TENSE' ? 1000 : 800
  return { visitFileLease: Math.round(perM2 * surface), inventory: Math.round(300 * surface) }
}

/** Clauses réputées non écrites (art. 4). Chaque règle : motif affiché au propriétaire. */
const FORBIDDEN: { test: RegExp; reason: string }[] = [
  { test: /(interdi|pas autoris|proscri|refus)\w*[^.]{0,60}\b(animal|animaux|chien|chat)|(animal|animaux|chien|chat)[^.]{0,60}(interdi|pas autoris|proscri)/i, reason: 'On ne peut pas interdire tout animal domestique (seuls les chiens de 1re catégorie peuvent l’être).' },
  { test: /assur\w*[^.]{0,80}(choisi|désign|impos|auprès de la compagnie|par le bailleur)/i, reason: 'On ne peut pas imposer l’assureur du locataire.' },
  { test: /(prélèvement automatique|retenue sur (le |son )?salaire)/i, reason: 'On ne peut pas imposer le prélèvement automatique ni la retenue sur salaire.' },
  { test: /(pénalit|amende|intérêts? (de|pour) retard|majoration (pour|de) retard)/i, reason: 'Les pénalités de retard sont interdites.' },
  { test: /(interdi|pas autoris)\w*[^.]{0,60}(héberg|recevoir)/i, reason: 'On ne peut pas interdire d’héberger ses proches.' },
  { test: /(frais|facturé|payant)[^.]{0,60}(quittance|état des lieux|avis d.échéance)/i, reason: 'La quittance, l’avis d’échéance et l’état des lieux ne peuvent pas être facturés au locataire.' },
  { test: /(responsab|solidaire)\w*[^.]{0,80}(dégradation|dommage)s?[^.]{0,60}(parties communes|collecti)/i, reason: 'Le locataire ne peut pas être rendu responsable des dégradations collectives.' },
  { test: /(activité|activités) (politique|syndicale|associative|confessionnelle|religieuse)/i, reason: 'On ne peut pas interdire une activité politique, syndicale, associative ou religieuse.' },
  { test: /(visite|visiter)[^.]{0,80}(jours? fériés|dimanche|plus de deux heures)/i, reason: 'Les visites ne peuvent pas avoir lieu les jours fériés ni plus de deux heures par jour ouvrable.' },
  { test: /(renonce|renonciation)[^.]{0,60}(recours|droit)/i, reason: 'Le locataire ne peut pas renoncer à ses droits ou recours.' },
  { test: /(contrat d.entretien|entreprise)[^.]{0,60}(choisi|désign|impos)\w* par le bailleur/i, reason: 'On ne peut pas imposer une entreprise choisie par le bailleur pour l’entretien.' },
]

export function forbiddenClauseReasons(clause: string): string[] {
  return FORBIDDEN.filter((f) => f.test.test(clause)).map((f) => f.reason)
}

/** La caution ne peut pas être demandée en plus d'une assurance loyers impayés, sauf étudiant ou apprenti (art. 22-1). */
export function cautionAllowed(guarantee: string | null | undefined, situation: string | null | undefined, landlordHasGli: boolean): boolean {
  if (guarantee !== 'CAUTION') return true
  if (!landlordHasGli) return true
  return situation === 'STUDENT' || situation === 'APPRENTICE'
}
