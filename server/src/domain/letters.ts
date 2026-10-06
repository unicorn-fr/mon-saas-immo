import { z } from 'zod'
import { formatDateFr, formatEuros, parseIsoDate } from './lease.js'
import { ART_15_II_FIRST_FIVE } from '../pdf/notice-conge-text.js'
import { eurosInWords } from './words.js'

/**
 * Courriers de la vie du bail. Chaque modèle reçoit ses données et produit un texte court, poli et exact.
 * Les montants sont calculés par Bailio (révision, régularisation, restitution) ; le propriétaire relit avant l'envoi.
 */

const cents = z.number().int().min(0).max(100_000_000)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** Destinataire qui n'est pas le locataire (assureur, artisan) : repris du carnet, ou ajouté au carnet. */
const thirdParty = z.object({
  name: z.string().trim().min(1, 'Indiquez le destinataire.').max(160),
  address: z.string().trim().max(300).default(''),
  email: z.string().trim().email().max(200).or(z.literal('')).optional().nullable(),
  contactId: z.uuid().optional().nullable(),
})

export const letterSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('REVISION'),
    oldRentCents: cents,
    irlRef: z.object({ quarter: z.string(), value: z.number().positive() }),
    irlNew: z.object({ quarter: z.string(), value: z.number().positive() }),
    effectiveDate: isoDate,
  }),
  z.object({ type: z.literal('INSURANCE'), expiresAt: isoDate.optional().nullable() }),
  z.object({ type: z.literal('REMINDER'), amountCents: cents, periods: z.array(z.string()).min(1).max(24), dueDate: isoDate.optional().nullable() }),
  z.object({ type: z.literal('FORMAL_NOTICE'), amountCents: cents, periods: z.array(z.string()).min(1).max(24), delayDays: z.number().int().min(8).max(60).default(8), guarantorInformed: z.boolean().default(true) }),
  z.object({
    type: z.literal('NOTICE_TO_LEAVE'),
    reason: z.enum(['SALE', 'RESUMPTION', 'LEGITIMATE']),
    leaseEnd: isoDate,
    priceCents: cents.optional().nullable(),
    saleConditions: z.string().max(1000).optional().nullable(),
    beneficiary: z.object({ name: z.string().max(160), link: z.string().max(80), address: z.string().max(300) }).optional().nullable(),
    justification: z.string().max(2000).optional().nullable(),
  }),
  z.object({
    type: z.literal('CHARGES'),
    year: z.number().int().min(2000).max(2100),
    lines: z.array(z.object({ label: z.string().max(160), amountCents: cents })).min(1).max(30),
    provisionsCents: cents,
    /** Locataire présent une partie de l'année seulement : les charges de l'année sont réparties au prorata des jours. */
    occupiedFrom: isoDate.optional().nullable(),
    occupiedTo: isoDate.optional().nullable(),
  }),
  z.object({
    type: z.literal('TENANT_NOTICE'),
    receivedDate: isoDate,
    /** Préavis réduit à un mois (logement vide) : zone tendue, mutation, perte d'emploi, santé, RSA, AAH… */
    reduced: z.boolean().default(false),
    reducedReason: z.string().max(300).optional().nullable(),
  }),
  z.object({
    type: z.literal('DEPOSIT_RETURN'),
    depositCents: cents,
    keysDate: isoDate,
    conform: z.boolean(),
    deductions: z.array(z.object({ label: z.string().max(200), justification: z.string().max(160), amountCents: cents })).max(20),
    /** Solde de tout compte : loyers et charges restant dus à la sortie. */
    unpaidCents: cents.default(0),
    /** Régularisation des charges au prorata : positif si le locataire doit, négatif si le bailleur rembourse. */
    chargesBalanceCents: z.number().int().min(-10_000_000).max(10_000_000).default(0),
    /** Immeuble collectif : provision gardée jusqu'à l'approbation des comptes (20 % du dépôt au plus, art. 22). */
    heldCents: cents.default(0),
    /** Date du courrier et loyer mensuel hors charges : majoration de 10 % par mois de retard commencé (art. 22). */
    writtenOn: isoDate.optional().nullable(),
    monthlyRentCents: cents.optional().nullable(),
  }),
  z.object({ type: z.literal('GUARANTOR_CALL'), amountCents: cents, periods: z.array(z.string()).min(1).max(24), delayDays: z.number().int().min(8).max(60).default(15), commandDate: isoDate.optional().nullable() }),
  z.object({ type: z.literal('NUISANCE'), facts: z.string().min(1).max(2000), dates: z.string().max(300).optional().nullable(), delayDays: z.number().int().min(1).max(60).default(8) }),
  z.object({ type: z.literal('DAMAGE_REPAIR'), items: z.array(z.object({ label: z.string().min(1).max(300) })).min(1).max(20), delayDays: z.number().int().min(8).max(90).default(30) }),
  z.object({ type: z.literal('BOILER'), lastServiceDate: isoDate.optional().nullable() }),
  z.object({ type: z.literal('SHORT_NOTICE_PROOF'), receivedDate: isoDate, reason: z.string().min(1).max(300) }),
  z.object({ type: z.literal('RENT_CERTIFICATE'), since: isoDate, rentCents: cents, chargesCents: cents, upToDate: z.boolean().default(true) }),
  z.object({ type: z.literal('DEPOSIT_RECEIPT'), amountCents: cents, receivedDate: isoDate, method: z.string().max(120).optional().nullable() }),
  z.object({ type: z.literal('OWNER_CHANGE'), newOwnerName: z.string().min(1).max(200), newOwnerAddress: z.string().min(1).max(300), effectiveDate: isoDate, paymentInfo: z.string().max(500).optional().nullable() }),
  z.object({ type: z.literal('SMOKE_DETECTOR'), count: z.number().int().min(1).max(30), installedDate: isoDate.optional().nullable() }),
  z.object({ type: z.literal('E_RECEIPT_CONSENT'), email: z.string().trim().email().max(200) }),
  z.object({
    type: z.literal('INSURANCE_CLAIM'),
    recipient: thirdParty,
    policyNumber: z.string().trim().max(60).optional().nullable(),
    eventDate: isoDate,
    cause: z.enum(['WATER', 'FIRE', 'THEFT', 'STORM', 'BREAKAGE', 'OTHER']),
    circumstances: z.string().trim().min(1).max(2000),
    damages: z.string().trim().min(1).max(2000),
  }),
  z.object({
    type: z.literal('CONTRACTOR_CLAIM'),
    recipient: thirdParty,
    work: z.string().trim().min(1).max(300),
    workDate: isoDate.optional().nullable(),
    invoiceRef: z.string().trim().max(80).optional().nullable(),
    problems: z.string().trim().min(1).max(2000),
    delayDays: z.number().int().min(8).max(90).default(15),
  }),
])
export type LetterInput = z.infer<typeof letterSchema>
export type LetterType = LetterInput['type']

export const LETTER_TITLES: Record<LetterType, string> = {
  REVISION: 'Révision annuelle du loyer',
  INSURANCE: 'Demande d’attestation d’assurance',
  REMINDER: 'Relance amiable',
  FORMAL_NOTICE: 'Mise en demeure',
  NOTICE_TO_LEAVE: 'Congé donné par le bailleur',
  CHARGES: 'Régularisation annuelle des charges',
  TENANT_NOTICE: 'Accusé de réception du congé du locataire',
  DEPOSIT_RETURN: 'Restitution du dépôt de garantie et solde de tout compte',
  GUARANTOR_CALL: 'Appel à la caution',
  NUISANCE: 'Mise en demeure de cesser un trouble',
  DAMAGE_REPAIR: 'Demande de réparation des dégradations',
  BOILER: 'Demande d’attestation d’entretien de la chaudière',
  SHORT_NOTICE_PROOF: 'Demande de justificatif pour un préavis d’un mois',
  RENT_CERTIFICATE: 'Attestation de loyer',
  DEPOSIT_RECEIPT: 'Reçu du dépôt de garantie',
  OWNER_CHANGE: 'Changement de propriétaire',
  SMOKE_DETECTOR: 'Attestation d’installation de détecteurs de fumée',
  E_RECEIPT_CONSENT: 'Accord pour recevoir les quittances par email',
  INSURANCE_CLAIM: 'Déclaration de sinistre à l’assureur',
  CONTRACTOR_CLAIM: 'Réclamation à un artisan',
}

/** Courriers adressés à un tiers (ni le locataire ni le garant). */
export const THIRD_PARTY_LETTERS = ['INSURANCE_CLAIM', 'CONTRACTOR_CLAIM'] as const

export const CLAIM_CAUSES = { WATER: 'dégât des eaux', FIRE: 'incendie', THEFT: 'vol ou cambriolage', STORM: 'tempête ou intempéries', BREAKAGE: 'bris de glace', OTHER: 'autre sinistre' } as const

export interface LetterContent {
  subject: string
  recommended: boolean
  paragraphs: string[]
  table?: { columns: string[]; widths: number[]; rows: string[][] }
  annexes?: string[]
  /** Texte de loi reproduit tel quel dans le courrier (congé pour vendre : art. 15, II). */
  quote?: { title: string; paragraphs: string[] }
  /** Notice officielle à joindre en pages suivantes (congé pour vendre ou reprendre un logement vide). */
  appendNotice?: 'CONGE'
  /**
   * Mise en page : courrier (par défaut), attestation signée par le bailleur, ou formulaire à faire signer
   * par le locataire (accord pour la quittance par email).
   */
  form?: 'ATTESTATION' | 'TENANT_FORM'
  /** Montant calculé à afficher dans l'interface (nouveau loyer, solde, somme à restituer). */
  computed?: { label: string; cents: number }[]
}

const d = (iso: string) => formatDateFr(parseIsoDate(iso))
const e = formatEuros
const irlLabel = (q: string) => {
  const m = /^(\d{4})-Q([1-4])$/.exec(q)
  return m ? `${m[2] === '1' ? '1er' : `${m[2]}e`} trimestre ${m[1]}` : q
}

/** Nouveau loyer révisé : loyer × nouvel IRL ÷ IRL de référence, arrondi au centime (art. 17-1). */
export function revisedRent(oldRentCents: number, refValue: number, newValue: number): number {
  return Math.round((oldRentCents * newValue) / refValue)
}

/**
 * Fin du préavis du locataire (art. 15, I et 25-8) : un mois en meublé, trois mois en vide, réduit à un mois dans
 * les cas prévus par la loi. Le délai court de la réception du congé et expire le jour du dernier mois qui porte le
 * même quantième, ou le dernier jour du mois à défaut (code de procédure civile, art. 641).
 */
export function tenantNoticeEnd(receivedIso: string, months: number): Date {
  const r = parseIsoDate(receivedIso)
  const lastDay = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + months + 1, 0)).getUTCDate()
  return new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + months, Math.min(r.getUTCDate(), lastDay)))
}

/** Préavis du locataire : 3 mois en vide (1 mois si réduit), 1 mois en meublé ; garage loué seul : celui du contrat (1 mois par défaut). */
export const tenantNoticeMonths = (kind: LetterContext['kind'], reduced: boolean, contractual?: number | null) =>
  kind === 'PARKING' ? (contractual ?? 1) : (kind ?? 'VIDE') === 'VIDE' && !reduced ? 3 : 1

/** Échéance de restitution : 1 mois après la remise des clés si l'état des lieux est conforme, 2 mois sinon (art. 22). */
export function depositDeadline(keysDateIso: string, conform: boolean): Date {
  const k = parseIsoDate(keysDateIso)
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth() + (conform ? 1 : 2), k.getUTCDate()))
}

/** Part de l'année occupée par le locataire (jours d'occupation ÷ jours de l'année), entre 0 et 1. */
export function occupancyShare(year: number, from?: string | null, to?: string | null): { share: number; days: number; yearDays: number } {
  const start = `${year}-01-01`
  const end = `${year}-12-31`
  const a = from && from > start ? from : start
  const b = to && to < end ? to : end
  const day = (x: string) => Date.UTC(Number(x.slice(0, 4)), Number(x.slice(5, 7)) - 1, Number(x.slice(8, 10)))
  const yearDays = Math.round((day(end) - day(start)) / 86_400_000) + 1
  const days = b < a ? 0 : Math.round((day(b) - day(a)) / 86_400_000) + 1
  return { share: days / yearDays, days, yearDays }
}

/**
 * Restitution du dépôt en retard (art. 22) : 10 % du loyer mensuel hors charges pour chaque mois commencé après la
 * date limite. Rien si le courrier est dans les délais.
 */
export function depositLatePenalty(deadline: Date, writtenOnIso: string, monthlyRentCents: number): { months: number; cents: number } {
  const w = parseIsoDate(writtenOnIso)
  if (w <= deadline) return { months: 0, cents: 0 }
  let months = (w.getUTCFullYear() - deadline.getUTCFullYear()) * 12 + (w.getUTCMonth() - deadline.getUTCMonth())
  if (w.getUTCDate() > deadline.getUTCDate()) months += 1
  months = Math.max(1, months)
  return { months, cents: Math.round(monthlyRentCents * 0.1) * months }
}

export interface LetterContext {
  tenantName: string
  propertyAddress: string
  guarantorName?: string | null
  /** Type de bail : le congé ne suit pas les mêmes règles en vide (art. 15) et en meublé (art. 25-8). */
  kind?: 'VIDE' | 'MEUBLE' | 'ETUDIANT' | 'MOBILITE' | 'PARKING'
  /** Garage loué seul : préavis convenu au contrat, en mois. */
  noticeMonths?: number | null
  /** Désignation des locaux loués, reprise du bail (obligatoire dans le congé pour vendre). */
  premises?: string
  landlordName?: string
  landlordAddress?: string
  leaseStart?: string | null
  /** Caution du locataire (appel à la caution). */
  guarantor?: { name: string; solidaire: boolean } | null
}

/**
 * Garage, box ou place loué seul (Code civil, art. 1709 et suivants) : seuls ces courriers ont un sens. Les autres
 * (chaudière, détecteurs, attestation de loyer, trouble de voisinage…) relèvent de la location d'un logement.
 */
export const PARKING_LETTERS: LetterType[] = ['REVISION', 'CHARGES', 'INSURANCE', 'REMINDER', 'FORMAL_NOTICE', 'NOTICE_TO_LEAVE', 'TENANT_NOTICE', 'DEPOSIT_RECEIPT', 'DEPOSIT_RETURN', 'GUARANTOR_CALL', 'DAMAGE_REPAIR', 'INSURANCE_CLAIM', 'CONTRACTOR_CLAIM']

export const letterAllowed = (type: LetterType, kind: LetterContext['kind']) => kind !== 'PARKING' || PARKING_LETTERS.includes(type)

/** Variantes du garage loué seul : le contrat fixe le préavis, le dépôt et l'assurance, pas la loi du 6 juillet 1989. */
function parkingLetter(l: LetterInput, ctx: LetterContext): LetterContent | null {
  const place = ctx.premises || ctx.propertyAddress
  switch (l.type) {
    case 'INSURANCE':
      return {
        subject: 'Attestation d’assurance de l’emplacement',
        recommended: false,
        paragraphs: [
          `Votre contrat de location vous demande d’assurer l’emplacement loué (${place}) et de m’en justifier chaque année.`,
          l.expiresAt ? `L’attestation que je possède arrive à échéance le ${d(l.expiresAt)}.` : 'Je ne dispose pas encore de votre attestation pour cette année.',
          'Pouvez-vous me transmettre votre nouvelle attestation d’assurance, par email ou par courrier ? Je vous remercie par avance.',
        ],
      }
    case 'FORMAL_NOTICE':
      return {
        subject: 'Mise en demeure de payer',
        recommended: true,
        paragraphs: [
          `Malgré ma précédente relance, les sommes suivantes restent impayées : loyer et charges de ${l.periods.join(', ')}, soit un total de ${e(l.amountCents)} (${eurosInWords(l.amountCents)}).`,
          `Je vous mets en demeure de régler cette somme dans un délai de ${l.delayDays} jours à compter de la réception de ce courrier.`,
          'À défaut, je pourrai mettre en œuvre la clause résolutoire du contrat de location, puis saisir le juge pour obtenir le paiement et la libération de l’emplacement.',
          ...(l.guarantorInformed && ctx.guarantorName ? [`Votre garant, ${ctx.guarantorName}, est informé de cette situation.`] : []),
        ],
      }
    case 'NOTICE_TO_LEAVE':
      return {
        subject: 'Fin du contrat de location de l’emplacement',
        recommended: true,
        paragraphs: [
          `Conformément au contrat de location de l’emplacement situé ${place}, je vous informe que je ne le reconduis pas : il prendra fin le ${d(l.leaseEnd)}${ctx.noticeMonths ? `, en respectant le préavis de ${ctx.noticeMonths} mois prévu au contrat` : ''}.`,
          'À cette date, l’emplacement devra être libéré et les clés, badges et télécommandes remis. Nous conviendrons ensemble d’un rendez-vous pour constater l’état des lieux.',
          'Le dépôt de garantie vous sera restitué dans le mois qui suit la remise des clés, déduction faite des sommes dues et justifiées.',
        ],
      }
    case 'TENANT_NOTICE': {
      const months = tenantNoticeMonths('PARKING', false, ctx.noticeMonths)
      const end = formatDateFr(tenantNoticeEnd(l.receivedDate, months))
      return {
        subject: 'Votre congé : accusé de réception et fin du préavis',
        recommended: false,
        paragraphs: [
          `J’accuse réception de votre lettre de congé concernant l’emplacement situé ${place}, reçue le ${d(l.receivedDate)}.`,
          `Le préavis prévu au contrat est de ${months} mois : il prend fin le ${end}. Vous restez redevable du loyer et des charges jusqu’à cette date.`,
          'Le dépôt de garantie vous sera restitué dans le mois qui suit la remise des clés, déduction faite des sommes dues et justifiées. Merci de m’indiquer votre nouvelle adresse.',
        ],
        computed: [],
      }
    }
    case 'DEPOSIT_RECEIPT':
      return {
        subject: 'Reçu du dépôt de garantie',
        recommended: false,
        form: 'ATTESTATION',
        paragraphs: [
          `Je soussigné(e) ${ctx.landlordName ?? ''}, bailleur de l’emplacement situé ${place}, reconnais avoir reçu de ${ctx.tenantName}, le ${d(l.receivedDate)}, la somme de ${e(l.amountCents)} (${eurosInWords(l.amountCents)})${l.method ? `, par ${l.method}` : ''}, au titre du dépôt de garantie prévu au contrat de location${ctx.leaseStart ? ` ayant pris effet le ${d(ctx.leaseStart)}` : ''}.`,
          'Cette somme garantit l’exécution des obligations du locataire. Elle ne porte pas intérêt et sera restituée dans le mois qui suit la remise des clés, déduction faite des sommes dues et justifiées.',
        ],
      }
    case 'DEPOSIT_RETURN': {
      const retained = l.deductions.reduce((x, y) => x + y.amountCents, 0)
      const balance = l.depositCents - retained - (l.unpaidCents ?? 0) - (l.chargesBalanceCents ?? 0)
      const k = parseIsoDate(l.keysDate)
      const deadline = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth() + 1, k.getUTCDate()))
      const rows: string[][] = [['Dépôt de garantie versé', '', e(l.depositCents)]]
      for (const x of l.deductions) rows.push([`Retenue : ${x.label}`, x.justification, `- ${e(x.amountCents)}`])
      if (l.unpaidCents) rows.push(['Loyers et charges restant dus', '', `- ${e(l.unpaidCents)}`])
      if (l.chargesBalanceCents) rows.push([l.chargesBalanceCents > 0 ? 'Charges à votre charge' : 'Charges en votre faveur', 'Décompte joint', l.chargesBalanceCents > 0 ? `- ${e(l.chargesBalanceCents)}` : `+ ${e(-l.chargesBalanceCents)}`])
      rows.push([balance >= 0 ? 'Solde à vous restituer' : 'Solde restant à votre charge', '', e(Math.abs(balance))])
      return {
        subject: 'Restitution du dépôt de garantie et solde de tout compte',
        recommended: false,
        paragraphs: [
          `Suite à la remise des clés le ${d(l.keysDate)}, voici le solde de tout compte de la location de l’emplacement situé ${place}, à partir de votre dépôt de garantie de ${e(l.depositCents)}.`,
          retained ? 'Les retenues ci-dessous correspondent aux dégradations constatées, hors usure normale ; chacune est justifiée par la pièce indiquée.' : 'Aucune retenue pour dégradation n’est appliquée.',
          balance >= 0
            ? `La somme de ${e(Math.max(0, balance))} vous sera versée au plus tard le ${formatDateFr(deadline)}, comme le prévoit le contrat.`
            : `Le dépôt de garantie ne couvre pas les sommes dues : il reste ${e(-balance)} à régler. Je vous remercie de procéder au paiement dans un délai de quinze jours.`,
        ],
        table: rows.length > 2 ? { columns: ['Ligne', 'Justificatif', 'Montant'], widths: [52, 26, 22], rows } : undefined,
        computed: [
          { label: balance >= 0 ? 'À restituer' : 'Reste dû par le locataire', cents: Math.abs(balance) },
          { label: 'Retenues', cents: retained },
        ],
      }
    }
    case 'DAMAGE_REPAIR':
      return {
        subject: 'Réparation de dégradations de l’emplacement',
        recommended: true,
        paragraphs: [
          `J’ai constaté les dégradations suivantes sur l’emplacement situé ${place} :`,
          ...l.items.map((x) => `– ${x.label.trim()}`),
          'Le locataire répond des dégradations ou des pertes qui arrivent pendant la location, à moins qu’il ne prouve qu’elles ont eu lieu sans sa faute (article 1732 du Code civil).',
          `Je vous demande de faire réaliser ces réparations dans un délai de ${l.delayDays} jours, ou de me proposer une date pour les faire ensemble. Je reste à votre disposition pour en parler.`,
        ],
      }
    default:
      return null
  }
}

export function letterContent(l: LetterInput, ctx: LetterContext): LetterContent {
  if (ctx.kind === 'PARKING') {
    const parking = parkingLetter(l, ctx)
    if (parking) return parking
  }
  switch (l.type) {
    case 'REVISION': {
      const next = revisedRent(l.oldRentCents, l.irlRef.value, l.irlNew.value)
      return {
        subject: `Révision annuelle du loyer, ${ctx.propertyAddress}`,
        recommended: false,
        paragraphs: [
          `Conformément à la clause de révision de votre bail, le loyer est révisé chaque année selon la variation de l’indice de référence des loyers (IRL) publié par l’INSEE.`,
          `L’indice de référence de votre bail est celui du ${irlLabel(l.irlRef.quarter)} (${String(l.irlRef.value).replace('.', ',')}). L’indice du même trimestre publié cette année est de ${String(l.irlNew.value).replace('.', ',')} (${irlLabel(l.irlNew.quarter)}).`,
          `Votre loyer hors charges passe donc de ${e(l.oldRentCents)} à ${e(next)} (${e(l.oldRentCents)} × ${String(l.irlNew.value).replace('.', ',')} ÷ ${String(l.irlRef.value).replace('.', ',')}), à compter du ${d(l.effectiveDate)}. Le montant des charges est inchangé.`,
        ],
        computed: [{ label: 'Nouveau loyer hors charges', cents: next }],
      }
    }
    case 'INSURANCE':
      return {
        subject: 'Attestation d’assurance habitation',
        recommended: false,
        paragraphs: [
          `Votre bail vous oblige à assurer le logement contre les risques locatifs et à m’en justifier chaque année (article 7 de la loi du 6 juillet 1989).`,
          l.expiresAt ? `L’attestation que je possède arrive à échéance le ${d(l.expiresAt)}.` : 'Je ne dispose pas encore de votre attestation pour cette année.',
          'Pouvez-vous me transmettre votre nouvelle attestation d’assurance, par email ou par courrier ? Je vous remercie par avance.',
        ],
      }
    case 'REMINDER':
      return {
        subject: `Loyer de ${l.periods.join(', ')}`,
        recommended: false,
        paragraphs: [
          `Sauf erreur de ma part, je n’ai pas encore reçu le paiement du loyer et des charges de ${l.periods.join(', ')}, soit ${e(l.amountCents)}${l.dueDate ? `, attendu le ${d(l.dueDate)}` : ''}.`,
          'Il s’agit peut-être d’un simple oubli. Pouvez-vous procéder au règlement dans les meilleurs délais ? Si vous rencontrez une difficulté, n’hésitez pas à m’en parler : nous trouverons une solution ensemble.',
          'Si votre paiement a été fait entre-temps, merci de ne pas tenir compte de ce message.',
        ],
      }
    case 'FORMAL_NOTICE':
      return {
        subject: 'Mise en demeure de payer',
        recommended: true,
        paragraphs: [
          `Malgré ma précédente relance, les sommes suivantes restent impayées : loyer et charges de ${l.periods.join(', ')}, soit un total de ${e(l.amountCents)} (${eurosInWords(l.amountCents)}).`,
          `Je vous mets en demeure de régler cette somme dans un délai de ${l.delayDays} jours à compter de la réception de ce courrier.`,
          'À défaut, je serai contraint de faire délivrer un commandement de payer par un commissaire de justice, en application de la clause résolutoire du bail, puis de saisir le juge.',
          ...(l.guarantorInformed && ctx.guarantorName ? [`Votre garant, ${ctx.guarantorName}, est informé de cette situation.`] : []),
          'Si vous rencontrez des difficultés, vous pouvez contacter l’ADIL de votre département ou le fonds de solidarité pour le logement (FSL).',
        ],
      }
    case 'NOTICE_TO_LEAVE': {
      const empty = (ctx.kind ?? 'VIDE') === 'VIDE'
      const common = `Je vous donne congé pour la fin de votre bail, soit le ${d(l.leaseEnd)}, date à laquelle vous devrez avoir libéré le logement situé ${ctx.propertyAddress}.`
      const why =
        l.reason === 'SALE'
          ? empty
            ? [
                `Ce congé est motivé par ma décision de vendre le logement. Il vaut offre de vente à votre profit, au prix de ${e(l.priceCents ?? 0)} (${eurosInWords(l.priceCents ?? 0)})${l.saleConditions ? `, aux conditions suivantes : ${l.saleConditions}` : ', payable comptant le jour de la signature de l’acte authentique de vente'}.`,
                `Désignation des locaux loués et de leurs dépendances, telle qu’elle figure au bail : ${ctx.premises || ctx.propertyAddress}.`,
                'Cette offre est valable pendant les deux premiers mois du délai de préavis. Conformément à l’article 15, II, de la loi n° 89-462 du 6 juillet 1989, dont les cinq premiers alinéas sont reproduits ci-dessous, vous pouvez l’accepter par écrit pendant ce délai.',
              ]
            : [`Ce congé est motivé par ma décision de vendre le logement (article 25-8 de la loi n° 89-462 du 6 juillet 1989).`]
          : l.reason === 'RESUMPTION'
            ? [
                `Ce congé est motivé par ma décision de reprendre le logement pour y habiter ou y loger un proche, à titre de résidence principale. Bénéficiaire de la reprise : ${l.beneficiary?.name ?? ''}, demeurant ${l.beneficiary?.address ?? ''}. Lien avec le bailleur : ${l.beneficiary?.link ?? ''}.`,
                `Caractère réel et sérieux de la décision de reprise : ${l.justification ?? ''}`,
              ]
            : [`Ce congé est fondé sur un motif légitime et sérieux, à savoir : ${l.justification ?? ''}`]
      const withNotice = empty && l.reason !== 'LEGITIMATE'
      return {
        subject: 'Congé pour la fin du bail',
        recommended: true,
        paragraphs: [common, ...why, 'Vous pouvez quitter le logement avant cette date : vous ne devrez alors le loyer et les charges que jusqu’à la remise des clés. Nous conviendrons ensemble de la date de l’état des lieux de sortie.'],
        quote: empty && l.reason === 'SALE' ? { title: 'Article 15, II, alinéas 1 à 5, de la loi n° 89-462 du 6 juillet 1989', paragraphs: ART_15_II_FIRST_FIVE } : undefined,
        annexes: withNotice ? ['Notice d’information relative aux obligations du bailleur et aux voies de recours et d’indemnisation du locataire (arrêté du 13 décembre 2017), reproduite ci-après'] : undefined,
        appendNotice: withNotice ? 'CONGE' : undefined,
      }
    }
    case 'TENANT_NOTICE': {
      const months = tenantNoticeMonths(ctx.kind, l.reduced)
      const end = formatDateFr(tenantNoticeEnd(l.receivedDate, months))
      const empty = (ctx.kind ?? 'VIDE') === 'VIDE'
      return {
        subject: 'Votre congé : accusé de réception et fin du préavis',
        recommended: false,
        paragraphs: [
          `J’accuse réception de votre lettre de congé concernant le logement situé ${ctx.propertyAddress}, reçue le ${d(l.receivedDate)}.`,
          empty && l.reduced
            ? `Votre préavis est réduit à un mois${l.reducedReason ? ` (${l.reducedReason})` : ''} : il prend fin le ${end}.`
            : `Votre préavis est de ${months === 1 ? 'un mois' : 'trois mois'}${empty ? '' : ', comme pour toute location meublée'} : il prend fin le ${end}.`,
          'Vous restez redevable du loyer et des charges jusqu’à cette date, sauf si le logement est occupé avant la fin du préavis par un autre locataire, en accord avec moi (article 15 de la loi n° 89-462 du 6 juillet 1989). Si vous partez plus tôt, prévenez-moi : nous fixerons ensemble la date de l’état des lieux de sortie et de la remise des clés.',
          'Le dépôt de garantie vous sera restitué dans un délai d’un mois après la remise des clés si l’état des lieux de sortie est conforme à celui d’entrée, et de deux mois dans le cas contraire, déduction faite des sommes dues et justifiées (article 22). Merci de m’indiquer votre nouvelle adresse.',
        ],
        computed: [],
      }
    }
    case 'CHARGES': {
      const yearTotal = l.lines.reduce((a, x) => a + x.amountCents, 0)
      const occ = occupancyShare(l.year, l.occupiedFrom, l.occupiedTo)
      const partial = occ.days < occ.yearDays
      const real = partial ? Math.round(yearTotal * occ.share) : yearTotal
      const diff = real - l.provisionsCents
      return {
        subject: `Régularisation des charges ${l.year}`,
        recommended: false,
        paragraphs: [
          `Voici le décompte des charges récupérables de l’année ${l.year}, par nature de charges, comparé aux provisions que vous avez versées.`,
          ...(partial ? [`Vous avez occupé ${ctx.kind === 'PARKING' ? 'l’emplacement' : 'le logement'} ${occ.days} jours sur ${occ.yearDays} en ${l.year} : votre part est calculée au prorata de cette durée.`] : []),
          diff > 0
            ? `Les charges réelles dépassent vos provisions de ${e(diff)}. Ce complément est à régler avec votre prochain loyer.`
            : diff < 0
              ? `Vos provisions dépassent les charges réelles de ${e(-diff)}. Cette somme vous sera remboursée ou déduite de votre prochain loyer.`
              : 'Vos provisions couvrent exactement les charges réelles : rien n’est dû de part et d’autre.',
          ctx.kind === 'PARKING' ? 'Les pièces justificatives sont à votre disposition sur simple demande.' : 'Les pièces justificatives sont à votre disposition pendant six mois à compter de l’envoi de ce décompte (article 23 de la loi du 6 juillet 1989).',
        ],
        table: {
          columns: ['Charge récupérable', 'Montant réel'],
          widths: [70, 30],
          rows: [
            ...l.lines.map((x) => [x.label, e(x.amountCents)]),
            ['Total des charges réelles de l’année', e(yearTotal)],
            ...(partial ? [[`Votre part (${occ.days} jours sur ${occ.yearDays})`, e(real)]] : []),
            ['Provisions versées', e(l.provisionsCents)],
            [diff >= 0 ? 'Reste à payer' : 'À rembourser', e(Math.abs(diff))],
          ],
        },
        computed: [{ label: diff >= 0 ? 'Reste à payer par le locataire' : 'À rembourser au locataire', cents: Math.abs(diff) }],
      }
    }
    case 'DEPOSIT_RETURN': {
      const retained = l.deductions.reduce((x, y) => x + y.amountCents, 0)
      const owed = retained + (l.unpaidCents ?? 0) + (l.chargesBalanceCents ?? 0)
      const held = l.heldCents ?? 0
      const deadline = depositDeadline(l.keysDate, l.conform)
      const late = l.writtenOn && l.monthlyRentCents && l.depositCents - owed - held > 0 ? depositLatePenalty(deadline, l.writtenOn, l.monthlyRentCents) : { months: 0, cents: 0 }
      const balance = l.depositCents - owed - held + late.cents
      const back = Math.max(0, balance)
      const rows: string[][] = [['Dépôt de garantie versé', '', e(l.depositCents)]]
      for (const x of l.deductions) rows.push([`Retenue : ${x.label}`, x.justification, `- ${e(x.amountCents)}`])
      if (l.unpaidCents) rows.push(['Loyers et charges restant dus', '', `- ${e(l.unpaidCents)}`])
      if (l.chargesBalanceCents) rows.push([l.chargesBalanceCents > 0 ? 'Régularisation des charges à votre charge' : 'Régularisation des charges en votre faveur', 'Décompte joint', l.chargesBalanceCents > 0 ? `- ${e(l.chargesBalanceCents)}` : `+ ${e(-l.chargesBalanceCents)}`])
      if (held) rows.push(['Provision gardée jusqu’à l’approbation des comptes de l’immeuble', 'Article 22', `- ${e(held)}`])
      if (late.cents) rows.push([`Majoration de retard (${late.months} mois commencé${late.months > 1 ? 's' : ''})`, 'Article 22', `+ ${e(late.cents)}`])
      rows.push([balance >= 0 ? 'Solde à vous restituer' : 'Solde restant à votre charge', '', e(Math.abs(balance))])
      return {
        subject: 'Restitution du dépôt de garantie et solde de tout compte',
        recommended: false,
        paragraphs: [
          `Suite à la remise des clés le ${d(l.keysDate)} et à l’état des lieux de sortie, voici le solde de tout compte de votre location, à partir de votre dépôt de garantie de ${e(l.depositCents)}.`,
          retained
            ? 'Les retenues ci-dessous correspondent aux différences constatées avec l’état des lieux d’entrée, hors usure normale et vétusté ; chacune est justifiée par la pièce indiquée.'
            : 'L’état des lieux de sortie étant conforme à l’état des lieux d’entrée, aucune retenue pour dégradation n’est appliquée.',
          balance >= 0
            ? `La somme de ${e(back)} vous sera versée au plus tard le ${formatDateFr(deadline)}.`
            : `Le dépôt de garantie ne couvre pas les sommes dues : il reste ${e(-balance)} à régler. Je vous remercie de procéder au paiement dans un délai de quinze jours.`,
          ...(late.cents ? [`La date limite de restitution (${formatDateFr(deadline)}) est dépassée : la somme due est majorée de 10 % du loyer mensuel hors charges par mois de retard commencé, soit ${e(late.cents)} (article 22 de la loi n° 89-462 du 6 juillet 1989).`] : []),
          ...(held ? [`La provision de ${e(held)} sera régularisée dans le mois qui suit l’approbation définitive des comptes de l’immeuble (article 22 de la loi n° 89-462 du 6 juillet 1989).`] : []),
        ],
        table: rows.length > 2 ? { columns: ['Ligne', 'Justificatif', 'Montant'], widths: [52, 26, 22], rows } : undefined,
        computed: [
          { label: balance >= 0 ? 'À restituer' : 'Reste dû par le locataire', cents: Math.abs(balance) },
          { label: 'Retenues', cents: retained },
        ],
      }
    }
    case 'GUARANTOR_CALL': {
      const g = ctx.guarantor
      return {
        subject: 'Appel à la caution : loyers impayés',
        recommended: true,
        paragraphs: [
          `Vous vous êtes porté(e) caution${g?.solidaire === false ? '' : ' solidaire'} des obligations de ${ctx.tenantName}, locataire ${ctx.kind === 'PARKING' ? 'de l’emplacement' : 'du logement'} situé ${ctx.propertyAddress}${ctx.leaseStart ? `, selon le bail ayant pris effet le ${d(ctx.leaseStart)}` : ''}.`,
          `Malgré mes relances, les sommes suivantes restent impayées : loyer et charges de ${l.periods.join(', ')}, soit un total de ${e(l.amountCents)} (${eurosInWords(l.amountCents)}).`,
          g?.solidaire === false
            ? `Votre engagement étant une caution simple, je vous informe de cette situation. Je vous remercie de prendre contact avec votre proche afin que cette dette soit réglée dans un délai de ${l.delayDays} jours ; à défaut, je pourrai vous en demander le paiement après avoir poursuivi le locataire.`
            : `En application de votre engagement, je vous demande de régler cette somme dans un délai de ${l.delayDays} jours à compter de la réception de ce courrier.`,
          ...(l.commandDate && ctx.kind !== 'PARKING' ? [`Un commandement de payer a été délivré au locataire le ${d(l.commandDate)} ; il vous est également signifié par commissaire de justice, comme le prévoit l’article 24 de la loi n° 89-462 du 6 juillet 1989.`] : []),
        ],
      }
    }
    case 'INSURANCE_CLAIM':
      return {
        subject: `Déclaration de sinistre${l.policyNumber ? `, contrat n° ${l.policyNumber}` : ''}`,
        recommended: true,
        paragraphs: [
          `Je vous déclare un sinistre (${CLAIM_CAUSES[l.cause]}) survenu le ${d(l.eventDate)} dans le logement dont je suis propriétaire, situé ${ctx.propertyAddress}${l.policyNumber ? `, assuré auprès de vous par le contrat n° ${l.policyNumber}` : ''}.`,
          `Circonstances : ${l.circumstances.trim().replace(/\.$/, '')}.`,
          `Dommages constatés : ${l.damages.trim().replace(/\.$/, '')}.`,
          'Je tiens à votre disposition les photos et les justificatifs (factures, devis). Je vous remercie de m’indiquer la suite donnée à cette déclaration et, le cas échéant, la date du passage de l’expert.',
          'Cette déclaration vous est adressée dans le délai prévu par mon contrat (article L. 113-2 du code des assurances).',
        ],
      }
    case 'CONTRACTOR_CLAIM':
      return {
        subject: `Réclamation : ${l.work.trim().replace(/\.$/, '')}`,
        recommended: true,
        paragraphs: [
          `Vous êtes intervenu${l.workDate ? ` le ${d(l.workDate)}` : ''} dans le logement dont je suis propriétaire, situé ${ctx.propertyAddress}, pour les travaux suivants : ${l.work.trim().replace(/\.$/, '')}${l.invoiceRef ? ` (facture ou devis n° ${l.invoiceRef})` : ''}.`,
          `Je constate les problèmes suivants : ${l.problems.trim().replace(/\.$/, '')}.`,
          `Je vous demande de reprendre ces travaux, sans frais, dans un délai de ${l.delayDays} jours à compter de la réception de ce courrier.`,
          'Ce courrier vaut mise en demeure (article 1344 du code civil). À défaut de reprise dans ce délai, je pourrai faire réaliser les travaux par une autre entreprise et vous en demander le remboursement (article 1222 du code civil).',
        ],
      }
    case 'NUISANCE':
      return {
        subject: 'Mise en demeure de cesser un trouble de voisinage',
        recommended: true,
        paragraphs: [
          `Des troubles m’ont été signalés au sujet du logement que vous louez, situé ${ctx.propertyAddress} : ${l.facts.trim().replace(/\.$/, '')}${l.dates ? ` (${l.dates})` : ''}.`,
          'Votre bail et la loi vous obligent à user paisiblement du logement et à respecter la tranquillité du voisinage (article 7 de la loi n° 89-462 du 6 juillet 1989). De mon côté, la loi m’oblige à intervenir pour faire cesser ces troubles (article 6-1).',
          `Je vous mets donc en demeure de faire cesser ces troubles sans délai, et au plus tard dans les ${l.delayDays} jours suivant la réception de ce courrier.`,
          'À défaut, je me verrai contraint d’engager les démarches prévues par la loi, qui peuvent aller jusqu’à la résiliation du bail par le juge.',
        ],
      }
    case 'DAMAGE_REPAIR':
      return {
        subject: 'Réparation de dégradations dans le logement',
        recommended: true,
        paragraphs: [
          `J’ai constaté les dégradations suivantes dans le logement situé ${ctx.propertyAddress} :`,
          ...l.items.map((x) => `– ${x.label.trim()}`),
          'Le locataire répond des dégradations survenues pendant la location et prend en charge l’entretien courant et les menues réparations, sauf vétusté, malfaçon, vice de construction ou force majeure (article 7 de la loi n° 89-462 du 6 juillet 1989 ; décret n° 87-712 du 26 août 1987).',
          `Je vous demande de faire réaliser ces réparations dans un délai de ${l.delayDays} jours, ou de me proposer une date pour les faire ensemble. Je reste à votre disposition pour en parler.`,
        ],
      }
    case 'BOILER':
      return {
        subject: 'Attestation d’entretien annuel de la chaudière',
        recommended: false,
        paragraphs: [
          `La chaudière du logement situé ${ctx.propertyAddress} doit être entretenue chaque année par un professionnel qualifié (décret n° 2009-649 du 9 juin 2009). Cet entretien fait partie de l’entretien courant à la charge du locataire (décret n° 87-712 du 26 août 1987).`,
          l.lastServiceDate ? `Le dernier entretien dont j’ai connaissance date du ${d(l.lastServiceDate)}.` : 'Je n’ai pas encore reçu d’attestation d’entretien.',
          'Pouvez-vous me transmettre l’attestation remise par le professionnel lors de sa dernière visite, par email ou par courrier ? Je vous remercie par avance.',
        ],
      }
    case 'SHORT_NOTICE_PROOF': {
      const end = formatDateFr(tenantNoticeEnd(l.receivedDate, 3))
      return {
        subject: 'Votre préavis d’un mois : justificatif à fournir',
        recommended: true,
        paragraphs: [
          `J’ai bien reçu le ${d(l.receivedDate)} votre lettre de congé, dans laquelle vous demandez un préavis réduit à un mois pour le motif suivant : ${l.reason.trim().replace(/\.$/, '')}.`,
          'La loi permet ce préavis d’un mois, à condition que le motif soit précisé et justifié au moment du congé (article 15 de la loi n° 89-462 du 6 juillet 1989). Je n’ai pas reçu de justificatif.',
          'Pouvez-vous me transmettre une pièce le justifiant (par exemple : attestation de l’employeur, notification de mutation, attestation de France Travail, certificat médical, attestation de la CAF) ?',
          `Sans justificatif, le préavis de trois mois s’applique : il prendrait fin le ${end}.`,
        ],
      }
    }
    case 'RENT_CERTIFICATE': {
      const total = l.rentCents + l.chargesCents
      return {
        subject: 'Attestation de loyer',
        recommended: false,
        form: 'ATTESTATION',
        paragraphs: [
          `Je soussigné(e) ${ctx.landlordName ?? ''}, demeurant ${ctx.landlordAddress ?? ''}, certifie louer à ${ctx.tenantName} le logement situé ${ctx.propertyAddress}, à titre de résidence principale, depuis le ${d(l.since)}.`,
          `Le loyer mensuel est de ${e(l.rentCents)} hors charges, et les charges de ${e(l.chargesCents)}, soit ${e(total)} par mois (${eurosInWords(total)}).`,
          l.upToDate ? `À la date de la présente attestation, le locataire est à jour du paiement de ses loyers et charges.` : `À la date de la présente attestation, des loyers ou charges restent dus.`,
          'Attestation établie pour servir et valoir ce que de droit.',
        ],
      }
    }
    case 'DEPOSIT_RECEIPT':
      return {
        subject: 'Reçu du dépôt de garantie',
        recommended: false,
        form: 'ATTESTATION',
        paragraphs: [
          `Je soussigné(e) ${ctx.landlordName ?? ''}, bailleur du logement situé ${ctx.propertyAddress}, reconnais avoir reçu de ${ctx.tenantName}, le ${d(l.receivedDate)}, la somme de ${e(l.amountCents)} (${eurosInWords(l.amountCents)})${l.method ? `, par ${l.method}` : ''}, au titre du dépôt de garantie prévu au bail${ctx.leaseStart ? ` ayant pris effet le ${d(ctx.leaseStart)}` : ''}.`,
          'Cette somme garantit l’exécution des obligations du locataire. Elle ne porte pas intérêt et sera restituée à la fin de la location, dans un délai d’un mois après la remise des clés si l’état des lieux de sortie est conforme à celui d’entrée, de deux mois dans le cas contraire, déduction faite des sommes dues et justifiées (article 22 de la loi n° 89-462 du 6 juillet 1989).',
        ],
      }
    case 'OWNER_CHANGE':
      return {
        subject: 'Changement de propriétaire du logement',
        recommended: true,
        paragraphs: [
          `Je vous informe que le logement que vous louez, situé ${ctx.propertyAddress}, appartient à compter du ${d(l.effectiveDate)} à ${l.newOwnerName}, demeurant ${l.newOwnerAddress}.`,
          'Votre bail continue aux mêmes conditions avec le nouveau propriétaire, qui devient votre bailleur (article 1743 du Code civil). Vous n’avez aucune démarche particulière à accomplir.',
          l.paymentInfo?.trim() ? `À partir de cette date, les loyers et charges sont à verser au nouveau propriétaire : ${l.paymentInfo.trim()}.` : 'À partir de cette date, les loyers et charges sont à verser au nouveau propriétaire, qui vous indiquera ses coordonnées de paiement.',
          'Votre dépôt de garantie vous sera restitué par le nouveau propriétaire à la fin de la location (article 22 de la loi n° 89-462 du 6 juillet 1989). Je vous remercie pour la confiance que vous m’avez accordée.',
        ],
      }
    case 'SMOKE_DETECTOR':
      return {
        subject: 'Attestation d’installation de détecteurs de fumée',
        recommended: false,
        form: 'ATTESTATION',
        paragraphs: [
          `Je soussigné(e) ${ctx.landlordName ?? ''}, propriétaire du logement situé ${ctx.propertyAddress}, atteste que ${l.count === 1 ? 'un détecteur autonome avertisseur de fumée y est installé' : `${l.count} détecteurs autonomes avertisseurs de fumée y sont installés`}${l.installedDate ? ` depuis le ${d(l.installedDate)}` : ''}, conformément à la loi n° 2010-238 du 9 mars 2010 et à la norme NF EN 14604.`,
          `${l.count === 1 ? 'Ce détecteur a été remis en état de fonctionnement' : 'Ces détecteurs ont été remis en état de fonctionnement'} à l’entrée du locataire, ${ctx.tenantName}. Pendant la location, le locataire veille à leur bon fonctionnement et remplace les piles si besoin.`,
          'Attestation établie pour servir et valoir ce que de droit, notamment auprès de l’assureur du logement.',
        ],
      }
    case 'E_RECEIPT_CONSENT':
      return {
        subject: 'Accord pour recevoir les quittances par email',
        recommended: false,
        form: 'TENANT_FORM',
        paragraphs: [
          `Je soussigné(e) ${ctx.tenantName}, locataire du logement situé ${ctx.propertyAddress}, donne mon accord à ${ctx.landlordName ?? 'mon bailleur'} pour recevoir mes quittances de loyer, reçus et avis d’échéance sous forme électronique, à l’adresse email suivante : ${l.email}.`,
          'Cet accord est donné en application de l’article 21 de la loi n° 89-462 du 6 juillet 1989, qui permet la transmission dématérialisée de la quittance avec l’accord exprès du locataire. La quittance reste gratuite.',
          'Je peux revenir sur cet accord à tout moment, par simple demande écrite, et recevoir à nouveau mes quittances sur papier.',
        ],
      }
  }
}
