import { Router, Request, Response } from 'express'

const router = Router()

// GET /irl/current — retourne les dernières valeurs IRL depuis INSEE
// Série IRL : 001515333 (valeur trimestrielle)
router.get('/current', async (_req: Request, res: Response) => {
  try {
    // INSEE SDMX-JSON API — pas de clé requise
    const url = 'https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/001515333?lastNObservations=8&format=json'
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!resp.ok) throw new Error(`INSEE API: ${resp.status}`)
    const raw = await resp.json() as {
      GenericData?: {
        DataSet?: {
          Series?: {
            Obs?: Array<{ ObsDimension: { value: string }; ObsValue: { value: string } }>
          }
        }
      }
    }

    const observations = raw?.GenericData?.DataSet?.Series?.Obs ?? []
    const data = observations
      .map((o) => ({
        period: o.ObsDimension.value,   // ex: "2024-Q3"
        value: parseFloat(o.ObsValue.value),
      }))
      .filter(o => !isNaN(o.value))
      .sort((a, b) => b.period.localeCompare(a.period))

    return res.json({ success: true, data })
  } catch (err: unknown) {
    // Fallback : valeurs statiques récentes si INSEE indisponible
    return res.json({
      success: true,
      data: [
        { period: '2024-Q3', value: 145.47 },
        { period: '2024-Q2', value: 144.52 },
        { period: '2024-Q1', value: 143.46 },
        { period: '2023-Q4', value: 142.06 },
        { period: '2023-Q3', value: 141.42 },
        { period: '2023-Q2', value: 140.59 },
        { period: '2023-Q1', value: 138.72 },
        { period: '2022-Q4', value: 136.27 },
      ],
      fallback: true,
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
