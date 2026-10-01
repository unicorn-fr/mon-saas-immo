import {
  Doc,
  EMAIL_RE,
  NUMBER_WORD_RE,
  STREET_WORDS,
  amountsIn,
  firstDate,
  fold,
  looksLikeAddress,
  splitName,
  wordsToNumber,
  type PersonName,
} from './text.js'

/**
 * Lecture d'un bail d'habitation à partir de son texte, sans service extérieur.
 *
 * Le lecteur connaît la structure des contrats types du décret n° 2015-587 (annexe 1 vide, annexe 2 meublé),
 * les baux d'agence (« preneur », « d'une part / d'autre part ») et les baux rédigés librement.
 * Chaque information est cherchée par ses libellés habituels, puis contrôlée (montant plausible,
 * date valide…). Ce qui n'est pas trouvé avec certitude reste vide : le propriétaire complète à la relecture.
 */

export type DpeClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export interface Person extends PersonName {
  address: string | null
}

export interface Extraction {
  isLease: boolean
  type: 'UNFURNISHED' | 'FURNISHED' | null
  property: { address: string | null; surface: number | null; rooms: number | null; dpeClass: DpeClass | null }
  landlord: Person
  tenants: (PersonName & { email: string | null })[]
  guarantor: Person | null
  rent: {
    rentEuros: number | null
    chargesEuros: number | null
    depositEuros: number | null
    startDate: string | null
    paymentDay: number | null
  }
}

// ── Montants ─────────────────────────────────────────────────────────────────

interface AmountRule {
  label: RegExp
  /** Mots qui, juste avant le libellé, désignent autre chose (loyer de référence, dernier loyer…). */
  notAfter?: RegExp
  factor?: number
  reach?: number
}

function amountAfter(doc: Doc, rules: AmountRule[], min: number, max: number, from = 0, to = doc.low.length): number | null {
  for (const rule of rules) {
    for (const hit of doc.find(rule.label, from, to)) {
      const before = doc.low.slice(Math.max(0, hit.index - 30), hit.index)
      if (rule.notAfter?.test(before)) continue
      const win = doc.window(hit.end, rule.reach ?? 160, 3)
      const amounts = amountsIn(win.low)
      // D'abord un montant accompagné de « € », sinon un nombre seul collé au libellé (« Loyer : 780 »).
      const pick =
        amounts.find((a) => a.currency && a.index < (rule.reach ?? 160)) ??
        amounts.find((a) => !a.currency && a.index <= 12 && /^\s*[:=]?\s*$/.test(win.low.slice(0, a.index)))
      if (!pick) continue
      const value = Math.round(pick.value * (rule.factor ?? 1) * 100) / 100
      if (value >= min && value <= max) return value
    }
  }
  return null
}

const NOT_RENT = /(reference|referen ce|dernier|precedent|complement de|majore|revise|evolution|nouveau|ancien|minore)\s*(du|de)?\s*$/

function readRent(doc: Doc): number | null {
  return amountAfter(
    doc,
    [
      { label: /montant du loyer (mensuel )?(hors charges|hc|principal|initial)?/, notAfter: NOT_RENT },
      { label: /loyer (mensuel )?(hors charges|h\.?c\.?|principal|de base|nu)\b/, notAfter: NOT_RENT },
      { label: /loyer mensuel/, notAfter: NOT_RENT },
      { label: /(moyennant|pour) (un|le) loyer( mensuel)?( de)?/, notAfter: NOT_RENT },
      { label: /(le )?loyer (est|sera) (fixe|convenu|consenti)( a)?( la somme de)?/, notAfter: NOT_RENT },
      { label: /loyer annuel/, notAfter: NOT_RENT, factor: 1 / 12 },
      { label: /\bloyer\s*[:=]/, notAfter: NOT_RENT, reach: 40 },
    ],
    30,
    20_000,
  )
}

function readCharges(doc: Doc): number | null {
  const direct = amountAfter(
    doc,
    [
      { label: /montant des provisions (sur|pour) charges/ },
      { label: /provisions? (mensuelles? )?(sur|pour|de|sur les) charges( recuperables)?/ },
      { label: /forfait (mensuel )?(de |des |pour )?charges/ },
      { label: /charges (mensuelles|recuperables|locatives|forfaitaires)\s*[:=]/, reach: 80 },
      { label: /\bcharges\s*[:=]/, notAfter: /(hors|sans|toutes|avec)\s*$/, reach: 40 },
    ],
    0,
    3_000,
  )
  return direct
}

function readDeposit(doc: Doc, rent: number | null): number | null {
  const direct = amountAfter(
    doc,
    [
      { label: /montant du depot de garantie/, reach: 200 },
      { label: /depot de garantie/, reach: 200 },
      { label: /\b(montant de la |une )?caution\s*[:=]/, reach: 60 },
    ],
    0,
    60_000,
  )
  if (direct !== null) return direct
  // « un dépôt de garantie correspondant à un mois de loyer » : calculé à partir du loyer
  if (rent) {
    for (const hit of doc.find(/depot de garantie/)) {
      const win = doc.window(hit.end, 220, 3).low
      if (/neant|aucun|sans depot|pas de depot/.test(win.slice(0, 60))) return 0
      const m = new RegExp(`(\\d|${NUMBER_WORD_RE})\\s*(?:\\(\\d\\)\\s*)?mois de loyer`).exec(win)
      if (m) {
        const n = /^\d$/.test(m[1]) ? Number(m[1]) : wordsToNumber(m[1])
        if (n && n <= 3) return Math.round(rent * n * 100) / 100
      }
    }
  }
  return null
}

// ── Dates ────────────────────────────────────────────────────────────────────

function readStartDate(doc: Doc): string | null {
  const labels = [
    /date de prise d'?\s?effet( du (contrat|bail))?/,
    /prend(ra)? effet (le|a compter du|a partir du)/,
    /(entree en jouissance|date d'?entree( dans les lieux)?|date d'?effet|date de debut( du (bail|contrat))?)/,
    /(commencer?(a|ont|ra|ront)?|debuter?(a|ont|ra|ront)?|courir) (a courir )?(le|a compter du|a partir du)/,
    /(a compter du|a partir du)/,
  ]
  for (const re of labels) {
    for (const hit of doc.find(re)) {
      const win = doc.window(hit.end, 90, 2)
      // Ne pas prendre la date de fin : « … jusqu'au 30 septembre 2029 ».
      const d = firstDate(win.low.split(/jusqu|au terme|fin du (bail|contrat)/)[0])
      if (d && d.index < 70) return d.iso
    }
  }
  return null
}

function readPaymentDay(doc: Doc): number | null {
  const dayRe = new RegExp(
    `(?:le|au|avant le|au plus tard le)\\s+(\\d{1,2}|${NUMBER_WORD_RE}|ler|1°)\\s*(?:er|e|°)?\\s*(?:jour\\s*)?(?:ouvre\\s*)?(?:de chaque|du|de|par|chaque)\\s+(?:mois|periode)`,
  )
  const labels = [
    /date (ou periode )?de paiement/,
    /(payable|paye|verse|regle|acquitte|exigible)s?( mensuellement)?( d'avance| a terme echu| a echoir)?/,
    /paiement (du loyer|des loyers|mensuel)/,
    /(au plus tard|avant) le/,
  ]
  for (const re of labels) {
    for (const hit of doc.find(re)) {
      const win = doc.window(Math.max(0, hit.index - 5), 200, 3).low
      const m = dayRe.exec(win)
      if (m) {
        const n = /^\d+$/.test(m[1]) ? Number(m[1]) : m[1] === 'ler' || m[1] === '1°' ? 1 : wordsToNumber(m[1])
        if (n && n >= 1 && n <= 31) return n
      }
      if (/premier jour (du|de chaque) mois|debut (du|de chaque) mois/.test(win)) return 1
    }
  }
  return null
}

// ── Logement ─────────────────────────────────────────────────────────────────

function readSurface(doc: Doc): number | null {
  const unit = '(?:m\\s?2|m²|m\\s?\\^?2|metres? carres?|mq)'
  // Après le libellé « surface », on accepte les lectures abîmées du « ² » (m°, m?, m*, m" ou m seul).
  const loose = `(?:${unit}|m\\s?[°?*^'"³]|m(?![a-z]))`
  const value = new RegExp(`(\\d{1,4}(?:[.,]\\d{1,2})?)\\s*${loose}`)
  for (const re of [/surface (habitable|privative|loi carrez|totale|au sol)?/, /superficie( habitable| privative)?/, /d'?une surface de/]) {
    for (const hit of doc.find(re)) {
      const win = doc.window(hit.end, 90, 2).low
      const m = value.exec(win)
      if (m && m.index < 60) {
        const n = Number(m[1].replace(',', '.'))
        if (n >= 5 && n <= 1000) return n
      }
    }
  }
  const any = doc.first(new RegExp(`(?<![\\d.,])(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*${unit}(?![a-z])`))
  if (any) {
    const n = Number(any.match[1].replace(',', '.'))
    if (n >= 9 && n <= 1000) return n
  }
  return null
}

function readRooms(doc: Doc): number | null {
  const labelled = doc.first(new RegExp(`nombre de pieces( principales)?( d'?habitation)?\\s*[:=]?\\s*(\\d{1,2}|${NUMBER_WORD_RE})\\b`))
  if (labelled) {
    const v = labelled.match[3]
    const n = /^\d+$/.test(v) ? Number(v) : wordsToNumber(v)
    if (n && n <= 30) return n
  }
  const counted = doc.first(new RegExp(`(?<![\\d,.])(\\d{1,2}|${NUMBER_WORD_RE})\\s*(?:\\(\\d{1,2}\\)\\s*)?pieces?( principales| d'?habitation)?\\b(?! (justificatives|suivantes|annexees|jointes|d'identite))`))
  if (counted) {
    const v = counted.match[1]
    const n = /^\d+$/.test(v) ? Number(v) : wordsToNumber(v)
    if (n && n >= 1 && n <= 30) return n
  }
  const type = doc.first(/\b(?:appartement|logement|maison|pavillon|duplex|type)\s+(?:de type\s+)?[tf]\s?(\d{1,2})\b/) ?? doc.first(/\b[tf](\d)\b(?=[^a-z0-9]{0,3}(?:de|meuble|vide|situe|d'une|,|\n))/)
  if (type) {
    const n = Number(type.match[1])
    if (n >= 1 && n <= 12) return n
  }
  if (doc.first(/\bstudio\b|\bchambre meublee\b/)) return 1
  return null
}

function readDpe(doc: Doc): DpeClass | null {
  const anchors = doc.find(/performance energetique|\bdpe\b|diagnostic de performance|classe (d'?)?energie|etiquette (d'?)?energie|consommation (d'?)?energie|classe energetique|etiquette energetique/)
  for (const hit of anchors) {
    const win = doc.window(hit.end, 120, 2).low
    const m = /(?:classe|etiquette|categorie|lettre|note|niveau)?\s*(?:energie|energetique|dpe)?\s*[:=]?\s*\(?\b([a-g])\b\)?(?![a-z'])/.exec(win)
    if (!m || m.index > 60) continue
    const before = win.slice(0, m.index)
    if (/ges|climat|emission|gaz/.test(before)) continue
    // Évite « a » article (« à compter », « a été ») : exige un libellé de classe ou un séparateur
    if (m[1] === 'a' && !/(classe|etiquette|categorie|lettre|note|niveau|:|=)\s*$/.test(win.slice(0, m.index + m[0].length - 1))) continue
    if (/^(de|le|la|du|un|une)$/.test(win.slice(m.index + m[0].length).trim().split(/\s/)[0] ?? '') && !/classe|etiquette|:|=/.test(m[0])) continue
    return m[1].toUpperCase() as DpeClass
  }
  return null
}

function readType(doc: Doc): Extraction['type'] {
  const low = doc.low.replace(/non[ -]meubl/g, 'vide')
  const head = low.slice(0, 2500)
  let furnished = 0
  let empty = 0
  const count = (s: string, re: RegExp) => (s.match(new RegExp(re.source, 'g')) ?? []).length
  furnished += 3 * count(head, /(logement|location|local|locaux|appartement|studio|maison|bail) meubles?\b/)
  furnished += 2 * count(low, /titre i(er)? bis|article 25-3|articles? 25-3 a 25-11|annexe 2|inventaire (et etat detaille )?du mobilier|liste des meubles/)
  furnished += count(low, /\bmeubl/)
  empty += 3 * count(head, /(logement|location|local|locaux) (nu|vide)s?\b|\bnon meuble|locaux vides/)
  empty += 2 * count(low, /\(annexe 1\)|contrat type de location .{0,40}logement nu/)
  empty += count(low, /\b(location|logement) (nue|vide)\b/)
  // Durée du bail : un an (ou neuf mois étudiant) en meublé, trois ou six ans en vide
  const duration = doc.first(/(duree (du (contrat|bail)|de (la location|la presente location))\s*[:=]?|pour une duree de)\s*(.{0,60})/)
  if (duration) {
    const d = duration.match[5]
    if (/(un|1)\s*(\(1\)\s*)?an\b|douze mois|12 mois|neuf mois|9 mois/.test(d)) furnished += 2
    if (/(trois|3|six|6)\s*(\(\d\)\s*)?(ans|annees)/.test(d)) empty += 2
  }
  if (!furnished && !empty) return null
  if (furnished === empty) return null
  return furnished > empty ? 'FURNISHED' : 'UNFURNISHED'
}

// ── Adresses ─────────────────────────────────────────────────────────────────

const ADDRESS_STOP = /\s*(?:,?\s*ci-?\s?(?:apres|dessous)|;|\(|\bdesigne|\bdenomme|\bappele|\bne le\b|\bnee? le\b|\btel\b|\btelephone\b|\bportable\b|\bemail\b|\be-mail\b|\bcourriel\b|\badresse electronique\b|\bet\s+(?:m\.|mme|monsieur|madame)|\bqualite\b|\bd'une part|\bd'autre part|\bse porte|\bse constitue|\bdes obligations|\bpour une surface|\bd'une surface|\bcomprenant\b|\bcompose\b|,?\s*(au\s*)?\b\d+\s*(e|er|eme)\s*etage|,?\s*(rez-de-chaussee|\bescalier\b|\bporte\b|\blot\b))/

/** Lit une adresse qui commence à `start` : jusqu'à la fin de ligne, prolongée d'une ligne si le code postal suit. */
function addressAt(doc: Doc, start: number): string | null {
  const line = doc.lineAt(start)
  let low = doc.low.slice(start, line.end)
  let raw = doc.raw.slice(start, line.end)
  const next = doc.lineAt(line.end + 1)
  if (!/\b\d{5}\b/.test(low) && line.end < doc.low.length && /^\s*(\d{5}|[a-z-]+\s+\d{5})\b/.test(next.low)) {
    low += ` ${next.low}`
    raw += ` ${next.raw}`
  }
  const stop = ADDRESS_STOP.exec(low)
  if (stop && stop.index > 0) {
    low = low.slice(0, stop.index)
    raw = raw.slice(0, stop.index)
  }
  // Après « code postal + ville », la phrase continue (« 35000 Rennes, est loué vide ») : on s'arrête à la ville.
  const city = /\b\d{5}\s+[^,.;\n]*?(?=\s*[,.;]|\s+(?:est|sont|et|qui|pour|loue|louee|comprenant|dont|de type|d'une|au|a usage)\b|$)/.exec(low)
  if (city) {
    low = low.slice(0, city.index + city[0].length)
    raw = raw.slice(0, city.index + city[0].length)
  }
  raw = raw.replace(/^[\s:=,.-]+|[\s:=,.;-]+$/g, '').replace(/\s+/g, ' ')
  if (raw.length < 6 || raw.length > 200 || !looksLikeAddress(fold(raw))) return null
  return raw
}

const ADDRESS_LABEL = /(demeurant|domicilie(e)?s?|residant|domicile|adresse( postale| du domicile)?|sise?|situee?s?|habitant)\s*((du|de la|des) (bailleu?r\w*|locataires?|preneurs?|garant|caution)\s*)?(actuellement\s*)?(aux|au|a|en|:|,)?\s*(:)?\s*/

function readPropertyAddress(doc: Doc, exclude: (string | null)[]): string | null {
  const skip = exclude.filter(Boolean).map((a) => fold(a!).replace(/\W/g, '').slice(0, 20))
  const ok = (a: string | null) => a && !skip.includes(fold(a).replace(/\W/g, '').slice(0, 20))
  const labels = [
    /localisation du logement\s*[:=]?\s*/,
    /adresse (du logement|des locaux( loues)?|du bien|des lieux( loues)?|de la location)\s*[:=]?\s*/,
    /(logement|appartement|maison|locaux|bien|lieux loues|studio)[^.\n]{0,80}?\b(situee?s?|sise?s?)\s*(aux|au|a|en|:)?\s*/,
    /(situee?s?|sise?s?)\s*(aux|au|a|en|:)?\s*/,
  ]
  for (const re of labels) {
    for (const hit of doc.find(re)) {
      const a = addressAt(doc, hit.end)
      if (ok(a)) return a
    }
  }
  // Sinon : la première adresse complète (numéro, voie, code postal) qui n'est pas celle d'une des parties
  const generic = new RegExp(`\\b\\d{1,4}\\s*(?:bis|ter)?\\s*,?\\s*(?:${STREET_WORDS})\\s[^\\n;]{2,80}?\\b\\d{5}\\s+[a-z][a-z' -]{1,40}`, 'g')
  for (const hit of doc.find(generic)) {
    const a = doc.raw.slice(hit.index, hit.end).replace(/\s+/g, ' ').trim()
    if (ok(a)) return a
  }
  return null
}

// ── Parties ──────────────────────────────────────────────────────────────────

type Role = 'landlord' | 'tenant' | 'guarantor'

interface Mention {
  index: number
  end: number
  name: PersonName
  role: Role | null
  labelled: boolean
}

const CIVILITY = /\b(monsieur|madame|mademoiselle|m\.|mr\.?|mme\.?|mlle\.?|mmes|mm\.)\s+/
const NAME_END = /[\n,;(«"]|\d|\s(ne|nee|demeurant|domicilie|domiciliee|residant|epoux|epouse|et|ci-?\s?apres|designe|denomme|appele|qualite|adresse|agissant|represente|au capital|immatricule|de nationalite|profession|exercant|tel|telephone|email|courriel|dont|d'une|d'autre|pour|en qualite)\b/

const INNER_LABEL = /^\s*(?:(?:le |la |les )?(?:bailleur|proprietaire|locataire|preneur|colocataire|garant|caution)s?\s*(?:n°\s*)?\d?\s*[:=]\s*)?(?:(nom (?:et |, )?prenoms?|prenoms? (?:et )?nom|nom|identite)\s*[:=]\s*)?/

function nameAt(doc: Doc, start: number, lastNameFirst: boolean): { name: PersonName; end: number } | null {
  while (start < doc.low.length && /[\s:=]/.test(doc.low[start])) start += 1
  const inner = INNER_LABEL.exec(doc.low.slice(start, start + 60))
  if (inner && inner[0].length) {
    if (inner[1] && /^nom( et |, )?prenom|^nom$/.test(inner[1])) lastNameFirst = true
    start += inner[0].length
  }
  const civ = CIVILITY.exec(doc.low.slice(start, start + 14))
  if (civ && civ.index === 0) start += civ[0].length
  const win = doc.window(start, 80, 1)
  const stop = NAME_END.exec(win.low)
  const len = stop ? stop.index : win.low.length
  const raw = win.raw.slice(0, len).replace(/^[\s:=.-]+/, '')
  const name = splitName(raw, lastNameFirst)
  return name ? { name, end: start + len } : null
}

function roleWord(s: string): Role | null {
  if (/bailleur|proprietaire|loueur|^b[a-z]{1,2}i?ll?eu?r$/.test(s)) return 'landlord'
  if (/locataire|preneur|colocataire|occupant/.test(s)) return 'tenant'
  if (/garant|caution/.test(s)) return 'guarantor'
  return null
}

/** Fin de la partie « désignation des parties » : ce qui suit ne décrit plus les personnes. */
function partiesEnd(doc: Doc): number {
  const hit = doc.first(/objet du contrat|consistance du logement|designation (des locaux|du logement|des lieux)|il a ete (convenu|arrete)|\bii\.\s|\barticle (1|premier)\b/, 150)
  return hit ? hit.index : Math.min(doc.low.length, 5000)
}

function readParties(doc: Doc): { landlord: Person; tenants: (PersonName & { email: string | null })[]; guarantor: Person | null } {
  const end = partiesEnd(doc)
  const mentions: Mention[] = []
  const taken: [number, number][] = []
  const overlaps = (i: number) => taken.some(([a, b]) => i >= a && i < b)

  // 1. Libellés explicites : « Le bailleur : … », « Locataire 1 : … », « Nom et prénom du locataire : … »
  const labelled = /(?<=^|\n|[-•*]\s?)[ \t]*(?:(le |la |les )?(bailleur|bailleresse|proprietaire|loueur|locataire|preneur|colocataire|garant|caution)s?\s*(?:n°\s*)?\d?\s*(?:\(s\))?\s*(?:[:=]|\n)|(nom (?:et |, )?prenoms?|nom|identite|prenoms? (?:et )?nom)\s*(?:du |de la |des )?(bailleur|proprietaire|locataire|preneur|garant|caution)?s?\s*(?:\d\s*)?[:=])[ \t]*/g
  for (const hit of doc.find(labelled, 0, end)) {
    if (overlaps(hit.index)) continue
    // « …RÉSIDENCE PRINCIPALE DU / LOCATAIRE » : suite d'un titre coupé, pas un libellé
    if (/\b(du|de|des|au|la|le)\s*\n[\s:]*$/.test(doc.low.slice(Math.max(0, hit.index - 8), hit.index))) continue
    const at = hit.end
    const lastFirst = /^nom( et |, )?prenom|^nom\s*$/.test((hit.match[3] ?? '').trim())
    const n = nameAt(doc, at, lastFirst)
    if (!n) continue
    let role = roleWord(hit.match[2] ?? hit.match[4] ?? '')
    // « Nom et prénom : » sans rôle : rôle donné par l'intitulé de bloc qui précède
    if (!role) role = null
    mentions.push({ index: hit.index, end: n.end, name: n.name, role, labelled: Boolean(role) })
    taken.push([hit.index, n.end])
  }

  // 2. Civilités : « M. Jean DUPONT », « Madame Marie Martin »
  for (const hit of doc.find(new RegExp(CIVILITY.source, 'g'), 0, end)) {
    if (overlaps(hit.index)) continue
    const n = nameAt(doc, hit.end, false)
    if (!n) continue
    mentions.push({ index: hit.index, end: n.end, name: n.name, role: null, labelled: false })
    taken.push([hit.index, n.end])
  }
  // 2 bis. Acte rédigé sans civilité : « ENTRE LES SOUSSIGNÉS / Jean DUPONT, né le… ; / ET / Marie MARTIN… ; Paul BERNARD… ; »
  for (const hit of doc.find(/entre les soussigne(?:e)?s?\s*[:,]?\s*\n|\n[\s:]*et\s*\n|;\s*\n/g, 0, end)) {
    if (overlaps(hit.end)) continue
    if (/^[\s:]*([cg]i-?\s?(apres|dessous)|pour|le|la|les|il|d'une|d'autre)\b/.test(doc.low.slice(hit.end, hit.end + 30))) continue
    const n = nameAt(doc, hit.end, false)
    if (!n?.name.firstName || !n.name.lastName) continue
    mentions.push({ index: hit.end, end: n.end, name: n.name, role: null, labelled: false })
    taken.push([hit.end, n.end])
  }
  mentions.sort((a, b) => a.index - b.index)

  // 3. Rôle des mentions sans libellé : « … ci-après dénommé le bailleur » qui suit, sinon intitulé de bloc qui précède.
  const designations = doc.find(/[cg]i-?\s?(apres|dessous)\s*(designee?s?|denommee?s?|appelee?s?|nommee?s?)?\s*(ensemble\s*)?(ou\s*)?[«"]?\s*(le |la |les |l')?(b[a-z]{1,2}i?ll?eu?r|bailleresse|proprietaire|loueur|locataire|preneur|colocataire|garant|caution)/, 0, end)
  const headers = doc.find(/(?:^|\n)\s*(?:[a-z]\.|\d\.|[-•])?\s*(le |la |les |l')?(bailleur|bailleresse|proprietaire|loueur|locataires?|preneurs?|colocataires?|garants?|caution)s?\s*(\(s\))?\s*(?=\n|$)|\bd'une part\b|\bd'autre part\b/, 0, end)
  for (const [i, m] of mentions.entries()) {
    if (m.role) continue
    const nextIndex = mentions[i + 1]?.index ?? end
    const des = designations.find((d) => d.index > m.index && d.index < Math.max(nextIndex, m.end + 1) + 400 && !mentions.some((o) => o.index > m.index && o.index < d.index && o.role))
    if (des) {
      m.role = roleWord(des.match[6])
      continue
    }
    // « Jean DUPONT, demeurant… / D'UNE PART » : la partie désignée avant « d'une part » est le bailleur
    const partOne = headers.find((h) => /d'une part/.test(h.match[0]) && h.index > m.index && h.index < nextIndex)
    if (partOne && !mentions.some((o) => o.index < m.index && o.role === 'landlord')) {
      m.role = 'landlord'
      continue
    }
    const header = [...headers].reverse().find((h) => h.index < m.index)
    if (header) {
      const w = header.match[0]
      m.role = /d'une part/.test(w) ? 'tenant' : /d'autre part/.test(w) ? null : roleWord(w)
    }
  }

  // Blocs : chaque mention possède le texte jusqu'à la mention suivante (adresse, email).
  const blockEnd = (i: number) => Math.min(mentions[i + 1]?.index ?? end, mentions[i].end + 600)
  const addressOf = (i: number): string | null => {
    for (const hit of doc.find(ADDRESS_LABEL, mentions[i].end, blockEnd(i))) {
      const a = addressAt(doc, hit.end)
      if (a) return a
    }
    // « GARANT : M. Bernard PETIT, 14 chemin des Vignes 13100 Aix » : adresse sans mot d'introduction
    const direct = doc.first(new RegExp(`\\b\\d{1,4}\\s*(bis|ter)?\\s*,?\\s*(${STREET_WORDS})\\s`), mentions[i].end, blockEnd(i))
    return direct ? addressAt(doc, direct.index) : null
  }
  const emailOf = (i: number): string | null => {
    const block = doc.low.slice(mentions[i].end, blockEnd(i))
    return block.match(EMAIL_RE)?.[0] ?? null
  }

  const landlordIdx = mentions.findIndex((m) => m.role === 'landlord')
  const landlord: Person = landlordIdx >= 0 ? { ...mentions[landlordIdx].name, address: addressOf(landlordIdx) } : { firstName: null, lastName: null, address: null }
  if (landlordIdx >= 0 && !landlord.address) {
    // Formulaire : « Domicile : … » juste après le nom, parfois avant la mention suivante déjà repérée
    const hit = doc.first(/(domicile|adresse)( du bailleur)?\s*[:=]\s*/, mentions[landlordIdx].end, Math.min(end, mentions[landlordIdx].end + 400))
    if (hit) landlord.address = addressAt(doc, hit.end)
  }

  const seen = new Set<string>()
  const tenants: (PersonName & { email: string | null })[] = []
  mentions.forEach((m, i) => {
    if (m.role !== 'tenant') return
    const key = fold(`${m.name.firstName ?? ''} ${m.name.lastName ?? ''}`)
    if (seen.has(key)) return
    seen.add(key)
    tenants.push({ ...m.name, email: emailOf(i) })
  })
  // Adresses électroniques listées à part (« Adresse électronique : … ») : dans l'ordre des locataires
  const emails = [...new Set(doc.low.slice(0, end).match(EMAIL_RE) ?? [])]
  const landlordEmail = landlordIdx >= 0 ? emailOf(landlordIdx) : null
  const tenantEmails = emails.filter((e) => e !== landlordEmail)
  // Une adresse qui contient le nom d'un locataire lui revient, quel que soit l'ordre du texte.
  const owner = (e: string) => {
    const local = e.split('@')[0].replace(/[^a-z]/g, '')
    return tenants.find((t) => [t.lastName, t.firstName].some((n) => n && fold(n).replace(/[^a-z]/g, '').length >= 3 && local.includes(fold(n).replace(/[^a-z]/g, ''))))
  }
  for (const t of tenants) t.email = null
  for (const e of tenantEmails) {
    const t = owner(e)
    if (t && !t.email) t.email = e
  }
  const free = tenantEmails.filter((e) => !tenants.some((t) => t.email === e))
  for (const t of tenants) if (!t.email && free.length) t.email = free.shift()!

  const gIdx = mentions.findIndex((m) => m.role === 'guarantor')
  let guarantor: Person | null = gIdx >= 0 ? { ...mentions[gIdx].name, address: addressOf(gIdx) } : null
  if (!guarantor) guarantor = readCautionAct(doc)

  return { landlord, tenants, guarantor }
}

/** Acte de cautionnement joint au bail : « Je soussigné(e) M. X, demeurant …, déclare me porter caution ». */
function readCautionAct(doc: Doc): Person | null {
  // « Madame Hélène LEFEBVRE, demeurant …, se porte caution solidaire »
  for (const hit of doc.find(/se porte(nt)? (caution|garant)|se (porte|constitue) (fort|caution)/)) {
    const before = doc.low.slice(Math.max(0, hit.index - 300), hit.index)
    const civs = [...before.matchAll(new RegExp(CIVILITY.source, 'g'))]
    const last = civs[civs.length - 1]
    if (!last) continue
    const start = hit.index - before.length + last.index!
    const n = nameAt(doc, start, false)
    if (!n) continue
    const addr = doc.first(ADDRESS_LABEL, n.end, hit.index)
    return { ...n.name, address: addr ? addressAt(doc, addr.end) : null }
  }
  const hit = doc.first(/je soussignee?\s*,?\s*(\(e\)\s*)?/)
  if (!hit) return null
  const after = doc.window(hit.end, 700, 12).low
  if (!/(me porter?|me porte|declare me porter) caution/.test(after)) return null
  let at = hit.end
  const civ = CIVILITY.exec(doc.low.slice(at, at + 14))
  if (civ && civ.index === 0) at += civ[0].length
  const n = nameAt(doc, at, false)
  if (!n) return null
  const addr = doc.first(ADDRESS_LABEL, n.end, n.end + 300)
  return { ...n.name, address: addr ? addressAt(doc, addr.end) : null }
}

// ── Ensemble ─────────────────────────────────────────────────────────────────

/** Le document est-il un bail d'habitation ? (plusieurs mots-clés indépendants) */
function looksLikeLease(doc: Doc): boolean {
  const keys = [/\bbail\b|contrat de location|location (meublee|nue|vide)/, /bailleu?r|proprietaire/, /locataire|preneur/, /\bloyer/, /depot de garantie|caution/, /89-462|6 juillet 1989|2015-587/]
  const score = keys.filter((k) => k.test(doc.low)).length
  return doc.low.length >= 200 && score >= 3
}

export function parseLease(text: string): Extraction {
  const doc = new Doc(text)
  const parties = readParties(doc)
  const rent = readRent(doc)
  return {
    isLease: looksLikeLease(doc),
    type: readType(doc),
    property: {
      address: readPropertyAddress(doc, [parties.landlord.address, parties.guarantor?.address ?? null]),
      surface: readSurface(doc),
      rooms: readRooms(doc),
      dpeClass: readDpe(doc),
    },
    landlord: parties.landlord,
    tenants: parties.tenants,
    guarantor: parties.guarantor,
    rent: {
      rentEuros: rent,
      chargesEuros: readCharges(doc),
      depositEuros: readDeposit(doc, rent),
      startDate: readStartDate(doc),
      paymentDay: readPaymentDay(doc),
    },
  }
}
