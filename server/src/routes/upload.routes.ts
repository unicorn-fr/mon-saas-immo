import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { uploadController } from '../controllers/upload.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { upload, uploadFile } from '../utils/upload.util.js'

const router = Router()

/** Middleware that converts multer errors into clean 400 JSON responses */
function handleMulterError(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'Fichier trop volumineux (max 10 Mo)'
      : `Erreur d'upload: ${err.message}`
    return res.status(400).json({ success: false, message: msg })
  }
  if (err instanceof Error) {
    return res.status(400).json({ success: false, message: err.message })
  }
  next(err)
}

/**
 * All upload routes require authentication
 */

// POST /api/v1/upload/image - Upload single image
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  handleMulterError,
  uploadController.uploadSingleImage.bind(uploadController)
)

// POST /api/v1/upload/images - Upload multiple images (max 10)
router.post(
  '/images',
  authenticate,
  upload.array('images', 10),
  handleMulterError,
  uploadController.uploadMultipleImages.bind(uploadController)
)

// POST /api/v1/upload/file - Upload single file (any type, max 5MB)
router.post(
  '/file',
  authenticate,
  uploadFile.single('file'),
  uploadController.uploadSingleFile.bind(uploadController)
)

export default router
