/**
 * CameraCapture v8 — Guided ID document scanner
 *
 * Changes from v7:
 * - 'selecting' phase: user picks document family INSIDE the scanner
 * - Camera only starts after family selection (no auto-start on mount)
 * - handleStartVerso now calls startCamera() — the v7 camera-freeze bug is fixed
 * - OCR: phase 1 eng only, phase 2 fra only (NOT fra+eng — avoids ~40MB download)
 * - MRZ found in phase 1 → skip phase 2 entirely (passports + CNI verso = fast)
 * - Verso leniency: isVerso === true → accept doc even if isIdDocument === false
 * - capturesRef accumulates both recto and verso with correct docType strings
 * - selectedFamily drives currentDt (computed, not state)
 * - detectedKindRef is a ref (not state) — avoids stale-closure re-renders
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  X, FlipHorizontal, RotateCcw, CheckCircle2,
  Loader2, ShieldOff, RefreshCw,
  CreditCard, Car, BookOpen, FileText, ArrowRight,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase =
  | 'selecting'   // user picks doc type
  | 'scanning'    // camera live
  | 'processing'  // crop in progress
  | 'verifying'   // OCR call
  | 'verified'    // document accepted, data displayed
  | 'flip'        // recto ok — asking for verso (CNI / permis)
  | 'rejected'    // not an ID document
  | 'error'       // OCR error

type DocFamily = 'cni' | 'permis' | 'passport' | 'sejour'

interface OcrData {
  nom: string; prenom: string; dob: string
  nationality: string; documentNumber: string; expiry: string; side: string
  docKind?: string
}

export interface CaptureEntry { file: File; docType: string }

interface CameraCaptureProps {
  docType?: string  // kept for backward compat — ignored in v8 (user picks inside)
  onComplete: (captures: CaptureEntry[]) => void
  onClose: () => void
}

// ── Config ────────────────────────────────────────────────────────────────────
const ASPECT: Record<string, number> = {
  CNI_RECTO:    85.6 / 54,
  CNI_VERSO:    85.6 / 54,
  PERMIS_RECTO: 85.6 / 54,
  PERMIS_VERSO: 85.6 / 54,
  PASSEPORT:    125 / 88,
  TITRE_SEJOUR: 85.6 / 54,
}

const LABEL: Record<string, string> = {
  CNI_RECTO:    'Recto de la CNI',
  CNI_VERSO:    'Verso de la CNI',
  PERMIS_RECTO: 'Recto du permis',
  PERMIS_VERSO: 'Verso du permis',
  PASSEPORT:    'Page photo du passeport',
  TITRE_SEJOUR: 'Titre de séjour',
}

const BLUR_OK    = 70
const GUIDE_FRAC = 0.84
const CARAMEL    = '#c4976a'
const DARK_BG    = '#0a0c12'

// ── Doc options for the selecting screen ─────────────────────────────────────
const DOC_OPTIONS: { family: DocFamily; label: string; sub: string; Icon: React.ElementType }[] = [
  { family: 'cni',     label: "Carte d'identité",   sub: '2 faces à scanner', Icon: CreditCard },
  { family: 'permis',  label: 'Permis de conduire', sub: '2 faces à scanner', Icon: Car },
  { family: 'passport',label: 'Passeport',           sub: 'Page photo',        Icon: BookOpen },
  { family: 'sejour',  label: 'Titre de séjour',     sub: 'Recto uniquement',  Icon: FileText },
]

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
// STRICT detection: require ≥2 strong signals to avoid false positives.
// A gift card / terms-and-conditions page with letters A/B or numbered lists
// must NOT be detected as a driving license.
//
// Signals:
//   +2  "PERMIS DE CONDUIRE" or "DRIVING LICEN(C|S)E" as a phrase
//   +1  compound EU category code: AM, A1, A2, BE, B1, C1, CE, D1, DE
//   +1  French license number format (99XX999999)
//   +1  "PRÉFECTURE" or "PERMIS DE" (shorter phrase)
// → detected if score ≥ 2

const DL_COMPOUND_RE = /\b(AM|A[12]|B[E1]|C[E1]|D[E1])\b/g  // compound only, never bare A/B/C/D
const DL_NUMBER_FR   = /\b\d{2}[A-Z]{2}\d{6,10}\b/            // French license number
const DL_PHRASE_RE   = /PERMIS\s+DE\s+CONDUIRE|DRIVING\s+LICEN[CS]E/i
const DL_SOFT_KW_RE  = /PRÉFECTURE|PREFECTURE|PERMIS\s+DE\b/i

interface DlResult {
  detected: boolean
  nom: string; prenom: string; dob: string
  documentNumber: string; expiry: string
}

function parseEuDate(raw: string): string {
  const parts = raw.split(/[.\-/]/)
  if (parts.length !== 3) return ''
  const dd = parts[0].padStart(2, '0')
  const mm = parts[1].padStart(2, '0')
  const yy = parts[2]
  const yyyy = yy.length === 2 ? (parseInt(yy) > 30 ? '19' + yy : '20' + yy) : yy
  return `${yyyy}-${mm}-${dd}`
}

function dateAfterField(text: string, marker: RegExp): string {
  const m = text.match(new RegExp(marker.source + String.raw`[^0-9]{0,6}(\d{2}[.\-/]\d{2}[.\-/]\d{2,4})`))
  return m ? parseEuDate(m[1]) : ''
}

function parseDrivingLicense(text: string): DlResult {
  const up = text.toUpperCase()

  // ── Strict multi-signal detection ──────────────────────────────────────────
  const compoundCount = [...up.matchAll(DL_COMPOUND_RE)].length
  const hasPhrase     = DL_PHRASE_RE.test(text)
  const hasNum        = DL_NUMBER_FR.test(up.replace(/\s/g, ''))
  const hasSoftKw     = DL_SOFT_KW_RE.test(text)

  const score = (hasPhrase ? 2 : 0) + (compoundCount >= 1 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSoftKw ? 1 : 0)
  const detected = score >= 2
  // Early exit — don't waste time on field extraction if not detected
  if (!detected) return { detected: false, nom: '', prenom: '', dob: '', documentNumber: '', expiry: '' }

  // ── Champ 1 : Nom ──────────────────────────────────────────────────────────
  let nom = ''
  // Try numbered field first, then NOM: label
  const f1a = text.match(/(?:^|\n)\s*1\s*[.,]?\s*([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-ZÉÈÊËÀÂÔÛÙÎÏÇa-zéèêëàâôûùîïç\-]+)/m)
  const f1b = text.match(/NOM[^A-Za-z]{0,6}([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-Za-z\-]{2,})/i)
  if (f1a) nom = f1a[1].trim()
  else if (f1b) nom = f1b[1].trim()

  // ── Champ 2 : Prénom ───────────────────────────────────────────────────────
  let prenom = ''
  const f2a = text.match(/(?:^|\n)\s*2\s*[.,]?\s*([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-ZÉÈÊËÀÂÔÛÙÎÏÇa-zéèêëàâôûùîïç\-\s,]+)/m)
  const f2b = text.match(/PR[EÉ]NOM[S]?[^A-Za-z]{0,6}([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-Za-z\-\s]{2,})/i)
  if (f2a) prenom = f2a[1].trim().split(/[,\n]/)[0].trim().split(/\s+/)[0]
  else if (f2b) prenom = f2b[1].trim().split(/\s+/)[0]

  // ── Champ 3 : Date de naissance ────────────────────────────────────────────
  const dob = dateAfterField(text, /(?:^|\n)\s*3\s*[.,]?/m)

  // ── Champ 4b : Date d'expiration ───────────────────────────────────────────
  const expiry = dateAfterField(text, /4\s*[Bb]\s*[.,]?/)

  // ── Champ 5 : Numéro du permis ─────────────────────────────────────────────
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

  // Nom — try multiple OCR-tolerant patterns
  const nomPatterns = [
    /NOM\s*:?\s*([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-Za-zÉÈÊËÀÂÔÛÙÎÏÇéèêëàâôûùîïç\-]{2,})/i,
    /Nom\s*[:\-]?\s*([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-Za-zÉÈÊËÀÂÔÛÙÎÏÇéèêëàâôûùîïç\-]{2,})/,
    /^([A-ZÉÈÊËÀÂÔÛÙÎÏÇ]{2,})\s*$/m,   // all-caps line (common on CNI)
  ]
  for (const re of nomPatterns) {
    const m = text.match(re)
    if (m) { nom = m[1].trim(); break }
  }

  // Prénom — try multiple patterns
  const prenomPatterns = [
    /PR[EÉ]NOM[S]?\s*:?\s*([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-Za-zÉÈÊËÀÂÔÛÙÎÏÇéèêëàâôûùîïç\-\s]{2,})/i,
    /Pr[ée]nom\s*[:\-]?\s*([A-ZÉÈÊËÀÂÔÛÙÎÏÇ][A-Za-zÉÈÊËÀÂÔÛÙÎÏÇéèêëàâôûùîïç\-\s]{2,})/,
  ]
  for (const re of prenomPatterns) {
    const m = text.match(re)
    if (m) { prenom = m[1].trim().split(/\s+/)[0]; break }
  }

  // Date de naissance
  const dobMatch = text.match(/N[EÉ][E]?\s*(?:LE)?\s*:?\s*(\d{2}[.\-/]\d{2}[.\-/]\d{2,4})/i)
    ?? text.match(/Date\s+de\s+naissance\s*:?\s*(\d{2}[.\-/]\d{2}[.\-/]\d{2,4})/i)
  if (dobMatch) {
    const p = dobMatch[1].split(/[.\-/]/)
    if (p.length === 3) {
      const y = p[2].length === 2 ? (parseInt(p[2]) > 30 ? '19'+p[2] : '20'+p[2]) : p[2]
      dob = `${y}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`
    }
  }
  return { nom, prenom, dob }
}

const DOC_PATTERNS = {
  cni:     /CARTE\s+NATIONALE|CNI|IDENTIT[EÉ]|CARTE\s+D.IDENTIT/i,
  passport:/PASSEPORT|PASSPORT/i,
  sejour:  /TITRE\s+DE\s+S[EÉ]JOUR|R[EÉ]SIDENT|TITRE\s+DE\s+VOYAGE/i,
  republic:/R[EÉ]PUBLIQUE\s+FRAN[CÇ]|FRENCH\s+REPUBLIC|MINIST[EÈ]RE/i,
}

// ── OCR result type ───────────────────────────────────────────────────────────

interface LocalOcrResult {
  isIdDocument: boolean; rejectReason: string
  nom: string; prenom: string; dob: string
  nationality: string; documentNumber: string; expiry: string; side: string
  docKind: 'cni' | 'passport' | 'permis' | 'sejour' | 'unknown'
}

// ── Main OCR pipeline ─────────────────────────────────────────────────────────
//
// v8 changes:
//   Phase 1 — MRZ: eng only (whitelist, fast)
//             → if MRZ found → parse and RETURN immediately (skip phase 2)
//   Phase 2 — Full image: fra only (NOT fra+eng, avoids ~40MB download)
//             → structural analysis for permis, CNI recto, passeport, titre de séjour
//
// isVersoScan flag: if true, accept even if isIdDocument === false
// (OCR on backs of cards often fails to trigger keywords — leniency is needed)

async function localOcrExtract(
  canvas: HTMLCanvasElement,
  isVersoScan: boolean,
): Promise<LocalOcrResult> {
  const fail = (reason: string): LocalOcrResult => ({
    isIdDocument: false, rejectReason: reason, docKind: 'unknown',
    nom: '', prenom: '', dob: '', nationality: '', documentNumber: '', expiry: '', side: 'unknown',
  })

  const versoFallback = (): LocalOcrResult => ({
    isIdDocument: true, rejectReason: '', docKind: 'unknown',
    nom: '', prenom: '', dob: '', nationality: '', documentNumber: '', expiry: '',
    side: 'verso',
  })

  try {
    const { createWorker, OEM } = await import('tesseract.js')

    // ── Phase 1 : MRZ — LSTM, bottom 42%, whitelist (eng only) ───────────
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
      } catch { /* fall through to phase 2 */ }
    }

    // ── Verso leniency: if MRZ not found but it's a verso scan ───────────
    // Skip phase 2 and accept the doc — backs of cards rarely have readable text
    if (isVersoScan) {
      return versoFallback()
    }

    // ── Phase 2 : Full image — LSTM fra only (NOT fra+eng!) ───────────────
    const full = enhanceCanvas(canvas)
    const w2 = await createWorker('fra', OEM.LSTM_ONLY)
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
export function CameraCapture({ onComplete, onClose }: CameraCaptureProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const overlayRef  = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef      = useRef<number>(0)
  const scoreRaf    = useRef(0)
  const flashRaf    = useRef(false)
  const phaseRef    = useRef<Phase>('selecting')
  const capturesRef = useRef<CaptureEntry[]>([])
  const detectedKindRef = useRef<string>('')

  const [phase,          setPhase]          = useState<Phase>('selecting')
  const [selectedFamily, setSelectedFamily] = useState<DocFamily | null>(null)
  const [isVerso,        setIsVerso]        = useState(false)
  const [facingMode,     setFacingMode]     = useState<'environment' | 'user'>('environment')
  const [camReady,       setCamReady]       = useState(false)
  const [camError,       setCamError]       = useState('')
  const [score,          setScore]          = useState(0)
  const [flash,          setFlash]          = useState(false)
  const [previewUrl,     setPreviewUrl]     = useState('')
  const [rectoPreview,   setRectoPreview]   = useState('')
  const [ocrData,        setOcrData]        = useState<OcrData | null>(null)
  const [rejectReason,   setRejectReason]   = useState('')

  // ── Derived (computed, not state) ────────────────────────────────────────
  const currentDt = useMemo(() => {
    if (!selectedFamily) return 'CNI_RECTO'
    if (selectedFamily === 'cni')     return isVerso ? 'CNI_VERSO'    : 'CNI_RECTO'
    if (selectedFamily === 'permis')  return isVerso ? 'PERMIS_VERSO' : 'PERMIS_RECTO'
    if (selectedFamily === 'passport') return 'PASSEPORT'
    return 'TITRE_SEJOUR'
  }, [selectedFamily, isVerso])

  const needsVerso  = selectedFamily === 'cni' || selectedFamily === 'permis'
  const showFlipBtn = phase === 'verified' && needsVerso && !isVerso
  const showDoneBtn = phase === 'verified' && (!needsVerso || isVerso)

  const aspect = ASPECT[currentDt] ?? ASPECT.CNI_RECTO

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
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

  // ── OCR verify ───────────────────────────────────────────────────────────
  const doVerify = useCallback(async (file: File, _dt: string, isVersoScan: boolean): Promise<boolean> => {
    setPhaseSync('verifying')
    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width; canvas.height = bitmap.height
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
      bitmap.close()

      const result = await localOcrExtract(canvas, isVersoScan)

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
      detectedKindRef.current = result.docKind
      setPhaseSync('verified')
      return true
    } catch {
      setRejectReason('Analyse impossible. Vérifiez la luminosité et réessayez.')
      setPhaseSync('error')
      return false
    }
  }, [setPhaseSync])

  // ── Manual capture ───────────────────────────────────────────────────────
  const doCapture = useCallback((video: HTMLVideoElement, dt: string, versoScan: boolean) => {
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
        const ok = await doVerify(file, dt, versoScan)
        if (ok) {
          // Replace any existing entry with the same docType, then push
          capturesRef.current = [
            ...capturesRef.current.filter(c => c.docType !== dt),
            { file, docType: dt },
          ]
          if (!versoScan) setRectoPreview(url)
        }
      }, 'image/jpeg', 0.95)
    }, 0)
  }, [doVerify, setPhaseSync])

  // ── Handlers ──────────────────────────────────────────────────────────────

  // v8: selecting phase — user picks family, then camera starts immediately
  const handleSelectFamily = useCallback((family: DocFamily) => {
    setSelectedFamily(family)
    setIsVerso(false)
    capturesRef.current = []
    detectedKindRef.current = ''
    startCamera(facingMode)
  }, [facingMode, startCamera])

  const handleManualCapture = () => {
    const video = videoRef.current
    if (!video || !camReady || phase !== 'scanning') return
    doCapture(video, currentDt, isVerso)
  }

  const handleFlipCamera = () => {
    const next: 'environment' | 'user' = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  const handleRetry = () => {
    scoreRaf.current = 0
    setScore(0); setPreviewUrl(''); setRejectReason(''); setOcrData(null)
    detectedKindRef.current = ''
    startCamera(facingMode)
  }

  const handleRectoVerified = () => setPhaseSync('flip')

  // THE CRITICAL BUG FIX: v7 did not call startCamera here, causing camera freeze
  const handleStartVerso = useCallback(() => {
    setIsVerso(true)
    setPreviewUrl('')
    setOcrData(null)
    scoreRaf.current = 0
    setScore(0)
    startCamera(facingMode)
  }, [facingMode, startCamera])

  const handleSkipVerso = useCallback(() => {
    onComplete(capturesRef.current)
  }, [onComplete])

  const handleDone = useCallback(() => {
    onComplete(capturesRef.current)
  }, [onComplete])

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

  const familyLabel: Record<DocFamily, string> = {
    cni: "Carte d'identité", permis: 'Permis de conduire',
    passport: 'Passeport', sejour: 'Titre de séjour',
  }

  // ── Top bar title & step indicator logic ──────────────────────────────────
  const topTitle = !selectedFamily
    ? 'Scanner un document'
    : needsVerso
      ? (isVerso ? 'Verso — Étape 2/2' : 'Recto — Étape 1/2')
      : LABEL[currentDt] ?? currentDt

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: DARK_BG,
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
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: BAI.fontBody }}>
            {topTitle}
          </p>
          {selectedFamily && needsVerso && (
            <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
              {[1, 2].map(n => {
                const active = isVerso ? n <= 2 : n <= 1
                return (
                  <div key={n} style={{
                    width: active ? 18 : 6, height: 6, borderRadius: 3,
                    background: active ? CARAMEL : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s',
                  }} />
                )
              })}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Main viewport ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>

        {/* ── SELECTING phase ─────────────────────────────────────────────── */}
        {phase === 'selecting' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '80px 20px 24px', gap: 24,
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                color: CARAMEL, margin: '0 0 8px', fontFamily: BAI.fontBody, fontWeight: 700,
              }}>
                Étape 1 / 2
              </p>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontSize: 'clamp(22px,5vw,30px)',
                fontWeight: 700, fontStyle: 'italic', color: '#fff', margin: '0 0 8px',
              }}>
                Quel document souhaitez-vous scanner ?
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, fontFamily: BAI.fontBody }}>
                Sélectionnez le type de pièce d'identité
              </p>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              width: '100%', maxWidth: 380,
            }}>
              {DOC_OPTIONS.map(opt => (
                <button
                  key={opt.family}
                  onClick={() => handleSelectFamily(opt.family)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, padding: '18px 14px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                    textAlign: 'left', transition: 'all 0.2s', fontFamily: BAI.fontBody,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = CARAMEL
                    e.currentTarget.style.background = 'rgba(196,151,106,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(196,151,106,0.15)',
                    border: '1px solid rgba(196,151,106,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <opt.Icon size={18} color={CARAMEL} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                      {opt.label}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {opt.sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Camera error ─────────────────────────────────────────────────── */}
        {phase !== 'selecting' && camError && (
          <div style={{
            padding: 32, textAlign: 'center', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <ShieldOff size={40} color="rgba(255,255,255,0.35)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>
              {camError}
            </p>
            <button
              onClick={() => startCamera(facingMode)}
              style={{
                padding: '10px 22px', borderRadius: 8, background: CARAMEL,
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── Processing / Verifying ───────────────────────────────────────── */}
        {(phase === 'processing' || phase === 'verifying') && (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', padding: '60px 24px',
                filter: 'brightness(0.3) blur(2px)',
              }} />
            )}
            <div style={{
              position: 'relative', zIndex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            }}>
              <div style={{
                width: 'min(300px,75vw)', height: 'min(190px,47vw)',
                border: '2px solid rgba(196,151,106,0.4)',
                borderRadius: 12, position: 'relative', overflow: 'hidden',
                animation: 'framePulse 1.8s ease-in-out infinite',
              }}>
                {([
                  { top: -1, left: -1, borderRight: 'none', borderBottom: 'none', borderRadius: '8px 0 0 0' },
                  { top: -1, right: -1, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 8px 0 0' },
                  { bottom: -1, left: -1, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 8px' },
                  { bottom: -1, right: -1, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 8px 0' },
                ] as React.CSSProperties[]).map((s, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: 22, height: 22,
                    border: `2.5px solid ${CARAMEL}`, ...s,
                  }} />
                ))}
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, rgba(196,151,106,0.9) 30%, #fff 50%, rgba(196,151,106,0.9) 70%, transparent)`,
                  boxShadow: '0 0 14px 3px rgba(196,151,106,0.4)',
                  animation: 'scanLine 1.8s ease-in-out infinite',
                }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  Lecture du document…
                </p>
                <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  {phase === 'processing' ? 'Recadrage en cours…' : 'Analyse OCR locale…'}
                </p>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%', background: CARAMEL,
                      animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Verified ─────────────────────────────────────────────────────── */}
        {phase === 'verified' && (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '72px 20px 140px', overflowY: 'auto',
          }}>
            {/* Blurred document background */}
            {previewUrl && (
              <img src={previewUrl} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', filter: 'brightness(0.12) blur(6px)', transform: 'scale(1.05)',
              }} />
            )}

            {/* Result card */}
            <div style={{
              position: 'relative', zIndex: 1, width: '100%', maxWidth: 360,
              background: 'rgba(10,12,18,0.96)', border: '1px solid rgba(196,151,106,0.2)',
              borderRadius: 20, overflow: 'hidden',
            }}>
              {/* Document thumbnail strip */}
              {previewUrl && (
                <div style={{ position: 'relative', height: 100, overflow: 'hidden' }}>
                  <img src={previewUrl} alt="Document" style={{
                    width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(10,12,18,0.96) 100%)',
                  }} />
                  {/* Success badge on thumbnail */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 30, height: 30, borderRadius: '50%',
                    background: CARAMEL, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'checkPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
                  }}>
                    <CheckCircle2 size={16} color="#fff" strokeWidth={3} />
                  </div>
                </div>
              )}

              <div style={{ padding: '16px 20px 20px' }}>
                {/* Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: CARAMEL,
                    border: '1px solid rgba(196,151,106,0.3)',
                    padding: '3px 10px', borderRadius: 20,
                  }}>
                    {selectedFamily ? familyLabel[selectedFamily] : 'Document'}
                    {' — '}
                    {isVerso ? 'Verso' : 'Recto'}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(196,151,106,0.8)', marginLeft: 'auto' }}>
                    ✓ Vérifié
                  </span>
                </div>

                {/* Data rows */}
                {!isVerso && (ocrData?.nom || ocrData?.prenom || ocrData?.dob || ocrData?.documentNumber) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {(ocrData?.prenom || ocrData?.nom) && (
                      <DataRow label="Identité" value={[ocrData?.prenom, ocrData?.nom].filter(Boolean).join(' ')} />
                    )}
                    {ocrData?.dob            && <DataRow label="Date de naissance" value={fmt(ocrData.dob)} />}
                    {ocrData?.nationality    && <DataRow label="Nationalité"        value={ocrData.nationality} />}
                    {ocrData?.documentNumber && <DataRow label="N° document"        value={ocrData.documentNumber} />}
                    {ocrData?.expiry         && <DataRow label="Expire le"          value={fmt(ocrData.expiry)} />}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, textAlign: 'center' }}>
                    {isVerso
                      ? 'Verso capturé — document complet.'
                      : 'Document accepté. Les données seront vérifiées par le propriétaire.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Flip — ask for verso ─────────────────────────────────────────── */}
        {phase === 'flip' && (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 28px 160px', gap: 24,
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.94)' }} />
            <div style={{
              position: 'relative', zIndex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            }}>
              {/* Step dots — step 1 done (caramel), step 2 active (white) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: CARAMEL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={13} color="#fff" strokeWidth={3} />
                </div>
                <div style={{ width: 28, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>2</span>
                </div>
              </div>

              {/* Recto thumbnail */}
              {rectoPreview && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={rectoPreview} alt="Recto" style={{
                    width: 180, height: 113, objectFit: 'cover', borderRadius: 10,
                    border: `1.5px solid rgba(196,151,106,0.5)`,
                    boxShadow: '0 0 28px rgba(196,151,106,0.12)',
                  }} />
                  <div style={{
                    position: 'absolute', top: -10, right: -10, width: 28, height: 28,
                    borderRadius: '50%', background: CARAMEL,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={16} color="#fff" strokeWidth={3} />
                  </div>
                </div>
              )}

              {/* Flip icon */}
              <div style={{ fontSize: 34, animation: 'rotateBounce 1.8s ease-in-out infinite', color: CARAMEL }}>
                ↻
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: CARAMEL, fontFamily: BAI.fontBody }}>
                  Recto ✓ capturé
                </p>
                <p style={{ margin: '0 0 10px', fontFamily: BAI.fontDisplay, fontSize: 24, fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>
                  Retournez votre document
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 260, lineHeight: 1.65 }}>
                  Placez maintenant le <strong style={{ color: 'rgba(255,255,255,0.8)' }}>verso</strong> face à la caméra pour compléter votre dossier.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Rejected / Error ─────────────────────────────────────────────── */}
        {(phase === 'rejected' || phase === 'error') && (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 28px 140px',
          }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', padding: '60px 24px',
                filter: 'brightness(0.2) saturate(0.3)',
              }} />
            )}
            <div style={{
              position: 'relative', zIndex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(155,28,28,0.2)', border: '2px solid rgba(248,113,113,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldOff size={32} color="#f87171" />
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {phase === 'error' ? 'Erreur de lecture' : 'Document non valide'}
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 300, lineHeight: 1.6 }}>
                  {rejectReason}
                </p>
                {selectedFamily && (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)', maxWidth: 300, lineHeight: 1.5 }}>
                    Attendu : {selectedFamily ? familyLabel[selectedFamily] : 'pièce d\'identité officielle'} avec photo.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Scanning — live camera with overlay ──────────────────────────── */}
        {phase === 'scanning' && (
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

            {/* Hint text below guide frame */}
            {camReady && (
              <div style={{
                position: 'absolute', bottom: 168, left: '50%', transform: 'translateX(-50%)',
                zIndex: 3, textAlign: 'center', width: '80%',
              }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  {isVerso
                    ? 'Verso — côté avec la bande MRZ'
                    : selectedFamily === 'cni' || selectedFamily === 'permis'
                      ? 'Recto — face avec votre photo'
                      : 'Centrez le document dans le cadre'}
                </p>
              </div>
            )}

            {/* Status pill */}
            {camReady && (
              <div style={{
                position: 'absolute', bottom: 136, left: '50%', transform: 'translateX(-50%)',
                zIndex: 3, display: 'flex', alignItems: 'center', gap: 6,
                background: isSharp ? 'rgba(196,151,106,0.15)' : 'rgba(0,0,0,0.55)',
                border: `1px solid ${isSharp ? 'rgba(196,151,106,0.5)' : 'rgba(255,255,255,0.1)'}`,
                padding: '6px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isSharp ? CARAMEL : 'rgba(255,255,255,0.3)', flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 12, color: isSharp ? CARAMEL : 'rgba(255,255,255,0.5)', fontWeight: 500,
                }}>
                  {statusMsg}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bottom controls ───────────────────────────────────────────────── */}
      {phase !== 'selecting' && (
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
                  boxShadow: camReady ? '0 0 0 8px rgba(196,151,106,0.15)' : 'none',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
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

          {/* Verified — recto of cni/permis: go to flip */}
          {showFlipBtn && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              <Btn flex secondary onClick={handleRetry}>
                <RotateCcw size={14} /> Reprendre
              </Btn>
              <Btn flex primary onClick={handleRectoVerified}>
                Scanner le verso <ArrowRight size={13} />
              </Btn>
            </div>
          )}

          {/* Verified — done (verso completed or non-multi-step) */}
          {showDoneBtn && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              <Btn flex secondary onClick={handleRetry}>
                <RotateCcw size={14} /> Reprendre
              </Btn>
              <Btn flex primary onClick={handleDone}>
                <CheckCircle2 size={14} />
                {isVerso ? 'Terminer' : 'Utiliser'}
                <ArrowRight size={13} />
              </Btn>
            </div>
          )}

          {/* Flip screen */}
          {phase === 'flip' && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              <Btn flex secondary onClick={handleSkipVerso}>
                Passer sans le verso
              </Btn>
              <Btn flex primary onClick={handleStartVerso}>
                Scanner le verso <ArrowRight size={13} />
              </Btn>
            </div>
          )}

          {/* Rejected / Error */}
          {(phase === 'rejected' || phase === 'error') && (
            <Btn flex primary onClick={handleRetry}>
              <RefreshCw size={14} /> Rescanner
            </Btn>
          )}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes spin         { to { transform: rotate(360deg) } }
        @keyframes scanLine     { 0%{top:5%} 48%{top:88%} 52%{top:88%} 100%{top:5%} }
        @keyframes framePulse   { 0%,100%{border-color:rgba(196,151,106,0.35)} 50%{border-color:rgba(196,151,106,0.9);box-shadow:0 0 20px 4px rgba(196,151,106,0.2)} }
        @keyframes dotBounce    { 0%,80%,100%{transform:scale(0.7);opacity:0.45} 40%{transform:scale(1.25);opacity:1} }
        @keyframes checkPop     { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes rotateBounce { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
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
      padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
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

