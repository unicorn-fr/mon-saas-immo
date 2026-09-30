import type { LeaseType } from './types'

// Règles de la loi n° 89-462 du 6 juillet 1989 (le serveur les applique aussi).
export const durationMonths = (t: LeaseType) => (t === 'UNFURNISHED' ? 36 : 12)
export const durationLabel = (t: LeaseType) => (t === 'UNFURNISHED' ? '3 ans' : '1 an')
export const maxDepositCents = (t: LeaseType, rentCents: number) => (t === 'UNFURNISHED' ? rentCents : rentCents * 2)
export const maxDepositLabel = (t: LeaseType) => (t === 'UNFURNISHED' ? '1 mois de loyer hors charges' : '2 mois de loyer hors charges')

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function isoOf(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(date.getUTCDate(), last))
  return d
}

export function endDate(startIso: string, t: LeaseType): Date {
  const end = addMonths(parseIso(startIso), durationMonths(t))
  return new Date(end.getTime() - 86_400_000)
}

export function dateFr(input: string | Date, withYear = true): string {
  const d = typeof input === 'string' ? parseIso(input) : input
  const day = d.getUTCDate()
  return `${day === 1 ? '1er' : day} ${MONTHS[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ''}`
}

export function euros(cents: number | undefined | null): string {
  if (cents === undefined || cents === null) return ''
  const hasCents = cents % 100 !== 0
  const [int, dec] = (cents / 100).toFixed(hasCents ? 2 : 0).split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${dec ? `,${dec}` : ''} €`
}

/** « 935 », « 935,50 », « 1 200 € » → centimes. */
export function parseEuros(input: string): number | undefined {
  const clean = input.replace(/[€\s  ]/g, '').replace(',', '.')
  if (!clean) return undefined
  const n = Number(clean)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined
}

export function centsToInput(cents: number | undefined): string {
  if (cents === undefined) return ''
  return (cents / 100).toString().replace('.', ',')
}

export const typeLabel = (t: LeaseType) => (t === 'UNFURNISHED' ? 'Location vide' : 'Location meublée')
