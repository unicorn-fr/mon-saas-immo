import { z } from 'zod'
import { formatDateFr, formatEuros, parseIsoDate } from './lease.js'
import { eurosInWords } from './words.js'

/**
 * Courriers de la vie du bail. Chaque modèle reçoit ses données et produit un texte court, poli et exact.
 * Les montants sont calculés par Bailio (révision, régularisation, restitution) ; le propriétaire relit avant l'envoi.
 */

const cents = z.number().int().min(0).max(100_000_000)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

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
  }),
  z.object({
    type: z.literal('DEPOSIT_RETURN'),
    depositCents: cents,
    keysDate: isoDate,
    conform: z.boolean(),
    deductions: z.array(z.object({ label: z.string().max(200), justification: z.string().max(160), amountCents: cents })).max(20),
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
  DEPOSIT_RETURN: 'Restitution du dépôt de garantie',
}

export interface LetterContent {
  subject: string
  recommended: boolean
  paragraphs: string[]
  table?: { columns: string[]; widths: number[]; rows: string[][] }
  annexes?: string[]
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

/** Échéance de restitution : 1 mois après la remise des clés si l'état des lieux est conforme, 2 mois sinon (art. 22). */
export function depositDeadline(keysDateIso: string, conform: boolean): Date {
  const k = parseIsoDate(keysDateIso)
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth() + (conform ? 1 : 2), k.getUTCDate()))
}

export function letterContent(l: LetterInput, ctx: { tenantName: string; propertyAddress: string; guarantorName?: string | null }): LetterContent {
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
      const common = `Je vous donne congé pour la fin de votre bail, soit le ${d(l.leaseEnd)}, date à laquelle vous devrez avoir libéré le logement.`
      const why =
        l.reason === 'SALE'
          ? [
              `Ce congé est motivé par ma décision de vendre le logement. Il vaut offre de vente à votre profit, au prix de ${e(l.priceCents ?? 0)} (${eurosInWords(l.priceCents ?? 0)})${l.saleConditions ? `, aux conditions suivantes : ${l.saleConditions}` : ''}.`,
              'Cette offre est valable pendant les deux premiers mois du délai de préavis. Si vous l’acceptez, vous disposez d’un délai de deux mois à compter de l’envoi de votre acceptation pour réaliser la vente, porté à quatre mois si vous recourez à un prêt (article 15 II de la loi du 6 juillet 1989).',
            ]
          : l.reason === 'RESUMPTION'
            ? [
                `Ce congé est motivé par ma décision de reprendre le logement pour y habiter : bénéficiaire ${l.beneficiary?.name ?? ''} (${l.beneficiary?.link ?? ''}), demeurant ${l.beneficiary?.address ?? ''}.`,
                `Caractère réel et sérieux de la reprise : ${l.justification ?? ''}`,
              ]
            : [`Ce congé est fondé sur un motif légitime et sérieux : ${l.justification ?? ''}`]
      return {
        subject: 'Congé pour la fin du bail',
        recommended: true,
        paragraphs: [common, ...why],
        annexes: ['Notice d’information relative aux obligations du bailleur et aux voies de recours et d’indemnisation du locataire (arrêté du 13 décembre 2017)'],
      }
    }
    case 'CHARGES': {
      const real = l.lines.reduce((a, x) => a + x.amountCents, 0)
      const diff = real - l.provisionsCents
      return {
        subject: `Régularisation des charges ${l.year}`,
        recommended: false,
        paragraphs: [
          `Voici le décompte des charges récupérables de l’année ${l.year}, par nature de charges, comparé aux provisions que vous avez versées.`,
          diff > 0
            ? `Les charges réelles dépassent vos provisions de ${e(diff)}. Ce complément est à régler avec votre prochain loyer.`
            : diff < 0
              ? `Vos provisions dépassent les charges réelles de ${e(-diff)}. Cette somme vous sera remboursée ou déduite de votre prochain loyer.`
              : 'Vos provisions couvrent exactement les charges réelles : rien n’est dû de part et d’autre.',
          'Les pièces justificatives sont à votre disposition pendant six mois à compter de l’envoi de ce décompte (article 23 de la loi du 6 juillet 1989).',
        ],
        table: {
          columns: ['Charge récupérable', 'Montant réel'],
          widths: [70, 30],
          rows: [...l.lines.map((x) => [x.label, e(x.amountCents)]), ['Total des charges réelles', e(real)], ['Provisions versées', e(l.provisionsCents)], [diff >= 0 ? 'Reste à payer' : 'À rembourser', e(Math.abs(diff))]],
        },
        computed: [{ label: diff >= 0 ? 'Reste à payer par le locataire' : 'À rembourser au locataire', cents: Math.abs(diff) }],
      }
    }
    case 'DEPOSIT_RETURN': {
      const retained = l.deductions.reduce((a, x) => a + x.amountCents, 0)
      const back = Math.max(0, l.depositCents - retained)
      const deadline = depositDeadline(l.keysDate, l.conform)
      return {
        subject: 'Restitution du dépôt de garantie',
        recommended: false,
        paragraphs: [
          `Suite à la remise des clés le ${d(l.keysDate)} et à l’état des lieux de sortie, voici le décompte de votre dépôt de garantie de ${e(l.depositCents)}.`,
          retained
            ? 'Les retenues ci-dessous correspondent aux différences constatées avec l’état des lieux d’entrée, hors usure normale et vétusté ; chacune est justifiée par la pièce indiquée.'
            : 'L’état des lieux de sortie étant conforme à l’état des lieux d’entrée, aucune retenue n’est appliquée.',
          `La somme de ${e(back)} vous sera versée au plus tard le ${formatDateFr(deadline)}.`,
        ],
        table: retained
          ? { columns: ['Retenue', 'Justificatif', 'Montant'], widths: [50, 30, 20], rows: [...l.deductions.map((x) => [x.label, x.justification, e(x.amountCents)]), ['Total des retenues', '', e(retained)], ['À restituer', '', e(back)]] }
          : undefined,
        computed: [
          { label: 'À restituer', cents: back },
          { label: 'Retenues', cents: retained },
        ],
      }
    }
  }
}
