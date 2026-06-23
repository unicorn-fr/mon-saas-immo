import { useRef, useState, useCallback } from 'react'
import { sha256Hex } from '../utils/crypto.util'

export interface RecordingResult {
  blob: Blob
  hash: string
  durationMs: number
  url: string
}

export function useMediaRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const [isRecording, setIsRecording] = useState(false)

  const start = useCallback((stream: MediaStream) => {
    chunksRef.current = []
    startTimeRef.current = Date.now()

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    const recorder = new MediaRecorder(stream, { mimeType })
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.start(250) // chunk toutes les 250ms
    recorderRef.current = recorder
    setIsRecording(true)
  }, [])

  const stop = useCallback((): Promise<RecordingResult> => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current
      if (!recorder) return reject(new Error('Aucun enregistrement en cours'))

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        const durationMs = Date.now() - startTimeRef.current
        const url = URL.createObjectURL(blob)

        // Calculer SHA-256 du blob
        const arrayBuffer = await blob.arrayBuffer()
        const hash = await sha256Hex(arrayBuffer)

        setIsRecording(false)
        resolve({ blob, hash, durationMs, url })
      }

      recorder.stop()
    })
  }, [])

  return { start, stop, isRecording }
}
