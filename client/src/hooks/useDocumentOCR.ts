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
  issuedDate?: string
  issuingAuthority?: string
  licenseCategories?: string[]
  mrzLine1?: string
  mrzLine2?: string
  mrzLine3?: string
  mrzValid?: boolean
  confidence: number       // 0-1
  validationScore: number  // 0-1
  validFields: string[]
  missingFields: string[]
  rawText: string
  isValid: boolean
}

export interface DocumentOCRState {
  isProcessing: boolean
  progress: number
  stage: string
  result: ExtractedDocument | null
  error: string | null
}

// ─── Image loading ────────────────────────────────────────────────────────────

async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  if (!file.type.startsWith('image/')) {
    throw new Error(
      `Format non supporté : ${file.type || 'inconnu'}.\n` +
      `Fournissez une photo JPG, PNG ou WebP de votre document.\n` +
      `Les fichiers PDF, Word et autres formats ne permettent pas la reconnaissance automatique.`
    )
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Cible : 1800 px sur le grand côté — optimal pour Tesseract (~210 DPI CNI).
      // Upscale si < 800px (capture basse résolution).
      // Downscale si > 3600px (photo téléphone 4K → trop lourd, Tesseract ralentit).
      const maxSide = Math.max(img.width, img.height)
      const TARGET = 1800
      const scale = maxSide < 800
        ? Math.min(2, TARGET / maxSide)        // upscale, max ×2
        : maxSide > 3600
          ? TARGET / maxSide                   // downscale depuis 4K
          : 1                                  // dans la bonne plage, pas de scale
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas)
    }
    img.onerror = () => reject(new Error('Image corrompue ou format non lisible.'))
    img.src = URL.createObjectURL(file)
  })
}

// ─── Preprocessing pipeline ───────────────────────────────────────────────────

/**
 * Unsharp masking (pixel-level sharpen via Laplacian).
 * Améliore la lisibilité du texte imprimé avant OCR.
 */
function applyUnsharpMask(source: HTMLCanvasElement, strength = 1.4): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = source.width; out.height = source.height
  const ctx = out.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0)

  const imgData = ctx.getImageData(0, 0, out.width, out.height)
  const d = imgData.data
  const w = out.width, h = out.height

  // Kernel Laplacien 3×3 approx: centre = 4, voisins = -1
  const out2 = new Uint8ClampedArray(d.length)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        const center = d[i + c]
        const lap = 4 * center
          - d[((y - 1) * w + x) * 4 + c]
          - d[((y + 1) * w + x) * 4 + c]
          - d[(y * w + x - 1) * 4 + c]
          - d[(y * w + x + 1) * 4 + c]
        out2[i + c] = Math.max(0, Math.min(255, center + strength * lap))
      }
      out2[i + 3] = 255
    }
  }
  // Bord extérieur : copie directe
  for (let x = 0; x < w; x++) { const i = x * 4; out2[i]=d[i]; out2[i+1]=d[i+1]; out2[i+2]=d[i+2]; out2[i+3]=255 }
  for (let x = 0; x < w; x++) { const i = ((h-1)*w+x)*4; out2[i]=d[i]; out2[i+1]=d[i+1]; out2[i+2]=d[i+2]; out2[i+3]=255 }
  for (let y = 0; y < h; y++) { const i = y*w*4; out2[i]=d[i]; out2[i+1]=d[i+1]; out2[i+2]=d[i+2]; out2[i+3]=255 }
  for (let y = 0; y < h; y++) { const i = (y*w+w-1)*4; out2[i]=d[i]; out2[i+1]=d[i+1]; out2[i+2]=d[i+2]; out2[i+3]=255 }

  ctx.putImageData(new ImageData(out2, w, h), 0, 0)
  return out
}

/**
 * Blur gaussien 3×3 léger (pour réduire le bruit avant binarisation).
 */
function gaussianBlur3(source: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = source.width; out.height = source.height
  const ctx = out.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0)
  const imgData = ctx.getImageData(0, 0, out.width, out.height)
  const d = imgData.data
  const w = out.width, h = out.height
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1]
  const ksum = 16
  const out2 = new Uint8ClampedArray(d.length)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        let sum = 0
        sum += kernel[0] * d[((y-1)*w+(x-1))*4+c]
        sum += kernel[1] * d[((y-1)*w+x)*4+c]
        sum += kernel[2] * d[((y-1)*w+(x+1))*4+c]
        sum += kernel[3] * d[(y*w+(x-1))*4+c]
        sum += kernel[4] * d[i+c]
        sum += kernel[5] * d[(y*w+(x+1))*4+c]
        sum += kernel[6] * d[((y+1)*w+(x-1))*4+c]
        sum += kernel[7] * d[((y+1)*w+x)*4+c]
        sum += kernel[8] * d[((y+1)*w+(x+1))*4+c]
        out2[i+c] = Math.round(sum / ksum)
      }
      out2[i+3] = 255
    }
  }
  ctx.putImageData(new ImageData(out2, w, h), 0, 0)
  return out
}

/**
 * Seuillage Otsu — trouve le seuil optimal globalement pour binariser un document.
 */
function otsuThreshold(data: Uint8ClampedArray): number {
  const hist = new Array(256).fill(0)
  for (let i = 0; i < data.length; i += 4) {
    hist[Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2])]++
  }
  const total = data.length / 4
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]
  let sumB = 0, wB = 0, best = 0, t = 0
  for (let i = 0; i < 256; i++) {
    wB += hist[i]
    if (!wB) continue
    const wF = total - wB
    if (!wF) break
    sumB += i * hist[i]
    const mB = sumB / wB, mF = (sum - sumB) / wF
    const v = wB * wF * (mB - mF) ** 2
    if (v > best) { best = v; t = i }
  }
  return t
}

/**
 * Preprocessing pour le texte plein document (OCR général).
 * Grayscale → contraste doux → unsharp mask.
 */
function preprocessForOCR(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width; canvas.height = source.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.filter = 'grayscale(100%) contrast(140%) brightness(105%)'
  ctx.drawImage(source, 0, 0)
  ctx.filter = 'none'
  return applyUnsharpMask(canvas, 1.2)
}

/**
 * Preprocessing spécifique MRZ (police OCR-B monospace).
 * Grayscale → blur léger → binarisation Otsu.
 * Plafonné à 1600px de large (optimal pour Tesseract, évite OOM sur grands canvases).
 */
function preprocessForMRZ(source: HTMLCanvasElement): HTMLCanvasElement {
  // 1. Scale à 1600px max de large (MRZ n'a besoin que de ~600px pour 300 DPI sur 50mm)
  const targetW = Math.min(source.width, 1600)
  const targetH = Math.round(source.height * (targetW / source.width))

  const gray = document.createElement('canvas')
  gray.width = targetW; gray.height = targetH
  const gctx = gray.getContext('2d', { willReadFrequently: true })!
  gctx.filter = 'grayscale(100%) contrast(250%) brightness(115%)'
  gctx.drawImage(source, 0, 0, targetW, targetH)
  gctx.filter = 'none'

  // 2. Blur léger pour réduire le grain
  const blurred = gaussianBlur3(gray)

  // 3. Binarisation Otsu + padding blanc (Tesseract aime un bord blanc)
  const bctx = blurred.getContext('2d', { willReadFrequently: true })!
  const imgData = bctx.getImageData(0, 0, blurred.width, blurred.height)
  const threshold = otsuThreshold(imgData.data)
  const d = imgData.data
  let darkPixels = 0
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2])
    const bin = g < threshold ? 0 : 255
    d[i] = d[i+1] = d[i+2] = bin; d[i+3] = 255
    if (bin === 0) darkPixels++
  }
  // Si >60% pixels noirs, le document est inversé (MRZ clair sur fond sombre) → inverser
  if (darkPixels > (d.length / 4) * 0.6) {
    for (let i = 0; i < d.length; i += 4) {
      if (d[i+3] === 255) { d[i] = 255 - d[i]; d[i+1] = 255 - d[i+1]; d[i+2] = 255 - d[i+2] }
    }
  }
  bctx.putImageData(imgData, 0, 0)
  return blurred
}

/**
 * Preprocessing pour zone isolée (champ spécifique).
 * Plafonné à 1200px de large — évite les canvases géants qui ralentissent Tesseract.
 */
function preprocessForZone(source: HTMLCanvasElement): HTMLCanvasElement {
  // Scale vers ~1200px de large si plus petit, mais pas plus grand que ×1.5
  const targetW = Math.min(Math.max(source.width, 800), 1200)
  const scale = targetW / source.width
  const targetH = Math.round(source.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetW; canvas.height = targetH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.filter = 'grayscale(100%) contrast(160%) brightness(108%)'
  ctx.drawImage(source, 0, 0, targetW, targetH)
  ctx.filter = 'none'
  return applyUnsharpMask(canvas, 1.4)
}

// ─── Zone crops ───────────────────────────────────────────────────────────────

function cropZone(
  source: HTMLCanvasElement,
  xPct: number, yPct: number, wPct: number, hPct: number
): HTMLCanvasElement {
  const sw = Math.round(source.width * wPct)
  const sh = Math.round(source.height * hPct)
  const sx = Math.round(source.width * xPct)
  const sy = Math.round(source.height * yPct)
  const out = document.createElement('canvas')
  out.width = sw; out.height = sh
  const ctx = out.getContext('2d')!
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)
  return out
}

/** Zone MRZ CNI TD1 : bas 22% du document (3 lignes OCR-B) */
function cropMRZZone(source: HTMLCanvasElement): HTMLCanvasElement {
  return cropZone(source, 0, 0.78, 1, 0.22)
}

/**
 * CNI recto — zone texte (sans la photo, côté droit ~60% de largeur).
 * Mise en page officielle CNI française :
 *  - Photo : 0..38% largeur
 *  - Champs : 38%..100% largeur, 0%..78% hauteur
 */
function cropCNITextField(source: HTMLCanvasElement): HTMLCanvasElement {
  return cropZone(source, 0.36, 0, 0.64, 0.78)
}

/**
 * Permis de conduire — zone Nom/Prénom/Date naissance :
 * Haut 55% du document, en excluant la photo (côté droit, 60% de largeur)
 */
function cropPermisNameZone(source: HTMLCanvasElement): HTMLCanvasElement {
  return cropZone(source, 0.36, 0.04, 0.64, 0.52)
}

/**
 * Permis de conduire — zone inférieure (numéro, dates, catégories) :
 * Bas 48% du document, pleine largeur
 */
function cropPermisLowerZone(source: HTMLCanvasElement): HTMLCanvasElement {
  return cropZone(source, 0, 0.52, 1, 0.48)
}

// ─── Tesseract runner ─────────────────────────────────────────────────────────

interface TesseractResult { text: string; confidence: number }

/**
 * Un seul worker Tesseract, plusieurs passes séquentielles.
 * Réduit le overhead d'initialisation (modèle chargé une seule fois).
 */
async function runTesseractPasses(
  passes: Array<{ canvas: HTMLCanvasElement; psm: number; whitelist?: string; label: string }>,
  onProgress?: (stage: string, p: number) => void
): Promise<TesseractResult[]> {
  const { createWorker } = await import('tesseract.js')

  const worker = await createWorker('fra', 1, {
    logger: () => {},
  })

  const results: TesseractResult[] = []
  try {
    for (let i = 0; i < passes.length; i++) {
      const pass = passes[i]
      const params: Record<string, string> = {
        tessedit_pageseg_mode: String(pass.psm),
        preserve_interword_spaces: '1',
        tessedit_do_invert: '0',
      }
      if (pass.whitelist) params.tessedit_char_whitelist = pass.whitelist

      await worker.setParameters(params)
      if (onProgress) onProgress(pass.label, Math.round((i / passes.length) * 100))
      const { data } = await worker.recognize(pass.canvas)
      results.push({ text: data.text, confidence: data.confidence })
    }
  } finally {
    await worker.terminate()
  }
  return results
}

// ─── Date / string helpers ────────────────────────────────────────────────────

/** Remplace les confusions OCR courantes dans une date avant parsing */
function cleanDateStr(raw: string): string {
  return raw
    .replace(/[Oo]/g, '0')
    .replace(/[Il]/g, '1')
    .replace(/[S$]/g, '5')
    .replace(/[B]/g, '8')
}

function parseDateFr(raw: string): string | undefined {
  const cleaned = cleanDateStr(raw)
  const m = cleaned.match(/(\d{1,2})[.\-\/\s](\d{1,2})[.\-\/\s](\d{2,4})/)
  if (!m) return undefined
  const dd = m[1].padStart(2, '0')
  const mm = m[2].padStart(2, '0')
  const rawYear = m[3]
  const yyyy = rawYear.length === 2
    ? (parseInt(rawYear) > 30 ? `19${rawYear}` : `20${rawYear}`)
    : rawYear
  const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd))
  if (isNaN(d.getTime())) return undefined
  // Sanity: birth date must be in past (> 16 years ago for an ID), not > 120 years ago
  return `${yyyy}-${mm}-${dd}`
}

function parseMRZDate(yymmdd: string): string | undefined {
  if (!yymmdd || yymmdd.length < 6) return undefined
  const yy = parseInt(yymmdd.substring(0, 2))
  const mm = yymmdd.substring(2, 4)
  const dd = yymmdd.substring(4, 6)
  // ICAO: si 2000+yy dépasse l'année courante+20 → c'est 1900+yy (naissance passée)
  const y2k = 2000 + yy
  const year = y2k > new Date().getFullYear() + 20 ? 1900 + yy : y2k
  if (isNaN(parseInt(mm)) || isNaN(parseInt(dd))) return undefined
  return `${year}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
}

/**
 * Nettoie un nom extrait par OCR.
 * Supprime les chiffres parasites, les espaces multiples et les chars isolés.
 */
function cleanName(raw: string): string {
  return raw
    .replace(/[0-9@#$%^&*()[\]{}|\\<>]/g, '') // chiffres et symboles
    .replace(/\b\w\b/g, '')                      // mots d'une seule lettre (artéfacts)
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/^[-\s.]+|[-\s.]+$/g, '')           // tirets/points en début/fin
}

function cleanFirstName(raw: string): string {
  return raw
    .replace(/[0-9@#$%^&*()[\]{}|\\<>]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/^[-\s.]+|[-\s.]+$/g, '')
}

// ─── MRZ detection & parsing ──────────────────────────────────────────────────

function findMRZLines(text: string): string[] | null {
  const lines = text
    .split('\n')
    .map(l => l.trim().replace(/\s+/g, '').replace(/[Oo]/g, '0').toUpperCase())
    .filter(l => l.length >= 20)

  // TD1: 3 lignes × 30 chars (CNI française)
  // Cherche d'abord une ligne commençant par "ID" (marqueur CNI) ou "AC" (ancienne CNI)
  const td1All = lines.filter(l => l.length >= 25 && l.length <= 36 && /^[A-Z0-9<]{20,}$/.test(l))
  if (td1All.length >= 3) {
    // Priorité aux lignes commençant par "ID" (ligne 1 CNI FR)
    const anchorIdx = td1All.findIndex(l => /^ID[A-Z]{3}/.test(l))
    const start = anchorIdx >= 0 ? anchorIdx : 0
    const candidate = td1All.slice(start, start + 3)
    if (candidate.length === 3) {
      return candidate.map(l => l.substring(0, 30).padEnd(30, '<'))
    }
    // Fallback : dernières 3 lignes TD1
    return td1All.slice(-3).map(l => l.substring(0, 30).padEnd(30, '<'))
  }

  // TD3: 2 lignes × 44 chars (passeport)
  const td3All = lines.filter(l => l.length >= 40 && l.length <= 48 && /^[A-Z0-9<]{40,}$/.test(l))
  if (td3All.length >= 2) {
    const anchorIdx = td3All.findIndex(l => /^P[A-Z<]/.test(l))
    const start = anchorIdx >= 0 ? anchorIdx : td3All.length - 2
    return td3All.slice(start, start + 2).map(l => l.substring(0, 44))
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
    if (result.valid === false && !result.fields?.lastName) return null
    return result.fields ?? null
  } catch { return null }
}

// ─── CNI field extractor ──────────────────────────────────────────────────────

/**
 * Extrait les champs d'une CNI à partir de 3 sources OCR distinctes.
 * Priorité : MRZ (fiabilité max) > textZone (PSM 3) > fullDoc (PSM 11 fallback).
 */
async function extractCNIFields(
  fullText: string,
  textZoneText: string,
  mrzText: string
): Promise<Partial<ExtractedDocument>> {
  const result: Partial<ExtractedDocument> = {}

  // Toutes les sources combinées pour la détection MRZ
  const allSources = `${mrzText}\n${fullText}\n${textZoneText}`

  // 1. MRZ en priorité absolue (données chiffrées, checksum, ultra-fiables)
  const mrzLines = findMRZLines(allSources)
  if (mrzLines) {
    result.mrzLine1 = mrzLines[0]
    result.mrzLine2 = mrzLines[1]
    result.mrzLine3 = mrzLines[2]
    const fields = await parseMRZWithPackage(mrzLines)
    if (fields) {
      result.mrzValid = true
      // MRZ: prénom et nom sont séparés par "<" (= espace) et "<<" (= séparateur)
      if (fields.firstName) result.firstName = fields.firstName.replace(/<+/g, ' ').trim()
      if (fields.lastName) result.lastName = fields.lastName.replace(/<+/g, ' ').trim()
      if (fields.documentNumber) result.documentNumber = fields.documentNumber.replace(/<+/g, '')
      if (fields.nationality) result.nationality = fields.nationality.replace(/<+/g, '')
      if (fields.birthDate) result.birthDate = parseMRZDate(fields.birthDate)
      if (fields.expirationDate) result.documentExpiry = parseMRZDate(fields.expirationDate)
      const s = fields.sex
      if (s === 'M' || s === 'F') result.sex = s
    }
  }

  // 2. Fallbacks regex sur la zone texte (PSM 3 — meilleure lisibilité) puis full doc
  // On essaie la zone texte d'abord (plus ciblée), puis le full doc si rien trouvé
  const sources = [textZoneText, fullText].filter(Boolean)

  for (const t of sources) {
    if (!result.lastName) {
      // Label "Nom de famille" ou "NOM" suivi de la valeur
      const m1 = t.match(/(?:Nom\s*(?:de\s+famille)?|NOM)\s*[:\s]+([A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒ\-\s]{2,35}?)(?:\n|Pr[ée]nom|$)/im)
      const m2 = t.match(/^([A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒ]{3,}(?:[\s\-][A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒ]{2,})*)\s*\n/m)
      const raw = (m1 ? m1[1] : m2 ? m2[1] : null)
      if (raw) result.lastName = cleanName(raw)
    }

    if (!result.firstName) {
      const m = t.match(/(?:Pr[ée]nom(?:s)?|PRÉNOM[S]?)\s*[:\s]+([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒa-záéèêàâîôùûüçæœ\-\s]{2,45}?)(?:\n|N[ée]|Date|Taille|Sex|$)/im)
      if (m) result.firstName = cleanFirstName(m[1])
    }

    if (!result.birthDate) {
      // Label explicite (priorité)
      const m1 = t.match(/(?:N[ée](?:\(e\))?\s+le|date\s+de\s+naissance)\s*[:\s]+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/im)
      if (m1) result.birthDate = parseDateFr(m1[1])
      // Fallback : première date au format dd.mm.yyyy avec année plausible
      if (!result.birthDate) {
        const m2 = t.match(/\b(\d{2}[.\-\/]\d{2}[.\-\/](?:19|200|201)\d{1,2})\b/)
        if (m2) result.birthDate = parseDateFr(m2[1])
      }
    }

    if (!result.birthPlace) {
      const m = t.match(/(?:(?:N[ée](?:\(e\))?\s+[àa]|Lieu\s+de\s+naissance)\s*[:\s]+)([A-ZÉÈÊÀÂÎÔÙÛÜÇÆŒa-záéèêàâîôùûüçæœ\-\s]{2,30}?)(?:\n|Taille|Sex|$)/im)
      if (m) result.birthPlace = m[1].trim()
    }

    if (!result.documentExpiry) {
      const m = t.match(/(?:valable\s+jusqu(?:'|'|')au|fin\s+de\s+validit[ée]|date\s+(?:de\s+)?(?:fin\s+de\s+)?validit[ée])\s*[:\s]+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4})/im)
      if (m) result.documentExpiry = parseDateFr(m[1])
    }

    if (!result.documentNumber) {
      // CNI nouvelle (ex: "07CB01020") ou ancienne 12 chiffres
      const numPatterns = [
        /(?:n[°o]\.?\s*(?:national|carte|pi[eè]ce)|num[eé]ro)\s*[:\s]+([A-Z0-9]{7,15})/im,
        /^([A-Z0-9]{9,12})\s*$/m,
        /\b(\d{12})\b/,
        /\b(\d{2}[A-Z]{2}\d{5,7})\b/,
      ]
      for (const re of numPatterns) {
        const m = t.match(re)
        if (m && /\d/.test(m[1])) { result.documentNumber = m[1].trim(); break }
      }
    }

    if (!result.nationality) {
      if (/fran[çc]ais(?:e)?|french|FRA\b/i.test(t)) result.nationality = 'FRA'
    }

    // Arrêter la boucle si on a les 3 champs critiques
    if (result.lastName && result.firstName && result.birthDate) break
  }

  return result
}

// ─── Permis de conduire field extractor ──────────────────────────────────────

/**
 * Les champs du permis français (format EU depuis 2013) sont numérotés.
 * Cette fonction les extrait du texte OCR brut avec plusieurs stratégies.
 */
function extractPermisFromText(text: string): Partial<ExtractedDocument> {
  const result: Partial<ExtractedDocument> = {}
  const t = text

  // Normalise les numéros de champs mal lus par OCR
  // "l.", "I.", "1.", "1)" sont équivalents pour Tesseract
  const normalize = (s: string) =>
    s.replace(/^[\s\n]*[lI1]([.:\)])/mg, (_, p) => `1${p}`)
     .replace(/^[\s\n]*2([.:\)])/mg, '2$1')
     .replace(/^[\s\n]*3([.:\)])/mg, '3$1')
     .replace(/^[\s\n]*4([.:\)])/mg, '4$1')
     .replace(/^[\s\n]*5([.:\)])/mg, '5$1')

  const n = normalize(t)

  // Champ 1. — Nom de famille
  const nom1 = n.match(/(?:^|\n)\s*1[.:\)]\s*([A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒ][A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒa-záéèêàâîôùûüçæœ\-\s']{1,35}?)(?=\s*\n|\s*2[.:\)])/m)
  if (nom1) result.lastName = cleanName(nom1[1])

  // Champ 2. — Prénom(s)
  const nom2 = n.match(/(?:^|\n)\s*2[.:\)]\s*([A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒa-záéèêàâîôùûüçæœ\-\s']{2,45}?)(?=\s*\n|\s*3[.:\)])/m)
  if (nom2) result.firstName = cleanFirstName(nom2[1])

  // Champ 3. — Date + lieu de naissance
  const birth = n.match(/(?:^|\n)\s*3[.:\)]\s*(\d{1,2}[.\-\/\s]\d{1,2}[.\-\/\s]\d{2,4})\s*(.{2,50}?)(?=\s*\n|\s*4[a-c.:\)]|$)/im)
  if (birth) {
    result.birthDate = parseDateFr(birth[1])
    const place = birth[2]?.trim()
    if (place && place.length > 1 && !/^\d+$/.test(place)) result.birthPlace = place
  }

  // Champ 4a. — Date de délivrance
  const del = n.match(/4\s*[aA@]\s*[.:\)]\s*(\d{1,2}[.\-\/\s]\d{1,2}[.\-\/\s]\d{2,4})/im)
  if (del) result.issuedDate = parseDateFr(del[1])

  // Champ 4b. — Date d'expiration
  const exp = n.match(/4\s*[bB]\s*[.:\)]\s*(\d{1,2}[.\-\/\s]\d{1,2}[.\-\/\s]\d{2,4})/im)
  if (exp) result.documentExpiry = parseDateFr(exp[1])

  // Champ 4c. — Autorité délivrante
  const auth = n.match(/4\s*[cC]\s*[.:\)]\s*([A-Z0-9\-\s]{2,40}?)(?=\s*\n)/im)
  if (auth) result.issuingAuthority = auth[1].trim()

  // Champ 5. — Numéro du permis (format standard : AAYYYYNNNNNN ou similaire)
  const num = n.match(/(?:^|\n)\s*5[.:\)]\s*([A-Z0-9]{5,20})/im)
  if (num) result.documentNumber = num[1].trim()
  // Fallback : cherche un motif numéro connu (14 chars alphanums typiquement)
  if (!result.documentNumber) {
    const numFb = t.match(/\b([0-9]{2}[A-Z]{2}[0-9]{10}|[A-Z0-9]{12,14})\b/)
    if (numFb) result.documentNumber = numFb[1]
  }

  // Catégories B, A, AM, A1, A2, BE, C, CE, D...
  const catPattern = /\b(A[M12]?|B[E1]?|C[1E]?[E]?|D[1E]?[E]?)\b/g
  const cats = [...new Set([...t.matchAll(catPattern)].map(m => m[1]))]
  if (cats.length > 0) result.licenseCategories = cats

  // Fallbacks avec labels textuels
  if (!result.lastName) {
    const m = t.match(/(?:NOM|SURNAME|NACHNANE)\s*[:\s]+([A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒ][A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒ\-\s]{1,30}?)(?=\n)/im)
    if (m) result.lastName = cleanName(m[1])
  }

  if (!result.firstName) {
    const m = t.match(/(?:PR[ÉE]NOM|PRENOM|FIRSTNAME|VORNAME)\s*[:\s]+([A-ZÁÉÈÊÀÂÎÔÙÛÜÇÆŒa-záéèêàâîôùûüçæœ\-\s]{2,45}?)(?=\n)/im)
    if (m) result.firstName = cleanFirstName(m[1])
  }

  // Fallback date si aucun champ numéroté trouvé
  if (!result.birthDate) {
    const dates = [...t.matchAll(/\b(\d{2}[.\-\/]\d{2}[.\-\/](?:19|20)\d{2})\b/g)]
    if (dates.length >= 1) result.birthDate = parseDateFr(dates[0][1])
  }

  return result
}

/**
 * Fusionne deux extractions (zone + full) en gardant les meilleurs résultats.
 * Les résultats de la zone ont priorité si plus courts et plus précis.
 */
function mergeExtracted(
  base: Partial<ExtractedDocument>,
  zone: Partial<ExtractedDocument>
): Partial<ExtractedDocument> {
  const merged = { ...base }
  for (const key of Object.keys(zone) as (keyof ExtractedDocument)[]) {
    const zval = zone[key]
    const bval = base[key]
    if (zval !== undefined && !bval) {
      (merged as Record<string, unknown>)[key] = zval
    }
  }
  return merged
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

export const FIELD_LABELS: Record<string, string> = {
  lastName: 'Nom de famille',
  firstName: 'Prénom(s)',
  birthDate: 'Date de naissance',
  documentNumber: 'Numéro de document',
  nationality: 'Nationalité',
  documentExpiry: 'Date d\'expiration',
  mrzValid: 'Zone MRZ validée',
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
  const isValid = validationScore >= 0.5

  return { validationScore, validFields, missingFields, isValid }
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useDocumentOCR() {
  const [state, setState] = useState<DocumentOCRState>({
    isProcessing: false, progress: 0, stage: '', result: null, error: null,
  })

  const reset = useCallback(() => {
    setState({ isProcessing: false, progress: 0, stage: '', result: null, error: null })
  }, [])

  const analyzeDocument = useCallback(async (
    file: File,
    docType: 'CNI' | 'PERMIS_CONDUIRE'
  ): Promise<ExtractedDocument | null> => {
    setState({ isProcessing: true, progress: 0, stage: 'Chargement de l\'image…', result: null, error: null })

    try {
      // ── Étape 1 : Chargement + upscale 2400 px ──
      let canvas: HTMLCanvasElement
      try {
        canvas = await fileToCanvas(file)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Format non supporté'
        setState(s => ({ ...s, isProcessing: false, error: msg }))
        return null
      }

      setState(s => ({ ...s, progress: 10, stage: 'Prétraitement de l\'image…' }))

      // ── Étape 2 : Preprocessing ──
      const processed = preprocessForOCR(canvas)

      setState(s => ({ ...s, progress: 18, stage: 'Initialisation du moteur OCR…' }))

      // ── Étape 3 : Construction des passes OCR ──
      const passes: Array<{ canvas: HTMLCanvasElement; psm: number; whitelist?: string; label: string }> = [
        // Passe principale : document entier en mode "texte épars" (meilleur pour docs hétérogènes)
        { canvas: processed, psm: 11, label: 'Analyse du document complet…' },
      ]

      if (docType === 'CNI') {
        // Passe 2 : zone texte recto (sans photo) — layout labels+valeurs en colonnes
        // PSM 3 (auto-colonnes) reconnaît mieux la layout à 2 colonnes de la CNI
        // que PSM 6 (bloc uniforme) qui peut mélanger les colonnes
        const textField = cropCNITextField(canvas)
        passes.push({
          canvas: preprocessForZone(textField), psm: 3,
          label: 'Lecture zone Nom / Prénom / Date…',
        })
        // Passe 3 : zone MRZ (bas du document verso) — 3 lignes OCR-B uniformes
        // PSM 6 = bloc uniforme — CORRECT pour 3 lignes de même hauteur
        // PSM 7 serait FAUX (une seule ligne), PSM 3 serait trop lent
        const mrzCrop = cropMRZZone(canvas)
        const mrzProcessed = preprocessForMRZ(mrzCrop)
        passes.push({
          canvas: mrzProcessed, psm: 6,
          whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
          label: 'Lecture de la zone MRZ…',
        })
      } else {
        // Permis : zone nom/prénom/date (côté droit, hors photo)
        const nameZone = cropPermisNameZone(canvas)
        passes.push({
          canvas: preprocessForZone(nameZone), psm: 6,
          label: 'Analyse zone nom / prénom…',
        })
        // Permis : zone inférieure (numéro, dates, catégories)
        const lowerZone = cropPermisLowerZone(canvas)
        passes.push({
          canvas: preprocessForZone(lowerZone), psm: 6,
          label: 'Analyse zone numéro / catégories…',
        })
      }

      // ── Étape 4 : Exécution OCR multi-passes ──
      let ocrResults: TesseractResult[] = []
      try {
        ocrResults = await runTesseractPasses(passes, (stage, p) => {
          setState(s => ({ ...s, progress: 18 + Math.round(p * 0.6), stage }))
        })
      } catch { /* Tesseract indisponible → on continue avec texte vide */ }

      const fullText = ocrResults[0]?.text ?? ''
      const confidence = ocrResults[0]?.confidence ?? 0

      setState(s => ({ ...s, progress: 82, stage: 'Extraction des informations…' }))

      // ── Étape 5 : Extraction des champs ──
      let extracted: Partial<ExtractedDocument>

      if (docType === 'CNI') {
        // ocrResults[0] = doc complet (PSM 11), [1] = zone texte recto (PSM 3), [2] = MRZ (PSM 6)
        const textZoneText = ocrResults[1]?.text ?? ''
        const mrzText = ocrResults[2]?.text ?? ''
        // On passe les 3 textes séparément à extractCNIFields pour éviter la pollution
        // de regex par le séparateur (ex: "--- ZONE TEXTE ---" pouvait briser les anchors ^)
        extracted = await extractCNIFields(fullText, textZoneText, mrzText)
      } else {
        // Merge : full doc + zone nom + zone inférieure
        const mainExtract = extractPermisFromText(fullText)
        const nameExtract = ocrResults[1] ? extractPermisFromText(ocrResults[1].text) : {}
        const lowerExtract = ocrResults[2] ? extractPermisFromText(ocrResults[2].text) : {}
        extracted = mergeExtracted(mergeExtracted(mainExtract, nameExtract), lowerExtract)
      }

      setState(s => ({ ...s, progress: 95, stage: 'Validation des données…' }))

      // ── Étape 6 : Validation ──
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

  return { ...state, analyzeDocument, reset, FIELD_LABELS }
}
