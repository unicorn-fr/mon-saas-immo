/**
 * LiveDocumentScanner
 * Scan de document en direct avec guide visuel, détection de qualité (netteté + luminosité)
 * et capture automatique — inspiré du scan Yousign / Google Pay.
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, ZapOff, CheckCircle, RotateCcw, Zap } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

interface LiveDocumentScannerProps {
  onCapture: (file: File) => void
  onCancel: () => void
  docType: 'CNI' | 'PERMIS_CONDUIRE'
}

interface QualityReport {
  sharpness: number   // 0-100
  brightness: number  // 0-100 (50 = ideal)
  score: number       // 0-100 global
  label: 'Mauvais' | 'Moyen' | 'Bon' | 'Excellent'
  color: string
  ready: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Laplacian variance → mesure de netteté (plus c'est haut = plus c'est net) */
function measureSharpness(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  // Sample au centre du cadre guide (60% × 70% de l'image)
  const x0 = Math.floor(w * 0.20)
  const y0 = Math.floor(h * 0.15)
  const sw = Math.floor(w * 0.60)
  const sh = Math.floor(h * 0.70)
  const data = ctx.getImageData(x0, y0, sw, sh).data

  let sum = 0
  let count = 0
  const stride = sw * 4

  for (let y = 1; y < sh - 1; y += 2) {
    for (let x = 1; x < sw - 1; x += 2) {
      const i = (y * sw + x) * 4
      const c = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      const r = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6]
      const l = 0.299 * data[i - 4] + 0.587 * data[i - 5] + 0.114 * data[i - 6]
      const t = 0.299 * data[i - stride] + 0.587 * data[i - stride + 1] + 0.114 * data[i - stride + 2]
      const b = 0.299 * data[i + stride] + 0.587 * data[i + stride + 1] + 0.114 * data[i + stride + 2]
      sum += Math.abs(4 * c - r - l - t - b)
      count++
    }
  }
  // Normalize: typically 0-30 range → map to 0-100
  return Math.min(100, (sum / (count || 1)) * 4)
}

function measureBrightness(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const data = ctx.getImageData(Math.floor(w * 0.20), Math.floor(h * 0.15),
    Math.floor(w * 0.60), Math.floor(h * 0.70)).data
  let total = 0
  let count = 0
  for (let i = 0; i < data.length; i += 16) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    count++
  }
  return (total / (count || 1)) / 255 * 100
}

function getQuality(sharpness: number, brightness: number): QualityReport {
  // Brightness ideal: 40-75 (0-40 = trop sombre, 75-100 = trop clair/reflet)
  const brightScore = brightness < 20 ? 20
    : brightness > 85 ? Math.max(0, 100 - (brightness - 85) * 5)
    : brightness < 40 ? 60 + (brightness - 20) * 2
    : brightness > 70 ? 100 - (brightness - 70) * 3
    : 100

  const score = Math.round(sharpness * 0.65 + brightScore * 0.35)

  let label: QualityReport['label']
  let color: string
  if (score >= 72) { label = 'Excellent'; color = BAI.tenant }
  else if (score >= 48) { label = 'Bon'; color = '#c4976a' }
  else if (score >= 28) { label = 'Moyen'; color = '#92400e' }
  else { label = 'Mauvais'; color = BAI.error }

  return { sharpness, brightness, score, label, color, ready: score >= 65 }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveDocumentScanner({ onCapture, onCancel, docType }: LiveDocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const readyFrames = useRef(0)
  const autoCaptureDone = useRef(false)

  const [quality, setQuality] = useState<QualityReport | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)   // preview URL
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  // Aspect ratio: CNI = 85.6×54mm = 1.586, permis ≈ même format
  const GUIDE_RATIO = 1.586

  // ─── Draw overlay ───────────────────────────────────────────────────────────

  const drawOverlay = useCallback((
    canvas: HTMLCanvasElement,
    q: QualityReport | null,
    videoW: number,
    videoH: number
  ) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dim everything outside the guide
    const gw = Math.floor(canvas.width * 0.85)
    const gh = Math.floor(gw / GUIDE_RATIO)
    const gx = Math.floor((canvas.width - gw) / 2)
    const gy = Math.floor((canvas.height - gh) / 2)

    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Cut out the guide rectangle
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillRect(gx, gy, gw, gh)
    ctx.globalCompositeOperation = 'source-over'

    // Guide border
    const borderColor = q?.ready ? BAI.tenant : (q?.label === 'Bon' ? '#c4976a' : 'rgba(255,255,255,0.7)')
    ctx.strokeStyle = borderColor
    ctx.lineWidth = q?.ready ? 3 : 2
    ctx.strokeRect(gx, gy, gw, gh)

    // Corner marks
    const cs = 24
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 4
    ;[
      [gx, gy, cs, cs],
      [gx + gw, gy, -cs, cs],
      [gx, gy + gh, cs, -cs],
      [gx + gw, gy + gh, -cs, -cs],
    ].forEach(([x, y, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy); ctx.stroke()
    })

    void videoW; void videoH
  }, [GUIDE_RATIO])

  // ─── Analysis loop ──────────────────────────────────────────────────────────

  const analysisLoop = useCallback(() => {
    const video = videoRef.current
    const overlay = overlayCanvasRef.current
    const capture = captureCanvasRef.current
    if (!video || !overlay || !capture || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analysisLoop)
      return
    }

    const vw = video.videoWidth || 640
    const vh = video.videoHeight || 480

    if (overlay.width !== vw || overlay.height !== vh) {
      overlay.width = vw; overlay.height = vh
    }
    if (capture.width !== vw || capture.height !== vh) {
      capture.width = vw; capture.height = vh
    }

    // Draw current frame to capture canvas for analysis
    const captureCtx = capture.getContext('2d')
    if (captureCtx) {
      captureCtx.drawImage(video, 0, 0, vw, vh)
      const sharp = measureSharpness(captureCtx, vw, vh)
      const bright = measureBrightness(captureCtx, vw, vh)
      const q = getQuality(sharp, bright)

      setQuality(q)
      drawOverlay(overlay, q, vw, vh)

      // Auto-capture after 1.2s of "ready" frames
      if (q.ready && !autoCaptureDone.current) {
        readyFrames.current++
        if (readyFrames.current >= 18) { // ~18 frames @ 60fps ≈ 1.2s
          autoCaptureDone.current = true
          doCapture(captureCtx, vw, vh)
          return
        }
      } else {
        readyFrames.current = Math.max(0, readyFrames.current - 2)
      }
    }

    rafRef.current = requestAnimationFrame(analysisLoop)
  }, [drawOverlay])

  // ─── Capture ────────────────────────────────────────────────────────────────

  const doCapture = useCallback((ctx?: CanvasRenderingContext2D, w?: number, h?: number) => {
    const capture = captureCanvasRef.current
    const video = videoRef.current
    if (!capture) return

    const vw = w ?? video?.videoWidth ?? 640
    const vh = h ?? video?.videoHeight ?? 480
    const c = ctx ?? capture.getContext('2d')
    if (!c) return

    if (!ctx) { // Manual capture: draw current frame
      c.drawImage(video!, 0, 0, vw, vh)
    }

    // Crop to guide area (85% width, guide ratio height, centered)
    const gw = Math.floor(vw * 0.85)
    const gh = Math.floor(gw / GUIDE_RATIO)
    const gx = Math.floor((vw - gw) / 2)
    const gy = Math.floor((vh - gh) / 2)

    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = gw
    cropCanvas.height = gh
    const cropCtx = cropCanvas.getContext('2d')!
    cropCtx.drawImage(capture, gx, gy, gw, gh, 0, 0, gw, gh)

    cropCanvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setCaptured(url)
      setCapturedBlob(blob)
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }, 'image/jpeg', 0.92)
  }, [GUIDE_RATIO])

  const handleManualCapture = useCallback(() => {
    autoCaptureDone.current = true
    doCapture()
  }, [doCapture])

  const handleRetake = useCallback(() => {
    autoCaptureDone.current = false
    readyFrames.current = 0
    setCaptured(null)
    setCapturedBlob(null)
    startCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Confirm ────────────────────────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    if (!capturedBlob) return
    const file = new File([capturedBlob], `kyc_scan_${Date.now()}.jpg`, { type: 'image/jpeg' })
    onCapture(file)
  }, [capturedBlob, onCapture])

  // ─── Camera ─────────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setCameraError(null)
    autoCaptureDone.current = false
    readyFrames.current = 0
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        rafRef.current = requestAnimationFrame(analysisLoop)
      }
    } catch (e) {
      const err = e as { name?: string }
      if (err.name === 'NotAllowedError') {
        setCameraError('Accès à la caméra refusé. Autorisez l\'accès dans les paramètres du navigateur.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('Aucune caméra détectée sur cet appareil.')
      } else {
        setCameraError('Impossible d\'accéder à la caméra. Utilisez l\'import de fichier à la place.')
      }
    }
  }, [facingMode, analysisLoop])

  const toggleCamera = useCallback(() => {
    setFacingMode(m => m === 'environment' ? 'user' : 'environment')
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [startCamera])

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (cameraError) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <ZapOff size={40} color={BAI.inkFaint} style={{ marginBottom: 16 }} />
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.error, marginBottom: 20, lineHeight: 1.6 }}>
          {cameraError}
        </p>
        <button onClick={onCancel} style={{
          background: BAI.night, color: '#fff', border: 'none',
          borderRadius: 8, padding: '12px 24px', fontFamily: BAI.fontBody,
          fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>
          ← Importer un fichier
        </button>
      </div>
    )
  }

  if (captured) {
    return (
      <div>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, marginBottom: 12 }}>
          Document capturé — vérifiez que le texte est lisible avant de continuer.
        </p>
        <img
          src={captured}
          alt="Document capturé"
          style={{ width: '100%', borderRadius: 10, marginBottom: 14, objectFit: 'contain',
            border: `1px solid ${BAI.border}`, maxHeight: 220 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleRetake}
            style={{
              flex: 1, padding: '12px', background: BAI.bgMuted,
              border: `1px solid ${BAI.border}`, borderRadius: 8,
              fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14,
              color: BAI.ink, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <RotateCcw size={15} /> Reprendre
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 2, padding: '12px', background: BAI.night,
              border: 'none', borderRadius: 8,
              fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15,
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <CheckCircle size={16} /> Utiliser cette capture
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Instruction */}
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '0 0 12px', lineHeight: 1.5 }}>
        Placez votre <strong>{docType === 'CNI' ? 'carte d\'identité' : 'permis de conduire'}</strong> dans le cadre,
        bien éclairé et à plat. La capture se déclenche automatiquement.
      </p>

      {/* Camera viewport */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 12 }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }}
        />
        {/* Overlay canvas (guide + dimming) */}
        <canvas
          ref={overlayCanvasRef}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none',
          }}
        />
        {/* Hidden analysis canvas */}
        <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

        {/* Quality badge */}
        {quality && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', borderRadius: 20,
            padding: '4px 14px', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: quality.color }} />
            <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#fff', fontWeight: 600 }}>
              {quality.label} — {quality.score}%
            </span>
          </div>
        )}

        {/* Auto-capture progress bar */}
        {quality?.ready && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (readyFrames.current / 18) * 100)}%`,
              background: BAI.tenant,
              transition: 'width 0.05s linear',
            }} />
          </div>
        )}

        {/* Flip camera button (mobile) */}
        <button
          onClick={toggleCamera}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', color: '#fff',
            fontFamily: BAI.fontBody, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <Camera size={12} /> Retourner
        </button>
      </div>

      {/* Tips based on quality */}
      {quality && !quality.ready && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 12,
          background: 'rgba(164,120,70,0.08)', border: `1px solid rgba(164,120,70,0.25)`,
        }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
            {quality.brightness < 30 && '💡 Trop sombre — éclairez davantage le document. '}
            {quality.brightness > 80 && '🔆 Reflet détecté — inclinez légèrement le document. '}
            {quality.sharpness < 30 && '📸 Image floue — rapprochez-vous et maintenez l\'appareil stable.'}
          </p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '12px',
            background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
            borderRadius: 8, fontFamily: BAI.fontBody, fontWeight: 600,
            fontSize: 13, color: BAI.ink, cursor: 'pointer',
          }}
        >
          Importer un fichier
        </button>
        <button
          onClick={handleManualCapture}
          style={{
            flex: 2, padding: '12px',
            background: quality?.ready ? BAI.tenant : BAI.night,
            border: 'none', borderRadius: 8,
            fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 14,
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s',
          }}
        >
          <Zap size={16} />
          {quality?.ready ? 'Capturer maintenant' : 'Capturer'}
        </button>
      </div>

      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, textAlign: 'center', marginTop: 10 }}>
        Capture automatique quand la qualité est "Excellent"
      </p>
    </div>
  )
}
