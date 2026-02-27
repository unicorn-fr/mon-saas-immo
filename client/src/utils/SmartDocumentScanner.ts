/**
 * SmartDocumentScanner.ts
 * Client-side OCR + keyphrase matching + fraud forensics engine.
 * Uses pdfjs-dist v5 for PDF text extraction, tesseract.js v7 for image OCR,
 * and jsqr for 2D-Doc QR code detection.
 * Zero data leaves the browser — all processing runs locally.
 */

import { luhnSiret } from './validateDocumentIntegrity'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedFields {
  siret?: string
  netSalary?: number
  grossSalary?: number
  salaryRatio?: number   // netSalary / grossSalary
  fiscalRef?: number
  employerName?: string
  dates?: string[]       // all DD/MM/YYYY dates found
}

export interface FraudSignal {
  type:
    | 'keyword_mismatch'
    | 'siret_invalid'
    | 'salary_ratio_anomaly'
    | 'no_2ddoc'
    | 'empty_text'
    | 'editor_metadata'
  severity: 'low' | 'medium' | 'high'
  message: string
}

export interface ScanResult {
  detectedDocType: string | null       // OCR-detected document type
  classificationScore: number          // 0–100 confidence in detected type
  keywords: string[]                   // matching keywords found in text
  extractedFields: ExtractedFields
  fraudSignals: FraudSignal[]
  rawText: string                      // first 3000 chars of extracted text
  hasQrCode: boolean                   // 2D-Doc QR detected
  ocrUsed: boolean                     // true if tesseract ran (image doc)
  scanDurationMs: number
}

// ─── Keyword Classification Map ───────────────────────────────────────────────

const DOC_KEYWORDS: Record<string, { required: string[]; supportive: string[] }> = {
  BULLETIN_1: {
    required: ['net à payer', 'cotisations sociales', 'salaire brut'],
    supportive: ['période', 'employeur', 'siret', 'brut imposable', 'net imposable', 'urssaf', 'congés', 'heures'],
  },
  BULLETIN_2: {
    required: ['net à payer', 'cotisations sociales', 'salaire brut'],
    supportive: ['période', 'employeur', 'siret', 'brut imposable', 'net imposable', 'urssaf'],
  },
  BULLETIN_3: {
    required: ['net à payer', 'cotisations sociales', 'salaire brut'],
    supportive: ['période', 'employeur', 'siret', 'brut imposable', 'net imposable'],
  },
  DERNIER_BULLETIN: {
    required: ['net à payer', 'cotisations sociales', 'salaire brut'],
    supportive: ['période', 'employeur', 'siret', 'brut imposable'],
  },
  AVIS_IMPOSITION_1: {
    required: ['revenu fiscal de référence'],
    supportive: ['n° fiscal', 'numéro fiscal', 'dgfip', 'impôt sur le revenu', 'foyer fiscal', 'avis d\'imposition', 'finances publiques'],
  },
  AVIS_IMPOSITION_2: {
    required: ['revenu fiscal de référence'],
    supportive: ['n° fiscal', 'dgfip', 'impôt sur le revenu', 'finances publiques'],
  },
  CNI: {
    required: ['carte nationale d\'identité'],
    supportive: ['nationalité française', 'née le', 'date de naissance', 'valable jusqu'],
  },
  PASSEPORT: {
    required: ['passeport'],
    supportive: ['nationalité', 'date de naissance', 'lieu de naissance', 'mrz'],
  },
  QUITTANCE_1: {
    required: ['quittance de loyer'],
    supportive: ['loyer', 'charges', 'locataire', 'bailleur', 'période de location'],
  },
  QUITTANCE_2: {
    required: ['quittance de loyer'],
    supportive: ['loyer', 'charges', 'locataire', 'bailleur'],
  },
  QUITTANCE_3: {
    required: ['quittance de loyer'],
    supportive: ['loyer', 'charges', 'locataire'],
  },
  CONTRAT_TRAVAIL: {
    required: ['contrat de travail'],
    supportive: ['employeur', 'salarié', 'cdi', 'cdd', 'embauché', 'durée', 'rémunération'],
  },
  ATTESTATION_EMPLOYEUR: {
    required: ['attestation'],
    supportive: ['employeur', 'salarié', 'date d\'embauche', 'poste', 'salaire'],
  },
  KBIS_SIRET: {
    required: ['extrait kbis', 'registre du commerce'],
    supportive: ['siret', 'siren', 'activité', 'rcs', 'greffe'],
  },
  JUSTIFICATIF_DOMICILE: {
    required: ['facture'],
    supportive: ['domicile', 'adresse', 'consommation', 'eau', 'électricité', 'gaz', 'téléphone'],
  },
  RELEVE_BANCAIRE: {
    required: ['relevé de compte', 'extrait de compte'],
    supportive: ['iban', 'solde', 'débit', 'crédit', 'virement', 'banque'],
  },
  ATTESTATION_VISALE: {
    required: ['visale'],
    supportive: ['action logement', 'garantie', 'caution', 'locataire', 'visa'],
  },
  ACTE_CAUTION: {
    required: ['cautionnement', 'garant'],
    supportive: ['solidaire', 'loyer impayé', 'bailleur', 'caution'],
  },
}

// ─── PDF Text Extraction (pdfjs-dist v5) ─────────────────────────────────────

let pdfjsCache: typeof import('pdfjs-dist') | null = null

async function getPdfjs() {
  if (pdfjsCache) return pdfjsCache
  const lib = await import('pdfjs-dist')
  // pdfjs v5 requires the worker to be configured
  lib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).href
  pdfjsCache = lib
  return lib
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjs = await getPdfjs()
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

    let fullText = ''
    const maxPages = Math.min(pdf.numPages, 6)

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: Record<string, unknown>) => (item as { str: string }).str)
        .join(' ')
      fullText += pageText + '\n'
      if (fullText.length > 8000) break
    }

    return fullText
  } catch (err) {
    console.warn('[Scanner] PDF text extraction failed:', err)
    return ''
  }
}

// ─── Image OCR (tesseract.js v7) ──────────────────────────────────────────────

async function extractImageText(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js')
    // Fresh worker per call for progress tracking (v7 API)
    const w = await createWorker('fra', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100))
        }
      },
    })
    const { data } = await w.recognize(file)
    await w.terminate()
    return data.text
  } catch (err) {
    console.warn('[Scanner] OCR failed:', err)
    return ''
  }
}

// ─── QR Code Detection — 2D-Doc ──────────────────────────────────────────────

async function detectQrCode(file: File): Promise<boolean> {
  try {
    const { default: jsQR } = await import('jsqr')

    let imageData: ImageData | null = null

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const pdfjs = await getPdfjs()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 2.5 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport, canvas }).promise
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    } else if (file.type.startsWith('image/')) {
      const img = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

    if (!imageData) return false
    const qr = jsQR(imageData.data, imageData.width, imageData.height)
    return qr !== null
  } catch {
    return false
  }
}

// ─── Field Extraction via Regex ───────────────────────────────────────────────

function extractFields(text: string): ExtractedFields {
  const lower = text.toLowerCase()
  const fields: ExtractedFields = {}

  // SIRET: 14 consecutive digits (possibly space-separated in groups)
  const siretMatch = text.match(/\b(\d{3}[\s]?\d{3}[\s]?\d{3}[\s]?\d{5})\b/)
  if (siretMatch) {
    fields.siret = siretMatch[1].replace(/\s/g, '')
  }

  // Net salary: "net à payer" followed by amount
  const netMatch = lower.match(/net\s+[àa]\s+payer\D{0,20}?(\d[\d\s]{1,8}[,.]?\d{0,2})/)
  if (netMatch) {
    const raw = netMatch[1].replace(/\s/g, '').replace(',', '.')
    const val = parseFloat(raw)
    if (val > 0 && val < 100000) fields.netSalary = val
  }

  // Gross salary: "salaire brut" followed by amount
  const grossMatch = lower.match(/salaire\s+brut\D{0,20}?(\d[\d\s]{1,8}[,.]?\d{0,2})/)
  if (grossMatch) {
    const raw = grossMatch[1].replace(/\s/g, '').replace(',', '.')
    const val = parseFloat(raw)
    if (val > 0 && val < 100000) fields.grossSalary = val
  }

  if (fields.netSalary && fields.grossSalary && fields.grossSalary > 0) {
    fields.salaryRatio = fields.netSalary / fields.grossSalary
  }

  // Revenu fiscal de référence
  const rfrMatch = lower.match(/revenu\s+fiscal\s+de\s+r[eé]f[eé]rence\D{0,30}?(\d[\d\s]{1,9}[,.]?\d{0,2})/)
  if (rfrMatch) {
    const raw = rfrMatch[1].replace(/\s/g, '').replace(',', '.')
    fields.fiscalRef = parseFloat(raw)
  }

  // Dates: DD/MM/YYYY
  const dateMatches = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g) ?? []
  if (dateMatches.length > 0) fields.dates = [...new Set(dateMatches)].slice(0, 10)

  return fields
}

// ─── Text Classification ─────────────────────────────────────────────────────

function classifyText(
  text: string,
): { docType: string | null; score: number; keywords: string[] } {
  const lower = text.toLowerCase()
  const bestDocType: { type: string; score: number; kws: string[] } = {
    type: '',
    score: 0,
    kws: [],
  }

  for (const [docType, { required, supportive }] of Object.entries(DOC_KEYWORDS)) {
    let score = 0
    const found: string[] = []

    let allRequiredMet = true
    for (const kw of required) {
      if (lower.includes(kw)) {
        score += 35
        found.push(kw)
      } else {
        allRequiredMet = false
      }
    }
    // Only score supportive if at least one required keyword matched
    if (found.length > 0) {
      for (const kw of supportive) {
        if (lower.includes(kw)) {
          score += 8
          found.push(kw)
        }
      }
    }
    // Bonus for all required keywords present
    if (allRequiredMet && required.length > 0) score += 15

    if (score > bestDocType.score) {
      bestDocType.type = docType
      bestDocType.score = score
      bestDocType.kws = found
    }
  }

  if (bestDocType.score < 25) return { docType: null, score: 0, keywords: [] }

  return {
    docType: bestDocType.type,
    score: Math.min(100, bestDocType.score),
    keywords: bestDocType.kws,
  }
}

// Canonical group: BULLETIN_1/2/3/DERNIER → BULLETIN family
function sameDocFamily(a: string | null, b: string): boolean {
  if (!a) return false
  const BULLETIN_FAMILY = new Set(['BULLETIN_1', 'BULLETIN_2', 'BULLETIN_3', 'DERNIER_BULLETIN'])
  const QUITTANCE_FAMILY = new Set(['QUITTANCE_1', 'QUITTANCE_2', 'QUITTANCE_3'])
  const AVIS_FAMILY = new Set(['AVIS_IMPOSITION_1', 'AVIS_IMPOSITION_2'])
  if (BULLETIN_FAMILY.has(a) && BULLETIN_FAMILY.has(b)) return true
  if (QUITTANCE_FAMILY.has(a) && QUITTANCE_FAMILY.has(b)) return true
  if (AVIS_FAMILY.has(a) && AVIS_FAMILY.has(b)) return true
  return a === b
}

// ─── Fraud Signals ────────────────────────────────────────────────────────────

function buildFraudSignals(
  text: string,
  detectedType: string | null,
  providedType: string,
  fields: ExtractedFields,
  hasQr: boolean,
): FraudSignal[] {
  const signals: FraudSignal[] = []

  // 1. Empty / unreadable document
  if (text.trim().length < 50) {
    signals.push({
      type: 'empty_text',
      severity: 'medium',
      message:
        "Le document semble être une image scannée à faible résolution ou un PDF sans couche texte.",
    })
  }

  // 2. Document type mismatch
  if (detectedType && !sameDocFamily(detectedType, providedType)) {
    signals.push({
      type: 'keyword_mismatch',
      severity: 'high',
      message: `Le contenu ne correspond pas à la catégorie déclarée — format inhabituel détecté. Veuillez fournir une version originale non modifiée.`,
    })
  }

  // 3. SIRET Luhn
  if (fields.siret) {
    if (!luhnSiret(fields.siret)) {
      signals.push({
        type: 'siret_invalid',
        severity: 'high',
        message: `Le numéro SIRET extrait (${fields.siret}) est mathématiquement invalide — ce numéro d'entreprise n'existe pas.`,
      })
    }
  }

  // 4. Net/Gross ratio
  if (fields.salaryRatio !== undefined) {
    const r = fields.salaryRatio
    if (r < 0.65 || r > 0.95) {
      signals.push({
        type: 'salary_ratio_anomaly',
        severity: r < 0.50 || r > 1.05 ? 'high' : 'medium',
        message: `Ratio Net/Brut de ${(r * 100).toFixed(1)} % en dehors de la norme française (72–82 %). Ce document présente des valeurs incohérentes.`,
      })
    }
  }

  // 5. 2D-Doc absent for tax notices
  const TAX_TYPES = new Set(['AVIS_IMPOSITION_1', 'AVIS_IMPOSITION_2'])
  if (TAX_TYPES.has(providedType) && !hasQr) {
    signals.push({
      type: 'no_2ddoc',
      severity: 'medium',
      message:
        "Aucun QR code 2D-Doc détecté. Les avis d'imposition officiels DGFIP comportent systématiquement ce code d'authenticité.",
    })
  }

  return signals
}

// ─── Main Public API ──────────────────────────────────────────────────────────

export async function scanDocument(
  file: File,
  providedDocType: string,
  onProgress?: (phase: 'pdf' | 'ocr' | 'qr' | 'done', pct: number) => void,
): Promise<ScanResult> {
  const t0 = Date.now()
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImage = file.type.startsWith('image/')
  let rawText = ''
  let ocrUsed = false

  if (isPdf) {
    onProgress?.('pdf', 10)
    rawText = await extractPdfText(file)
    onProgress?.('pdf', 60)
  } else if (isImage) {
    ocrUsed = true
    onProgress?.('ocr', 5)
    rawText = await extractImageText(file, (pct) => onProgress?.('ocr', pct))
    onProgress?.('ocr', 90)
  }

  onProgress?.('qr', 5)
  const hasQrCode = await detectQrCode(file)
  onProgress?.('qr', 100)

  const { docType, score, keywords } = classifyText(rawText)
  const extractedFields = extractFields(rawText)
  const fraudSignals = buildFraudSignals(rawText, docType, providedDocType, extractedFields, hasQrCode)

  // Penalize classification score for each fraud signal
  const highCount = fraudSignals.filter((s) => s.severity === 'high').length
  const medCount = fraudSignals.filter((s) => s.severity === 'medium').length
  const adjustedScore = Math.max(0, score - highCount * 20 - medCount * 8)

  onProgress?.('done', 100)

  return {
    detectedDocType: docType,
    classificationScore: adjustedScore,
    keywords,
    extractedFields,
    fraudSignals,
    rawText: rawText.slice(0, 3000),
    hasQrCode,
    ocrUsed,
    scanDurationMs: Date.now() - t0,
  }
}

// ─── Cross-document coherence check ──────────────────────────────────────────

/**
 * Given multiple scan results for salary docs, verify SIRET consistency.
 * Returns a warning message if SIRETs differ across bulletins.
 */
export function checkCrossDocumentCoherence(
  results: Array<{ docType: string; scan: ScanResult }>,
): string[] {
  const warnings: string[] = []

  const bulletinResults = results.filter((r) =>
    ['BULLETIN_1', 'BULLETIN_2', 'BULLETIN_3', 'DERNIER_BULLETIN'].includes(r.docType),
  )

  const sirets = bulletinResults
    .map((r) => r.scan.extractedFields.siret)
    .filter(Boolean) as string[]

  if (sirets.length > 1) {
    const unique = [...new Set(sirets)]
    if (unique.length > 1) {
      warnings.push(
        `Incohérence SIRET détectée entre plusieurs bulletins de salaire : ${unique.join(' / ')}. Tous les bulletins doivent provenir du même employeur.`,
      )
    }
  }

  return warnings
}

// ─── Proof-of-Life Challenge generator ───────────────────────────────────────

const EVERYDAY_OBJECTS = [
  'une fourchette',
  'une cuillère',
  'un stylo bille',
  'un livre fermé',
  'une tasse ou un mug',
  'un trousseau de clés',
  'une télécommande',
  'une bouteille d\'eau',
  'un crayon de papier',
  'des ciseaux',
  'un carnet ou cahier',
  'une montre',
]

export function generateProofOfLifeObject(): string {
  return EVERYDAY_OBJECTS[Math.floor(Math.random() * EVERYDAY_OBJECTS.length)]
}
