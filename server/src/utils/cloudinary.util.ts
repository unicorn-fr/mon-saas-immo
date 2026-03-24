/**
 * cloudinary.util.ts
 *
 * Stockage persistent des fichiers via Cloudinary (free tier: 25 GB).
 * Activé quand CLOUDINARY_URL ou les 3 variables séparées sont définies.
 * Fallback automatique sur le disque local si non configuré.
 *
 * Variables d'env requises :
 *   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 *   — ou —
 *   CLOUDINARY_CLOUD_NAME=xxx
 *   CLOUDINARY_API_KEY=xxx
 *   CLOUDINARY_API_SECRET=xxx
 */

import { v2 as cloudinary } from 'cloudinary'

let _configured = false

function configure(): void {
  if (_configured) return

  const url  = process.env.CLOUDINARY_URL
  const name = process.env.CLOUDINARY_CLOUD_NAME
  const key  = process.env.CLOUDINARY_API_KEY
  const sec  = process.env.CLOUDINARY_API_SECRET

  if (url) {
    // cloudinary v2 reads CLOUDINARY_URL automatically when you call config(true)
    cloudinary.config(true)
    _configured = true
    console.log('[Cloudinary] configured via CLOUDINARY_URL')
  } else if (name && key && sec) {
    cloudinary.config({ cloud_name: name, api_key: key, api_secret: sec })
    _configured = true
    console.log('[Cloudinary] configured via individual vars, cloud:', name)
  }
}

/** Returns true if Cloudinary credentials are available */
export function isCloudinaryEnabled(): boolean {
  configure()
  if (!_configured) {
    console.warn('[Cloudinary] NOT configured — falling back to local disk (files will be lost on server restart)')
  }
  return _configured
}

/**
 * Upload a buffer to Cloudinary.
 * NOTE: Image buffers should already be compressed by sharp before calling this.
 * PDFs are uploaded as raw resources.
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

  const opts = {
    folder: 'bailio/dossier',
    resource_type: (isPdf ? 'raw' : 'image') as 'raw' | 'image',
    use_filename: false,
    unique_filename: true,
    overwrite: false,
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      opts,
      (err, result) => {
        if (err) {
          console.error('[Cloudinary] upload error:', err.message)
          return reject(new Error(`Upload échoué: ${err.message}`))
        }
        if (!result?.secure_url) {
          return reject(new Error('Cloudinary n\'a pas retourné d\'URL'))
        }
        console.log('[Cloudinary] upload OK:', result.public_id)
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

/**
 * Delete a Cloudinary asset by its public URL. Silently ignores errors.
 */
export async function deleteFromCloudinary(secureUrl: string): Promise<void> {
  configure()
  if (!_configured || !secureUrl.includes('cloudinary.com')) return

  try {
    const match = secureUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[^.]+)?$/)
    if (!match) return
    const publicId = match[1]
    await cloudinary.uploader.destroy(publicId, { invalidate: true })
  } catch {
    // silent
  }
}

/**
 * Fetch a file from a remote URL and return its Buffer.
 * Used by watermark.service when fileUrl is a Cloudinary URL.
 */
export async function fetchRemoteBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Impossible de récupérer le fichier distant (${res.status})`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
