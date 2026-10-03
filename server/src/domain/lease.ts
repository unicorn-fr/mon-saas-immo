import { z } from 'zod'

// ─── Données du tunnel ────────────────────────────────────────────────────────
// Le brouillon accepte des données partielles ; la validation complète se fait
// au moment de créer le bail (leaseInputSchema).

const trimmed = (max: number) => z.string().trim().max(max)

export const personSchema = z.object({
  civility: z.enum(['MADAME', 'MONSIEUR']).optional(),
  firstName: trimmed(80).min(1, 'Le prénom est obligatoire'),
  lastName: trimmed(80).min(1, 'Le nom est obligatoire'),
})

export const tenantSchema = personSchema.extend({
  email: z.union([z.literal(''), z.email('Email invalide').max(200)]).optional(),
})

export const guarantorSchema = personSchema.extend({
  address: trimmed(300).min(1, "L'adresse du garant est obligatoire"),
})

export const propertySchema = z.object({
  address: trimmed(300).min(5, "L'adresse est obligatoire"),
  postalCode: trimmed(10).optional(),
  city: trimmed(120).optional(),
  inseeCode: trimmed(10).optional(),
  banId: trimmed(60).optional(),
  surface: z.number().positive('La surface est obligatoire').max(2000),
  rooms: z.number().int().min(1).max(30),
  dpeClass: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  dpeNumber: trimmed(40).optional(),
  /** Mentions primordiales du bail (contrat type, rubrique II.A), demandées dès le formulaire de départ. */
  floorDoor: trimmed(120).optional(),
  habitat: z.enum(['COLLECTIVE', 'INDIVIDUAL']).optional(),
  legalRegime: z.enum(['MONO', 'COPRO']).optional(),
  constructionPeriod: z.enum(['BEFORE_1949', '1949_1974', '1975_1989', '1990_2005', 'AFTER_2005']).optional(),
  heatingMode: z.enum(['INDIVIDUAL', 'COLLECTIVE']).optional(),
  heatingEnergy: z.enum(['GAS', 'ELECTRIC', 'HEAT_PUMP', 'FUEL', 'WOOD', 'NETWORK']).optional(),
  hotWaterMode: z.enum(['INDIVIDUAL', 'COLLECTIVE']).optional(),
})

export const landlordSchema = personSchema.extend({
  address: trimmed(300).min(5, 'Votre adresse est obligatoire'),
})

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')

export const rentSchema = z.object({
  rentCents: z.number().int().positive('Le loyer est obligatoire').max(10_000_000),
  chargesCents: z.number().int().min(0).max(10_000_000),
  depositCents: z.number().int().min(0).optional(),
  startDate: isoDate,
  paymentDay: z.number().int().min(1).max(28).default(5),
  chargesMode: z.enum(['PROVISION', 'FORFAIT']).optional(),
})

export const leaseTypeSchema = z.enum(['UNFURNISHED', 'FURNISHED'])

export const draftDataSchema = z.object({
  type: leaseTypeSchema.optional(),
  property: propertySchema.partial().optional(),
  landlord: landlordSchema.partial().optional(),
  tenants: z.array(tenantSchema.partial()).max(6).optional(),
  guarantor: guarantorSchema.partial().nullable().optional(),
  rent: rentSchema.partial().optional(),
  source: z.enum(['tunnel', 'import']).optional(),
  irl: z.object({ quarter: z.string(), value: z.number() }).nullable().optional(),
})
export type DraftData = z.infer<typeof draftDataSchema>

export const leaseInputSchema = z
  .object({
    type: leaseTypeSchema,
    property: propertySchema,
    landlord: landlordSchema,
    tenants: z.array(tenantSchema).min(1, 'Ajoutez au moins un locataire').max(6),
    guarantor: guarantorSchema.nullable().optional(),
    rent: rentSchema,
    source: z.enum(['tunnel', 'import']).default('tunnel'),
    irl: z.object({ quarter: z.string(), value: z.number() }).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    const max = maxDepositCents(v.type, v.rent.rentCents)
    // Un bail déjà signé est enregistré tel quel ; l'écran de relecture signale le dépassement.
    if (v.source !== 'import' && v.rent.depositCents !== undefined && v.rent.depositCents > max) {
      ctx.addIssue({
        code: 'custom',
        path: ['rent', 'depositCents'],
        message: `Le dépôt de garantie ne peut pas dépasser ${formatEuros(max)}.`,
      })
    }
  })
export type LeaseInput = z.infer<typeof leaseInputSchema>

// ─── Règles (loi n° 89-462 du 6 juillet 1989) ─────────────────────────────────

/** Durée minimale : 3 ans en vide (bailleur personne physique, art. 10), 1 an en meublé (art. 25-7). */
export function durationMonths(type: LeaseType): number {
  return type === 'UNFURNISHED' ? 36 : 12
}

/** Dépôt de garantie maximum : 1 mois de loyer hors charges en vide (art. 22), 2 mois en meublé (art. 25-6). */
export function maxDepositCents(type: LeaseType, rentCents: number): number {
  return type === 'UNFURNISHED' ? rentCents : rentCents * 2
}

/** Délai de congé donné par le bailleur avant l'échéance : 6 mois en vide (art. 15), 3 mois en meublé (art. 25-8). */
export function landlordNoticeMonths(type: LeaseType): number {
  return type === 'UNFURNISHED' ? 6 : 3
}

export type LeaseType = z.infer<typeof leaseTypeSchema>

// ─── Dates (UTC, format YYYY-MM-DD) ───────────────────────────────────────────

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(date.getUTCDate(), lastDay))
  return d
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000)
}

/** Fin du bail : la veille de la date anniversaire de fin de période. */
export function leaseEndDate(start: Date, months: number): Date {
  return addDays(addMonths(start, months), -1)
}

// ─── Formatage ────────────────────────────────────────────────────────────────

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function formatDateFr(date: Date): string {
  const day = date.getUTCDate()
  return `${day === 1 ? '1er' : day} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export function monthYearFr(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`
}

/** Montant en euros, séparateurs simples (compatibles avec les polices standard des PDF). */
export function formatEuros(cents: number): string {
  const euros = cents / 100
  const hasCents = cents % 100 !== 0
  const [int, dec] = euros.toFixed(hasCents ? 2 : 0).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${grouped}${dec ? `,${dec}` : ''} €`
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`.trim()
}
