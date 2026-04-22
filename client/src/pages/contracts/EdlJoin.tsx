import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { edlService } from '../../services/edl.service'
import toast from 'react-hot-toast'
import { Key, Loader2, ClipboardCheck } from 'lucide-react'

export default function EdlJoin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [pin, setPin] = useState(searchParams.get('pin') ?? '')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Si PIN dans l'URL, joindre automatiquement
    const urlPin = searchParams.get('pin')
    if (urlPin && urlPin.length === 6) {
      handleJoin(urlPin)
    }
  }, []) // eslint-disable-line

  async function handleJoin(pinToJoin = pin) {
    if (pinToJoin.length !== 6) {
      toast.error('Le code PIN doit contenir 6 chiffres')
      return
    }
    if (!user) {
      toast.error('Vous devez être connecté pour rejoindre un état des lieux')
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      const session = await edlService.joinSession(pinToJoin)
      toast.success('Connecté ! L\'état des lieux commence.')
      navigate(`/contracts/${session.contractId}/edl/session`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Code PIN invalide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div
        className="flex items-center justify-center min-h-screen px-4"
        style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
      >
        <div style={{
          background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 20,
          padding: 'clamp(24px,6vw,48px)', maxWidth: 420, width: '100%',
          boxShadow: BAI.shadowLg,
        }}>
          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: BAI.tenantLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <ClipboardCheck size={24} style={{ color: BAI.tenant }} />
          </div>

          {/* Header */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, textAlign: 'center', marginBottom: 4 }}>
            État des Lieux
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, textAlign: 'center', marginBottom: 8 }}>
            Rejoindre la session
          </h1>
          <p style={{ fontSize: 13, color: BAI.inkMid, textAlign: 'center', marginBottom: 32 }}>
            Saisissez le code PIN affiché sur l'écran du propriétaire
          </p>

          {/* PIN input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 8 }}>
              Code PIN (6 chiffres)
            </label>
            <div className="flex items-center gap-2" style={{
              background: BAI.bgInput, border: `1px solid ${BAI.border}`, borderRadius: 12,
              padding: '12px 16px',
            }}>
              <Key size={16} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="000000"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 24, fontWeight: 700, letterSpacing: '0.3em', color: BAI.ink,
                  fontFamily: BAI.fontBody, textAlign: 'center',
                }}
              />
            </div>
          </div>

          {/* Indicateur PIN visuel */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i < pin.length ? BAI.tenant : BAI.border,
                transition: 'background 0.15s',
              }} />
            ))}
          </div>

          <button
            onClick={() => handleJoin()}
            disabled={loading || pin.length !== 6}
            style={{
              width: '100%', background: pin.length === 6 ? BAI.night : BAI.bgMuted,
              color: pin.length === 6 ? '#fff' : BAI.inkFaint,
              border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15,
              fontWeight: 700, fontFamily: BAI.fontBody, cursor: pin.length === 6 ? 'pointer' : 'default',
              transition: 'background 0.2s, color 0.2s', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion…</> : 'Rejoindre l\'état des lieux'}
          </button>

          <p style={{ fontSize: 12, color: BAI.inkFaint, textAlign: 'center', marginTop: 20 }}>
            Vous pouvez aussi scanner le QR code affiché<br />sur l'écran du propriétaire
          </p>
        </div>
      </div>
    </Layout>
  )
}
