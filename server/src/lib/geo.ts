/** Géoplateforme (IGN) — géocodage des adresses, Base Adresse Nationale. */
export interface AddressSuggestion {
  label: string
  postalCode: string
  city: string
  inseeCode: string
  banId: string
}

export async function searchAddress(q: string): Promise<AddressSuggestion[]> {
  const url = new URL('https://data.geopf.fr/geocodage/search')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '5')
  url.searchParams.set('autocomplete', '1')
  url.searchParams.set('index', 'address')
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error(`Géoplateforme ${res.status}`)
  const json = (await res.json()) as { features?: Array<{ properties: Record<string, unknown> }> }
  return (json.features ?? []).map(({ properties: p }) => ({
    label: String(p.label ?? ''),
    postalCode: String(p.postcode ?? ''),
    city: String(p.city ?? ''),
    inseeCode: String(p.citycode ?? ''),
    banId: String(p.id ?? ''),
  }))
}
