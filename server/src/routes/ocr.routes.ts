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

      const isPermisContext  = docType.toUpperCase().includes('PERMIS')
      const isVersoContext   = docType.toUpperCase().includes('VERSO')

      const prompt = `You are an identity document verification system for a French rental platform.

## DOCUMENT CONTEXT
Expected document type: ${docType}${isVersoContext ? ' (back side — less text visible, be lenient)' : ''}

## ACCEPTED documents (isIdDocument = true)
- CNI française (carte nationale d'identité) — recto: photo + nom + prénom + date naissance; verso: MRZ
- Passeport français ou étranger — page biographique avec photo
- Titre de séjour français
- Carte d'identité européenne (Belgique, Espagne, Italie…)${isPermisContext ? '\n- Permis de conduire français (format carte bancaire rose ou nouveau format avec puce)' : ''}

## REJECTED documents (isIdDocument = false)
- Carte bancaire, carte Vitale, carte de fidélité
${isPermisContext ? '' : '- Permis de conduire (non accepté pour ce type de document)\n'}- Facture, relevé de compte, bulletin de salaire, avis d'imposition, contrat
- Simple photo d'une personne sans document
- Document manuscrit ou non officiel
- Image floue illisible, fond uni sans document${isVersoContext ? '\n\nNOTE: This is the BACK side scan. Even if there is little text, accept it if it appears to be the reverse side of an identity document (barcodes, MRZ strip, categories list, or administrative data are normal on the back).' : ''}

## DECISION RULES
- The document type context above tells you what to expect — apply it.
- If the image clearly shows the expected document type → isIdDocument = true.
- If it is clearly a completely different object (credit card, receipt, blank surface…) → isIdDocument = false.
- For recto: a valid document has a photo of a person, a name, and a document number.
- For verso: stripes, MRZ text, or administrative data on a card-shaped document are sufficient.

## OUTPUT — return ONLY valid JSON, no explanation, no markdown:
{
  "isIdDocument": true or false,
  "rejectReason": "if false: one short French sentence (e.g. 'Carte bancaire détectée, non acceptée.'), else empty string",
  "nom": "family name in uppercase or empty",
  "prenom": "given name(s) or empty",
  "dob": "YYYY-MM-DD or empty",
  "nationality": "nationality in French (e.g. Française) or empty",
  "documentNumber": "document number or empty",
  "expiry": "YYYY-MM-DD or empty",
  "mrz": "MRZ lines joined by | if visible, else empty",
  "side": "recto if front face with photo, verso if back side, unknown otherwise"
}

Never invent or guess field values. If a field is not clearly visible, use empty string.`

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
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
                text: prompt,
              },
            ],
          },
        ],
      })

      // Parse response
      const raw = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
      let extracted: Record<string, any> = {}
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0])
      } catch {
        extracted = {}
      }

      // Sanitize — only return known safe fields
      const safe = {
        isIdDocument:   extracted.isIdDocument === true || extracted.isIdDocument === 'true',
        rejectReason:   String(extracted.rejectReason   ?? '').slice(0, 200),
        nom:            String(extracted.nom            ?? '').slice(0, 80),
        prenom:         String(extracted.prenom         ?? '').slice(0, 80),
        dob:            String(extracted.dob            ?? '').slice(0, 10),
        nationality:    String(extracted.nationality    ?? '').slice(0, 80),
        documentNumber: String(extracted.documentNumber ?? '').slice(0, 40),
        expiry:         String(extracted.expiry         ?? '').slice(0, 10),
        mrz:            String(extracted.mrz            ?? '').slice(0, 200),
        side:           String(extracted.side           ?? 'unknown').slice(0, 10),
      }

      return res.status(200).json({ success: true, data: safe })
    } catch (error) {
      next(error)
    }
  }
)

export default router
