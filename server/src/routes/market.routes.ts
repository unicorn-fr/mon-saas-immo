import { Router, Request, Response } from 'express'
import { getMarketEstimation } from '../services/dvf.service.js'

const router = Router()

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
