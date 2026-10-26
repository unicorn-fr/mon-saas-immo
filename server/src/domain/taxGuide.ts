import { z } from 'zod'
import { declarationDeadline } from './fiscalCalendar.js'

/**
 * Parcours guidé de la déclaration (page « Déclarer vos revenus locatifs ») : Bailio vérifie d'abord ce qu'il sait,
 * laisse choisir le régime quand il y a un choix, puis accompagne la saisie sur impots.gouv.fr écran par écran.
 * L'administration n'accepte aucun fichier d'un particulier : la déclaration se remplit en ligne. Bailio réduit le travail
 * aux cases à recopier, et retient où le propriétaire en est (`User.taxProgress`, une entrée par année).
 */

export type Regime = 'MICRO' | 'REAL'

export const taxProgressSchema = z.object({
  /** Régime choisi par le propriétaire (par défaut : le plus avantageux d'après Bailio). */
  regime: z.object({ vide: z.enum(['MICRO', 'REAL']).optional(), meuble: z.enum(['MICRO', 'REAL']).optional() }).optional(),
  /** Cases recopiées (clé : groupe, case et rang). */
  done: z.array(z.string().max(80)).max(200).optional(),
  /** Autres démarches faites (identifiant de la fiche). */
  tasks: z.array(z.string().max(80)).max(50).optional(),
  /** Date à laquelle le propriétaire a signé sa déclaration en ligne. */
  filedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  /** Déficits fonciers des années précédentes pas encore déduits (case 4BD), en centimes. */
  priorDeficitCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  /** Gardé à la signature, pour proposer la case 4BD de l'année suivante. */
  snapshot: z.object({ resultCents: z.number().int(), carriedCents: z.number().int().min(0), priorDeficitCents: z.number().int().min(0) }).nullable().optional(),
})
export type TaxProgress = z.infer<typeof taxProgressSchema>

/** Ce qui ne change pas d'une année à l'autre (clé `info` de `User.taxProgress`). */
export const taxInfoSchema = z.object({
  /** SIRET du loueur en meublé (14 chiffres), reçu après la déclaration de début d'activité. */
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET compte 14 chiffres.').nullable().optional(),
})
export type TaxInfo = z.infer<typeof taxInfoSchema>

export function readInfo(all: unknown): TaxInfo {
  const raw = all && typeof all === 'object' ? (all as Record<string, unknown>).info : undefined
  const parsed = taxInfoSchema.safeParse(raw ?? {})
  return parsed.success ? parsed.data : {}
}

export function mergeInfo(all: unknown, patch: TaxInfo): Record<string, unknown> {
  const base = all && typeof all === 'object' ? { ...(all as Record<string, unknown>) } : {}
  base.info = taxInfoSchema.parse({ ...readInfo(all), ...patch })
  return base
}

/**
 * Case 4BD proposée à partir de l'année précédente, si sa déclaration a été signée dans Bailio : déficits antérieurs
 * restant après imputation sur le bénéfice de l'an dernier, plus la part reportée de l'an dernier (case 4BB).
 * Simplification : les déficits de plus de dix ans ne sont pas retirés ; l'avis d'impôt donne le montant exact.
 */
export function priorDeficitSuggestion(prev: TaxProgress): number | null {
  const s = prev.snapshot
  if (!s) return null
  return Math.max(0, s.priorDeficitCents - Math.max(0, s.resultCents)) + s.carriedCents
}

/** La progression d'une année, lue sans jamais échouer (une donnée abîmée repart de zéro). */
export function readProgress(all: unknown, year: number): TaxProgress {
  const raw = all && typeof all === 'object' ? (all as Record<string, unknown>)[String(year)] : undefined
  const parsed = taxProgressSchema.safeParse(raw ?? {})
  return parsed.success ? parsed.data : {}
}

/** Fusionne une mise à jour dans la progression de l'année ; les autres années ne bougent pas. */
export function mergeProgress(all: unknown, year: number, patch: TaxProgress): Record<string, TaxProgress> {
  const base = all && typeof all === 'object' ? { ...(all as Record<string, TaxProgress>) } : {}
  const current = readProgress(all, year)
  base[String(year)] = taxProgressSchema.parse({ ...current, ...patch, regime: patch.regime ? { ...current.regime, ...patch.regime } : current.regime })
  return base
}

export interface RegimeChoice {
  recommended: Regime
  chosen: Regime
  microAllowed: boolean
}

/** Régime retenu : celui du propriétaire s'il est permis (pas de micro au-delà du plafond), sinon le conseil de Bailio. */
export function chooseRegime(recommended: Regime, microAllowed: boolean, choice?: Regime): RegimeChoice {
  const chosen = choice === 'MICRO' && !microAllowed ? 'REAL' : choice ?? recommended
  return { recommended: microAllowed ? recommended : 'REAL', chosen, microAllowed }
}

export interface TaxCheck {
  id: string
  /** OK : vérifié ; TODO : à compléter, le montant change ; TIP : à regarder, sans effet si tout est juste. */
  tone: 'OK' | 'TODO' | 'TIP'
  title: string
  detail?: string
  propertyId?: string
  /** Réponses à donner sur place, gardées pour être reprises (logement et année, année, ou une fois pour toutes). */
  fields?: CheckField[]
  /** Réponse « rien à déclarer » (enregistre 0 dans chaque champ). */
  none?: string
  link?: { to: string; label: string; external?: boolean }
}

export interface CheckField {
  key: 'loanInterestCents' | 'coproRegularizationCents' | 'adminFeesCents' | 'subsidyCents' | 'indemnityCents' | 'priorDeficitCents' | 'siret'
  label: string
  kind: 'MONEY' | 'TEXT'
  /** PROPERTY : logement et année ; YEAR : l'année ; INFO : une fois pour toutes. */
  scope: 'PROPERTY' | 'YEAR' | 'INFO'
  /** Valeur proposée (l'an dernier, ou calculée). */
  suggested?: number | null
  hint?: string
}

export interface ChecksInput {
  year: number
  /** Loyers encaissés dans l'année, en nom propre. */
  rents: { count: number; cents: number }
  /** Mois d'un bail en cours dont l'échéance est passée sans loyer enregistré. */
  missingRents: Array<{ leaseId: string; name: string; periods: string[] }>
  unassignedCents: number
  unclassified: Array<{ propertyId: string; name: string; cents: number }>
  /** Logements loués vides, si le régime réel est retenu. */
  real: Array<{ id: string; name: string; copro: boolean; loanKnown: boolean; coproKnown: boolean; feesKnown: boolean; incomeKnown: boolean; agent: boolean; hasTax: boolean; hasInsurance: boolean; lastLoanCents?: number | null }>
  /** Régime réel : déficits des années précédentes (case 4BD), connus ou non, et la valeur proposée. */
  prior: null | { known: boolean; suggested: number | null }
  /** Meublé en nom propre : le SIRET sert à la déclaration de CFE. */
  siret: null | { known: boolean }
  /** Une déclaration de CFE est à signer, et aucune signature n'est enregistrée dans le profil. */
  signatureMissing: boolean
  /** Meublé au régime réel : prix d'achat manquant (pas d'amortissement du logement). */
  lmnpMissingPurchase: boolean
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const monthName = (period: string) => MONTHS[Number(period.slice(5, 7)) - 1] ?? period
const euros = (cents: number) => `${Math.round(cents / 100).toLocaleString('fr-FR').replace(/ /g, ' ')} €`

/**
 * Ce que Bailio vérifie avant la saisie : ce qui manque et change le montant d'abord, puis ce qui mérite un coup d'œil,
 * puis ce qui est juste. Seules les questions utiles sont posées (copropriété seulement en copropriété, honoraires
 * seulement avec un mandataire, rien de tout cela au micro).
 */
export function taxChecks(i: ChecksInput): TaxCheck[] {
  const out: TaxCheck[] = []
  for (const m of i.missingRents) {
    const list = m.periods.map(monthName)
    out.push({
      id: `rent:${m.leaseId}`,
      tone: 'TODO',
      title: `${m.name} : ${m.periods.length > 1 ? `${m.periods.length} loyers` : 'un loyer'} sans paiement enregistré`,
      detail: `${capitalize(list.join(', '))} ${i.year}. Si vous l’avez reçu, enregistrez-le : seuls les loyers encaissés se déclarent. S’il n’est pas arrivé, il ne se déclare pas.`,
      link: { to: `/espace/baux/${m.leaseId}`, label: 'Ouvrir le bail' },
    })
  }
  for (const p of i.real) {
    const money = (key: CheckField['key'], label: string, suggested?: number | null): CheckField => ({ key, label, kind: 'MONEY', scope: 'PROPERTY', suggested })
    if (!p.loanKnown)
      out.push({ id: `loan:${p.id}`, tone: 'TODO', propertyId: p.id, fields: [money('loanInterestCents', 'Intérêts, assurance et frais d’emprunt payés', p.lastLoanCents)], none: 'Pas d’emprunt', title: `${p.name} : un emprunt ?`, detail: 'Sur l’attestation annuelle de votre banque (ligne 250). Ils se déduisent.' })
    if (p.copro && !p.coproKnown)
      out.push({ id: `copro:${p.id}`, tone: 'TODO', propertyId: p.id, fields: [money('coproRegularizationCents', 'Régularisation de l’an dernier')], none: 'Rien à régulariser', title: `${p.name} : régularisation de copropriété`, detail: 'Sur le décompte annuel du syndic : la part non déductible des provisions déduites l’an dernier (ligne 230).' })
    if (p.agent && !p.feesKnown)
      out.push({ id: `fees:${p.id}`, tone: 'TODO', propertyId: p.id, fields: [money('adminFeesCents', 'Honoraires de l’année')], none: 'Pas d’honoraires', title: `${p.name} : honoraires de gestion`, detail: 'Sur le relevé annuel de votre agence ou de votre mandataire (ligne 221). Ils se déduisent.' })
    if (!p.incomeKnown)
      out.push({ id: `income:${p.id}`, tone: 'TODO', propertyId: p.id, fields: [money('subsidyCents', 'Subvention de l’Anah reçue'), money('indemnityCents', 'Indemnité d’assurance reçue')], none: 'Non, rien reçu', title: `${p.name} : une aide ou une indemnité reçue en ${i.year} ?`, detail: 'Subvention de l’Anah pour des travaux (ligne 213), ou indemnité d’une assurance loyers impayés (ligne 214). Elles s’ajoutent aux loyers.' })
    if (!p.hasTax) out.push({ id: `tax:${p.id}`, tone: 'TIP', propertyId: p.id, title: `${p.name} : pas de taxe foncière en ${i.year}`, detail: 'Elle se déduit au régime réel (ligne 227). Ajoutez l’avis si vous l’avez payée.', link: { to: `/espace/argent/facture?logement=${p.id}`, label: 'Ajouter une dépense' } })
    if (!p.hasInsurance) out.push({ id: `insurance:${p.id}`, tone: 'TIP', propertyId: p.id, title: `${p.name} : pas d’assurance en ${i.year}`, detail: 'L’assurance propriétaire non occupant ou loyers impayés se déduit (ligne 223).', link: { to: `/espace/argent/facture?logement=${p.id}`, label: 'Ajouter une dépense' } })
  }
  if (i.prior && !i.prior.known)
    out.push({
      id: 'prior',
      tone: 'TODO',
      fields: [{ key: 'priorDeficitCents', label: 'Déficits des années précédentes', kind: 'MONEY', scope: 'YEAR', suggested: i.prior.suggested, hint: i.prior.suggested !== null ? 'Calculé avec votre déclaration de l’an dernier faite dans Bailio.' : undefined }],
      none: 'Aucun',
      title: 'Des déficits fonciers des années précédentes ?',
      detail: 'Le montant « déficits restant à reporter » de votre dernier avis d’impôt (case 4BD). Ils réduisent vos revenus fonciers de cette année.',
    })
  if (i.siret && !i.siret.known)
    out.push({
      id: 'siret',
      tone: 'TODO',
      fields: [{ key: 'siret', label: 'Numéro SIRET (14 chiffres)', kind: 'TEXT', scope: 'INFO' }],
      title: 'Votre numéro SIRET de loueur en meublé',
      detail: 'Reçu après la déclaration de début d’activité sur le guichet unique de l’INPI. Demandé une seule fois : il complète votre déclaration de CFE.',
      link: { to: 'https://procedures.inpi.fr/', label: 'Pas encore de SIRET : le guichet unique', external: true },
    })
  if (i.signatureMissing) out.push({ id: 'signature', tone: 'TIP', title: 'Ajoutez votre signature', detail: 'Elle signe pour vous la déclaration de CFE pré-remplie. Elle sert aussi à vos baux.', link: { to: '/espace/compte/profil', label: 'Ajouter ma signature' } })
  if (i.lmnpMissingPurchase) out.push({ id: 'lmnp:purchase', tone: 'TODO', title: 'Meublé au réel : prix d’achat manquant', detail: 'Sans lui, l’amortissement du logement n’est pas compté. Renseignez-le dans le détail des calculs, plus bas.' })
  for (const u of i.unclassified) out.push({ id: `other:${u.propertyId}`, tone: 'TIP', propertyId: u.propertyId, title: `${u.name} : ${euros(u.cents)} de dépenses classées « autre »`, detail: 'Précisez leur catégorie pour qu’elles se déduisent.', link: { to: '/espace/argent', label: 'Voir les dépenses' } })
  if (i.unassignedCents) out.push({ id: 'unassigned', tone: 'TIP', title: `${euros(i.unassignedCents)} de dépenses rattachées à aucun logement`, detail: 'Elles ne sont pas comptées.', link: { to: '/espace/argent', label: 'Les rattacher' } })
  out.push({ id: 'rents', tone: 'OK', title: `${i.rents.count} loyer${i.rents.count > 1 ? 's' : ''} encaissé${i.rents.count > 1 ? 's' : ''} en ${i.year}, ${euros(i.rents.cents)} au total`, detail: 'Repris de vos baux, charges comprises.' })
  const order = { TODO: 0, TIP: 1, OK: 2 }
  return out.sort((a, b) => order[a.tone] - order[b.tone])
}

/** Mois d'un bail dont l'échéance tombe dans l'année, entre l'entrée et la sortie, au plus tard aujourd'hui. */
export function dueMonths(year: number, lease: { startDate: string; endDate?: string | null; paymentDay: number }, today: string): string[] {
  const out: string[] = []
  for (let m = 1; m <= 12; m++) {
    const day = String(Math.min(Math.max(lease.paymentDay, 1), 28)).padStart(2, '0')
    const due = `${year}-${String(m).padStart(2, '0')}-${day}`
    if (due < lease.startDate || due > today) continue
    if (lease.endDate && due > lease.endDate) continue
    out.push(due.slice(0, 7))
  }
  return out
}

/** Service de correction en ligne (impots.gouv.fr), une fois la déclaration signée : vérifié pour chaque année. */
export const CORRECTION_DATES: Record<number, [string, string]> = {
  2026: ['2026-07-29', '2026-11-30'],
}

export interface DeclarationStatus {
  phase: 'EARLY' | 'OPEN' | 'LATE' | 'FILED'
  title: string
  text: string
  /** Date limite de la déclaration en ligne (AAAA-MM-JJ), si elle est publiée. */
  deadline: string | null
}

const frDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/**
 * Où en est la déclaration des revenus de `year` à la date `today` : trop tôt (l'année n'est pas finie ou la campagne
 * n'est pas ouverte, mi-avril), ouverte, date limite passée, ou déjà signée.
 */
export function declarationStatus(year: number, today: string, postalCode: string | null | undefined, filedAt?: string | null): DeclarationStatus {
  const d = declarationDeadline(year + 1, postalCode)
  const deadline = d.date
  if (filedAt) {
    const c = CORRECTION_DATES[year + 1]
    const fix = c ? (today <= c[1] ? `Une erreur ? Le service de correction en ligne est ouvert du ${frDay(c[0])} au ${frDay(c[1])}, dans votre espace.` : `Une erreur ? Le service de correction en ligne est fermé : faites une réclamation par la messagerie de votre espace.`) : 'Une erreur ? Vous pouvez la corriger en ligne jusqu’à la date limite, puis avec le service de correction, ouvert l’été jusqu’à fin novembre.'
    return { phase: 'FILED', deadline, title: `Déclaration signée le ${frDay(filedAt)}`, text: `L’avis d’impôt arrive dans votre espace pendant l’été. ${fix}` }
  }
  if (today < `${year + 1}-01-01`) return { phase: 'EARLY', deadline, title: `Vos revenus ${year} se déclarent au printemps ${year + 1}`, text: `L’année n’est pas finie : les chiffres se complètent jusqu’au 31 décembre. Enregistrez loyers et dépenses au fil de l’eau, tout sera prêt.` }
  if (today < `${year + 1}-04-10`) return { phase: 'EARLY', deadline, title: `La déclaration en ligne ouvre mi-avril ${year + 1}`, text: 'Vous pouvez déjà tout vérifier ici : le jour venu, il ne restera qu’à recopier.' }
  const limit = deadline ?? `${year + 1}-06-10`
  if (today <= limit) return { phase: 'OPEN', deadline, title: deadline ? `À faire avant le ${frDay(deadline)}` : `À faire avant fin mai ou début juin ${year + 1}`, text: deadline ? 'Date limite de la déclaration en ligne pour votre département.' : 'La date exacte dépend de votre département ; elle est publiée en avril sur impots.gouv.fr.' }
  return { phase: 'LATE', deadline, title: 'La date limite est passée', text: 'Déjà déclaré ? Indiquez-le à la fin de l’étape « Déclarer sur impots.gouv.fr ». Sinon, déclarez dès que possible en ligne : un retard peut entraîner une majoration de 10 % de l’impôt dû.' }
}
