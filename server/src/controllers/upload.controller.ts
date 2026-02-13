import { Request, Response, NextFunction } from 'express'
import { processImage, processMultipleImages, saveFile } from '../utils/upload.util.js'

class UploadController {
  /**
   * POST /api/v1/upload/image
   * Upload single image
   */
  async uploadSingleImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        })
      }

      const imagePath = await processImage(req.file.buffer, req.file.originalname)

      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: imagePath,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/upload/images
   * Upload multiple images
   */
  async uploadMultipleImages(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        })
      }

      const imagePaths = await processMultipleImages(req.files)

      return res.status(200).json({
        success: true,
        message: `${imagePaths.length} images uploaded successfully`,
        data: {
          urls: imagePaths,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }
  /**
   * POST /api/v1/upload/file
   * Upload single file (any type, max 5MB)
   */
  async uploadSingleFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        })
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit',
        })
      }

      const filePath = saveFile(req.file.buffer, req.file.originalname)

      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          url: filePath,
          name: req.file.originalname,
          size: req.file.size,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }
}

export const uploadController = new UploadController()
