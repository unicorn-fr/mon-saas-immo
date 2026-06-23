import { useEffect, useState, useCallback } from 'react'
import * as faceapi from '@vladmandic/face-api'

export type FaceEmbedding = number[]

interface FaceApiState {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
}

const MODEL_URL = '/models/face-api'
let modelsLoaded = false // singleton — charger une seule fois

export function useFaceApi() {
  const [state, setState] = useState<FaceApiState>({
    isLoaded: modelsLoaded,
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    if (modelsLoaded) return
    setState(s => ({ ...s, isLoading: true }))
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
      .then(() => {
        modelsLoaded = true
        setState({ isLoaded: true, isLoading: false, error: null })
      })
      .catch((err: Error) => {
        setState({ isLoaded: false, isLoading: false, error: 'Erreur chargement modèles IA : ' + err.message })
      })
  }, [])

  /**
   * Extrait l'embedding 128-D d'un visage depuis un canvas ou une image.
   * Returns null si aucun visage détecté.
   */
  const extractEmbedding = useCallback(async (
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceEmbedding | null> => {
    if (!modelsLoaded) return null
    const detection = await faceapi
      .detectSingleFace(source, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
      .withFaceLandmarks()
      .withFaceDescriptor()
    if (!detection) return null
    return Array.from(detection.descriptor) as FaceEmbedding
  }, [])

  /**
   * Liveness check : demande à l'utilisateur de cligner des yeux.
   * Détecte l'EAR (Eye Aspect Ratio) pour valider la présence physique.
   * Returns un score de 0 (fraude probable) à 1 (personne réelle).
   */
  const runLivenessCheck = useCallback(async (
    video: HTMLVideoElement,
    durationMs = 4000
  ): Promise<{ passed: boolean; score: number }> => {
    if (!modelsLoaded) return { passed: false, score: 0 }

    const EAR_THRESHOLD = 0.22 // Eye Aspect Ratio minimum pour un clignotement
    const samples: number[] = []
    const start = Date.now()
    let blinkDetected = false

    while (Date.now() - start < durationMs) {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()

      if (detection) {
        const { landmarks } = detection
        const leftEye = landmarks.getLeftEye()
        const rightEye = landmarks.getRightEye()

        // Eye Aspect Ratio = (vertical distances) / (2 * horizontal distance)
        const ear = (
          eyeAspectRatio(leftEye.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y }))) +
          eyeAspectRatio(rightEye.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y })))
        ) / 2

        samples.push(ear)
        if (ear < EAR_THRESHOLD && samples.length > 2 && samples[samples.length - 2] > EAR_THRESHOLD) {
          blinkDetected = true
        }
      }

      await new Promise(r => setTimeout(r, 150))
    }

    if (samples.length < 5) return { passed: false, score: 0.1 }

    // Score : présence de variation EAR + clignement détecté
    const variation = Math.max(...samples) - Math.min(...samples)
    const presenceScore = Math.min(1, variation / 0.15)
    const score = blinkDetected ? Math.max(0.8, presenceScore) : presenceScore * 0.6

    return { passed: score >= 0.6, score }
  }, [])

  return { ...state, extractEmbedding, runLivenessCheck }
}

function eyeAspectRatio(points: { x: number; y: number }[]): number {
  if (points.length < 6) return 0.3
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  const v1 = dist(points[1], points[5])
  const v2 = dist(points[2], points[4])
  const h  = dist(points[0], points[3])
  return (v1 + v2) / (2 * h)
}
