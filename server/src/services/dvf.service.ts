/**
 * DVF (Demandes de Valeurs Foncières) — Estimation de prix immobilier
 * Source : data.gouv.fr — 100% gratuit, open data gouvernemental français
 *
 * APIs utilisées (gratuites, sans clé) :
 *  - https://geo.api.gouv.fr/  → code INSEE depuis code postal
 *  - https://files.data.gouv.fr/geo-dvf/latest/csv/  → données transactions DVF
 */

interface DvfStats {
  codePostal: string
  commune: string
  type: string
  medianPricePerM2: number
  minPricePerM2: number
  maxPricePerM2: number
  q1PricePerM2: number
  q3PricePerM2: number
  nbTransactions: number
  annee: number
  source: string
}

interface CacheEntry {
  data: DvfStats | null
  expiresAt: number
}

// Cache in-memory 24h
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 24 * 60 * 60 * 1000

// ── Helpers ────────────────────────────────────────────────────────────────

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function deptFromInsee(code: string): string {
  if (code.startsWith('97')) return code.substring(0, 3)
  return code.substring(0, 2)
}

// ── Step 1 : Commune from postal code ─────────────────────────────────────

async function getCommuneInfo(codePostal: string): Promise<{ code: string; nom: string } | null> {
  try {
    const url = `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(codePostal)}&fields=code,nom&format=json`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = (await res.json()) as { code: string; nom: string }[]
    return data?.[0] ?? null
  } catch {
    return null
  }
}

// ── Step 2 : Download and parse DVF CSV ────────────────────────────────────

async function fetchDvfCsv(year: number, dept: string, commune: string): Promise<string | null> {
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/communes/${dept}/${commune}.csv`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function parseDvfCsv(csv: string, type: string): number[] {
  const lines = csv.split('\n')
  if (lines.length < 2) return []

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
  const idx = {
    nature:   header.indexOf('nature_mutation'),
    type:     header.indexOf('type_local'),
    valeur:   header.indexOf('valeur_fonciere'),
    surface:  header.indexOf('surface_reelle_bati'),
    lots:     header.indexOf('nombre_lots'),
  }

  const pricesPerM2: number[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = line.split(',').map(c => c.replace(/"/g, '').trim())

    // Only "Vente" mutations
    if (idx.nature >= 0 && cols[idx.nature] !== 'Vente') continue

    // Filter by type (Appartement / Maison) or accept all if type is empty
    if (type && idx.type >= 0 && cols[idx.type] !== type) continue

    // Parse price and area
    const rawPrice = cols[idx.valeur]?.replace(',', '.') ?? ''
    const rawSurface = cols[idx.surface]?.replace(',', '.') ?? ''
    const price = parseFloat(rawPrice)
    const surface = parseFloat(rawSurface)

    if (!price || !surface || surface < 9 || price < 1000) continue

    // Sanity check: 50 €/m² — 50 000 €/m²
    const pricePerM2 = price / surface
    if (pricePerM2 < 50 || pricePerM2 > 50000) continue

    pricesPerM2.push(Math.round(pricePerM2))
  }

  return pricesPerM2
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function getMarketEstimation(
  codePostal: string,
  type: 'Appartement' | 'Maison' | '' = ''
): Promise<DvfStats | null> {
  const cacheKey = `${codePostal}:${type}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  // 1. Resolve commune
  const commune = await getCommuneInfo(codePostal)
  if (!commune) {
    cache.set(cacheKey, { data: null, expiresAt: Date.now() + CACHE_TTL })
    return null
  }

  const dept = deptFromInsee(commune.code)
  const currentYear = new Date().getFullYear()

  // 2. Try current year then previous year (DVF updated annually)
  let csv: string | null = null
  let annee = currentYear

  for (const year of [currentYear, currentYear - 1, currentYear - 2]) {
    csv = await fetchDvfCsv(year, dept, commune.code)
    if (csv) { annee = year; break }
  }

  if (!csv) {
    cache.set(cacheKey, { data: null, expiresAt: Date.now() + CACHE_TTL })
    return null
  }

  // 3. Parse and compute stats
  const prices = parseDvfCsv(csv, type).sort((a, b) => a - b)
  if (prices.length < 3) {
    // Not enough data with specific type filter — retry without type filter
    const allPrices = parseDvfCsv(csv, '').sort((a, b) => a - b)
    if (allPrices.length < 3) {
      cache.set(cacheKey, { data: null, expiresAt: Date.now() + CACHE_TTL })
      return null
    }
    prices.push(...allPrices)
    prices.sort((a, b) => a - b)
  }

  const stats: DvfStats = {
    codePostal,
    commune: commune.nom,
    type: type || 'Tous types',
    medianPricePerM2: median(prices),
    minPricePerM2: prices[0],
    maxPricePerM2: prices[prices.length - 1],
    q1PricePerM2: percentile(prices, 25),
    q3PricePerM2: percentile(prices, 75),
    nbTransactions: prices.length,
    annee,
    source: 'DVF — data.gouv.fr (open data)',
  }

  cache.set(cacheKey, { data: stats, expiresAt: Date.now() + CACHE_TTL })
  return stats
}
