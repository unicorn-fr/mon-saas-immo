/**
 * Outils de lecture du texte d'un bail : nettoyage, recherche insensible aux accents et à la casse,
 * lecture des montants, des dates et des nombres écrits en lettres.
 */

/** Nettoie le texte brut (PDF ou reconnaissance de caractères) sans en changer le sens. */
export function cleanText(input: string): string {
  return (
    input
      .replace(/\r\n?/g, '\n')
      .replace(/[    \t]/g, ' ')
      .replace(/[‘’ʼ´`]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[‐‑‒–—−]/g, '-')
      .replace(/ﬁ/g, 'fi')
      .replace(/ﬂ/g, 'fl')
      .replace(/œ/g, 'oe')
      .replace(/Œ/g, 'OE')
      .replace(/æ/g, 'ae')
      // Mots coupés en fin de ligne : « lo-\ngement » → « logement »
      .replace(/([a-zà-ÿ])-\n\s*([a-zà-ÿ])/g, '$1$2')
      // Grands espaces des mises en page en colonnes (« Libellé      valeur ») : on garde une séparation lisible
      .replace(/ {3,}/g, ' : ')
      .replace(/ {2}/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

/**
 * Version « repliée » : minuscules, sans accents, **même longueur** que l'original,
 * pour chercher dans l'une et extraire dans l'autre avec les mêmes positions.
 */
export function fold(text: string): string {
  let out = ''
  for (const ch of text) {
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    out += base.length === 1 ? base : ch.length === 1 ? ch.toLowerCase().charAt(0) : '?'
    // Les caractères hors du plan de base (emoji…) occupent deux unités : on garde l'alignement.
    if (ch.length === 2) out += '?'
  }
  return out
}

export class Doc {
  readonly raw: string
  readonly low: string

  constructor(text: string) {
    this.raw = cleanText(text)
    this.low = fold(this.raw)
  }

  /** Toutes les occurrences d'une expression (écrite en minuscules sans accents) dans une zone. */
  find(re: RegExp, from = 0, to = this.low.length): { index: number; end: number; match: RegExpExecArray }[] {
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
    const g = new RegExp(re.source, flags)
    g.lastIndex = from
    const out: { index: number; end: number; match: RegExpExecArray }[] = []
    let m: RegExpExecArray | null
    while ((m = g.exec(this.low)) && m.index < to) {
      out.push({ index: m.index, end: m.index + m[0].length, match: m })
      if (m[0].length === 0) g.lastIndex += 1
    }
    return out
  }

  first(re: RegExp, from = 0, to = this.low.length) {
    return this.find(re, from, to)[0]
  }

  /** Fenêtre de texte après une position, arrêtée à `maxLines` fins de ligne. */
  window(start: number, maxChars: number, maxLines = 2): { low: string; raw: string; start: number } {
    let end = Math.min(this.low.length, start + maxChars)
    let lines = 0
    for (let i = start; i < end; i += 1) {
      if (this.low[i] === '\n' && ++lines >= maxLines) {
        end = i
        break
      }
    }
    return { low: this.low.slice(start, end), raw: this.raw.slice(start, end), start }
  }

  lineAt(pos: number): { start: number; end: number; low: string; raw: string } {
    const start = this.low.lastIndexOf('\n', pos - 1) + 1
    let end = this.low.indexOf('\n', pos)
    if (end < 0) end = this.low.length
    return { start, end, low: this.low.slice(start, end), raw: this.raw.slice(start, end) }
  }
}

// ── Nombres ──────────────────────────────────────────────────────────────────

const UNITS: Record<string, number> = {
  zero: 0, un: 1, une: 1, premier: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30,
  quarante: 40, cinquante: 50, soixante: 60,
}

/** Petits nombres écrits en lettres (« vingt-huit », « trois »…), jusqu'à 99. */
export function wordsToNumber(words: string): number | null {
  const parts = fold(words).trim().split(/[\s-]+/).filter((w) => w && w !== 'et')
  if (!parts.length) return null
  let total = 0
  for (const p of parts) {
    if (p === 'cent' || p === 'cents') total = (total || 1) * 100
    else if (p === 'mille') total = (total || 1) * 1000
    else if (p === 'dix' && total % 10 === 0 && total >= 60) total += 10
    else if (p in UNITS) total += UNITS[p]
    else return null
  }
  return total
}

const NUMBER_WORD = '(?:une?|premier|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt(?:[ -](?:et[ -])?(?:un|deux|trois|quatre|cinq|six|sept|huit|neuf))?)'
export const NUMBER_WORD_RE = NUMBER_WORD

// ── Montants ─────────────────────────────────────────────────────────────────

/**
 * Montants en euros dans un extrait replié : « 780 € », « 1 250,00 euros », « 1.250 EUR », « 780€ ».
 * `currency` indique si le symbole ou le mot « euro » accompagne le nombre.
 */
export function amountsIn(low: string): { value: number; index: number; end: number; currency: boolean }[] {
  const out: { value: number; index: number; end: number; currency: boolean }[] = []
  const re = /(?<![\d,.\/-])(\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.](\d{1,2}))?(?![\d\/])(\s*(?:€|euros?\b|eur\b|e\.?u\.?r\.?))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(low))) {
    const integer = Number(m[1].replace(/[ .]/g, ''))
    const decimals = m[2] ? Number(m[2].padEnd(2, '0')) / 100 : 0
    const value = integer + decimals
    // Écarte les années, articles de loi et numéros qui ne sont pas des montants
    const before = low.slice(Math.max(0, m.index - 12), m.index)
    const after = low.slice(m.index + m[0].length, m.index + m[0].length + 4)
    if (!m[3]) {
      if (/(?:n°|no|article|art\.|loi|decret|annexe|alinea)\s*$/.test(before)) continue
      if (/^\s*(?:%|m2|m²|ans?\b|mois|jours?|er\b|e\b|eme|pieces?|°)/.test(after)) continue
      if (/^\s*-\s*\d/.test(after)) continue
    }
    out.push({ value, index: m.index, end: m.index + m[0].length, currency: Boolean(m[3]) })
  }
  return out
}

// ── Dates ────────────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  janvier: 1, janv: 1, fevrier: 2, fevr: 2, fev: 2, mars: 3, avril: 4, avr: 4, mai: 5, juin: 6, juillet: 7, juil: 7,
  aout: 8, septembre: 9, sept: 9, octobre: 10, oct: 10, novembre: 11, nov: 11, decembre: 12, dec: 12,
}
const MONTH_RE = '(janvier|janv\\.?|fevrier|fevr\\.?|fev\\.?|mars|avril|avr\\.?|mai|juin|juillet|juil\\.?|aout|septembre|sept\\.?|octobre|oct\\.?|novembre|nov\\.?|decembre|dec\\.?)'

function validDate(y: number, m: number, d: number): string | null {
  if (y < 100) y += y >= 70 ? 1900 : 2000
  if (y < 1980 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCMonth() !== m - 1) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Première date lisible d'un extrait replié, au format AAAA-MM-JJ. */
export function firstDate(low: string): { iso: string; index: number } | null {
  const found: { iso: string; index: number }[] = []
  const numeric = /(?<!\d)(\d{1,2})\s*(?:er)?\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4}|\d{2})(?!\d)/g
  let m: RegExpExecArray | null
  while ((m = numeric.exec(low))) {
    const iso = validDate(Number(m[3]), Number(m[2]), Number(m[1]))
    if (iso) found.push({ iso, index: m.index })
  }
  // « 1er octobre 2026 », « 01 oct. 2026 », « premier octobre 2026 » (et « ler » ou « 1°» mal reconnus)
  const words = new RegExp(`(?<![\\d])(\\d{1,2}|premier|ler|1°|(?<![a-z])er)\\s*(?:er|e|°)?\\s+${MONTH_RE}\\s*,?\\s*(\\d{4})`, 'g')
  while ((m = words.exec(low))) {
    const day = /^\d+$/.test(m[1]) ? Number(m[1]) : 1
    const month = MONTHS[m[2].replace('.', '')]
    const iso = validDate(Number(m[3]), month, day)
    if (iso) found.push({ iso, index: m.index })
  }
  found.sort((a, b) => a.index - b.index)
  return found[0] ?? null
}

// ── Noms ─────────────────────────────────────────────────────────────────────

/** Prénoms courants en France (INSEE), pour distinguer le prénom du nom quand l'ordre est ambigu. */
const FIRST_NAMES = new Set(
  `adam adele adrien agathe agnes alain alban albert alexandra alexandre alexis alfred alice aline alix amandine amelie anais andre andrea angelique anne annick annie antoine antonin arnaud arthur audrey augustin aurelie aurelien axel baptiste barbara basile bastien beatrice benedicte benjamin benoit bernadette bernard bertrand brigitte bruno camille capucine caroline catherine cecile celine charles charlotte chloe christelle christian christiane christine christophe claire clara claude clement clemence colette coline corinne damien daniel daniele danielle david delphine denis denise didier dominique dylan edith edouard eliane elisa elisabeth elise elodie eloise emeline emile emilie emma emmanuel emmanuelle enzo eric estelle ethan etienne eugenie eva evelyne fabien fabienne fabrice fanny felix fernand florence florent florian francine francis franck francois francoise frederic frederique gabriel gabrielle gael gaelle gaetan genevieve georges gerard gilbert gilles ginette guillaume guy helene henri herve hugo hugues ines irene isabelle jacqueline jacques jade jean jeanne jeremy jerome joel johanna jonathan joseph josette josiane jules julie julien juliette justine karine kevin laetitia laura laure laurence laurent lea lea leon leo liam lina lise lola lorraine louis louise luc lucas lucie lucien lucile ludovic lydie madeleine maelle manon marc marcel marguerite maria marianne marie marine marion martine mathieu mathilde matthieu maurice maxime melanie mia michel michele micheline mickael monique morgane muriel myriam nadia nadine nathalie nathan nicolas nicole noah noel noemie oceane odile olivier pascal pascale patrice patricia patrick paul pauline perrine philippe pierre quentin raphael raymond regine remi renee richard robert roger romain rose sabine sacha samuel sandrine sarah sebastien serge simon simone solene sophie stephane stephanie suzanne sylvain sylvie theo thibault thierry thomas timothee tristan valentin valerie vanessa veronique victor victoria vincent virginie xavier yann yannick yves yvette yvonne zoe mohamed ahmed fatima karim nadia sofia yasmine rayan youssef ines`.split(/\s+/),
)

const NAME_STOP = new Set(
  `le la les de du des et ou nom noms prenom prenoms bailleur bailleurs locataire locataires preneur preneurs proprietaire proprietaires
   personne physique morale qualite domicile adresse demeurant ne nee societe represente representee soussigne soussignee
   monsieur madame mademoiselle m mme mlle mr me epoux epouse ci apres designe denomme appele une part autre`.split(/\s+/),
)

export interface PersonName {
  firstName: string | null
  lastName: string | null
}

const titleCase = (w: string) =>
  w.toLowerCase().replace(/(^|[\s'-])([a-zà-ÿ])/g, (_m, sep: string, c: string) => sep + c.toUpperCase())

/**
 * Découpe un nom lu (« DUPONT Jean », « Jean Dupont », « Marie-Claire LE GALL ») en prénom et nom.
 * `lastNameFirst` : le libellé annonçait « Nom et prénom ».
 */
export function splitName(rawName: string, lastNameFirst = false): PersonName | null {
  const tokens = rawName
    .replace(/[^A-Za-zÀ-ÿ' -]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^['-]+|['-]+$/g, ''))
    .filter(Boolean)
  const isStop = (t: string) => NAME_STOP.has(fold(t).replace(/\.$/, ''))
  const allCaps = (t: string) => t.length >= 2 && t === t.toUpperCase() && t !== t.toLowerCase()
  // Particules d'un nom en capitales (« LE GALL », « DE LA TOUR ») : conservées
  const kept = tokens.filter((t, i) => {
    if (!isStop(t)) return true
    if (!allCaps(t) || !/^(le|la|de|du|des)$/.test(fold(t))) return false
    const next = tokens.slice(i + 1).find((n) => !/^(le|la|de|du|des)$/.test(fold(n)))
    return Boolean(next && allCaps(next) && !isStop(next))
  })
  if (!kept.length || kept.length > 6) return null
  if (!kept.some((t) => t.replace(/['-]/g, '').length >= 2)) return null

  const isCaps = (t: string) => t.length >= 2 && t === t.toUpperCase() && t !== t.toLowerCase()
  const isFirst = (t: string) => t.split('-').every((p) => FIRST_NAMES.has(fold(p)))
  const caps = kept.filter(isCaps)
  const lower = kept.filter((t) => !isCaps(t))

  let first: string[]
  let last: string[]
  if (kept.length === 1) {
    return isFirst(kept[0]) && !isCaps(kept[0]) ? { firstName: titleCase(kept[0]), lastName: null } : { firstName: null, lastName: titleCase(kept[0]) }
  } else if (caps.length && lower.length) {
    // Convention française : le nom en capitales
    last = caps
    first = lower
  } else if (isFirst(kept[0]) && !isFirst(kept[kept.length - 1])) {
    first = [kept[0]]
    last = kept.slice(1)
  } else if (isFirst(kept[kept.length - 1]) && !isFirst(kept[0])) {
    first = [kept[kept.length - 1]]
    last = kept.slice(0, -1)
  } else if (lastNameFirst) {
    last = [kept[0]]
    first = kept.slice(1)
  } else {
    first = [kept[0]]
    last = kept.slice(1)
  }
  return { firstName: first.length ? titleCase(first.join(' ')) : null, lastName: last.length ? titleCase(last.join(' ')) : null }
}

export const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g

// ── Adresses ─────────────────────────────────────────────────────────────────

export const STREET_WORDS =
  'rue|r\\.|avenue|av\\.?|boulevard|bd|bld|place|pl\\.|chemin|ch\\.|impasse|imp\\.|allee|allees|route|rte|quai|cours|square|passage|residence|res\\.|lotissement|lot\\.|lieu-dit|lieudit|faubourg|fbg|voie|cite|hameau|sentier|promenade|esplanade|rond-point|montee|traverse|villa|parvis|clos|domaine|mail|rampe|ruelle|venelle|carrefour|batiment|bat\\.|immeuble'

/** Un extrait ressemble-t-il à une adresse postale française ? */
export function looksLikeAddress(low: string): boolean {
  return new RegExp(`\\b(${STREET_WORDS})\\b`).test(low) || /\b\d{5}\b/.test(low)
}
