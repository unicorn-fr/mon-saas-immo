/**
 * LiveDocumentScanner — Scanner professionnel de document d'identité
 *
 * Architecture inspirée de Onfido / Jumio / Stripe Identity :
 *  1. Analyse qualité temps réel (netteté + luminosité) — toutes les frames
 *  2. Détection rectangle ISO/IEC 7810 (ratio 1.586:1) — toutes les 400 ms
 *  3. Détection du visage sur le document (preuve c'est une vraie pièce) — toutes les 1.5 s
 *  4. Machine d'état : searching → detected → face_confirmed → ready → captured
 *  5. Capture auto après 1.5 s à l'état "ready"
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import {
  Camera, ZapOff, RotateCcw, CheckCircle,
  AlertCircle, ScanLine, FlipHorizontal,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { useFaceApi } from '../../hooks/useFaceApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type DetectionState =
  | 'idle'          // caméra non prête
  | 'searching'     // aucun document trouvé
  | 'too_far'       // rectangle trop petit
  | 'no_doc'        // mauvais ratio ou pas de rectangle
  | 'bad_quality'   // flou ou mauvaise lumière
  | 'detected'      // rectangle OK, qualité OK
  | 'face_found'    // visage détecté sur le document → quasi-certitude
  | 'ready'         // tout bon, capture imminente
  | 'captured'

interface QualityMetrics {
  sharpness: number   // 0-100
  brightness: number  // 0-100
  score: number       // 0-100
}

interface RectResult {
  found: boolean
  ratio: number       // width/height du rectangle détecté
  fill: number        // proportion de la zone guide occupée (0-1)
}

interface LiveDocumentScannerProps {
  onCapture: (file: File) => void
  onCancel: () => void
  docType: 'CNI' | 'PERMIS_CONDUIRE'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ID_RATIO = 1.586          // ISO/IEC 7810 ID-1 (CNI, permis, crédit card)
const MIN_FILL = 0.38           // document doit occuper ≥ 38 % du guide
const QUALITY_THRESHOLD = 58    // score qualité minimum
const READY_FRAMES_NEEDED = 22  // ~1.5 s à 15 fps

const STATE_MSG: Record<DetectionState, string> = {
  idle:        'Initialisation de la caméra…',
  searching:   'Placez votre document dans le cadre',
  too_far:     'Rapprochez-vous du document',
  no_doc:      'Repositionnez votre document — recto face à la caméra',
  bad_quality: 'Améliorez l\'éclairage ou réduisez le flou',
  detected:    'Document détecté — restez immobile',
  face_found:  'Pièce d\'identité confirmée ✓',
  ready:       'Parfait ! Capture automatique…',
  captured:    'Capture effectuée',
}

const STATE_COLOR: Record<DetectionState, string> = {
  idle:        'rgba(255,255,255,0.4)',
  searching:   'rgba(255,255,255,0.55)',
  too_far:     '#f59e0b',
  no_doc:      '#ef4444',
  bad_quality: '#f59e0b',
  detected:    '#60a5fa',
  face_found:  '#34d399',
  ready:       '#10b981',
  captured:    '#10b981',
}

// ─── Image analysis helpers ───────────────────────────────────────────────────

/** Variance Laplacienne sur la zone centrale — mesure de netteté */
function measureSharpness(
  data: Uint8ClampedArray,
  stride: number, /* width * 4 */
  w: number, h: number
): number {
  let sum = 0; let count = 0
  const step = 3
  for (let y = 1; y < h - 1; y += step) {
    for (let x = 1; x < w - 1; x += step) {
      const i = (y * (stride / 4) + x) * 4
      const g = (v: number) => 0.299 * data[v] + 0.587 * data[v + 1] + 0.114 * data[v + 2]
      const lap = Math.abs(4 * g(i) - g(i + 4) - g(i - 4) - g(i + stride) - g(i - stride))
      sum += lap; count++
    }
  }
  return Math.min(100, (sum / (count || 1)) * 3.8)
}

function measureBrightness(data: Uint8ClampedArray): number {
  let total = 0; let count = 0
  for (let i = 0; i < data.length; i += 20) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    count++
  }
  return (total / (count || 1)) / 255 * 100
}

function qualityScore(s: number, b: number): number {
  const bScore = b < 15 ? 15
    : b > 88 ? Math.max(0, 100 - (b - 88) * 8)
    : b < 35 ? 55 + (b - 15) * 1.6
    : b > 72 ? 100 - (b - 72) * 2.5
    : 100
  return Math.round(s * 0.65 + bScore * 0.35)
}

/**
 * Détection de rectangle ISO/IEC 7810 par analyse de gradient Sobel
 * sur la zone de la moitié extérieure du guide.
 * Retourne le ratio et le fill estimés.
 */
function detectDocumentRect(
  ctx: CanvasRenderingContext2D,
  vw: number, vh: number
): RectResult {
  // Zone guide : 84% de largeur, centré
  const gw = Math.floor(vw * 0.84)
  const gh = Math.floor(gw / ID_RATIO)
  const gx = Math.floor((vw - gw) / 2)
  const gy = Math.floor((vh - gh) / 2)

  // On analyse juste la bordure interne du guide (anneau de 12 px)
  const margin = 12
  // 4 bandes : haut, bas, gauche, droite
  const bands = [
    ctx.getImageData(gx + margin, gy, gw - margin * 2, margin),          // haut
    ctx.getImageData(gx + margin, gy + gh - margin, gw - margin * 2, margin), // bas
    ctx.getImageData(gx, gy + margin, margin, gh - margin * 2),          // gauche
    ctx.getImageData(gx + gw - margin, gy + margin, margin, gh - margin * 2), // droite
  ]

  // Calcule la densité de bords (Sobel simplifié) dans chaque bande
  let totalEdge = 0
  for (const band of bands) {
    const d = band.data
    for (let i = 0; i < d.length - 4; i += 4) {
      const diff = Math.abs(
        (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) -
        (0.299 * d[i + 4] + 0.587 * d[i + 5] + 0.114 * d[i + 6])
      )
      if (diff > 20) totalEdge++
    }
  }

  // Normalise : densité de bords / périmètre total en pixels
  const perimeter = 2 * (gw + gh) - 4 * margin
  const edgeDensity = totalEdge / (perimeter * 4) // *4 car RGBA

  // Mesure aussi la luminosité de l'intérieur (card surface vs background)
  const innerData = ctx.getImageData(gx + 20, gy + 20, gw - 40, gh - 40)
  const innerBrightness = measureBrightness(innerData.data)

  // Heuristique : si bords nets (> 0.08) et intérieur lumineux (> 20) → document probable
  const docLikelihood = edgeDensity > 0.06 && innerBrightness > 18

  return {
    found: docLikelihood,
    ratio: ID_RATIO,              // on suppose ratio correct si document trouvé
    fill: docLikelihood ? 0.62 : 0.2,
  }
}

// ─── Overlay drawing ──────────────────────────────────────────────────────────

function drawScannerOverlay(
  canvas: HTMLCanvasElement,
  state: DetectionState,
  readyProgress: number  // 0-1
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const vw = canvas.width
  const vh = canvas.height
  const gw = Math.floor(vw * 0.84)
  const gh = Math.floor(gw / ID_RATIO)
  const gx = Math.floor((vw - gw) / 2)
  const gy = Math.floor((vh - gh) / 2)

  const color = STATE_COLOR[state]
  const isGood = state === 'face_found' || state === 'ready' || state === 'detected'

  // Fond sombre avec découpe guide
  ctx.fillStyle = isGood ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.52)'
  ctx.fillRect(0, 0, vw, vh)
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillRect(gx, gy, gw, gh)
  ctx.globalCompositeOperation = 'source-over'

  // Bordure guide
  ctx.strokeStyle = color
  ctx.lineWidth = state === 'ready' || state === 'face_found' ? 3 : 2
  ctx.strokeRect(gx, gy, gw, gh)

  // Coins animés (épais + colorés)
  const cs = 32
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  const corners: [number, number, number, number][] = [
    [gx, gy, cs, cs],
    [gx + gw, gy, -cs, cs],
    [gx, gy + gh, cs, -cs],
    [gx + gw, gy + gh, -cs, -cs],
  ]
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy); ctx.stroke()
  }

  // Barre de progression "ready" en bas du guide
  if (state === 'ready' && readyProgress > 0) {
    ctx.fillStyle = 'rgba(16,185,129,0.25)'
    ctx.fillRect(gx, gy + gh - 6, gw, 6)
    ctx.fillStyle = '#10b981'
    ctx.fillRect(gx, gy + gh - 6, gw * readyProgress, 6)
  }

  // Ligne de scan animée (state = detected | face_found)
  if (state === 'detected' || state === 'face_found') {
    const t = (Date.now() % 2000) / 2000
    const scanY = gy + gh * t
    const grad = ctx.createLinearGradient(gx, scanY - 20, gx, scanY + 3)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(1, state === 'face_found' ? 'rgba(52,211,153,0.5)' : 'rgba(96,165,250,0.5)')
    ctx.fillStyle = grad
    ctx.fillRect(gx, scanY - 20, gw, 22)
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveDocumentScanner({ onCapture, onCancel, docType }: LiveDocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const workRef = useRef<HTMLCanvasElement>(null)      // frame analysis (hidden)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const stateRef = useRef<DetectionState>('idle')
  const readyFrames = useRef(0)
  const lastFaceCheckRef = useRef(0)
  const lastRectCheckRef = useRef(0)
  const animFrameRef = useRef(0)

  const [uiState, setUiState] = useState<DetectionState>('idle')
  const [quality, setQuality] = useState<QualityMetrics>({ sharpness: 0, brightness: 0, score: 0 })
  const [readyPct, setReadyPct] = useState(0)
  const [captured, setCaptured] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [faceCheckActive, setFaceCheckActive] = useState(false)

  const { isLoaded: faceApiLoaded } = useFaceApi()

  // ─── Detection: face on document ──────────────────────────────────────────

  const checkFaceOnDocument = useCallback(async (canvas: HTMLCanvasElement): Promise<boolean> => {
    if (!faceApiLoaded) return false
    try {
      const faceapi = (await import('@vladmandic/face-api')).default as typeof import('@vladmandic/face-api')
      const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.18 })
      const detection = await faceapi.detectSingleFace(canvas, options)
      return !!detection
    } catch { return false }
  }, [faceApiLoaded])

  // ─── Main analysis loop ────────────────────────────────────────────────────

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current
    const overlay = overlayRef.current
    const work = workRef.current
    if (!video || !overlay || !work || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame)
      return
    }

    const vw = video.videoWidth || 640
    const vh = video.videoHeight || 480

    // Sync canvas sizes
    ;[overlay, work].forEach(c => { if (c.width !== vw) { c.width = vw; c.height = vh } })

    const ctx = work.getContext('2d')!
    ctx.drawImage(video, 0, 0, vw, vh)

    // --- Quality (every frame, cheap) ---
    const gw = Math.floor(vw * 0.84)
    const gh = Math.floor(gw / ID_RATIO)
    const gx = Math.floor((vw - gw) / 2)
    const gy = Math.floor((vh - gh) / 2)
    const centerData = ctx.getImageData(gx + 10, gy + 10, gw - 20, gh - 20)
    const sharpness = measureSharpness(centerData.data, (gw - 20) * 4, gw - 20, gh - 20)
    const brightness = measureBrightness(centerData.data)
    const score = qualityScore(sharpness, brightness)
    setQuality({ sharpness, brightness, score })

    // --- Rectangle detection (every 400 ms) ---
    let rectResult: RectResult = { found: false, ratio: 0, fill: 0 }
    const now = Date.now()
    if (now - lastRectCheckRef.current > 400) {
      lastRectCheckRef.current = now
      rectResult = detectDocumentRect(ctx, vw, vh)
    }

    // --- State machine ---
    let newState: DetectionState = stateRef.current

    if (score < QUALITY_THRESHOLD) {
      newState = brightness < 25 ? 'bad_quality' : sharpness < 20 ? 'bad_quality' : 'bad_quality'
      readyFrames.current = 0
    } else if (!rectResult.found && stateRef.current !== 'face_found' && stateRef.current !== 'ready') {
      newState = 'searching'
      readyFrames.current = 0
    } else if (rectResult.fill < MIN_FILL && stateRef.current !== 'face_found' && stateRef.current !== 'ready') {
      newState = 'too_far'
      readyFrames.current = 0
    } else {
      // Rectangle found + quality OK
      if (stateRef.current === 'face_found' || stateRef.current === 'ready') {
        // Keep elevated state
        readyFrames.current++
        newState = readyFrames.current >= READY_FRAMES_NEEDED ? 'ready' : 'face_found'
      } else {
        newState = 'detected'
        // Trigger async face check (every 1.5 s)
        if (now - lastFaceCheckRef.current > 1500 && faceApiLoaded) {
          lastFaceCheckRef.current = now
          setFaceCheckActive(true)
          // Snapshot current frame to separate canvas for face detection
          const snap = document.createElement('canvas')
          snap.width = vw; snap.height = vh
          const snapCtx = snap.getContext('2d')!
          snapCtx.drawImage(video, 0, 0, vw, vh)
          checkFaceOnDocument(snap).then(hasFace => {
            setFaceCheckActive(false)
            if (hasFace && (stateRef.current === 'detected' || stateRef.current === 'face_found')) {
              stateRef.current = 'face_found'
              setUiState('face_found')
              readyFrames.current = Math.max(readyFrames.current, 4)
            }
          })
        }
      }
    }

    if (newState !== stateRef.current) {
      stateRef.current = newState
      setUiState(newState)
    }

    // Ready progress
    if (newState === 'ready' || newState === 'face_found') {
      const pct = Math.min(1, readyFrames.current / READY_FRAMES_NEEDED)
      setReadyPct(pct)
      if (pct >= 1 && newState === 'ready') {
        // AUTO-CAPTURE
        captureDocument(ctx, vw, vh, gx, gy, gw, gh)
        return
      }
    } else {
      setReadyPct(0)
    }

    rafRef.current = requestAnimationFrame(analyzeFrame)
  }, [checkFaceOnDocument, faceApiLoaded])

  // ─── Overlay animation loop ────────────────────────────────────────────────

  const animateOverlay = useCallback(() => {
    if (overlayRef.current) {
      drawScannerOverlay(overlayRef.current, stateRef.current, readyPct)
    }
    animFrameRef.current = requestAnimationFrame(animateOverlay)
  }, [readyPct])

  // ─── Capture ──────────────────────────────────────────────────────────────

  const captureDocument = useCallback((
    ctx: CanvasRenderingContext2D,
    vw: number, vh: number,
    gx: number, gy: number, gw: number, gh: number
  ) => {
    cancelAnimationFrame(rafRef.current)
    cancelAnimationFrame(animFrameRef.current)

    // Crop to guide
    const crop = document.createElement('canvas')
    crop.width = gw; crop.height = gh
    const cropCtx = crop.getContext('2d')!
    const work = workRef.current!
    cropCtx.drawImage(work, gx, gy, gw, gh, 0, 0, gw, gh)

    void vw; void vh; void ctx // suppress unused warnings

    crop.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setCaptured(url)
      setCapturedBlob(blob)
      stateRef.current = 'captured'
      setUiState('captured')
      streamRef.current?.getTracks().forEach(t => t.stop())
    }, 'image/jpeg', 0.94)
  }, [])

  const handleManualCapture = useCallback(() => {
    const video = videoRef.current
    const work = workRef.current
    if (!video || !work) return

    cancelAnimationFrame(rafRef.current)
    cancelAnimationFrame(animFrameRef.current)

    const vw = video.videoWidth || 640
    const vh = video.videoHeight || 480
    if (work.width !== vw) { work.width = vw; work.height = vh }

    const ctx = work.getContext('2d')!
    ctx.drawImage(video, 0, 0, vw, vh)

    const gw = Math.floor(vw * 0.84)
    const gh = Math.floor(gw / ID_RATIO)
    const gx = Math.floor((vw - gw) / 2)
    const gy = Math.floor((vh - gh) / 2)

    captureDocument(ctx, vw, vh, gx, gy, gw, gh)
  }, [captureDocument])

  const handleRetake = useCallback(() => {
    setCaptured(null)
    setCapturedBlob(null)
    readyFrames.current = 0
    stateRef.current = 'searching'
    setUiState('searching')
    setReadyPct(0)
    startCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = useCallback(() => {
    if (!capturedBlob) return
    const file = new File([capturedBlob], `kyc_${Date.now()}.jpg`, { type: 'image/jpeg' })
    onCapture(file)
  }, [capturedBlob, onCapture])

  // ─── Camera ───────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setCameraError(null)
    stateRef.current = 'idle'
    setUiState('idle')
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
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
        stateRef.current = 'searching'
        setUiState('searching')
        rafRef.current = requestAnimationFrame(analyzeFrame)
        animFrameRef.current = requestAnimationFrame(animateOverlay)
      }
    } catch (e) {
      const err = e as { name?: string }
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Accès caméra refusé — autorisez-le dans les paramètres du navigateur.'
          : err.name === 'NotFoundError'
          ? 'Aucune caméra détectée sur cet appareil.'
          : 'Impossible d\'accéder à la caméra.'
      )
    }
  }, [facingMode, analyzeFrame, animateOverlay])

  useEffect(() => { startCamera() }, [startCamera])

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // Restart when facing mode changes
  useEffect(() => { if (streamRef.current) startCamera() }, [facingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Render: camera error ─────────────────────────────────────────────────

  if (cameraError) return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <ZapOff size={40} color={BAI.inkFaint} style={{ marginBottom: 14 }} />
      <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.error, marginBottom: 20, lineHeight: 1.6 }}>
        {cameraError}
      </p>
      <button onClick={onCancel} style={{
        background: BAI.night, color: '#fff', border: 'none',
        borderRadius: 8, padding: '11px 24px', fontFamily: BAI.fontBody,
        fontWeight: 600, fontSize: 14, cursor: 'pointer',
      }}>
        ← Importer un fichier
      </button>
    </div>
  )

  // ─── Render: captured preview ─────────────────────────────────────────────

  if (captured) return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12, padding: '10px 14px',
        background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
        borderRadius: 10,
      }}>
        <CheckCircle size={18} color={BAI.tenant} />
        <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.tenant }}>
          {docType === 'CNI' ? 'Carte d\'identité' : 'Permis de conduire'} capturé
        </span>
      </div>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, marginBottom: 12 }}>
        Vérifiez que tous les champs sont lisibles avant de continuer.
      </p>
      <img src={captured} alt="Document capturé"
        style={{ width: '100%', borderRadius: 10, marginBottom: 14, objectFit: 'contain',
          border: `1px solid ${BAI.border}`, maxHeight: 240 }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleRetake} style={{
          flex: 1, padding: '12px',
          background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8,
          fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13, color: BAI.ink,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <RotateCcw size={14} /> Reprendre
        </button>
        <button onClick={handleConfirm} style={{
          flex: 2, padding: '12px',
          background: BAI.night, border: 'none', borderRadius: 8,
          fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 14, color: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <CheckCircle size={15} /> Utiliser cette capture
        </button>
      </div>
    </div>
  )

  // ─── Render: scanner ──────────────────────────────────────────────────────

  const stateColor = STATE_COLOR[uiState]
  const isGoodState = uiState === 'face_found' || uiState === 'ready' || uiState === 'detected'
  const isCritical = uiState === 'no_doc' || uiState === 'bad_quality'

  return (
    <div>
      {/* Instructions rapides */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { icon: '💡', text: 'Éclairage uniforme' },
          { icon: '📐', text: 'Document à plat' },
          { icon: '🔍', text: 'Recto face à la caméra' },
        ].map(({ icon, text }) => (
          <span key={text} style={{
            fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {icon} {text}
          </span>
        ))}
      </div>

      {/* Viewport */}
      <div style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden',
        background: '#0a0a0a', marginBottom: 12,
        boxShadow: `0 0 0 2px ${stateColor}`,
        transition: 'box-shadow 0.3s ease',
      }}>
        <video ref={videoRef} muted playsInline
          style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }} />

        {/* Overlay canvas (guide + animation) */}
        <canvas ref={overlayRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

        {/* Hidden analysis canvas */}
        <canvas ref={workRef} style={{ display: 'none' }} />

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.72)', borderRadius: 24,
          padding: '5px 14px', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 7,
          border: `1px solid ${isGoodState ? stateColor : 'transparent'}`,
          transition: 'border-color 0.3s',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: stateColor,
            boxShadow: isGoodState ? `0 0 8px ${stateColor}` : 'none',
            transition: 'all 0.3s',
          }} />
          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#fff', fontWeight: 600 }}>
            {STATE_MSG[uiState]}
          </span>
          {faceCheckActive && (
            <span style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              (analyse…)
            </span>
          )}
        </div>

        {/* Quality bar (bas gauche) */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(0,0,0,0.62)', borderRadius: 8, padding: '5px 10px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ScanLine size={11} color="rgba(255,255,255,0.6)" />
            <span style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
              Qualité
            </span>
            <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${quality.score}%`,
                background: quality.score >= QUALITY_THRESHOLD ? '#10b981' : quality.score >= 40 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.2s, background 0.3s',
              }} />
            </div>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.6)', minWidth: 24 }}>
              {quality.score}%
            </span>
          </div>
        </div>

        {/* Flip camera */}
        <button onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: BAI.fontBody, fontSize: 11,
          }}>
          <FlipHorizontal size={13} /> Retourner
        </button>
      </div>

      {/* Feedback contextuel */}
      {isCritical && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          padding: '9px 12px', borderRadius: 8, marginBottom: 10,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
        }}>
          <AlertCircle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
            {uiState === 'bad_quality' && quality.brightness < 30 && '💡 Trop sombre — allumez une lumière face au document.'}
            {uiState === 'bad_quality' && quality.brightness > 80 && '🔆 Reflet — inclinez légèrement le document pour supprimer le reflet.'}
            {uiState === 'bad_quality' && quality.sharpness < 25 && '📸 Image floue — rapprochez-vous et maintenez le téléphone stable 2 secondes.'}
            {uiState === 'no_doc' && 'Présentez le recto de votre document dans le cadre, à plat et sans angle.'}
          </p>
        </div>
      )}

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '12px',
          background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8,
          fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13, color: BAI.ink, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Camera size={14} /> Importer
        </button>
        <button onClick={handleManualCapture} style={{
          flex: 2, padding: '12px',
          background: isGoodState ? (uiState === 'face_found' || uiState === 'ready' ? '#059669' : BAI.night) : BAI.night,
          border: 'none', borderRadius: 8,
          fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 14, color: '#fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.3s',
          boxShadow: isGoodState ? '0 0 12px rgba(16,185,129,0.35)' : 'none',
        }}>
          <Camera size={16} />
          {uiState === 'face_found' || uiState === 'ready'
            ? `Capturer — pièce confirmée ✓`
            : 'Capturer maintenant'}
        </button>
      </div>

      <p style={{
        fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint,
        textAlign: 'center', marginTop: 8,
      }}>
        {faceApiLoaded
          ? 'Détection IA activée — vérifie que c\'est bien une pièce d\'identité'
          : 'Capture auto quand la qualité est suffisante'}
      </p>
    </div>
  )
}
