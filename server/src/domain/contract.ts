import { z } from 'zod'

/**
 * Fiches Bailio : chaque donnée est saisie une seule fois (profil du bailleur, fiche du logement,
 * fiche du locataire et de son garant), puis reprise dans tous les documents qui en ont besoin.
 * Tous les champs sont facultatifs : une fiche se remplit petit à petit, et son taux de complétude
 * indique ce qu'il manque pour produire chaque document (voir completion.ts).
 */

const text = (max = 300) => z.string().trim().max(max)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')
const cents = z.number().int().min(0).max(100_000_000)
const opt = <T extends z.ZodTypeAny>(s: T) => s.optional().nullable()

// ── Profil du bailleur ───────────────────────────────────────────────────────

export const landlordKind = z.enum(['PERSON', 'COUPLE', 'SCI', 'COMPANY'])
export const civility = z.enum(['MADAME', 'MONSIEUR'])

export const landlordProfileSchema = z.object({
  kind: opt(landlordKind),
  /** SCI constituée exclusivement entre parents et alliés jusqu'au 4e degré : bail de 3 ans comme un particulier. */
  sciFamily: opt(z.boolean()),
  civility: opt(civility),
  lastName: opt(text(80)),
  usageName: opt(text(80)),
  firstNames: opt(text(120)),
  birthName: opt(text(80)),
  birthDate: opt(isoDate),
  birthPlace: opt(text(120)),
  /** Couple ou indivision : les autres bailleurs. */
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
  address: opt(text(300)),
  postalCode: opt(text(10)),
  city: opt(text(120)),
  email: opt(z.email('Email invalide').or(z.literal(''))),
  phone: opt(text(30)),
  agent: opt(
    z.object({
      enabled: opt(z.boolean()),
      name: opt(text(160)),
      address: opt(text(300)),
      cardNumber: opt(text(60)),
      cardIssuer: opt(text(120)),
    }),
  ),
  payment: opt(z.object({ holder: opt(text(160)), iban: opt(text(40)) })),
  /** Signature dessinée (image PNG en data URL), apposée sur les quittances. */
  signature: opt(z.string().max(400_000).regex(/^data:image\/png;base64,/, 'Signature invalide').or(z.literal(''))),
})
export type LandlordProfile = z.infer<typeof landlordProfileSchema>

// ── Fiche du logement ────────────────────────────────────────────────────────

export const constructionPeriod = z.enum(['BEFORE_1949', '1949_1974', '1975_1989', '1990_2005', 'AFTER_2005'])
export const dpeClass = z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G'])

export const EQUIPMENTS = {
  kitchen: 'Cuisine équipée',
  hob: 'Plaques de cuisson',
  oven: 'Four',
  hood: 'Hotte',
  bathtub: 'Baignoire',
  shower: 'Douche',
  washer: 'Lave-linge',
  shutters: 'Volets roulants',
  doubleGlazing: 'Double vitrage',
  alarm: 'Alarme',
  gate: 'Portail motorisé',
  smokeDetector: 'Détecteur de fumée',
  intercom: 'Interphone',
} as const
export const ANNEXES = {
  garage: 'Garage',
  garden: 'Jardin privatif',
  cellar: 'Cave',
  parking: 'Place de parking',
  balcony: 'Balcon',
  terrace: 'Terrasse',
  attic: 'Grenier',
  shed: 'Abri de jardin',
} as const
export const COMMON_AREAS = {
  elevator: 'Ascenseur',
  bikes: 'Local vélos',
  green: 'Espaces verts',
  bins: 'Local poubelles',
  caretaker: 'Gardien',
  laundry: 'Laverie',
} as const
/** Décret n° 2015-981 du 31 juillet 2015 : les 11 éléments de mobilier d'un logement meublé. */
export const FURNITURE_REQUIRED = {
  bedding: 'Literie avec couette ou couverture',
  blackout: 'Occultation des fenêtres des chambres',
  hob: 'Plaques de cuisson',
  oven: 'Four ou micro-ondes',
  fridge: 'Réfrigérateur avec compartiment congélation',
  dishes: 'Vaisselle pour les repas',
  utensils: 'Ustensiles de cuisine',
  table: 'Table et sièges',
  shelves: 'Étagères de rangement',
  lights: 'Luminaires',
  cleaning: 'Matériel d’entretien ménager',
} as const

const keysOf = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]]

const diagnosticSchema = z.object({ date: opt(isoDate), fileId: opt(z.string().uuid()), note: opt(text(200)) })

export const propertyFileSchema = z.object({
  label: opt(text(120)),
  address: opt(text(300)),
  postalCode: opt(text(10)),
  city: opt(text(120)),
  inseeCode: opt(text(10)),
  banId: opt(text(60)),
  building: opt(text(80)),
  floorDoor: opt(text(120)),
  lotNumber: opt(text(40)),
  fiscalId: opt(text(40)),
  habitat: opt(z.enum(['COLLECTIVE', 'INDIVIDUAL'])),
  legalRegime: opt(z.enum(['MONO', 'COPRO'])),
  furnished: opt(z.boolean()),
  destination: opt(z.enum(['HABITATION', 'MIXTE'])),
  copro: opt(z.object({ syndic: opt(text(160)), quotePart: opt(text(80)), extractsProvided: opt(z.boolean()) })),
  constructionPeriod: opt(constructionPeriod),
  /** Permis de construire délivré avant le 1er juillet 1997 (repérage de l'amiante). */
  permitBefore1997: opt(z.boolean()),
  surface: opt(z.number().positive().max(2000)),
  rooms: opt(z.number().int().min(1).max(30)),
  roomList: opt(z.array(z.object({ name: text(60), level: opt(text(40)), note: opt(text(160)) })).max(40)),
  heating: opt(
    z.object({
      mode: opt(z.enum(['INDIVIDUAL', 'COLLECTIVE'])),
      energy: opt(z.enum(['GAS', 'ELECTRIC', 'HEAT_PUMP', 'FUEL', 'WOOD', 'NETWORK'])),
      appliance: opt(text(120)),
      lastMaintenance: opt(isoDate),
      /** Chauffage collectif : modalités de répartition de la consommation. */
      split: opt(text(300)),
    }),
  ),
  hotWater: opt(z.object({ mode: opt(z.enum(['INDIVIDUAL', 'COLLECTIVE'])), split: opt(text(300)) })),
  equipments: opt(z.array(z.enum(keysOf(EQUIPMENTS))).max(30)),
  otherEquipments: opt(text(300)),
  annexes: opt(z.array(z.enum(keysOf(ANNEXES))).max(20)),
  garageNumber: opt(text(40)),
  gardenArea: opt(z.number().positive().max(100_000)),
  commonAreas: opt(z.array(z.enum(keysOf(COMMON_AREAS))).max(20)),
  tv: opt(z.enum(['INDIVIDUAL', 'COLLECTIVE', 'CABLE', 'SATELLITE', 'NONE'])),
  internet: opt(z.enum(['FIBER', 'ADSL', 'NONE'])),
  diagnostics: opt(
    z.object({
      dpe: opt(
        diagnosticSchema.extend({
          class: opt(dpeClass),
          ges: opt(dpeClass),
          number: opt(text(40)),
          /** Dépenses annuelles d'énergie estimées par le DPE (euros, fourchette) et année des prix de référence. */
          costMin: opt(z.number().int().min(0).max(100_000)),
          costMax: opt(z.number().int().min(0).max(100_000)),
          costYear: opt(z.number().int().min(2015).max(2100)),
        }),
      ),
      erp: opt(diagnosticSchema),
      electricity: opt(diagnosticSchema.extend({ installOver15: opt(z.boolean()) })),
      gas: opt(diagnosticSchema.extend({ hasGas: opt(z.boolean()), installOver15: opt(z.boolean()) })),
      lead: opt(diagnosticSchema),
      asbestos: opt(diagnosticSchema),
      noise: opt(diagnosticSchema.extend({ inZone: opt(z.boolean()) })),
    }),
  ),
  market: opt(
    z.object({
      /** Commune en zone tendue (décret n° 2013-392 modifié). null : non vérifié. */
      tense: opt(z.boolean()),
      refRentCentsM2: opt(cents),
      refRentMaxCentsM2: opt(cents),
    }),
  ),
  furniture: opt(
    z.object({
      present: opt(z.array(z.enum(keysOf(FURNITURE_REQUIRED))).max(11)),
      inventory: opt(z.array(z.object({ room: opt(text(60)), item: text(120), count: z.number().int().min(1).max(999), state: opt(text(40)) })).max(300)),
    }),
  ),
  photos: opt(z.array(z.string().uuid()).max(60)),
  /** Autorisation préalable de mise en location (« permis de louer »), exigée dans certaines communes. */
  rentalPermit: opt(z.object({ required: opt(z.boolean()), reference: opt(text(80)), date: opt(isoDate) })),
  /** Détecteurs de fumée installés (code de la construction et de l'habitation). */
  smokeDetectors: opt(z.number().int().min(0).max(20)),
  /** Clés et moyens d'accès remis : « 2 clés, 1 badge, 1 télécommande ». */
  keys: opt(text(200)),
  /** Achat du logement : sert au rendement brut du bilan. */
  purchase: opt(z.object({ priceCents: opt(z.number().int().min(0).max(1_000_000_000)), date: opt(isoDate) })),
  /** Assurance du propriétaire (PNO) : numéro de contrat repris dans les déclarations de sinistre. */
  ownerInsurance: opt(z.object({ policyNumber: opt(text(60)), contactId: opt(z.string().uuid()) })),
  /** Par année de déclaration : sommes saisies une fois pour l'aide fiscale (intérêts d'emprunt, honoraires). */
  tax: opt(z.record(z.string().regex(/^\d{4}$/), z.object({ loanInterestCents: opt(cents), adminFeesCents: opt(cents) }))),
  /** Annonce de mise en location : réglages gardés pour la prochaine fois. */
  ad: opt(
    z.object({
      title: opt(text(140)),
      description: opt(text(3000)),
      rentCents: opt(cents),
      chargesCents: opt(cents),
      chargesMode: opt(z.enum(['PROVISION', 'FORFAIT'])),
      depositCents: opt(cents),
      complementCents: opt(cents),
      availableFrom: opt(isoDate),
      /** Pièces demandées aux candidats (parmi celles autorisées par le décret n° 2015-1437). */
      requestedDocs: opt(z.array(z.enum(['identity', 'home', 'activity', 'taxNotice', 'income'])).max(5)),
      /** Les mêmes pièces sont demandées pour le garant, s'il y en a un. */
      guarantorDocs: opt(z.boolean()),
    }),
  ),
})
export type PropertyFile = z.infer<typeof propertyFileSchema>

// ── Fiche du locataire et garant ─────────────────────────────────────────────

/**
 * Pièces que la loi autorise à demander au locataire et à sa caution (décret n° 2015-1437 du 5 novembre 2015) :
 * une pièce d'identité, un justificatif de domicile, des justificatifs d'activité et de ressources (dont l'avis d'imposition).
 */
export const TENANT_DOCUMENTS = {
  identity: 'Pièce d’identité',
  home: 'Justificatif de domicile',
  activity: 'Justificatif d’activité professionnelle',
  taxNotice: 'Dernier avis d’imposition',
  income: 'Justificatifs de ressources',
} as const
const documentsSchema = opt(
  z
    .array(
      z.object({
        category: z.enum(Object.keys(TENANT_DOCUMENTS) as [string, ...string[]]),
        label: opt(text(160)),
        received: z.boolean(),
        fileId: opt(z.string().uuid()),
        /** Envoyé par le locataire depuis son lien : à vérifier par le propriétaire. */
        source: opt(z.enum(['OWNER', 'TENANT'])),
        verifiedAt: opt(text(40)),
      }),
    )
    .max(20),
)
const situationSchema = z.enum(['EMPLOYEE', 'SELF_EMPLOYED', 'STUDENT', 'APPRENTICE', 'RETIRED', 'OTHER'])

export const guarantorSchema = z.object({
  civility: opt(civility),
  lastName: opt(text(80)),
  firstNames: opt(text(120)),
  birthDate: opt(isoDate),
  birthPlace: opt(text(120)),
  link: opt(text(80)),
  address: opt(text(300)),
  email: opt(z.email('Email invalide').or(z.literal(''))),
  phone: opt(text(30)),
  situation: opt(situationSchema),
  employer: opt(text(160)),
  monthlyIncomeCents: opt(cents),
  documents: documentsSchema,
  engagement: opt(z.enum(['SOLIDAIRE', 'SIMPLE'])),
  duration: opt(z.enum(['FIXED', 'OPEN'])),
  until: opt(isoDate),
  maxCents: opt(cents),
  signMode: opt(z.enum(['PAPER', 'ELECTRONIC'])),
  signedAt: opt(isoDate),
})
export type Guarantor = z.infer<typeof guarantorSchema>


export const tenantFileSchema = z.object({
  civility: opt(civility),
  lastName: opt(text(80)),
  firstNames: opt(text(120)),
  usageName: opt(text(80)),
  birthDate: opt(isoDate),
  birthPlace: opt(text(120)),
  email: opt(z.email('Email invalide').or(z.literal(''))),
  phone: opt(text(30)),
  currentAddress: opt(text(300)),
  situation: opt(situationSchema),
  /** Employeur, établissement d'études ou activité. */
  employer: opt(text(160)),
  occupation: opt(text(120)),
  /** Revenus nets mensuels du locataire (part du loyer dans les revenus). */
  monthlyIncomeCents: opt(cents),
  living: opt(z.enum(['ALONE', 'COUPLE', 'COLOCATION'])),
  coTenants: opt(z.array(z.object({ civility: opt(civility), firstNames: opt(text(120)), lastName: opt(text(80)), email: opt(z.email().or(z.literal(''))) })).max(5)),
  guarantee: opt(z.enum(['CAUTION', 'VISALE', 'GLI', 'NONE'])),
  visaleNumber: opt(text(40)),
  guarantor: opt(guarantorSchema),
  documents: documentsSchema,
  insurance: opt(z.object({ insurer: opt(text(120)), expiresAt: opt(isoDate), fileId: opt(z.string().uuid()) })),
  newAddress: opt(text(300)),
  /** Informations saisies par le locataire depuis son lien, à vérifier par le propriétaire (« birthDate », « guarantor.address »…). */
  review: opt(z.array(text(60)).max(60)),
})
export type TenantFile = z.infer<typeof tenantFileSchema>

// ── Conditions du bail ───────────────────────────────────────────────────────

export const leaseKind = z.enum(['VIDE', 'MEUBLE', 'ETUDIANT', 'MOBILITE'])
export type LeaseKind = z.infer<typeof leaseKind>

export const MOBILITY_REASONS = {
  FORMATION: 'formation professionnelle',
  ETUDES: 'études supérieures',
  APPRENTISSAGE: "contrat d'apprentissage",
  STAGE: 'stage',
  SERVICE_CIVIQUE: 'engagement volontaire dans le cadre d’un service civique',
  MUTATION: 'mutation professionnelle',
  MISSION: 'mission temporaire dans le cadre de son activité professionnelle',
} as const

export const leaseTermsSchema = z.object({
  kind: opt(leaseKind),
  colocation: opt(z.boolean()),
  startDate: opt(isoDate),
  /** Bail mobilité : de 1 à 10 mois. Durée réduite (vide) : de 12 à 35 mois. */
  durationMonths: opt(z.number().int().min(1).max(72)),
  reduced: opt(z.object({ enabled: opt(z.boolean()), reason: opt(text(500)) })),
  mobilityReason: opt(z.enum(Object.keys(MOBILITY_REASONS) as [string, ...string[]])),
  rentCents: opt(cents),
  chargesCents: opt(cents),
  chargesMode: opt(z.enum(['PROVISION', 'PERIODIC', 'FORFAIT'])),
  depositCents: opt(cents),
  paymentDay: opt(z.number().int().min(1).max(28)),
  paymentTerm: opt(z.enum(['ADVANCE', 'ARREARS'])),
  paymentMethod: opt(z.enum(['TRANSFER', 'CHEQUE', 'CASH', 'OTHER'])),
  paymentPlace: opt(text(200)),
  zone: opt(
    z.object({
      tense: opt(z.boolean()),
      control: opt(z.boolean()),
      refRentCentsM2: opt(cents),
      refRentMaxCentsM2: opt(cents),
      complementCents: opt(cents),
      complementJustification: opt(text(500)),
    }),
  ),
  previous: opt(
    z.object({
      rentedWithin18Months: opt(z.boolean()),
      lastRentCents: opt(cents),
      lastPaymentDate: opt(isoDate),
      lastRevisionDate: opt(isoDate),
    }),
  ),
  revision: opt(
    z.object({
      enabled: opt(z.boolean()),
      /** Jour et mois (MM-JJ) ; vide = date anniversaire du bail. */
      date: opt(z.string().regex(/^\d{2}-\d{2}$/)),
      irlQuarter: opt(z.string().regex(/^\d{4}-Q[1-4]$/)),
      irlValue: opt(z.number().positive()),
    }),
  ),
  works: opt(
    z.object({
      sinceLast: opt(text(600)),
      increase: opt(text(600)),
      decrease: opt(text(600)),
      energyContribution: opt(z.object({ enabled: opt(z.boolean()), monthlyCents: opt(cents), description: opt(text(600)) })),
    }),
  ),
  clauses: opt(
    z.object({
      resolutoire: opt(z.boolean()),
      solidarite: opt(z.boolean()),
      custom: opt(z.array(text(1000)).max(20)),
    }),
  ),
  fees: opt(
    z.object({
      tenantVisitFileCents: opt(cents),
      tenantInventoryCents: opt(cents),
      landlordCents: opt(cents),
    }),
  ),
  signature: opt(z.object({ place: opt(text(120)), date: opt(isoDate), mode: opt(z.enum(['PAPER', 'ELECTRONIC'])) })),
})
export type LeaseTerms = z.infer<typeof leaseTermsSchema>

/** Personne telle qu'elle figure dans un document. */
export interface PartyName {
  civility?: 'MADAME' | 'MONSIEUR' | null
  firstNames?: string | null
  lastName?: string | null
}

/** Tout ce qu'il faut pour produire un bail : les fiches au moment de la génération, plus les conditions. */
export interface ContractInput {
  landlord: LandlordProfile
  property: PropertyFile
  tenants: (TenantFile & PartyName)[]
  guarantors: Guarantor[]
  terms: LeaseTerms
  /** Mention en pied de page : « version 2 du 28/09/2026 ». */
  version?: { number: number; date: string }
}
