import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'
import { authenticate } from '../middlewares/auth.middleware.js'
import { env } from '../config/env.js'

const router = Router()

// In-memory multer — image never touches disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    if (allowed.includes(file.mimetype)) return cb(null, true)
    cb(new Error('Format non supporté'))
  },
})

// Rate limit: 10 OCR calls per user per 60s (simple in-memory map)
const rateMap = new Map<string, { count: number; reset: number }>()
function checkOcrRate(userId: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(userId)
  if (!entry || entry.reset < now) {
    rateMap.set(userId, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

/**
 * POST /api/v1/ocr/extract
 * Body: multipart/form-data  { file: image, docType: string }
 * Returns: { nom, prenom, dob, nationality, documentNumber, expiry }
 *
 * Uses Claude Haiku — cheapest model, image not retained after call.
 */
router.post(
  '/extract',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Aucun fichier reçu.' })
      }

      const userId  = (req as any).user?.userId as string
      const docType = (req.body?.docType as string) || 'DOCUMENT'

      if (!checkOcrRate(userId)) {
        return res.status(429).json({ success: false, message: 'Trop de demandes. Réessayez dans une minute.' })
      }

      if (!env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ success: false, message: 'OCR non configuré.' })
      }

      // Resize to max 1600px wide for token efficiency, convert to JPEG
      let imageBuffer = req.file.buffer
      let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'

      try {
        imageBuffer = await sharp(req.file.buffer)
          .resize({ width: 1600, withoutEnlargement: true })
          .jpeg({ quality: 88 })
          .toBuffer()
        mediaType = 'image/jpeg'
      } catch {
        // PDF or unsupported by sharp — send as-is (Haiku supports PDF via base64)
        if (req.file.mimetype === 'application/pdf') {
          // For PDFs, we can't send as image — skip OCR
          return res.status(200).json({
            success: true,
            data: {},
            message: 'OCR non disponible pour les PDF. Remplissez les champs manuellement.',
          })
        }
      }

      const base64 = imageBuffer.toString('base64')

      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: `You are an OCR assistant extracting data from a French identity document (${docType}).
Extract ONLY these fields if visible and return ONLY valid JSON, no explanation:
{
  "nom": "",
  "prenom": "",
  "dob": "YYYY-MM-DD or empty",
  "nationality": "country name in French or empty",
  "documentNumber": "",
  "expiry": "YYYY-MM-DD or empty",
  "side": "recto if this is the front face showing photo and full name, verso if this is the back showing MRZ lines or address, unknown otherwise"
}
If a field is not visible or unclear, leave it as empty string. Never invent data.`,
              },
            ],
          },
        ],
      })

      // Parse response
      const raw = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
      let extracted: Record<string, string> = {}
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0])
      } catch {
        extracted = {}
      }

      // Sanitize — only return known safe fields
      const safe = {
        nom:            String(extracted.nom            ?? '').slice(0, 80),
        prenom:         String(extracted.prenom         ?? '').slice(0, 80),
        dob:            String(extracted.dob            ?? '').slice(0, 10),
        nationality:    String(extracted.nationality    ?? '').slice(0, 80),
        documentNumber: String(extracted.documentNumber ?? '').slice(0, 40),
        expiry:         String(extracted.expiry         ?? '').slice(0, 10),
        side:           String(extracted.side           ?? 'unknown').slice(0, 10),
      }

      return res.status(200).json({ success: true, data: safe })
    } catch (error) {
      next(error)
    }
  }
)

export default router
