/**
 * Lecture d'un fichier de logements et de locataires (export d'un ancien logiciel ou tableur), sur notre serveur
 * uniquement et en mémoire : rien n'est conservé. Formats : CSV (séparateur ; , ou tabulation, guillemets, BOM UTF-8,
 * accents en Windows-1252) et XLSX (premier onglet, lu avec fflate). Les colonnes sont reconnues par leur intitulé
 * (sans accents ni majuscules, avec des synonymes). Une ligne = un logement avec 0 ou 1 locataire ; les lignes de
 * même adresse et même libellé forment un seul logement qui reçoit leurs locataires.
 */
import { unzipSync, strFromU8 } from 'fflate'
import { parseAmount, parseDate } from './bankStatement.js'

export const MAX_IMPORT_ROWS = 200

export type ImportKind = 'VIDE' | 'MEUBLE' | 'PARKING'
export type ParkingType = 'GARAGE' | 'BOX' | 'PLACE'

export interface ImportProperty {
  label?: string
  address?: string
  postalCode?: string
  city?: string
  surface?: number
  rooms?: number
  kind: ImportKind
  parkingType?: ParkingType
  rentCents?: number
  chargesCents?: number
  depositCents?: number
  paymentDay?: number
}

export interface ImportTenant {
  firstNames?: string
  lastName?: string
  email?: string
  phone?: string
  /** AAAA-MM-JJ : affichée dans l'aperçu, le bail n'est pas créé par l'import. */
  entryDate?: string
}

export interface ImportRow {
  /** Première ligne du fichier qui a donné ce logement (les suivantes sont dans `lines`). */
  line: number
  lines: number[]
  property: ImportProperty
  tenants: ImportTenant[]
  /** En français, pour le propriétaire. */
  issues: string[]
  /** Un problème qui empêche d'ajouter le logement (adresse manquante). */
  blocking: boolean
}

export interface ImportPreview {
  rows: ImportRow[]
  columns: { detected: Array<{ header: string; field: string; label: string }>; ignored: string[] }
}

// ── Colonnes ────────────────────────────────────────────────────────────────

type Field = 'address' | 'postalCode' | 'city' | 'surface' | 'rooms' | 'kind' | 'rent' | 'charges' | 'deposit' | 'paymentDay' | 'entryDate' | 'label' | 'tenantFull' | 'lastName' | 'firstNames' | 'email' | 'phone'

const FIELD_LABEL: Record<Field, string> = {
  address: 'Adresse',
  postalCode: 'Code postal',
  city: 'Ville',
  surface: 'Surface',
  rooms: 'Pièces',
  kind: 'Type',
  rent: 'Loyer',
  charges: 'Charges',
  deposit: 'Dépôt de garantie',
  paymentDay: 'Jour de paiement',
  entryDate: 'Date d’entrée',
  label: 'Nom du bien',
  tenantFull: 'Locataire',
  lastName: 'Nom du locataire',
  firstNames: 'Prénom du locataire',
  email: 'Email du locataire',
  phone: 'Téléphone du locataire',
}

/** Intitulés reconnus, sans accents ni majuscules ni ponctuation (voir `norm`). */
const SYNONYMS: Record<Field, string[]> = {
  address: ['adresse', 'adresse du bien', 'adresse du logement', 'adresse bien', 'bien', 'logement', 'rue', 'adresse postale', 'adresse 1'],
  postalCode: ['code postal', 'cp', 'codepostal', 'code postale'],
  city: ['ville', 'commune', 'localite'],
  surface: ['surface', 'm2', 'surface m2', 'surface habitable', 'superficie', 'surface en m2'],
  rooms: ['pieces', 'nb pieces', 'nombre de pieces', 'nb de pieces', 'nombre pieces', 'piece'],
  kind: ['type', 'type de bien', 'type de location', 'type de logement', 'type de bail', 'nature', 'meuble'],
  rent: ['loyer', 'loyer hc', 'loyer hors charges', 'loyer mensuel', 'loyer nu', 'montant du loyer', 'loyer hors charge', 'loyer mensuel hc'],
  charges: ['charges', 'provisions', 'provision sur charges', 'provisions sur charges', 'charges mensuelles', 'provision charges', 'montant des charges'],
  deposit: ['depot', 'depot de garantie', 'caution', 'depot garantie', 'montant du depot de garantie', 'montant depot de garantie'],
  paymentDay: ['jour de paiement', 'echeance', 'jour echeance', 'jour d echeance', 'jour de paiement du loyer', 'date de paiement', 'jour du loyer'],
  entryDate: ['date d entree', 'debut du bail', 'date de debut', 'debut de bail', 'date entree', 'entree', 'date debut bail', 'date de debut du bail', 'date d effet', 'date d entree du locataire'],
  label: ['nom du bien', 'libelle', 'designation', 'reference', 'nom du logement', 'nom bien', 'intitule'],
  tenantFull: ['locataire', 'locataires', 'occupant', 'nom et prenom', 'nom prenom', 'nom complet', 'nom du locataire et prenom'],
  lastName: ['nom', 'nom du locataire', 'nom locataire', 'nom de famille', 'locataire nom'],
  firstNames: ['prenom', 'prenom du locataire', 'prenom locataire', 'prenoms', 'locataire prenom'],
  email: ['email', 'e mail', 'mail', 'courriel', 'adresse mail', 'adresse email', 'email du locataire', 'mail du locataire', 'adresse e mail'],
  phone: ['telephone', 'tel', 'portable', 'mobile', 'telephone du locataire', 'tel locataire', 'telephone portable', 'numero de telephone', 'tel portable', 'n de telephone'],
}

const SYNONYM_INDEX = new Map<string, Field>()
for (const [field, list] of Object.entries(SYNONYMS) as Array<[Field, string[]]>) for (const s of list) if (!SYNONYM_INDEX.has(s)) SYNONYM_INDEX.set(s, field)

/** Sans accents, en minuscules, « m² » → « m2 », ponctuation en espaces. */
export const norm = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/m²/g, 'm2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

function fieldOf(header: string): Field | null {
  const n = norm(header)
  if (!n) return null
  const exact = SYNONYM_INDEX.get(n)
  if (exact) return exact
  // Intitulés plus longs : « Loyer hors charges (€) », « Surface (m2) », « Date d'entrée dans les lieux ».
  const words = n.replace(/\b(eur|euros|en|mensuel|mensuelle)\b/g, ' ').replace(/\s+/g, ' ').trim()
  const alt = SYNONYM_INDEX.get(words)
  if (alt) return alt
  if (/^loyer/.test(n) && /(hc|hors charge|nu)/.test(n)) return 'rent'
  if (/^loyer/.test(n) && /charge/.test(n)) return null
  if (/^loyer/.test(n)) return 'rent'
  if (/^surface/.test(n)) return 'surface'
  if (/^(depot|caution)/.test(n)) return 'deposit'
  if (/^(provision|charge)/.test(n)) return 'charges'
  if (/^(adresse)/.test(n) && !/mail|email/.test(n)) return 'address'
  if (/^(date d entree|date entree|debut)/.test(n)) return 'entryDate'
  if (/^(jour de paiement|jour d echeance|echeance)/.test(n)) return 'paymentDay'
  if (/^(telephone|tel )/.test(n)) return 'phone'
  return null
}

// ── Lecture des fichiers ────────────────────────────────────────────────────

type Grid = Array<{ line: number; cells: string[] }>

function decodeText(buf: Buffer): string {
  let text = buf.toString('utf8')
  if (text.includes('�')) text = new TextDecoder('windows-1252').decode(buf)
  return text.replace(/^﻿/, '')
}

/** Découpe un texte délimité (guillemets, guillemets doublés, retours à la ligne dans un champ). */
function splitDelimited(text: string, sep: string): Grid {
  const out: Grid = []
  let cells: string[] = []
  let cur = ''
  let quoted = false
  let line = 1
  let start = 1
  const endRow = () => {
    cells.push(cur.trim())
    if (cells.some((c) => c !== '')) out.push({ line: start, cells })
    cells = []
    cur = ''
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else quoted = false
      } else {
        if (ch === '\n') line++
        cur += ch
      }
    } else if (ch === '"') quoted = true
    else if (ch === sep) {
      cells.push(cur.trim())
      cur = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      endRow()
      line++
      start = line
    } else cur += ch
  }
  endRow()
  return out
}

function parseCsv(text: string): Grid {
  let body = text
  let sep: string | null = null
  const hint = body.match(/^sep=(.)\r?\n/i)
  if (hint) {
    sep = hint[1]
    body = body.slice(hint[0].length)
  }
  if (!sep) {
    const sample = body.split(/\r?\n/).filter((l) => l.trim()).slice(0, 8)
    const count = (c: string) => sample.reduce((a, l) => a + l.replace(/"[^"]*"/g, '').split(c).length - 1, 0)
    sep = [';', '\t', ','].map((c) => ({ c, n: count(c) })).sort((a, b) => b.n - a.n)[0].c
  }
  return splitDelimited(body, sep)
}

const unescapeXml = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const textOf = (xml: string) => unescapeXml([...xml.replace(/<rPh[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''))
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]

/** Formats de date prédéfinis d'Excel (hors formats propres à une langue). */
const BUILTIN_DATE_FORMATS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58])

const colIndex = (ref: string) => {
  let n = 0
  for (const ch of ref.replace(/[^A-Z]/gi, '').toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64
  return n - 1
}

/** Numéro de série Excel (jours depuis le 30/12/1899) → AAAA-MM-JJ. */
export function excelDate(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2_958_465) return null
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000).toISOString().slice(0, 10)
}

function parseXlsx(buf: Buffer): Grid {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(new Uint8Array(buf), { filter: (f) => f.originalSize < 40 * 1024 * 1024 && /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|styles\.xml|worksheets\/[^/]+\.xml)$/.test(f.name) })
  } catch {
    throw new Error('Ce fichier Excel est illisible. Enregistrez-le de nouveau au format .xlsx ou en CSV.')
  }
  const read = (name: string) => (files[name] ? strFromU8(files[name]) : '')
  // Premier onglet, dans l'ordre du classeur.
  let sheetPath = 'xl/worksheets/sheet1.xml'
  const firstSheet = read('xl/workbook.xml').match(/<sheet\s[^>]*>/)?.[0]
  const rid = firstSheet ? attr(firstSheet, 'r:id') : undefined
  if (rid) {
    const rel = [...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\s[^>]*>/g)].map((m) => m[0]).find((t) => attr(t, 'Id') === rid)
    const target = rel ? attr(rel, 'Target') : undefined
    if (target) sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`
  }
  if (!files[sheetPath]) {
    const any = Object.keys(files).find((n) => n.startsWith('xl/worksheets/'))
    if (!any) throw new Error('Aucun onglet lisible dans ce fichier Excel.')
    sheetPath = any
  }
  const shared = [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
  // Styles : quelles cellules sont des dates ?
  const styles = read('xl/styles.xml')
  const customDates = new Set<number>()
  for (const m of styles.matchAll(/<numFmt\s[^>]*>/g)) {
    const code = (attr(m[0], 'formatCode') ?? '').replace(/"[^"]*"|\[[^\]]*\]|\\./g, '')
    if (/[dmy]/i.test(code) && !/[#0]/.test(code)) customDates.add(Number(attr(m[0], 'numFmtId')))
  }
  const cellXfs = styles.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] ?? ''
  const dateStyle = [...cellXfs.matchAll(/<xf\s[^>]*?(?:\/>|>)/g)].map((m) => {
    const id = Number(attr(m[0], 'numFmtId') ?? 0)
    return BUILTIN_DATE_FORMATS.has(id) || customDates.has(id)
  })
  const out: Grid = []
  const sheet = read(sheetPath)
  for (const rowMatch of sheet.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const line = Number(attr(rowMatch[1], 'r') ?? out.length + 1)
    const cells: string[] = []
    let next = 0
    for (const c of (rowMatch[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(c[1], 'r')
      const at = ref ? colIndex(ref) : next
      next = at + 1
      const type = attr(c[1], 't')
      const inner = c[2] ?? ''
      const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1]
      let value = ''
      if (type === 's') value = shared[Number(v)] ?? ''
      else if (type === 'inlineStr') value = textOf(inner)
      else if (type === 'str') value = unescapeXml(v ?? '')
      else if (type === 'b') value = v === '1' ? 'oui' : 'non'
      else if (v !== undefined && v !== '' && type !== 'e') {
        const n = Number(v)
        const s = Number(attr(c[1], 's') ?? -1)
        value = dateStyle[s] ? (excelDate(n) ?? v) : Number.isFinite(n) ? String(n) : v
      }
      while (cells.length < at) cells.push('')
      cells[at] = value.trim()
    }
    if (cells.some((x) => x !== '')) out.push({ line, cells })
  }
  return out
}

/** Contenu du fichier en lignes de cellules, quel que soit son format. */
export function readGrid(buf: Buffer): Grid {
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b) return parseXlsx(buf)
  if (buf.length >= 4 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) throw new Error('Ce fichier Excel est un ancien format (.xls). Enregistrez-le au format .xlsx ou en CSV, puis déposez-le de nouveau.')
  return parseCsv(decodeText(buf))
}

// ── Valeurs ─────────────────────────────────────────────────────────────────

const clean = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()

/** Montant en centimes ; null si illisible. */
function money(raw: string): number | null {
  const c = parseAmount(raw)
  return c === null || c < 0 || c > 100_000_000 ? null : c
}

const CIVILITY = /^(m|mr|mme|mlle|monsieur|madame|mademoiselle|melle|m\.|mme\.|mlle\.)$/i

/** « DUPONT Jean », « Jean Dupont », « Mme Claire Martin » → prénom et nom. */
export function splitName(full: string): { firstNames?: string; lastName?: string } {
  const tokens = clean(full)
    .split(' ')
    .filter((t) => t && !CIVILITY.test(t))
  if (!tokens.length) return {}
  if (tokens.length === 1) return { lastName: tokens[0] }
  const upper = (t: string) => t.length > 1 && t === t.toUpperCase() && t !== t.toLowerCase()
  if (tokens.some(upper) && !tokens.every(upper)) return { lastName: tokens.filter(upper).join(' '), firstNames: tokens.filter((t) => !upper(t)).join(' ') }
  return { firstNames: tokens[0], lastName: tokens.slice(1).join(' ') }
}

function kindOf(raw: string): { kind: ImportKind; parkingType?: ParkingType } | null {
  const n = norm(raw)
  if (!n) return null
  if (/\b(garage)\b/.test(n)) return { kind: 'PARKING', parkingType: 'GARAGE' }
  if (/\b(box)\b/.test(n)) return { kind: 'PARKING', parkingType: 'BOX' }
  if (/\b(parking|stationnement|place|emplacement)\b/.test(n)) return { kind: 'PARKING', parkingType: 'PLACE' }
  if (/\b(non meuble|nu|vide|vides|nue|non meublee|habitation)\b/.test(n)) return { kind: 'VIDE' }
  if (/\b(meuble|meublee|meubles|lmnp|lmp)\b/.test(n) || n === 'oui') return { kind: 'MEUBLE' }
  if (n === 'non') return { kind: 'VIDE' }
  return null
}

const PHONE = /^[+()\d .-]{6,20}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function entryDate(raw: string): string | null {
  const s = raw.trim()
  if (/^\d{5}$/.test(s) && Number(s) > 20_000) return excelDate(Number(s))
  const d = parseDate(s)
  if (!d) return null
  const [y, m, day] = d.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, day))
  return y >= 1950 && y <= 2100 && t.getUTCMonth() === m - 1 && t.getUTCDate() === day ? d : null
}

const key = (s: string | undefined) => norm(s)

// ── Lecture d'une ligne ─────────────────────────────────────────────────────

function readRow(cells: string[], at: Partial<Record<Field, number>>, line: number): ImportRow {
  const get = (f: Field) => (at[f] === undefined ? '' : clean(cells[at[f]!]))
  const issues: string[] = []
  const p: ImportProperty = { kind: 'VIDE' }

  let address = get('address')
  let postalCode = get('postalCode')
  let city = get('city')
  if (/^\d{4}$/.test(postalCode)) postalCode = `0${postalCode}`
  postalCode = postalCode.replace(/\s/g, '')
  if (address && !postalCode && !city) {
    // « 12 rue Foch, 69003 Lyon » : code postal et ville dans l'adresse.
    const m = address.match(/^(.*?)[,\s]+(\d{5})\s+([^\d].*)$/)
    if (m && m[1].trim()) {
      address = m[1].replace(/[,\s]+$/, '')
      postalCode = m[2]
      city = m[3].trim()
    }
  }
  if (address) p.address = address
  if (postalCode) {
    if (/^\d{5}$/.test(postalCode)) p.postalCode = postalCode
    else issues.push('code postal illisible')
  }
  if (city) p.city = city
  const label = get('label')
  if (label) p.label = label

  const kindRaw = get('kind')
  if (kindRaw) {
    const k = kindOf(kindRaw)
    if (k) {
      p.kind = k.kind
      if (k.parkingType) p.parkingType = k.parkingType
    } else issues.push(`type « ${kindRaw.slice(0, 30)} » non reconnu, logement vide supposé`)
  }

  const surface = get('surface')
  if (surface) {
    const n = Number(surface.replace(/m2|m²|\s/gi, '').replace(',', '.'))
    if (Number.isFinite(n) && n > 0 && n <= 2000) p.surface = Math.round(n * 100) / 100
    else issues.push('surface illisible')
  }
  const rooms = get('rooms')
  if (rooms) {
    const n = Number(rooms.replace(/^[tf]\s*/i, '').replace(',', '.'))
    if (Number.isInteger(n) && n >= 1 && n <= 30) p.rooms = n
    else issues.push('nombre de pièces illisible')
  }

  const rent = get('rent')
  if (rent) {
    const c = money(rent)
    if (c === null || c > 2_000_000) issues.push('loyer illisible')
    else p.rentCents = c
  }
  const charges = get('charges')
  if (charges) {
    const c = money(charges)
    if (c === null || c > 2_000_000) issues.push('charges illisibles')
    else p.chargesCents = c
  }
  const deposit = get('deposit')
  if (deposit) {
    const c = money(deposit)
    if (c === null || c > 4_000_000) issues.push('dépôt de garantie illisible')
    else p.depositCents = c
  }
  const day = get('paymentDay')
  if (day) {
    const n = Number(day.match(/\d{1,2}/)?.[0])
    if (Number.isInteger(n) && n >= 1 && n <= 28) p.paymentDay = n
    else issues.push('jour de paiement illisible (de 1 à 28)')
  }

  const t: ImportTenant = {}
  const full = get('tenantFull')
  if (full) Object.assign(t, splitName(full))
  const last = get('lastName')
  const first = get('firstNames')
  if (last) t.lastName = last
  if (first) t.firstNames = first
  if (last && !first) {
    // Colonne « Nom » qui contient « Prénom Nom » : seulement si elle a plusieurs mots et qu'aucun prénom n'existe.
    const s = splitName(last)
    if (s.firstNames) Object.assign(t, s)
  }
  const email = get('email')
  if (email) {
    if (EMAIL.test(email)) t.email = email.toLowerCase()
    else issues.push('email illisible')
  }
  let phone = get('phone')
  if (/^[1-9]\d{8}$/.test(phone)) phone = `0${phone}`
  if (phone) {
    if (PHONE.test(phone)) t.phone = phone
    else issues.push('téléphone illisible')
  }
  const entry = get('entryDate')
  if (entry) {
    const d = entryDate(entry)
    if (d) t.entryDate = d
    else issues.push('date d’entrée illisible')
  }
  const hasTenant = Boolean(t.lastName || t.firstNames || t.email)
  if (!hasTenant && (t.phone || t.entryDate)) issues.push('locataire sans nom ni email, ignoré')

  let blocking = false
  if (!p.address) {
    issues.unshift('adresse manquante')
    blocking = true
  }
  return { line, lines: [line], property: p, tenants: hasTenant ? [t] : [], issues, blocking }
}

// ── Lecture du fichier ──────────────────────────────────────────────────────

/** Fusionne une ligne dans le logement déjà lu : valeurs manquantes complétées, locataires ajoutés. */
function merge(into: ImportRow, row: ImportRow) {
  into.lines.push(...row.lines)
  for (const [k, v] of Object.entries(row.property)) {
    const cur = into.property as unknown as Record<string, unknown>
    if (cur[k] === undefined) cur[k] = v
  }
  for (const t of row.tenants) {
    const same = into.tenants.some((x) => (t.email && x.email === t.email) || (key(x.lastName) === key(t.lastName) && key(x.firstNames) === key(t.firstNames)))
    if (!same) into.tenants.push(t)
  }
  for (const i of row.issues) if (!into.issues.includes(i)) into.issues.push(i)
}

/**
 * Fichier lu et mis en forme. Lève une erreur en français si rien n'est reconnu ou si le fichier dépasse
 * `MAX_IMPORT_ROWS` lignes.
 */
export function parseTable(buf: Buffer): ImportPreview {
  const grid = readGrid(buf)
  // Ligne d'en-tête : la première des 15 premières qui contient au moins deux intitulés connus dont l'adresse ou le nom du bien.
  let headerAt = -1
  let at: Partial<Record<Field, number>> = {}
  let detected: ImportPreview['columns']['detected'] = []
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const found: Partial<Record<Field, number>> = {}
    const list: ImportPreview['columns']['detected'] = []
    grid[i].cells.forEach((h, idx) => {
      const f = fieldOf(h)
      if (f && found[f] === undefined) {
        found[f] = idx
        list.push({ header: clean(h), field: f, label: FIELD_LABEL[f] })
      }
    })
    if (list.length >= 2 && (found.address !== undefined || found.label !== undefined)) {
      headerAt = i
      at = found
      detected = list
      break
    }
  }
  if (headerAt < 0) throw new Error('Colonnes non reconnues. La première ligne du fichier doit nommer les colonnes, par exemple « Adresse », « Loyer », « Locataire ».')
  const used = new Set(Object.values(at))
  const ignored = grid[headerAt].cells.map((h, i) => ({ h: clean(h), i })).filter((x) => x.h && !used.has(x.i)).map((x) => x.h)
  const body = grid.slice(headerAt + 1)
  if (!body.length) throw new Error('Le fichier ne contient aucune ligne sous les intitulés de colonnes.')
  if (body.length > MAX_IMPORT_ROWS) throw new Error(`Ce fichier contient ${body.length} lignes. Importez ${MAX_IMPORT_ROWS} lignes au plus à la fois : coupez le fichier en plusieurs parties.`)

  const rows: ImportRow[] = []
  const byKey = new Map<string, ImportRow>()
  for (const { line, cells } of body) {
    const row = readRow(cells, at, line)
    const k = row.property.address ? [key(row.property.address), key(row.property.postalCode), key(row.property.label)].join('|') : ''
    const first = k ? byKey.get(k) : undefined
    if (first) merge(first, row)
    else {
      rows.push(row)
      if (k) byKey.set(k, row)
    }
  }
  return { rows, columns: { detected, ignored } }
}
