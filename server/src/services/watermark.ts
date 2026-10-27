import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import { HttpError } from '../lib/http.js'
import { winAnsiSafe } from '../domain/watermark.js'

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Filigrane en travers d'une image (déjà réencodée en JPEG par storeFile) : le texte est répété en diagonale sur toute
 * la surface, assez clair pour lire le document, assez présent pour ne pas pouvoir le recadrer hors du filigrane.
 */
export async function watermarkImage(image: Buffer, text: string): Promise<Buffer> {
  const meta = await sharp(image).metadata()
  const width = meta.width ?? 1200
  const height = meta.height ?? 1600
  const size = Math.max(14, Math.round(Math.min(width, height) / 28))
  const step = size * 5
  const diag = Math.ceil(Math.hypot(width, height))
  const lines: string[] = []
  for (let y = -diag; y < diag * 2; y += step) {
    lines.push(`<text x="${-diag}" y="${y}">${escapeXml(`${text}     ${text}     ${text}     ${text}`)}</text>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<g transform="rotate(-30 ${width / 2} ${height / 2})" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" fill="#3a4a6b" fill-opacity="0.34">${lines.join('')}</g>
</svg>`
  return sharp(image).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 82 }).toBuffer()
}

/**
 * Filigrane sur chaque page d'un PDF. Un PDF que pdf-lib ne sait pas modifier (protégé, abîmé) est converti en images
 * page par page (poppler, déjà utilisé pour l'import des baux), filigranées puis réunies dans un nouveau PDF.
 */
export async function watermarkPdf(pdf: Buffer, text: string): Promise<Buffer> {
  try {
    const doc = await PDFDocument.load(pdf)
    const pages = doc.getPages()
    if (!pages.length) throw new Error('aucune page')
    const font = await doc.embedFont(StandardFonts.HelveticaBold)
    const safe = winAnsiSafe(text)
    for (const page of pages) {
      const { width, height } = page.getSize()
      const size = Math.max(9, Math.min(width, height) / 34)
      const step = size * 5
      for (let y = -height; y < height * 1.6; y += step) {
        page.drawText(`${safe}     ${safe}     ${safe}`, { x: -width * 0.3, y, size, font, color: rgb(0.23, 0.29, 0.42), opacity: 0.3, rotate: degrees(30) })
      }
    }
    return Buffer.from(await doc.save())
  } catch {
    return rasterized(pdf, text)
  }
}

const MAX_PAGES = 10

/** PDF converti en images (150 points par pouce), chacune filigranée, réunies dans un nouveau PDF. */
async function rasterized(pdf: Buffer, text: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'bailio-filigrane-'))
  try {
    const src = join(dir, 'piece.pdf')
    await writeFile(src, pdf, { mode: 0o600 })
    await new Promise<void>((resolve, reject) =>
      execFile('pdftoppm', ['-r', '150', '-jpeg', '-l', String(MAX_PAGES), src, join(dir, 'page')], { timeout: 60_000 }, (err) => (err ? reject(err) : resolve())),
    )
    const pages = (await readdir(dir)).filter((f) => f.startsWith('page')).sort()
    if (!pages.length) throw new Error('aucune page')
    const out = await PDFDocument.create()
    for (const name of pages) {
      const marked = await watermarkImage(await readFile(join(dir, name)), text)
      const img = await out.embedJpg(marked)
      // 150 points par pouce lus, 72 dans le PDF : la page garde sa taille d'origine.
      const w = (img.width * 72) / 150
      const h = (img.height * 72) / 150
      out.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h })
    }
    return Buffer.from(await out.save())
  } catch {
    throw new HttpError(400, 'Ce PDF ne peut pas être lu. Envoyez plutôt une photo ou une capture du document.')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
