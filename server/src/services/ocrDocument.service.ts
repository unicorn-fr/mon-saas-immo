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
import { analyzeWithGemini, type GeminiStructuredFields } from './geminiOcr.service.js'
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
  structuredFields?: MindeeStructuredFields | GeminiStructuredFields  // Champs directs — skip regex
  spatialFields?: import('./doctrOcr.service.js').DoctrFields  // Champs extraits par position (doctr)
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

// ─── Tesseract field extractor ────────────────────────────────────────────────

/** Convertit YYMMDD MRZ → YYYY-MM-DD. YY < 30 → 20YY, sinon 19YY */
function mrzDateToISO(yymmdd: string): string | undefined {
  if (!/^\d{6}$/.test(yymmdd)) return undefined
  const yy = parseInt(yymmdd.slice(0, 2), 10)
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  const yyyy = yy < 30 ? `20${String(yy).padStart(2, '0')}` : `19${String(yy).padStart(2, '0')}`
  return `${yyyy}-${mm}-${dd}`
}

/** Capitalise un token : premier caractère majuscule, reste minuscule */
function capitalizeToken(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** Normalise une date DD/MM/YYYY ou DD.MM.YYYY → YYYY-MM-DD */
function normalizeDateStr(raw: string): string | undefined {
  const m = raw.match(/(\d{1,2})[.\/\-](\d{2})[.\/\-](\d{4})/)
  if (!m) return undefined
  const dd = m[1].padStart(2, '0')
  const mm = m[2].padStart(2, '0')
  const yyyy = m[3]
  return `${yyyy}-${mm}-${dd}`
}

// Mots à exclure du fallback CAPS (ne sont pas des noms)
const CAPS_BLACKLIST = new Set([
  'FRANCE', 'REPUBLIQUE', 'NATIONALE', 'IDENTITE', 'CARTE', 'EUROPEENNE',
  'NOM', 'PRENOM', 'PRENOMS', 'NAISSANCE', 'DATE', 'SEXE', 'NATIONALITE',
  'VALIDITE', 'DELIVREE', 'AUTORITE', 'PERMIS', 'CONDUIRE', 'CATEGORIE',
])

/**
 * Extraction heuristique des champs à partir du texte brut OCR.
 * Priorité : MRZ ICAO TD1 > labels visuels > fallback CAPS.
 */
export function extractFieldsFromOCRText(
  fullText: string,
  textZoneText: string,
  mrzText: string,
  docType: 'CNI' | 'PERMIS_CONDUIRE',
): MindeeStructuredFields | null {

  // ── Étape 1 : MRZ ICAO TD1 (3 lignes de 30 chars) ──────────────────────────
  // Cherche dans mrzText ET fullText
  const combinedForMRZ = `${mrzText}\n${fullText}`
  const lines = combinedForMRZ.split(/\r?\n/).map(l => l.replace(/\s/g, '').toUpperCase())
  const mrzLinePattern = /^[A-Z0-9<]{25,36}$/

  let mrzL1 = '', mrzL2 = '', mrzL3 = ''
  for (let i = 0; i < lines.length - 1; i++) {
    if (mrzLinePattern.test(lines[i]) && mrzLinePattern.test(lines[i + 1])) {
      if (i + 2 < lines.length && mrzLinePattern.test(lines[i + 2])) {
        // TD1 : 3 lignes (CNI française)
        mrzL1 = lines[i]
        mrzL2 = lines[i + 1]
        mrzL3 = lines[i + 2]
        break
      } else {
        // TD3 : 2 lignes (passeport) — on ne gère que lastName/firstName depuis ligne 2
        mrzL2 = lines[i]
        mrzL3 = lines[i + 1]
        break
      }
    }
  }

  let lastNameMRZ: string | undefined
  let firstNameMRZ: string | undefined
  let birthDateMRZ: string | undefined
  let expiryMRZ: string | undefined
  let sexMRZ: 'M' | 'F' | undefined
  let mrzConfidence = 0

  if (mrzL3) {
    // Ligne de noms (TD1 → L3, TD3 → L2/L3)
    const nameLine = mrzL3.includes('<<') ? mrzL3 : mrzL2
    if (nameLine.includes('<<')) {
      const parts = nameLine.split('<<')
      const rawLast = parts[0].replace(/</g, ' ').trim()
      const rawFirst = (parts[1] ?? '').split('<').filter(Boolean)[0] ?? ''
      if (rawLast.length >= 2) lastNameMRZ = rawLast
      if (rawFirst.length >= 2) firstNameMRZ = capitalizeToken(rawFirst)
    }
  }

  // Ligne 2 (TD1) ou ligne 1 (TD3) contient birthdate + sex + expiry
  const dataLine = mrzL2 || mrzL1
  if (dataLine.length >= 14) {
    // TD1 : positions 0-5 = birthdate, 6 = checkdigit, 7 = sex, 8-13 = expiry
    // TD3 : positions 13-18 = birthdate, 20 = sex, 21-26 = expiry
    // Tentative heuristique simple sur TD1
    const bd6 = dataLine.slice(0, 6)
    const sex = dataLine[7]
    const exp6 = dataLine.slice(8, 14)

    const bd = mrzDateToISO(bd6)
    const exp = mrzDateToISO(exp6)
    if (bd) birthDateMRZ = bd
    if (exp) expiryMRZ = exp
    if (sex === 'M' || sex === 'F') sexMRZ = sex as 'M' | 'F'
  }

  if (lastNameMRZ || firstNameMRZ || birthDateMRZ) {
    mrzConfidence = 88
  }

  // ── Étape 2 : labels visuels ────────────────────────────────────────────────
  const searchText = `${textZoneText}\n${fullText}`

  let lastNameLabel: string | undefined
  let firstNameLabel: string | undefined
  let birthDateLabel: string | undefined
  let birthPlaceLabel: string | undefined
  let labelConfidence = 0

  if (docType === 'PERMIS_CONDUIRE') {
    // Champs numérotés permis EU — valeur sur la même ligne OU la ligne suivante
    const m1 = searchText.match(/1[.\)]\s*([A-ZÁÉÈÊÀÙÎÏÔÛÇ\-' ]{2,35})/im)
      ?? searchText.match(/1[.\)]\s*\n\s*([A-ZÁÉÈÊÀÙÎÏÔÛÇ\-' ]{2,35})/im)
    if (m1) lastNameLabel = m1[1].trim().toUpperCase()

    const m2 = searchText.match(/2[.\)]\s*([A-ZÁÉÈÊÀÙÎÏÔÛÇa-záéèêàùîïôûç\-']{2,35})/im)
      ?? searchText.match(/2[.\)]\s*\n\s*([A-ZÁÉÈÊÀÙÎÏÔÛÇa-záéèêàùîïôûç\-']{2,35})/im)
    if (m2) firstNameLabel = capitalizeToken(m2[1].trim().split(/\s+/)[0])

    // Champ 3 : date + lieu sur même ligne ou date seule
    const m3same = searchText.match(/3[.\)]\s*(\d{2}[.\/\-]\d{2}[.\/\-]\d{4})\s+([A-ZÁÉÈÊÀÙÎÏÔÛÇ\-' ]{2,30})/im)
    const m3date = searchText.match(/3[.\)]\s*(\d{2}[.\/\-]\d{2}[.\/\-]\d{4})/im)
      ?? searchText.match(/3[.\)]\s*\n\s*(\d{2}[.\/\-]\d{2}[.\/\-]\d{4})/im)
    if (m3same) {
      birthDateLabel = normalizeDateStr(m3same[1])
      birthPlaceLabel = m3same[2].trim()
    } else if (m3date) {
      birthDateLabel = normalizeDateStr(m3date[1])
    }
  } else {
    // CNI — labels textuels
    const mLast = searchText.match(/(?:Nom\s+(?:de\s+famille)?|^NOM)[:\s]+([A-ZÁÉÈÊÀÙÎÏÔÛÇ\-']{2,35})/im)
    if (mLast) lastNameLabel = mLast[1].trim().toUpperCase()

    const mFirst = searchText.match(/(?:Pr[ée]noms?|^PRENOM)[:\s]+([A-ZÁÉÈÊÀÙÎÏÔÛÇa-záéèêàùîïôûç\-']{2,35})/im)
    if (mFirst) firstNameLabel = capitalizeToken(mFirst[1].trim().split(/\s+/)[0])

    const mBirth = searchText.match(/(?:N[ée]e?\s*(?:le)?|[Dd]ate\s+de\s+naissance)[:\s]+(\d{1,2}[.\/\-]\d{2}[.\/\-]\d{4})/im)
    if (mBirth) birthDateLabel = normalizeDateStr(mBirth[1])
  }

  if (lastNameLabel || firstNameLabel || birthDateLabel) {
    labelConfidence = 75
  }

  // ── Étape 3 : fallback CAPS ─────────────────────────────────────────────────
  let lastNameCaps: string | undefined
  let capsConfidence = 0

  if (!lastNameMRZ && !lastNameLabel) {
    // Cherche une ligne entièrement en CAPS de 2-35 chars
    const capsLines = searchText.split(/\r?\n/).map(l => l.trim())
    for (const line of capsLines) {
      if (/^[A-ZÁÉÈÊÀÙÎÏÔÛÇ\-' ]{2,35}$/.test(line) && line === line.toUpperCase()) {
        const word = line.split(/\s+/)[0]
        if (word.length >= 2 && !CAPS_BLACKLIST.has(word)) {
          lastNameCaps = line
          capsConfidence = 60
          break
        }
      }
    }
  }

  // ── Merge : MRZ > labels > CAPS ─────────────────────────────────────────────
  const lastName = lastNameMRZ ?? lastNameLabel ?? lastNameCaps
  const firstName = firstNameMRZ ?? firstNameLabel
  const birthDate = birthDateMRZ ?? birthDateLabel

  if (!lastName && !firstName && !birthDate) return null

  // Cherche toute date dans fullText pour fallback birthDate si toujours vide
  let birthDateFallback: string | undefined
  if (!birthDate) {
    const allDates: string[] = []
    const dateRegex = /\b(\d{2}[.\/]\d{2}[.\/](19|20)\d{2})\b/g
    let dm: RegExpExecArray | null
    while ((dm = dateRegex.exec(fullText)) !== null) {
      const d = normalizeDateStr(dm[1])
      if (d) allDates.push(d)
    }
    if (allDates.length > 0) {
      // Prend la plus ancienne (vraisemblablement la date de naissance)
      allDates.sort()
      birthDateFallback = allDates[0]
    }
  }

  const finalConfidence = mrzConfidence > 0 ? mrzConfidence
    : labelConfidence > 0 ? labelConfidence
    : capsConfidence

  const result: MindeeStructuredFields = {
    confidence: finalConfidence,
    ...(lastName && { lastName }),
    ...(firstName && { firstName }),
    ...((birthDate ?? birthDateFallback) && { birthDate: birthDate ?? birthDateFallback }),
    ...(birthPlaceLabel && { birthPlace: birthPlaceLabel }),
    ...(expiryMRZ && { documentExpiry: expiryMRZ }),
    ...(sexMRZ && { sex: sexMRZ }),
    ...(mrzL1 && { mrzLine1: mrzL1 }),
    ...(mrzL2 && { mrzLine2: mrzL2 }),
    ...(mrzL3 && { mrzLine3: mrzL3 }),
  }

  return result
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

  // ── 2. Gemini 2.5 Flash Vision (si GEMINI_API_KEY disponible) ──
  // Vision LLM : comprend le document comme un humain, ~97-98% précision.
  // ~0,001$ par scan. Source : benchmark Koncile/Vellum 2025.
  const geminiFields = await analyzeWithGemini(normalizedBuffer, docType)
  if (geminiFields && (geminiFields.lastName || geminiFields.firstName || geminiFields.birthDate)) {
    return {
      fullText: '',
      textZoneText: '',
      mrzText: [geminiFields.mrzLine1, geminiFields.mrzLine2, geminiFields.mrzLine3].filter(Boolean).join('\n'),
      confidence: geminiFields.confidence,
      engine: 'gemini-vision',
      structuredFields: geminiFields,
    }
  }

  // ── 3. doctr — modèle open source de Mindee (subprocess Python, si installé) ──
  // db_resnet50 (détection) + crnn_mobilenet_v3_large (reconnaissance)
  // Même technologie que l'API Mindee — entièrement gratuit, MIT License.
  const doctrResult = await ocrWithDoctr(normalizedBuffer, docType)
  if (doctrResult && doctrResult.fullText.length > 20) {
    return {
      fullText:      doctrResult.fullText,
      textZoneText:  doctrResult.textZoneText,
      mrzText:       doctrResult.mrzText,
      confidence:    doctrResult.confidence,
      engine:        'doctr',
      spatialFields: doctrResult.fields,   // champs extraits par position
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

  // Essaie d'extraire les champs depuis le texte Tesseract
  const extracted = extractFieldsFromOCRText(
    fullResult.text,
    textZoneCombined,
    mrzResult.text,
    docType,
  )

  console.info(
    '[OCR Extract] lastName:', extracted?.lastName,
    'firstName:', extracted?.firstName,
    'birthDate:', extracted?.birthDate,
  )

  if (extracted && (extracted.lastName || extracted.firstName || extracted.birthDate)) {
    return {
      fullText: fullResult.text,
      textZoneText: textZoneCombined,
      mrzText: mrzResult.text,
      confidence: Math.max(
        extracted.confidence,
        Math.round((fullResult.confidence + textZoneResult.confidence) / 2),
      ),
      engine: 'tesseract-best',
      structuredFields: extracted,
    }
  }

  // Fallback : retourne le texte brut si aucun champ extrait
  return {
    fullText: fullResult.text,
    textZoneText: textZoneCombined,
    mrzText: mrzResult.text,
    confidence: Math.round((fullResult.confidence + textZoneResult.confidence) / 2),
    engine: 'tesseract-best',
  }
}
