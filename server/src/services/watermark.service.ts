/**
 * watermark.service.ts
 *
 * Applique un filigrane visible sur les images de documents avant de les
 * servir à un propriétaire. Chaque accès est ainsi tracé visuellement :
 * si un document fuite, on sait immédiatement à quel propriétaire il a
 * été montré et à quelle date.
 *
 * • Fonctionne sur JPEG, PNG, WebP via sharp (déjà installé)
 * • Les PDFs sont servis via un endpoint proxy sécurisé sans watermark
 *   image (le UI affiche un overlay CSS non-imprimable à la place)
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

export interface WatermarkOptions {
  ownerName: string
  ownerId: string   // affiché tronqué pour la traçabilité
  date?: Date
}

/**
 * Lit le fichier depuis le disque et retourne un buffer watermarqué.
 * Si le fichier est un PDF, retourne le buffer original non modifié
 * (le contrôle se fait côté UI et accès-log).
 */
export async function serveWatermarkedDocument(
  fileUrl: string,
  mimeType: string,
  opts: WatermarkOptions,
): Promise<{ buffer: Buffer; contentType: string }> {
  // Résoudre le chemin absolu depuis l'URL relative "/uploads/..."
  const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
  const relativePath = fileUrl.startsWith('/uploads/')
    ? fileUrl.slice('/uploads/'.length)
    : fileUrl

  const filePath = path.join(uploadDir, relativePath)
  const rawBuffer = await fs.readFile(filePath)

  // PDF → pas de watermark image, on retourne brut
  if (mimeType === 'application/pdf') {
    return { buffer: rawBuffer, contentType: 'application/pdf' }
  }

  // Image → watermark avec sharp
  const watermarked = await applyWatermark(rawBuffer, opts)
  return { buffer: watermarked, contentType: 'image/jpeg' }
}

/**
 * Overlay de texte diagonal sur l'image via sharp + SVG inline.
 * Technique : on génère un SVG transparent avec le texte en diagonale,
 * puis on le composite par-dessus l'image originale.
 */
async function applyWatermark(imageBuffer: Buffer, opts: WatermarkOptions): Promise<Buffer> {
  const { ownerName, ownerId, date = new Date() } = opts

  // Obtenir les dimensions réelles
  const meta = await sharp(imageBuffer).metadata()
  const w = meta.width ?? 800
  const h = meta.height ?? 1100

  const dateStr = date.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const idStr = `ID:${ownerId.slice(0, 8).toUpperCase()}`

  // Taille de police proportionnelle (environ 3% de la largeur)
  const fontSize = Math.max(14, Math.round(w * 0.032))
  // Espacement entre les lignes de répétition
  const repeatStep = Math.round(h / 3)

  // Génère une ligne de watermark répétée à plusieurs positions
  const lines = [
    `CONFIDENTIEL — ${ownerName.toUpperCase()}`,
    `${dateStr}  ${idStr}  USAGE UNIQUE`,
  ]

  // On crée le SVG avec 3 répétitions diagonales pour couvrir toute la page
  const watermarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <style>text { font-family: sans-serif; fill: rgba(180,0,0,0.22); font-size: ${fontSize}px; }</style>
  </defs>
  ${[0, 1, 2].map((i) => {
    const cy = Math.round(h / 4 + i * repeatStep)
    return lines.map((line, j) => `
      <text
        x="50%" y="${cy + j * (fontSize * 1.6)}"
        text-anchor="middle"
        transform="rotate(-30 ${Math.round(w / 2)} ${cy + j * (fontSize * 1.6)})"
      >${escSvg(line)}</text>
    `).join('')
  }).join('')}
</svg>`

  const svgBuffer = Buffer.from(watermarkSvg)

  return sharp(imageBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // évite transparence PNG
    .composite([{ input: svgBuffer, blend: 'over' }])
    .jpeg({ quality: 88 })
    .toBuffer()
}

function escSvg(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
