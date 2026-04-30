/**
 * CameraCapture v5 — Scanneur professionnel de pièce d'identité
 *
 * Zéro OpenCV. Zéro jscanify. Chargement immédiat.
 *
 * Pipeline :
 *  1. Caméra native (getUserMedia) — guide visuel proportionné à la carte
 *  2. Détection de flou (variance Laplacien pure JS) — auto-capture après 2 s stable
 *  3. Recadrage sur la zone guide (canvas crop — pas de warp fragile)
 *  4. Vérification IA Claude Haiku — isIdDocument + extraction nom/DOB/numéro
 *  5. Affichage des données extraites
 *  6. Pour CNI_RECTO : flux recto → flip → verso automatique
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X, FlipHorizontal, RotateCcw, CheckCircle2,
  Loader2, ShieldOff, ArrowRight, RefreshCw,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase =
  | 'scanning'    // caméra live
  | 'processing'  // crop en cours
  | 'verifying'   // appel OCR Claude
  | 'verified'    // pièce acceptée, données affichées
  | 'flip'        // recto ok — demande le verso (CNI seulement)
  | 'rejected'    // pas une pièce d'identité
  | 'error'       // erreur réseau/OCR

interface OcrData {
  nom: string; prenom: string; dob: string
  nationality: string; documentNumber: string; expiry: string; side: string
}

export interface CaptureEntry { file: File; docType: string }

interface CameraCaptureProps {
  docType: string
  /** Appelé à la fin — peut contenir recto seul, verso seul, ou les deux (CNI) */
  onComplete: (captures: CaptureEntry[]) => void
  onClose: () => void
}

// ── Config ────────────────────────────────────────────────────────────────────
const ASPECT: Record<string, number> = {
  CNI_RECTO: 85.6 / 54, CNI_VERSO: 85.6 / 54,
  PASSEPORT: 125 / 88,  TITRE_SEJOUR: 85.6 / 54,
}
const LABEL: Record<string, string> = {
  CNI_RECTO: 'Recto de la CNI', CNI_VERSO: 'Verso de la CNI',
  PASSEPORT: 'Page photo du passeport', TITRE_SEJOUR: 'Titre de séjour',
}

const STABLE_NEEDED = 4   // 4 × 500 ms = 2 s
const INTERVAL_MS   = 500
const BLUR_OK       = 70  // seuil variance Laplacien — au-dessus = net
const GUIDE_FRAC    = 0.84 // fraction du viewport pour le cadre guide

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Variance Laplacien pur JS — retourne un score (plus grand = plus net) */
function blurScore(video: HTMLVideoElement): number {
  const W = 200, H = 130
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return 0
  ctx.drawImage(video, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)
  const g = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) g[i] = (data[i*4]*77 + data[i*4+1]*151 + data[i*4+2]*28) >> 8
  let sum = 0, sq = 0, n = 0
  for (let y = 1; y < H-1; y++) for (let x = 1; x < W-1; x++) {
    const i = y*W+x
    const v = 4*g[i] - g[i-1] - g[i+1] - g[i-W] - g[i+W]
    sum += v; sq += v*v; n++
  }
  return sq/n - (sum/n)**2
}

/** Recadre la zone guide (display coords → coords vidéo) */
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

/** Dessine le guide semi-transparent sur le canvas overlay (RAF) */
function drawGuide(
  canvas: HTMLCanvasElement, aspect: number,
  score: number, stable: number, flash: boolean,
) {
  const W = canvas.width, H = canvas.height
  if (!W || !H) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  if (flash) return  // flash blanc géré par un <div> dédié

  // Dimensions du guide
  const maxGW = W * GUIDE_FRAC, maxGH = H * GUIDE_FRAC
  let gW: number, gH: number
  if (maxGW / maxGH > aspect) { gH = maxGH; gW = gH * aspect }
  else { gW = maxGW; gH = gW / aspect }
  const gX = (W - gW) / 2, gY = (H - gH) / 2
  const R = 14

  const isSharp = score >= BLUR_OK
  const isReady = stable >= STABLE_NEEDED
  const accent  = isReady ? '#4ade80' : isSharp ? '#c4976a' : 'rgba(255,255,255,0.55)'

  // Masque foncé autour du guide (avec trou arrondi)
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.50)'
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.moveTo(gX + R, gY)
  ctx.lineTo(gX + gW - R, gY); ctx.arcTo(gX+gW, gY, gX+gW, gY+R, R)
  ctx.lineTo(gX + gW, gY + gH - R); ctx.arcTo(gX+gW, gY+gH, gX+gW-R, gY+gH, R)
  ctx.lineTo(gX + R, gY + gH); ctx.arcTo(gX, gY+gH, gX, gY+gH-R, R)
  ctx.lineTo(gX, gY + R); ctx.arcTo(gX, gY, gX+R, gY, R)
  ctx.closePath()
  ctx.fill('evenodd')
  ctx.restore()

  // Bordure du guide
  ctx.strokeStyle = accent; ctx.lineWidth = 2
  ctx.shadowColor = accent; ctx.shadowBlur = isSharp ? 16 : 4
  ctx.beginPath()
  ctx.moveTo(gX + R, gY)
  ctx.lineTo(gX + gW - R, gY); ctx.arcTo(gX+gW, gY, gX+gW, gY+R, R)
  ctx.lineTo(gX + gW, gY + gH - R); ctx.arcTo(gX+gW, gY+gH, gX+gW-R, gY+gH, R)
  ctx.lineTo(gX + R, gY + gH); ctx.arcTo(gX, gY+gH, gX, gY+gH-R, R)
  ctx.lineTo(gX, gY + R); ctx.arcTo(gX, gY, gX+R, gY, R)
  ctx.closePath(); ctx.stroke()
  ctx.shadowBlur = 0

  // Crochets de coin
  const BL = Math.min(gW, gH) * 0.13
  ctx.strokeStyle = accent; ctx.lineWidth = 3
  ;([
    [gX,     gY,      1,  1],
    [gX+gW,  gY,     -1,  1],
    [gX,     gY+gH,   1, -1],
    [gX+gW,  gY+gH,  -1, -1],
  ] as [number, number, number, number][]).forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(cx + dx*BL, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy*BL)
    ctx.stroke()
  })

  // Ligne de scan animée (seulement si net)
  if (isSharp) {
    const t   = (Date.now() % 2000) / 2000
    const sy  = gY + 10 + t * (gH - 20)
    const sg  = ctx.createLinearGradient(gX, sy, gX+gW, sy)
    const rgb = isReady ? '74,222,128' : '196,151,106'
    sg.addColorStop(0,   'rgba(0,0,0,0)')
    sg.addColorStop(0.2, `rgba(${rgb},0.7)`)
    sg.addColorStop(0.8, `rgba(${rgb},0.7)`)
    sg.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.strokeStyle = sg; ctx.lineWidth = 1.5
    ctx.shadowColor = `rgba(${rgb},0.9)`; ctx.shadowBlur = 8
    ctx.beginPath(); ctx.moveTo(gX+16, sy); ctx.lineTo(gX+gW-16, sy); ctx.stroke()
    ctx.shadowBlur = 0
  }

  // Arc de compte à rebours (centré dans le guide)
  if (stable > 0) {
    const cx = gX + gW/2, cy = gY + gH/2, r = Math.min(gW, gH) * 0.10
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke()
    ctx.strokeStyle = accent; ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (stable/STABLE_NEEDED)*Math.PI*2)
    ctx.stroke()
  }
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function CameraCapture({ docType, onComplete, onClose }: CameraCaptureProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef     = useRef<number>(0)
  const stableRef  = useRef(0)
  const stableRaf  = useRef(0)
  const scoreRaf   = useRef(0)
  const phaseRef   = useRef<Phase>('scanning')
  const flashRaf   = useRef(false)

  const [phase,        setPhase]        = useState<Phase>('scanning')
  const [currentDt,    setCurrentDt]    = useState(docType)    // change pour verso
  const [facingMode,   setFacingMode]   = useState<'environment' | 'user'>('environment')
  const [camReady,     setCamReady]     = useState(false)
  const [camError,     setCamError]     = useState('')
  const [score,        setScore]        = useState(0)
  const [stableFrames, setStableFrames] = useState(0)
  const [flash,        setFlash]        = useState(false)
  const [previewUrl,   setPreviewUrl]   = useState('')
  const [rectoPreview, setRectoPreview] = useState('')
  const [ocrData,      setOcrData]      = useState<OcrData | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const capturesRef = useRef<CaptureEntry[]>([])

  const aspect    = ASPECT[currentDt] ?? ASPECT.CNI_RECTO
  const isForCNI  = docType === 'CNI_RECTO'  // recto CNI → proposer le verso ensuite

  const setPhaseSync = useCallback((p: Phase) => { phaseRef.current = p; setPhase(p) }, [])

  // ── RAF overlay ───────────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const cvs = overlayRef.current
    if (cvs && phaseRef.current === 'scanning') {
      const { offsetWidth: w, offsetHeight: h } = cvs
      if (cvs.width !== w || cvs.height !== h) { cvs.width = w; cvs.height = h }
      drawGuide(cvs, aspect, scoreRaf.current, stableRaf.current, flashRaf.current)
    }
    rafRef.current = requestAnimationFrame(drawLoop)
  }, [aspect])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawLoop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [drawLoop])

  // ── Vérification OCR ──────────────────────────────────────────────────────
  const doVerify = useCallback(async (file: File, dt: string): Promise<boolean> => {
    setPhaseSync('verifying')
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('docType', dt)
      const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken') ?? ''
      const res = await fetch('/api/v1/ocr/extract', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (!res.ok) {
        setRejectReason('Connexion au service de vérification impossible. Réessayez.')
        setPhaseSync('error'); return false
      }
      const { data: d } = await res.json()
      if (!d || d.isIdDocument === false) {
        setRejectReason(String(d?.rejectReason || 'Ce document n\'est pas une pièce d\'identité valide (CNI, passeport ou titre de séjour requis).'))
        setPhaseSync('rejected'); return false
      }
      setOcrData({
        nom:            String(d.nom            ?? ''),
        prenom:         String(d.prenom         ?? ''),
        dob:            String(d.dob            ?? ''),
        nationality:    String(d.nationality    ?? ''),
        documentNumber: String(d.documentNumber ?? ''),
        expiry:         String(d.expiry         ?? ''),
        side:           String(d.side           ?? 'unknown'),
      })
      setPhaseSync('verified'); return true
    } catch {
      setRejectReason('Erreur réseau. Vérifiez votre connexion et réessayez.')
      setPhaseSync('error'); return false
    }
  }, [setPhaseSync])

  // ── Capture + recadrage ───────────────────────────────────────────────────
  const doCapture = useCallback((video: HTMLVideoElement, dt: string) => {
    setPhaseSync('processing')
    // Flash
    flashRaf.current = true; setFlash(true)
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
          // Ajoute cette capture à la liste
          capturesRef.current = [...capturesRef.current.filter(c => c.docType !== dt), { file, docType: dt }]
          if (dt === 'CNI_RECTO') setRectoPreview(url)
        }
      }, 'image/jpeg', 0.95)
    }, 0)
  }, [doVerify, setPhaseSync])

  // ── Boucle d'analyse (blur + stable) ──────────────────────────────────────
  useEffect(() => {
    if (!camReady || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const video = videoRef.current
      if (!video || phaseRef.current !== 'scanning') return
      const s = blurScore(video)
      scoreRaf.current = s; setScore(s)
      const sharp = s >= BLUR_OK

      if (sharp) {
        stableRef.current = Math.min(stableRef.current + 1, STABLE_NEEDED + 1)
        stableRaf.current = stableRef.current; setStableFrames(stableRef.current)
        if (stableRef.current >= STABLE_NEEDED) {
          clearInterval(timerRef.current!)
          doCapture(video, currentDt)
        }
      } else {
        stableRef.current = 0; stableRaf.current = 0; setStableFrames(0)
      }
    }, INTERVAL_MS)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [camReady, phase, currentDt, doCapture])

  // ── Caméra ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    stableRef.current = 0; stableRaf.current = 0; scoreRaf.current = 0
    setStableFrames(0); setCamReady(false); setCamError('')
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
            ? "Aucune caméra détectée."
            : "Impossible d'accéder à la caméra. Rechargez la page."
      )
    }
  }, [setPhaseSync])

  useEffect(() => { startCamera(facingMode) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { return () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
  }}, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleManualCapture = () => {
    const video = videoRef.current
    if (!video || !camReady || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)
    doCapture(video, currentDt)
  }

  const handleRetry = () => {
    stableRef.current = 0; stableRaf.current = 0; scoreRaf.current = 0
    setStableFrames(0); setPreviewUrl(''); setRejectReason(''); setOcrData(null)
    startCamera(facingMode)
  }

  /** Recto validé → proposer le verso */
  const handleRectoVerified = () => setPhaseSync('flip')

  /** Utilisateur accepte de scanner le verso */
  const handleStartVerso = () => {
    setCurrentDt('CNI_VERSO'); setPreviewUrl(''); setOcrData(null)
    stableRef.current = 0; stableRaf.current = 0; scoreRaf.current = 0; setStableFrames(0)
    setPhaseSync('scanning')
  }

  /** Fin de session — envoie toutes les captures au parent */
  const handleDone = useCallback(() => {
    onComplete(capturesRef.current)
  }, [onComplete])

  /** Après verso vérifié → terminé */
  const handleVersoVerified = useCallback(() => {
    onComplete(capturesRef.current)
  }, [onComplete])

  // ── Date formatting ───────────────────────────────────────────────────────
  const fmt = (iso: string) => {
    if (!iso || iso.length < 10) return iso
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  const isSharp   = score >= BLUR_OK
  const statusMsg =
    stableFrames >= STABLE_NEEDED ? '✓ Capture en cours…'
    : isSharp  ? `⚡ Maintenez immobile (${stableFrames}/${STABLE_NEEDED})`
    : '→ Placez votre document dans le cadre'
  const statusBg =
    stableFrames >= STABLE_NEEDED ? 'rgba(74,222,128,0.90)'
    : isSharp ? 'rgba(196,151,106,0.90)'
    : 'rgba(0,0,0,0.68)'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      display: 'flex', flexDirection: 'column', fontFamily: BAI.fontBody,
    }}>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {{
              scanning: 'Scan IA · Détection automatique',
              processing: 'Traitement…', verifying: 'Vérification IA',
              verified: 'Validé', flip: 'Recto scanné',
              rejected: 'Document refusé', error: 'Erreur', done: 'Terminé',
            }[phase]}
          </p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>
            {LABEL[currentDt] ?? currentDt}
          </p>
        </div>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <X size={16} />
        </button>
      </div>

      {/* Viewport */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {/* ── Erreur caméra ──────────────────────────────────────────────── */}
        {camError ? (
          <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <ShieldOff size={40} color="rgba(255,255,255,0.35)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>{camError}</p>
            <button onClick={() => startCamera(facingMode)} style={{ padding: '10px 22px', borderRadius: 8, background: BAI.caramel, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Réessayer
            </button>
          </div>

        /* ── Traitement / Vérification ─────────────────────────────────── */
        ) : phase === 'processing' || phase === 'verifying' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Image capturée floue en arrière-plan */}
            {previewUrl && (
              <img src={previewUrl} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', padding: '60px 24px',
                filter: 'brightness(0.3) blur(2px)',
              }} />
            )}
            {/* Cadre de scan animé */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <div style={{
                width: 'min(300px,75vw)', height: 'min(190px,47vw)',
                border: '2px solid rgba(74,222,128,0.4)',
                borderRadius: 12, position: 'relative', overflow: 'hidden',
                animation: 'framePulse 1.8s ease-in-out infinite',
              }}>
                {/* Crochets */}
                {([
                  { top: -1, left: -1, borderRight: 'none', borderBottom: 'none', borderRadius: '8px 0 0 0' },
                  { top: -1, right: -1, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 8px 0 0' },
                  { bottom: -1, left: -1, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 8px' },
                  { bottom: -1, right: -1, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 8px 0' },
                ] as React.CSSProperties[]).map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 22, height: 22, border: '2.5px solid #4ade80', ...s }} />
                ))}
                {/* Ligne scan */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.9) 30%, #fff 50%, rgba(74,222,128,0.9) 70%, transparent)',
                  boxShadow: '0 0 14px 3px rgba(74,222,128,0.4)',
                  animation: 'scanLine 1.8s ease-in-out infinite',
                }}>
                  <div style={{ position: 'absolute', top: 0, bottom: -48, left: 0, right: 0, background: 'linear-gradient(to bottom, rgba(74,222,128,0.08), transparent)' }} />
                </div>
                {/* Grille */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'linear-gradient(rgba(74,222,128,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.04) 1px,transparent 1px)',
                  backgroundSize: '20px 20px',
                }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  {phase === 'processing' ? 'Traitement de l\'image…' : 'Vérification IA en cours'}
                </p>
                <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  {phase === 'processing' ? 'Recadrage…' : 'Analyse de la pièce d\'identité…'}
                </p>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: `dotBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

        /* ── Pièce validée — affichage des données ─────────────────────── */
        ) : phase === 'verified' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 120px' }}>
            {/* Image en fond */}
            {previewUrl && (
              <img src={previewUrl} alt="Document" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', padding: '60px 24px', filter: 'brightness(0.25)',
              }} />
            )}
            {/* Card données */}
            <div style={{
              position: 'relative', zIndex: 1, width: '100%', maxWidth: 340,
              background: 'rgba(10,12,18,0.92)', border: '1px solid rgba(74,222,128,0.25)',
              borderRadius: 16, padding: '24px 20px', backdropFilter: 'blur(8px)',
            }}>
              {/* Badge succès */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(74,222,128,0.15)', border: '1.5px solid rgba(74,222,128,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CheckCircle2 size={20} color="#4ade80" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Pièce d'identité vérifiée</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{LABEL[currentDt]}</p>
                </div>
              </div>

              {/* Données extraites */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ocrData?.prenom || ocrData?.nom ? (
                  <DataRow icon="👤" label="Nom" value={[ocrData.prenom, ocrData.nom].filter(Boolean).join(' ')} />
                ) : null}
                {ocrData?.dob ? <DataRow icon="🎂" label="Né·e le" value={fmt(ocrData.dob)} /> : null}
                {ocrData?.nationality ? <DataRow icon="🌍" label="Nationalité" value={ocrData.nationality} /> : null}
                {ocrData?.documentNumber ? <DataRow icon="🪪" label="N° document" value={ocrData.documentNumber} /> : null}
                {ocrData?.expiry ? <DataRow icon="📅" label="Expire le" value={fmt(ocrData.expiry)} /> : null}
              </div>
            </div>
          </div>

        /* ── Flip — proposer le verso (CNI seulement) ──────────────────── */
        ) : phase === 'flip' ? (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 28px 140px', gap: 24,
          }}>
            {/* Fond foncé */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)' }} />
            {/* Recto capturé (miniature) */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={rectoPreview} alt="Recto" style={{ width: 180, height: 113, objectFit: 'cover', borderRadius: 10, border: '2px solid rgba(74,222,128,0.5)', boxShadow: '0 0 24px rgba(74,222,128,0.15)' }} />
                <div style={{ position: 'absolute', top: -10, right: -10, width: 28, height: 28, borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} color="#14532d" strokeWidth={3} />
                </div>
              </div>
              {/* Flèche flip */}
              <div style={{ fontSize: 36, animation: 'flipBounce 1.5s ease-in-out infinite' }}>↩</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#fff' }}>Recto scanné ✓</p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 280, lineHeight: 1.6 }}>
                  Retournez votre carte et photographiez le verso pour compléter votre dossier.
                </p>
              </div>
            </div>
          </div>

        /* ── Document refusé ───────────────────────────────────────────── */
        ) : phase === 'rejected' || phase === 'error' ? (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 28px 140px', gap: 0,
          }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '60px 24px', filter: 'brightness(0.2) saturate(0.3)' }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(155,28,28,0.2)', border: '2px solid rgba(248,113,113,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        /* ── Caméra live + overlay ──────────────────────────────────────── */
        ) : (
          <>
            <video ref={videoRef} playsInline muted style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: camReady ? 1 : 0, transition: 'opacity 0.35s',
            }} />
            {!camReady && !camError && (
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Loader2 size={22} color={BAI.caramel} style={{ animation: 'spin 0.9s linear infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Initialisation…</span>
              </div>
            )}
            {flash && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', zIndex: 5 }} />}
            <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }} />
            {/* Pill de statut */}
            {camReady && (
              <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ background: statusBg, padding: '6px 18px', borderRadius: 20, fontSize: 12, color: '#fff', whiteSpace: 'nowrap', transition: 'background 0.3s', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                  {statusMsg}
                </div>
                {stableFrames > 0 && (
                  <div style={{ width: 120, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: stableFrames >= STABLE_NEEDED ? '#4ade80' : BAI.caramel, width: `${Math.min((stableFrames/STABLE_NEEDED)*100, 100)}%`, transition: 'width 0.35s ease' }} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Contrôles bas */}
      <div style={{
        padding: '14px 20px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
        minHeight: 110,
      }}>

        {/* Scanning */}
        {phase === 'scanning' && (
          <>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.05em' }}>
              Détection auto · ou appuyez sur ○ pour capturer
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Btn round onClick={() => { setFacingMode(m => { const next = m === 'environment' ? 'user' : 'environment'; startCamera(next); return next }) }}>
                <FlipHorizontal size={19} />
              </Btn>
              <button onClick={handleManualCapture} disabled={!camReady} style={{
                width: 70, height: 70, borderRadius: '50%',
                background: camReady ? '#fff' : 'rgba(255,255,255,0.18)',
                border: `4px solid ${camReady ? BAI.caramel : 'rgba(255,255,255,0.08)'}`,
                cursor: camReady ? 'pointer' : 'not-allowed',
                boxShadow: camReady ? '0 0 0 6px rgba(196,151,106,0.2)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: camReady ? BAI.caramel : 'rgba(255,255,255,0.22)' }} />
              </button>
              <Btn round onClick={() => startCamera(facingMode)}>
                <RotateCcw size={17} />
              </Btn>
            </div>
          </>
        )}

        {/* Vérifié (pas recto CNI) */}
        {phase === 'verified' && !isForCNI && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
            <Btn flex secondary onClick={handleRetry}><RotateCcw size={14} /> Reprendre</Btn>
            <Btn flex primary onClick={() => onComplete(capturesRef.current)}>
              <CheckCircle2 size={14} /> Utiliser <ArrowRight size={13} />
            </Btn>
          </div>
        )}

        {/* Vérifié recto CNI → flip */}
        {phase === 'verified' && isForCNI && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
            <Btn flex secondary onClick={handleRetry}><RotateCcw size={14} /> Reprendre</Btn>
            <Btn flex primary onClick={handleRectoVerified}>
              Scanner le verso <ArrowRight size={13} />
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

        {/* Refusé / erreur */}
        {(phase === 'rejected' || phase === 'error') && (
          <Btn flex primary onClick={handleRetry}><RefreshCw size={14} /> Rescanner</Btn>
        )}

        {/* Verso vérifié → terminé */}
        {phase === 'verified' && currentDt === 'CNI_VERSO' && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
            <Btn flex secondary onClick={handleRetry}><RotateCcw size={14} /> Reprendre</Btn>
            <Btn flex primary onClick={handleVersoVerified}>
              <CheckCircle2 size={14} /> Terminer <ArrowRight size={13} />
            </Btn>
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin       { to { transform: rotate(360deg) } }
        @keyframes scanLine   { 0%{top:5%} 48%{top:88%} 52%{top:88%} 100%{top:5%} }
        @keyframes framePulse { 0%,100%{border-color:rgba(74,222,128,0.35);box-shadow:0 0 0 0 transparent} 50%{border-color:rgba(74,222,128,0.7);box-shadow:0 0 20px 4px rgba(74,222,128,0.10)} }
        @keyframes dotBounce  { 0%,80%,100%{transform:scale(0.7);opacity:0.45} 40%{transform:scale(1.25);opacity:1} }
        @keyframes flipBounce { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-8px) rotate(5deg)} }
      `}</style>
    </div>
  )
}

// ── Sous-composants utilitaires ────────────────────────────────────────────────
function DataRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', minWidth: 70 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500, flex: 1, textAlign: 'right' }}>{value}</span>
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
    <button onClick={onClick} style={{
      ...(round ? { width: 46, height: 46, borderRadius: '50%' } : { padding: '12px 16px', borderRadius: 10 }),
      ...(flex ? { flex: 1 } : {}),
      border: secondary ? '1px solid rgba(255,255,255,0.18)' : 'none',
      background: primary ? BAI.caramel : 'rgba(255,255,255,0.12)',
      color: '#fff', fontSize: 13, fontWeight: primary ? 700 : 500,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontFamily: BAI.fontBody,
    }}>
      {children}
    </button>
  )
}
