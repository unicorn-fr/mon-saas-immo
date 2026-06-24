import { Router } from 'express'
import multer from 'multer'
import { rateLimit } from 'express-rate-limit'
import { authenticate } from '../middlewares/auth.middleware.js'
import { kycController } from '../controllers/kyc.controller.js'

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

router.post(
  '/sign/:contractId',
  authenticate,
  kycLimiter,
  kycUpload.single('video'),
  kycController.signWithVideo.bind(kycController)
)

export default router
