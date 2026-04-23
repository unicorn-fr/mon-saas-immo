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
  Loader2, QrCode, Wifi, WifiOff,
} from 'lucide-react'

// ── Styles ────────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
  borderRadius: 16, padding: 24, boxShadow: BAI.shadowMd,
}

const btn = (color: string, text = '#fff'): React.CSSProperties => ({
  background: color, color: text, border: 'none', borderRadius: 10,
  padding: '10px 20px', fontSize: 14, fontWeight: 600,
  fontFamily: BAI.fontBody, cursor: 'pointer', transition: 'opacity 0.15s',
})

const ETAT_OPTIONS: EtatElement[] = ['NEUF', 'BON', 'USAGE', 'MAUVAIS', 'NA']
const ETAT_COLORS_MAP: Record<EtatElement, string> = {
  NEUF: '#1b5e3b', BON: '#1a3270', USAGE: '#92400e', MAUVAIS: '#9b1c1c', NA: '#9e9b96',
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

  function setElement(elId: string, field: 'etat' | 'observation', value: string) {
    const elData = ((roomData[elId] ?? {}) as Record<string, unknown>)
    onUpdate({ [room.id]: { ...roomData, [elId]: { ...elData, [field]: value } } })
  }

  return (
    <div style={{ border: `1px solid ${BAI.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4"
        style={{ background: open ? BAI.bgMuted : BAI.bgSurface, border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: BAI.ink }}>{room.name}</span>
        {open ? <ChevronDown size={16} style={{ color: BAI.inkFaint }} /> : <ChevronRight size={16} style={{ color: BAI.inkFaint }} />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {room.elements.map(el => {
            const elData = ((roomData[el.id] ?? {}) as Record<string, unknown>)
            const currentEtat = (elData.etat as EtatElement) ?? el.etat
            const obs = (elData.observation as string) ?? el.observation

            return (
              <div key={el.id} style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BAI.border}` }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, marginBottom: 6 }}>{el.label}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ETAT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      disabled={locked}
                      onClick={() => setElement(el.id, 'etat', opt)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        cursor: locked ? 'default' : 'pointer', border: 'none',
                        background: currentEtat === opt ? ETAT_COLORS_MAP[opt] : BAI.bgMuted,
                        color: currentEtat === opt ? '#fff' : BAI.inkMid,
                        opacity: locked ? 0.7 : 1,
                      }}
                    >
                      {ETAT_LABELS[opt]}
                    </button>
                  ))}
                </div>
                <textarea
                  disabled={locked}
                  value={obs}
                  onChange={e => setElement(el.id, 'observation', e.target.value)}
                  placeholder="Observation…"
                  rows={2}
                  style={{
                    width: '100%', background: BAI.bgInput, border: `1px solid ${BAI.border}`,
                    borderRadius: 8, padding: '6px 10px', fontSize: 12, fontFamily: BAI.fontBody,
                    color: BAI.ink, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    opacity: locked ? 0.7 : 1,
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
  const [pinInput, setPinInput] = useState('')
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
          if (!isOwner) {
            // Tenant: show inline PIN entry instead of redirecting
            setShowPinEntry(true)
            setLoading(false)
            return
          }
          // Owner: no session yet → createSession will have created one above
          return
        }

        setSession(sess)
        setEdlData((sess.data ?? {}) as Record<string, unknown>)
        setPeerConnected(sess.status === 'ACTIVE')
        setCompleted(sess.status === 'COMPLETED')
      } catch {
        if (!isOwner) {
          // Tenant: session not joined yet or access denied → show PIN entry
          setShowPinEntry(true)
        } else {
          toast.error('Erreur lors du chargement de la session EDL')
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [contractId, user, isOwner, navigate])

  // ── Connexion SSE ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.id) return

    const cleanup = edlService.connectStream(session.id, (event) => {
      const ev = event as { type: string; patch?: Record<string, unknown>; tenantId?: string; userId?: string }

      switch (ev.type) {
        case 'TENANT_JOINED':
          setPeerConnected(true)
          toast.success('Le locataire a rejoint l\'état des lieux !')
          break
        case 'DATA_UPDATE':
          if (ev.patch) {
            setEdlData(prev => ({ ...prev, ...ev.patch }))
          }
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
  }, [session?.id])

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
    try {
      await edlService.updateData(session.id, patch)
    } catch { /* silencieux — l'UI est déjà mise à jour */ }
  }, [session?.id, completed])

  async function handleJoinByPin() {
    const pin = pinInput.trim()
    if (pin.length !== 6) { toast.error('Le code PIN doit comporter 6 chiffres.'); return }
    setJoining(true)
    try {
      const sess = await edlService.joinSession(pin)
      setSession(sess)
      setEdlData((sess.data ?? {}) as Record<string, unknown>)
      setPeerConnected(sess.status === 'ACTIVE')
      setCompleted(sess.status === 'COMPLETED')
      setShowPinEntry(false)
      toast.success('Vous avez rejoint l\'état des lieux !')
    } catch (e: any) {
      toast.error(e?.message ?? 'Code PIN invalide ou session introuvable.')
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
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur')
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

  // Tenant: no session yet — show PIN entry
  if (showPinEntry) {
    return (
      <Layout>
        <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ ...card, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <QrCode size={40} style={{ color: BAI.caramel, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 4 }}>
              État des Lieux
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, marginBottom: 8 }}>
              Rejoindre la session
            </h2>
            <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 24 }}>
              Entrez le code PIN que vous a communiqué le propriétaire, ou scannez son QR code.
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  width: 44, height: 56, background: BAI.bgMuted, border: `2px solid ${pinInput[i] ? BAI.caramel : BAI.border}`,
                  borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700, color: BAI.ink, transition: 'border-color 0.15s',
                }}>
                  {pinInput[i] ?? ''}
                </div>
              ))}
            </div>

            <input
              type="number"
              maxLength={6}
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleJoinByPin()}
              placeholder="Code à 6 chiffres"
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 18,
                textAlign: 'center', letterSpacing: '0.3em', fontWeight: 700,
                background: BAI.bgInput, border: `1px solid ${BAI.border}`,
                color: BAI.ink, outline: 'none', marginBottom: 16, boxSizing: 'border-box',
                fontFamily: BAI.fontBody,
              }}
            />

            <button
              onClick={handleJoinByPin}
              disabled={joining || pinInput.length !== 6}
              style={{ ...btn(BAI.night), width: '100%', opacity: pinInput.length !== 6 ? 0.5 : 1 }}
            >
              {joining
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Connexion…</span>
                : 'Rejoindre l\'état des lieux'
              }
            </button>

            <button
              style={{ ...btn(BAI.bgMuted, BAI.inkMid), width: '100%', marginTop: 10 }}
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

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel }}>
              État des Lieux
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(24px,5vw,36px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink }}>
              {session?.edlType === 'ENTREE' ? 'Entrée' : 'Sortie'}
            </h1>
            <p style={{ fontSize: 13, color: BAI.inkMid }}>
              {contract?.property?.title ?? 'Logement'} — {contract?.property?.address ?? ''}
            </p>
          </div>

          {/* Statut connexion */}
          <div style={{ ...card, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div className="flex items-center gap-3">
              {peerConnected
                ? <><Wifi size={18} style={{ color: '#1b5e3b' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#1b5e3b' }}>Les deux parties sont connectées</span></>
                : <><WifiOff size={18} style={{ color: BAI.inkFaint }} /><span style={{ fontSize: 13, color: BAI.inkMid }}>{isOwner ? 'En attente du locataire…' : 'En attente de connexion…'}</span></>
              }
            </div>
            {completed && (
              <div className="flex items-center gap-2">
                <Lock size={14} style={{ color: BAI.caramel }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: BAI.caramel }}>Finalisé</span>
              </div>
            )}
          </div>

          {/* QR Code + PIN (owner uniquement, si en attente) */}
          {isOwner && session?.status === 'WAITING' && !completed && (
            <div style={{ ...card, marginBottom: 24, textAlign: 'center' }}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode size={18} style={{ color: BAI.owner }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink }}>Invitez le locataire à rejoindre</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                {/* QR Code */}
                <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: `1px solid ${BAI.border}`, display: 'inline-block' }}>
                  <QRCodeSVG value={joinUrl} size={160} fgColor={BAI.night} />
                </div>

                {/* PIN */}
                <div>
                  <p style={{ fontSize: 12, color: BAI.inkFaint, marginBottom: 8 }}>Ou saisissez le code PIN</p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {(session.pin ?? '').split('').map((digit, i) => (
                      <div key={i} style={{
                        width: 40, height: 52, background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 700, color: BAI.ink, letterSpacing: 0,
                      }}>
                        {digit}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: BAI.inkFaint, marginTop: 8 }}>Le locataire se rend sur<br /><strong>bailio.fr/edl/join</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* Pièces — collaboration temps réel */}
          <div style={{ ...card, marginBottom: 24 }}>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck size={16} style={{ color: BAI.owner }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink }}>Pièces et éléments</p>
              {!peerConnected && !completed && (
                <span style={{ fontSize: 11, color: BAI.inkFaint, marginLeft: 'auto' }}>
                  {isOwner ? 'Vous pouvez commencer — le locataire verra les changements en temps réel' : 'En attente de connexion'}
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
            <div className="flex justify-end gap-3">
              <button style={btn(BAI.bgMuted, BAI.inkMid)} onClick={() => navigate(`/contracts/${contractId}`)}>
                Retour au contrat
              </button>
              <button
                style={btn(BAI.night)}
                onClick={handleComplete}
                disabled={completing}
              >
                {completing
                  ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Finalisation…</span>
                  : <span className="flex items-center gap-2"><CheckCircle size={14} /> Finaliser l'état des lieux</span>
                }
              </button>
            </div>
          )}

          {completed && (
            <div style={{ textAlign: 'center', padding: 24, background: BAI.tenantLight, borderRadius: 12, border: `1px solid ${BAI.tenantBorder}` }}>
              <CheckCircle size={32} style={{ color: BAI.tenant, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: BAI.tenant }}>État des lieux finalisé</p>
              <p style={{ fontSize: 13, color: BAI.inkMid, marginTop: 4 }}>Les données ont été enregistrées dans le contrat.</p>
              <button style={{ ...btn(BAI.night), marginTop: 16 }} onClick={() => navigate(`/contracts/${contractId}`)}>
                Retour au contrat
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
