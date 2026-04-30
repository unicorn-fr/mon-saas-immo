import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Camera, RefreshCw, ZapOff, FlipHorizontal } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

type DocType = 'CNI_RECTO' | 'CNI_VERSO' | 'PASSEPORT' | 'TITRE_SEJOUR' | string

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

export function CameraCapture({ docType, onCapture, onClose }: CameraCaptureProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [ready, setReady]   = useState(false)
  const [error, setError]   = useState('')
  const [flash, setFlash]   = useState(false)

  const guide = GUIDE_SHAPES[docType] ?? { w: 85, h: 60, label: 'Document' }

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    // Stop existing stream
    streamRef.current?.getTracks().forEach(t => t.stop())
    setReady(false)
    setError('')

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
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur.")
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError("Aucune caméra détectée. Utilisez l'option d'import de fichier.")
      } else {
        setError("Impossible d'accéder à la caméra. Essayez de recharger la page.")
      }
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [facingMode, startCamera])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || !ready) return

    // Flash feedback
    setFlash(true)
    setTimeout(() => setFlash(false), 200)

    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `${docType.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(file)
    }, 'image/jpeg', 0.92)
  }

  const flipCamera = () => {
    setFacingMode(m => m === 'environment' ? 'user' : 'environment')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.96)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: BAI.fontBody,
    }}>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 2,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Capture
          </p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
            {GUIDE_LABELS[docType] ?? docType}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Camera feed */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 680, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            padding: 32, textAlign: 'center',
          }}>
            <ZapOff size={40} color="rgba(255,255,255,0.4)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
              {error}
            </p>
            <button
              onClick={() => startCamera(facingMode)}
              style={{
                padding: '10px 20px', borderRadius: 8,
                background: BAI.caramel, border: 'none',
                color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%', height: '100%', maxHeight: 'calc(100dvh - 200px)',
                objectFit: 'cover',
                opacity: ready ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            />

            {/* Flash feedback */}
            {flash && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.6)',
                pointerEvents: 'none',
                borderRadius: 4,
              }} />
            )}

            {/* Guide overlay */}
            {ready && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                {/* Dark vignette around guide */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.38)',
                  WebkitMaskImage: `radial-gradient(ellipse ${guide.w}% ${guide.h}% at center, transparent 80%, black 100%)`,
                  maskImage: `radial-gradient(ellipse ${guide.w}% ${guide.h}% at center, transparent 80%, black 100%)`,
                }} />

                {/* Corner guides */}
                {(() => {
                  const W = `${guide.w}%`, H = `${guide.h * 1.1}%`
                  const c = BAI.caramel
                  const s = 22
                  const t = 3
                  const corners = [
                    { top: 0, left: 0, borderTop: `${t}px solid ${c}`, borderLeft: `${t}px solid ${c}` },
                    { top: 0, right: 0, borderTop: `${t}px solid ${c}`, borderRight: `${t}px solid ${c}` },
                    { bottom: 0, left: 0, borderBottom: `${t}px solid ${c}`, borderLeft: `${t}px solid ${c}` },
                    { bottom: 0, right: 0, borderBottom: `${t}px solid ${c}`, borderRight: `${t}px solid ${c}` },
                  ]
                  return (
                    <div style={{ position: 'relative', width: W, height: H }}>
                      {corners.map((style, i) => (
                        <div key={i} style={{ position: 'absolute', width: s, height: s, ...style }} />
                      ))}
                    </div>
                  )
                })()}

                {/* Label */}
                <div style={{
                  position: 'absolute', bottom: `calc(50% - ${guide.h * 0.55}% - 28px)`,
                  left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 11, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap',
                }}>
                  {guide.label} — centrez et calez les 4 coins
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {!ready && !error && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.15)',
                  borderTopColor: BAI.caramel,
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
        padding: '20px 20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 24, width: '100%', maxWidth: 400,
      }}>
        {/* Flip camera */}
        <button
          onClick={flipCamera}
          title="Retourner la caméra"
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.7)',
            transition: 'background 0.15s',
          }}
        >
          <FlipHorizontal size={20} />
        </button>

        {/* Capture button */}
        <button
          onClick={handleCapture}
          disabled={!ready}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: ready ? '#ffffff' : 'rgba(255,255,255,0.2)',
            border: `4px solid ${ready ? BAI.caramel : 'rgba(255,255,255,0.1)'}`,
            cursor: ready ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: ready ? '0 0 0 6px rgba(196,151,106,0.25)' : 'none',
          }}
        >
          <Camera size={28} color={ready ? BAI.ink : 'rgba(255,255,255,0.3)'} />
        </button>

        {/* Retry */}
        <button
          onClick={() => startCamera(facingMode)}
          title="Réinitialiser la caméra"
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
