import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import sharp from 'sharp'
import { prisma } from '../db.js'
import type { ContractInput } from '../domain/contract.js'
import { diagnosticsFor } from '../domain/rules.js'
import { renderContractPdf, type SignedLease } from '../pdf/contract.js'

/**
 * Bail avec son dossier de diagnostic technique (loi du 6 juillet 1989, art. 3-3) : les diagnostics déposés pour le
 * logement sont joints à la fin du PDF, après le bail et sa notice. Le document présenté à la signature, son empreinte
 * et l'exemplaire signé contiennent donc les diagnostics eux-mêmes, pas seulement leur liste.
 */

interface Annex {
  label: string
  bytes: Buffer
  mime: string
}

/** Dernier fichier déposé pour chaque diagnostic exigé et joint au bail. */
export async function diagnosticAnnexes(property: ContractInput['property'], propertyId: string | null | undefined): Promise<Annex[]> {
  if (!propertyId) return []
  const out: Annex[] = []
  for (const d of diagnosticsFor(property).filter((x) => x.required && x.annexed)) {
    const doc = await prisma.document.findFirst({ where: { propertyId, kind: 'DIAGNOSTIC', meta: { path: ['diagnostic'], equals: d.key }, file: { not: null } }, orderBy: { createdAt: 'desc' } })
    if (doc?.file) {
      out.push({ label: d.label, bytes: Buffer.from(doc.file), mime: doc.mimeType })
      continue
    }
    const fileId = property.diagnostics?.[d.key]?.fileId
    const blob = fileId ? await prisma.fileBlob.findUnique({ where: { id: fileId } }) : null
    if (blob) out.push({ label: d.label, bytes: Buffer.from(blob.data), mime: blob.mimeType })
  }
  return out
}

const latin = (s: string) => s.replace(/[’‘]/g, "'").replace(/[«»]/g, '"').replace(/[–—]/g, '-')

/** Ajoute les annexes à la fin d'un PDF : une page de titre, puis chaque document (PDF tel quel, image sur une page A4). */
export async function appendAnnexes(base: Buffer, annexes: Annex[]): Promise<Buffer> {
  if (!annexes.length) return base
  const doc = await PDFDocument.load(base)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const cover = doc.addPage([595.28, 841.89])
  cover.drawText('Annexe : dossier de diagnostic technique', { x: 56, y: 770, size: 16, font: bold, color: rgb(0.1, 0.1, 0.15) })
  cover.drawText(latin('Article 3-3 de la loi n° 89-462 du 6 juillet 1989. Documents joints :'), { x: 56, y: 744, size: 10, font })
  annexes.forEach((a, i) => cover.drawText(latin(`${i + 1}. ${a.label}`), { x: 70, y: 718 - i * 18, size: 11, font }))
  let skipped = 0
  for (const a of annexes) {
    try {
      if (a.mime === 'application/pdf') {
        const src = await PDFDocument.load(a.bytes, { ignoreEncryption: true })
        const pages = await doc.copyPages(src, src.getPageIndices())
        pages.forEach((pg) => doc.addPage(pg))
      } else if (a.mime.startsWith('image/')) {
        const jpg = await sharp(a.bytes, { limitInputPixels: 60_000_000 }).rotate().resize(1800, 2500, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
        const img = await doc.embedJpg(jpg)
        const page = doc.addPage([595.28, 841.89])
        const scale = Math.min(515 / img.width, 760 / img.height)
        page.drawText(latin(a.label), { x: 40, y: 815, size: 9, font })
        page.drawImage(img, { x: (595.28 - img.width * scale) / 2, y: 40 + (760 - img.height * scale) / 2, width: img.width * scale, height: img.height * scale })
      } else skipped += 1
    } catch {
      skipped += 1
    }
  }
  if (skipped) cover.drawText(latin(`${skipped} document(s) n'ont pas pu être joints automatiquement : ils sont remis à part.`), { x: 56, y: 700 - annexes.length * 18, size: 9, font })
  return Buffer.from(await doc.save())
}

/** PDF du bail avec ses diagnostics. */
export async function renderLeasePdf(c: ContractInput, propertyId: string | null | undefined, signed?: SignedLease): Promise<Buffer> {
  return appendAnnexes(await renderContractPdf(c, signed), await diagnosticAnnexes(c.property, propertyId))
}
