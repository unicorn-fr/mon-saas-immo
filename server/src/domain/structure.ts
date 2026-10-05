import { z } from 'zod'
import { civility, landlordKind, type LandlordProfile } from './contract.js'
import { isLegalPerson } from './rules.js'

/**
 * Structure qui détient un ou plusieurs logements (fiches de docs/fiscalite/structures.md) :
 * - en nom propre (PERSON) ou à plusieurs personnes (COUPLE : couple, indivision) ;
 * - SCI, familiale ou non (SCI) ; autre société, dont la SARL de famille (COMPANY).
 * Elle désigne le bailleur du bail : durée minimale (3 ou 6 ans en vide, art. 10 et 13 de la loi du 6 juillet 1989),
 * congé pour reprise permis ou non (art. 13 et 15). Le profil du bailleur garde l'identité de la personne qui signe,
 * ses coordonnées et sa signature.
 */

const text = (max = 300) => z.string().trim().max(max)
const opt = <T extends z.ZodTypeAny>(s: T) => s.optional().nullable()

export const taxRegime = z.enum(['IR', 'IS'])
export type TaxRegime = z.infer<typeof taxRegime>

export const structureSchema = z.object({
  /** Nom affiché : « En mon nom », « SCI Les Tilleuls »… */
  name: opt(text(160)),
  kind: opt(landlordKind),
  /** SCI constituée exclusivement entre parents et alliés jusqu'au 4e degré inclus (art. 13). */
  sciFamily: opt(z.boolean()),
  /** Couple ou indivision : les autres propriétaires. */
  coOwners: opt(z.array(z.object({ civility: opt(civility), firstNames: opt(text(120)), lastName: opt(text(80)) })).max(6)),
  company: opt(
    z.object({
      name: opt(text(160)),
      form: opt(text(40)),
      siren: opt(z.string().regex(/^\d{9}$/, 'Le SIREN compte 9 chiffres').or(z.literal(''))),
      seat: opt(text(300)),
      representedBy: opt(text(160)),
      representativeRole: opt(text(80)),
    }),
  ),
  /** Impôt sur le revenu (revenus fonciers ou BIC des associés) ou impôt sur les sociétés. */
  taxRegime: opt(taxRegime),
  /** Associés d'une société, ou indivisaires, avec leur part en pourcentage. */
  associates: opt(z.array(z.object({ name: opt(text(160)), sharePct: opt(z.number().min(0).max(100)) })).max(20)),
  /** Compte qui reçoit les loyers de cette structure (celui du profil sinon). */
  payment: opt(z.object({ holder: opt(text(160)), iban: opt(text(40)) })),
})
export type StructureFile = z.infer<typeof structureSchema>

export const isCompanyKind = (k: StructureFile['kind']) => k === 'SCI' || k === 'COMPANY'

/** Régime fiscal par défaut : une SCI et les personnes à l'impôt sur le revenu, une autre société à l'impôt sur les sociétés. */
export function defaultTaxRegime(s: Pick<StructureFile, 'kind' | 'company'>): TaxRegime {
  if (s.kind !== 'COMPANY') return 'IR'
  return /famille/i.test(s.company?.form ?? '') ? 'IR' : 'IS'
}

/** Première structure d'un compte, reprise du profil du bailleur tel qu'il était rempli. */
export function structureFromProfile(p: LandlordProfile): StructureFile {
  const kind = p.kind ?? 'PERSON'
  const s: StructureFile = { kind }
  if (kind === 'SCI') s.sciFamily = p.sciFamily ?? false
  if (kind === 'COUPLE' && p.coOwners?.length) s.coOwners = p.coOwners
  if (isCompanyKind(kind) && p.company) s.company = p.company
  s.taxRegime = defaultTaxRegime(s)
  return s
}

/** Nom lisible de la structure. */
export function structureName(s: StructureFile): string {
  if (s.name?.trim()) return s.name.trim()
  if (isCompanyKind(s.kind) && s.company?.name?.trim()) return [s.company.form, s.company.name].filter((x) => x?.trim()).join(' ')
  if (s.kind === 'COUPLE') return 'À plusieurs (couple ou indivision)'
  if (s.kind === 'SCI') return 'SCI'
  if (s.kind === 'COMPANY') return 'Société'
  return 'En mon nom'
}

/**
 * Bailleur d'un logement : identité, coordonnées et signature du profil ; nature, société, co-propriétaires et compte
 * de la structure. Sans structure, le profil seul (comptes créés avant les structures).
 */
export function landlordFor(profile: LandlordProfile, s: StructureFile | null): LandlordProfile {
  if (!s) return profile
  const kind = s.kind ?? 'PERSON'
  return {
    ...profile,
    kind,
    sciFamily: kind === 'SCI' ? Boolean(s.sciFamily) : null,
    coOwners: kind === 'COUPLE' ? (s.coOwners ?? []) : null,
    company: isCompanyKind(kind) ? (s.company ?? {}) : null,
    payment: s.payment?.iban?.trim() ? s.payment : profile.payment,
  }
}

/**
 * Congé pour reprise (habiter le logement) : réservé au bailleur personne physique (art. 15) et à la SCI familiale,
 * au profit d'un de ses associés seulement (art. 13). Une autre société ne peut pas le donner.
 */
export function resumptionAllowed(landlord: Pick<LandlordProfile, 'kind' | 'sciFamily'>): boolean {
  return !isLegalPerson(landlord)
}

/** Ce que la structure change pour le bail, en phrases courtes (fiche de la structure, choix à la création d'un logement). */
export function structureEffects(s: StructureFile): string[] {
  const landlord = { kind: s.kind ?? 'PERSON', sciFamily: s.sciFamily }
  const legal = isLegalPerson(landlord)
  const out = [legal ? 'Bail vide de 6 ans au moins (société).' : 'Bail vide de 3 ans au moins.', 'Bail meublé de 1 an.']
  if (legal) out.push('Pas de congé pour reprendre le logement : seulement pour le vendre ou pour un motif légitime et sérieux.')
  else if (s.kind === 'SCI') out.push('Congé pour reprise possible au profit d’un associé seulement.')
  else out.push('Congé pour reprise possible pour vous ou un proche.')
  return out
}

/** Total des parts des associés, en pourcentage, et s'il est complet (100 %). */
export function sharesTotal(s: Pick<StructureFile, 'associates'>): { total: number; complete: boolean } {
  const list = (s.associates ?? []).filter((a) => a.sharePct !== null && a.sharePct !== undefined)
  const total = Math.round(list.reduce((a, x) => a + (x.sharePct ?? 0), 0) * 100) / 100
  return { total, complete: list.length > 0 && Math.abs(total - 100) < 0.01 }
}
