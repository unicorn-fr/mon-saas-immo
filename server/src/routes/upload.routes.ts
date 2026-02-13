import { Router } from 'express'
import { uploadController } from '../controllers/upload.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { upload, uploadFile } from '../utils/upload.util.js'

const router = Router()

/**
 * All upload routes require authentication
 */

// POST /api/v1/upload/image - Upload single image
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  uploadController.uploadSingleImage.bind(uploadController)
)

// POST /api/v1/upload/images - Upload multiple images (max 10)
router.post(
  '/images',
  authenticate,
  upload.array('images', 10),
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
