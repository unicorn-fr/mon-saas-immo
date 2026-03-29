import { Router } from 'express'
import { waitlistController, requireNotifySecret } from '../controllers/waitlist.controller.js'

const router = Router()

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/join', waitlistController.join)
router.get('/count', waitlistController.count)

// ── Admin (Bearer: NOTIFY_SECRET) ─────────────────────────────────────────────
router.use('/admin', requireNotifySecret)
router.get('/admin/stats',        waitlistController.stats)
router.get('/admin/list',         waitlistController.list)
router.get('/admin/export',       waitlistController.exportCsv)
router.post('/admin/add',         waitlistController.addManual)
router.delete('/admin/:id',       waitlistController.deleteEntry)
router.post('/notify-all',        requireNotifySecret, waitlistController.notifyAll)

export default router
