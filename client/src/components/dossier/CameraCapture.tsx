/**
 * CameraCapture v10 — Guided ID document scanner
 *
 * Changes from v9:
 * - Removed Tesseract.js / mrz local OCR entirely
 * - All OCR now via backend Claude Haiku at /api/v1/ocr/extract
 * - Phases: verifying + verified removed, replaced by confirming
 * - LOCK_THRESHOLD raised to 90 (stricter), LOCK_DURATION lowered to 1200ms
 * - Shutter button styled as subtle fallback (auto-capture is primary)
 * - Flip-camera and restart-camera buttons removed from scanning controls
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  X, RotateCcw, CheckCircle2,
  Loader2, ShieldOff, RefreshCw,
  CreditCard, Car, BookOpen, FileText, ArrowRight,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient as api } from '../../services/api.service'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase =
  | 'selecting'    // user picks doc type (4 cards)
  | 'scanning'     // camera live — analyse continue
  | 'processing'   // crop + envoi backend en cours
  | 'confirming'   // backend a répondu → montrer nom/prénom/dob pour confirmation
  | 'flip'         // recto ok → verso attendu (CNI / permis)
  | 'rejected'     // backend a dit: ce n'est pas une pièce d'identité valide
  | 'error'        // erreur réseau / caméra

type DocFamily = 'cni' | 'permis' | 'passport' | 'sejour'

interface OcrData {
  nom: string
  prenom: string
  dob: string
  nationality: string
  documentNumber: string
  expiry: string
  side: string
}

interface BackendOcrResult {
  isIdDocument: boolean
  rejectReason: string
  nom: string
  prenom: string
  dob: string
  nationality: string
  documentNumber: string
  expiry: string
  mrz: string
  side: string
}

export interface CaptureEntry { file: File; docType: string }

interface CameraCaptureProps {
  docType?: string
  initialFamily?: DocFamily
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

const BLUR_OK        = 70
const GUIDE_FRAC     = 0.84
const CARAMEL        = '#c4976a'
const DARK_BG        = '#0a0c12'
const LOCK_THRESHOLD = 90    // blur score requis pour démarrer le décompte (strict)
const LOCK_DURATION  = 1200  // ms à maintenir avant capture auto

// ── Doc options for the selecting screen ─────────────────────────────────────
const DOC_OPTIONS: { family: DocFamily; label: string; sub: string; Icon: React.ElementType }[] = [
  { family: 'cni',      label: "Carte d'identité",   sub: '2 faces à scanner', Icon: CreditCard },
  { family: 'permis',   label: 'Permis de conduire', sub: '2 faces à scanner', Icon: Car },
  { family: 'passport', label: 'Passeport',           sub: 'Page photo',        Icon: BookOpen },
  { family: 'sejour',   label: 'Titre de séjour',     sub: 'Recto uniquement',  Icon: FileText },
]

// ── Backend OCR ───────────────────────────────────────────────────────────────
async function callBackendOcr(
  imageBlob: Blob,
  docType: string,
): Promise<BackendOcrResult> {
  const formData = new FormData()
  formData.append('file', imageBlob, 'scan.jpg')
  formData.append('docType', docType)
  // Ne pas setter Content-Type manuellement (multer le gère avec boundary)
  const res = await api.post('/ocr/extract', formData)
  return res.data.data as BackendOcrResult
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Mesure la netteté uniquement dans la zone guide (là où la carte doit être). */
function blurScoreInGuide(video: HTMLVideoElement, aspect: number): number {
  const W = 280, H = 180
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return 0
  const vW = video.videoWidth || W, vH = video.videoHeight || H
  const maxW = vW * GUIDE_FRAC, maxH = vH * GUIDE_FRAC
  let gW: number, gH: number
  if (maxW / maxH > aspect) { gH = maxH; gW = gH * aspect }
  else { gW = maxW; gH = gW / aspect }
  const gX = (vW - gW) / 2, gY = (vH - gH) / 2
  ctx.drawImage(video, gX, gY, gW, gH, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)
  const g = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) g[i] = (data[i*4]*77 + data[i*4+1]*151 + data[i*4+2]*28) >> 8
  let sum = 0, sq = 0, n = 0
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const v = 4*g[i] - g[i-1] - g[i+1] - g[i-W] - g[i+W]
      sum += v; sq += v*v; n++
    }
  }
  return sq/n - (sum/n)**2
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
  lockPct = 0,
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

  const isLocked = lockPct > 0
  const isSharp  = score >= BLUR_OK
  const borderColor = isLocked
    ? `rgba(34,197,94,${0.5 + lockPct / 200})`
    : isSharp ? CARAMEL : 'rgba(255,255,255,0.5)'

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
  ctx.shadowColor = isLocked ? 'rgba(34,197,94,0.8)' : isSharp ? CARAMEL : 'transparent'
  ctx.shadowBlur  = (isLocked || isSharp) ? 20 : 0
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

  // Animated scan line inside hole (only when sharp and not locked)
  if (isSharp && !isLocked) {
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

// ── Component ──────────────────────────────────────────────────────────────────
export function CameraCapture({ initialFamily, onComplete, onClose }: CameraCaptureProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const overlayRef  = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef      = useRef<number>(0)
  const scoreRaf    = useRef(0)
  const flashRaf    = useRef(false)
  const phaseRef    = useRef<Phase>(initialFamily ? 'scanning' : 'selecting')
  const capturesRef = useRef<CaptureEntry[]>([])
  const lockStartRef    = useRef<number | null>(null)
  const lockProgressRaf = useRef(0)

  const [phase,          setPhase]          = useState<Phase>(initialFamily ? 'scanning' : 'selecting')
  const [selectedFamily, setSelectedFamily] = useState<DocFamily | null>(initialFamily ?? null)
  const [isVerso,        setIsVerso]        = useState(false)
  const [facingMode] = useState<'environment' | 'user'>('environment')
  const [camReady,       setCamReady]       = useState(false)
  const [camError,       setCamError]       = useState('')
  const [score,          setScore]          = useState(0)
  const [flash,          setFlash]          = useState(false)
  const [previewUrl,     setPreviewUrl]     = useState('')
  const [rectoPreview,   setRectoPreview]   = useState('')
  const [ocrData,        setOcrData]        = useState<OcrData | null>(null)
  const [rejectReason,   setRejectReason]   = useState('')
  const [lockProgress,   setLockProgress]   = useState(0)

  // ── Derived (computed, not state) ────────────────────────────────────────
  const currentDt = useMemo(() => {
    if (!selectedFamily) return 'CNI_RECTO'
    if (selectedFamily === 'cni')      return isVerso ? 'CNI_VERSO'    : 'CNI_RECTO'
    if (selectedFamily === 'permis')   return isVerso ? 'PERMIS_VERSO' : 'PERMIS_RECTO'
    if (selectedFamily === 'passport') return 'PASSEPORT'
    return 'TITRE_SEJOUR'
  }, [selectedFamily, isVerso])

  const needsVerso  = selectedFamily === 'cni' || selectedFamily === 'permis'
  const showFlipBtn = phase === 'confirming' && needsVerso && !isVerso
  const showDoneBtn = phase === 'confirming' && (!needsVerso || isVerso)

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
    lockStartRef.current = null
    lockProgressRaf.current = 0
    setCamReady(false); setCamError('')
    setLockProgress(0)
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

  // ── Auto-start camera when initialFamily is provided ─────────────────────
  useEffect(() => {
    if (initialFamily) {
      setSelectedFamily(initialFamily)
      startCamera(facingMode)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      drawGuide(cvs, aspect, scoreRaf.current, flashRaf.current, lockProgressRaf.current)
    }
    rafRef.current = requestAnimationFrame(drawLoop)
  }, [aspect])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawLoop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [drawLoop])

  // ── Capture + backend OCR ────────────────────────────────────────────────
  const doCapture = useCallback((video: HTMLVideoElement, dt: string, versoScan: boolean) => {
    lockStartRef.current = null
    lockProgressRaf.current = 0
    setLockProgress(0)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setPhaseSync('processing')

    // Flash blanc
    flashRaf.current = true
    setFlash(true)
    setTimeout(() => { flashRaf.current = false; setFlash(false) }, 180)

    setTimeout(() => {
      const cropped = cropGuide(video, ASPECT[dt] ?? ASPECT.CNI_RECTO)
      cropped.toBlob(async blob => {
        if (!blob) { setPhaseSync('scanning'); return }
        const url  = URL.createObjectURL(blob)
        const file = new File([blob], `${dt.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' })
        setPreviewUrl(url)

        try {
          const result = await callBackendOcr(blob, dt)

          if (!result.isIdDocument) {
            // Si c'est un scan verso — accepter quand même (le verso a peu de texte)
            if (versoScan) {
              capturesRef.current = [
                ...capturesRef.current.filter(c => c.docType !== dt),
                { file, docType: dt },
              ]
              setOcrData({
                nom: '', prenom: '', dob: '',
                nationality: '', documentNumber: '', expiry: '', side: 'verso',
              })
              setPhaseSync('confirming')
              return
            }
            setRejectReason(
              result.rejectReason ||
              "Document non reconnu. Présentez uniquement une pièce d'identité officielle avec photo."
            )
            setPhaseSync('rejected')
            return
          }

          // Succès
          capturesRef.current = [
            ...capturesRef.current.filter(c => c.docType !== dt),
            { file, docType: dt },
          ]
          if (!versoScan) setRectoPreview(url)
          setOcrData({
            nom:            result.nom,
            prenom:         result.prenom,
            dob:            result.dob,
            nationality:    result.nationality,
            documentNumber: result.documentNumber,
            expiry:         result.expiry,
            side:           result.side,
          })
          setPhaseSync('confirming')
        } catch {
          setRejectReason('Erreur de connexion. Vérifiez votre connexion internet et réessayez.')
          setPhaseSync('error')
        }
      }, 'image/jpeg', 0.95)
    }, 0)
  }, [setPhaseSync])

  // ── Blur scoring loop with auto-capture ──────────────────────────────────
  useEffect(() => {
    if (!camReady || phase !== 'scanning') {
      lockStartRef.current = null
      setLockProgress(0)
      return
    }
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const video = videoRef.current
      if (!video || phaseRef.current !== 'scanning') return

      const s = blurScoreInGuide(video, aspect)
      scoreRaf.current = s
      setScore(s)

      if (s >= LOCK_THRESHOLD) {
        if (!lockStartRef.current) lockStartRef.current = Date.now()
        const elapsed = Date.now() - lockStartRef.current
        const progress = Math.min(100, (elapsed / LOCK_DURATION) * 100)
        lockProgressRaf.current = progress
        setLockProgress(progress)
        if (elapsed >= LOCK_DURATION) {
          lockStartRef.current = null
          lockProgressRaf.current = 0
          setLockProgress(0)
          doCapture(video, currentDt, isVerso)
        }
      } else {
        if (lockStartRef.current) {
          lockStartRef.current = null
          lockProgressRaf.current = 0
          setLockProgress(0)
        }
      }
    }, 150)

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [camReady, phase, aspect, currentDt, isVerso, doCapture])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectFamily = useCallback((family: DocFamily) => {
    setSelectedFamily(family)
    setIsVerso(false)
    capturesRef.current = []
    startCamera(facingMode)
  }, [facingMode, startCamera])

  const handleManualCapture = () => {
    const video = videoRef.current
    if (!video || !camReady || phase !== 'scanning') return
    doCapture(video, currentDt, isVerso)
  }

  const handleRetry = useCallback(() => {
    lockStartRef.current = null
    lockProgressRaf.current = 0
    setLockProgress(0)
    scoreRaf.current = 0
    setScore(0)
    setPreviewUrl('')
    setRejectReason('')
    setOcrData(null)
    startCamera(facingMode)
  }, [facingMode, startCamera])

  const handleRectoVerified = () => setPhaseSync('flip')

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

  const familyLabel: Record<DocFamily, string> = {
    cni: "Carte d'identité", permis: 'Permis de conduire',
    passport: 'Passeport', sejour: 'Titre de séjour',
  }

  const statusMsg = lockProgress > 0
    ? 'Détection en cours… Ne bougez plus'
    : score >= LOCK_THRESHOLD
      ? 'Maintenu — prêt pour la capture'
      : 'Placez votre document dans le cadre'

  const pillBg = lockProgress > 0
    ? 'rgba(34,197,94,0.15)'
    : score >= LOCK_THRESHOLD
      ? 'rgba(196,151,106,0.15)'
      : 'rgba(0,0,0,0.55)'

  const pillBorder = lockProgress > 0
    ? 'rgba(34,197,94,0.5)'
    : score >= LOCK_THRESHOLD
      ? 'rgba(196,151,106,0.5)'
      : 'rgba(255,255,255,0.1)'

  const pillDot = lockProgress > 0
    ? '#22c55e'
    : score >= LOCK_THRESHOLD
      ? CARAMEL
      : 'rgba(255,255,255,0.3)'

  const pillTextColor = lockProgress > 0
    ? 'rgba(74,222,128,0.9)'
    : score >= LOCK_THRESHOLD
      ? CARAMEL
      : 'rgba(255,255,255,0.5)'

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

        {/* ── Processing ───────────────────────────────────────────────────── */}
        {phase === 'processing' && (
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
                  Analyse IA en cours — identification du document…
                </p>
                <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  Recadrage et envoi au serveur…
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

        {/* ── Confirming ───────────────────────────────────────────────────── */}
        {phase === 'confirming' && (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '72px 20px 140px', overflowY: 'auto',
          }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', filter: 'brightness(0.1) blur(8px)', transform: 'scale(1.1)',
              }} />
            )}

            <div style={{
              position: 'relative', zIndex: 1, width: '100%', maxWidth: 360,
              background: 'rgba(10,12,18,0.97)', border: '1px solid rgba(196,151,106,0.2)',
              borderRadius: 20, overflow: 'hidden',
            }}>
              {/* Thumbnail strip du document */}
              {previewUrl && (
                <div style={{ position: 'relative', height: 90, overflow: 'hidden' }}>
                  <img src={previewUrl} alt="" style={{
                    width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 30%, rgba(10,12,18,0.97) 100%)',
                  }} />
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: CARAMEL, borderRadius: '50%', width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'checkPop 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
                  }}>
                    <CheckCircle2 size={15} color="#fff" strokeWidth={3} />
                  </div>
                </div>
              )}

              <div style={{ padding: '14px 18px 18px' }}>
                {/* Badge doc type */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: CARAMEL, border: '1px solid rgba(196,151,106,0.3)', padding: '3px 10px', borderRadius: 20,
                  }}>
                    {selectedFamily ? familyLabel[selectedFamily] : 'Document'} — {isVerso ? 'Verso' : 'Recto'}
                  </span>
                </div>

                {/* Titre */}
                <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: BAI.fontBody }}>
                  {isVerso ? 'Verso capturé' : 'Vérifiez vos informations'}
                </p>

                {/* Données extraites */}
                {!isVerso && (ocrData?.nom || ocrData?.prenom || ocrData?.dob) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 4 }}>
                    {(ocrData.prenom || ocrData.nom) && (
                      <DataRow label="Identité" value={[ocrData.prenom, ocrData.nom].filter(Boolean).join(' ')} />
                    )}
                    {ocrData.dob            && <DataRow label="Date de naissance" value={fmt(ocrData.dob)} />}
                    {ocrData.expiry         && <DataRow label="Expire le"          value={fmt(ocrData.expiry)} />}
                    {ocrData.documentNumber && <DataRow label="N° document"        value={ocrData.documentNumber} />}
                  </div>
                ) : !isVerso ? (
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, textAlign: 'center' }}>
                    Aucune donnée extraite. Le document sera vérifié manuellement.
                  </p>
                ) : (
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, textAlign: 'center' }}>
                    Verso bien enregistré.
                  </p>
                )}

                {/* Question de confirmation — uniquement sur le recto avec données */}
                {!isVerso && (ocrData?.nom || ocrData?.prenom) && (
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
                    Ces informations sont-elles correctes ?
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: CARAMEL,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={13} color="#fff" strokeWidth={3} />
                </div>
                <div style={{ width: 28, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.2)' }} />
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>2</span>
                </div>
              </div>

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

              <div style={{ fontSize: 34, animation: 'rotateBounce 1.8s ease-in-out infinite', color: CARAMEL }}>
                ↻
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{
                  margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: CARAMEL, fontFamily: BAI.fontBody,
                }}>
                  Recto capturé
                </p>
                <p style={{
                  margin: '0 0 10px', fontFamily: BAI.fontDisplay,
                  fontSize: 24, fontWeight: 700, fontStyle: 'italic', color: '#fff',
                }}>
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
                    Attendu : {familyLabel[selectedFamily]} avec photo.
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
            <canvas ref={overlayRef} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2,
            }} />

            {/* Lock progress arc — visible quand le document est détecté */}
            {camReady && lockProgress > 0 && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 4, textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                pointerEvents: 'none',
              }}>
                <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(196,151,106,0.2)" strokeWidth={5} />
                  <circle
                    cx={40} cy={40} r={34} fill="none"
                    stroke={CARAMEL} strokeWidth={5}
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - lockProgress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.15s linear' }}
                  />
                </svg>
                <p style={{
                  margin: 0, fontSize: 12, fontWeight: 700, color: '#fff',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}>
                  Ne bougez plus…
                </p>
              </div>
            )}

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
                background: pillBg,
                border: `1px solid ${pillBorder}`,
                padding: '6px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: pillDot, flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: pillTextColor, fontWeight: 500 }}>
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

          {/* Scanning controls — shutter button as fallback */}
          {phase === 'scanning' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <button
                onClick={handleManualCapture}
                disabled={!camReady}
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: camReady ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                  border: `3px solid ${camReady ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  cursor: camReady ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: camReady ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                }} />
              </button>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0', textAlign: 'center' }}>
                Ou appuyez pour forcer la capture
              </p>
            </div>
          )}

          {/* Confirming — recto multi-step → flip */}
          {showFlipBtn && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              <Btn flex secondary onClick={handleRetry}>
                <RotateCcw size={14} /> Rescanner
              </Btn>
              <Btn flex primary onClick={handleRectoVerified}>
                Scanner le verso <ArrowRight size={13} />
              </Btn>
            </div>
          )}

          {/* Confirming — verso ou doc simple → terminer */}
          {showDoneBtn && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              <Btn flex secondary onClick={handleRetry}>
                <RotateCcw size={14} /> Rescanner
              </Btn>
              <Btn flex primary onClick={handleDone}>
                <CheckCircle2 size={14} />
                {isVerso ? 'Terminer' : 'Confirmer'}
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
  children, onClick, flex = false, primary = false, secondary = false,
}: {
  children: React.ReactNode
  onClick: () => void
  flex?: boolean
  primary?: boolean
  secondary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 16px', borderRadius: 10,
        ...(flex ? { flex: 1 } : {}),
        border: secondary ? '1px solid rgba(255,255,255,0.18)' : 'none',
        background: primary ? CARAMEL : 'rgba(255,255,255,0.12)',
        color: '#fff', fontSize: 13, fontWeight: primary ? 700 : 500,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontFamily: BAI.fontBody,
      }}
    >
      {children}
    </button>
  )
}

