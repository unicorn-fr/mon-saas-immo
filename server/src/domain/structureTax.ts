/**
 * Aide à la déclaration par structure (docs/fiscalite/structures.md). Bailio ne dépose rien : il prépare une fiche
 * « aide à vérifier » avec les formulaires, les dates et les montants de l'année.
 *
 * Sources vérifiées (octobre 2026) :
 * - notice 2044 de 2026, paragraphe 110 (impots.gouv.fr) : la SCI non soumise à l'IS télédéclare la 2072-S ou 2072-C ;
 *   l'associé qui n'a que des parts de SCI déclare sa part case 4BA de la 2042 (sans 2044) et n'a pas droit au
 *   micro-foncier ; s'il loue aussi en direct, il déclare sa part au paragraphe 110 de la 2044 ;
 * - impots.gouv.fr, « Comment déclarer les résultats de ma SCI ? » : 2072 (IR) ou 2065 avec la liasse (IS), au plus
 *   tard le 2e jour ouvré après le 1er mai, 15 jours de plus en ligne ; les associés reportent leur part ;
 * - impots.gouv.fr, échéance PRO du 05/05/26 (2072) ; même date pour la 2031 (BIC au réel) et la 2065 (exercice civil).
 */

export type SheetKind = 'PERSONAL' | 'SCI_IR' | 'COMPANY_IR' | 'IS'

export interface StructureForTax {
  kind?: 'PERSON' | 'COUPLE' | 'SCI' | 'COMPANY' | null
  taxRegime?: 'IR' | 'IS' | null
  companyForm?: string | null
  associates?: Array<{ name?: string | null; sharePct?: number | null }> | null
}

export interface YearTotals {
  /** Loyers hors charges encaissés. */
  rentCents: number
  /** Charges récupérées auprès des locataires. */
  chargesCents: number
  /** Résultat calculé comme au régime réel (loyers − charges déductibles − intérêts), revenus fonciers. */
  resultCents: number
  /** Intérêts, assurance et frais d'emprunt (ligne 250). */
  interestCents: number
  /** Dépenses payées (toutes catégories). */
  expensesCents: number
  furnished: boolean
}

export interface SheetStep {
  title: string
  form?: string
  deadline?: string
  lines: Array<{ label: string; cents?: number; text?: string }>
  note?: string
}

export interface TaxSheet {
  kind: SheetKind
  title: string
  steps: SheetStep[]
  shares: Array<{ name: string; pct: number; resultCents: number }>
  sources: Array<{ label: string; url: string }>
}

const SOURCES = {
  notice2044: { label: 'Notice de la déclaration 2044 (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/sites/default/files/formulaires/2044/2026/2044_5487.pdf' },
  sci: { label: 'Déclarer les résultats d’une SCI (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/professionnel/questions/comment-declarer-les-resultats-de-ma-sci' },
  bic: { label: 'Dépôt de la déclaration de résultat au réel (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/professionnel/questions/dans-le-cas-dune-entreprise-concernee-par-un-regime-reel-dimposition-limpot' },
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

/** Dimanche de Pâques (calcul grégorien de Meeus/Jones/Butcher). */
export function easter(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return utc(year, month, day)
}

/** Jours fériés de mai qui peuvent tomber juste après le 1er : 8 mai, Ascension, lundi de Pentecôte. */
function mayHolidays(year: number): Set<string> {
  const e = easter(year).getTime()
  return new Set([iso(utc(year, 5, 1)), iso(utc(year, 5, 8)), iso(new Date(e + 39 * 86_400_000)), iso(new Date(e + 50 * 86_400_000))])
}

/**
 * Déclarations de résultat (2072, 2031, 2065 pour un exercice civil) des revenus de `year` :
 * 2e jour ouvré après le 1er mai de l'année suivante, et 15 jours calendaires de plus en ligne.
 */
export function resultDeadline(year: number): { legal: string; online: string } {
  const y = year + 1
  const holidays = mayHolidays(y)
  let d = utc(y, 5, 1)
  let worked = 0
  while (worked < 2) {
    d = new Date(d.getTime() + 86_400_000)
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6 && !holidays.has(iso(d))) worked++
  }
  return { legal: iso(d), online: iso(new Date(d.getTime() + 15 * 86_400_000)) }
}

export function sheetKind(s: StructureForTax): SheetKind {
  if (s.kind === 'SCI') return s.taxRegime === 'IS' ? 'IS' : 'SCI_IR'
  if (s.kind === 'COMPANY') return s.taxRegime === 'IR' ? 'COMPANY_IR' : 'IS'
  return 'PERSONAL'
}

/** Part de chaque associé dans le résultat (les parts manquantes restent à 0 %). */
export function sharesOf(s: StructureForTax, resultCents: number): TaxSheet['shares'] {
  return (s.associates ?? [])
    .filter((a) => (a.name ?? '').trim() || a.sharePct)
    .map((a) => {
      const pct = Math.max(0, Math.min(100, a.sharePct ?? 0))
      return { name: (a.name ?? '').trim() || 'Associé', pct, resultCents: Math.round((resultCents * pct) / 100) }
    })
}

const frDate = (isoDay: string) => {
  const [y, m, d] = isoDay.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Fiche de l'année pour une structure qui n'est pas « en mon nom ». Null pour une personne ou un couple. */
export function structureTaxSheet(s: StructureForTax, t: YearTotals, year: number): TaxSheet | null {
  const kind = sheetKind(s)
  if (kind === 'PERSONAL') return null
  const dl = resultDeadline(year)
  const deadline = `${frDate(dl.online)} en ligne (${frDate(dl.legal)} sur papier)`
  const shares = sharesOf(s, t.resultCents)
  const income = [
    { label: 'Loyers encaissés, hors charges', cents: t.rentCents },
    { label: 'Charges récupérées auprès des locataires', cents: t.chargesCents },
    { label: 'Dépenses payées dans l’année', cents: t.expensesCents },
    { label: 'Intérêts, assurance et frais d’emprunt', cents: t.interestCents },
  ]
  if (kind === 'SCI_IR')
    return {
      kind,
      title: 'SCI à l’impôt sur le revenu',
      steps: [
        {
          title: 'La SCI déclare son résultat',
          form: '2072-S (ou 2072-C), en ligne depuis l’espace professionnel de la SCI',
          deadline,
          lines: [...income, { label: 'Résultat foncier de la SCI (estimation, comme au régime réel)', cents: t.resultCents }],
          note: 'La SCI ne paie pas d’impôt elle-même : elle indique la part de chaque associé.',
        },
        {
          title: 'Chaque associé déclare sa part',
          form: 'Déclaration de revenus 2042 (et 2044 si l’associé loue aussi en direct)',
          lines: [
            { label: 'Seulement des parts de SCI', text: 'sa part en case 4BA de la 2042, sans 2044 ; pas de micro-foncier' },
            { label: 'Loue aussi des logements en son nom', text: 'sa part au paragraphe 110 de la 2044' },
          ],
          note: shares.length ? undefined : 'Indiquez les associés et leurs parts dans la fiche de la structure : Bailio calculera la part de chacun.',
        },
      ],
      shares,
      sources: [SOURCES.notice2044, SOURCES.sci],
    }
  if (kind === 'COMPANY_IR')
    return {
      kind,
      title: `${s.companyForm?.trim() || 'Société'} à l’impôt sur le revenu`,
      steps: [
        {
          title: 'La société déclare son résultat',
          form: '2031 et ses annexes (régime réel), avec votre expert-comptable',
          deadline,
          lines: income,
          note: 'Location meublée par une SARL de famille : bénéfices industriels et commerciaux, amortissements compris. Le résultat exact se calcule avec la liasse.',
        },
        { title: 'Chaque associé déclare sa part', form: 'Déclaration de revenus 2042-C-PRO', lines: [{ label: 'Cases à remplir', text: 'à vérifier avec votre expert-comptable' }] },
      ],
      shares: sharesOf(s, 0).map((x) => ({ ...x, resultCents: 0 })),
      sources: [SOURCES.bic],
    }
  return {
    kind,
    title: 'Société à l’impôt sur les sociétés',
    steps: [
      {
        title: 'La société déclare son résultat',
        form: '2065 et la liasse 2033, avec votre expert-comptable',
        deadline,
        lines: income,
        note: 'À l’impôt sur les sociétés, le résultat tient compte des amortissements et l’impôt est payé par la société. Transmettez ces chiffres à votre expert-comptable.',
      },
      { title: 'Les associés', lines: [{ label: 'Ce qu’ils déclarent', text: 'seulement les dividendes reçus, s’il y en a' }] },
    ],
    shares: [],
    sources: [SOURCES.sci],
  }
}
