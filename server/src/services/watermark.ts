import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { HttpError } from '../lib/http.js'

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
  for (let y = -diag, i = 0; y < diag * 2; y += step, i++) {
    // Lignes décalées les unes des autres : la date et la ville se lisent partout, pas seulement sur une colonne.
    lines.push(`<text x="${-diag + ((i * size * 7) % (size * 21))}" y="${y}">${escapeXml(`${text}     ${text}     ${text}     ${text}`)}</text>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<g transform="rotate(-30 ${width / 2} ${height / 2})" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" fill="#3a4a6b" fill-opacity="0.34">${lines.join('')}</g>
</svg>`
  return sharp(image).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 82 }).toBuffer()
}

/** Pages au plus dans un justificatif envoyé de l'extérieur. */
export const MAX_PAGES = 12

/**
 * PDF envoyé par un candidat, un locataire ou tout autre tiers : jamais gardé tel quel. Chaque page est redessinée en
 * image (poppler, déjà utilisé pour l'import des baux), puis un nouveau PDF est construit avec ces seules images.
 * Tout ce qu'un PDF peut cacher (JavaScript, pièce jointe, lien qui lance un programme, formulaire, contenu caché) disparaît :
 * le fichier gardé ne contient que des images. Avec `text`, chaque page reçoit aussi le filigrane.
 */
export async function cleanPdf(pdf: Buffer, text?: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'bailio-piece-'))
  let pages: string[] = []
  try {
    const src = join(dir, 'piece.pdf')
    await writeFile(src, pdf, { mode: 0o600 })
    try {
      // Une page de plus que la limite : pour savoir s'il y en a trop, sans tout lire.
      await new Promise<void>((resolve, reject) =>
        execFile('pdftoppm', ['-r', '150', '-jpeg', '-jpegopt', 'quality=85', '-l', String(MAX_PAGES + 1), src, join(dir, 'page')], { timeout: 90_000 }, (err) => (err ? reject(err) : resolve())),
      )
      pages = (await readdir(dir)).filter((f) => f.startsWith('page')).sort()
    } catch {
      pages = []
    }
    if (!pages.length) throw new HttpError(400, 'Ce PDF ne peut pas être lu. Envoyez plutôt une photo ou une capture du document.')
    if (pages.length > MAX_PAGES) throw new HttpError(400, `Ce PDF a plus de ${MAX_PAGES} pages. Envoyez seulement les pages utiles, en plusieurs fichiers si besoin.`)
    const out = await PDFDocument.create()
    for (const name of pages) {
      const raw = await readFile(join(dir, name))
      const page = text ? await watermarkImage(raw, text) : raw
      const img = await out.embedJpg(page)
      // 150 points par pouce lus, 72 dans le PDF : la page garde sa taille d'origine.
      const w = (img.width * 72) / 150
      const h = (img.height * 72) / 150
      out.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h })
    }
    return Buffer.from(await out.save())
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
