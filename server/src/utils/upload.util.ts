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
 * Build a semi-transparent SVG watermark sized relative to the image
 */
const buildWatermark = (imgWidth: number): Buffer => {
  const fontSize = Math.max(14, Math.round(imgWidth * 0.028))
  const w = Math.round(imgWidth * 0.40)
  const h = fontSize + 18
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" rx="4" fill="rgba(0,0,0,0.40)"/>
      <text x="${Math.round(w / 2)}" y="${Math.round(h / 2 + 1)}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="${fontSize}"
        font-weight="bold" fill="rgba(255,255,255,0.88)">
        ImmoParticuliers.fr
      </text>
    </svg>`
  )
}

/**
 * Process and save uploaded image (watermark applied automatically)
 */
export const processImage = async (
  buffer: Buffer,
  filename: string,
  options: {
    width?: number
    height?: number
    quality?: number
    watermark?: boolean
  } = {}
): Promise<string> => {
  const {
    width = 1200,
    height = 800,
    quality = 80,
    watermark = true,
  } = options

  const outputFilename = `${Date.now()}-${filename.replace(/\s/g, '-')}`
  const outputPath = path.join(uploadDir, outputFilename)

  let pipeline = sharp(buffer).resize(width, height, {
    fit: 'inside',
    withoutEnlargement: true,
  })

  if (watermark) {
    const meta = await sharp(buffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .metadata()
    const wm = buildWatermark(meta.width || width)
    pipeline = pipeline.composite([{ input: wm, gravity: 'southeast', blend: 'over' }])
  }

  await pipeline.jpeg({ quality }).toFile(outputPath)

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
