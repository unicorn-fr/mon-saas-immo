/**
 * OCR Document Service — Backend enterprise-grade
 *
 * Pipeline :
 *   1. sharp  → preprocessing pixel-level (grayscale, CLAHE, unsharp, binarisation)
 *   2. Google Cloud Vision API (si GOOGLE_VISION_API_KEY défini) → précision enterprise
 *   3. Tesseract.js serveur tessdata_best (fallback) → bien meilleur que le browser
 *
 * Avantages vs browser Tesseract :
 *   - sharp : preprocessing réel (CLAHE, morphologie) vs CSS filters limités
 *   - tessdata_best : ~3× plus précis que tessdata_fast
 *   - Pas de limite mémoire browser (gros documents ok)
 *   - Worker réutilisable entre requêtes (chaud dès la 2e requête)
 */

import sharp from 'sharp'
import path from 'path'
import os from 'os'
import { analyzeWithMindee, type MindeeStructuredFields } from './mindeeOcr.service.js'
import { ocrWithDoctr, preloadDoctrWorker } from './doctrOcr.service.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OcrPassResult {
  text: string
  confidence: number   // 0-100
  engine: 'google-vision' | 'tesseract-best' | 'tesseract-fast'
}

export interface OcrDocumentResult {
  fullText: string
  textZoneText: string
  mrzText: string
  confidence: number
  engine: string
  structuredFields?: MindeeStructuredFields  // Champs directs (Mindee) — skip regex côté client
}

// ─── Persistent Tesseract worker ─────────────────────────────────────────────

// Worker réutilisé entre requêtes — pas de réinitialisation à chaque appel
let _workerPromise: Promise<import('tesseract.js').Worker> | null = null

// tessdata_best : modèle LSTM haute précision (fra ~25 MB, dl une seule fois)
const TESSDATA_BEST_PATH = path.join(os.tmpdir(), 'tessdata_best_cache')
const TESSDATA_BEST_CDN = 'https://tessdata.projectnaptha.com/4.0.0_best/'

async function getTesseractWorker(): Promise<import('tesseract.js').Worker> {
  if (!_workerPromise) {
    _workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('fra', 1, {
        langPath: TESSDATA_BEST_CDN,
        cachePath: TESSDATA_BEST_PATH,
        logger: () => {},
      })
      return worker
    })()
  }
  return _workerPromise
}

// Pré-chauffe les workers au démarrage
export function preloadOcrWorker() {
  getTesseractWorker().catch(e => console.warn('[OCR] Preload Tesseract warning:', e?.message))
  preloadDoctrWorker()  // Lance le subprocess Python doctr en arrière-plan
}

// ─── Sharp preprocessing ──────────────────────────────────────────────────────

/**
 * Prétraitement complet document — équivalent CLAHE + unsharp masking.
 * sharp est un binding C++ libvips — incomparablement plus précis que les filtres CSS.
 */
async function preprocessFull(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .grayscale()
    .normalize()                       // auto-niveaux (CLAHE global)
    .sharpen({ sigma: 1.2, m1: 1.0, m2: 2.5 })  // unsharp masking
    .linear(1.3, -15)                  // boost contraste
    .toBuffer()
}

/**
 * Zone texte CNI recto (côté droit, sans photo) : x=36%, y=0%, w=64%, h=78%.
 * Fort contraste pour la lecture nom/prénom sur fond guilloché.
 */
async function preprocessTextZone(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 1, h = meta.height ?? 1
  return sharp(buffer)
    .extract({
      left: Math.round(w * 0.36), top: 0,
      width: Math.round(w * 0.64), height: Math.round(h * 0.78),
    })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.5, m1: 1.5, m2: 3.0 })
    .linear(1.5, -20)
    .toBuffer()
}

/**
 * Zone MRZ : bas 22% du document, binarisation agressive OCR-B.
 * threshold=140 → texte noir / fond blanc net → Tesseract lit bien l'OCR-B.
 */
async function preprocessMRZ(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 1, h = meta.height ?? 1
  return sharp(buffer)
    .extract({
      left: 0, top: Math.round(h * 0.78),
      width: w, height: Math.round(h * 0.22),
    })
    .grayscale()
    .normalize()
    .linear(2.5, -130)    // pousse les pixels vers blanc ou noir
    .threshold(140)        // binarisation (OCR-B est à fort contraste)
    .toBuffer()
}

/**
 * Zone nom/prénom/date permis (côté droit, hors photo) : x=36%, y=4%, w=64%, h=52%.
 */
async function preprocessPermisNameZone(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 1, h = meta.height ?? 1
  return sharp(buffer)
    .extract({
      left: Math.round(w * 0.36), top: Math.round(h * 0.04),
      width: Math.round(w * 0.64), height: Math.round(h * 0.52),
    })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.5, m1: 1.5, m2: 3.0 })
    .linear(1.4, -15)
    .toBuffer()
}

/**
 * Zone inférieure permis (numéros, dates, catégories) : y=52%, h=48%.
 */
async function preprocessPermisLowerZone(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width ?? 1, h = meta.height ?? 1
  return sharp(buffer)
    .extract({
      left: 0, top: Math.round(h * 0.52),
      width: w, height: Math.round(h * 0.48),
    })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.2, m1: 1.0, m2: 2.0 })
    .linear(1.3, -10)
    .toBuffer()
}

// ─── Google Cloud Vision ──────────────────────────────────────────────────────

async function ocrWithGoogleVision(imageBuffer: Buffer): Promise<string | null> {
  const key = process.env.GOOGLE_VISION_API_KEY
  if (!key) return null

  try {
    const base64 = imageBuffer.toString('base64')
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
            imageContext: { languageHints: ['fr', 'fr-t-i0-handwrit'] },
          }],
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json() as { responses?: Array<{ fullTextAnnotation?: { text?: string } }> }
    return data.responses?.[0]?.fullTextAnnotation?.text ?? null
  } catch (e) {
    console.warn('[OCR] Google Vision error:', (e as Error)?.message)
    return null
  }
}

// ─── Tesseract server-side ────────────────────────────────────────────────────

async function ocrWithTesseract(
  buffer: Buffer,
  psm: number,
  whitelist?: string
): Promise<{ text: string; confidence: number }> {
  try {
    const worker = await getTesseractWorker()
    const params: Record<string, string> = {
      tessedit_pageseg_mode: String(psm),
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0',
    }
    if (whitelist) params.tessedit_char_whitelist = whitelist
    await worker.setParameters(params)
    const { data } = await worker.recognize(buffer)
    return { text: data.text ?? '', confidence: data.confidence ?? 0 }
  } catch (e) {
    console.error('[OCR] Tesseract error:', (e as Error)?.message)
    return { text: '', confidence: 0 }
  }
}

// ─── Main service ─────────────────────────────────────────────────────────────

export async function analyzeDocumentOCR(
  imageBuffer: Buffer,
  docType: 'CNI' | 'PERMIS_CONDUIRE'
): Promise<OcrDocumentResult> {

  // Redimensionne si trop grand (>3 MP) → optimal pour tous les moteurs
  const normalizedBuffer = await sharp(imageBuffer)
    .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer()

  // ── 1. Mindee Document AI (priorité absolue si clé disponible) ──
  // Modèle deep learning entraîné sur des centaines de milliers de CNI/permis français.
  // Retourne les champs structurés directement — aucune regex requise.
  const mindeeFields = await analyzeWithMindee(normalizedBuffer, docType)
  if (mindeeFields && (mindeeFields.lastName || mindeeFields.firstName)) {
    return {
      fullText: '',
      textZoneText: '',
      mrzText: [mindeeFields.mrzLine1, mindeeFields.mrzLine2, mindeeFields.mrzLine3].filter(Boolean).join('\n'),
      confidence: mindeeFields.confidence,
      engine: 'mindee',
      structuredFields: mindeeFields,
    }
  }

  // ── 2. doctr — modèle open source de Mindee (subprocess Python, si installé) ──
  // db_resnet50 (détection) + crnn_mobilenet_v3_large (reconnaissance)
  // Même technologie que l'API Mindee — entièrement gratuit, MIT License.
  const doctrResult = await ocrWithDoctr(normalizedBuffer, docType)
  if (doctrResult && doctrResult.fullText.length > 20) {
    return {
      fullText:     doctrResult.fullText,
      textZoneText: doctrResult.textZoneText,
      mrzText:      doctrResult.mrzText,
      confidence:   doctrResult.confidence,
      engine:       'doctr',
    }
  }

  // ── 3. Essai Google Vision (si clé disponible) ──
  const visionText = await ocrWithGoogleVision(normalizedBuffer)
  if (visionText && visionText.length > 30) {
    // Google Vision donne un texte unique de haute qualité.
    // On extrait quand même les zones pour la compatibilité avec extractCNIFields.
    const textZoneBuf = docType === 'CNI'
      ? await preprocessTextZone(normalizedBuffer)
      : await preprocessPermisNameZone(normalizedBuffer)
    const mrzBuf = await preprocessMRZ(normalizedBuffer)

    const [textZoneResult, mrzResult] = await Promise.all([
      ocrWithTesseract(textZoneBuf, 3),
      ocrWithTesseract(mrzBuf, 6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'),
    ])

    return {
      fullText: visionText,
      textZoneText: textZoneResult.text,
      mrzText: mrzResult.text,
      confidence: 95,
      engine: 'google-vision',
    }
  }

  // ── 4. Tesseract server-side avec tessdata_best + sharp preprocessing ──
  const [fullBuf, textZoneBuf, mrzBuf, lowerBuf] = await Promise.all([
    preprocessFull(normalizedBuffer),
    docType === 'CNI'
      ? preprocessTextZone(normalizedBuffer)
      : preprocessPermisNameZone(normalizedBuffer),
    preprocessMRZ(normalizedBuffer),
    docType === 'PERMIS_CONDUIRE'
      ? preprocessPermisLowerZone(normalizedBuffer)
      : Promise.resolve(Buffer.alloc(0)),
  ])

  const [fullResult, textZoneResult, mrzResult, lowerResult] = await Promise.all([
    ocrWithTesseract(fullBuf, 11),     // PSM 11 : sparse text, tout le document
    ocrWithTesseract(textZoneBuf, 3),  // PSM 3 : auto-colonnes (labels + valeurs CNI/permis)
    ocrWithTesseract(mrzBuf, 6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'),  // PSM 6 : bloc uniforme MRZ
    lowerBuf.length > 0
      ? ocrWithTesseract(lowerBuf, 6)  // PSM 6 : zone inférieure permis
      : Promise.resolve({ text: '', confidence: 0 }),
  ])

  const textZoneCombined = docType === 'PERMIS_CONDUIRE'
    ? `${textZoneResult.text}\n${lowerResult.text}`
    : textZoneResult.text

  return {
    fullText: fullResult.text,
    textZoneText: textZoneCombined,
    mrzText: mrzResult.text,
    confidence: Math.round((fullResult.confidence + textZoneResult.confidence) / 2),
    engine: 'tesseract-best',
  }
}
