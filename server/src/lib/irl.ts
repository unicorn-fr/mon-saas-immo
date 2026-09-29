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

export async function fetchIrl(): Promise<IrlPoint[]> {
  if (cache && Date.now() - cache.at < 12 * 3600_000) return cache.points
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
