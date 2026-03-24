/**
 * watermark.service.ts
 *
 * Applique un filigrane Bailio sur tous les documents avant de les servir
 * à un propriétaire. Le filigrane inclut le nom du destinataire, la date
 * et l'heure exacte d'accès — garantissant la traçabilité complète.
 *
 * • Images  (JPEG, PNG, WebP) : overlay SVG diagonal via sharp
 * • PDFs    : filigrane intégré sur chaque page via pdf-lib
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { PDFDocument, rgb, degrees } from 'pdf-lib'

export interface WatermarkOptions {
  ownerName: string
  ownerId: string
  date?: Date   // moment d'accès (now par défaut)
}

// ── Point d'entrée ────────────────────────────────────────────────────────────

export async function serveWatermarkedDocument(
  fileUrl: string,
  mimeType: string,
  opts: WatermarkOptions,
): Promise<{ buffer: Buffer; contentType: string }> {
  let rawBuffer: Buffer

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    // Remote file (Cloudinary or other CDN) — fetch directly
    const { fetchRemoteBuffer } = await import('../utils/cloudinary.util.js')
    rawBuffer = await fetchRemoteBuffer(fileUrl)
  } else {
    // Local file on disk "/uploads/…"
    const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
    const relativePath = fileUrl.startsWith('/uploads/')
      ? fileUrl.slice('/uploads/'.length)
      : fileUrl
    // Protection path traversal
    const filePath = path.resolve(uploadDir, relativePath)
    if (!filePath.startsWith(path.resolve(uploadDir))) {
      throw new Error('Chemin de fichier invalide')
    }
    rawBuffer = await fs.readFile(filePath)
  }

  if (mimeType === 'application/pdf') {
    const watermarked = await applyPdfWatermark(rawBuffer, opts)
    return { buffer: watermarked, contentType: 'application/pdf' }
  }

  // Image JPEG / PNG / WebP
  const watermarked = await applyImageWatermark(rawBuffer, opts)
  return { buffer: watermarked, contentType: 'image/jpeg' }
}

// ── Utilitaire textes ─────────────────────────────────────────────────────────

function buildLines(opts: WatermarkOptions): { line1: string; line2: string; line3: string } {
  const now = opts.date ?? new Date()
  const datePart = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timePart = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const idStr    = opts.ownerId.slice(0, 8).toUpperCase()

  return {
    line1: `BAILIO · CONFIDENTIEL`,
    line2: `Partagé le ${datePart} à ${timePart}`,
    line3: `${opts.ownerName.toUpperCase()} · ID:${idStr} · CONSULTATION SEULE`,
  }
}

// ── Watermark image (sharp + SVG) ─────────────────────────────────────────────

async function applyImageWatermark(imageBuffer: Buffer, opts: WatermarkOptions): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata()
  const w = meta.width  ?? 800
  const h = meta.height ?? 1100

  const { line1, line2, line3 } = buildLines(opts)

  // Taille de police : 5 % du min(w,h) — adapté portrait ET paysage
  const fontSize  = Math.max(22, Math.round(Math.min(w, h) * 0.05))
  const lineGap   = Math.round(fontSize * 1.7)
  const blockH    = lineGap * 3  // 3 lignes par bloc

  // rowStep ≥ blockH + marge → jamais de chevauchement quelle que soit l'orientation
  const rowStep   = Math.max(blockH + Math.round(fontSize * 0.8), Math.round(Math.min(w, h) / 5))

  // Couvrir toute la diagonale (rotation -35°)
  const totalRows = Math.ceil((h + w) / rowStep) + 2
  const cx        = Math.round(w / 2)

  const elems: string[] = []
  for (let r = -1; r < totalRows; r++) {
    const base = r * rowStep
    ;[line1, line2, line3].forEach((txt, j) => {
      const y = base + j * lineGap
      // line1 (BAILIO) plus grande et plus opaque
      const fs    = j === 0 ? Math.round(fontSize * 1.15) : fontSize
      const fill  = j === 0 ? 'rgba(160,0,0,0.50)' : 'rgba(160,0,0,0.38)'
      const weight = j === 0 ? 'bold' : 'normal'
      elems.push(
        `<text x="${cx}" y="${y}" text-anchor="middle" ` +
        `font-family="sans-serif" font-size="${fs}" font-weight="${weight}" ` +
        `fill="${fill}" transform="rotate(-35 ${cx} ${y})">${escSvg(txt)}</text>`
      )
    })
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${elems.join('')}</svg>`

  return sharp(imageBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .composite([{ input: Buffer.from(svg), blend: 'over' }])
    .jpeg({ quality: 88 })
    .toBuffer()
}

// ── Watermark PDF (pdf-lib) ───────────────────────────────────────────────────

async function applyPdfWatermark(pdfBuffer: Buffer, opts: WatermarkOptions): Promise<Buffer> {
  const { line1, line2, line3 } = buildLines(opts)

  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize()

    const fontSize  = Math.max(18, Math.round(Math.min(width, height) * 0.05))
    const lineGap   = fontSize * 1.7
    const blockH    = lineGap * 3
    const rowStep   = Math.max(blockH + fontSize * 0.8, Math.min(width, height) / 5)
    const totalRows = Math.ceil((height + width) / rowStep) + 2
    const cx        = width / 2
    const angle     = degrees(-35)
    const red       = rgb(0.63, 0, 0)

    for (let r = -1; r < totalRows; r++) {
      const base = r * rowStep

      // Ligne 1 : BAILIO · CONFIDENTIEL — plus grande
      const fs1 = fontSize * 1.15
      page.drawText(line1, {
        x: cx - line1.length * fs1 * 0.27,
        y: base,
        size: fs1,
        color: red,
        opacity: 0.50,
        rotate: angle,
      })

      // Ligne 2 : date/heure
      page.drawText(line2, {
        x: cx - line2.length * fontSize * 0.27,
        y: base + lineGap,
        size: fontSize,
        color: red,
        opacity: 0.38,
        rotate: angle,
      })

      // Ligne 3 : nom + ID
      page.drawText(line3, {
        x: cx - line3.length * fontSize * 0.27,
        y: base + lineGap * 2,
        size: fontSize,
        color: red,
        opacity: 0.38,
        rotate: angle,
      })
    }
  }

  return Buffer.from(await pdfDoc.save())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escSvg(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
