/**
 * CameraCapture v3 — Scanner de pièce d'identité
 *
 * Pipeline :
 *  1. Charge OpenCV.js + jscanify (alias Vite → build browser)
 *  2. Détection stricte : aspect ratio + taille + stabilité 3 s
 *  3. Capture full-res + warpPerspective
 *  4. Vérification IA (Claude Haiku OCR) avec animation scan
 *  5. Rejet si non-pièce d'identité, sinon aperçu + confirmation
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ZapOff, FlipHorizontal, RotateCcw, Check, Loader2, ShieldOff } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

// ── Types ──────────────────────────────────────────────────────────────────────
type DocType = 'CNI_RECTO' | 'CNI_VERSO' | 'PASSEPORT' | 'TITRE_SEJOUR' | string
type Phase = 'loading-cv' | 'scanning' | 'processing' | 'verifying' | 'captured' | 'rejected' | 'ocr-error'

interface CornerPoint { x: number; y: number }

interface CameraCaptureProps {
  docType: DocType
  onCapture: (file: File) => void
  onClose: () => void
}

// ── Guide labels & aspect ratios ──────────────────────────────────────────────
const GUIDE_LABELS: Record<string, string> = {
  CNI_RECTO:    'Recto de la CNI',
  CNI_VERSO:    'Verso de la CNI',
  PASSEPORT:    'Page photo du passeport',
  TITRE_SEJOUR: 'Titre de séjour',
}

const GUIDE_ASPECT: Record<string, number> = {
  CNI_RECTO:    85.6 / 54.0,
  CNI_VERSO:    85.6 / 54.0,
  PASSEPORT:    125  / 88,
  TITRE_SEJOUR: 85.6 / 54.0,
}

// ── Detection thresholds ──────────────────────────────────────────────────────
// Stricter than before to avoid capturing random rectangles from the environment
const STABLE_NEEDED   = 6     // 6 × 500 ms = 3 s stable
const INTERVAL_MS     = 500
const ANALYSIS_W      = 480
const ANALYSIS_H      = 320
const MIN_W_RATIO     = 0.42  // detected width ≥ 42 % of analysis frame
const MIN_H_RATIO     = 0.30  // detected height ≥ 30 %
const MIN_AREA_RATIO  = 0.20  // quad area ≥ 20 % of frame (avoid thin strips)
const MIN_ASPECT      = 1.10  // min w/h — reject near-square shapes
const MAX_ASPECT      = 2.30  // max w/h — reject very elongated shapes

// ── OpenCV loader (singleton) ─────────────────────────────────────────────────
let _cvPromise: Promise<void> | null = null

function loadOpenCV(): Promise<void> {
  if (_cvPromise) return _cvPromise
  _cvPromise = new Promise((resolve, reject) => {
    const win = window as any
    if (win.cv?.Mat) { resolve(); return }
    const script   = document.createElement('script')
    script.src     = 'https://docs.opencv.org/4.7.0/opencv.js'
    script.async   = true
    script.onerror = () => reject(new Error('Échec du chargement OpenCV'))
    script.onload  = () => {
      const t0 = Date.now()
      const poll = setInterval(() => {
        if (win.cv?.Mat) { clearInterval(poll); resolve() }
        else if (Date.now() - t0 > 30_000) { clearInterval(poll); reject(new Error('OpenCV timeout')) }
      }, 80)
    }
    document.head.appendChild(script)
  })
  return _cvPromise
}

// ── Blur metric (Laplacian variance) ─────────────────────────────────────────
function isBlurry(video: HTMLVideoElement): boolean {
  const W = 160, H = 100
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false
  ctx.drawImage(video, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)
  const gray = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    gray[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 151 + data[i * 4 + 2] * 28) >> 8
  }
  let sum = 0, sq = 0, n = 0
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const v = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - W] - gray[i + W]
      sum += v; sq += v * v; n++
    }
  }
  return sq / n - (sum / n) ** 2 < 50
}

// ── Shoelace area for a quad ──────────────────────────────────────────────────
function quadArea(pts: CornerPoint[]): number {
  const [a, b, c, d] = pts
  return 0.5 * Math.abs(
    a.x * (b.y - d.y) + b.x * (c.y - a.y) + c.x * (d.y - b.y) + d.x * (a.y - c.y),
  )
}

// ── Corner bracket drawing ────────────────────────────────────────────────────
function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, size = 26, thickness = 3,
) {
  ctx.strokeStyle = color
  ctx.lineWidth   = thickness
  const b = (bx: number, by: number, dx: number, dy: number) => {
    ctx.beginPath()
    ctx.moveTo(bx + dx * size, by)
    ctx.lineTo(bx, by)
    ctx.lineTo(bx, by + dy * size)
    ctx.stroke()
  }
  b(x,     y,      1,  1)
  b(x + w, y,     -1,  1)
  b(x,     y + h,  1, -1)
  b(x + w, y + h, -1, -1)
}

// ── Overlay drawing ───────────────────────────────────────────────────────────
function drawDocumentOverlay(
  canvas: HTMLCanvasElement,
  corners: CornerPoint[] | null,
  aspect: number,
  stableFrames: number,
  blurry: boolean,
) {
  const W = canvas.width, H = canvas.height
  if (!W || !H) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  if (corners && corners.length === 4) {
    const [tl, tr, br, bl] = corners
    const isReady = stableFrames >= STABLE_NEEDED
    const isGood  = stableFrames > 0 && !blurry
    const color   = isReady ? '#4ade80' : isGood ? BAI.caramel : 'rgba(255,255,255,0.5)'

    // Dark mask with quad hole
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.48)'
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y)
    ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y)
    ctx.closePath(); ctx.fill()
    ctx.restore()

    // Glowing border
    ctx.shadowColor = color; ctx.shadowBlur = 18
    ctx.strokeStyle = color; ctx.lineWidth  = 2.5
    ctx.beginPath()
    ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y)
    ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y)
    ctx.closePath(); ctx.stroke()
    ctx.shadowBlur = 0

    // Corner dots
    ;[tl, tr, br, bl].forEach(p => {
      ctx.fillStyle = color
      ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill()
    })

    // Countdown progress ring
    if (stableFrames > 0) {
      const cx = (tl.x + tr.x + br.x + bl.x) / 4
      const cy = (tl.y + tr.y + br.y + bl.y) / 4
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 3.5
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.arc(cx, cy, 20, -Math.PI / 2, -Math.PI / 2 + (stableFrames / STABLE_NEEDED) * Math.PI * 2)
      ctx.stroke()
    }

    // Scan line
    const minY = Math.min(tl.y, tr.y), maxY = Math.max(bl.y, br.y)
    const minX = Math.min(tl.x, bl.x), maxX = Math.max(tr.x, br.x)
    const pct  = (Date.now() % 1800) / 1800
    const scanY = minY + pct * (maxY - minY)
    const g = ctx.createLinearGradient(minX, scanY, maxX, scanY)
    const rgb = isReady ? '74,222,128' : isGood ? '196,151,106' : '255,255,255'
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, `rgba(${rgb},0.4)`)
    g.addColorStop(0.7, `rgba(${rgb},0.4)`); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.strokeStyle = g; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(minX + 8, scanY); ctx.lineTo(maxX - 8, scanY); ctx.stroke()

  } else {
    // Static guide
    const maxGW = W * 0.84, maxGH = H * 0.84
    let gW: number, gH: number
    if (maxGW / maxGH > aspect) { gH = maxGH; gW = gH * aspect }
    else { gW = maxGW; gH = gW / aspect }
    const gX = (W - gW) / 2, gY = (H - gH) / 2

    ctx.fillStyle = 'rgba(0,0,0,0.52)'
    ctx.fillRect(0, 0, W, H)
    ctx.clearRect(gX, gY, gW, gH)
    drawCornerBrackets(ctx, gX, gY, gW, gH, 'rgba(255,255,255,0.28)')
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CameraCapture({ docType, onCapture, onClose }: CameraCaptureProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef     = useRef<number>(0)
  const stableRef  = useRef(0)
  const cornersRef = useRef<CornerPoint[] | null>(null)
  const stableRaf  = useRef(0)
  const blurryRef  = useRef(false)
  const phaseRef   = useRef<Phase>('loading-cv')
  const scannerRef = useRef<any>(null)

  const [facingMode,   setFacingMode]   = useState<'environment' | 'user'>('environment')
  const [ready,        setReady]        = useState(false)
  const [error,        setError]        = useState('')
  const [phase,        setPhase]        = useState<Phase>('loading-cv')
  const [cvError,      setCvError]      = useState('')
  const [stableFrames, setStableFrames] = useState(0)
  const [blurWarning,  setBlurWarning]  = useState(false)
  const [detected,     setDetected]     = useState(false)
  const [previewUrl,   setPreviewUrl]   = useState('')
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [flash,        setFlash]        = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const aspect = GUIDE_ASPECT[docType] ?? GUIDE_ASPECT['CNI_RECTO']

  const setPhaseSync = (p: Phase) => { phaseRef.current = p; setPhase(p) }

  // ── Load OpenCV + jscanify ─────────────────────────────────────────────────
  useEffect(() => {
    loadOpenCV()
      .then(() => import('jscanify'))
      .then(({ default: Jscanify }) => {
        scannerRef.current = new Jscanify()
        setPhaseSync('scanning')
      })
      .catch(e => setCvError(e.message ?? 'Erreur chargement scanner'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── RAF overlay loop ───────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const canvas = overlayRef.current
    if (canvas && phaseRef.current === 'scanning') {
      const { offsetWidth: w, offsetHeight: h } = canvas
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
      drawDocumentOverlay(canvas, cornersRef.current, aspect, stableRaf.current, blurryRef.current)
    }
    rafRef.current = requestAnimationFrame(drawLoop)
  }, [aspect])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawLoop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [drawLoop])

  // ── OCR verification ───────────────────────────────────────────────────────
  const doVerify = useCallback(async (file: File) => {
    setPhaseSync('verifying')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('docType', docType)
      const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken') ?? ''
      const res = await fetch('/api/v1/ocr/extract', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (!res.ok) {
        // Auth error or server down — show error, don't silently accept
        setRejectReason('Impossible de vérifier le document. Vérifiez votre connexion et réessayez.')
        setPhaseSync('ocr-error')
        return
      }
      const json = await res.json()
      const d = json?.data
      if (!d || d.isIdDocument === false) {
        // Explicitly rejected by AI
        setRejectReason(String(
          d?.rejectReason || 'Ce document n\'est pas une pièce d\'identité acceptée (CNI, passeport ou titre de séjour requis).'
        ))
        setPhaseSync('rejected')
      } else {
        setPhaseSync('captured')
      }
    } catch {
      // Network error — show error state, do NOT silently accept
      setRejectReason('Erreur de connexion. Vérifiez votre réseau et réessayez.')
      setPhaseSync('ocr-error')
    }
  }, [docType])

  // ── Perspective-corrected capture ──────────────────────────────────────────
  const doCapture = useCallback((video: HTMLVideoElement) => {
    setPhaseSync('processing')
    setFlash(true)
    setTimeout(() => setFlash(false), 220)

    const fc = document.createElement('canvas')
    fc.width = video.videoWidth; fc.height = video.videoHeight
    fc.getContext('2d')!.drawImage(video, 0, 0)

    const outW = 1000, outH = Math.round(outW / aspect)

    setTimeout(() => {
      try {
        const scanner = scannerRef.current
        const paperCanvas: HTMLCanvasElement | null = scanner
          ? scanner.extractPaper(fc, outW, outH)
          : null

        const sourceCanvas = paperCanvas ?? (() => {
          const c = document.createElement('canvas')
          c.width = outW; c.height = outH
          const cx = fc.width / 2, cy = fc.height / 2
          const cw = fc.width * 0.80, ch = cw / aspect
          c.getContext('2d')!.drawImage(fc, cx - cw / 2, cy - ch / 2, cw, ch, 0, 0, outW, outH)
          return c
        })()

        sourceCanvas.toBlob(blob => {
          if (!blob) { setPhaseSync('scanning'); return }
          const url  = URL.createObjectURL(blob)
          const file = new File([blob], `${docType.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' })
          setPreviewUrl(url)
          setCapturedFile(file)
          doVerify(file)         // → 'verifying' phase
        }, 'image/jpeg', 0.95)
      } catch {
        fc.toBlob(blob => {
          if (!blob) { setPhaseSync('scanning'); return }
          const url  = URL.createObjectURL(blob)
          const file = new File([blob], `${docType.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' })
          setPreviewUrl(url)
          setCapturedFile(file)
          doVerify(file)
        }, 'image/jpeg', 0.92)
      }
    }, 0)
  }, [docType, aspect, doVerify])

  // ── Analysis loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const video   = videoRef.current
      const scanner = scannerRef.current
      if (!video || !scanner || phaseRef.current !== 'scanning') return

      const blurry = isBlurry(video)
      blurryRef.current = blurry
      setBlurWarning(blurry)

      const win = window as any
      if (!win.cv?.Mat) return

      const offscreen = document.createElement('canvas')
      offscreen.width = ANALYSIS_W; offscreen.height = ANALYSIS_H
      offscreen.getContext('2d')!.drawImage(video, 0, 0, ANALYSIS_W, ANALYSIS_H)

      let isDetected = false
      try {
        const cvImg   = win.cv.imread(offscreen)
        const contour = scanner.findPaperContour(cvImg)

        if (contour) {
          const { topLeftCorner: tl, topRightCorner: tr, bottomLeftCorner: bl, bottomRightCorner: br }
            = scanner.getCornerPoints(contour, cvImg)
          cvImg.delete()

          if (tl && tr && bl && br) {
            const w     = Math.hypot(tr.x - tl.x, tr.y - tl.y)
            const h     = Math.hypot(bl.x - tl.x, bl.y - tl.y)
            const ratio = w / Math.max(h, 1)
            const area  = quadArea([tl, tr, br, bl])
            const frameArea = ANALYSIS_W * ANALYSIS_H

            // Strict validation — must look like a real ID card
            if (
              w > ANALYSIS_W * MIN_W_RATIO &&
              h > ANALYSIS_H * MIN_H_RATIO &&
              area / frameArea >= MIN_AREA_RATIO &&
              ratio >= MIN_ASPECT &&
              ratio <= MAX_ASPECT
            ) {
              isDetected = true
              const overlay = overlayRef.current
              const scaleX  = overlay ? overlay.offsetWidth  / ANALYSIS_W : 1
              const scaleY  = overlay ? overlay.offsetHeight / ANALYSIS_H : 1
              cornersRef.current = [
                { x: tl.x * scaleX, y: tl.y * scaleY },
                { x: tr.x * scaleX, y: tr.y * scaleY },
                { x: br.x * scaleX, y: br.y * scaleY },
                { x: bl.x * scaleX, y: bl.y * scaleY },
              ]
            }
          }
        } else {
          cvImg.delete()
        }
      } catch { /* ignore frame */ }

      setDetected(isDetected)

      if (isDetected && !blurry) {
        stableRef.current = Math.min(stableRef.current + 1, STABLE_NEEDED + 1)
        stableRaf.current = stableRef.current
        setStableFrames(stableRef.current)

        if (stableRef.current >= STABLE_NEEDED) {
          clearInterval(timerRef.current!)
          doCapture(video)
        }
      } else {
        stableRef.current = 0; stableRaf.current = 0; setStableFrames(0)
        if (!isDetected) cornersRef.current = null
      }
    }, INTERVAL_MS)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [ready, phase, doCapture])

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    stableRef.current = 0; stableRaf.current = 0; cornersRef.current = null
    setStableFrames(0); setReady(false); setError('')
    setDetected(false); setBlurWarning(false)
    if (phaseRef.current !== 'loading-cv') setPhaseSync('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setReady(true) }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('NotAllowed') || msg.includes('Permission'))
        setError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres.")
      else if (msg.includes('NotFound'))
        setError("Aucune caméra détectée.")
      else
        setError("Impossible d'accéder à la caméra. Rechargez la page.")
    }
  }, [])

  useEffect(() => {
    if (phase === 'scanning') startCamera(facingMode)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleFacingMode = (mode: 'environment' | 'user') => {
    setFacingMode(mode); startCamera(mode)
  }

  const handleManualCapture = () => {
    const video = videoRef.current
    if (!video || !ready || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)
    doCapture(video)
  }

  const handleRetry = () => {
    stableRef.current = 0; stableRaf.current = 0; cornersRef.current = null
    setStableFrames(0); setPreviewUrl(''); setCapturedFile(null)
    setRejectReason(''); setDetected(false); setBlurWarning(false)
    setPhaseSync('scanning')
  }

  const handleConfirm = () => { if (capturedFile) onCapture(capturedFile) }

  // ── Status text ───────────────────────────────────────────────────────────
  const statusText =
    blurWarning ? '⚠ Tenez immobile'
    : !detected  ? '→ Cadrez votre pièce d\'identité'
    : stableFrames < STABLE_NEEDED ? `⚡ Document repéré — maintenez stable`
    : '✓ Capture en cours…'

  const statusBg =
    blurWarning ? 'rgba(155,28,28,0.88)'
    : detected  ? 'rgba(196,151,106,0.92)'
    : 'rgba(0,0,0,0.68)'

  // ── Header label ─────────────────────────────────────────────────────────
  const headerLabel = {
    'loading-cv':  'Chargement…',
    'scanning':    'Scan IA · Détection automatique',
    'processing':  'Traitement…',
    'verifying':   'Vérification IA',
    'captured':    'Document extrait',
    'rejected':    'Document refusé',
    'ocr-error':   'Erreur de vérification',
  }[phase]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: BAI.fontBody,
    }}>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {headerLabel}
          </p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>
            {GUIDE_LABELS[docType] ?? docType}
          </p>
        </div>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <X size={17} />
        </button>
      </div>

      {/* Viewport */}
      <div style={{
        position: 'relative', width: '100%', flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>

        {/* ── OpenCV error ───────────────────────────────────────────────── */}
        {cvError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
            <ZapOff size={40} color="rgba(255,255,255,0.4)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
              {cvError}<br />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Vérifiez votre connexion internet.</span>
            </p>
          </div>

        /* ── Loading OpenCV ─────────────────────────────────────────────── */
        ) : phase === 'loading-cv' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Loader2 size={40} color={BAI.caramel} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Initialisation du scanner IA…</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>Téléchargement OpenCV (~8 Mo, une seule fois)</p>
            </div>
          </div>

        /* ── Camera error ───────────────────────────────────────────────── */
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
            <ZapOff size={40} color="rgba(255,255,255,0.4)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>{error}</p>
            <button onClick={() => startCamera(facingMode)} style={{
              padding: '10px 22px', borderRadius: 8, background: BAI.caramel,
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Réessayer</button>
          </div>

        /* ── Perspective correction ─────────────────────────────────────── */
        ) : phase === 'processing' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.12)', borderTopColor: '#4ade80',
              animation: 'spin 0.9s linear infinite',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Correction de perspective…</p>
          </div>

        /* ── IA Verification (new phase) ────────────────────────────────── */
        ) : (phase === 'verifying' || phase === 'rejected' || phase === 'ocr-error') && previewUrl ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Background: captured image, dimmed */}
            <img
              src={previewUrl} alt="Document capturé"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', padding: '60px 24px',
                filter: phase === 'rejected' ? 'brightness(0.25) saturate(0.3)' : 'brightness(0.35)',
              }}
            />

            {/* Scanning animation overlay (only during verifying) */}
            {phase === 'verifying' && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Scan frame */}
                <div style={{
                  position: 'relative',
                  width: 'min(340px, 80vw)',
                  height: 'min(220px, 52vw)',
                  border: '1.5px solid rgba(74,222,128,0.35)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  animation: 'framePulse 2s ease-in-out infinite',
                }}>
                  {/* Corner brackets */}
                  {([
                    { top: -1, left: -1, borderRight: 'none', borderBottom: 'none' },
                    { top: -1, right: -1, borderLeft: 'none', borderBottom: 'none' },
                    { bottom: -1, left: -1, borderRight: 'none', borderTop: 'none' },
                    { bottom: -1, right: -1, borderLeft: 'none', borderTop: 'none' },
                  ] as React.CSSProperties[]).map((s, i) => (
                    <div key={i} style={{
                      position: 'absolute', width: 24, height: 24,
                      border: '2.5px solid #4ade80',
                      borderRadius: i === 0 ? '8px 0 0 0' : i === 1 ? '0 8px 0 0' : i === 2 ? '0 0 0 8px' : '0 0 8px 0',
                      ...s,
                    }} />
                  ))}

                  {/* Moving scan line */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.9) 30%, #fff 50%, rgba(74,222,128,0.9) 70%, transparent)',
                    boxShadow: '0 0 16px 4px rgba(74,222,128,0.35)',
                    animation: 'scanLine 2s ease-in-out infinite',
                  }}>
                    {/* Glow beam below the line */}
                    <div style={{
                      position: 'absolute', top: 0, bottom: -60, left: 0, right: 0,
                      background: 'linear-gradient(to bottom, rgba(74,222,128,0.10), transparent)',
                      pointerEvents: 'none',
                    }} />
                  </div>

                  {/* Grid overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `
                      linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }} />
                </div>

                {/* Text */}
                <div style={{ marginTop: 32, textAlign: 'center', zIndex: 1 }}>
                  <p style={{ margin: '0 0 6px', color: '#fff', fontSize: 15, fontWeight: 600 }}>
                    Vérification IA en cours
                  </p>
                  <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    Analyse de la pièce d'identité…
                  </p>
                  {/* Animated dots */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#4ade80',
                        animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rejection / OCR error overlay */}
            {(phase === 'rejected' || phase === 'ocr-error') && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 32, textAlign: 'center',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(155,28,28,0.25)', border: '2px solid rgba(255,100,100,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                }}>
                  <ShieldOff size={32} color="#f87171" />
                </div>
                <p style={{ margin: '0 0 8px', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                  Document non reconnu
                </p>
                <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.55)', fontSize: 13, maxWidth: 300, lineHeight: 1.6 }}>
                  {rejectReason}
                </p>
                <button onClick={handleRetry} style={{
                  padding: '12px 28px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <RotateCcw size={15} /> Reprendre le scan
                </button>
              </div>
            )}
          </div>

        /* ── Preview after verification ─────────────────────────────────── */
        ) : phase === 'captured' && previewUrl ? (
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={previewUrl} alt="Document extrait"
              style={{
                maxWidth: '90%', maxHeight: 'calc(100dvh - 220px)',
                objectFit: 'contain', borderRadius: 10,
                boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
              }}
            />
            {/* Success badge */}
            <div style={{
              position: 'absolute', top: 12, right: '6%',
              background: '#4ade80', borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(74,222,128,0.5)',
            }}>
              <Check size={22} color="#14532d" strokeWidth={3} />
            </div>
            {/* "Verified" label */}
            <div style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
              borderRadius: 20, padding: '5px 14px',
              fontSize: 12, color: '#4ade80', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              ✓ Pièce d'identité vérifiée
            </div>
          </div>

        /* ── Live camera + overlay ───────────────────────────────────────── */
        ) : (
          <>
            <video
              ref={videoRef} playsInline muted
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: ready ? 1 : 0, transition: 'opacity 0.3s',
              }}
            />
            {flash && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 5, pointerEvents: 'none' }} />
            )}
            <canvas
              ref={overlayRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }}
            />
            {/* Status pill */}
            {ready && (
              <div style={{
                position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
                zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  background: statusBg, padding: '6px 18px', borderRadius: 20,
                  fontSize: 12, color: '#fff', whiteSpace: 'nowrap', transition: 'background 0.3s',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
                }}>
                  {statusText}
                </div>
                {stableFrames > 0 && (
                  <div style={{ width: 140, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.18)' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: stableFrames >= STABLE_NEEDED ? '#4ade80' : BAI.caramel,
                      width: `${Math.min((stableFrames / STABLE_NEEDED) * 100, 100)}%`,
                      transition: 'width 0.35s ease, background 0.3s',
                    }} />
                  </div>
                )}
              </div>
            )}
            {!ready && !error && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 3 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.15)', borderTopColor: BAI.caramel,
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Initialisation…</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{
        padding: '16px 20px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 20, width: '100%', maxWidth: 420,
        background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
        minHeight: 100,
      }}>
        {phase === 'scanning' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 300 }}>
            {/* Capture hint */}
            <p style={{
              margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.05em', textAlign: 'center',
            }}>
              Détection auto · ou appuyez sur ○ pour photographier
            </p>

            {/* Buttons row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%' }}>
              <button
                onClick={() => handleFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.13)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.75)',
                }}>
                <FlipHorizontal size={20} />
              </button>

              <button onClick={handleManualCapture} disabled={!ready} title="Photographier maintenant"
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: ready ? '#fff' : 'rgba(255,255,255,0.2)',
                  border: `4px solid ${ready ? BAI.caramel : 'rgba(255,255,255,0.08)'}`,
                  cursor: ready ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: ready ? '0 0 0 6px rgba(196,151,106,0.22)' : 'none',
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: ready ? BAI.caramel : 'rgba(255,255,255,0.25)',
                }} />
              </button>

              <button onClick={() => startCamera(facingMode)}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.13)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.75)',
                }}>
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        )}

        {phase === 'captured' && (
          <>
            <button onClick={handleRetry} style={{
              flex: 1, maxWidth: 160, padding: '14px 0', borderRadius: 12,
              background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <RotateCcw size={15} /> Reprendre
            </button>
            <button onClick={handleConfirm} style={{
              flex: 1, maxWidth: 160, padding: '14px 0', borderRadius: 12,
              background: '#4ade80', border: 'none',
              color: '#14532d', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <Check size={15} /> Utiliser
            </button>
          </>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes scanLine {
          0%   { top: 4% }
          48%  { top: 88% }
          52%  { top: 88% }
          100% { top: 4% }
        }
        @keyframes framePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); border-color: rgba(74,222,128,0.35) }
          50%       { box-shadow: 0 0 24px 4px rgba(74,222,128,0.12); border-color: rgba(74,222,128,0.7) }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5 }
          40%            { transform: scale(1.2); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
