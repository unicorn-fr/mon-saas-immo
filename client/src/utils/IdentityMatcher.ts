/**
 * IdentityMatcher.ts — v1.0
 * Vérification d'identité sur pièces d'identité (CNI, Passeport, Titre de séjour).
 *
 * Deux mécanismes complémentaires :
 *
 * 1. PARSING MRZ (Machine Readable Zone)
 *    Détecte et parse la zone de lecture optique ICAO 9303 :
 *    - CNI française   : ligne "IDFRA..." ou "IDFRX..." (TD1 — 30 chars × 3 lignes)
 *    - Passeport       : ligne "P<FRA..." (TD3 — 44 chars × 2 lignes)
 *    Extrait le Nom de famille et Prénom(s) depuis le champ MRZ.
 *
 * 2. MATCHING LEVENSHTEIN
 *    Compare le nom extrait (OCR ou MRZ) avec user.firstName / user.lastName.
 *    Autorise jusqu'à ceil(len * 0.25) erreurs (25% du mot) pour les fautes d'OCR.
 *    Bloque si aucune similarité.
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
  type: 'TD1' | 'TD3' | 'TD2'
  surname: string
  givenNames: string[]
  raw: string
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
}

// ─── Levenshtein distance (pure JS) ─────────────────────────────────────────

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  // dp[i][j] = edit distance between a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  return dp[m][n]
}

/**
 * Returns a similarity score 0–1 between two strings.
 * 1 = identical, 0 = completely different.
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1
  const dist = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  return maxLen === 0 ? 1 : 1 - dist / maxLen
}

// ─── MRZ Parsing ─────────────────────────────────────────────────────────────

const MRZ_FILLER = '<'

/**
 * MRZ name field: "MARTIN<<PAUL<JEAN<<<<<<<<"
 * Surname = everything before "<<"
 * Given names = split by "<" after first "<<"
 */
function parseMrzNameField(field: string): { surname: string; givenNames: string[] } {
  const clean = field.replace(/[^A-Z<]/g, '').toUpperCase()
  const doubleIdx = clean.indexOf('<<')
  if (doubleIdx === -1) {
    return { surname: clean.replace(/</g, ' ').trim(), givenNames: [] }
  }
  const surnameRaw = clean.slice(0, doubleIdx)
  const givenRaw   = clean.slice(doubleIdx + 2)
  const surname    = surnameRaw.replace(/</g, '-').trim()
  const givenNames = givenRaw
    .split('<')
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
  return { surname, givenNames }
}

/**
 * Tries to detect and parse MRZ lines from OCR text.
 * Looks for sequences of uppercase letters and '<' characters
 * of the expected TD1 (30) or TD3 (44) lengths.
 */
export function parseMrz(text: string): MrzData | null {
  // Normalize: keep only lines containing MRZ-like content
  const lines = text.split(/\n|\r/).map((l) => l.replace(/\s/g, '').toUpperCase())

  // TD3: Passeport — 2 lines of 44 chars
  const td3Candidate = lines.filter((l) => /^[A-Z0-9<]{44}$/.test(l))
  if (td3Candidate.length >= 2) {
    const line1 = td3Candidate[0]
    const line2 = td3Candidate[1]
    // Line 1: P<FRA<NAME_FIELD>
    if (line1[0] === 'P' && line1[1] === MRZ_FILLER) {
      const nameField = line1.slice(5) // skip "P<FRA"
      const { surname, givenNames } = parseMrzNameField(nameField)
      return { type: 'TD3', surname, givenNames, raw: line1 + '\n' + line2 }
    }
  }

  // TD1: CNI — 3 lines of 30 chars
  const td1Candidate = lines.filter((l) => /^[A-Z0-9<]{30}$/.test(l))
  if (td1Candidate.length >= 3) {
    const line1 = td1Candidate[0]
    const line2 = td1Candidate[1]
    const line3 = td1Candidate[2]
    // Line 1: IDFRA or IDFRX prefix
    if (line1.startsWith('ID')) {
      // Line 2 of TD1 contains date of birth and other fields
      // Line 3: SURNAME<<GIVEN_NAMES
      const { surname, givenNames } = parseMrzNameField(line3)
      return { type: 'TD1', surname, givenNames, raw: [line1, line2, line3].join('\n') }
    }
  }

  // Fallback: partial MRZ — look for "IDFRA" or "P<FRA" anywhere
  const mrzHint = text.match(/(?:IDFRA|IDFRX|IDFRX|P<FRA)[A-Z0-9<]{10,}/)
  if (mrzHint) {
    return {
      type: mrzHint[0].startsWith('P') ? 'TD3' : 'TD1',
      surname: '',
      givenNames: [],
      raw: mrzHint[0],
    }
  }

  return null
}

// ─── Name matching ───────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove accents
    .replace(/[^a-z0-9 ]/gi, ' ')      // keep only alphanum + space
    .toLowerCase()
    .trim()
}

/**
 * Checks if `candidate` appears in `text` with at most 25% edit distance.
 * Returns the best similarity score found.
 */
function fuzzyFindInText(text: string, candidate: string): number {
  if (!candidate || candidate.length < 2) return 0
  const norm = normalize(text)
  const normCandidate = normalize(candidate)

  // Exact substring
  if (norm.includes(normCandidate)) return 1

  // Sliding window: check windows of same length as candidate
  const words = norm.split(/\s+/)
  let best = 0
  for (const word of words) {
    if (Math.abs(word.length - normCandidate.length) > normCandidate.length * 0.5) continue
    const s = similarity(word, normCandidate)
    if (s > best) best = s
  }
  // Also try bigrams (two consecutive words merged) for compound names
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + words[i + 1]
    const s = similarity(bigram, normCandidate.replace(/\s/g, ''))
    if (s > best) best = s
  }
  return best
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Matches the identity in a scanned document against the user's profile.
 *
 * @param rawText     Text extracted from the document (OCR or PDF)
 * @param userFirst   User's first name (from auth profile)
 * @param userLast    User's last name (from auth profile)
 */
export function matchIdentity(
  rawText: string,
  userFirst: string,
  userLast: string,
): IdentityMatchResult {
  if (!userFirst && !userLast) {
    return {
      matchLevel: 'no_name',
      score: 0,
      mrzFound: false,
      mrzData: null,
      extractedName: null,
      firstName: userFirst,
      lastName: userLast,
      detail: 'Aucun nom dans le profil — vérification d\'identité impossible.',
    }
  }

  const mrz = parseMrz(rawText)
  const mrzFound = mrz !== null

  let bestScore = 0
  let extractedName: string | null = null

  if (mrz && (mrz.surname || mrz.givenNames.length > 0)) {
    // Priority: match against MRZ name data
    const mrzFullName = [mrz.surname, ...mrz.givenNames].join(' ')
    extractedName = mrzFullName

    const lastScore  = mrz.surname ? similarity(normalize(mrz.surname),  normalize(userLast))  : 0
    const firstScore = mrz.givenNames[0] ? similarity(normalize(mrz.givenNames[0]), normalize(userFirst)) : 0
    // Weighted: last name more important
    bestScore = lastScore * 0.6 + firstScore * 0.4
  } else {
    // Fallback: search raw text
    const lastScore  = fuzzyFindInText(rawText, userLast)
    const firstScore = fuzzyFindInText(rawText, userFirst)
    bestScore = lastScore * 0.6 + firstScore * 0.4
    if (lastScore > 0.5 || firstScore > 0.5) {
      extractedName = `${userFirst} ${userLast}` // approximate
    }
  }

  let matchLevel: IdentityMatchResult['matchLevel']
  let detail: string

  if (bestScore >= 0.85 && mrzFound) {
    matchLevel = 'certain'
    detail = `Zone MRZ détectée. Correspondance : ${(bestScore * 100).toFixed(0)} % — ${extractedName ?? 'nom lu'}.`
  } else if (bestScore >= 0.75) {
    matchLevel = 'probable'
    detail = `Nom détecté dans le texte : correspondance ${(bestScore * 100).toFixed(0)} %.`
  } else if (bestScore >= 0.50) {
    matchLevel = 'uncertain'
    detail = `Correspondance partielle (${(bestScore * 100).toFixed(0)} %). Vérifiez que la pièce vous appartient.`
  } else {
    matchLevel = 'mismatch'
    detail = `Le nom trouvé sur le document ne correspond pas à votre profil (score ${(bestScore * 100).toFixed(0)} %). Document suspect ou mauvaise pièce.`
  }

  return {
    matchLevel,
    score: bestScore,
    mrzFound,
    mrzData: mrz,
    extractedName,
    firstName: userFirst,
    lastName:  userLast,
    detail,
  }
}

// ─── Level helpers ───────────────────────────────────────────────────────────

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
