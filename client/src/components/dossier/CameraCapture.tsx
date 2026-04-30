import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ZapOff, FlipHorizontal, RotateCcw, Check } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

type DocType = 'CNI_RECTO' | 'CNI_VERSO' | 'PASSEPORT' | 'TITRE_SEJOUR' | string
type Phase = 'scanning' | 'captured'

interface CameraCaptureProps {
  docType: DocType
  onCapture: (file: File) => void
  onClose: () => void
}

const GUIDE_LABELS: Record<string, string> = {
  CNI_RECTO:    'Recto de la CNI',
  CNI_VERSO:    'Verso de la CNI',
  PASSEPORT:    'Page photo du passeport',
  TITRE_SEJOUR: 'Titre de séjour',
}

const GUIDE_SHAPES: Record<string, { w: number; h: number; label: string }> = {
  CNI_RECTO:    { w: 85, h: 54, label: 'Format carte (ID-1)' },
  CNI_VERSO:    { w: 85, h: 54, label: 'Format carte (ID-1)' },
  PASSEPORT:    { w: 68, h: 96, label: 'Format passeport (ID-3)' },
  TITRE_SEJOUR: { w: 85, h: 54, label: 'Format carte' },
}

// Frames needed at 500ms interval = 2s stable
const STABLE_NEEDED = 4
const INTERVAL_MS   = 500
const SCORE_MIN     = 0.065

// Sobel edge detection on a 96×64 downsampled frame — pure canvas, no deps
function getEdgeScore(video: HTMLVideoElement): number {
  const W = 96, H = 64
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return 0
  try {
    ctx.drawImage(video, 0, 0, W, H)
    const { data } = ctx.getImageData(0, 0, W, H)
    // Grayscale
    const gray = new Uint8Array(W * H)
    for (let i = 0; i < W * H; i++) {
      gray[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 151 + data[i * 4 + 2] * 28) >> 8
    }
    // Sobel in the center region (approx guide zone)
    const x0 = 8, x1 = W - 8, y0 = 6, y1 = H - 6
    let edges = 0, total = 0
    for (let y = y0 + 1; y < y1 - 1; y++) {
      for (let x = x0 + 1; x < x1 - 1; x++) {
        const i = y * W + x
        const gx = Math.abs(
          -gray[i - W - 1] - 2 * gray[i - 1] - gray[i + W - 1]
          + gray[i - W + 1] + 2 * gray[i + 1] + gray[i + W + 1],
        )
        const gy = Math.abs(
          -gray[i - W - 1] - 2 * gray[i - W] - gray[i - W + 1]
          + gray[i + W - 1] + 2 * gray[i + W] + gray[i + W + 1],
        )
        if (gx + gy > 40) edges++
        total++
      }
    }
    return total > 0 ? edges / total : 0
  } catch { return 0 }
}

export function CameraCapture({ docType, onCapture, onClose }: CameraCaptureProps) {
  const videoRef        = useRef<HTMLVideoElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const stableFramesRef = useRef(0)
  const phaseRef        = useRef<Phase>('scanning')

  const [facingMode,    setFacingMode]    = useState<'environment' | 'user'>('environment')
  const [ready,         setReady]         = useState(false)
  const [error,         setError]         = useState('')
  const [phase,         setPhase]         = useState<Phase>('scanning')
  const [stableFrames,  setStableFrames]  = useState(0)
  const [previewUrl,    setPreviewUrl]    = useState('')
  const [capturedFile,  setCapturedFile]  = useState<File | null>(null)
  const [flash,         setFlash]         = useState(false)

  const guide = GUIDE_SHAPES[docType] ?? { w: 85, h: 60, label: 'Document' }

  // Keep phaseRef in sync so interval closure can read current phase
  useEffect(() => { phaseRef.current = phase }, [phase])

  // Corner color: gray → caramel → green
  const cornerColor = stableFrames === 0
    ? 'rgba(255,255,255,0.28)'
    : stableFrames < STABLE_NEEDED
      ? BAI.caramel
      : '#4ade80'

  const captureFrame = useCallback((video: HTMLVideoElement) => {
    setFlash(true)
    setTimeout(() => setFlash(false), 220)
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const url = canvas.toDataURL('image/jpeg', 0.92)
    setPreviewUrl(url)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `${docType.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCapturedFile(file)
      setPhase('captured')
    }, 'image/jpeg', 0.92)
  }, [docType])

  // Analysis loop — starts/restarts when ready or phase changes
  useEffect(() => {
    if (!ready || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const video = videoRef.current
      if (!video || phaseRef.current !== 'scanning') return

      const score = getEdgeScore(video)
      if (score >= SCORE_MIN) {
        stableFramesRef.current = Math.min(stableFramesRef.current + 1, STABLE_NEEDED + 1)
        setStableFrames(stableFramesRef.current)
        if (stableFramesRef.current >= STABLE_NEEDED) {
          clearInterval(timerRef.current!)
          captureFrame(video)
        }
      } else {
        stableFramesRef.current = 0
        setStableFrames(0)
      }
    }, INTERVAL_MS)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [ready, phase, captureFrame])

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    stableFramesRef.current = 0
    setStableFrames(0)
    setReady(false)
    setError('')
    setPhase('scanning')
    setPreviewUrl('')
    setCapturedFile(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setReady(true)
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('NotAllowed') || msg.includes('Permission'))
        setError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur.")
      else if (msg.includes('NotFound') || msg.includes('DevicesNotFound'))
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

  const handleManualCapture = () => {
    const video = videoRef.current
    if (!video || !ready || phase !== 'scanning') return
    if (timerRef.current) clearInterval(timerRef.current)
    captureFrame(video)
  }

  const handleRetry = () => {
    stableFramesRef.current = 0
    setStableFrames(0)
    setPhase('scanning')
    setPreviewUrl('')
    setCapturedFile(null)
  }

  const handleConfirm = () => {
    if (capturedFile) onCapture(capturedFile)
  }

  const progressPct = Math.min((stableFrames / STABLE_NEEDED) * 100, 100)

  // ── Corner brackets helper ─────────────────────────────────────────────────
  const Corners = ({ color, animate }: { color: string; animate?: boolean }) => {
    const W = `${guide.w}%`
    const H = `${guide.h * 1.1}%`
    const s = 26, t = 3
    return (
      <div style={{ position: 'relative', width: W, height: H }}>
        {[
          { top: 0,    left: 0,   borderTop:    `${t}px solid ${color}`, borderLeft:   `${t}px solid ${color}` },
          { top: 0,    right: 0,  borderTop:    `${t}px solid ${color}`, borderRight:  `${t}px solid ${color}` },
          { bottom: 0, left: 0,   borderBottom: `${t}px solid ${color}`, borderLeft:   `${t}px solid ${color}` },
          { bottom: 0, right: 0,  borderBottom: `${t}px solid ${color}`, borderRight:  `${t}px solid ${color}` },
        ].map((style, i) => (
          <div key={i} style={{
            position: 'absolute', width: s, height: s,
            transition: 'border-color 0.3s',
            ...(animate ? { animation: 'cornerPulse 1s ease-in-out infinite' } : {}),
            ...style,
          }} />
        ))}
        {/* Center check badge — only when captured */}
        {color === '#4ade80' && phase === 'captured' && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 52, height: 52, borderRadius: '50%',
            background: '#4ade80',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(74,222,128,0.55)',
          }}>
            <Check size={26} color="#ffffff" strokeWidth={3} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: BAI.fontBody,
    }}>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {phase === 'captured' ? 'Vérification' : 'Scan IA · Détection automatique'}
          </p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
            {GUIDE_LABELS[docType] ?? docType}
          </p>
        </div>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff',
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Main area */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 680, flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
            <ZapOff size={40} color="rgba(255,255,255,0.4)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>{error}</p>
            <button onClick={() => startCamera(facingMode)} style={{
              padding: '10px 20px', borderRadius: 8, background: BAI.caramel, border: 'none',
              color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Réessayer</button>
          </div>
        ) : phase === 'captured' && previewUrl ? (
          // ── Preview ──────────────────────────────────────────────────────────
          <>
            <img
              src={previewUrl} alt="Aperçu"
              style={{ width: '100%', maxHeight: 'calc(100dvh - 220px)', objectFit: 'contain' }}
            />
            {/* Overlay on preview */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)',
                WebkitMaskImage: `radial-gradient(ellipse ${guide.w}% ${guide.h}% at center, transparent 80%, black 100%)`,
                maskImage: `radial-gradient(ellipse ${guide.w}% ${guide.h}% at center, transparent 80%, black 100%)`,
              }} />
              <Corners color="#4ade80" />
            </div>
          </>
        ) : (
          // ── Scanning ─────────────────────────────────────────────────────────
          <>
            <video
              ref={videoRef} playsInline muted
              style={{
                width: '100%', height: '100%', maxHeight: 'calc(100dvh - 200px)',
                objectFit: 'cover',
                opacity: ready ? 1 : 0, transition: 'opacity 0.3s',
              }}
            />
            {/* Flash */}
            {flash && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)', pointerEvents: 'none' }} />}

            {/* Guide overlay */}
            {ready && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                {/* Vignette */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.48)',
                  WebkitMaskImage: `radial-gradient(ellipse ${guide.w}% ${guide.h}% at center, transparent 78%, black 100%)`,
                  maskImage: `radial-gradient(ellipse ${guide.w}% ${guide.h}% at center, transparent 78%, black 100%)`,
                }} />
                <Corners color={cornerColor} />

                {/* Status pill + progress */}
                <div style={{
                  position: 'absolute',
                  bottom: `calc(50% - ${guide.h * 0.55}% - 42px)`,
                  left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                }}>
                  <div style={{
                    background: stableFrames > 0 ? 'rgba(196,151,106,0.9)' : 'rgba(0,0,0,0.65)',
                    padding: '5px 16px', borderRadius: 20,
                    fontSize: 12, color: '#ffffff', whiteSpace: 'nowrap',
                    transition: 'background 0.3s',
                  }}>
                    {stableFrames === 0
                      ? '→ Cadrez votre document dans la zone'
                      : stableFrames < STABLE_NEEDED
                        ? '⚡ Document détecté — maintenez stable…'
                        : '✓ Capture en cours…'
                    }
                  </div>
                  {stableFrames > 0 && (
                    <div style={{ width: 140, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.18)' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        background: stableFrames >= STABLE_NEEDED ? '#4ade80' : BAI.caramel,
                        width: `${progressPct}%`,
                        transition: 'width 0.35s ease, background 0.3s',
                      }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {!ready && !error && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.15)', borderTopColor: BAI.caramel,
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Initialisation…</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom controls */}
      <div style={{
        padding: '20px 20px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 20, width: '100%', maxWidth: 420,
      }}>
        {phase === 'scanning' ? (
          <>
            {/* Flip camera */}
            <button onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
              title="Changer de caméra"
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <FlipHorizontal size={20} />
            </button>

            {/* Manual capture button */}
            <button onClick={handleManualCapture} disabled={!ready}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: ready ? '#ffffff' : 'rgba(255,255,255,0.18)',
                border: `4px solid ${ready ? BAI.caramel : 'rgba(255,255,255,0.08)'}`,
                cursor: ready ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: ready ? '0 0 0 6px rgba(196,151,106,0.22)' : 'none',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: ready ? BAI.caramel : 'rgba(255,255,255,0.25)',
                transition: 'background 0.2s',
              }} />
            </button>

            {/* Reset */}
            <button onClick={() => startCamera(facingMode)} title="Réinitialiser"
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <RotateCcw size={18} />
            </button>
          </>
        ) : (
          // Captured: Reprendre / Utiliser
          <>
            <button onClick={handleRetry} style={{
              flex: 1, maxWidth: 160, padding: '14px 20px', borderRadius: 12,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <RotateCcw size={15} />
              Reprendre
            </button>
            <button onClick={handleConfirm} style={{
              flex: 1, maxWidth: 160, padding: '14px 20px', borderRadius: 12,
              background: '#4ade80', border: 'none',
              color: '#14532d', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Check size={15} />
              Utiliser
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes cornerPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
      `}</style>
    </div>
  )
}
