import { useRef, useState, useCallback, useEffect, type RefObject } from 'react'

export interface WebcamState {
  stream: MediaStream | null
  error: string | null
  isActive: boolean
  videoRef: RefObject<HTMLVideoElement>
}

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  const start = useCallback(async (constraints?: MediaStreamConstraints) => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
        ...constraints,
      })
      setStream(mediaStream)
      setIsActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      return mediaStream
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Caméra inaccessible'
      const friendly =
        msg.includes('Permission') || msg.includes('NotAllowed')
          ? 'Accès à la caméra refusé. Autorisez la caméra dans votre navigateur.'
          : msg.includes('NotFound')
          ? 'Aucune caméra détectée.'
          : 'Impossible d\'accéder à la caméra : ' + msg
      setError(friendly)
      throw new Error(friendly)
    }
  }, [])

  const stop = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setStream(null)
    setIsActive(false)
  }, [stream])

  /** Capture une frame du flux vidéo en base64 */
  const captureFrame = useCallback((width = 640, height = 480): string | null => {
    if (!videoRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(videoRef.current, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [])

  useEffect(() => () => { stop() }, [stop])

  return { videoRef, stream, error, isActive, start, stop, captureFrame }
}
