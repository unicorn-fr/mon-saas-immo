import { useCallback, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedDocument {
  lastName?: string
  firstName?: string
  birthDate?: string       // YYYY-MM-DD
  birthPlace?: string
  sex?: 'M' | 'F'
  documentNumber?: string
  documentExpiry?: string  // YYYY-MM-DD
  nationality?: string
  issuedDate?: string      // permis
  issuingAuthority?: string
  licenseCategories?: string[]
  mrzLine1?: string
  mrzLine2?: string
  mrzLine3?: string
  mrzValid?: boolean
  confidence: number       // 0-1
  validationScore: number  // 0-1 (required fields found)
  validFields: string[]
  missingFields: string[]
  rawText: string
  isValid: boolean
}

export interface DocumentOCRState {
  isProcessing: boolean
  progress: number         // 0-100
  stage: string
  result: ExtractedDocument | null
  error: string | null
}

// ─── Image preprocessing ──────────────────────────────────────────────────────

async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  if (!file.type.startsWith('image/')) {
    throw new Error(
      `Format non supporté : ${file.type || 'inconnu'}.\n` +
      `Veuillez fournir une photo JPG, PNG ou WebP de votre document.\n` +
      `Les fichiers Word, PDF et autres formats ne permettent pas la reconnaissance automatique.`
    )
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Scale up to at least 1600px wide for good OCR (≈300 DPI equivalent)
      const scale = Math.max(1, 1600 / img.width)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas)
    }
    img.onerror = () => reject(new Error('Impossible de charger l\'image. Vérifiez qu\'elle n\'est pas corrompue.'))
    img.src = URL.createObjectURL(file)
  })
}

function preprocessForOCR(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Convert to grayscale with contrast enhancement
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    // Contrast stretch: darken darks, brighten brights
    const enhanced = Math.min(255, Math.max(0, (gray - 80) * 1.6))
    data[i] = data[i + 1] = data[i + 2] = enhanced
    // alpha unchanged
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function preprocessForMRZ(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Strong binarization for MRZ monospaced font
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    const bin = gray > 145 ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = bin
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function cropMRZZone(source: HTMLCanvasElement): HTMLCanvasElement {
  // MRZ is in the bottom ~22% of the document
  const mrzHeight = Math.floor(source.height * 0.22)
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = mrzHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, source.height - mrzHeight, source.width, mrzHeight, 0, 0, source.width, mrzHeight)
  return canvas
}

// ─── Tesseract runner ─────────────────────────────────────────────────────────

interface TesseractResult { text: string; confidence: number }

async function runTesseract(
  canvas: HTMLCanvasElement,
  psm: number,
  whitelist?: string,
  onProgress?: (p: number) => void
): Promise<TesseractResult> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('fra', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  try {
    const params: Record<string, string> = {
      tessedit_pageseg_mode: String(psm),
      preserve_interword_spaces: '1',
    }
    if (whitelist) params.tessedit_char_whitelist = whitelist

    await worker.setParameters(params)
    const { data } = await worker.recognize(canvas)
    return { text: data.text, confidence: data.confidence }
  } finally {
    await worker.terminate()
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDateFr(raw: string): string | undefined {
  // Formats: DD.MM.YYYY  DD/MM/YYYY  DD-MM-YYYY
  const m = raw.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/)
  if (!m) return undefined
  const dd = m[1].padStart(2, '0')
  const mm = m[2].padStart(2, '0')
  const yyyy = m[3]
  const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd))
  if (isNaN(d.getTime())) return undefined
  return `${yyyy}-${mm}-${dd}`
}

function parseMRZDate(yymmdd: string): string | undefined {
  if (!yymmdd || yymmdd.length < 6) return undefined
  const yy = parseInt(yymmdd.substring(0, 2))
  const mm = yymmdd.substring(2, 4)
  const dd = yymmdd.substring(4, 6)
  const year = yy > 30 ? 1900 + yy : 2000 + yy
  return `${year}-${mm}-${dd}`
}

// ─── MRZ detection ────────────────────────────────────────────────────────────

function findMRZLines(text: string): string[] | null {
  // Normalize: remove spaces inside potential MRZ lines
  const lines = text
    .split('\n')
    .map(l => l.trim().replace(/\s+/g, ''))
    .filter(l => l.length >= 26)

  // TD1: 3 lines of ~30 chars (French CNI)
  const td1 = lines.filter(l => l.length >= 28 && l.length <= 32 && /^[A-Z0-9<]{28,}$/.test(l))
  if (td1.length >= 3) {
    const normalized = td1.slice(-3).map(l => l.substring(0, 30).padEnd(30, '<'))
    return normalized
  }

  // TD3: 2 lines of ~44 chars (passport)
  const td3 = lines.filter(l => l.length >= 42 && l.length <= 46 && /^[A-Z0-9<]{42,}$/.test(l))
  if (td3.length >= 2) {
    return td3.slice(-2).map(l => l.substring(0, 44))
  }

  return null
}

async function parseMRZWithPackage(lines: string[]): Promise<Record<string, string> | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mrzModule = await import('mrz') as any
    const parseFn = mrzModule.parse ?? mrzModule.default?.parse ?? mrzModule.default
    if (typeof parseFn !== 'function') return null
    const result = parseFn(lines)
    if (!result) return null
    // Return fields only if valid
    if (result.valid === false && !result.fields?.lastName) return null
    return result.fields ?? null
  } catch {
    return null
  }
}

// ─── French CNI field extractor ───────────────────────────────────────────────

async function extractCNIFields(
  fullText: string,
  mrzText: string
): Promise<Partial<ExtractedDocument>> {
  const result: Partial<ExtractedDocument> = {}
  const combined = `${fullText}\n${mrzText}`

  // 1. MRZ parsing (most reliable)
  const mrzLines = findMRZLines(combined)
  if (mrzLines) {
    result.mrzLine1 = mrzLines[0]
    result.mrzLine2 = mrzLines[1]
    result.mrzLine3 = mrzLines[2]

    const fields = await parseMRZWithPackage(mrzLines)
    if (fields) {
      result.mrzValid = true
      result.firstName = fields.firstName || undefined
      result.lastName = fields.lastName || undefined
      result.documentNumber = fields.documentNumber || undefined
      result.nationality = fields.nationality || undefined
      if (fields.birthDate) result.birthDate = parseMRZDate(fields.birthDate)
      if (fields.expirationDate) result.documentExpiry = parseMRZDate(fields.expirationDate)
      const s = fields.sex
      if (s === 'M' || s === 'F') result.sex = s
    }
  }

  // 2. Regex fallback on full text
  const t = fullText

  if (!result.lastName) {
    const m = t.match(/(?:Nom\s*(?:de\s+famille)?|NOM)[:\s*]+([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒ\-\s]{2,30}?)(?:\n|Pr[ée]nom|$)/im)
    if (m) result.lastName = m[1].trim().toUpperCase().replace(/\s+/g, ' ')
  }

  if (!result.firstName) {
    const m = t.match(/(?:Pr[ée]nom(?:s)?|PRÉNOM)[:\s*]+([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒa-záéèêàâîôùûüçæœ\-\s]{2,40}?)(?:\n|N[ée]|Date|$)/im)
    if (m) result.firstName = m[1].trim().replace(/\s+/g, ' ')
  }

  if (!result.birthDate) {
    const m = t.match(/(?:N[ée](?:\(e\))?\s+le|date\s+de\s+naissance)[:\s]+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/im)
    if (m) result.birthDate = parseDateFr(m[1])
  }

  if (!result.birthPlace) {
    const m = t.match(/(?:à|lieu\s+de\s+naissance)[:\s]+([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒa-záéèêàâîôùûüçæœ\-\s]{2,30}?)(?:\n|Taille|Sex|$)/im)
    if (m) result.birthPlace = m[1].trim()
  }

  if (!result.documentExpiry) {
    const m = t.match(/(?:valable\s+jusqu(?:'|'|')au|date\s+de\s+(?:fin\s+de\s+)?validit[ée]|fin\s+de\s+validit[ée])[:\s]+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/im)
    if (m) result.documentExpiry = parseDateFr(m[1])
  }

  if (!result.documentNumber) {
    // CNI new format: 9 digits or alphanumeric e.g. "07CB01020"
    const m = t.match(/(?:n[°o]\.?\s*(?:national|carte|pièce|de\s+la\s+carte)|numéro)[:\s]+([A-Z0-9]{7,15})/im)
    if (m) result.documentNumber = m[1].trim()
    // Fallback: bare 9-digit number on its own line
    if (!result.documentNumber) {
      const m2 = t.match(/^([A-Z0-9]{9,12})$/m)
      if (m2 && /\d/.test(m2[1])) result.documentNumber = m2[1].trim()
    }
  }

  if (!result.nationality) {
    if (/fran[çc]ais|french|FRA\b/i.test(t)) result.nationality = 'FRA'
  }

  return result
}

// ─── French Permis de Conduire field extractor ────────────────────────────────

async function extractPermisFields(fullText: string): Promise<Partial<ExtractedDocument>> {
  const result: Partial<ExtractedDocument> = {}
  const t = fullText

  // Champ 1. — NOM (présent sans label "NOM", juste le numéro de champ)
  const nom1 = t.match(/(?:^|\n)\s*1[.:\)]\s*([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒ][A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒA-Za-záéèêàâîôùûüçæœ\-\s]{1,30}?)(?=\s*\n|\s*2[.:\)])/m)
  if (nom1) result.lastName = nom1[1].trim().toUpperCase()

  // Champ 2. — Prénom(s)
  const nom2 = t.match(/(?:^|\n)\s*2[.:\)]\s*([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒa-záéèêàâîôùûüçæœ\-\s]{2,40}?)(?=\s*\n|\s*3[.:\)])/m)
  if (nom2) result.firstName = nom2[1].trim()

  // Champ 3. — Date/lieu de naissance (format DD.MM.YYYY suivi de la ville)
  const birth = t.match(/(?:^|\n)\s*3[.:\)]\s*(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})\s*(.{2,40}?)(?=\s*\n|\s*4[a-z.:\)]|$)/im)
  if (birth) {
    result.birthDate = parseDateFr(birth[1])
    result.birthPlace = birth[2]?.trim() || undefined
  }

  // Champ 4a. — Date de délivrance
  const del = t.match(/4\s*[a]\s*[.:\)]\s*(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/im)
  if (del) result.issuedDate = parseDateFr(del[1])

  // Champ 4b. — Date d'expiration
  const exp = t.match(/4\s*[b]\s*[.:\)]\s*(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/im)
  if (exp) result.documentExpiry = parseDateFr(exp[1])

  // Champ 4c. — Autorité délivrante (code préfecture ou ANTS)
  const auth = t.match(/4\s*[c]\s*[.:\)]\s*([A-Z0-9\-\s]{2,40}?)(?=\s*\n)/im)
  if (auth) result.issuingAuthority = auth[1].trim()

  // Champ 5. — Numéro du permis
  const num = t.match(/(?:^|\n)\s*5[.:\)]\s*([A-Z0-9\-]{5,20})/im)
  if (num) result.documentNumber = num[1].trim()

  // Catégories (B, A, AM, A1, A2, C, CE, D...)
  const catPattern = /\b(AM|A[12]?|B[E]?|C[1]?[E]?|D[1]?[E]?)\b/g
  const cats = [...new Set([...t.matchAll(catPattern)].map(m => m[1]))]
  if (cats.length > 0) result.licenseCategories = cats

  // Fallback: cherche NOM et PRÉNOM s'ils sont étiquetés explicitement
  if (!result.lastName) {
    const m = t.match(/NOM\s*[:\s]+([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒ][A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒ\-\s]{1,30}?)(?=\n|PR[ÉE])/im)
    if (m) result.lastName = m[1].trim().toUpperCase()
  }

  if (!result.firstName) {
    const m = t.match(/PR[ÉE]NOM(?:S)?\s*[:\s]+([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒa-z\-\s]{2,40}?)(?=\n|Date|$)/im)
    if (m) result.firstName = m[1].trim()
  }

  return result
}

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED: Record<'CNI' | 'PERMIS_CONDUIRE', string[]> = {
  CNI: ['lastName', 'firstName', 'birthDate', 'documentNumber'],
  PERMIS_CONDUIRE: ['lastName', 'firstName', 'birthDate'],
}

const OPTIONAL: Record<'CNI' | 'PERMIS_CONDUIRE', string[]> = {
  CNI: ['nationality', 'documentExpiry', 'mrzValid', 'birthPlace', 'sex'],
  PERMIS_CONDUIRE: ['documentNumber', 'documentExpiry', 'licenseCategories', 'issuedDate', 'birthPlace'],
}

const FIELD_LABELS: Record<string, string> = {
  lastName: 'Nom de famille',
  firstName: 'Prénom(s)',
  birthDate: 'Date de naissance',
  documentNumber: 'Numéro de document',
  nationality: 'Nationalité',
  documentExpiry: 'Date d\'expiration',
  mrzValid: 'Zone MRZ (puce machine)',
  birthPlace: 'Lieu de naissance',
  sex: 'Sexe',
  issuedDate: 'Date de délivrance',
  licenseCategories: 'Catégories',
}

function validateExtracted(
  data: Partial<ExtractedDocument>,
  docType: 'CNI' | 'PERMIS_CONDUIRE'
): Pick<ExtractedDocument, 'validationScore' | 'validFields' | 'missingFields' | 'isValid'> {
  const required = REQUIRED[docType]
  const optional = OPTIONAL[docType]
  const validFields: string[] = []
  const missingFields: string[] = []

  for (const field of required) {
    const val = data[field as keyof typeof data]
    const found = val !== undefined && val !== null && val !== '' && val !== false
    if (found) validFields.push(field)
    else missingFields.push(field)
  }

  for (const field of optional) {
    const val = data[field as keyof typeof data]
    const found = val !== undefined && val !== null && val !== '' && (Array.isArray(val) ? val.length > 0 : val !== false)
    if (found) validFields.push(field)
  }

  const requiredFound = validFields.filter(f => required.includes(f)).length
  const validationScore = requiredFound / required.length
  const isValid = validationScore >= 0.5 // au moins 2 champs requis sur 4

  return { validationScore, validFields, missingFields, isValid }
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useDocumentOCR() {
  const [state, setState] = useState<DocumentOCRState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    result: null,
    error: null,
  })

  const analyzeDocument = useCallback(async (
    file: File,
    docType: 'CNI' | 'PERMIS_CONDUIRE'
  ): Promise<ExtractedDocument | null> => {
    setState({ isProcessing: true, progress: 0, stage: 'Chargement de l\'image…', result: null, error: null })

    try {
      // Step 1: Load image
      let canvas: HTMLCanvasElement
      try {
        canvas = await fileToCanvas(file)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Format non supporté'
        setState(s => ({ ...s, isProcessing: false, error: msg }))
        return null
      }

      setState(s => ({ ...s, progress: 15, stage: 'Optimisation de l\'image…' }))

      // Step 2: Preprocess
      const processed = preprocessForOCR(canvas)

      setState(s => ({ ...s, progress: 25, stage: 'Analyse OCR du document…' }))

      // Step 3: Full document OCR (PSM 6 = single block)
      let fullText = ''
      let confidence = 0
      try {
        const res = await runTesseract(processed, 6, undefined, p => {
          setState(s => ({ ...s, progress: 25 + Math.round(p * 0.4) }))
        })
        fullText = res.text
        confidence = res.confidence
      } catch { /* Tesseract unavailable — continue with empty text */ }

      setState(s => ({ ...s, progress: 68, stage: docType === 'CNI' ? 'Recherche de la zone MRZ…' : 'Extraction des champs…' }))

      // Step 4: MRZ zone OCR (CNI only — permis has no MRZ)
      let mrzText = ''
      if (docType === 'CNI') {
        try {
          const mrzCanvas = cropMRZZone(canvas)
          const mrzProcessed = preprocessForMRZ(mrzCanvas)
          // PSM 7 = single line, whitelist alphanum + <
          const res = await runTesseract(
            mrzProcessed, 7,
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
            p => setState(s => ({ ...s, progress: 68 + Math.round(p * 0.15) }))
          )
          mrzText = res.text
        } catch { /* ignore */ }
      }

      setState(s => ({ ...s, progress: 85, stage: 'Extraction des informations…' }))

      // Step 5: Extract fields
      const extracted = docType === 'CNI'
        ? await extractCNIFields(fullText, mrzText)
        : await extractPermisFields(fullText)

      setState(s => ({ ...s, progress: 95, stage: 'Validation…' }))

      // Step 6: Validate
      const validation = validateExtracted(extracted, docType)

      const result: ExtractedDocument = {
        ...extracted,
        confidence: confidence / 100,
        rawText: fullText,
        ...validation,
      }

      setState({ isProcessing: false, progress: 100, stage: 'Terminé', result, error: null })
      return result

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de l\'analyse'
      setState(s => ({ ...s, isProcessing: false, error: msg }))
      return null
    }
  }, [])

  return { ...state, analyzeDocument, FIELD_LABELS }
}
