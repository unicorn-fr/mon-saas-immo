import { parseIso } from './lease'

export { euros, parseEuros, centsToInput, dateFr, parseIso, isoOf } from './lease'

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const toDate = (d: string | Date) => (typeof d === 'string' ? parseIso(d.slice(0, 10)) : d)

/** Montant avec centimes : « 780,00 € ». */
export function eurosCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  const [int, dec] = (Math.abs(cents) / 100).toFixed(2).split('.')
  return `${cents < 0 ? '-' : ''}${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec} €`
}

/** « 24 sept. », avec l'année si elle n'est pas l'année en cours. */
export function dateShort(d: string | Date | null | undefined): string {
  if (!d) return ''
  const x = toDate(d)
  const year = x.getUTCFullYear() !== new Date().getFullYear() ? ` ${x.getUTCFullYear()}` : ''
  return `${x.getUTCDate() === 1 ? '1er' : x.getUTCDate()} ${MONTHS_SHORT[x.getUTCMonth()]}${year}`
}

/** « 24/09/2026 ». */
export function dateNum(d: string | Date | null | undefined): string {
  if (!d) return ''
  const x = toDate(d)
  return `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`
}

/** « Lundi 28 septembre ». */
export function dayTitle(d = new Date()): string {
  return `${DAYS[d.getDay()]} ${d.getDate() === 1 ? '1er' : d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** « 2026-09 » → « septembre 2026 » (ou « Septembre 2026 » avec capital). */
export function periodLabel(period: string, capital = false): string {
  const [y, m] = period.split('-').map(Number)
  const s = `${MONTHS[m - 1]} ${y}`
  return capital ? s[0].toUpperCase() + s.slice(1) : s
}

export function monthName(m: number, capital = false): string {
  const s = MONTHS[m - 1] ?? ''
  return capital ? s[0].toUpperCase() + s.slice(1) : s
}

export const MONTHS_SHORT_CAP = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

export function currentPeriod(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Mois précédents, du plus récent au plus ancien (pour choisir la période d'une quittance). */
export function recentPeriods(count = 12): string[] {
  const d = new Date()
  return Array.from({ length: count }, (_, i) => currentPeriod(new Date(d.getFullYear(), d.getMonth() - i, 1)))
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n > 1 ? many : one}`
}
