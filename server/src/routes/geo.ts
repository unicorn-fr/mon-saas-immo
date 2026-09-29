import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { searchAddress } from '../lib/geo.js'
import { findDpe } from '../lib/dpe.js'
import { latestIrl } from '../lib/irl.js'

const router = Router()
router.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }))

router.get('/addresses', async (req, res) => {
  const { q } = z.object({ q: z.string().trim().min(3).max(200) }).parse(req.query)
  try {
    res.json({ success: true, data: await searchAddress(q) })
  } catch (err) {
    console.warn('[geo]', (err as Error).message)
    res.json({ success: true, data: [] })
  }
})

// DPE en cours de validité pour une adresse. Un seul DPE → proposé automatiquement ; plusieurs → au choix du propriétaire.
router.get('/dpe', async (req, res) => {
  const { banId } = z.object({ banId: z.string().trim().min(5).max(60) }).parse(req.query)
  try {
    res.json({ success: true, data: await findDpe(banId) })
  } catch (err) {
    console.warn('[dpe]', (err as Error).message)
    res.json({ success: true, data: [] })
  }
})

router.get('/irl', async (_req, res) => {
  res.json({ success: true, data: await latestIrl() })
})

export default router
