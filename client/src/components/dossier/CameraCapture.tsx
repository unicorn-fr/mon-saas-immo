/**
 * CameraCapture v7 — YouSign-style professional ID scanner
 *
 * OCR 100% local — Tesseract.js (bundled) + mrz parser (bundled).
 * Zero external API call. Works offline after first language-data load (~10MB cached).
 *
 * Pipeline:
 *  1. Camera live feed + guide overlay
 *  2. Manual shutter — crops guide region
 *  3. Tesseract.js phase 1: MRZ scan on bottom 40% (OCR-B whitelist, fast)
 *  4. If MRZ found → parse with mrz package → validated ID + full data
 *  5. Tesseract.js phase 2: full image OCR → keyword detection for recto scans
 *  6. isIdDocument false → 'rejected' phase
 *  7. CNI_RECTO → flip → CNI_VERSO flow built-in
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  X, FlipHorizontal, RotateCcw, CheckCircle2,
  Loader2, ShieldOff, ArrowRight, RefreshCw,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase =
  | 'scanning'    // camera live
  | 'processing'  // crop in progress
  | 'verifying'   // OCR call
  | 'verified'    // document accepted, data displayed
  | 'flip'        // recto ok — asking for verso (CNI only)
  | 'rejected'    // not an ID document
  | 'error'       // network/OCR error

interface OcrData {
  nom: string; prenom: string; dob: string
  nationality: string; documentNumber: string; expiry: string; side: string
  docKind?: string
}

export interface CaptureEntry { file: File; docType: string }

interface CameraCaptureProps {
  docType: string
  onComplete: (captures: CaptureEntry[]) => void
  onClose: () => void
}

// ── Config ────────────────────────────────────────────────────────────────────
const ASPECT: Record<string, number> = {
  CNI_RECTO: 85.6 / 54, CNI_VERSO: 85.6 / 54,
  PASSEPORT: 125 / 88,  TITRE_SEJOUR: 85.6 / 54,
  PERMIS_VERSO: 85.6 / 54,
}
const LABEL: Record<string, string> = {
  CNI_RECTO: 'Recto de la CNI', CNI_VERSO: 'Verso de la CNI',
  PASSEPORT: 'Page photo du passeport', TITRE_SEJOUR: 'Titre de séjour',
  PERMIS_VERSO: 'Verso du permis',
}

const BLUR_OK     = 70    // threshold for "sharp enough" feedback
const GUIDE_FRAC  = 0.84  // fraction of viewport for guide frame
const CARAMEL     = '#c4976a'

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Laplacian variance — higher = sharper. Pure JS, no OpenCV. */
function blurScore(video: HTMLVideoElement): number {
  const W = 200, H = 130
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return 0
  ctx.drawImage(video, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)
  const g = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    g[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 151 + data[i * 4 + 2] * 28) >> 8
  }
  let sum = 0, sq = 0, n = 0
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const v = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - W] - g[i + W]
      sum += v; sq += v * v; n++
    }
  }
  return sq / n - (sum / n) ** 2
}

/** Crop the guide zone from the video frame and output at 1200px wide. */
function cropGuide(video: HTMLVideoElement, aspect: number): HTMLCanvasElement {
  const vW = video.videoWidth, vH = video.videoHeight
  const maxW = vW * GUIDE_FRAC, maxH = vH * GUIDE_FRAC
  let gW: number, gH: number
  if (maxW / maxH > aspect) { gH = maxH; gW = gH * aspect }
  else { gW = maxW; gH = gW / aspect }
  const gX = (vW - gW) / 2, gY = (vH - gH) / 2
  const OUT = 1200
  const out = document.createElement('canvas')
  out.width = OUT; out.height = Math.round(OUT / aspect)
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(video, gX, gY, gW, gH, 0, 0, out.width, out.height)
  return out
}

/** Draw the semi-transparent overlay with a rectangular hole + corner brackets. */
function drawGuide(
  canvas: HTMLCanvasElement,
  aspect: number,
  score: number,
  flash: boolean,
) {
  const W = canvas.width, H = canvas.height
  if (!W || !H) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  if (flash) return

  const maxGW = W * GUIDE_FRAC, maxGH = H * GUIDE_FRAC
  let gW: number, gH: number
  if (maxGW / maxGH > aspect) { gH = maxGH; gW = gH * aspect }
  else { gW = maxGW; gH = gW / aspect }
  const gX = (W - gW) / 2, gY = (H - gH) / 2
  const R = 14

  const isSharp = score >= BLUR_OK
  const borderColor = isSharp ? CARAMEL : 'rgba(255,255,255,0.5)'

  // Dark mask with hole
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.moveTo(gX + R, gY)
  ctx.lineTo(gX + gW - R, gY); ctx.arcTo(gX + gW, gY, gX + gW, gY + R, R)
  ctx.lineTo(gX + gW, gY + gH - R); ctx.arcTo(gX + gW, gY + gH, gX + gW - R, gY + gH, R)
  ctx.lineTo(gX + R, gY + gH); ctx.arcTo(gX, gY + gH, gX, gY + gH - R, R)
  ctx.lineTo(gX, gY + R); ctx.arcTo(gX, gY, gX + R, gY, R)
  ctx.closePath()
  ctx.fill('evenodd')
  ctx.restore()

  // Guide hole border
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 2.5
  ctx.shadowColor = isSharp ? CARAMEL : 'transparent'
  ctx.shadowBlur = isSharp ? 20 : 0
  ctx.beginPath()
  ctx.moveTo(gX + R, gY)
  ctx.lineTo(gX + gW - R, gY); ctx.arcTo(gX + gW, gY, gX + gW, gY + R, R)
  ctx.lineTo(gX + gW, gY + gH - R); ctx.arcTo(gX + gW, gY + gH, gX + gW - R, gY + gH, R)
  ctx.lineTo(gX + R, gY + gH); ctx.arcTo(gX, gY + gH, gX, gY + gH - R, R)
  ctx.lineTo(gX, gY + R); ctx.arcTo(gX, gY, gX + R, gY, R)
  ctx.closePath()
  ctx.stroke()
  ctx.shadowBlur = 0

  // Corner brackets (L-shaped)
  const BL = Math.min(gW, gH) * 0.13
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 3
  ;([
    [gX, gY, 1, 1],
    [gX + gW, gY, -1, 1],
    [gX, gY + gH, 1, -1],
    [gX + gW, gY + gH, -1, -1],
  ] as [number, number, number, number][]).forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(cx + dx * BL, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + dy * BL)
    ctx.stroke()
  })

  // Animated scan line inside hole (only when sharp)
  if (isSharp) {
    const t = (Date.now() % 2000) / 2000
    const sy = gY + gH * 0.05 + t * (gH * 0.83)
    const sg = ctx.createLinearGradient(gX, sy, gX + gW, sy)
    sg.addColorStop(0, 'rgba(0,0,0,0)')
    sg.addColorStop(0.2, 'rgba(196,151,106,0.7)')
    sg.addColorStop(0.8, 'rgba(196,151,106,0.7)')
    sg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.strokeStyle = sg
    ctx.lineWidth = 1.5
    ctx.shadowColor = 'rgba(196,151,106,0.9)'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(gX + 16, sy)
    ctx.lineTo(gX + gW - 16, sy)
    ctx.stroke()
    ctx.shadowBlur = 0
  }
}

// ── Local OCR engine (Tesseract LSTM + mrz — zero external API) ───────────────
//
// Architecture :
//   Phase 1 — MRZ (bas de l'image, whitelist ASCII, moteur LSTM)
//             → parse avec mrz package → CNI verso / passeport
//   Phase 2 — Full image LSTM neural net (fra+eng) → analyse structurelle
//             → détection permis de conduire EU (champs 1-12, catégories, numéro)
//             → détection CNI recto / titre de séjour par champs structurels
//
// Tesseract OEM.LSTM_ONLY utilise le réseau de neurones LSTM entraîné sur des
// corpus de documents officiels (permis, cartes d'identité, passeports…).
// ─────────────────────────────────────────────────────────────────────────────

interface LocalOcrResult {
  isIdDocument: boolean; rejectReason: string
  nom: string; prenom: string; dob: string
  nationality: string; documentNumber: string; expiry: string; side: string
  docKind: 'cni' | 'passport' | 'permis' | 'sejour' | 'unknown'
}

// ── Image preprocessing ───────────────────────────────────────────────────────

/** Grayscale + auto-contrast stretch */
function enhanceCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const W = src.width, H = src.height
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  ctx.drawImage(src, 0, 0)
  const id = ctx.getImageData(0, 0, W, H)
  const d = id.data
  let lo = 255, hi = 0
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i]*77 + d[i+1]*151 + d[i+2]*28) >> 8
    if (g < lo) lo = g; if (g > hi) hi = g
  }
  const range = hi - lo || 1
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.min(255, Math.max(0, Math.round(((d[i]*77 + d[i+1]*151 + d[i+2]*28) >> 8) - lo) * 255 / range))
    d[i] = d[i+1] = d[i+2] = g; d[i+3] = 255
  }
  ctx.putImageData(id, 0, 0)
  return c
}

/** Crop bottom fraction (MRZ zone) */
function cropBottom(src: HTMLCanvasElement, frac = 0.42): HTMLCanvasElement {
  const H = Math.floor(src.height * frac)
  const c = document.createElement('canvas')
  c.width = src.width; c.height = H
  c.getContext('2d')!.drawImage(src, 0, src.height - H, src.width, H, 0, 0, src.width, H)
  return c
}

// ── MRZ helpers ───────────────────────────────────────────────────────────────

function findMrz(text: string): string[] | null {
  const lines = text.split('\n')
    .map(l => l.replace(/\s/g, '').toUpperCase().replace(/[^A-Z0-9<]/g, ''))
    .filter(l => l.length >= 28)
  const td1 = lines.filter(l => l.length >= 28 && l.length <= 32)
  if (td1.length >= 3) return td1.slice(0, 3).map(l => l.padEnd(30, '<').slice(0, 30))
  const td3 = lines.filter(l => l.length >= 40 && l.length <= 46)
  if (td3.length >= 2) return td3.slice(0, 2).map(l => l.padEnd(44, '<').slice(0, 44))
  return null
}

function mrzDate(s: string): string {
  if (!s || s.length < 6) return ''
  const yy = parseInt(s.slice(0, 2)), mm = s.slice(2, 4), dd = s.slice(4, 6)
  return `${yy > 30 ? 1900 + yy : 2000 + yy}-${mm}-${dd}`
}

// ── EU Driving License structural detector ────────────────────────────────────
//
// Le permis de conduire européen (directive 2006/126/CE) a des champs
// numérotés standardisés :
//   1. Date de délivrance   2. Date d'expiration   3. Autorité
//   4a. Date de naissance   4b. Lieu de naissance   5. Nom / Prénom
//   7. Signature    8. Domicile    9. Catégories    10-12. Restrictions
//
// Le numéro de permis FR suit le format : 99XX99999999 (dép + 2 lettres + chiffres)
// Les codes catégories : AM A1 A2 A  B1 BE B  C1 CE C  D1 DE D

// EU Driving License field numbering (Directive 2006/126/CE) :
//   1.  Nom de famille
//   2.  Prénoms (le premier est le prénom usuel)
//   3.  Date de naissance
//   4a. Date de délivrance  ← PAS la date de naissance
//   4b. Date d'expiration
//   4c. Autorité délivrante
//   5.  Numéro du permis
//   9.  Catégories (A, B, C, D…)

const DL_CATEGORY_RE = /\b(AM|A[12]?|B[E1]?|C[E1]?|D[E1]?)\b/g
const DL_NUMBER_FR   = /\b\d{2}[A-Z]{2}\d{6,10}\b/

interface DlResult {
  detected: boolean
  nom: string; prenom: string; dob: string
  documentNumber: string; expiry: string
}

/** Parse a date string DD.MM.YYYY (or DD/MM/YYYY or DD-MM-YYYY) → YYYY-MM-DD */
function parseEuDate(raw: string): string {
  const parts = raw.split(/[.\-/]/)
  if (parts.length !== 3) return ''
  const dd = parts[0].padStart(2, '0')
  const mm = parts[1].padStart(2, '0')
  const yy = parts[2]
  const yyyy = yy.length === 2 ? (parseInt(yy) > 30 ? '19' + yy : '20' + yy) : yy
  return `${yyyy}-${mm}-${dd}`
}

/** Extract the first date pattern (DD.MM.YYYY) after a field marker */
function dateAfterField(text: string, marker: RegExp): string {
  const m = text.match(new RegExp(marker.source + String.raw`[^0-9]{0,6}(\d{2}[.\-/]\d{2}[.\-/]\d{2,4})`))
  return m ? parseEuDate(m[1]) : ''
}

function parseDrivingLicense(text: string): DlResult {
  const up = text.toUpperCase()

  // ── Détection ────────────────────────────────────────────────────────────
  const cats    = [...up.matchAll(DL_CATEGORY_RE)].map(m => m[0])
  const hasFields = /\b[123]\s*[.,]/.test(text)          // champs 1. 2. 3.
  const hasNum  = DL_NUMBER_FR.test(up.replace(/\s/g, ''))
  const hasKw   = /PERMIS|CONDUIRE|DRIVING|PREFECT|LICEN[CS]E/.test(up)
  const detected = cats.length >= 1 || hasFields || hasNum || hasKw

  // ── Champ 1 : Nom de famille ──────────────────────────────────────────────
  // Le champ 1. est suivi immédiatement du nom (tout en majuscules sur le permis)
  let nom = ''
  const f1 = text.match(/(?:^|\n)\s*1\s*[.,]?\s*([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-ZÉÈÊËÀÂÔÛÙÎÏÇa-zéèêëàâôûùîïç\-]+)/m)
  if (f1) nom = f1[1].trim()

  // ── Champ 2 : Prénoms — ne garder que le PREMIER ─────────────────────────
  let prenom = ''
  const f2 = text.match(/(?:^|\n)\s*2\s*[.,]?\s*([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-ZÉÈÊËÀÂÔÛÙÎÏÇa-zéèêëàâôûùîïç\-\s,]+)/m)
  if (f2) {
    // Plusieurs prénoms séparés par virgule, espace ou saut de ligne : on prend le 1er
    prenom = f2[1].trim().split(/[,\n]/)[0].trim().split(/\s+/)[0]
  }

  // ── Champ 3 : Date de naissance ──────────────────────────────────────────
  const dob = dateAfterField(text, /(?:^|\n)\s*3\s*[.,]?/m)

  // ── Champ 4b : Date d'expiration (≠ 4a = date de délivrance) ─────────────
  const expiry = dateAfterField(text, /4\s*[Bb]\s*[.,]?/)

  // ── Champ 5 : Numéro du permis ────────────────────────────────────────────
  let documentNumber = ''
  const f5 = text.match(/(?:^|\n)\s*5\s*[.,]?\s*([A-Z0-9\-]{6,20})/m)
  if (f5) documentNumber = f5[1].trim()
  if (!documentNumber) {
    const numMatch = up.replace(/\s/g, '').match(DL_NUMBER_FR)
    if (numMatch) documentNumber = numMatch[0]
  }

  return { detected, nom, prenom, dob, documentNumber, expiry }
}

// ── CNI / Passeport / Titre de séjour structural detector ────────────────────

function parseCniRecto(text: string): { nom: string; prenom: string; dob: string } {
  let nom = '', prenom = '', dob = ''
  const nomMatch    = text.match(/NOM[^A-Za-z]{0,4}([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-Za-z\-]{1,25})/)
  const prenomMatch = text.match(/PR[EÉ]NOM[S]?[^A-Za-z]{0,4}([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-Za-z\-\s]{1,25})/)
  const dobMatch    = text.match(/N[EÉ][E]?\s*LE\s*:?\s*(\d{2}[.\-/]\d{2}[.\-/]\d{2,4})/i)
  if (nomMatch)    nom    = nomMatch[1].trim()
  if (prenomMatch) prenom = prenomMatch[1].trim().split(/\s+/)[0]
  if (dobMatch) {
    const p = dobMatch[1].split(/[.\-/]/)
    if (p.length === 3) {
      const y = p[2].length === 2 ? (parseInt(p[2]) > 30 ? '19'+p[2] : '20'+p[2]) : p[2]
      dob = `${y}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`
    }
  }
  return { nom, prenom, dob }
}

// ── Signature de chaque type de document (structural keywords) ────────────────

const DOC_PATTERNS = {
  cni:     /CARTE\s+NATIONALE|CNI|IDENTIT[EÉ]|CARTE\s+D.IDENTIT/i,
  passport:/PASSEPORT|PASSPORT/i,
  sejour:  /TITRE\s+DE\s+S[EÉ]JOUR|R[EÉ]SIDENT|TITRE\s+DE\s+VOYAGE/i,
  republic:/R[EÉ]PUBLIQUE\s+FRAN[CÇ]|FRENCH\s+REPUBLIC|MINIST[EÈ]RE/i,
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

async function localOcrExtract(canvas: HTMLCanvasElement): Promise<LocalOcrResult> {
  const fail = (reason: string): LocalOcrResult => ({
    isIdDocument: false, rejectReason: reason, docKind: 'unknown',
    nom: '', prenom: '', dob: '', nationality: '', documentNumber: '', expiry: '', side: 'unknown',
  })

  try {
    const { createWorker, OEM } = await import('tesseract.js')

    // ── Phase 1 : MRZ — LSTM, bottom 42%, whitelist ───────────────────────
    const bottom = enhanceCanvas(cropBottom(canvas, 0.42))
    const w1 = await createWorker('eng', OEM.LSTM_ONLY)
    await (w1 as any).setParameters({ tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<' })
    const { data: { text: mrzText } } = await w1.recognize(bottom)
    await w1.terminate()

    const mrzLines = findMrz(mrzText)
    if (mrzLines) {
      try {
        const { parse } = await import('mrz')
        const parsed = parse(mrzLines)
        if (parsed.valid || parsed.fields?.documentNumber) {
          const f = parsed.fields
          const code = String(f.documentCode ?? '').toUpperCase()
          const kind = code.startsWith('P') ? 'passport' : 'cni'
          return {
            isIdDocument: true, rejectReason: '', docKind: kind,
            nom:            String(f.lastName       ?? '').replace(/</g, ' ').trim(),
            prenom:         String(f.firstName      ?? '').replace(/</g, ' ').trim(),
            dob:            mrzDate(String(f.birthDate      ?? '')),
            nationality:    String(f.nationality    ?? ''),
            documentNumber: String(f.documentNumber ?? '').replace(/</g, ''),
            expiry:         mrzDate(String(f.expirationDate ?? '')),
            side: 'verso',
          }
        }
      } catch { /* fall through */ }
    }

    // ── Phase 2 : Pleine image — LSTM fra+eng (réseau de neurones) ────────
    const full = enhanceCanvas(canvas)
    const w2 = await createWorker('fra+eng', OEM.LSTM_ONLY)
    const { data: { text: fullText } } = await w2.recognize(full)
    await w2.terminate()

    // ── Permis de conduire (analyse structurelle EU) ────────────────────────
    const dl = parseDrivingLicense(fullText)
    if (dl.detected) {
      return {
        isIdDocument: true, rejectReason: '', docKind: 'permis',
        nom: dl.nom, prenom: dl.prenom, dob: dl.dob,
        nationality: '', documentNumber: dl.documentNumber, expiry: dl.expiry,
        side: 'recto',
      }
    }

    // ── CNI recto, Passeport recto, Titre de séjour ─────────────────────────
    const isCni      = DOC_PATTERNS.cni.test(fullText)
    const isPassport = DOC_PATTERNS.passport.test(fullText)
    const isSejour   = DOC_PATTERNS.sejour.test(fullText)
    const isRepublic = DOC_PATTERNS.republic.test(fullText)

    if (isCni || isPassport || isSejour || isRepublic) {
      const kind: LocalOcrResult['docKind'] = isPassport ? 'passport' : isSejour ? 'sejour' : 'cni'
      const { nom, prenom, dob } = parseCniRecto(fullText)
      return {
        isIdDocument: true, rejectReason: '', docKind: kind,
        nom, prenom, dob,
        nationality: '', documentNumber: '', expiry: '',
        side: 'recto',
      }
    }

    return fail(
      'Document non reconnu. Présentez votre CNI, passeport, titre de séjour ou permis de conduire.'
    )

  } catch {
    return fail('Analyse impossible. Vérifiez la luminosité et réessayez.')
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export function CameraCapture({ docType, onComplete, onClose }: CameraCaptureProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const overlayRef  = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef      = useRef<number>(0)
  const scoreRaf    = useRef(0)
  const flashRaf    = useRef(false)
  const phaseRef    = useRef<Phase>('scanning')
  const capturesRef = useRef<CaptureEntry[]>([])

  const [phase,        setPhase]        = useState<Phase>('scanning')
  const [currentDt,    setCurrentDt]    = useState(docType)
  const [facingMode,   setFacingMode]   = useState<'environment' | 'user'>('environment')
  const [camReady,     setCamReady]     = useState(false)
  const [camError,     setCamError]     = useState('')
  const [score,        setScore]        = useState(0)
  const [flash,        setFlash]        = useState(false)
  const [previewUrl,   setPreviewUrl]   = useState('')
  const [rectoPreview, setRectoPreview] = useState('')
  const [ocrData,      setOcrData]      = useState<OcrData | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detectedKind, setDetectedKind] = useState('')

  const aspect = ASPECT[currentDt] ?? ASPECT.CNI_RECTO

  // Multi-step flow: cni or permis
  const isMultiStep = detectedKind === 'cni' || detectedKind === 'permis' || docType === 'CNI_RECTO'
  const stepNum     = currentDt.includes('VERSO') ? 2 : 1

  // Button condition helpers
  const showFlipBtn = phase === 'verified' && (detectedKind === 'cni' || detectedKind === 'permis') && !currentDt.includes('VERSO')
  const showDoneBtn = phase === 'verified' && !((detectedKind === 'cni' || detectedKind === 'permis') && !currentDt.includes('VERSO'))

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  // ── RAF overlay loop ─────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const cvs = overlayRef.current
    if (cvs && phaseRef.current === 'scanning') {
      const { offsetWidth: w, offsetHeight: h } = cvs
      if (cvs.width !== w || cvs.height !== h) { cvs.width = w; cvs.height = h }
      drawGuide(cvs, aspect, scoreRaf.current, flashRaf.current)
    }
    rafRef.current = requestAnimationFrame(drawLoop)
  }, [aspect])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawLoop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [drawLoop])

  // ── OCR local (Tesseract.js + mrz — zero server call) ───────────────────
  const doVerify = useCallback(async (file: File, _dt: string): Promise<boolean> => {
    setPhaseSync('verifying')
    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width; canvas.height = bitmap.height
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
      bitmap.close()

      const result = await localOcrExtract(canvas)

      if (!result.isIdDocument) {
        setRejectReason(result.rejectReason)
        setPhaseSync('rejected')
        return false
      }
      setOcrData({
        nom:            result.nom,
        prenom:         result.prenom,
        dob:            result.dob,
        nationality:    result.nationality,
        documentNumber: result.documentNumber,
        expiry:         result.expiry,
        side:           result.side,
        docKind:        result.docKind,
      })
      setDetectedKind(result.docKind)
      setPhaseSync('verified')
      return true
    } catch {
      setRejectReason('Analyse impossible. Vérifiez la luminosité et réessayez.')
      setPhaseSync('error')
      return false
    }
  }, [setPhaseSync])

  // ── Manual capture ───────────────────────────────────────────────────────
  const doCapture = useCallback((video: HTMLVideoElement, dt: string) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setPhaseSync('processing')

    flashRaf.current = true
    setFlash(true)
    setTimeout(() => { flashRaf.current = false; setFlash(false) }, 200)

    setTimeout(async () => {
      const cropped = cropGuide(video, ASPECT[dt] ?? ASPECT.CNI_RECTO)
      cropped.toBlob(async blob => {
        if (!blob) { setPhaseSync('scanning'); return }
        const url  = URL.createObjectURL(blob)
        const file = new File([blob], `${dt.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' })
        setPreviewUrl(url)
        const ok = await doVerify(file, dt)
        if (ok) {
          capturesRef.current = [
            ...capturesRef.current.filter(c => c.docType !== dt),
            { file, docType: dt },
          ]
          if (!dt.includes('VERSO')) setRectoPreview(url)
        }
      }, 'image/jpeg', 0.95)
    }, 0)
  }, [doVerify, setPhaseSync])

  // ── Blur scoring loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!camReady || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const video = videoRef.current
      if (!video || phaseRef.current !== 'scanning') return
      const s = blurScore(video)
      scoreRaf.current = s
      setScore(s)
    }, 500)

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [camReady, phase])

  // ── Camera management ────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    scoreRaf.current = 0
    setCamReady(false); setCamError('')
    setPhaseSync('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.onloadedmetadata = () => { video.play(); setCamReady(true) }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setCamError(
        msg.includes('NotAllowed') || msg.includes('Permission')
          ? "Accès à la caméra refusé. Autorisez l'accès dans les paramètres du navigateur."
          : msg.includes('NotFound')
            ? 'Aucune caméra détectée.'
            : "Impossible d'accéder à la caméra. Rechargez la page."
      )
    }
  }, [setPhaseSync])

  useEffect(() => { startCamera(facingMode) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleManualCapture = () => {
    const video = videoRef.current
    if (!video || !camReady || phase !== 'scanning') return
    doCapture(video, currentDt)
  }

  const handleFlipCamera = () => {
    const next: 'environment' | 'user' = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  const handleRetry = () => {
    scoreRaf.current = 0
    setScore(0); setPreviewUrl(''); setRejectReason(''); setOcrData(null); setDetectedKind('')
    startCamera(facingMode)
  }

  const handleRectoVerified = () => setPhaseSync('flip')

  const handleStartVerso = () => {
    const versoType = detectedKind === 'permis' ? 'PERMIS_VERSO' : 'CNI_VERSO'
    setCurrentDt(versoType)
    setPreviewUrl(''); setOcrData(null); setDetectedKind('')
    scoreRaf.current = 0; setScore(0)
    setPhaseSync('scanning')
  }

  const handleDone         = useCallback(() => { onComplete(capturesRef.current) }, [onComplete])
  const handleVersoVerified = useCallback(() => { onComplete(capturesRef.current) }, [onComplete])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso: string) => {
    if (!iso || iso.length < 10) return iso
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  const isSharp   = score >= BLUR_OK
  const statusMsg = isSharp
    ? 'Conditions optimales — appuyez pour capturer'
    : 'Centrez votre document dans le cadre'

  const docKindLabel: Record<string, string> = {
    permis: 'Permis de conduire', passport: 'Passeport',
    sejour: 'Titre de séjour', cni: "Carte d'identité",
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      display: 'flex', flexDirection: 'column', fontFamily: BAI.fontBody,
    }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.0) 100%)',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>
            {LABEL[currentDt] ?? currentDt}
          </p>
          {isMultiStep && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Étape {stepNum}/2
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                {[1, 2].map(n => (
                  <div key={n} style={{
                    width: n === stepNum ? 18 : 6, height: 6, borderRadius: 3,
                    background: n <= stepNum ? CARAMEL : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Main viewport ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {/* Camera error */}
        {camError ? (
          <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <ShieldOff size={40} color="rgba(255,255,255,0.35)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>{camError}</p>
            <button
              onClick={() => startCamera(facingMode)}
              style={{ padding: '10px 22px', borderRadius: 8, background: CARAMEL, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Réessayer
            </button>
          </div>

        /* Processing / Verifying */
        ) : phase === 'processing' || phase === 'verifying' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', padding: '60px 24px', filter: 'brightness(0.3) blur(2px)',
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              {/* Animated scan frame */}
              <div style={{
                width: 'min(300px,75vw)', height: 'min(190px,47vw)',
                border: `2px solid rgba(196,151,106,0.4)`,
                borderRadius: 12, position: 'relative', overflow: 'hidden',
                animation: 'framePulse 1.8s ease-in-out infinite',
              }}>
                {([
                  { top: -1, left: -1, borderRight: 'none', borderBottom: 'none', borderRadius: '8px 0 0 0' },
                  { top: -1, right: -1, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 8px 0 0' },
                  { bottom: -1, left: -1, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 8px' },
                  { bottom: -1, right: -1, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 8px 0' },
                ] as React.CSSProperties[]).map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 22, height: 22, border: `2.5px solid ${CARAMEL}`, ...s }} />
                ))}
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, rgba(196,151,106,0.9) 30%, #fff 50%, rgba(196,151,106,0.9) 70%, transparent)`,
                  boxShadow: `0 0 14px 3px rgba(196,151,106,0.4)`,
                  animation: 'scanLine 1.8s ease-in-out infinite',
                }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  Lecture du document…
                </p>
                <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  {phase === 'processing' ? 'Recadrage en cours…' : 'Analyse OCR locale (≈10s)…'}
                </p>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: CARAMEL, animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

        /* Verified — show extracted data */
        ) : phase === 'verified' ? (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px 140px',
          }}>
            {previewUrl && (
              <img src={previewUrl} alt="Document" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', padding: '60px 24px', filter: 'brightness(0.18)',
              }} />
            )}
            <div style={{
              position: 'relative', zIndex: 1, width: '100%', maxWidth: 340,
              background: 'rgba(10,12,18,0.94)', border: `1px solid rgba(196,151,106,0.25)`,
              borderRadius: 18, padding: '24px 20px',
            }}>
              {/* Success header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  border: `2px solid ${CARAMEL}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(196,151,106,0.1)',
                  animation: 'checkPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
                }}>
                  <CheckCircle2 size={24} color={CARAMEL} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    Document reconnu
                  </p>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: CARAMEL, border: `1px solid rgba(196,151,106,0.3)`,
                    padding: '3px 10px', borderRadius: 20,
                    display: 'inline-block',
                  }}>
                    {docKindLabel[detectedKind] ?? 'Document'} — {currentDt.includes('VERSO') ? 'Verso' : 'Recto'}
                  </span>
                </div>
              </div>

              {/* Data rows */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(ocrData?.prenom || ocrData?.nom) && (
                  <DataRow label="Nom" value={[ocrData?.prenom, ocrData?.nom].filter(Boolean).join(' ')} />
                )}
                {ocrData?.dob      && <DataRow label="Né·e le"     value={fmt(ocrData.dob)} />}
                {ocrData?.nationality   && <DataRow label="Nationalité"  value={ocrData.nationality} />}
                {ocrData?.documentNumber && <DataRow label="N° document" value={ocrData.documentNumber} />}
                {ocrData?.expiry   && <DataRow label="Expire le"   value={fmt(ocrData.expiry)} />}
              </div>
            </div>
          </div>

        /* Flip — ask for verso */
        ) : phase === 'flip' ? (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 28px 160px', gap: 24,
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.94)' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              {/* Step dots showing step 2 */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
                {[1, 2].map(n => (
                  <div key={n} style={{
                    width: n === 2 ? 18 : 6, height: 6, borderRadius: 3,
                    background: n <= 1 ? CARAMEL : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>

              {/* Recto thumbnail */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={rectoPreview} alt="Recto" style={{
                  width: 180, height: 113, objectFit: 'cover', borderRadius: 10,
                  border: `1.5px solid rgba(196,151,106,0.5)`,
                  boxShadow: `0 0 28px rgba(196,151,106,0.12)`,
                }} />
                <div style={{
                  position: 'absolute', top: -10, right: -10, width: 28, height: 28, borderRadius: '50%',
                  background: CARAMEL, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={16} color="#fff" strokeWidth={3} />
                </div>
              </div>

              {/* Rotating arrow */}
              <div style={{ fontSize: 34, animation: 'rotateBounce 1.8s ease-in-out infinite', color: CARAMEL }}>↻</div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff' }}>Recto capturé</p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 280, lineHeight: 1.6 }}>
                  Retournez votre document pour photographier le verso.
                </p>
              </div>
            </div>
          </div>

        /* Rejected / Error */
        ) : phase === 'rejected' || phase === 'error' ? (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 28px 140px',
          }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', padding: '60px 24px', filter: 'brightness(0.2) saturate(0.3)',
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(155,28,28,0.2)', border: '2px solid rgba(248,113,113,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldOff size={32} color="#f87171" />
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {phase === 'error' ? 'Erreur de connexion' : 'Document non reconnu'}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 300, lineHeight: 1.6 }}>
                  {rejectReason}
                </p>
              </div>
            </div>
          </div>

        /* Scanning — live camera with overlay */
        ) : (
          <>
            <video ref={videoRef} playsInline muted style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: camReady ? 1 : 0, transition: 'opacity 0.35s',
            }} />
            {!camReady && !camError && (
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Loader2 size={22} color={CARAMEL} style={{ animation: 'spin 0.9s linear infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Initialisation…</span>
              </div>
            )}
            {flash && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', zIndex: 5 }} />
            )}
            <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }} />

            {/* Recto/Verso label inside guide */}
            {camReady && (
              <div style={{
                position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)',
                zIndex: 3, textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {currentDt.includes('VERSO') ? 'Verso — Retourner le document' : 'Recto — Face avant avec photo'}
                </p>
              </div>
            )}

            {/* Status pill */}
            {camReady && (
              <div style={{
                position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)',
                zIndex: 3,
                display: 'flex', alignItems: 'center', gap: 6,
                background: isSharp ? 'rgba(196,151,106,0.15)' : 'rgba(0,0,0,0.55)',
                border: `1px solid ${isSharp ? 'rgba(196,151,106,0.5)' : 'rgba(255,255,255,0.1)'}`,
                padding: '6px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                transition: 'all 0.3s',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSharp ? CARAMEL : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: isSharp ? CARAMEL : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  {statusMsg}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bottom controls ───────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 20px 44px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
        minHeight: 120,
      }}>

        {/* Scanning controls */}
        {phase === 'scanning' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Btn round onClick={handleFlipCamera}>
              <FlipHorizontal size={19} />
            </Btn>
            <button
              onClick={handleManualCapture}
              disabled={!camReady}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: camReady ? '#fff' : 'rgba(255,255,255,0.18)',
                border: `4px solid ${camReady ? CARAMEL : 'rgba(255,255,255,0.08)'}`,
                cursor: camReady ? 'pointer' : 'not-allowed',
                boxShadow: camReady ? `0 0 0 6px rgba(196,151,106,0.2)` : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: camReady ? CARAMEL : 'rgba(255,255,255,0.22)',
              }} />
            </button>
            <Btn round onClick={() => startCamera(facingMode)}>
              <RotateCcw size={17} />
            </Btn>
          </div>
        )}

        {/* Verified — recto of cni/permis: "Reprendre" + "Scanner le verso →" */}
        {showFlipBtn && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
            <Btn flex secondary onClick={handleRetry}><RotateCcw size={14} /> Reprendre</Btn>
            <Btn flex primary onClick={handleRectoVerified}>
              Scanner le verso <ArrowRight size={13} />
            </Btn>
          </div>
        )}

        {/* Verified — done (verso completed or non-multi-step) */}
        {showDoneBtn && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
            <Btn flex secondary onClick={handleRetry}><RotateCcw size={14} /> Reprendre</Btn>
            <Btn flex primary onClick={currentDt.includes('VERSO') ? handleVersoVerified : () => onComplete(capturesRef.current)}>
              <CheckCircle2 size={14} />
              {currentDt.includes('VERSO') ? 'Terminer' : 'Utiliser'}
              <ArrowRight size={13} />
            </Btn>
          </div>
        )}

        {/* Flip screen */}
        {phase === 'flip' && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
            <Btn flex secondary onClick={handleDone}>Terminer sans le verso</Btn>
            <Btn flex primary onClick={handleStartVerso}>
              Scanner le verso <ArrowRight size={13} />
            </Btn>
          </div>
        )}

        {/* Rejected / Error */}
        {(phase === 'rejected' || phase === 'error') && (
          <Btn flex primary onClick={handleRetry}><RefreshCw size={14} /> Rescanner</Btn>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin          { to { transform: rotate(360deg) } }
        @keyframes scanLine      { 0%{top:5%} 48%{top:88%} 52%{top:88%} 100%{top:5%} }
        @keyframes framePulse    { 0%,100%{border-color:rgba(196,151,106,0.35)} 50%{border-color:rgba(196,151,106,0.9);box-shadow:0 0 20px 4px rgba(196,151,106,0.2)} }
        @keyframes dotBounce     { 0%,80%,100%{transform:scale(0.7);opacity:0.45} 40%{transform:scale(1.25);opacity:1} }
        @keyframes flipBounce    { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-8px) rotate(5deg)} }
        @keyframes checkPop      { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes rotateBounce  { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
      `}</style>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function DataRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Btn({
  children, onClick, round = false, flex = false, primary = false, secondary = false,
}: {
  children: React.ReactNode
  onClick: () => void
  round?: boolean; flex?: boolean; primary?: boolean; secondary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...(round ? { width: 48, height: 48, borderRadius: '50%' } : { padding: '12px 16px', borderRadius: 10 }),
        ...(flex ? { flex: 1 } : {}),
        border: secondary ? '1px solid rgba(255,255,255,0.18)' : 'none',
        background: primary ? CARAMEL : 'rgba(255,255,255,0.12)',
        color: '#fff', fontSize: 13, fontWeight: primary ? 700 : 500,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontFamily: BAI.fontBody, minWidth: round ? 48 : undefined,
      }}
    >
      {children}
    </button>
  )
}
