/**
 * Montants en toutes lettres (orthographe traditionnelle), pour les quittances, le bail et l'acte de caution :
 * 780 → « sept cent quatre-vingts », 1 250,50 → « mille deux cent cinquante euros et cinquante centimes ».
 */

const UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize']
const TENS = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante']

function below100(n: number): string {
  if (n <= 16) return UNITS[n]
  if (n < 20) return `dix-${UNITS[n - 10]}`
  if (n < 70) {
    const t = Math.floor(n / 10)
    const u = n % 10
    if (u === 0) return TENS[t]
    if (u === 1) return `${TENS[t]} et un`
    return `${TENS[t]}-${UNITS[u]}`
  }
  if (n < 80) return n === 71 ? 'soixante et onze' : `soixante-${below100(n - 60)}`
  // 80 à 99
  const rest = n - 80
  if (rest === 0) return 'quatre-vingts'
  return `quatre-vingt-${below100(rest)}`
}

function below1000(n: number, final: boolean): string {
  const h = Math.floor(n / 100)
  const r = n % 100
  let out = ''
  if (h > 0) {
    out = h === 1 ? 'cent' : `${UNITS[h]} cent`
    // « deux cents » seulement en fin de nombre
    if (h > 1 && r === 0 && final) out += 's'
  }
  if (r > 0) {
    let words = below100(r)
    if (!final && words === 'quatre-vingts') words = 'quatre-vingt'
    out = out ? `${out} ${words}` : words
  }
  return out
}

export function integerInWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return ''
  n = Math.floor(n)
  if (n === 0) return 'zéro'
  const parts: string[] = []
  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000
  if (millions) parts.push(`${below1000(millions, true)} million${millions > 1 ? 's' : ''}`)
  if (thousands) parts.push(thousands === 1 ? 'mille' : `${below1000(thousands, false)} mille`)
  if (rest) parts.push(below1000(rest, true))
  return parts.join(' ')
}

export function eurosInWords(cents: number): string {
  const euros = Math.floor(cents / 100)
  const c = Math.round(cents % 100)
  const e = `${integerInWords(euros)} euro${euros > 1 ? 's' : ''}`
  return c ? `${e} et ${integerInWords(c)} centime${c > 1 ? 's' : ''}` : e
}
