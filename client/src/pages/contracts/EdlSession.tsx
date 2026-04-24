import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import jsQR from 'jsqr'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { edlService, EdlSession as EdlSessionType } from '../../services/edl.service'
import {
  prefillEDLFromContract,
  ETAT_LABELS,
  EtatElement,
  EDLRoom,
} from '../../data/etatDesLieuxTemplate'
import { useContractStore } from '../../store/contractStore'
import { SignaturePad } from '../../components/contract/SignaturePad'
import toast from 'react-hot-toast'
import {
  ClipboardCheck, CheckCircle, Lock, ChevronDown, ChevronRight,
  Loader2, QrCode, Wifi, WifiOff, Users, Camera, ArrowLeft, X,
  AlertTriangle, PenTool,
} from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────────

const ETAT_OPTIONS: EtatElement[] = ['NEUF', 'BON', 'USAGE', 'MAUVAIS', 'NA']
const ETAT_COLORS: Record<EtatElement, string> = {
  NEUF: '#1b5e3b', BON: '#1a3270', USAGE: '#92400e', MAUVAIS: '#9b1c1c', NA: '#9e9b96',
}
const ETAT_BG: Record<EtatElement, string> = {
  NEUF: '#edf7f2', BON: '#eaf0fb', USAGE: '#fdf5ec', MAUVAIS: '#fef2f2', NA: BAI.bgMuted,
}

// ── Styles helper ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
  borderRadius: 14, padding: '16px', boxShadow: BAI.shadowMd,
}

const btnBase = (bg: string, color = '#fff'): React.CSSProperties => ({
  background: bg, color, border: 'none', borderRadius: 10,
  padding: '12px 18px', fontSize: 14, fontWeight: 600,
  fontFamily: BAI.fontBody, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  minHeight: 44, touchAction: 'manipulation',
})

// ── Scanner QR live ───────────────────────────────────────────────────────────

function QrScannerOverlay({ onScan, onClose }: { onScan: (pin: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [camError, setCamError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    let alive = true

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        const video = videoRef.current!
        video.srcObject = stream
        video.play()
        setScanning(true)

        timerRef.current = setInterval(() => {
          if (!alive || !videoRef.current || !canvasRef.current) return
          const v = videoRef.current
          if (v.readyState < v.HAVE_ENOUGH_DATA) return
          const canvas = canvasRef.current
          canvas.width = v.videoWidth
          canvas.height = v.videoHeight
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!
          ctx.drawImage(v, 0, 0)
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
          if (code?.data) {
            const match = code.data.match(/[?&]pin=(\d{6})/)
            if (match) {
              stop()
              onScan(match[1])
            }
          }
        }, 200)
      } catch {
        setCamError('Impossible d\'accéder à la caméra.\nVérifiez les permissions dans votre navigateur.')
      }
    }

    function stop() {
      alive = false
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }

    start()
    return stop
  }, [onScan])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000', display: 'flex', flexDirection: 'column',
    }}>
      {/* Vidéo */}
      <video
        ref={videoRef}
        playsInline muted autoPlay
        style={{ flex: 1, width: '100%', objectFit: 'cover', display: camError ? 'none' : 'block' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Overlay de scan */}
      {!camError && scanning && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {/* Cadre de visée */}
          <div style={{ position: 'relative', width: 240, height: 240 }}>
            {/* 4 coins */}
            {[
              { top: 0, left: 0, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', borderRadius: '12px 0 0 0' },
              { top: 0, right: 0, borderTop: '4px solid #fff', borderRight: '4px solid #fff', borderRadius: '0 12px 0 0' },
              { bottom: 0, left: 0, borderBottom: '4px solid #fff', borderLeft: '4px solid #fff', borderRadius: '0 0 0 12px' },
              { bottom: 0, right: 0, borderBottom: '4px solid #fff', borderRight: '4px solid #fff', borderRadius: '0 0 12px 0' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 32, height: 32, ...s }} />
            ))}
            {/* Ligne de scan animée */}
            <div style={{
              position: 'absolute', left: 8, right: 8, height: 2,
              background: BAI.caramel,
              animation: 'edl-scan 1.6s ease-in-out infinite',
            }} />
          </div>
          <p style={{
            marginTop: 24, color: '#fff', fontSize: 14, fontWeight: 500,
            fontFamily: BAI.fontBody, textAlign: 'center',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            Pointez la caméra vers le QR code du propriétaire
          </p>
        </div>
      )}

      {/* Erreur caméra */}
      {camError && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 32, textAlign: 'center',
        }}>
          <Camera size={48} style={{ color: '#666', marginBottom: 16 }} />
          <p style={{ color: '#fff', fontSize: 14, fontFamily: BAI.fontBody, whiteSpace: 'pre-line', marginBottom: 8 }}>
            {camError}
          </p>
          <p style={{ color: '#888', fontSize: 12, fontFamily: BAI.fontBody }}>
            Saisissez le code PIN manuellement.
          </p>
        </div>
      )}

      {/* Bouton fermer */}
      <button
        onClick={() => {
          if (timerRef.current) clearInterval(timerRef.current)
          streamRef.current?.getTracks().forEach(t => t.stop())
          onClose()
        }}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10,
        }}
      >
        <X size={20} style={{ color: '#fff' }} />
      </button>

      {/* CSS animation inline */}
      <style>{`
        @keyframes edl-scan {
          0%   { top: 8px; opacity: 1; }
          50%  { top: calc(100% - 10px); opacity: 0.8; }
          100% { top: 8px; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Pièce collaborative ───────────────────────────────────────────────────────

function RoomPanel({
  room, edlData, onUpdate, locked,
}: {
  room: EDLRoom
  edlData: Record<string, unknown>
  onUpdate: (patch: Record<string, unknown>) => void
  locked: boolean
}) {
  const [open, setOpen] = useState(false)
  const roomData = (edlData[room.id] ?? {}) as Record<string, unknown>

  const filledCount = room.elements.filter(el => {
    const d = (roomData[el.id] ?? {}) as Record<string, unknown>
    return d.etat && d.etat !== 'NA'
  }).length
  const allFilled = filledCount === room.elements.length

  function setElement(elId: string, field: 'etat' | 'observation', value: string) {
    // Inclure toute la pièce dans le patch (pas seulement l'élément modifié)
    const elData = (roomData[elId] ?? {}) as Record<string, unknown>
    onUpdate({
      [room.id]: { ...roomData, [elId]: { ...elData, [field]: value } },
    })
  }

  return (
    <div style={{ border: `1px solid ${BAI.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 6 }}>
      {/* En-tête pièce */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', minHeight: 52,
          background: open ? BAI.bgMuted : BAI.bgSurface, border: 'none', cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: BAI.ink }}>{room.name}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 8px',
            background: allFilled ? BAI.tenantLight : filledCount > 0 ? BAI.ownerLight : BAI.bgMuted,
            color: allFilled ? BAI.tenant : filledCount > 0 ? BAI.owner : BAI.inkFaint,
          }}>
            {filledCount}/{room.elements.length}
          </span>
        </div>
        {open
          ? <ChevronDown size={18} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
          : <ChevronRight size={18} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
        }
      </button>

      {/* Éléments */}
      {open && (
        <div style={{ background: BAI.bgSurface }}>
          {room.elements.map((el, idx) => {
            const elData = (roomData[el.id] ?? {}) as Record<string, unknown>
            const currentEtat = (elData.etat as EtatElement) ?? el.etat
            const obs = (elData.observation as string) ?? el.observation ?? ''

            return (
              <div
                key={el.id}
                style={{
                  padding: '14px 16px',
                  borderTop: `1px solid ${BAI.border}`,
                  background: idx % 2 === 0 ? BAI.bgSurface : '#fdfcfa',
                }}
              >
                {/* Label + badge état actuel */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink }}>{el.label}</p>
                  {currentEtat && currentEtat !== 'NA' && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
                      background: ETAT_BG[currentEtat], color: ETAT_COLORS[currentEtat],
                    }}>
                      {ETAT_LABELS[currentEtat]}
                    </span>
                  )}
                </div>

                {/* Pills état — grid pour mobile */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 6, marginBottom: 10,
                }}>
                  {ETAT_OPTIONS.map(opt => {
                    const selected = currentEtat === opt
                    return (
                      <button
                        key={opt}
                        disabled={locked}
                        onClick={() => setElement(el.id, 'etat', opt)}
                        style={{
                          minHeight: 44, padding: '6px 4px',
                          borderRadius: 10, fontSize: 11, fontWeight: 700,
                          cursor: locked ? 'default' : 'pointer',
                          fontFamily: BAI.fontBody, border: 'none',
                          background: selected ? ETAT_COLORS[opt] : ETAT_BG[opt],
                          color: selected ? '#fff' : ETAT_COLORS[opt],
                          transition: 'all 0.12s', touchAction: 'manipulation',
                          boxShadow: selected ? `0 2px 6px ${ETAT_COLORS[opt]}44` : 'none',
                        }}
                      >
                        {ETAT_LABELS[opt]}
                      </button>
                    )
                  })}
                </div>

                {/* Observation */}
                <textarea
                  disabled={locked}
                  value={obs}
                  onChange={e => setElement(el.id, 'observation', e.target.value)}
                  placeholder="Observation (optionnel)…"
                  rows={2}
                  style={{
                    width: '100%', background: BAI.bgInput, border: `1px solid ${BAI.border}`,
                    borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: BAI.fontBody,
                    color: BAI.ink, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    opacity: locked ? 0.6 : 1,
                  }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Saisie PIN OTP ────────────────────────────────────────────────────────────

function PinInput({ onJoin, joining }: { onJoin: (pin: string) => void; joining: boolean }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [showScanner, setShowScanner] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleInput(i: number, val: string) {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = d; setDigits(next)
    if (d && i < 5) refs.current[i + 1]?.focus()
    if (next.every(x => x !== '')) onJoin(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; setDigits(n) }
      else if (i > 0) refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setDigits(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) onJoin(pasted)
  }

  function handleScanned(pin: string) {
    setShowScanner(false)
    setDigits(pin.split(''))
    onJoin(pin)
  }

  const complete = digits.every(x => x)

  return (
    <>
      {/* Scanner plein écran */}
      {showScanner && (
        <QrScannerOverlay
          onScan={handleScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div>
        {/* Cases OTP */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el }}
              type="text" inputMode="numeric" maxLength={1} value={d}
              autoFocus={i === 0}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={e => e.target.select()}
              style={{
                width: 'clamp(40px, 13vw, 52px)', height: 60, textAlign: 'center',
                fontSize: 26, fontWeight: 700, fontFamily: BAI.fontBody, color: BAI.ink,
                outline: 'none', caretColor: BAI.caramel,
                background: d ? BAI.bgSurface : BAI.bgMuted,
                border: `2px solid ${d ? BAI.caramel : BAI.border}`,
                borderRadius: 12, transition: 'border-color 0.15s, background 0.15s',
              }}
            />
          ))}
        </div>

        {/* Rejoindre */}
        <button
          onClick={() => { if (complete) onJoin(digits.join('')) }}
          disabled={joining || !complete}
          style={{ ...btnBase(BAI.night), width: '100%', opacity: complete ? 1 : 0.35, marginBottom: 12 }}
        >
          {joining ? <><Loader2 size={15} className="animate-spin" /> Connexion…</> : 'Rejoindre l\'état des lieux'}
        </button>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: BAI.border }} />
          <span style={{ fontSize: 11, color: BAI.inkFaint }}>ou</span>
          <div style={{ flex: 1, height: 1, background: BAI.border }} />
        </div>

        {/* Scanner live */}
        <button
          onClick={() => setShowScanner(true)}
          style={{ ...btnBase(BAI.bgMuted, BAI.ink), width: '100%', border: `1px solid ${BAI.border}` }}
        >
          <Camera size={16} />
          Scanner le QR code avec la caméra
        </button>
        <p style={{ fontSize: 11, color: BAI.inkFaint, textAlign: 'center', marginTop: 8 }}>
          Ouvre la caméra directement dans le navigateur
        </p>
      </div>
    </>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function EdlSessionPage() {
  const { contractId } = useParams<{ contractId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentContract: contract, fetchContractById } = useContractStore()

  const [session, setSession] = useState<EdlSessionType | null>(null)
  const [edlData, setEdlData] = useState<Record<string, unknown>>({})
  const [rooms, setRooms] = useState<EDLRoom[]>([])
  const [peerConnected, setPeerConnected] = useState(false)
  const [peerLeft, setPeerLeft] = useState(false)        // pair a quitté la session
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showPinEntry, setShowPinEntry] = useState(false)
  const [joining, setJoining] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)  // modale "Êtes-vous sûr ?"
  const [showSignature, setShowSignature] = useState(false) // signature pad

  const isOwner = user?.role === 'OWNER'

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!contractId) return
    fetchContractById(contractId)
  }, [contractId, fetchContractById])

  useEffect(() => {
    if (!contractId || !user) return
    async function init() {
      setLoading(true)
      try {
        let sess: EdlSessionType | null = null
        if (isOwner) {
          sess = await edlService.createSession(contractId!, 'ENTREE')
        } else {
          sess = await edlService.getSessionByContract(contractId!)
        }
        if (!sess) {
          setShowPinEntry(true)
          setLoading(false)
          return
        }
        setSession(sess)
        setEdlData((sess.data ?? {}) as Record<string, unknown>)
        setPeerConnected(sess.status === 'ACTIVE')
        setCompleted(sess.status === 'COMPLETED')
      } catch {
        if (!isOwner) setShowPinEntry(true)
        else toast.error('Erreur chargement session')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [contractId, user, isOwner])

  // ── SSE temps réel ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.id) return
    setSyncError(false)

    const cleanup = edlService.connectStream(session.id, (event) => {
      const ev = event as { type: string; patch?: Record<string, unknown>; tenantId?: string }

      if (ev.type === 'CONNECTED') {
        setSyncError(false)
        return
      }

      if (ev.type === 'TENANT_JOINED') {
        setPeerConnected(true)
        setSession(prev => prev ? { ...prev, status: 'ACTIVE' } : prev)
        if (isOwner) toast.success('Locataire connecté — vous pouvez commencer !')
        return
      }

      if (ev.type === 'DATA_UPDATE' && ev.patch) {
        // Merge de niveau 1 — chaque room est remplacée en entier (le patch contient la room complète)
        setEdlData(prev => ({ ...prev, ...ev.patch }))
        return
      }

      if (ev.type === 'SESSION_COMPLETED') {
        setCompleted(true)
        toast.success('État des lieux finalisé !')
        return
      }

      if (ev.type === 'PEER_DISCONNECTED') {
        setPeerConnected(false)
        setPeerLeft(true)
        toast('L\'autre partie a quitté la session. La session est verrouillée.', { icon: '🔒', duration: 6000 })
        return
      }
    })

    // Détecter si le SSE ne répond plus
    const healthTimer = setTimeout(() => setSyncError(true), 10000)

    return () => { cleanup(); clearTimeout(healthTimer) }
  }, [session?.id, isOwner])

  // ── Pièces depuis template ────────────────────────────────────────────────

  useEffect(() => {
    if (!contract) return
    try {
      const template = prefillEDLFromContract('ENTREE', contract)
      setRooms(template.rooms)
    } catch { setRooms([]) }
  }, [contract])

  // ── Mise à jour collaborative ─────────────────────────────────────────────

  const handleUpdate = useCallback(async (patch: Record<string, unknown>) => {
    if (!session?.id || completed) return
    // Mise à jour locale immédiate (optimistic update)
    setEdlData(prev => ({ ...prev, ...patch }))
    try {
      await edlService.updateData(session.id, patch)
    } catch (e) {
      // Si ça échoue côté serveur, on log mais on ne revient pas en arrière
      console.error('[EDL] updateData error:', e)
      const msg = e instanceof Error ? e.message : 'Erreur de synchronisation'
      toast.error(msg, { duration: 3000 })
    }
  }, [session?.id, completed])

  async function handleJoinByPin(pin: string) {
    setJoining(true)
    try {
      const sess = await edlService.joinSession(pin)
      setSession(sess)
      // Charger les données existantes de la session (owner peut avoir déjà rempli)
      setEdlData((sess.data ?? {}) as Record<string, unknown>)
      setPeerConnected(true)
      setCompleted(sess.status === 'COMPLETED')
      setShowPinEntry(false)
      toast.success('Connecté — état des lieux en cours !')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Code PIN invalide.')
    } finally {
      setJoining(false)
    }
  }

  // Étape 1 : clic "Terminer" → confirmation
  function handleRequestComplete() {
    setShowConfirm(true)
  }

  // Étape 2 : confirmation → signature
  function handleConfirmComplete() {
    setShowConfirm(false)
    setShowSignature(true)
  }

  // Étape 3 : signature → appel API + finalisation
  async function handleSignAndComplete(_signatureBase64: string) {
    if (!session?.id) return
    setShowSignature(false)
    setCompleting(true)
    try {
      await edlService.completeSession(session.id)
      setCompleted(true)
      toast.success('État des lieux signé et enregistré !')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la finalisation')
    } finally {
      setCompleting(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen" style={{ background: BAI.bgBase }}>
        <Loader2 size={32} className="animate-spin" style={{ color: BAI.inkFaint }} />
      </div>
    </Layout>
  )

  // Écran PIN locataire
  if (showPinEntry) return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ ...card, maxWidth: 440, width: '100%', padding: 'clamp(20px,5vw,36px)' }}>
          {/* Retour */}
          <button
            onClick={() => navigate(`/contracts/${contractId}`)}
            style={{ ...btnBase(BAI.bgMuted, BAI.inkMid), marginBottom: 20, padding: '8px 14px', fontSize: 13 }}
          >
            <ArrowLeft size={14} /> Retour
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: BAI.bgMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <QrCode size={26} style={{ color: BAI.caramel }} />
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 4 }}>
              État des Lieux
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(22px,5vw,28px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, marginBottom: 8 }}>
              Rejoindre la session
            </h2>
            <p style={{ fontSize: 13, color: BAI.inkMid, lineHeight: 1.5 }}>
              Tapez les 6 chiffres affichés sur l'écran du propriétaire,<br />ou scannez le QR code.
            </p>
          </div>

          <PinInput onJoin={handleJoinByPin} joining={joining} />
        </div>
      </div>
    </Layout>
  )

  const joinUrl = `${window.location.origin}/edl/join?pin=${session?.pin ?? ''}`
  const sessionActive = session?.status === 'ACTIVE' || peerConnected
  // Verrouillé si : finalisé OU pair a quitté
  const locked = completed || peerLeft

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 'clamp(12px,4vw,32px)' }}>

          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => navigate(`/contracts/${contractId}`)}
              style={{ ...btnBase(BAI.bgMuted, BAI.inkMid), padding: '8px 14px', fontSize: 12, marginBottom: 12 }}
            >
              <ArrowLeft size={13} /> Retour au contrat
            </button>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 2 }}>
              État des Lieux · {session?.edlType === 'ENTREE' ? 'Entrée' : 'Sortie'}
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(20px,5vw,32px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, marginBottom: 2 }}>
              {contract?.property?.title ?? 'Logement'}
            </h1>
            <p style={{ fontSize: 12, color: BAI.inkMid }}>{contract?.property?.address ?? ''}</p>
          </div>

          {/* Bandeau statut */}
          <div style={{
            marginBottom: 14, borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
            background: completed ? BAI.tenantLight : peerLeft ? BAI.errorLight : sessionActive ? '#f0faf5' : syncError ? '#fef2f2' : BAI.bgMuted,
            border: `1px solid ${completed ? BAI.tenantBorder : peerLeft ? '#fca5a5' : sessionActive ? '#9fd4ba' : syncError ? '#fca5a5' : BAI.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {completed
                ? <><Lock size={15} style={{ color: BAI.tenant }} /><span style={{ fontSize: 13, fontWeight: 600, color: BAI.tenant }}>État des lieux finalisé</span></>
                : peerLeft
                ? <><Lock size={15} style={{ color: BAI.error }} /><span style={{ fontSize: 13, fontWeight: 600, color: BAI.error }}>L'autre partie a quitté — session verrouillée</span></>
                : syncError
                ? <><WifiOff size={15} style={{ color: BAI.error }} /><span style={{ fontSize: 13, color: BAI.error }}>Connexion perdue — rechargez la page</span></>
                : sessionActive
                ? <><Wifi size={15} style={{ color: '#1b5e3b' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#1b5e3b' }}>Les deux parties sont connectées — en temps réel</span></>
                : <><WifiOff size={15} style={{ color: BAI.inkFaint }} /><span style={{ fontSize: 13, color: BAI.inkMid }}>En attente du locataire…</span></>
              }
            </div>
            {sessionActive && !completed && !peerLeft && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: BAI.inkFaint }}>
                <Users size={13} />
                <span>Synchronisé</span>
              </div>
            )}
          </div>

          {/* QR Code + PIN — propriétaire en attente */}
          {isOwner && !sessionActive && !completed && session?.pin && (
            <div style={{ ...card, marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, marginBottom: 4 }}>
                Invitez le locataire à rejoindre
              </p>
              <p style={{ fontSize: 12, color: BAI.inkMid, marginBottom: 18 }}>
                Le locataire ouvre son espace Bailio → État des lieux, puis entre ce code.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                {/* QR Code */}
                <div style={{ padding: 14, background: '#fff', borderRadius: 12, border: `1px solid ${BAI.border}` }}>
                  <QRCodeSVG value={joinUrl} size={140} fgColor={BAI.night} />
                </div>

                {/* PIN */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: BAI.inkFaint, marginBottom: 10 }}>Code PIN</p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {session.pin.split('').map((digit, i) => (
                      <div key={i} style={{
                        width: 44, height: 56, background: BAI.bgMuted, border: `2px solid ${BAI.border}`,
                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 700, color: BAI.ink,
                      }}>
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pièces */}
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardCheck size={16} style={{ color: BAI.owner }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink }}>Pièces et éléments</p>
              </div>
              {!completed && (
                <p style={{ fontSize: 11, color: BAI.inkFaint, textAlign: 'right' }}>
                  {sessionActive
                    ? '← modifications visibles par les deux parties'
                    : isOwner ? 'Commencez — le locataire verra en rejoignant' : ''
                  }
                </p>
              )}
            </div>

            {rooms.length === 0
              ? <p style={{ fontSize: 13, color: BAI.inkFaint, textAlign: 'center', padding: '24px 0' }}>Aucune pièce définie</p>
              : rooms.map(room => (
                <RoomPanel
                  key={room.id}
                  room={room}
                  edlData={edlData}
                  onUpdate={handleUpdate}
                  locked={locked}
                />
              ))
            }
          </div>

          {/* Actions — bouton Terminer */}
          {!completed && !peerLeft && sessionActive && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 32 }}>
              <button
                style={btnBase(BAI.night)}
                onClick={handleRequestComplete}
                disabled={completing}
              >
                {completing
                  ? <><Loader2 size={14} className="animate-spin" /> Finalisation…</>
                  : <><CheckCircle size={14} /> Terminer l'état des lieux</>
                }
              </button>
            </div>
          )}

          {/* Session verrouillée — pair parti */}
          {peerLeft && !completed && (
            <div style={{ textAlign: 'center', padding: '24px 20px', background: BAI.errorLight, borderRadius: 14, border: `1px solid #fca5a5`, marginBottom: 32 }}>
              <Lock size={28} style={{ color: BAI.error, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: BAI.error, marginBottom: 4 }}>Session verrouillée</p>
              <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 18 }}>L'autre partie a quitté la session. Les données sont sauvegardées.</p>
              <button style={btnBase(BAI.night)} onClick={() => navigate(`/contracts/${contractId}`)}>
                Retour au contrat
              </button>
            </div>
          )}

          {/* Finalisé */}
          {completed && (
            <div style={{ textAlign: 'center', padding: '28px 20px', background: BAI.tenantLight, borderRadius: 14, border: `1px solid ${BAI.tenantBorder}`, marginBottom: 32 }}>
              <CheckCircle size={36} style={{ color: BAI.tenant, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: BAI.tenant, marginBottom: 4 }}>État des lieux signé et enregistré</p>
              <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 18 }}>Les données sont archivées dans le contrat.</p>
              <button style={btnBase(BAI.night)} onClick={() => navigate(`/contracts/${contractId}`)}>
                Retour au contrat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modale confirmation "Êtes-vous sûr ?" ── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(13,12,10,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: BAI.bgSurface, borderRadius: 16, padding: 28,
            maxWidth: 420, width: '100%', boxShadow: '0 8px 40px rgba(13,12,10,0.2)',
            fontFamily: BAI.fontBody,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: '#fdf5ec', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={22} style={{ color: BAI.caramel }} />
              </div>
              <div>
                <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 20, color: BAI.ink, margin: 0 }}>
                  Terminer l'état des lieux ?
                </h3>
                <p style={{ fontSize: 12, color: BAI.inkFaint, margin: 0 }}>Cette action est irréversible</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 24, lineHeight: 1.6 }}>
              En confirmant, vous allez signer l'état des lieux. Les deux parties ne pourront plus modifier les données.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ ...btnBase(BAI.bgMuted, BAI.inkMid), padding: '10px 18px', fontSize: 13 }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmComplete}
                style={{ ...btnBase(BAI.night), padding: '10px 18px', fontSize: 13 }}
              >
                <PenTool size={14} /> Oui, signer maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pad de signature ── */}
      <SignaturePad
        isOpen={showSignature}
        onClose={() => setShowSignature(false)}
        onConfirm={handleSignAndComplete}
        signerName={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
      />
    </Layout>
  )
}
