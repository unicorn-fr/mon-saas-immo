/**
 * LiveDocumentScanner — Scanner professionnel de document d'identité
 *
 * Pipeline de détection :
 *  1. Canvas dimensionné sur les PIXELS CSS affichés (corrige le bug d'étirement overlay/vidéo)
 *  2. Dessin avec simulation objectFit:cover (drawVideoCover)
 *  3. Guide ID-1 contraint par la hauteur → proportions correctes quelles que soient les dimensions
 *  4. Mesure de netteté (variance Laplacienne, zone centrale)
 *  5. Estimation de remplissage du guide (grille 8 points)
 *  6. Messages adaptatifs : Approchez / Reculez / Trop flou / Confirme pièce IA
 *  7. Détection de visage sur le document (face-api) → confirmation c'est bien une pièce d'identité
 *  8. Capture auto après ~1.5 s à l'état "ready"
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, ZapOff, RotateCcw, CheckCircle, AlertCircle, ScanLine, FlipHorizontal } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { useFaceApi } from '../../hooks/useFaceApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type DetectionState =
  | 'idle'
  | 'searching'
  | 'too_far'
  | 'too_close'
  | 'bad_quality'
  | 'detected'
  | 'face_found'
  | 'ready'
  | 'captured'

interface GuideDimensions { gx: number; gy: number; gw: number; gh: number }
interface QualityMetrics { sharpness: number; brightness: number; score: number }

interface LiveDocumentScannerProps {
  onCapture: (file: File) => void
  onCancel: () => void
  docType: 'CNI' | 'PERMIS_CONDUIRE'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ID_RATIO = 1.586           // ISO/IEC 7810 ID-1 standard
const QUALITY_THRESHOLD = 55
const READY_FRAMES_NEEDED = 22   // ~1.5 s à ~15 fps d'analyse

const STATE_MSG: Record<DetectionState, string> = {
  idle:        'Initialisation…',
  searching:   'Placez votre document dans le cadre',
  too_far:     'Approchez-vous du document',
  too_close:   'Reculez légèrement',
  bad_quality: 'Améliorez l\'éclairage ou réduisez le flou',
  detected:    'Document détecté — restez immobile',
  face_found:  'Pièce d\'identité confirmée ✓',
  ready:       'Parfait — capture en cours…',
  captured:    'Capturé',
}

const STATE_COLOR: Record<DetectionState, string> = {
  idle:        'rgba(255,255,255,0.35)',
  searching:   'rgba(255,255,255,0.55)',
  too_far:     '#f59e0b',
  too_close:   '#f59e0b',
  bad_quality: '#ef4444',
  detected:    '#60a5fa',
  face_found:  '#34d399',
  ready:       '#10b981',
  captured:    '#10b981',
}

// ─── Guide dimensions ─────────────────────────────────────────────────────────

/**
 * Calcule les dimensions et la position du guide ID-1.
 *
 * Contrainte par la hauteur : gw = min(dw × 0.88, dh × 1.3)
 * Garantit que le cadre ressemble à une vraie carte, quelle que soit la taille du conteneur.
 */
function computeGuide(dw: number, dh: number): GuideDimensions {
  const gw = Math.floor(Math.min(dw * 0.88, dh * 1.30))
  const gh = Math.floor(gw / ID_RATIO)
  return {
    gx: Math.floor((dw - gw) / 2),
    gy: Math.floor((dh - gh) / 2),
    gw, gh,
  }
}

// ─── Video drawing ────────────────────────────────────────────────────────────

/**
 * Dessine la vidéo dans le canvas en simulant objectFit:cover.
 * Nécessaire car le canvas est dimensionné en pixels CSS, pas en pixels natifs de la caméra.
 */
function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dw: number, dh: number
) {
  const nw = video.videoWidth, nh = video.videoHeight
  if (!nw || !nh) { ctx.drawImage(video, 0, 0, dw, dh); return }
  const scale = Math.max(dw / nw, dh / nh)
  const sw = nw * scale, sh = nh * scale
  ctx.drawImage(video, (dw - sw) / 2, (dh - sh) / 2, sw, sh)
}

// ─── Image analysis ───────────────────────────────────────────────────────────

/** Variance Laplacienne sur la zone centrale du guide — mesure de netteté */
function measureSharpness(
  data: Uint8ClampedArray, stride: number, w: number, h: number
): number {
  let sum = 0; let count = 0
  const step = 3
  for (let y = 1; y < h - 1; y += step) {
    for (let x = 1; x < w - 1; x += step) {
      const i = (y * (stride >> 2) + x) * 4
      const g = (v: number) => 0.299 * data[v] + 0.587 * data[v + 1] + 0.114 * data[v + 2]
      const lap = Math.abs(4 * g(i) - g(i + 4) - g(i - 4) - g(i + stride) - g(i - stride))
      sum += lap; count++
    }
  }
  return Math.min(100, (sum / (count || 1)) * 4.0)
}

function measureBrightness(data: Uint8ClampedArray): number {
  let total = 0; let count = 0
  for (let i = 0; i < data.length; i += 16) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    count++
  }
  return (total / (count || 1)) / 255 * 100
}

function qualityScore(s: number, b: number): number {
  const bScore = b < 15 ? 12
    : b > 88 ? Math.max(0, 100 - (b - 88) * 9)
    : b < 35 ? 50 + (b - 15) * 2
    : b > 75 ? 100 - (b - 75) * 3
    : 100
  return Math.round(s * 0.65 + bScore * 0.35)
}

/**
 * Estimation du remplissage du guide par échantillonnage 8 points.
 *
 * Pour chaque point (4 coins + 4 milieux à 10% du bord) :
 *   - Si luminosité locale > 20 OU variance locale > 8 → le document est là
 *
 * Retourne 0-1 (0 = rien, 1 = document couvre tout le guide).
 */
function estimateFill(
  ctx: CanvasRenderingContext2D,
  g: GuideDimensions
): number {
  const probes: [number, number][] = [
    // 4 coins (10% inset)
    [g.gx + g.gw * 0.10, g.gy + g.gh * 0.10],
    [g.gx + g.gw * 0.90, g.gy + g.gh * 0.10],
    [g.gx + g.gw * 0.10, g.gy + g.gh * 0.90],
    [g.gx + g.gw * 0.90, g.gy + g.gh * 0.90],
    // 4 milieux de bords (10% inset)
    [g.gx + g.gw * 0.50, g.gy + g.gh * 0.10],
    [g.gx + g.gw * 0.50, g.gy + g.gh * 0.90],
    [g.gx + g.gw * 0.10, g.gy + g.gh * 0.50],
    [g.gx + g.gw * 0.90, g.gy + g.gh * 0.50],
  ]

  let hit = 0
  for (const [px, py] of probes) {
    const d = ctx.getImageData(Math.round(px), Math.round(py), 5, 5).data
    let lum = 0, lumSq = 0
    for (let i = 0; i < d.length; i += 4) {
      const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      lum += v; lumSq += v * v
    }
    const n = d.length / 4
    const mean = lum / n
    const variance = lumSq / n - mean * mean
    // Document détecté si la zone est lumineuse OU a de la texture
    if (mean > 30 || variance > 60) hit++
  }
  return hit / probes.length
}

// ─── Overlay drawing ──────────────────────────────────────────────────────────

function drawScannerOverlay(
  canvas: HTMLCanvasElement,
  state: DetectionState,
  readyProgress: number,
  g: GuideDimensions,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { gx, gy, gw, gh } = g
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const color = STATE_COLOR[state]
  const isGood = state === 'face_found' || state === 'ready' || state === 'detected'
  const isReady = state === 'ready' || state === 'face_found'

  // ── Masque sombre autour du guide (découpe le trou) ──
  ctx.fillStyle = isGood ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Découpe rectangulaire nette
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.fillRect(gx, gy, gw, gh)
  ctx.globalCompositeOperation = 'source-over'

  // ── Bordure guide ──
  ctx.strokeStyle = color
  ctx.lineWidth = isReady ? 2.5 : 1.5
  ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1)

  // ── Coins accent (épais, colorés) ──
  const cs = Math.floor(Math.min(gw, gh) * 0.12)  // adaptatif
  ctx.strokeStyle = color
  ctx.lineWidth = isReady ? 5 : 4
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

  // ── Halo vert pulsant quand le document est confirmé ──
  if (isReady) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005)
    ctx.strokeStyle = `rgba(16,185,129,${0.15 + pulse * 0.2})`
    ctx.lineWidth = 12 + pulse * 4
    ctx.strokeRect(gx, gy, gw, gh)
  }

  // ── Barre de progression capture auto ──
  if (state === 'ready' && readyProgress > 0) {
    ctx.fillStyle = 'rgba(16,185,129,0.18)'
    ctx.fillRect(gx, gy + gh - 5, gw, 5)
    ctx.fillStyle = '#10b981'
    ctx.fillRect(gx, gy + gh - 5, gw * readyProgress, 5)
  }

  // ── Ligne de scan animée (détection en cours) ──
  if (state === 'detected' || state === 'face_found') {
    const t = (Date.now() % 2400) / 2400
    const scanY = gy + gh * t
    const grad = ctx.createLinearGradient(gx, scanY - 24, gx, scanY + 4)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(1, state === 'face_found' ? 'rgba(52,211,153,0.55)' : 'rgba(96,165,250,0.5)')
    ctx.fillStyle = grad
    ctx.fillRect(gx, Math.max(gy, scanY - 24), gw, Math.min(28, gy + gh - scanY + 28))
  }

  // ── Étiquette type de document (bas du guide) ──
  ctx.fillStyle = isReady ? 'rgba(16,185,129,0.85)' : 'rgba(0,0,0,0.55)'
  const labelW = 160, labelH = 22
  ctx.fillRect(gx + (gw - labelW) / 2, gy + gh + 6, labelW, labelH)
  ctx.fillStyle = isReady ? '#fff' : 'rgba(255,255,255,0.75)'
  ctx.font = `600 11px DM Sans, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('Carte ID-1 · 85.6 × 54 mm', gx + gw / 2, gy + gh + 20)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveDocumentScanner({ onCapture, onCancel, docType }: LiveDocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const workRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const animRef = useRef<number>(0)
  const stateRef = useRef<DetectionState>('idle')
  const guideRef = useRef<GuideDimensions>({ gx: 0, gy: 0, gw: 100, gh: 63 })
  const readyFrames = useRef(0)
  const lastFaceCheckRef = useRef(0)
  const lastRectCheckRef = useRef(0)

  const [uiState, setUiState] = useState<DetectionState>('idle')
  const [quality, setQuality] = useState<QualityMetrics>({ sharpness: 0, brightness: 0, score: 0 })
  const [readyPct, setReadyPct] = useState(0)
  const [fillPct, setFillPct] = useState(0)
  const [captured, setCaptured] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [faceCheckActive, setFaceCheckActive] = useState(false)

  const { isLoaded: faceApiLoaded } = useFaceApi()

  // ─── Détection visage sur le document ───────────────────────────────────────

  const checkFaceOnDocument = useCallback(async (canvas: HTMLCanvasElement): Promise<boolean> => {
    if (!faceApiLoaded) return false
    try {
      const faceapi = (await import('@vladmandic/face-api')).default as typeof import('@vladmandic/face-api')
      const detection = await faceapi.detectSingleFace(
        canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.16 })
      )
      return !!detection
    } catch { return false }
  }, [faceApiLoaded])

  // ─── Boucle d'analyse ────────────────────────────────────────────────────────

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current
    const overlay = overlayRef.current
    const work = workRef.current
    if (!video || !overlay || !work || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame)
      return
    }

    // Dimensions CSS affichées (la vérité de ce que voit l'utilisateur)
    const dw = video.clientWidth || 360
    const dh = video.clientHeight || 270

    // Sync des canvas sur les dimensions CSS (corrige le bug d'étirement)
    if (work.width !== dw || work.height !== dh) {
      work.width = dw; work.height = dh
      overlay.width = dw; overlay.height = dh
    }

    const ctx = work.getContext('2d', { willReadFrequently: true })!
    // Dessine la vidéo en simulant objectFit:cover
    drawVideoCover(ctx, video, dw, dh)

    // Guide ID-1 contraint par la hauteur
    const g = computeGuide(dw, dh)
    guideRef.current = g

    // ── Qualité (chaque frame) ──
    const iw = Math.floor(g.gw * 0.6), ih = Math.floor(g.gh * 0.6)
    const ix = g.gx + Math.floor(g.gw * 0.2), iy = g.gy + Math.floor(g.gh * 0.2)
    const centerData = ctx.getImageData(ix, iy, iw, ih)
    const sharpness = measureSharpness(centerData.data, iw * 4, iw, ih)
    const brightness = measureBrightness(centerData.data)
    const score = qualityScore(sharpness, brightness)
    setQuality({ sharpness, brightness, score })

    // ── Estimation du remplissage (toutes les 350 ms) ──
    const now = Date.now()
    let fill = fillPct
    if (now - lastRectCheckRef.current > 350) {
      lastRectCheckRef.current = now
      fill = estimateFill(ctx, g)
      setFillPct(fill)
    }

    // ── Machine d'état ──
    let newState: DetectionState = stateRef.current
    const isFaceOrReady = stateRef.current === 'face_found' || stateRef.current === 'ready'

    if (score < QUALITY_THRESHOLD) {
      newState = 'bad_quality'
      readyFrames.current = 0
    } else if (fill < 0.38 && !isFaceOrReady) {
      newState = fill < 0.15 ? 'searching' : 'too_far'
      readyFrames.current = 0
    } else if (fill > 0.92 && !isFaceOrReady) {
      newState = 'too_close'
      readyFrames.current = 0
    } else if (fill >= 0.38 && fill <= 0.92) {
      if (isFaceOrReady) {
        readyFrames.current++
        newState = readyFrames.current >= READY_FRAMES_NEEDED ? 'ready' : 'face_found'
      } else {
        newState = 'detected'
        // Vérification de visage (toutes les 1.5 s si face-api chargé)
        if (faceApiLoaded && now - lastFaceCheckRef.current > 1500) {
          lastFaceCheckRef.current = now
          setFaceCheckActive(true)
          const snap = document.createElement('canvas')
          snap.width = dw; snap.height = dh
          const snapCtx = snap.getContext('2d')!
          drawVideoCover(snapCtx, video, dw, dh)
          checkFaceOnDocument(snap).then(hasFace => {
            setFaceCheckActive(false)
            if (hasFace && (stateRef.current === 'detected' || stateRef.current === 'face_found')) {
              stateRef.current = 'face_found'
              setUiState('face_found')
              readyFrames.current = Math.max(readyFrames.current, 4)
            }
          })
        } else if (!faceApiLoaded) {
          // Pas de face-api → remplissage seul suffit pour monter à ready
          readyFrames.current++
          if (readyFrames.current >= READY_FRAMES_NEEDED) newState = 'ready'
        }
      }
    }

    if (newState !== stateRef.current) {
      stateRef.current = newState
      setUiState(newState)
    }

    // Progression capture auto
    if (newState === 'ready' || newState === 'face_found') {
      const pct = Math.min(1, readyFrames.current / READY_FRAMES_NEEDED)
      setReadyPct(pct)
      if (pct >= 1 && newState === 'ready') {
        doCapture(ctx, dw, dh, g)
        return
      }
    } else {
      if (readyPct > 0) setReadyPct(0)
    }

    rafRef.current = requestAnimationFrame(analyzeFrame)
  }, [checkFaceOnDocument, faceApiLoaded, fillPct, readyPct])

  // ─── Boucle d'animation overlay ─────────────────────────────────────────────

  const animateOverlay = useCallback(() => {
    if (overlayRef.current) {
      drawScannerOverlay(overlayRef.current, stateRef.current, readyPct, guideRef.current)
    }
    animRef.current = requestAnimationFrame(animateOverlay)
  }, [readyPct])

  // ─── Capture ────────────────────────────────────────────────────────────────

  const doCapture = useCallback((
    ctx: CanvasRenderingContext2D,
    dw: number, dh: number,
    g: GuideDimensions
  ) => {
    cancelAnimationFrame(rafRef.current)
    cancelAnimationFrame(animRef.current)
    void dw; void dh; void ctx

    const crop = document.createElement('canvas')
    crop.width = g.gw; crop.height = g.gh
    const cropCtx = crop.getContext('2d')!
    cropCtx.drawImage(workRef.current!, g.gx, g.gy, g.gw, g.gh, 0, 0, g.gw, g.gh)

    crop.toBlob(blob => {
      if (!blob) return
      setCaptured(URL.createObjectURL(blob))
      setCapturedBlob(blob)
      stateRef.current = 'captured'
      setUiState('captured')
      streamRef.current?.getTracks().forEach(t => t.stop())
    }, 'image/jpeg', 0.95)
  }, [])

  const handleManualCapture = useCallback(() => {
    const video = videoRef.current; const work = workRef.current
    if (!video || !work) return
    cancelAnimationFrame(rafRef.current)
    cancelAnimationFrame(animRef.current)
    const dw = video.clientWidth || 360
    const dh = video.clientHeight || 270
    if (work.width !== dw || work.height !== dh) { work.width = dw; work.height = dh }
    const ctx = work.getContext('2d')!
    drawVideoCover(ctx, video, dw, dh)
    doCapture(ctx, dw, dh, computeGuide(dw, dh))
  }, [doCapture])

  const handleRetake = useCallback(() => {
    setCaptured(null); setCapturedBlob(null)
    readyFrames.current = 0
    stateRef.current = 'searching'; setUiState('searching'); setReadyPct(0)
    startCamera() // eslint-disable-line react-hooks/exhaustive-deps
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = useCallback(() => {
    if (!capturedBlob) return
    onCapture(new File([capturedBlob], `kyc_${Date.now()}.jpg`, { type: 'image/jpeg' }))
  }, [capturedBlob, onCapture])

  // ─── Caméra ──────────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setCameraError(null)
    stateRef.current = 'idle'; setUiState('idle')
    try {
      streamRef.current?.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
        stateRef.current = 'searching'; setUiState('searching')
        rafRef.current = requestAnimationFrame(analyzeFrame)
        animRef.current = requestAnimationFrame(animateOverlay)
      }
    } catch (e) {
      const err = e as { name?: string }
      setCameraError(
        err.name === 'NotAllowedError' ? 'Accès caméra refusé — autorisez-le dans les paramètres du navigateur.'
        : err.name === 'NotFoundError' ? 'Aucune caméra détectée sur cet appareil.'
        : 'Impossible d\'accéder à la caméra.'
      )
    }
  }, [facingMode, analyzeFrame, animateOverlay])

  useEffect(() => { startCamera() }, [startCamera])
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current); cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (streamRef.current) startCamera() }, [facingMode])

  // ─── Render: erreur caméra ───────────────────────────────────────────────────

  if (cameraError) return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <ZapOff size={40} color={BAI.inkFaint} style={{ marginBottom: 14 }} />
      <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.error, marginBottom: 20, lineHeight: 1.6 }}>
        {cameraError}
      </p>
      <button onClick={onCancel} style={{
        background: BAI.night, color: '#fff', border: 'none', borderRadius: 8,
        padding: '11px 24px', fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, cursor: 'pointer',
      }}>← Importer un fichier</button>
    </div>
  )

  // ─── Render: prévisualisation post-capture ───────────────────────────────────

  if (captured) return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        padding: '10px 14px', background: BAI.tenantLight,
        border: `1px solid ${BAI.tenantBorder}`, borderRadius: 10,
      }}>
        <CheckCircle size={18} color={BAI.tenant} />
        <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.tenant }}>
          {docType === 'CNI' ? 'Carte d\'identité' : 'Permis de conduire'} capturé
        </span>
      </div>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, marginBottom: 10 }}>
        Vérifiez que les bords et les textes sont bien nets.
      </p>
      <img src={captured} alt="Document capturé"
        style={{
          width: '100%', borderRadius: 10, marginBottom: 14,
          objectFit: 'contain', border: `1px solid ${BAI.border}`,
          maxHeight: 220, background: '#111',
        }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleRetake} style={{
          flex: 1, padding: '12px',
          background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8,
          fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13, color: BAI.ink,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><RotateCcw size={14} /> Reprendre</button>
        <button onClick={handleConfirm} style={{
          flex: 2, padding: '12px',
          background: BAI.night, border: 'none', borderRadius: 8,
          fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 14, color: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><CheckCircle size={15} /> Utiliser cette capture</button>
      </div>
    </div>
  )

  // ─── Render: scanner ──────────────────────────────────────────────────────────

  const stateColor = STATE_COLOR[uiState]
  const isGood = uiState === 'face_found' || uiState === 'ready' || uiState === 'detected'
  const isConfirmed = uiState === 'face_found' || uiState === 'ready'

  // Message distance basé sur le fill
  const distanceHint = fillPct < 0.35 ? 'Approchez-vous du document ↗'
    : fillPct > 0.88 ? 'Reculez légèrement ↙'
    : null

  return (
    <div>
      {/* Tips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { icon: '💡', text: 'Éclairage uniforme' },
          { icon: '📐', text: 'Document à plat' },
          { icon: '🔍', text: 'Recto face à la caméra' },
        ].map(({ icon, text }) => (
          <span key={text} style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, display: 'flex', alignItems: 'center', gap: 4 }}>
            {icon} {text}
          </span>
        ))}
      </div>

      {/* Viewport */}
      <div style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden',
        background: '#0a0a0a', marginBottom: 10,
        outline: `2px solid ${stateColor}`,
        transition: 'outline-color 0.35s ease',
      }}>
        <video ref={videoRef} muted playsInline
          style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }} />

        {/* Overlay aligné sur les mêmes dimensions CSS que la vidéo */}
        <canvas ref={overlayRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

        {/* Canvas d'analyse (caché) */}
        <canvas ref={workRef} style={{ display: 'none' }} />

        {/* Badge état */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.72)', borderRadius: 24,
          padding: '5px 14px', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
          border: `1px solid ${isGood ? stateColor : 'transparent'}`,
          transition: 'border-color 0.3s',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: stateColor,
            boxShadow: isGood ? `0 0 6px ${stateColor}` : 'none',
            transition: 'all 0.3s',
          }} />
          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#fff', fontWeight: 600 }}>
            {STATE_MSG[uiState]}
          </span>
          {faceCheckActive && (
            <span style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
              (IA…)
            </span>
          )}
        </div>

        {/* Barre qualité */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(0,0,0,0.62)', borderRadius: 8, padding: '5px 10px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ScanLine size={11} color="rgba(255,255,255,0.55)" />
            <span style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
              Qualité
            </span>
            <div style={{ width: 55, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 3 }}>
              <div style={{
                height: '100%', borderRadius: 3, width: `${quality.score}%`,
                background: quality.score >= QUALITY_THRESHOLD ? '#10b981' : quality.score >= 38 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.2s, background 0.3s',
              }} />
            </div>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.55)', minWidth: 22 }}>
              {quality.score}%
            </span>
          </div>
        </div>

        {/* Indicateur de distance */}
        {distanceHint && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(245,158,11,0.82)', borderRadius: 8, padding: '4px 10px',
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: '#fff', fontWeight: 700 }}>
              {distanceHint}
            </span>
          </div>
        )}

        {/* Flip caméra */}
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

      {/* Feedback contextuel qualité */}
      {uiState === 'bad_quality' && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          padding: '9px 12px', borderRadius: 8, marginBottom: 10,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#9b1c1c', margin: 0, lineHeight: 1.5 }}>
            {quality.brightness < 28
              ? '💡 Trop sombre — allumez une lumière face au document.'
              : quality.brightness > 82
              ? '🔆 Reflet — inclinez légèrement le document pour supprimer le reflet.'
              : quality.sharpness < 22
              ? '📸 Image floue — stabilisez l\'appareil 2 secondes.'
              : 'Améliorez les conditions de prise de vue.'}
          </p>
        </div>
      )}

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '12px',
          background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8,
          fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13, color: BAI.ink,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Camera size={14} /> Importer
        </button>
        <button onClick={handleManualCapture} style={{
          flex: 2, padding: '12px',
          background: isConfirmed ? '#059669' : BAI.night,
          border: 'none', borderRadius: 8,
          fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 14, color: '#fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.3s',
          boxShadow: isConfirmed ? '0 2px 16px rgba(5,150,105,0.40)' : 'none',
        }}>
          <Camera size={16} />
          {isConfirmed ? 'Capturer — pièce confirmée ✓' : 'Capturer maintenant'}
        </button>
      </div>

      <p style={{
        fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint,
        textAlign: 'center', marginTop: 8,
      }}>
        {faceApiLoaded
          ? 'Détection IA activée — confirme que c\'est bien une pièce d\'identité'
          : 'Capture automatique dès que la qualité et le cadrage sont bons'}
      </p>
    </div>
  )
}
