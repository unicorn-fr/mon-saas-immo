import { Router } from 'express'
import multer from 'multer'
import { rateLimit } from 'express-rate-limit'
import { authenticate } from '../middlewares/auth.middleware.js'
import { kycController } from '../controllers/kyc.controller.js'
import { analyzeDocumentOCR, preloadOcrWorker } from '../services/ocrDocument.service.js'

// Pré-chauffe le worker Tesseract au démarrage (évite la latence sur la 1re requête)
preloadOcrWorker()

const router = Router()

// Stockage en mémoire — aucun fichier écrit sur disque, suppression immédiate après OCR
const kycUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/webm', 'video/mp4']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Format non autorisé. Utilisez JPG, PNG, WebP, PDF ou WebM/MP4.'))
  }
})

// Rate limit : 10 tentatives / heure par IP (assoupli pour les tests)
const kycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.get('/status', authenticate, kycController.getStatus.bind(kycController))

router.post(
  '/upload-document',
  authenticate,
  kycLimiter,
  kycUpload.single('document'),
  kycController.uploadDocument.bind(kycController)
)

router.post(
  '/verify-biometric',
  authenticate,
  kycLimiter,
  kycController.verifyBiometric.bind(kycController)
)

// Finalise le KYC sans contrat (vérification standalone owner)
router.post('/complete', authenticate, kycController.complete.bind(kycController))

// ─── OCR enterprise (backend) ─────────────────────────────────────────────────
// Rate limit plus strict : 20 scans/heure par IP (OCR intensif en CPU)
const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { success: false, message: 'Limite OCR atteinte. Réessayez dans 1 heure.' },
})

router.post(
  '/ocr-scan',
  authenticate,
  ocrLimiter,
  kycUpload.single('image'),
  async (req, res) => {
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) return res.status(400).json({ success: false, message: 'Image requise.' })

    const docType = (req.body?.docType ?? 'CNI') as 'CNI' | 'PERMIS_CONDUIRE'
    if (!['CNI', 'PERMIS_CONDUIRE'].includes(docType)) {
      return res.status(400).json({ success: false, message: 'docType invalide.' })
    }

    try {
      const result = await analyzeDocumentOCR(file.buffer, docType)
      return res.status(200).json({ success: true, data: result })
    } catch (e) {
      console.error('[KYC OCR] Error:', (e as Error)?.message)
      return res.status(500).json({ success: false, message: 'Erreur OCR serveur.' })
    }
  }
)

router.post(
  '/sign/:contractId',
  authenticate,
  kycLimiter,
  kycUpload.single('video'),
  kycController.signWithVideo.bind(kycController)
)

export default router
