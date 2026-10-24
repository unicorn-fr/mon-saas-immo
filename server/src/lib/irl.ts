/**
 * Indice de référence des loyers (IRL) — série INSEE 001515333.
 * L'API BDM répond en XML SDMX (le paramètre format=json est refusé).
 */
const URL = 'https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/001515333?lastNObservations=12'

export interface IrlPoint {
  quarter: string // "2026-Q2"
  value: number
  publishedAt: string | null
}

let cache: { at: number; points: IrlPoint[] } | null = null

/**
 * Valeurs publiées de la série 001515333 (France métropolitaine), relevées le 24 octobre 2026 : dernier recours quand
 * l'INSEE ne répond pas et que la base n'a rien gardé. À compléter après chaque publication trimestrielle.
 */
export const KNOWN_IRL: IrlPoint[] = [
  { quarter: '2026-Q3', value: 148.06, publishedAt: '2026-10-16' },
  { quarter: '2026-Q2', value: 148.37, publishedAt: null },
  { quarter: '2026-Q1', value: 146.6, publishedAt: null },
  { quarter: '2025-Q4', value: 145.78, publishedAt: null },
  { quarter: '2025-Q3', value: 145.77, publishedAt: null },
  { quarter: '2025-Q2', value: 146.68, publishedAt: null },
  { quarter: '2025-Q1', value: 145.47, publishedAt: null },
  { quarter: '2024-Q4', value: 144.64, publishedAt: null },
  { quarter: '2024-Q3', value: 144.51, publishedAt: null },
  { quarter: '2024-Q2', value: 145.17, publishedAt: null },
  { quarter: '2024-Q1', value: 143.46, publishedAt: null },
]

/** Valeurs gardées en base, complétées par les valeurs connues (la base l'emporte), de la plus récente à la plus ancienne. */
export function withKnown(stored: IrlPoint[]): IrlPoint[] {
  const byQuarter = new Map(KNOWN_IRL.map((p) => [p.quarter, p]))
  for (const p of stored) byQuarter.set(p.quarter, p)
  return [...byQuarter.values()].sort((a, b) => b.quarter.localeCompare(a.quarter))
}

/** Valeurs gardées en base : l'INSEE indisponible ne bloque pas la création d'un bail. */
async function storedIrl(): Promise<IrlPoint[]> {
  // Import différé : les PDF (et leurs tests) utilisent ce fichier sans base de données.
  const { prisma } = await import('../db.js')
  const rows = await prisma.irlPoint.findMany({ orderBy: { quarter: 'desc' }, take: 12 }).catch(() => [])
  return rows.map((r) => ({ quarter: r.quarter, value: r.value, publishedAt: r.publishedAt }))
}

export async function fetchIrl(): Promise<IrlPoint[]> {
  if (cache && Date.now() - cache.at < 12 * 3600_000) return cache.points
  try {
    const points = await fetchFromInsee()
    // Écriture en arrière-plan (refusée dans un espace partagé : sans conséquence, la suivante passera).
    import('../db.js').then(({ prisma }) => Promise.all(points.map((p) => prisma.irlPoint.upsert({ where: { quarter: p.quarter }, create: p, update: { value: p.value, publishedAt: p.publishedAt } })))).catch(() => undefined)
    return points
  } catch (err) {
    console.warn('[irl] INSEE indisponible, valeurs gardées utilisées :', (err as Error).message)
    return withKnown(await storedIrl())
  }
}

async function fetchFromInsee(): Promise<IrlPoint[]> {
  const res = await fetch(URL, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`INSEE ${res.status}`)
  const xml = await res.text()
  const points = [...xml.matchAll(/<Obs\b([^>]*)\/>/g)]
    .map(([, attrs]) => {
      const get = (k: string) => new RegExp(`${k}="([^"]*)"`).exec(attrs)?.[1] ?? null
      return { quarter: get('TIME_PERIOD') ?? '', value: Number(get('OBS_VALUE')), publishedAt: get('DATE_JO') }
    })
    .filter((p) => /^\d{4}-Q[1-4]$/.test(p.quarter) && Number.isFinite(p.value))
    .sort((a, b) => b.quarter.localeCompare(a.quarter))
  if (points.length === 0) throw new Error('INSEE : aucune valeur IRL')
  cache = { at: Date.now(), points }
  return points
}

/** Dernier IRL publié, ou null si l'INSEE ne répond pas. */
export async function latestIrl(): Promise<IrlPoint | null> {
  try {
    return (await fetchIrl())[0] ?? null
  } catch (err) {
    console.warn('[irl]', (err as Error).message)
    return null
  }
}

/** IRL du même trimestre, un an plus tard (sert à la révision annuelle). */
export async function irlOneYearLater(quarter: string): Promise<IrlPoint | null> {
  const [y, q] = quarter.split('-')
  const target = `${Number(y) + 1}-${q}`
  try {
    return (await fetchIrl()).find((p) => p.quarter === target) ?? null
  } catch {
    return null
  }
}

export function quarterLabel(quarter: string): string {
  const [y, q] = quarter.split('-Q')
  return `${q === '1' ? '1er' : `${q}e`} trimestre ${y}`
}
