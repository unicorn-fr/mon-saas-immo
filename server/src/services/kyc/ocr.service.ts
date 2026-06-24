import { secureDeleteBuffer } from '../../utils/secureDelete.util.js'

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

async function runTesseract(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  // Import dynamique pour éviter le crash au chargement si Tesseract WASM manque
  try {
    const { default: Tesseract } = await import('tesseract.js')
    const { data } = await Tesseract.recognize(buffer, 'fra+eng', { logger: () => {} })
    return { text: data.text, confidence: data.confidence }
  } catch (err) {
    console.warn('[KYC OCR] Tesseract unavailable:', (err as Error).message)
    return { text: '', confidence: 0 }
  }
}

/**
 * Analyse une pièce d'identité (Buffer) via OCR + MRZ.
 * RGPD : le buffer est écrasé en mémoire après extraction.
 */
export async function analyzeIdentityDocument(buffer: Buffer): Promise<OcrResult> {
  const result: OcrResult = { rawText: '', confidence: 0 }

  try {
    // OCR Tesseract (import dynamique — ne crash pas si WASM absent)
    const { text, confidence } = await runTesseract(buffer)
    result.rawText = text
    result.confidence = confidence

    // Parsing MRZ (import dynamique — mrz est ESM-only)
    const mrzZone = extractMrzLines(text)
    if (mrzZone) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mrzModule = await import('mrz') as any
        const parseMrz = mrzModule.parse ?? mrzModule.default?.parse ?? mrzModule.default
        if (typeof parseMrz === 'function') {
          const parsed = parseMrz([mrzZone.line1, mrzZone.line2]) as {
            valid: boolean
            fields: Record<string, string | null>
          }
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
        }
      } catch { /* MRZ parse failed — silent */ }
    }

    // Fallback regex sur texte brut
    if (!result.lastName) {
      const m = text.match(/NOM\s*[:\s]+([A-ZÉÈÊÀÂ\s-]+)/i)
      if (m) result.lastName = m[1].trim()
    }
    if (!result.firstName) {
      const m = text.match(/PR[ÉE]NOM\s*[:\s]+([A-ZÉÈÊÀÂa-z\s-]+)/i)
      if (m) result.firstName = m[1].trim()
    }

  } finally {
    // RGPD : écrasement du buffer en mémoire
    secureDeleteBuffer(buffer)
  }

  return result
}
