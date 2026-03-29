import { Router } from 'express'
import { waitlistController } from '../controllers/waitlist.controller.js'

const router = Router()

// POST /api/waitlist/join
router.post('/join', waitlistController.join)

// GET /api/waitlist/count
router.get('/count', waitlistController.count)

export default router
