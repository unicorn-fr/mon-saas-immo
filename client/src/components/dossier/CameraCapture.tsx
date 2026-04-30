/**
 * CameraCapture — Smart ID document scanner
 *
 * Pipeline:
 *  1. Analyse chaque frame @ 500ms : Sobel → détection des 4 coins extrêmes
 *  2. Mesure le flou (variance Laplacien) → avertit si tremblé
 *  3. Dessine le quadrilatère détecté sur un canvas overlay en temps réel
 *  4. Après 2 s stables : capture full-res + correction de perspective (homographie pure JS)
 *  5. Preview du document redressé → Reprendre / Utiliser
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ZapOff, FlipHorizontal, RotateCcw, Check } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

// ── Types ──────────────────────────────────────────────────────────────────────
type DocType = 'CNI_RECTO' | 'CNI_VERSO' | 'PASSEPORT' | 'TITRE_SEJOUR' | string
type Phase = 'scanning' | 'processing' | 'captured'

interface NormPoint { x: number; y: number } // normalized 0-1

interface AnalysisResult {
  score: number               // 0-1 detection confidence
  corners: NormPoint[] | null // [TL, TR, BR, BL] normalized, or null
  blurry: boolean
}

interface CameraCaptureProps {
  docType: DocType
  onCapture: (file: File) => void
  onClose: () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────
const GUIDE_LABELS: Record<string, string> = {
  CNI_RECTO:    'Recto de la CNI',
  CNI_VERSO:    'Verso de la CNI',
  PASSEPORT:    'Page photo du passeport',
  TITRE_SEJOUR: 'Titre de séjour',
}

const GUIDE_RATIOS: Record<string, { w: number; h: number }> = {
  CNI_RECTO:    { w: 85.6, h: 54.0 },
  CNI_VERSO:    { w: 85.6, h: 54.0 },
  PASSEPORT:    { w: 125,  h: 88   },
  TITRE_SEJOUR: { w: 85.6, h: 54.0 },
}

const STABLE_NEEDED = 4   // frames × 500 ms = 2 s
const INTERVAL_MS   = 500

// ── Pure-JS computer vision ───────────────────────────────────────────────────

/** Analyse a video frame: Sobel edge + corner detection + blur check. */
function analyzeFrame(video: HTMLVideoElement): AnalysisResult {
  const W = 320, H = 214
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { score: 0, corners: null, blurry: false }

  try {
    ctx.drawImage(video, 0, 0, W, H)
    const { data } = ctx.getImageData(0, 0, W, H)

    // Grayscale
    const gray = new Uint8Array(W * H)
    for (let i = 0; i < W * H; i++) {
      gray[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 151 + data[i * 4 + 2] * 28) >> 8
    }

    // Blur metric: variance of Laplacian
    let lapSum = 0, lapSq = 0, lapN = 0
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x
        const v = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - W] - gray[i + W]
        lapSum += v; lapSq += v * v; lapN++
      }
    }
    const lapMean = lapSum / lapN
    const lapVar  = lapSq / lapN - lapMean * lapMean
    const blurry  = lapVar < 55

    // Sobel + 4-corner extreme point detection (DLT corners)
    const EDGE_THRESH = 28
    const bests = [Infinity, Infinity, Infinity, Infinity]
    const pts: { x: number; y: number }[] = [
      { x: W / 2, y: H / 2 },
      { x: W / 2, y: H / 2 },
      { x: W / 2, y: H / 2 },
      { x: W / 2, y: H / 2 },
    ]

    const x0 = Math.floor(W * 0.04), x1 = Math.ceil(W * 0.96)
    const y0 = Math.floor(H * 0.04), y1 = Math.ceil(H * 0.96)

    let edgePixels = 0, totalPixels = 0

    for (let y = y0 + 1; y < y1 - 1; y++) {
      for (let x = x0 + 1; x < x1 - 1; x++) {
        totalPixels++
        const i = y * W + x
        const gx =
          -gray[i - W - 1] - 2 * gray[i - 1] - gray[i + W - 1]
          + gray[i - W + 1] + 2 * gray[i + 1] + gray[i + W + 1]
        const gy =
          -gray[i - W - 1] - 2 * gray[i - W] - gray[i - W + 1]
          + gray[i + W - 1] + 2 * gray[i + W] + gray[i + W + 1]
        const mag = Math.abs(gx) + Math.abs(gy)
        if (mag < EDGE_THRESH) continue
        edgePixels++

        const s = [x + y, (W - x) + y, (W - x) + (H - y), x + (H - y)]
        for (let k = 0; k < 4; k++) {
          if (s[k] < bests[k]) { bests[k] = s[k]; pts[k] = { x, y } }
        }
      }
    }

    const edgeDensity = totalPixels > 0 ? edgePixels / totalPixels : 0

    // Validate: quad must be sufficiently large
    const tltr = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
    const tlbl = Math.hypot(pts[3].x - pts[0].x, pts[3].y - pts[0].y)

    const valid = edgeDensity > 0.032 && tltr > W * 0.35 && tlbl > H * 0.22

    const corners: NormPoint[] | null = valid
      ? pts.map(p => ({ x: p.x / W, y: p.y / H }))
      : null

    const score = valid
      ? Math.min(1, (edgeDensity / 0.07) * (blurry ? 0.25 : 1))
      : edgeDensity * 0.25

    return { score, corners, blurry }
  } catch {
    return { score: 0, corners: null, blurry: false }
  }
}

// ── Homography (pure JS) ──────────────────────────────────────────────────────

function gaussElim(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row
    }
    ;[M[col], M[maxRow]] = [M[maxRow], M[col]]
    const piv = M[col][col]
    if (Math.abs(piv) < 1e-12) continue
    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const f = M[row][col] / piv
      for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k]
    }
  }
  return M.map((row, i) => row[n] / row[i])
}

function computeHomography(src: [number, number][], dst: [number, number][]): Float64Array {
  const A: number[][] = []
  const b: number[]   = []
  for (let i = 0; i < 4; i++) {
    const [x, y]   = src[i]
    const [xp, yp] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -xp * x, -xp * y]); b.push(xp)
    A.push([0, 0, 0, x, y, 1, -yp * x, -yp * y]); b.push(yp)
  }
  const h = gaussElim(A, b)
  return new Float64Array([h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1])
}

function applyH(H: Float64Array, x: number, y: number): [number, number] {
  const w = H[6] * x + H[7] * y + H[8]
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]
}

/**
 * Perspective-correct the document using 4 detected corners.
 * Inverse mapping: for each output pixel, back-project to source.
 */
function warpPerspective(
  srcCanvas: HTMLCanvasElement,
  corners: NormPoint[],
  outW: number,
  outH: number,
): string {
  const sw = srcCanvas.width, sh = srcCanvas.height
  const srcPts: [number, number][] = corners.map(c => [c.x * sw, c.y * sh])
  const dstPts: [number, number][] = [[0, 0], [outW, 0], [outW, outH], [0, outH]]
  const Hinv = computeHomography(dstPts, srcPts)

  const out    = document.createElement('canvas')
  out.width = outW; out.height = outH
  const octx   = out.getContext('2d')!
  const srcCtx = srcCanvas.getContext('2d')!
  const srcData = srcCtx.getImageData(0, 0, sw, sh)
  const outData = octx.createImageData(outW, outH)
  const s = srcData.data, d = outData.data

  for (let dy = 0; dy < outH; dy++) {
    for (let dx = 0; dx < outW; dx++) {
      const [sx, sy] = applyH(Hinv, dx, dy)
      const sxi = Math.round(sx), syi = Math.round(sy)
      if (sxi >= 0 && sxi < sw && syi >= 0 && syi < sh) {
        const si = (syi * sw + sxi) << 2
        const di = (dy  * outW + dx) << 2
        d[di] = s[si]; d[di + 1] = s[si + 1]; d[di + 2] = s[si + 2]; d[di + 3] = 255
      }
    }
  }
  octx.putImageData(outData, 0, 0)
  return out.toDataURL('image/jpeg', 0.95)
}

// ── Overlay renderer ──────────────────────────────────────────────────────────

function drawOverlay(
  canvas: HTMLCanvasElement,
  corners: NormPoint[] | null,
  guide: { w: number; h: number },
  score: number,
  stableFrames: number,
) {
  const W = canvas.width, H = canvas.height
  if (W === 0 || H === 0) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  if (corners && corners.length === 4) {
    const pts = corners.map(c => ({ x: c.x * W, y: c.y * H }))
    const isGreen = score > 0.55
    const col = isGreen ? '#4ade80' : BAI.caramel

    // Dark mask with polygon hole
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.52)'
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Glowing border
    ctx.shadowColor = col
    ctx.shadowBlur  = 16
    ctx.strokeStyle = col
    ctx.lineWidth   = 2.5
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.closePath()
    ctx.stroke()
    ctx.shadowBlur = 0

    // Corner dots
    pts.forEach(p => {
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fill()
    })

    // Countdown progress ring at center
    if (stableFrames > 0) {
      const cx = pts.reduce((s, p) => s + p.x, 0) / 4
      const cy = pts.reduce((s, p) => s + p.y, 0) / 4
      const r  = 22
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 3.5
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = col
      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (stableFrames / STABLE_NEEDED) * Math.PI * 2)
      ctx.stroke()
    }

    // Horizontal scan line animation
    const pct  = ((Date.now() % 1600) / 1600)
    const minY = Math.min(...pts.map(p => p.y))
    const maxY = Math.max(...pts.map(p => p.y))
    const minX = Math.min(...pts.map(p => p.x))
    const maxX = Math.max(...pts.map(p => p.x))
    const scanY = minY + pct * (maxY - minY)
    const alpha = isGreen ? 0.45 : 0.35
    const g = ctx.createLinearGradient(minX, scanY, maxX, scanY)
    g.addColorStop(0,   'rgba(0,0,0,0)')
    g.addColorStop(0.3, `rgba(${isGreen ? '74,222,128' : '196,151,106'},${alpha})`)
    g.addColorStop(0.7, `rgba(${isGreen ? '74,222,128' : '196,151,106'},${alpha})`)
    g.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.strokeStyle = g
    ctx.lineWidth   = 1.5
    ctx.beginPath(); ctx.moveTo(minX + 8, scanY); ctx.lineTo(maxX - 8, scanY); ctx.stroke()

  } else {
    // No document — static guide with corner brackets
    const aspect = guide.w / guide.h
    const maxGW  = W * 0.84, maxGH = H * 0.84
    let gW: number, gH: number
    if (maxGW / maxGH > aspect) { gH = maxGH; gW = gH * aspect }
    else { gW = maxGW; gH = gW / aspect }
    const gX = (W - gW) / 2, gY = (H - gH) / 2

    // Vignette
    ctx.fillStyle = 'rgba(0,0,0,0.52)'
    ctx.fillRect(0, 0, W, H)
    // Clear guide area
    ctx.clearRect(gX, gY, gW, gH)

    // Corner brackets
    const s = 26, t = 3
    ctx.strokeStyle = 'rgba(255,255,255,0.30)'
    ctx.lineWidth   = t
    const bracket = (bx: number, by: number, dx: number, dy: number) => {
      ctx.beginPath()
      ctx.moveTo(bx + dx * s, by)
      ctx.lineTo(bx, by)
      ctx.lineTo(bx, by + dy * s)
      ctx.stroke()
    }
    bracket(gX,      gY,       1,  1)
    bracket(gX + gW, gY,      -1,  1)
    bracket(gX,      gY + gH,  1, -1)
    bracket(gX + gW, gY + gH, -1, -1)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CameraCapture({ docType, onCapture, onClose }: CameraCaptureProps) {
  const videoRef         = useRef<HTMLVideoElement>(null)
  const overlayRef       = useRef<HTMLCanvasElement>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef           = useRef<number>(0)
  const stableRef        = useRef(0)
  const lastCornersRef   = useRef<NormPoint[] | null>(null)
  const lastScoreRef     = useRef(0)
  const phaseRef         = useRef<Phase>('scanning')

  const [facingMode,   setFacingMode]   = useState<'environment' | 'user'>('environment')
  const [ready,        setReady]        = useState(false)
  const [error,        setError]        = useState('')
  const [phase,        setPhase]        = useState<Phase>('scanning')
  const [stableFrames, setStableFrames] = useState(0)
  const [blurWarning,  setBlurWarning]  = useState(false)
  const [detected,     setDetected]     = useState(false)
  const [previewUrl,   setPreviewUrl]   = useState('')
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [flash,        setFlash]        = useState(false)

  const guide = GUIDE_RATIOS[docType] ?? GUIDE_RATIOS['CNI_RECTO']

  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── RAF overlay loop ──────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const canvas = overlayRef.current
    if (canvas && phaseRef.current === 'scanning') {
      const { offsetWidth: w, offsetHeight: h } = canvas
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
      drawOverlay(canvas, lastCornersRef.current, guide, lastScoreRef.current, stableRef.current)
    }
    rafRef.current = requestAnimationFrame(drawLoop)
  }, [guide])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawLoop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [drawLoop])

  // ── Capture + perspective warp ────────────────────────────────────────────
  const doCapture = useCallback((video: HTMLVideoElement, corners: NormPoint[] | null) => {
    setPhase('processing')
    phaseRef.current = 'processing'
    setFlash(true)
    setTimeout(() => setFlash(false), 220)

    const fc = document.createElement('canvas')
    fc.width = video.videoWidth; fc.height = video.videoHeight
    fc.getContext('2d')!.drawImage(video, 0, 0)

    const aspect = guide.w / guide.h
    const outW   = 960, outH = Math.round(outW / aspect)

    // Run in a microtask to not block UI
    setTimeout(() => {
      try {
        const url = corners && corners.length === 4
          ? warpPerspective(fc, corners, outW, outH)
          : (() => {
              // Fallback: crop center guide zone
              const cx = fc.width / 2, cy = fc.height / 2
              const cw = fc.width * 0.78, ch = cw / aspect
              const crop = document.createElement('canvas')
              crop.width = outW; crop.height = outH
              crop.getContext('2d')!.drawImage(fc, cx - cw / 2, cy - ch / 2, cw, ch, 0, 0, outW, outH)
              return crop.toDataURL('image/jpeg', 0.95)
            })()

        setPreviewUrl(url)
        const byteStr = atob(url.split(',')[1])
        const ab = new ArrayBuffer(byteStr.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i)
        const file = new File([ab], `${docType.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' })
        setCapturedFile(file)
        setPhase('captured')
      } catch {
        fc.toBlob(blob => {
          if (!blob) return
          setPreviewUrl(URL.createObjectURL(blob))
          setCapturedFile(new File([blob], `${docType.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' }))
          setPhase('captured')
        }, 'image/jpeg', 0.92)
      }
    }, 0)
  }, [docType, guide])

  // ── Analysis loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const video = videoRef.current
      if (!video || phaseRef.current !== 'scanning') return

      const { score, corners, blurry } = analyzeFrame(video)
      setBlurWarning(blurry)
      setDetected(!!corners)
      lastCornersRef.current = corners
      lastScoreRef.current   = score

      if (score > 0.45 && !blurry) {
        stableRef.current = Math.min(stableRef.current + 1, STABLE_NEEDED + 1)
        setStableFrames(stableRef.current)
        if (stableRef.current >= STABLE_NEEDED) {
          clearInterval(timerRef.current!)
          doCapture(video, corners)
        }
      } else {
        stableRef.current = 0
        setStableFrames(0)
      }
    }, INTERVAL_MS)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [ready, phase, doCapture])

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    stableRef.current = 0; lastCornersRef.current = null; lastScoreRef.current = 0
    setStableFrames(0); setReady(false); setError(''); setPhase('scanning')
    setPreviewUrl(''); setCapturedFile(null); setDetected(false); setBlurWarning(false)
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
        setError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur.")
      else if (msg.includes('NotFound'))
        setError("Aucune caméra détectée. Utilisez l'option d'import de fichier.")
      else
        setError("Impossible d'accéder à la caméra. Essayez de recharger la page.")
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [facingMode, startCamera])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleManualCapture = () => {
    const video = videoRef.current
    if (!video || !ready || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)
    doCapture(video, lastCornersRef.current)
  }

  const handleRetry = () => {
    stableRef.current = 0; lastCornersRef.current = null; lastScoreRef.current = 0
    setStableFrames(0); setPreviewUrl(''); setCapturedFile(null)
    setDetected(false); setBlurWarning(false); setPhase('scanning')
  }

  const handleConfirm = () => { if (capturedFile) onCapture(capturedFile) }

  // ── Status ────────────────────────────────────────────────────────────────
  const statusText =
    blurWarning ? '⚠ Tenez le téléphone immobile'
    : !detected ? '→ Cadrez votre document dans la zone'
    : stableFrames < STABLE_NEEDED ? `⚡ Document repéré — maintenez stable…`
    : '✓ Capture en cours…'

  const statusBg =
    blurWarning ? 'rgba(155,28,28,0.88)'
    : detected  ? 'rgba(196,151,106,0.92)'
    : 'rgba(0,0,0,0.68)'

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
            {phase === 'captured' ? 'Document extrait' : phase === 'processing' ? 'Traitement…' : 'Scan IA · Détection auto'}
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
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
            <ZapOff size={40} color="rgba(255,255,255,0.4)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>{error}</p>
            <button onClick={() => startCamera(facingMode)} style={{
              padding: '10px 22px', borderRadius: 8, background: BAI.caramel, border: 'none',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Réessayer</button>
          </div>
        ) : phase === 'processing' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.12)', borderTopColor: '#4ade80',
              animation: 'spin 0.9s linear infinite',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              Correction de perspective…
            </p>
          </div>
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
            <div style={{
              position: 'absolute', top: 12, right: '6%',
              background: '#4ade80', borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(74,222,128,0.5)',
            }}>
              <Check size={22} color="#14532d" strokeWidth={3} />
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef} playsInline muted
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: ready ? 1 : 0, transition: 'opacity 0.3s',
              }}
            />
            {flash && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 5, pointerEvents: 'none' }} />}
            <canvas
              ref={overlayRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }}
            />
            {ready && (
              <div style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
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
        padding: '18px 20px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 20, width: '100%', maxWidth: 420,
        background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
      }}>
        {phase === 'scanning' ? (
          <>
            <button onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.13)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.75)',
              }}>
              <FlipHorizontal size={20} />
            </button>

            <button onClick={handleManualCapture} disabled={!ready}
              title="Photographier maintenant"
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
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.75)',
              }}>
              <RotateCcw size={18} />
            </button>
          </>
        ) : phase === 'captured' ? (
          <>
            <button onClick={handleRetry} style={{
              flex: 1, maxWidth: 160, padding: '14px 0', borderRadius: 12,
              background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <RotateCcw size={15} />
              Reprendre
            </button>
            <button onClick={handleConfirm} style={{
              flex: 1, maxWidth: 160, padding: '14px 0', borderRadius: 12,
              background: '#4ade80', border: 'none',
              color: '#14532d', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <Check size={15} />
              Utiliser
            </button>
          </>
        ) : null}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
