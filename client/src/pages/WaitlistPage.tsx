import { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

// Countdown to launch (60 days from now — adjust this date)
const LAUNCH_DATE = new Date('2026-06-01T00:00:00Z')

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    function calc() {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ days, hours, minutes, seconds })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [target])

  return timeLeft
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 64 }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e4e1db',
          borderRadius: 10,
          padding: '14px 20px',
          marginBottom: 6,
          boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 36,
            fontWeight: 700,
            color: '#0d0c0a',
            lineHeight: 1,
            display: 'block',
          }}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: '#9e9b96',
        }}
      >
        {label}
      </span>
    </div>
  )
}

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; position: number; isEarlyAccess: boolean; alreadyRegistered: boolean }
  | { kind: 'error'; message: string }

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE)

  useEffect(() => {
    fetch(`${API_BASE}/waitlist/count`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTotalCount(d.data.total)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setState({ kind: 'loading' })

    try {
      const res = await fetch(`${API_BASE}/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setState({ kind: 'error', message: data.message || 'Une erreur est survenue' })
        return
      }

      setState({
        kind: 'success',
        position: data.data.position,
        isEarlyAccess: data.data.isEarlyAccess,
        alreadyRegistered: data.data.alreadyRegistered,
      })
      if (!data.data.alreadyRegistered) {
        setTotalCount((c) => (c !== null ? c + 1 : 1))
      }
    } catch {
      setState({ kind: 'error', message: 'Impossible de rejoindre la liste. Réessayez.' })
    }
  }

  const features = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      title: 'Annonces vérifiées',
      desc: 'Chaque propriété et propriétaire est vérifié avant publication.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      title: 'Contrats en ligne',
      desc: 'Bail, état des lieux, signatures électroniques. 100% légal.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      title: 'Communication directe',
      desc: 'Échangez directement avec propriétaires et locataires.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      ),
      title: 'Zéro commission',
      desc: 'Aucun intermédiaire. Aucun honoraire d'agence.',
    },
  ]

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#fafaf8',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e4e1db',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#1a1a2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#0d0c0a',
              letterSpacing: '-0.01em',
            }}
          >
            Bailio
          </span>
        </div>
        {totalCount !== null && totalCount > 0 && (
          <span
            style={{
              fontSize: 12,
              color: '#9e9b96',
              fontWeight: 500,
            }}
          >
            {totalCount.toLocaleString('fr-FR')} inscrits
          </span>
        )}
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Hero */}
        <section
          style={{
            width: '100%',
            maxWidth: 640,
            padding: '64px 24px 40px',
            textAlign: 'center',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#fdf5ec',
              border: '1px solid #f3c99a',
              borderRadius: 20,
              padding: '5px 14px',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#c4976a',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#92400e',
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
              }}
            >
              Bientôt disponible
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(36px, 7vw, 56px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#0d0c0a',
              lineHeight: 1.1,
              margin: '0 0 16px',
            }}
          >
            La location entre
            <br />
            particuliers, enfin simple
          </h1>

          <p
            style={{
              fontSize: 16,
              color: '#5a5754',
              lineHeight: 1.65,
              margin: '0 0 40px',
              maxWidth: 480,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Bailio connecte propriétaires et locataires sans agence. Annonces vérifiées, contrats en ligne, zéro commission.
          </p>

          {/* Countdown */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 40,
              flexWrap: 'wrap' as const,
            }}
          >
            <CountdownUnit value={days} label="jours" />
            <CountdownUnit value={hours} label="heures" />
            <CountdownUnit value={minutes} label="minutes" />
            <CountdownUnit value={seconds} label="secondes" />
          </div>

          {/* Form or Success */}
          {state.kind === 'success' ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e4e1db',
                borderRadius: 12,
                padding: '28px 32px',
                boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                textAlign: 'center',
              }}
            >
              {state.isEarlyAccess && (
                <div
                  style={{
                    background: '#c4976a',
                    color: '#fff',
                    padding: '5px 16px',
                    borderRadius: 20,
                    display: 'inline-block',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                    marginBottom: 16,
                  }}
                >
                  Accès anticipé garanti
                </div>
              )}
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 28,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: '#0d0c0a',
                  margin: '0 0 8px',
                }}
              >
                {state.alreadyRegistered ? 'Vous êtes déjà inscrit !' : 'Vous êtes sur la liste !'}
              </p>
              <p style={{ fontSize: 14, color: '#5a5754', margin: '0 0 20px', lineHeight: 1.6 }}>
                {state.alreadyRegistered
                  ? `Votre position : #${state.position}. Nous vous préviendrons dès l'ouverture.`
                  : `Votre position est #${state.position}. Un email de confirmation vous a été envoyé.`}
              </p>
              <div
                style={{
                  background: '#f4f2ee',
                  borderRadius: 8,
                  padding: '16px 20px',
                  display: 'inline-block',
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: '#9e9b96', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                  Position
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 40,
                    fontWeight: 700,
                    color: '#0d0c0a',
                    lineHeight: 1,
                  }}
                >
                  #{state.position}
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460, margin: '0 auto' }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  required
                  disabled={state.kind === 'loading'}
                  style={{
                    flex: 1,
                    padding: '13px 16px',
                    background: '#f8f7f4',
                    border: '1px solid #e4e1db',
                    borderRadius: 8,
                    fontSize: 14,
                    color: '#0d0c0a',
                    outline: 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    opacity: state.kind === 'loading' ? 0.6 : 1,
                  }}
                />
                <button
                  type="submit"
                  disabled={state.kind === 'loading' || !email.trim()}
                  style={{
                    padding: '13px 24px',
                    background: '#1a1a2e',
                    color: '#fafaf8',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: state.kind === 'loading' || !email.trim() ? 'not-allowed' : 'pointer',
                    opacity: state.kind === 'loading' || !email.trim() ? 0.6 : 1,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    whiteSpace: 'nowrap' as const,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {state.kind === 'loading' ? 'Inscription...' : "Rejoindre la liste"}
                </button>
              </div>

              {state.kind === 'error' && (
                <p style={{ margin: 0, fontSize: 13, color: '#9b1c1c', textAlign: 'left' as const }}>
                  {state.message}
                </p>
              )}

              <p style={{ margin: 0, fontSize: 12, color: '#9e9b96', textAlign: 'center' as const }}>
                Les 150 premiers inscrits obtiennent un accès anticipé.
                <br />
                Aucun spam. Désabonnement en un clic.
              </p>
            </form>
          )}
        </section>

        {/* Social proof */}
        {totalCount !== null && totalCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: '#ffffff',
              border: '1px solid #e4e1db',
              borderRadius: 24,
              marginBottom: 40,
            }}
          >
            <div style={{ display: 'flex', marginRight: 4 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid #ffffff',
                    background: ['#1a1a2e', '#1a3270', '#1b5e3b'][i],
                    marginLeft: i > 0 ? -8 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: '#5a5754', fontWeight: 500 }}>
              <strong style={{ color: '#0d0c0a' }}>{totalCount.toLocaleString('fr-FR')}</strong> personnes nous attendent
            </span>
          </div>
        )}

        {/* Features grid */}
        <section
          style={{
            width: '100%',
            maxWidth: 900,
            padding: '0 24px 64px',
          }}
        >
          <p
            style={{
              textAlign: 'center',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: '#9e9b96',
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            Ce qui vous attend
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e4e1db',
                  borderRadius: 12,
                  padding: '20px 20px',
                  boxShadow: '0 1px 2px rgba(13,12,10,0.04)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#f4f2ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5a5754',
                    marginBottom: 12,
                  }}
                >
                  {f.icon}
                </div>
                <p
                  style={{
                    margin: '0 0 4px',
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#0d0c0a',
                  }}
                >
                  {f.title}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#9e9b96', lineHeight: 1.5 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #e4e1db',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap' as const,
          gap: 8,
          background: '#ffffff',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: '#9e9b96' }}>
          © 2026 Bailio — Tous droits réservés
        </p>
        <a
          href="mailto:contact@bailio.fr"
          style={{ fontSize: 12, color: '#c4976a', textDecoration: 'none', fontWeight: 500 }}
        >
          contact@bailio.fr
        </a>
      </footer>
    </div>
  )
}
