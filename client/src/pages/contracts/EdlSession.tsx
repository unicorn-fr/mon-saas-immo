import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
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
import toast from 'react-hot-toast'
import {
  ClipboardCheck, CheckCircle, Lock, ChevronDown, ChevronRight,
  Loader2, QrCode, Wifi, WifiOff, Users,
} from 'lucide-react'

// ── Styles ────────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
  borderRadius: 16, padding: 24, boxShadow: BAI.shadowMd,
}

const btnStyle = (bg: string, color = '#fff'): React.CSSProperties => ({
  background: bg, color, border: 'none', borderRadius: 10,
  padding: '10px 20px', fontSize: 14, fontWeight: 600,
  fontFamily: BAI.fontBody, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 8,
})

const ETAT_OPTIONS: EtatElement[] = ['NEUF', 'BON', 'USAGE', 'MAUVAIS', 'NA']
const ETAT_COLORS: Record<EtatElement, string> = {
  NEUF: '#1b5e3b', BON: '#1a3270', USAGE: '#92400e', MAUVAIS: '#9b1c1c', NA: '#9e9b96',
}
const ETAT_BG: Record<EtatElement, string> = {
  NEUF: '#edf7f2', BON: '#eaf0fb', USAGE: '#fdf5ec', MAUVAIS: '#fef2f2', NA: BAI.bgMuted,
}

// ── Sous-composant : pièce collaborative ──────────────────────────────────────

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

  function setElement(elId: string, field: 'etat' | 'observation', value: string) {
    const elData = (roomData[elId] ?? {}) as Record<string, unknown>
    onUpdate({ [room.id]: { ...roomData, [elId]: { ...elData, [field]: value } } })
  }

  return (
    <div style={{ border: `1px solid ${BAI.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between"
        style={{ padding: '14px 16px', background: open ? BAI.bgMuted : BAI.bgSurface, border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontWeight: 600, fontSize: 14, color: BAI.ink }}>{room.name}</span>
          {filledCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, background: BAI.ownerLight,
              color: BAI.owner, borderRadius: 20, padding: '2px 8px',
            }}>
              {filledCount}/{room.elements.length}
            </span>
          )}
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: BAI.inkFaint }} />
          : <ChevronRight size={16} style={{ color: BAI.inkFaint }} />
        }
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', background: BAI.bgSurface }}>
          {room.elements.map((el, idx) => {
            const elData = (roomData[el.id] ?? {}) as Record<string, unknown>
            const currentEtat = (elData.etat as EtatElement) ?? el.etat
            const obs = (elData.observation as string) ?? el.observation ?? ''

            return (
              <div
                key={el.id}
                style={{
                  marginTop: 12, paddingTop: 12,
                  borderTop: idx === 0 ? `1px solid ${BAI.border}` : `1px solid ${BAI.border}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink }}>{el.label}</p>
                  {currentEtat && currentEtat !== 'NA' && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 10px',
                      background: ETAT_BG[currentEtat], color: ETAT_COLORS[currentEtat],
                    }}>
                      {ETAT_LABELS[currentEtat]}
                    </span>
                  )}
                </div>

                {/* État pills */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {ETAT_OPTIONS.map(opt => {
                    const selected = currentEtat === opt
                    return (
                      <button
                        key={opt}
                        disabled={locked}
                        onClick={() => setElement(el.id, 'etat', opt)}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          cursor: locked ? 'default' : 'pointer', fontFamily: BAI.fontBody,
                          border: selected ? 'none' : `1px solid ${BAI.border}`,
                          background: selected ? ETAT_COLORS[opt] : BAI.bgSurface,
                          color: selected ? '#fff' : BAI.inkMid,
                          transition: 'all 0.12s',
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
                    borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: BAI.fontBody,
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

// ── Composant saisie PIN (OTP-style) ─────────────────────────────────────────

function PinInput({ onJoin, joining }: { onJoin: (pin: string) => void; joining: boolean }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleInput(i: number, val: string) {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    if (d && i < 5) refs.current[i + 1]?.focus()
    if (next.every(x => x !== '')) onJoin(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; setDigits(next)
      } else if (i > 0) {
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setDigits(next)
    const focusIdx = Math.min(pasted.length, 5)
    refs.current[focusIdx]?.focus()
    if (pasted.length === 6) onJoin(pasted)
  }

  const digitStyle = (filled: boolean): React.CSSProperties => ({
    width: 48, height: 60, textAlign: 'center', fontSize: 26, fontWeight: 700,
    fontFamily: BAI.fontBody, color: BAI.ink, outline: 'none',
    background: filled ? BAI.bgSurface : BAI.bgMuted,
    border: `2px solid ${filled ? BAI.caramel : BAI.border}`,
    borderRadius: 12, transition: 'border-color 0.15s, background 0.15s',
    caretColor: BAI.caramel,
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            autoFocus={i === 0}
            onChange={e => handleInput(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            style={digitStyle(!!d)}
          />
        ))}
      </div>
      <button
        onClick={() => { if (digits.every(x => x)) onJoin(digits.join('')) }}
        disabled={joining || !digits.every(x => x)}
        style={{ ...btnStyle(BAI.night), width: '100%', justifyContent: 'center', opacity: digits.every(x => x) ? 1 : 0.4 }}
      >
        {joining
          ? <><Loader2 size={15} className="animate-spin" /> Connexion…</>
          : 'Rejoindre l\'état des lieux'
        }
      </button>
    </div>
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
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showPinEntry, setShowPinEntry] = useState(false)
  const [joining, setJoining] = useState(false)
  const sseCleanupRef = useRef<(() => void) | null>(null)

  const isOwner = user?.role === 'OWNER'

  // ── Chargement initial ────────────────────────────────────────────────────

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
        if (!isOwner) {
          setShowPinEntry(true)
        } else {
          toast.error('Erreur lors du chargement de la session EDL')
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [contractId, user, isOwner])

  // ── Connexion SSE ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.id) return

    const cleanup = edlService.connectStream(session.id, (event) => {
      const ev = event as { type: string; patch?: Record<string, unknown>; tenantId?: string }

      switch (ev.type) {
        case 'TENANT_JOINED':
          setPeerConnected(true)
          // Met à jour le statut local de la session pour masquer le QR/PIN
          setSession(prev => prev ? { ...prev, status: 'ACTIVE' } : prev)
          if (isOwner) toast.success('Le locataire a rejoint — vous pouvez commencer !')
          break
        case 'DATA_UPDATE':
          if (ev.patch) setEdlData(prev => ({ ...prev, ...ev.patch }))
          break
        case 'SESSION_COMPLETED':
          setCompleted(true)
          toast.success('État des lieux finalisé !')
          break
        case 'PEER_DISCONNECTED':
          setPeerConnected(false)
          break
      }
    })

    sseCleanupRef.current = cleanup
    return () => cleanup()
  }, [session?.id, isOwner])

  // ── Initialisation des pièces ─────────────────────────────────────────────

  useEffect(() => {
    if (!contract) return
    try {
      const template = prefillEDLFromContract('ENTREE', contract)
      setRooms(template.rooms)
    } catch {
      setRooms([])
    }
  }, [contract])

  // ── Mise à jour collaborative ─────────────────────────────────────────────

  const handleUpdate = useCallback(async (patch: Record<string, unknown>) => {
    if (!session?.id || completed) return
    setEdlData(prev => ({ ...prev, ...patch }))
    try { await edlService.updateData(session.id, patch) } catch { /* silencieux */ }
  }, [session?.id, completed])

  async function handleJoinByPin(pin: string) {
    setJoining(true)
    try {
      const sess = await edlService.joinSession(pin)
      setSession(sess)
      setEdlData((sess.data ?? {}) as Record<string, unknown>)
      setPeerConnected(true)
      setCompleted(sess.status === 'COMPLETED')
      setShowPinEntry(false)
      toast.success('Connecté — état des lieux en cours !')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Code PIN invalide ou session introuvable.'
      toast.error(msg)
    } finally {
      setJoining(false)
    }
  }

  async function handleComplete() {
    if (!session?.id) return
    setCompleting(true)
    try {
      await edlService.completeSession(session.id)
      setCompleted(true)
      toast.success('État des lieux finalisé et enregistré !')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      toast.error(msg)
    } finally {
      setCompleting(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen" style={{ background: BAI.bgBase }}>
          <Loader2 size={32} className="animate-spin" style={{ color: BAI.inkFaint }} />
        </div>
      </Layout>
    )
  }

  // Écran PIN pour le locataire
  if (showPinEntry) {
    return (
      <Layout>
        <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ ...card, maxWidth: 440, width: '100%' }}>
            {/* En-tête */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: BAI.bgMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <QrCode size={26} style={{ color: BAI.caramel }} />
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 4 }}>
                État des Lieux
              </p>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, marginBottom: 8 }}>
                Rejoindre la session
              </h2>
              <p style={{ fontSize: 13, color: BAI.inkMid, lineHeight: 1.5 }}>
                Entrez le code à 6 chiffres affiché<br />sur l'écran du propriétaire.
              </p>
            </div>

            {/* Saisie PIN */}
            <PinInput onJoin={handleJoinByPin} joining={joining} />

            <button
              style={{ ...btnStyle(BAI.bgMuted, BAI.inkMid), width: '100%', justifyContent: 'center', marginTop: 12 }}
              onClick={() => navigate(`/contracts/${contractId}`)}
            >
              Retour au contrat
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const joinUrl = `${window.location.origin}/edl/join?pin=${session?.pin ?? ''}`
  const sessionActive = session?.status === 'ACTIVE' || peerConnected

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 2 }}>
              État des Lieux · {session?.edlType === 'ENTREE' ? 'Entrée' : 'Sortie'}
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(24px,5vw,34px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, marginBottom: 4 }}>
              {contract?.property?.title ?? 'Logement'}
            </h1>
            <p style={{ fontSize: 13, color: BAI.inkMid }}>{contract?.property?.address ?? ''}</p>
          </div>

          {/* Bandeau statut connexion */}
          <div style={{
            marginBottom: 20, borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            background: completed ? BAI.tenantLight : sessionActive ? '#f0faf5' : BAI.bgMuted,
            border: `1px solid ${completed ? BAI.tenantBorder : sessionActive ? '#9fd4ba' : BAI.border}`,
          }}>
            <div className="flex items-center gap-2">
              {completed
                ? <><Lock size={16} style={{ color: BAI.tenant }} /><span style={{ fontSize: 13, fontWeight: 600, color: BAI.tenant }}>État des lieux finalisé</span></>
                : sessionActive
                ? <><Wifi size={16} style={{ color: '#1b5e3b' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#1b5e3b' }}>Les deux parties sont connectées</span></>
                : <><WifiOff size={16} style={{ color: BAI.inkFaint }} /><span style={{ fontSize: 13, color: BAI.inkMid }}>En attente du locataire…</span></>
              }
            </div>
            {sessionActive && !completed && (
              <div className="flex items-center gap-1" style={{ fontSize: 12, color: BAI.inkFaint }}>
                <Users size={13} />
                <span>Collaboration active</span>
              </div>
            )}
          </div>

          {/* QR Code + PIN — propriétaire en attente du locataire */}
          {isOwner && !sessionActive && !completed && session?.pin && (
            <div style={{ ...card, marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, marginBottom: 4 }}>
                Invitez le locataire à rejoindre
              </p>
              <p style={{ fontSize: 12, color: BAI.inkMid, marginBottom: 20 }}>
                Le locataire scanne le QR code ou saisit le code PIN sur son appareil.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-10">
                {/* QR Code */}
                <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: `1px solid ${BAI.border}`, flexShrink: 0 }}>
                  <QRCodeSVG value={joinUrl} size={148} fgColor={BAI.night} />
                </div>

                {/* PIN */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: BAI.inkFaint, marginBottom: 12 }}>
                    Code PIN
                  </p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                    {session.pin.split('').map((digit, i) => (
                      <div key={i} style={{
                        width: 42, height: 54, background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 700, color: BAI.ink,
                      }}>
                        {digit}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: BAI.inkFaint }}>
                    Le locataire se connecte sur<br />
                    <strong style={{ color: BAI.inkMid }}>son espace Bailio → État des lieux</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pièces — collaboration */}
          <div style={{ ...card, marginBottom: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} style={{ color: BAI.owner }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink }}>Pièces et éléments</p>
              </div>
              {!completed && (
                <span style={{ fontSize: 11, color: BAI.inkFaint }}>
                  {sessionActive
                    ? 'Modifications visibles par les deux parties en temps réel'
                    : isOwner ? 'Commencez — le locataire verra les changements en rejoignant' : ''}
                </span>
              )}
            </div>

            {rooms.length === 0 ? (
              <p style={{ fontSize: 13, color: BAI.inkFaint, textAlign: 'center', padding: 24 }}>
                Aucune pièce définie dans le modèle
              </p>
            ) : (
              rooms.map(room => (
                <RoomPanel
                  key={room.id}
                  room={room}
                  edlData={edlData}
                  onUpdate={handleUpdate}
                  locked={completed}
                />
              ))
            )}
          </div>

          {/* Actions */}
          {!completed && (
            <div className="flex justify-between items-center">
              <button style={btnStyle(BAI.bgMuted, BAI.inkMid)} onClick={() => navigate(`/contracts/${contractId}`)}>
                Retour
              </button>
              <button
                style={btnStyle(BAI.night)}
                onClick={handleComplete}
                disabled={completing}
              >
                {completing
                  ? <><Loader2 size={14} className="animate-spin" /> Finalisation…</>
                  : <><CheckCircle size={14} /> Finaliser l'état des lieux</>
                }
              </button>
            </div>
          )}

          {/* Fin */}
          {completed && (
            <div style={{ textAlign: 'center', padding: 32, background: BAI.tenantLight, borderRadius: 14, border: `1px solid ${BAI.tenantBorder}` }}>
              <CheckCircle size={36} style={{ color: BAI.tenant, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: BAI.tenant, marginBottom: 4 }}>
                État des lieux signé et enregistré
              </p>
              <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 20 }}>
                Les données sont archivées dans le contrat.
              </p>
              <button style={btnStyle(BAI.night)} onClick={() => navigate(`/contracts/${contractId}`)}>
                Retour au contrat
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
