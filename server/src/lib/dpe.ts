/**
 * DPE existants — ADEME, jeu de données « DPE Logements existants (depuis juillet 2021) »,
 * Licence Ouverte 2.0. Recherche par identifiant BAN de l'adresse.
 */
export interface DpeRecord {
  number: string
  dpeClass: string
  gesClass: string | null
  surface: number | null
  floor: number | null
  validUntil: string | null
}

const BASE = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines'

export async function findDpe(banId: string): Promise<DpeRecord[]> {
  const url = new URL(BASE)
  url.searchParams.set('qs', `identifiant_ban:"${banId.replace(/"/g, '')}"`)
  url.searchParams.set('size', '20')
  url.searchParams.set('sort', '-date_etablissement_dpe')
  url.searchParams.set(
    'select',
    'numero_dpe,etiquette_dpe,etiquette_ges,surface_habitable_logement,numero_etage_appartement,date_fin_validite_dpe',
  )
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`ADEME ${res.status}`)
  const json = (await res.json()) as { results?: Array<Record<string, unknown>> }
  const today = new Date().toISOString().slice(0, 10)
  return (json.results ?? [])
    .map((r) => ({
      number: String(r.numero_dpe ?? ''),
      dpeClass: String(r.etiquette_dpe ?? ''),
      gesClass: r.etiquette_ges ? String(r.etiquette_ges) : null,
      surface: typeof r.surface_habitable_logement === 'number' ? r.surface_habitable_logement : null,
      floor: typeof r.numero_etage_appartement === 'number' ? r.numero_etage_appartement : null,
      validUntil: r.date_fin_validite_dpe ? String(r.date_fin_validite_dpe).slice(0, 10) : null,
    }))
    .filter((d) => /^[A-G]$/.test(d.dpeClass) && (!d.validUntil || d.validUntil >= today))
}
