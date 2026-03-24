/**
 * cloudinary.util.ts
 *
 * Stockage persistent des fichiers via Cloudinary (free tier: 25 GB).
 * Activé quand CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME est défini.
 * Fallback automatique sur le disque local si pas configuré.
 *
 * Variables d'env requises (une des deux formes) :
 *   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 *   — ou —
 *   CLOUDINARY_CLOUD_NAME=xxx
 *   CLOUDINARY_API_KEY=xxx
 *   CLOUDINARY_API_SECRET=xxx
 */

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

let _configured = false

function configure() {
  if (_configured) return
  const url = process.env.CLOUDINARY_URL
  const name = process.env.CLOUDINARY_CLOUD_NAME
  const key  = process.env.CLOUDINARY_API_KEY
  const sec  = process.env.CLOUDINARY_API_SECRET

  if (url) {
    cloudinary.config({ cloudinary_url: url })
    _configured = true
  } else if (name && key && sec) {
    cloudinary.config({ cloud_name: name, api_key: key, api_secret: sec })
    _configured = true
  }
}

/** Returns true if Cloudinary credentials are available */
export function isCloudinaryEnabled(): boolean {
  configure()
  return _configured
}

/**
 * Upload a buffer to Cloudinary.
 *
 * For images: resized to max 1600px wide, compressed to ~75% quality,
 *             converted to JPEG for consistent size.
 * For PDFs:   stored as raw (no transformation).
 *
 * @returns Public Cloudinary URL (https://res.cloudinary.com/…)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  originalname: string,
  mimeType: string,
): Promise<string> {
  configure()
  if (!_configured) throw new Error('Cloudinary non configuré')

  const isPdf = mimeType === 'application/pdf' || /\.pdf$/i.test(originalname)
  const isImage = mimeType.startsWith('image/')

  return new Promise((resolve, reject) => {
    const opts: Record<string, unknown> = {
      folder: 'bailio/dossier',
      resource_type: isPdf ? 'raw' : 'image',
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    }

    if (isImage) {
      // Resize max 1600px, auto quality (~75%), convert to JPEG
      opts.transformation = [
        { width: 1600, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'jpg' },
      ]
    }

    const stream = cloudinary.uploader.upload_stream(opts, (err, result?: UploadApiResponse) => {
      if (err || !result) return reject(err ?? new Error('Upload Cloudinary échoué'))
      resolve(result.secure_url)
    })

    stream.end(buffer)
  })
}

/**
 * Delete a Cloudinary asset by its public URL.
 * Silently ignores errors (non-blocking cleanup).
 */
export async function deleteFromCloudinary(secureUrl: string): Promise<void> {
  configure()
  if (!_configured || !secureUrl.includes('cloudinary.com')) return

  try {
    // Extract public_id from URL: …/upload/v123/bailio/dossier/abc → bailio/dossier/abc
    const match = secureUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[^.]+)?$/)
    if (!match) return
    const publicId = match[1]
    await cloudinary.uploader.destroy(publicId, { invalidate: true })
  } catch {
    // silent
  }
}

/**
 * Fetch a file from a URL (Cloudinary or any https://) and return its Buffer.
 * Used by watermark.service when fileUrl is a remote URL instead of a local path.
 */
export async function fetchRemoteBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Impossible de récupérer le fichier distant (${res.status})`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
