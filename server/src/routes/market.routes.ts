import { Router, Request, Response } from 'express'
import { getMarketEstimation } from '../services/dvf.service.js'

const router = Router()

// ─── Données statiques prix au m² par ville ───────────────────────────────────

const CITY_PRICES = [
  { city: 'Paris', slug: 'paris', rentPerSqm: 31.5, buyPerSqm: 9800, trend: '+2.1%', zone: 'tendue', population: 2161000 },
  { city: 'Lyon', slug: 'lyon', rentPerSqm: 16.2, buyPerSqm: 4600, trend: '+1.8%', zone: 'tendue', population: 522000 },
  { city: 'Marseille', slug: 'marseille', rentPerSqm: 13.4, buyPerSqm: 3200, trend: '+3.2%', zone: 'tendue', population: 861000 },
  { city: 'Bordeaux', slug: 'bordeaux', rentPerSqm: 14.8, buyPerSqm: 4300, trend: '-0.5%', zone: 'tendue', population: 257000 },
  { city: 'Toulouse', slug: 'toulouse', rentPerSqm: 13.9, buyPerSqm: 3700, trend: '+2.8%', zone: 'tendue', population: 493000 },
  { city: 'Nantes', slug: 'nantes', rentPerSqm: 14.1, buyPerSqm: 3900, trend: '+1.2%', zone: 'tendue', population: 314000 },
  { city: 'Lille', slug: 'lille', rentPerSqm: 13.2, buyPerSqm: 3100, trend: '+1.5%', zone: 'tendue', population: 232000 },
  { city: 'Nice', slug: 'nice', rentPerSqm: 18.6, buyPerSqm: 5200, trend: '+3.8%', zone: 'tendue', population: 340000 },
  { city: 'Strasbourg', slug: 'strasbourg', rentPerSqm: 12.8, buyPerSqm: 3400, trend: '+1.1%', zone: 'tendue', population: 284000 },
  { city: 'Montpellier', slug: 'montpellier', rentPerSqm: 13.5, buyPerSqm: 3600, trend: '+4.1%', zone: 'tendue', population: 295000 },
  { city: 'Rennes', slug: 'rennes', rentPerSqm: 13.7, buyPerSqm: 4100, trend: '+1.9%', zone: 'tendue', population: 220000 },
  { city: 'Grenoble', slug: 'grenoble', rentPerSqm: 12.4, buyPerSqm: 2900, trend: '+0.8%', zone: 'tendue', population: 158000 },
  { city: 'Toulon', slug: 'toulon', rentPerSqm: 12.1, buyPerSqm: 2700, trend: '+2.4%', zone: 'normale', population: 171000 },
  { city: 'Aix-en-Provence', slug: 'aix-en-provence', rentPerSqm: 16.8, buyPerSqm: 5400, trend: '+2.2%', zone: 'tendue', population: 143000 },
  { city: 'Brest', slug: 'brest', rentPerSqm: 11.2, buyPerSqm: 2400, trend: '+1.5%', zone: 'normale', population: 139000 },
  { city: 'Dijon', slug: 'dijon', rentPerSqm: 11.8, buyPerSqm: 2800, trend: '+0.9%', zone: 'normale', population: 155000 },
  { city: 'Angers', slug: 'angers', rentPerSqm: 12.6, buyPerSqm: 3300, trend: '+2.1%', zone: 'tendue', population: 155000 },
  { city: 'Villeurbanne', slug: 'villeurbanne', rentPerSqm: 15.1, buyPerSqm: 4200, trend: '+1.6%', zone: 'tendue', population: 150000 },
  { city: 'Nîmes', slug: 'nimes', rentPerSqm: 11.4, buyPerSqm: 2600, trend: '+1.8%', zone: 'normale', population: 148000 },
  { city: 'Clermont-Ferrand', slug: 'clermont-ferrand', rentPerSqm: 11.1, buyPerSqm: 2500, trend: '+1.3%', zone: 'normale', population: 143000 },
]

const DATA_SOURCE = 'Données observatoire des loyers — mise à jour juin 2025'
const LAST_UPDATED = new Date('2025-06-01').toISOString()

/**
 * GET /api/v1/market/city-prices
 * Retourne les prix au m² pour toutes les villes (public)
 */
router.get('/city-prices', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      prices: CITY_PRICES,
      source: DATA_SOURCE,
      lastUpdated: LAST_UPDATED,
    },
  })
})

/**
 * GET /api/v1/market/city-prices/:slug
 * Retourne les prix pour une ville spécifique (public)
 */
router.get('/city-prices/:slug', (req: Request, res: Response) => {
  const { slug } = req.params
  const city = CITY_PRICES.find(c => c.slug === slug)

  if (!city) {
    return res.status(404).json({
      success: false,
      message: `Aucune donnée disponible pour la ville "${slug}"`,
    })
  }

  return res.json({
    success: true,
    data: city,
  })
})

/**
 * GET /api/v1/market/communes?q={query}
 * Autocomplete de communes françaises via geo.api.gouv.fr (gratuit, officiel)
 * Couvre les 35 000+ communes + villages de France.
 */
router.get('/communes', async (req: Request, res: Response) => {
  const q = (req.query.q as string ?? '').trim()
  if (q.length < 2) {
    return res.json({ success: true, data: [] })
  }
  try {
    const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,departement&boost=population&limit=10&format=json`
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!r.ok) return res.json({ success: true, data: [] })
    const data = await r.json() as {
      nom: string; code: string; codesPostaux: string[];
      departement: { nom: string; code: string }
    }[]
    return res.json({ success: true, data })
  } catch {
    return res.json({ success: true, data: [] })
  }
})

/**
 * GET /api/v1/market/estimation
 * Query params:
 *   - codePostal (required) : e.g. "75011"
 *   - type (optional)       : "Appartement" | "Maison" | "" (all)
 *
 * Returns median price/m² and stats from DVF (data.gouv.fr — free, no API key)
 */
router.get('/estimation', async (req: Request, res: Response) => {
  const { codePostal, type } = req.query as { codePostal?: string; type?: string }

  if (!codePostal || !/^\d{5}$/.test(codePostal)) {
    return res.status(400).json({
      success: false,
      message: 'codePostal invalide (5 chiffres requis)',
    })
  }

  const allowedTypes = ['Appartement', 'Maison', '']
  const cleanType = (allowedTypes.includes(type ?? '') ? type ?? '' : '') as 'Appartement' | 'Maison' | ''

  try {
    const data = await getMarketEstimation(codePostal, cleanType)

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Aucune donnée DVF disponible pour ce code postal',
      })
    }

    return res.json({ success: true, data })
  } catch (error) {
    console.error('[DVF] estimation error:', error)
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des données DVF' })
  }
})

export default router
