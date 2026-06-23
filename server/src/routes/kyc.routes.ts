import { Router } from 'express'
import multer from 'multer'
import { rateLimit } from 'express-rate-limit'
import { mkdirSync } from 'fs'
import { authenticate } from '../middlewares/auth.middleware.js'
import { kycController } from '../controllers/kyc.controller.js'

const router = Router()

// Créer le dossier tmp si nécessaire
try { mkdirSync('/tmp/kyc-uploads', { recursive: true }) } catch { /* already exists */ }

// Stockage temporaire sécurisé — sera supprimé après OCR
const storage = multer.diskStorage({
  destination: '/tmp/kyc-uploads/',
  filename: (_req, _file, cb) => {
    // Nom aléatoire sans extension visible
    const rand = Math.random().toString(36).substring(2, 15)
    cb(null, `kyc_${rand}`)
  }
})

const kycUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/webm', 'video/mp4']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Format non autorisé. Utilisez JPG, PNG, WebP, PDF ou WebM/MP4.'))
  }
})

// Rate limit strict : 5 tentatives / heure par IP
const kycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
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
