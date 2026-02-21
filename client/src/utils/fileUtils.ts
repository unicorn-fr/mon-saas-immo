/**
 * File Utilities for Contract Documents
 * - Compression
 * - Size validation (5 KB max)
 * - MIME type validation
 */

// Maximum file size in bytes (5 KB)
export const MAX_FILE_SIZE = 5 * 1024 // 5120 bytes

// Allowed MIME types for documents
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export interface FileValidationError {
  type: 'size' | 'mime-type' | 'compression'
  message: string
}

/**
 * Compress image files to reduce size
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Create canvas with reduced dimensions
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not create canvas context'))
          return
        }

        // Calculate new dimensions (max 800x600)
        let width = img.width
        let height = img.height
        const maxWidth = 800
        const maxHeight = 600

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          'image/jpeg',
          0.7 // 70% quality for JPEG
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Validate and compress file
 */
export async function validateAndCompressFile(
  file: File
): Promise<{ blob: Blob; sizeKb: number } | { error: FileValidationError }> {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      error: {
        type: 'mime-type',
        message: `Type de fichier non autorisé. Acceptés: PDF, JPG, PNG, WebP, DOC, DOCX`,
      },
    }
  }

  try {
    let finalBlob: Blob = file // Start with original file

    // Compress images
    if (file.type.startsWith('image/')) {
      finalBlob = await compressImage(file)
    }

    const sizeKb = finalBlob.size / 1024

    // Check final size
    if (finalBlob.size > MAX_FILE_SIZE) {
      return {
        error: {
          type: 'size',
          message: `Le fichier est trop volumineux (${sizeKb.toFixed(2)} KB). Maximum: 5 KB. Veuillez utiliser une image de faible résolution ou un document plus petit.`,
        },
      }
    }

    return { blob: finalBlob, sizeKb }
  } catch (err) {
    return {
      error: {
        type: 'compression',
        message: `Erreur lors du traitement du fichier: ${err instanceof Error ? err.message : 'Erreur inconnue'}`,
      },
    }
  }
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

/**
 * Get file icon based on type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word')) return '📝'
  return '📎'
}
