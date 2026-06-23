import Tesseract from 'tesseract.js'
import sharp from 'sharp'
import { secureDelete } from '../../utils/secureDelete.util.js'

export interface OcrResult {
  rawText: string
  firstName?: string
  lastName?: string
  birthDate?: Date
  documentExpiry?: Date
  nationality?: string
  documentNumber?: string
  mrzLine1?: string
  mrzLine2?: string
  confidence: number
}

/** Prétraite l'image pour améliorer l'OCR (niveaux de gris, contraste) */
async function preprocessImage(filePath: string): Promise<Buffer> {
  return sharp(filePath)
    .greyscale()
    .normalize()
    .sharpen()
    .toBuffer()
}

/** Extrait la zone MRZ (2 dernières lignes de texte avec <<<<) */
function extractMrzLines(text: string): { line1: string; line2: string } | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const mrzLines = lines.filter(l => /^[A-Z0-9<]{30,}$/.test(l))
  if (mrzLines.length >= 2) {
    return { line1: mrzLines[mrzLines.length - 2], line2: mrzLines[mrzLines.length - 1] }
  }
  return null
}

function parseDate(raw: string): Date | undefined {
  if (!raw || raw.length < 6) return undefined
  const yy = raw.substring(0, 2)
  const mm = raw.substring(2, 4)
  const dd = raw.substring(4, 6)
  const year = parseInt(yy) > 30 ? 1900 + parseInt(yy) : 2000 + parseInt(yy)
  const date = new Date(year, parseInt(mm) - 1, parseInt(dd))
  return isNaN(date.getTime()) ? undefined : date
}

/**
 * Analyse une pièce d'identité via OCR + parsing MRZ.
 * RGPD : le fichier est supprimé de façon sécurisée après extraction.
 */
export async function analyzeIdentityDocument(filePath: string): Promise<OcrResult> {
  let result: OcrResult = { rawText: '', confidence: 0 }

  try {
    // 1. Prétraitement image
    const processedBuffer = await preprocessImage(filePath)

    // 2. OCR Tesseract (mode full page)
    const { data } = await Tesseract.recognize(processedBuffer, 'fra+eng', {
      logger: () => {},
    })

    result.rawText = data.text
    result.confidence = data.confidence

    // 3. Tenter parsing MRZ (import dynamique — mrz est un package ESM pur)
    const mrzZone = extractMrzLines(data.text)
    if (mrzZone) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mrzModule = await import('mrz') as any
        const parseMrz = mrzModule.parse ?? mrzModule.default
        const parsed = parseMrz([mrzZone.line1, mrzZone.line2]) as { valid: boolean; fields: Record<string, string | null> }
        if (parsed.valid) {
          result.mrzLine1 = mrzZone.line1
          result.mrzLine2 = mrzZone.line2
          result.firstName = parsed.fields.firstName ?? undefined
          result.lastName = parsed.fields.lastName ?? undefined
          result.nationality = parsed.fields.nationality ?? undefined
          result.documentNumber = parsed.fields.documentNumber ?? undefined
          if (parsed.fields.birthDate) result.birthDate = parseDate(parsed.fields.birthDate)
          if (parsed.fields.expirationDate) result.documentExpiry = parseDate(parsed.fields.expirationDate)
        }
      } catch { /* MRZ parse failed — on utilise le texte brut */ }
    }

    // 4. Fallback OCR texte libre si MRZ insuffisant
    if (!result.lastName) {
      const nomMatch = data.text.match(/NOM\s*[:\s]+([A-ZÉÈÊÀÂ\s-]+)/i)
      if (nomMatch) result.lastName = nomMatch[1].trim()
    }
    if (!result.firstName) {
      const prenomMatch = data.text.match(/PR[ÉE]NOM\s*[:\s]+([A-ZÉÈÊÀÂa-z\s-]+)/i)
      if (prenomMatch) result.firstName = prenomMatch[1].trim()
    }

  } finally {
    // RGPD CRITIQUE : suppression sécurisée immédiate du fichier
    await secureDelete(filePath)
  }

  return result
}
