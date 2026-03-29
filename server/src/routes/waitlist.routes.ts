import { Router } from 'express'
import { waitlistController } from '../controllers/waitlist.controller.js'

const router = Router()

// POST /api/v1/waitlist/join — public
router.post('/join', waitlistController.join)

// GET /api/v1/waitlist/count — public
router.get('/count', waitlistController.count)

// POST /api/v1/waitlist/notify-all — protected (Authorization: Bearer <NOTIFY_SECRET>)
router.post('/notify-all', waitlistController.notifyAll)

export default router
