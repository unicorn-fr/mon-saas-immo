import { useState, useRef, useCallback, useEffect } from 'react'
import { PenLine, Video, CheckCircle, AlertTriangle } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { BAI } from '../../constants/bailio-tokens'
import { useWebcam } from '../../hooks/useWebcam'
import { useMediaRecorder } from '../../hooks/useMediaRecorder'
import { useFaceApi } from '../../hooks/useFaceApi'
import { apiClient } from '../../services/api.service'

interface VideoSignatureProps {
  contractId: string
  contractTitle: string
  onComplete: () => void
}

type SignStep = 'pre-check' | 'checking' | 'signing' | 'submitting' | 'done' | 'error'

export function VideoSignature({ contractId, contractTitle, onComplete }: VideoSignatureProps) {
  const { videoRef, start, stop } = useWebcam()
  const { start: startRec, stop: stopRec } = useMediaRecorder()
  const { isLoaded, extractEmbedding } = useFaceApi()
  const padRef = useRef<SignatureCanvas>(null)
  const [step, setStep] = useState<SignStep>('pre-check')
  const [error, setError] = useState<string | null>(null)
  const [signatureEmpty, setSignatureEmpty] = useState(true)

  // Surveiller si la signature est vide
  const handleSignatureEnd = useCallback(() => {
    setSignatureEmpty(padRef.current?.isEmpty() ?? true)
  }, [])

  const startFaceCheck = useCallback(async () => {
    setStep('checking')
    try {
      const stream = await start()
      await new Promise(r => setTimeout(r, 1200)) // laisser la caméra s'initialiser
      // Démarrer l'enregistrement vidéo
      startRec(stream)
      setStep('signing')
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. ' + (err as Error).message)
      setStep('error')
    }
  }, [start, startRec])

  const handleSubmit = useCallback(async () => {
    if (!padRef.current || padRef.current.isEmpty()) return
    setStep('submitting')

    try {
      // 1. Capturer l'image de signature
      const signatureImageBase64 = padRef.current.getTrimmedCanvas().toDataURL('image/png')

      // 2. Capturer embedding facial final
      let faceEmbedding: string | null = null
      if (isLoaded && videoRef.current) {
        const emb = await extractEmbedding(videoRef.current)
        if (emb) faceEmbedding = JSON.stringify(emb)
      }

      // 3. Arrêter l'enregistrement
      const recording = await stopRec()
      stop()

      // 4. Envoyer au serveur
      const formData = new FormData()
      formData.append('video', recording.blob, 'signature.webm')
      formData.append('videoHash', recording.hash)
      formData.append('signatureImageBase64', signatureImageBase64)
      if (faceEmbedding) formData.append('faceEmbedding', faceEmbedding)

      await apiClient.post(`/kyc/sign/${contractId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setStep('done')
      setTimeout(onComplete, 2000)

    } catch (err: unknown) {
      stop()
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'Erreur lors de la signature'
      setError(msg)
      setStep('error')
    }
  }, [contractId, isLoaded, videoRef, extractEmbedding, stopRec, stop, onComplete])

  useEffect(() => () => { stop() }, [stop])

  if (step === 'done') {
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
          fontSize: 24, color: BAI.ink, margin: '0 0 8px',
        }}>
          Bail signé avec succès
        </h3>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
          Votre signature a été enregistrée avec preuve vidéo horodatée.
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
        Signature du bail
      </h3>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '0 0 6px' }}>
        <strong style={{ color: BAI.ink }}>{contractTitle}</strong>
      </p>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: '0 0 24px' }}>
        Votre webcam vous filme pendant la signature (preuve légale horodatée).
      </p>

      {step === 'pre-check' && (
        <div>
          <div style={{
            background: BAI.caramelLight, border: `1px solid ${BAI.caramelBorder}`,
            borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          }}>
            <p style={{
              fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 14,
              color: BAI.ink, margin: '0 0 8px',
            }}>
              Ce qui va se passer :
            </p>
            {[
              'Votre webcam démarre et vous filme pendant la signature',
              'Vous signez à l\'écran avec votre souris ou votre doigt',
              'La vidéo est conservée chiffrée comme preuve légale',
              'La signature est horodatée avec votre identité vérifiée',
            ].map(t => (
              <p key={t} style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '4px 0' }}>
                — {t}
              </p>
            ))}
          </div>
          <button
            onClick={startFaceCheck}
            style={{
              width: '100%', background: BAI.night, color: '#fff',
              border: 'none', borderRadius: 8, padding: '14px',
              fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 44,
            }}
          >
            <Video size={18} /> Démarrer la signature vidéo
          </button>
        </div>
      )}

      {step === 'checking' && (
        <p style={{
          fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid,
          textAlign: 'center', padding: 40,
        }}>
          Vérification de votre identité…
        </p>
      )}

      {step === 'signing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Webcam */}
          <div>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: BAI.error, margin: '0 0 6px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: BAI.error, display: 'inline-block',
              }} />
              REC
            </p>
            <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
            </div>
          </div>

          {/* Zone de signature */}
          <div>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: BAI.inkFaint, margin: '0 0 6px',
            }}>
              Votre signature
            </p>
            <SignatureCanvas
              ref={padRef}
              onEnd={handleSignatureEnd}
              penColor={BAI.ink}
              minWidth={1.5}
              maxWidth={3}
              canvasProps={{
                style: {
                  border: `2px solid ${BAI.border}`,
                  borderRadius: 10,
                  background: BAI.bgSurface,
                  cursor: 'crosshair',
                  width: '100%',
                  touchAction: 'none',
                  aspectRatio: '4/3',
                },
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => { padRef.current?.clear(); setSignatureEmpty(true) }}
                style={{
                  flex: 1, background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                  borderRadius: 6, padding: '7px',
                  fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Effacer
              </button>
              <button
                onClick={handleSubmit}
                disabled={signatureEmpty}
                style={{
                  flex: 2,
                  background: signatureEmpty ? BAI.border : BAI.tenant,
                  color: signatureEmpty ? BAI.inkFaint : '#fff',
                  border: 'none', borderRadius: 6, padding: '7px 12px',
                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                  cursor: signatureEmpty ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  minHeight: 44,
                }}
              >
                <PenLine size={14} />
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'submitting' && (
        <p style={{
          fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid,
          textAlign: 'center', padding: 40,
        }}>
          Enregistrement de la signature et de la preuve vidéo…
        </p>
      )}

      {step === 'error' && (
        <div>
          <div style={{
            background: BAI.errorLight, border: '1px solid #fca5a5',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            display: 'flex', gap: 8,
          }}>
            <AlertTriangle size={16} color={BAI.error} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0 }}>{error}</p>
          </div>
          <button
            onClick={() => { setStep('pre-check'); setError(null) }}
            style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 8, padding: '10px 20px',
              fontFamily: BAI.fontBody, fontSize: 14, cursor: 'pointer', color: BAI.ink,
              minHeight: 44,
            }}
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}
