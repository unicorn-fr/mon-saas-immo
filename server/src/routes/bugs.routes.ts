import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// POST /api/v1/bugs — log a bug report (auth optional)
router.post('/', authenticate, upload.single('screenshot'), (req: Request, res: Response) => {
  const { title, description, type, url, userAgent } = req.body
  const userId = req.user?.id ?? 'anonymous'
  const hasScreenshot = !!req.file

  // Log to server console (visible in Render logs)
  console.log('[BUG REPORT]', JSON.stringify({
    userId,
    type: type ?? 'other',
    title,
    description,
    url,
    userAgent,
    hasScreenshot,
    ts: new Date().toISOString(),
  }, null, 2))

  return res.status(201).json({ success: true, message: 'Bug report received' })
})

export default router
