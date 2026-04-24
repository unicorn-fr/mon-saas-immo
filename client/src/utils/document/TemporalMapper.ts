/**
 * TemporalMapper.ts — v1.0
 * Extraction de la période d'un bulletin de salaire et calcul du décalage M-x
 * par rapport à la date système.
 *
 * Formule : M_offset = (Année_now - Année_doc) * 12 + (Mois_now - Mois_doc)
 *   M_offset = 1 → BULLETIN_1 (mois dernier)
 *   M_offset = 2 → BULLETIN_2 (il y a 2 mois)
 *   M_offset = 3 → BULLETIN_3 (il y a 3 mois)
 *
 * Patterns reconnus (français) :
 *   "Janvier 2025", "janvier 2025", "JANVIER 2025"
 *   "01/2025", "01-2025"
 *   "Période : 01/2025"
 *   "Mois de Janvier 2025"
 *   "Mars 25" (2-digit year)
 *   "01/01/2025" → extracts month+year
 */

export interface BulletinPeriod {
  /** 1–12 */
  month: number
  /** 4-digit */
  year: number
  /** Offset vs today: 1 = M-1, 2 = M-2, 3 = M-3, 0 = current month, >3 = old */
  mOffset: number
  /** Resolved dossier slot */
  slot: 'BULLETIN_1' | 'BULLETIN_2' | 'BULLETIN_3' | 'DERNIER_BULLETIN' | null
  /** Human label: "Janvier 2025 (M-1)" */
  label: string
  /** Raw string that matched */
  raw: string
}

// ─── Month name → number ─────────────────────────────────────────────────────

const MONTHS_FR: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5,
  juin: 6, juillet: 7, août: 8, aout: 8, septembre: 9,
  octobre: 10, novembre: 11, décembre: 12, decembre: 12,
}

const MONTHS_EN: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
}

const MONTH_NAMES_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function normalizeAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// ─── Extraction ──────────────────────────────────────────────────────────────

interface RawPeriod { month: number; year: number; raw: string }

function extractPeriodFromText(text: string): RawPeriod | null {
  const lower = text.toLowerCase()
  const lowerNorm = normalizeAccents(lower)

  // 1. Named month + 4-digit year: "Janvier 2025", "Mois de Mars 2025"
  for (const [name, num] of Object.entries(MONTHS_FR)) {
    const re = new RegExp(`\\b${normalizeAccents(name)}\\b\\s*(\\d{4})`)
    const m = lowerNorm.match(re)
    if (m) {
      const year = parseInt(m[1])
      if (year >= 2015 && year <= 2040) return { month: num, year, raw: m[0] }
    }
  }
  for (const [name, num] of Object.entries(MONTHS_EN)) {
    const re = new RegExp(`\\b${name}\\b\\s*(\\d{4})`)
    const m = lower.match(re)
    if (m) {
      const year = parseInt(m[1])
      if (year >= 2015 && year <= 2040) return { month: num, year, raw: m[0] }
    }
  }

  // 2. "Période : MM/YYYY" or "MM-YYYY" or "MM/YYYY"
  const periodRe = /p[eé]riode\s*[:\-–]?\s*(\d{1,2})[\/\-](\d{4})/i
  const pm = text.match(periodRe)
  if (pm) {
    const month = parseInt(pm[1])
    const year  = parseInt(pm[2])
    if (month >= 1 && month <= 12 && year >= 2015 && year <= 2040)
      return { month, year, raw: pm[0] }
  }

  // 3. Standalone "MM/YYYY" or "MM-YYYY" (not inside a full date DD/MM/YYYY)
  const mmyyyyRe = /(?<![\/\d])(\d{2})[\/\-](\d{4})(?![\/\d])/g
  let match: RegExpExecArray | null
  while ((match = mmyyyyRe.exec(text)) !== null) {
    const month = parseInt(match[1])
    const year  = parseInt(match[2])
    if (month >= 1 && month <= 12 && year >= 2015 && year <= 2040)
      return { month, year, raw: match[0] }
  }

  // 4. Named month + 2-digit year: "Mars 25"
  for (const [name, num] of Object.entries(MONTHS_FR)) {
    const re = new RegExp(`\\b${normalizeAccents(name)}\\b\\s*(\\d{2})\\b`)
    const m = lowerNorm.match(re)
    if (m) {
      const shortYear = parseInt(m[1])
      const year = shortYear >= 0 && shortYear <= 50 ? 2000 + shortYear : 1900 + shortYear
      if (year >= 2015 && year <= 2040) return { month: num, year, raw: m[0] }
    }
  }

  // 5. DD/MM/YYYY date → extract month/year
  const ddmmyyyyRe = /\b(\d{2})\/(\d{2})\/(\d{4})\b/g
  const dates: { month: number; year: number; raw: string }[] = []
  while ((match = ddmmyyyyRe.exec(text)) !== null) {
    const month = parseInt(match[2])
    const year  = parseInt(match[3])
    if (month >= 1 && month <= 12 && year >= 2015 && year <= 2040)
      dates.push({ month, year, raw: match[0] })
  }
  if (dates.length > 0) {
    // Pick the most recent date (likeliest to be the bulletin period)
    dates.sort((a, b) => b.year - a.year || b.month - a.month)
    return dates[0]
  }

  return null
}

// ─── M-offset calculation ─────────────────────────────────────────────────────

function calcMOffset(month: number, year: number, now: Date = new Date()): number {
  const nowYear  = now.getFullYear()
  const nowMonth = now.getMonth() + 1 // 1-based
  return (nowYear - year) * 12 + (nowMonth - month)
}

function offsetToSlot(
  offset: number,
  alreadyAssigned: Set<string>,
): BulletinPeriod['slot'] {
  // Slot mapping: M-1 → BULLETIN_1, M-2 → BULLETIN_2, M-3 → BULLETIN_3
  const preferred: Record<number, BulletinPeriod['slot']> = {
    1: 'BULLETIN_1',
    2: 'BULLETIN_2',
    3: 'BULLETIN_3',
  }
  const pref = preferred[offset]
  if (pref && !alreadyAssigned.has(pref)) return pref

  // Fallback: fill first free slot
  for (const slot of ['BULLETIN_1', 'BULLETIN_2', 'BULLETIN_3'] as const) {
    if (!alreadyAssigned.has(slot)) return slot
  }
  return 'BULLETIN_1'
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Extracts the bulletin period from raw text and returns M-offset + dossier slot.
 *
 * @param text        Raw text extracted from the document
 * @param alreadyAssigned  Slots already taken in the current dossier session
 * @param now         Override current date (for testing)
 */
export function mapBulletinPeriod(
  text: string,
  alreadyAssigned: Set<string> = new Set(),
  now: Date = new Date(),
): BulletinPeriod | null {
  const raw = extractPeriodFromText(text)
  if (!raw) return null

  const mOffset = calcMOffset(raw.month, raw.year, now)
  const slot = offsetToSlot(mOffset, alreadyAssigned)

  const monthName = MONTH_NAMES_FR[raw.month] ?? `Mois ${raw.month}`
  const offsetLabel =
    mOffset === 0 ? '(mois courant)' :
    mOffset === 1 ? '(M-1)' :
    mOffset === 2 ? '(M-2)' :
    mOffset === 3 ? '(M-3)' :
    mOffset > 3   ? `(M-${mOffset}, ancien)` :
    mOffset < 0   ? '(mois futur ?)' : ''

  return {
    month:   raw.month,
    year:    raw.year,
    mOffset,
    slot,
    label:   `${monthName} ${raw.year} ${offsetLabel}`.trim(),
    raw:     raw.raw,
  }
}

/**
 * Returns the dossier slot for a bulletin based purely on M-offset,
 * ignoring already-assigned slots (useful for independent testing).
 */
export function mOffsetToSlotLabel(mOffset: number): string {
  if (mOffset === 1) return 'Bulletin M-1'
  if (mOffset === 2) return 'Bulletin M-2'
  if (mOffset === 3) return 'Bulletin M-3'
  if (mOffset === 0) return 'Bulletin mois courant'
  if (mOffset > 3)   return `Bulletin ancien (M-${mOffset})`
  return 'Bulletin (mois futur ?)'
}
