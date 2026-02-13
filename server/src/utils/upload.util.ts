import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { env } from '../config/env.js'

// Create uploads directory if it doesn't exist
const uploadDir = path.resolve(env.UPLOAD_DIR)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer storage
const storage = multer.memoryStorage()

// File filter for images only
const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'))
  }
}

// Multer upload middleware (images only)
export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE, // 5MB default
  },
})

// Multer upload middleware for generic files (any type, 5MB max)
export const uploadFile = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

/**
 * Save uploaded file to disk (no image processing)
 */
export const saveFile = (buffer: Buffer, originalname: string): string => {
  const ext = path.extname(originalname) || ''
  const safeName = originalname.replace(/\s/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
  const outputFilename = `${Date.now()}-${safeName}`
  const outputPath = path.join(uploadDir, outputFilename)

  fs.writeFileSync(outputPath, buffer)

  return `/uploads/${outputFilename}`
}

/**
 * Process and save uploaded image
 */
export const processImage = async (
  buffer: Buffer,
  filename: string,
  options: {
    width?: number
    height?: number
    quality?: number
  } = {}
): Promise<string> => {
  const {
    width = 1200,
    height = 800,
    quality = 80,
  } = options

  const outputFilename = `${Date.now()}-${filename.replace(/\s/g, '-')}`
  const outputPath = path.join(uploadDir, outputFilename)

  await sharp(buffer)
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality })
    .toFile(outputPath)

  // Return relative path for storage in database
  return `/uploads/${outputFilename}`
}

/**
 * Process multiple images
 */
export const processMultipleImages = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  const processedImages: string[] = []

  for (const file of files) {
    const imagePath = await processImage(file.buffer, file.originalname)
    processedImages.push(imagePath)
  }

  return processedImages
}

/**
 * Create thumbnail
 */
export const createThumbnail = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const outputFilename = `thumb-${Date.now()}-${filename.replace(/\s/g, '-')}`
  const outputPath = path.join(uploadDir, outputFilename)

  await sharp(buffer)
    .resize(300, 200, {
      fit: 'cover',
    })
    .jpeg({ quality: 70 })
    .toFile(outputPath)

  return `/uploads/${outputFilename}`
}

/**
 * Delete image file
 */
export const deleteImage = (imagePath: string): void => {
  try {
    const fullPath = path.join(uploadDir, path.basename(imagePath))
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch (error) {
    console.error('Error deleting image:', error)
  }
}

/**
 * Delete multiple images
 */
export const deleteMultipleImages = (imagePaths: string[]): void => {
  imagePaths.forEach((imagePath) => {
    deleteImage(imagePath)
  })
}

/**
 * Validate image dimensions
 */
export const validateImageDimensions = async (
  buffer: Buffer,
  minWidth = 800,
  minHeight = 600
): Promise<boolean> => {
  try {
    const metadata = await sharp(buffer).metadata()
    return (
      (metadata.width || 0) >= minWidth && (metadata.height || 0) >= minHeight
    )
  } catch {
    return false
  }
}
