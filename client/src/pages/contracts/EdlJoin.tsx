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
      <div style={{ minHeight: '100vh', background: '#0a0d1a', fontFamily: BAI.fontBody }}>
        {/* Hero dark */}
        <div style={{ padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)', textAlign: 'center' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 8px' }}>
            État des Lieux
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,5vw,42px)', color: '#ffffff', margin: '0 0 10px', lineHeight: 1.1 }}>
            Rejoindre la session
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Saisissez le code PIN affiché sur l'écran du propriétaire
          </p>
        </div>

        {/* Card glass centrale */}
        <div className="flex justify-center px-4 pb-16">
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 24,
            padding: 'clamp(28px,6vw,48px)',
            maxWidth: 420,
            width: '100%',
          }}>
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <ClipboardCheck size={24} style={{ color: BAI.caramel }} />
            </div>

            {/* PIN input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8 }}>
                Code PIN (6 chiffres)
              </label>
              <div className="flex items-center gap-2" style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: '12px 16px',
              }}>
                <Key size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
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
                    fontSize: 24, fontWeight: 700, letterSpacing: '0.3em',
                    color: '#ffffff',
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
                  background: i < pin.length ? BAI.caramel : 'rgba(255,255,255,0.2)',
                  transition: 'background 0.15s',
                }} />
              ))}
            </div>

            <button
              onClick={() => handleJoin()}
              disabled={loading || pin.length !== 6}
              style={{
                width: '100%',
                background: pin.length === 6 ? BAI.caramel : 'rgba(255,255,255,0.08)',
                color: pin.length === 6 ? '#fff' : 'rgba(255,255,255,0.35)',
                border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15,
                fontWeight: 700, fontFamily: BAI.fontBody, cursor: pin.length === 6 ? 'pointer' : 'default',
                transition: 'background 0.2s, color 0.2s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion…</> : 'Rejoindre l\'état des lieux'}
            </button>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 20 }}>
              Vous pouvez aussi scanner le QR code affiché<br />sur l'écran du propriétaire
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
