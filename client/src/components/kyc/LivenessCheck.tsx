import { useState, useCallback, useEffect } from 'react'
import { Camera, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { useWebcam } from '../../hooks/useWebcam'
import { useFaceApi } from '../../hooks/useFaceApi'
import { apiClient } from '../../services/api.service'

interface LivenessCheckProps {
  onComplete: (score: number) => void
}

type CheckStep = 'instructions' | 'starting' | 'running' | 'uploading' | 'success' | 'failed'

export function LivenessCheck({ onComplete }: LivenessCheckProps) {
  const { videoRef, error: camError, start, stop, } = useWebcam()
  const { isLoaded, extractEmbedding, runLivenessCheck } = useFaceApi()
  const [step, setStep] = useState<CheckStep>('instructions')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Regardez la caméra et clignez des yeux naturellement')
  const [error, setError] = useState<string | null>(null)

  const startCheck = useCallback(async () => {
    setError(null)
    setStep('starting')

    try {
      await start()
      setStep('running')
      setMessage('Regardez la caméra… clignez des yeux')

      // Simuler la progression visuellement
      const interval = setInterval(() => setProgress(p => Math.min(p + 2, 95)), 80)

      const video = videoRef.current!
      // Attendre que le flux soit prêt
      await new Promise(r => setTimeout(r, 1000))

      const { passed, score } = await runLivenessCheck(video, 4000)
      clearInterval(interval)

      if (!passed) {
        setStep('failed')
        setError('Liveness insuffisant. Assurez-vous d\'être bien éclairé et de cligner des yeux.')
        stop()
        return
      }

      setProgress(100)
      setMessage('Capture de votre visage…')

      // Extraire l'embedding de vérification depuis la webcam
      const embedding = isLoaded ? await extractEmbedding(video) : null
      if (!embedding) {
        setStep('failed')
        setError('Aucun visage détecté. Placez-vous face à la caméra.')
        stop()
        return
      }

      // Envoyer au serveur pour vérification
      setStep('uploading')
      await apiClient.post('/kyc/verify-biometric', {
        faceEmbedding: JSON.stringify(embedding),
        livenessScore: score,
      })

      stop()
      setStep('success')
      setTimeout(() => onComplete(score), 1500)

    } catch (err: unknown) {
      stop()
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        .response?.data?.message || (err as Error).message || 'Erreur lors de la vérification'
      setError(msg)
      setStep('failed')
    }
  }, [start, stop, videoRef, runLivenessCheck, extractEmbedding, isLoaded, onComplete])

  useEffect(() => () => { stop() }, [stop])

  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: BAI.tenantLight, border: `2px solid ${BAI.tenantBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <CheckCircle size={32} color={BAI.tenant} />
        </div>
        <h3 style={{
          fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
          fontSize: 22, color: BAI.ink, margin: 0,
        }}>
          Identité confirmée
        </h3>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, marginTop: 8 }}>
          Votre visage correspond à votre pièce d'identité.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 style={{
        fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
        fontSize: 22, color: BAI.ink, margin: '0 0 6px',
      }}>
        Vérification biométrique
      </h3>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 24px' }}>
        Nous allons comparer votre visage avec votre pièce d'identité via votre caméra.
      </p>

      {step === 'instructions' && (
        <div>
          <div style={{
            background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
            borderRadius: 12, padding: '20px 24px', marginBottom: 20,
          }}>
            {[
              ['Assurez-vous d\'être dans un endroit bien éclairé'],
              ['Regardez directement la caméra'],
              ['Clignez des yeux naturellement pendant la vérification'],
              ['Ne présentez pas une photo devant la caméra'],
            ].map(([text]) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>{text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={startCheck}
            style={{
              width: '100%', background: BAI.night, color: '#fff',
              border: 'none', borderRadius: 8, padding: '14px',
              fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 44,
            }}
          >
            <Camera size={18} /> Démarrer la vérification
          </button>
        </div>
      )}

      {(step === 'starting' || step === 'running' || step === 'uploading') && (
        <div>
          {/* Vidéo webcam */}
          <div style={{
            position: 'relative', borderRadius: 12, overflow: 'hidden',
            background: '#000', aspectRatio: '4/3', maxWidth: 480, margin: '0 auto 20px',
          }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            {/* Overlay guide visage */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 160, height: 200,
                border: `3px solid rgba(196,151,106,0.8)`,
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
              }} />
            </div>
            {/* Barre de progression */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 4, background: 'rgba(255,255,255,0.2)',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: BAI.caramel, transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, textAlign: 'center' }}>
            {step === 'uploading' ? 'Vérification en cours…' : message}
          </p>
        </div>
      )}

      {step === 'failed' && (
        <div>
          <div style={{
            background: BAI.errorLight, border: '1px solid #fca5a5',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8,
          }}>
            <AlertTriangle size={16} color={BAI.error} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0 }}>{error}</p>
          </div>
          <button
            onClick={() => { setStep('instructions'); setProgress(0); setError(null) }}
            style={{
              width: '100%', background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 8, padding: '13px',
              fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              color: BAI.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 44,
            }}
          >
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      )}

      {camError && (
        <div style={{
          background: BAI.errorLight, border: '1px solid #fca5a5',
          borderRadius: 8, padding: '10px 14px', marginTop: 12,
        }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0 }}>{camError}</p>
        </div>
      )}
    </div>
  )
}
