/**
 * IdentityMatcher.ts — v2.0
 * Vérification d'identité sur pièces d'identité (CNI, Passeport, Titre de séjour).
 *
 * Deux mécanismes complémentaires :
 *
 * 1. PARSING MRZ via `mrz` (cheminfo/mrz — github.com/cheminfo/mrz)
 *    Supporte TD1 (CNI 30×3), TD3 (Passeport 44×2), FRENCH_NATIONAL_ID.
 *    Extrait automatiquement : lastName, firstName, birthDate, nationality,
 *    documentNumber, expirationDate, sex.
 *
 * 2. MATCHING LEVENSHTEIN
 *    Compare le nom extrait (OCR ou MRZ) avec user.firstName / user.lastName.
 *    Utilise levenshtein-edit-distance (npm).
 *    Autorise jusqu'à ceil(len * 0.25) erreurs (25% du mot) pour les fautes d'OCR.
 *
 * Résultat :
 *   matchLevel = 'certain'   → MRZ trouvée + nom ≥ seuil
 *   matchLevel = 'probable'  → Texte seul, nom trouvé dans texte
 *   matchLevel = 'uncertain' → Score bas (0.50–0.74)
 *   matchLevel = 'mismatch'  → Nom totalement absent (score < 0.50)
 *   matchLevel = 'no_name'   → Impossible à vérifier (user sans nom)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MrzData {
  type: 'TD1' | 'TD3' | 'TD2' | 'FRENCH_NATIONAL_ID' | string
  surname: string
  givenNames: string[]
  raw: string
  // enriched MRZ fields
  birthDate?: string     // formatted "DD/MM/YY"
  nationality?: string   // "FRA", "BEL", etc.
  cardNumber?: string    // numéro de document (CNI / passeport)
  expiryDate?: string    // formatted "DD/MM/YY"
  sex?: 'M' | 'F' | '<' // sexe
}

export interface IdentityMatchResult {
  matchLevel: 'certain' | 'probable' | 'uncertain' | 'mismatch' | 'no_name'
  score: number                   // 0–1
  mrzFound: boolean
  mrzData: MrzData | null
  extractedName: string | null    // best name candidate from text
  firstName: string               // user first name used
  lastName: string                // user last name used
  detail: string                  // human-readable explanation
  // enriched identity fields from MRZ
  birthDate?: string              // date de naissance extraite de la MRZ
  nationality?: string            // nationalité (code 3 lettres)
  documentNumber?: string         // numéro CNI / passeport
  documentExpiry?: string         // date de validité
  sex?: 'M' | 'F' | '<'          // sexe
}

// ─── Levenshtein — via npm levenshtein-edit-distance ────────────────────────

import { levenshteinEditDistance } from 'levenshtein-edit-distance'

export function levenshtein(a: string, b: string): number {
  return levenshteinEditDistance(a, b)
}

export function similarity(a: string, b: string): number {
  if (a === b) return 1
  const dist = levenshteinEditDistance(a, b)
  const maxLen = Math.max(a.length, b.length)
  return maxLen === 0 ? 1 : 1 - dist / maxLen
}

// ─── MRZ Parsing via `mrz` package (cheminfo/mrz) ────────────────────────────

import { parse as mrzParse } from 'mrz'

/** Converts MRZ date "YYMMDD" → "DD/MM/YY" for display */
function mrzDateToDisplay(yymmdd: string | null | undefined): string | undefined {
  if (!yymmdd || !/^\d{6}$/.test(yymmdd)) return undefined
  const yy = yymmdd.slice(0, 2)
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  return `${dd}/${mm}/${yy}`
}

/**
 * Extracts MRZ lines from raw OCR text.
 *
 * Strategy (inspired by github.com/cheminfo/mrz and id-scanner-js):
 * 1. Per-line pass: strip intra-line spaces, test for MRZ length (28-46)
 * 2. Joined-text pass: concatenate all text (remove whitespace) and find
 *    30- or 44-char MRZ blocks starting with 'ID' or 'P<' — handles OCR
 *    that wraps MRZ across multiple short lines
 * 3. Fallback greedy pass: collect any block ≥ 25 chars of [A-Z0-9<]
 *    that contains at least 3 consecutive '<' (MRZ filler fingerprint)
 */
function extractMrzLines(text: string): string[] {
  const mrzLines: string[] = []
  const seen = new Set<string>()
  const add = (s: string) => { if (!seen.has(s)) { seen.add(s); mrzLines.push(s) } }

  // ── Pass 1 : per-line, strip intra-line spaces ────────────────────────────
  for (const line of text.split(/\r?\n/)) {
    const cleaned = line.replace(/\s+/g, '').toUpperCase()
    if (/^[A-Z0-9<]{28,46}$/.test(cleaned)) add(cleaned)
  }

  // ── Pass 2 : joined text — find TD1 (30) and TD3 (44) blocks ─────────────
  const joined = text.replace(/\s/g, '').toUpperCase()

  // TD1 (French CNI verso): starts with IDFRA or IDFRX
  for (const m of joined.matchAll(/ID[A-Z0-9]{1,3}[A-Z0-9<]{25,27}/g)) {
    const block = m[0].slice(0, 30)
    if (/^[A-Z0-9<]{30}$/.test(block)) add(block)
  }
  // TD3 (Passeport): starts with P<FRA or P<
  for (const m of joined.matchAll(/P<[A-Z]{3}[A-Z0-9<]{40,41}/g)) {
    const block = m[0].slice(0, 44)
    if (/^[A-Z0-9<]{44}$/.test(block)) add(block)
  }
  // Generic 30-char blocks containing '<<<' (MRZ filler fingerprint)
  for (const m of joined.matchAll(/[A-Z0-9<]{30}/g)) {
    if (m[0].includes('<<<')) add(m[0])
  }

  // ── Pass 3 : greedy fallback — any segment ≥ 25 chars with <<< pattern ────
  if (mrzLines.length === 0) {
    for (const m of joined.matchAll(/[A-Z0-9<]{25,}/g)) {
      if (m[0].includes('<<<')) {
        // Slice into 30-char windows
        for (let i = 0; i + 30 <= m[0].length; i += 30) {
          add(m[0].slice(i, i + 30))
        }
      }
    }
  }

  return mrzLines
}

/**
 * Tries to detect and parse MRZ from OCR text using the `mrz` npm library.
 * Falls back to custom ICAO regex parsing if the library fails.
 */
export function parseMrz(text: string): MrzData | null {
  const mrzLines = extractMrzLines(text)

  if (mrzLines.length === 0) {
    // Try fallback hint detection
    const hint = text.match(/(?:IDFRA|IDFRX|P<FRA)[A-Z0-9<]{10,}/)
    if (hint) {
      return {
        type: hint[0].startsWith('P') ? 'TD3' : 'FRENCH_NATIONAL_ID',
        surname: '',
        givenNames: [],
        raw: hint[0],
      }
    }
    return null
  }

  // Try all combinations of consecutive lines (3 for TD1/FRENCH_NATIONAL_ID, 2 for TD3/TD2)
  for (let windowSize = 3; windowSize >= 2; windowSize--) {
    for (let start = 0; start <= mrzLines.length - windowSize; start++) {
      const window = mrzLines.slice(start, start + windowSize)
      try {
        const result = mrzParse(window)
        if (result.fields.lastName || result.fields.firstName) {
          const surname    = result.fields.lastName ?? ''
          const givenRaw   = result.fields.firstName ?? ''
          const givenNames = givenRaw.split(' ').filter(Boolean)

          // Format birth date: "YYMMDD" → "DD/MM/YY"
          const birthDateRaw = result.fields.birthDate
          const expiryRaw    = result.fields.expirationDate

          return {
            type:       result.format,
            surname,
            givenNames,
            raw:        window.join('\n'),
            birthDate:  mrzDateToDisplay(birthDateRaw),
            nationality: result.fields.nationality ?? undefined,
            cardNumber:  result.fields.documentNumber ?? undefined,
            expiryDate:  mrzDateToDisplay(expiryRaw),
            sex:         (result.fields.sex as 'M' | 'F' | '<') ?? undefined,
          }
        }
      } catch {
        // mrzParse throws if format unrecognised — try next window
      }
    }
  }

  // ── Custom fallback for TD1 / TD3 (ICAO 9303) ──────────────────────────
  return parseMrzCustom(mrzLines)
}

// ─── Custom MRZ parser (fallback) ────────────────────────────────────────────

const MRZ_FILLER = '<'

function parseMrzNameField(field: string): { surname: string; givenNames: string[] } {
  const clean    = field.replace(/[^A-Z<]/g, '').toUpperCase()
  const doubleIdx = clean.indexOf('<<')
  if (doubleIdx === -1) {
    return { surname: clean.replace(/</g, ' ').trim(), givenNames: [] }
  }
  const surnameRaw = clean.slice(0, doubleIdx)
  const givenRaw   = clean.slice(doubleIdx + 2)
  const surname    = surnameRaw.replace(/</g, '-').trim()
  const givenNames = givenRaw.split('<').map((n) => n.trim()).filter((n) => n.length > 0)
  return { surname, givenNames }
}

function parseMrzCustom(lines: string[]): MrzData | null {
  // TD3: 2 lines of 44 chars
  const td3 = lines.filter((l) => /^[A-Z0-9<]{44}$/.test(l))
  if (td3.length >= 2) {
    const line1 = td3[0]
    const line2 = td3[1]
    if (line1[0] === 'P' && line1[1] === MRZ_FILLER) {
      const { surname, givenNames } = parseMrzNameField(line1.slice(5))
      return {
        type:        'TD3', surname, givenNames, raw: line1 + '\n' + line2,
        cardNumber:  line2.slice(0, 9).replace(/<+$/, ''),
        nationality: line2.slice(10, 13).replace(/<+$/, ''),
        birthDate:   mrzDateToDisplay(line2.slice(13, 19)),
        sex:         line2[20] as 'M' | 'F' | '<',
        expiryDate:  mrzDateToDisplay(line2.slice(21, 27)),
      }
    }
  }

  // TD1: 3 lines of 30 chars
  const td1 = lines.filter((l) => /^[A-Z0-9<]{30}$/.test(l))
  if (td1.length >= 3) {
    const line1 = td1[0]
    const line2 = td1[1]
    const line3 = td1[2]
    if (line1.startsWith('ID')) {
      const { surname, givenNames } = parseMrzNameField(line3)
      return {
        type:        'TD1', surname, givenNames, raw: [line1, line2, line3].join('\n'),
        cardNumber:  line1.slice(5, 14).replace(/<+$/, ''),
        birthDate:   mrzDateToDisplay(line2.slice(0, 6)),
        sex:         line2[7] as 'M' | 'F' | '<',
        expiryDate:  mrzDateToDisplay(line2.slice(8, 14)),
        nationality: line2.slice(15, 18).replace(/<+$/, ''),
      }
    }
  }

  return null
}

// ─── Name normalization & fuzzy search ───────────────────────────────────────

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove accents
    .replace(/[^a-z0-9 ]/gi, ' ')      // keep only alphanum + space
    .toLowerCase()
    .trim()
}

function fuzzyFindInText(text: string, candidate: string): number {
  if (!candidate || candidate.length < 2) return 0
  const norm          = normalize(text)
  const normCandidate = normalize(candidate)

  if (norm.includes(normCandidate)) return 1

  const words = norm.split(/\s+/)
  let best = 0
  for (const word of words) {
    if (Math.abs(word.length - normCandidate.length) > normCandidate.length * 0.5) continue
    const s = similarity(word, normCandidate)
    if (s > best) best = s
  }
  // bigrams for compound names
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + words[i + 1]
    const s = similarity(bigram, normCandidate.replace(/\s/g, ''))
    if (s > best) best = s
  }
  return best
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function matchIdentity(
  rawText: string,
  userFirst: string,
  userLast: string,
): IdentityMatchResult {
  if (!userFirst && !userLast) {
    return {
      matchLevel: 'no_name', score: 0, mrzFound: false, mrzData: null,
      extractedName: null, firstName: userFirst, lastName: userLast,
      detail: 'Aucun nom dans le profil — vérification d\'identité impossible.',
    }
  }

  const mrz      = parseMrz(rawText)
  const mrzFound = mrz !== null

  let bestScore    = 0
  let extractedName: string | null = null

  if (mrz && (mrz.surname || mrz.givenNames.length > 0)) {
    const mrzFullName = [mrz.surname, ...mrz.givenNames].join(' ')
    extractedName     = mrzFullName

    const lastScore  = mrz.surname        ? similarity(normalize(mrz.surname),        normalize(userLast))  : 0
    const firstScore = mrz.givenNames[0]  ? similarity(normalize(mrz.givenNames[0]),  normalize(userFirst)) : 0
    bestScore = lastScore * 0.6 + firstScore * 0.4
  } else {
    const lastScore  = fuzzyFindInText(rawText, userLast)
    const firstScore = fuzzyFindInText(rawText, userFirst)
    bestScore = lastScore * 0.6 + firstScore * 0.4
    if (lastScore > 0.5 || firstScore > 0.5) {
      extractedName = `${userFirst} ${userLast}`
    }
  }

  let matchLevel: IdentityMatchResult['matchLevel']
  let detail: string

  if (bestScore >= 0.85 && mrzFound) {
    matchLevel = 'certain'
    detail     = `Zone MRZ détectée. Correspondance : ${(bestScore * 100).toFixed(0)} % — ${extractedName ?? 'nom lu'}.`
  } else if (bestScore >= 0.75) {
    matchLevel = 'probable'
    detail     = `Nom détecté dans le texte : correspondance ${(bestScore * 100).toFixed(0)} %.`
  } else if (bestScore >= 0.50) {
    matchLevel = 'uncertain'
    detail     = `Correspondance partielle (${(bestScore * 100).toFixed(0)} %). Vérifiez que la pièce vous appartient.`
  } else {
    matchLevel = 'mismatch'
    detail     = `Le nom trouvé ne correspond pas à votre profil (score ${(bestScore * 100).toFixed(0)} %). Document suspect ou mauvaise pièce.`
  }

  return {
    matchLevel, score: bestScore, mrzFound, mrzData: mrz,
    extractedName, firstName: userFirst, lastName: userLast, detail,
    birthDate:      mrz?.birthDate,
    nationality:    mrz?.nationality,
    documentNumber: mrz?.cardNumber,
    documentExpiry: mrz?.expiryDate,
    sex:            mrz?.sex,
  }
}

// ─── Level helpers ────────────────────────────────────────────────────────────

export function matchLevelColor(level: IdentityMatchResult['matchLevel']): string {
  switch (level) {
    case 'certain':   return 'text-emerald-600'
    case 'probable':  return 'text-blue-600'
    case 'uncertain': return 'text-amber-600'
    case 'mismatch':  return 'text-red-600'
    case 'no_name':   return 'text-slate-400'
  }
}

export function matchLevelIcon(level: IdentityMatchResult['matchLevel']): string {
  switch (level) {
    case 'certain':   return '✓ MRZ'
    case 'probable':  return '~ Probable'
    case 'uncertain': return '? Incertain'
    case 'mismatch':  return '✗ Inadéquat'
    case 'no_name':   return '– N/A'
  }
}
