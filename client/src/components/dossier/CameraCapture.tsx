/**
 * CameraCapture v12 — Simple guided photo scanner
 *
 * Flow: camera opens → user frames document in guide → presses shutter
 * → guide zone is auto-cropped → backend OCR extracts data → confirm/reject
 *
 * No live detection, no auto-capture, no blur scoring.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  X, RotateCcw, CheckCircle2,
  Loader2, ShieldOff, RefreshCw,
  CreditCard, Car, BookOpen, FileText, ArrowRight,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient as api } from '../../services/api.service'

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase =
  | 'selecting'   // user picks doc type
  | 'scanning'    // live camera — user presses shutter
  | 'processing'  // crop + backend OCR in progress
  | 'confirming'  // OCR done → show extracted data
  | 'flip'        // recto ok → prompt for verso
  | 'rejected'    // backend rejected the image
  | 'error'       // network / camera error

export type DocFamily = 'cni' | 'permis' | 'passport' | 'sejour'

interface OcrData {
  nom: string; prenom: string; dob: string
  nationality: string; documentNumber: string; expiry: string; side: string
}

interface BackendOcrResult {
  isIdDocument: boolean; rejectReason: string
  nom: string; prenom: string; dob: string
  nationality: string; documentNumber: string; expiry: string; mrz: string; side: string
}

export interface CaptureEntry { file: File; docType: string }

interface CameraCaptureProps {
  docType?: string
  initialFamily?: DocFamily
  onComplete: (captures: CaptureEntry[]) => void
  onClose: () => void
}

// ── Config ────────────────────────────────────────────────────────────────────
const ASPECT: Record<string, number> = {
  CNI_RECTO:    85.6 / 54,
  CNI_VERSO:    85.6 / 54,
  PERMIS_RECTO: 85.6 / 54,
  PERMIS_VERSO: 85.6 / 54,
  PASSEPORT:    125  / 88,
  TITRE_SEJOUR: 85.6 / 54,
}

const LABEL: Record<string, string> = {
  CNI_RECTO:    'Recto de la CNI',
  CNI_VERSO:    'Verso de la CNI',
  PERMIS_RECTO: 'Recto du permis',
  PERMIS_VERSO: 'Verso du permis',
  PASSEPORT:    'Page photo du passeport',
  TITRE_SEJOUR: 'Titre de séjour',
}

const GUIDE_FRAC = 0.84
const CARAMEL    = '#c4976a'
const DARK_BG    = '#0a0c12'

const DOC_OPTIONS: { family: DocFamily; label: string; sub: string; Icon: React.ElementType }[] = [
  { family: 'cni',      label: "Carte d'identité",   sub: '2 faces à scanner', Icon: CreditCard },
  { family: 'permis',   label: 'Permis de conduire', sub: '2 faces à scanner', Icon: Car        },
  { family: 'passport', label: 'Passeport',           sub: 'Page photo',        Icon: BookOpen   },
  { family: 'sejour',   label: 'Titre de séjour',     sub: 'Recto uniquement',  Icon: FileText   },
]

// ── Backend OCR ───────────────────────────────────────────────────────────────
async function callBackendOcr(imageBlob: Blob, docType: string): Promise<BackendOcrResult> {
  const formData = new FormData()
  formData.append('file', imageBlob, 'scan.jpg')
  formData.append('docType', docType)
  const res = await api.post('/ocr/extract', formData)
  return res.data.data as BackendOcrResult
}

// ── Guide overlay ─────────────────────────────────────────────────────────────
/** Draw the dark overlay with a rectangular cutout and corner brackets. */
function drawGuide(canvas: HTMLCanvasElement, aspect: number, flash: boolean) {
  const W = canvas.width, H = canvas.height
  if (!W || !H) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  if (flash) return

  const maxGW = W * GUIDE_FRAC, maxGH = H * GUIDE_FRAC
  let gW: number, gH: number
  if (maxGW / maxGH > aspect) { gH = maxGH; gW = gH * aspect }
  else { gW = maxGW; gH = gW / aspect }
  const gX = (W - gW) / 2, gY = (H - gH) / 2
  const R = 14

  // Dark mask with guide hole
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.moveTo(gX + R, gY)
  ctx.lineTo(gX + gW - R, gY); ctx.arcTo(gX + gW, gY, gX + gW, gY + R, R)
  ctx.lineTo(gX + gW, gY + gH - R); ctx.arcTo(gX + gW, gY + gH, gX + gW - R, gY + gH, R)
  ctx.lineTo(gX + R, gY + gH); ctx.arcTo(gX, gY + gH, gX, gY + gH - R, R)
  ctx.lineTo(gX, gY + R); ctx.arcTo(gX, gY, gX + R, gY, R)
  ctx.closePath()
  ctx.fill('evenodd')
  ctx.restore()

  // Guide border
  ctx.strokeStyle = CARAMEL
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(196,151,106,0.5)'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.moveTo(gX + R, gY)
  ctx.lineTo(gX + gW - R, gY); ctx.arcTo(gX + gW, gY, gX + gW, gY + R, R)
  ctx.lineTo(gX + gW, gY + gH - R); ctx.arcTo(gX + gW, gY + gH, gX + gW - R, gY + gH, R)
  ctx.lineTo(gX + R, gY + gH); ctx.arcTo(gX, gY + gH, gX, gY + gH - R, R)
  ctx.lineTo(gX, gY + R); ctx.arcTo(gX, gY, gX + R, gY, R)
  ctx.closePath()
  ctx.stroke()
  ctx.shadowBlur = 0

  // Corner brackets
  const BL = Math.min(gW, gH) * 0.13
  ctx.strokeStyle = CARAMEL
  ctx.lineWidth = 3.5
  ;([
    [gX,      gY,      1,  1],
    [gX + gW, gY,     -1,  1],
    [gX,      gY + gH, 1, -1],
    [gX + gW, gY + gH,-1, -1],
  ] as [number, number, number, number][]).forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(cx + dx * BL, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + dy * BL)
    ctx.stroke()
  })
}

/** Crop the guide zone from the video and output at 1200px wide. */
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
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(video, gX, gY, gW, gH, 0, 0, out.width, out.height)
  return out
}

// ── Component ──────────────────────────────────────────────────────────────────
export function CameraCapture({ initialFamily, onComplete, onClose }: CameraCaptureProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const rafRef     = useRef<number>(0)
  const flashRaf   = useRef(false)
  const phaseRef   = useRef<Phase>(initialFamily ? 'scanning' : 'selecting')
  const capturesRef = useRef<CaptureEntry[]>([])

  const [phase,          setPhase]          = useState<Phase>(initialFamily ? 'scanning' : 'selecting')
  const [selectedFamily, setSelectedFamily] = useState<DocFamily | null>(initialFamily ?? null)
  const [isVerso,        setIsVerso]        = useState(false)
  const [camReady,       setCamReady]       = useState(false)
  const [camError,       setCamError]       = useState('')
  const [flash,          setFlash]          = useState(false)
  const [previewUrl,     setPreviewUrl]     = useState('')
  const [rectoPreview,   setRectoPreview]   = useState('')
  const [ocrData,        setOcrData]        = useState<OcrData | null>(null)
  const [rejectReason,   setRejectReason]   = useState('')

  // currentDt is derived from selected family + isVerso, never stale
  const currentDt = useMemo(() => {
    if (!selectedFamily) return 'CNI_RECTO'
    if (selectedFamily === 'cni')      return isVerso ? 'CNI_VERSO'    : 'CNI_RECTO'
    if (selectedFamily === 'permis')   return isVerso ? 'PERMIS_VERSO' : 'PERMIS_RECTO'
    if (selectedFamily === 'passport') return 'PASSEPORT'
    return 'TITRE_SEJOUR'
  }, [selectedFamily, isVerso])

  const needsVerso  = selectedFamily === 'cni' || selectedFamily === 'permis'
  const showFlipBtn = phase === 'confirming' && needsVerso && !isVerso
  const showDoneBtn = phase === 'confirming' && (!needsVerso || isVerso)
  const aspect      = ASPECT[currentDt] ?? ASPECT.CNI_RECTO

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCamReady(false)
    setCamError('')
    setPhaseSync('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
            ? 'Aucune caméra détectée.'
            : "Impossible d'accéder à la caméra. Rechargez la page.",
      )
    }
  }, [setPhaseSync])

  // Auto-start when initialFamily provided (skip selector)
  useEffect(() => {
    if (initialFamily) {
      setSelectedFamily(initialFamily)
      startCamera()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── RAF overlay loop (guide frame only) ───────────────────────────────────
  const drawLoop = useCallback(() => {
    const cvs = overlayRef.current
    if (cvs && phaseRef.current === 'scanning') {
      const { offsetWidth: w, offsetHeight: h } = cvs
      if (cvs.width !== w || cvs.height !== h) { cvs.width = w; cvs.height = h }
      drawGuide(cvs, aspect, flashRaf.current)
    }
    rafRef.current = requestAnimationFrame(drawLoop)
  }, [aspect])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawLoop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [drawLoop])

  // ── Capture ───────────────────────────────────────────────────────────────
  const doCapture = useCallback(() => {
    const video = videoRef.current
    if (!video || !camReady || phaseRef.current !== 'scanning') return

    // Flash blanc
    flashRaf.current = true
    setFlash(true)
    setTimeout(() => { flashRaf.current = false; setFlash(false) }, 180)

    setPhaseSync('processing')

    setTimeout(() => {
      const cropped = cropGuide(video, aspect)
      cropped.toBlob(async blob => {
        if (!blob) { setPhaseSync('scanning'); return }
        const url  = URL.createObjectURL(blob)
        const file = new File([blob], `${currentDt.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' })
        setPreviewUrl(url)

        try {
          const result = await callBackendOcr(blob, currentDt)

          if (!result.isIdDocument) {
            // Verso: accept even if backend is unsure (back side has little text)
            if (isVerso) {
              capturesRef.current = [
                ...capturesRef.current.filter(c => c.docType !== currentDt),
                { file, docType: currentDt },
              ]
              setOcrData({ nom: '', prenom: '', dob: '', nationality: '', documentNumber: '', expiry: '', side: 'verso' })
              setPhaseSync('confirming')
              return
            }
            setRejectReason(
              result.rejectReason ||
              "Document non reconnu. Présentez uniquement une pièce d'identité officielle avec photo.",
            )
            setPhaseSync('rejected')
            return
          }

          capturesRef.current = [
            ...capturesRef.current.filter(c => c.docType !== currentDt),
            { file, docType: currentDt },
          ]
          if (!isVerso) setRectoPreview(url)
          setOcrData({
            nom:            result.nom,
            prenom:         result.prenom,
            dob:            result.dob,
            nationality:    result.nationality,
            documentNumber: result.documentNumber,
            expiry:         result.expiry,
            side:           result.side,
          })
          setPhaseSync('confirming')
        } catch {
          setRejectReason('Erreur de connexion. Vérifiez votre connexion internet et réessayez.')
          setPhaseSync('error')
        }
      }, 'image/jpeg', 0.95)
    }, 0)
  }, [camReady, aspect, currentDt, isVerso, setPhaseSync])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectFamily = useCallback((family: DocFamily) => {
    setSelectedFamily(family)
    setIsVerso(false)
    capturesRef.current = []
    startCamera()
  }, [startCamera])

  const handleRetry = useCallback(() => {
    setPreviewUrl('')
    setRejectReason('')
    setOcrData(null)
    startCamera()
  }, [startCamera])

  const handleRectoVerified = () => setPhaseSync('flip')

  const handleStartVerso = useCallback(() => {
    setIsVerso(true)
    setPreviewUrl('')
    setOcrData(null)
    startCamera()
  }, [startCamera])

  const handleSkipVerso = useCallback(() => { onComplete(capturesRef.current) }, [onComplete])
  const handleDone      = useCallback(() => { onComplete(capturesRef.current) }, [onComplete])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (iso: string) => {
    if (!iso || iso.length < 10) return iso
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  const familyLabel: Record<DocFamily, string> = {
    cni: "Carte d'identité", permis: 'Permis de conduire',
    passport: 'Passeport', sejour: 'Titre de séjour',
  }

  const topTitle = !selectedFamily
    ? 'Scanner un document'
    : needsVerso
      ? (isVerso ? 'Verso — Étape 2/2' : 'Recto — Étape 1/2')
      : LABEL[currentDt] ?? currentDt

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: DARK_BG,
      display: 'flex', flexDirection: 'column', fontFamily: BAI.fontBody,
    }}>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.78), transparent)',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: BAI.fontBody }}>
            {topTitle}
          </p>
          {selectedFamily && needsVerso && (
            <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
              {[1, 2].map(n => (
                <div key={n} style={{
                  width: (isVerso ? n <= 2 : n <= 1) ? 18 : 6, height: 6, borderRadius: 3,
                  background: (isVerso ? n <= 2 : n <= 1) ? CARAMEL : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {/* ── SELECTING ─────────────────────────────────────────────────── */}
        {phase === 'selecting' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px 20px 24px', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: CARAMEL, margin: '0 0 8px', fontWeight: 700 }}>
                Étape 1 / 2
              </p>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(22px,5vw,30px)', fontWeight: 700, fontStyle: 'italic', color: '#fff', margin: '0 0 8px' }}>
                Quel document souhaitez-vous scanner ?
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                Sélectionnez le type de pièce d'identité
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 380 }}>
              {DOC_OPTIONS.map(opt => (
                <button
                  key={opt.family}
                  onClick={() => handleSelectFamily(opt.family)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, padding: '18px 14px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                    textAlign: 'left', transition: 'all 0.2s', fontFamily: BAI.fontBody,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = CARAMEL; e.currentTarget.style.background = 'rgba(196,151,106,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <opt.Icon size={18} color={CARAMEL} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#fff' }}>{opt.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CAMERA ERROR ──────────────────────────────────────────────── */}
        {phase !== 'selecting' && camError && (
          <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <ShieldOff size={40} color="rgba(255,255,255,0.35)" />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>{camError}</p>
            <button onClick={startCamera} style={{ padding: '10px 22px', borderRadius: 8, background: CARAMEL, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Réessayer
            </button>
          </div>
        )}

        {/* ── PROCESSING ────────────────────────────────────────────────── */}
        {phase === 'processing' && (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '60px 24px', filter: 'brightness(0.3) blur(2px)' }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 'min(300px,75vw)', height: 'min(190px,47vw)', border: '2px solid rgba(196,151,106,0.4)', borderRadius: 12, position: 'relative', overflow: 'hidden', animation: 'framePulse 1.8s ease-in-out infinite' }}>
                {([
                  { top: -1, left: -1, borderRight: 'none', borderBottom: 'none', borderRadius: '8px 0 0 0' },
                  { top: -1, right: -1, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 8px 0 0' },
                  { bottom: -1, left: -1, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 8px' },
                  { bottom: -1, right: -1, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 8px 0' },
                ] as React.CSSProperties[]).map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 22, height: 22, border: `2.5px solid ${CARAMEL}`, ...s }} />
                ))}
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgba(196,151,106,0.9) 30%, #fff 50%, rgba(196,151,106,0.9) 70%, transparent)`, boxShadow: '0 0 14px 3px rgba(196,151,106,0.4)', animation: 'scanLine 1.8s ease-in-out infinite' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', color: '#fff', fontSize: 14, fontWeight: 600 }}>Analyse IA en cours…</p>
                <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Identification du document</p>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: CARAMEL, animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONFIRMING ────────────────────────────────────────────────── */}
        {phase === 'confirming' && (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 20px 140px', overflowY: 'auto' }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.1) blur(8px)', transform: 'scale(1.1)' }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360, background: 'rgba(10,12,18,0.97)', border: '1px solid rgba(196,151,106,0.2)', borderRadius: 20, overflow: 'hidden' }}>
              {previewUrl && (
                <div style={{ position: 'relative', height: 90, overflow: 'hidden' }}>
                  <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(10,12,18,0.97) 100%)' }} />
                  <div style={{ position: 'absolute', top: 10, right: 10, background: CARAMEL, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'checkPop 0.35s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
                    <CheckCircle2 size={15} color="#fff" strokeWidth={3} />
                  </div>
                </div>
              )}
              <div style={{ padding: '14px 18px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: CARAMEL, border: '1px solid rgba(196,151,106,0.3)', padding: '3px 10px', borderRadius: 20 }}>
                    {selectedFamily ? familyLabel[selectedFamily] : 'Document'} — {isVerso ? 'Verso' : 'Recto'}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  {isVerso ? 'Verso capturé' : 'Vérifiez vos informations'}
                </p>
                {!isVerso && (ocrData?.nom || ocrData?.prenom || ocrData?.dob) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 4 }}>
                    {(ocrData.prenom || ocrData.nom) && <DataRow label="Identité" value={[ocrData.prenom, ocrData.nom].filter(Boolean).join(' ')} />}
                    {ocrData.dob            && <DataRow label="Date de naissance" value={fmt(ocrData.dob)} />}
                    {ocrData.expiry         && <DataRow label="Expire le"          value={fmt(ocrData.expiry)} />}
                    {ocrData.documentNumber && <DataRow label="N° document"        value={ocrData.documentNumber} />}
                  </div>
                ) : !isVerso ? (
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, textAlign: 'center' }}>
                    Aucune donnée extraite. Le document sera vérifié manuellement.
                  </p>
                ) : (
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, textAlign: 'center' }}>
                    Verso bien enregistré.
                  </p>
                )}
                {!isVerso && (ocrData?.nom || ocrData?.prenom) && (
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
                    Ces informations sont-elles correctes ?
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FLIP ──────────────────────────────────────────────────────── */}
        {phase === 'flip' && (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 28px 160px', gap: 24 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.94)' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: CARAMEL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={13} color="#fff" strokeWidth={3} />
                </div>
                <div style={{ width: 28, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>2</span>
                </div>
              </div>
              {rectoPreview && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={rectoPreview} alt="Recto" style={{ width: 180, height: 113, objectFit: 'cover', borderRadius: 10, border: `1.5px solid rgba(196,151,106,0.5)`, boxShadow: '0 0 28px rgba(196,151,106,0.12)' }} />
                  <div style={{ position: 'absolute', top: -10, right: -10, width: 28, height: 28, borderRadius: '50%', background: CARAMEL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} color="#fff" strokeWidth={3} />
                  </div>
                </div>
              )}
              <div style={{ fontSize: 34, animation: 'rotateBounce 1.8s ease-in-out infinite', color: CARAMEL }}>↻</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: CARAMEL }}>Recto capturé</p>
                <p style={{ margin: '0 0 10px', fontFamily: BAI.fontDisplay, fontSize: 24, fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>Retournez votre document</p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 260, lineHeight: 1.65 }}>
                  Placez le <strong style={{ color: 'rgba(255,255,255,0.8)' }}>verso</strong> face à la caméra pour compléter votre dossier.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── REJECTED / ERROR ──────────────────────────────────────────── */}
        {(phase === 'rejected' || phase === 'error') && (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 28px 140px' }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '60px 24px', filter: 'brightness(0.2) saturate(0.3)' }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(155,28,28,0.2)', border: '2px solid rgba(248,113,113,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldOff size={32} color="#f87171" />
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {phase === 'error' ? 'Erreur de lecture' : 'Document non valide'}
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 300, lineHeight: 1.6 }}>{rejectReason}</p>
                {selectedFamily && (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)', maxWidth: 300, lineHeight: 1.5 }}>
                    Attendu : {familyLabel[selectedFamily]} avec photo.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SCANNING — live camera ─────────────────────────────────────── */}
        {phase === 'scanning' && (
          <>
            <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: camReady ? 1 : 0, transition: 'opacity 0.35s' }} />
            {!camReady && !camError && (
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Loader2 size={22} color={CARAMEL} style={{ animation: 'spin 0.9s linear infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Initialisation…</span>
              </div>
            )}
            {flash && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', zIndex: 5 }} />}
            <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }} />

            {/* Hint text */}
            {camReady && (
              <div style={{ position: 'absolute', bottom: 168, left: '50%', transform: 'translateX(-50%)', zIndex: 3, textAlign: 'center', width: '80%' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  {isVerso
                    ? 'Placez le verso dans le cadre puis appuyez sur le bouton'
                    : 'Centrez le document dans le cadre puis appuyez sur le bouton'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom controls */}
      {phase !== 'selecting' && (
        <div style={{ padding: '12px 20px 44px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', minHeight: 120 }}>

          {/* Shutter button (main action) */}
          {phase === 'scanning' && (
            <button
              onClick={doCapture}
              disabled={!camReady}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: camReady ? '#fff' : 'rgba(255,255,255,0.2)',
                border: `4px solid ${camReady ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                cursor: camReady ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: camReady ? '0 0 0 6px rgba(255,255,255,0.08)' : 'none',
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: camReady ? CARAMEL : 'rgba(255,255,255,0.3)' }} />
            </button>
          )}

          {/* Confirming — recto → flip to verso */}
          {showFlipBtn && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              <Btn flex secondary onClick={handleRetry}><RotateCcw size={14} /> Reprendre</Btn>
              <Btn flex primary onClick={handleRectoVerified}>Scanner le verso <ArrowRight size={13} /></Btn>
            </div>
          )}

          {/* Confirming — done */}
          {showDoneBtn && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              <Btn flex secondary onClick={handleRetry}><RotateCcw size={14} /> Reprendre</Btn>
              <Btn flex primary onClick={handleDone}>
                <CheckCircle2 size={14} />
                {isVerso ? 'Terminer' : 'Confirmer'}
                <ArrowRight size={13} />
              </Btn>
            </div>
          )}

          {/* Flip screen */}
          {phase === 'flip' && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              <Btn flex secondary onClick={handleSkipVerso}>Passer sans le verso</Btn>
              <Btn flex primary onClick={handleStartVerso}>Scanner le verso <ArrowRight size={13} /></Btn>
            </div>
          )}

          {/* Rejected / Error */}
          {(phase === 'rejected' || phase === 'error') && (
            <Btn flex primary onClick={handleRetry}><RefreshCw size={14} /> Reprendre</Btn>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin         { to { transform: rotate(360deg) } }
        @keyframes scanLine     { 0%{top:5%} 48%{top:88%} 52%{top:88%} 100%{top:5%} }
        @keyframes framePulse   { 0%,100%{border-color:rgba(196,151,106,0.35)} 50%{border-color:rgba(196,151,106,0.9);box-shadow:0 0 20px 4px rgba(196,151,106,0.2)} }
        @keyframes dotBounce    { 0%,80%,100%{transform:scale(0.7);opacity:0.45} 40%{transform:scale(1.25);opacity:1} }
        @keyframes checkPop     { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes rotateBounce { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
      `}</style>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function DataRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Btn({ children, onClick, flex = false, primary = false, secondary = false }: {
  children: React.ReactNode; onClick: () => void; flex?: boolean; primary?: boolean; secondary?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      padding: '12px 16px', borderRadius: 10,
      ...(flex ? { flex: 1 } : {}),
      border: secondary ? '1px solid rgba(255,255,255,0.18)' : 'none',
      background: primary ? CARAMEL : 'rgba(255,255,255,0.12)',
      color: '#fff', fontSize: 13, fontWeight: primary ? 700 : 500,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontFamily: BAI.fontBody,
    }}>
      {children}
    </button>
  )
}
