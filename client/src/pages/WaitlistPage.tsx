import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const LAUNCH_DATE = new Date('2026-09-01T00:00:00Z')

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    function calc() {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [target])
  return t
}

// ─── Types ────────────────────────────────────────────────────────────────────

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string }
  | { kind: 'error'; message: string }

// ─── Logo mark ────────────────────────────────────────────────────────────────

function BailioMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#1a1a2e" />
      {/* House body */}
      <path d="M20 11L10 18.5V30H16.5V23.5H23.5V30H30V18.5L20 11Z" fill="#fafaf8" />
      {/* Door */}
      <rect x="17.5" y="23.5" width="5" height="6.5" rx="1" fill="#c4976a" />
      {/* Chimney accent */}
      <rect x="24" y="13" width="2.5" height="5" rx="0.5" fill="#c4976a" />
    </svg>
  )
}

// ─── Social icons ─────────────────────────────────────────────────────────────

function IconIG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconLI() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaitlistPage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE)

  useEffect(() => {
    fetch(`${API_BASE}/waitlist/count`)
      .then(r => r.json())
      .then(d => { if (d.success) setTotalCount(d.data.total) })
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
        body: JSON.stringify({ email: email.trim(), firstName: firstName.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setState({ kind: 'error', message: data.message || 'Une erreur est survenue' })
        return
      }
      setState({
        kind: 'success',
        isEarlyAccess: data.data.isEarlyAccess,
        alreadyRegistered: data.data.alreadyRegistered,
        firstName: firstName.trim(),
      })
      if (!data.data.alreadyRegistered) setTotalCount(c => (c !== null ? c + 1 : 1))
    } catch {
      setState({ kind: 'error', message: 'Impossible de rejoindre la liste. Réessayez.' })
    }
  }

  const features = [
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
      title: 'Dossiers vérifiés par IA',
      desc: 'Analyse instantanée des justificatifs. Fini les dossiers falsifiés.',
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>,
      title: 'Bail & signature électronique',
      desc: 'Conforme eIDAS. Signé en ligne, valeur juridique complète.',
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
      title: 'Loyers & quittances auto',
      desc: 'Paiements sécurisés, quittances générées, historique complet.',
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
      title: 'Messagerie sécurisée',
      desc: 'Canal direct propriétaire ↔ locataire, archivé et traçable.',
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes drawCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        .wl-input {
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .wl-input:focus {
          border-color: #c4976a !important;
          box-shadow: 0 0 0 3px rgba(196,151,106,0.12) !important;
        }
        .wl-btn:hover:not(:disabled) {
          background: #2a2a4e !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(26,26,46,0.3);
        }
        .wl-btn { transition: background 0.15s, transform 0.15s, box-shadow 0.15s; }
        .social-btn {
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .social-btn:hover {
          background: #f4f2ee !important;
          border-color: #ccc9c3 !important;
          color: #0d0c0a !important;
        }
        .feat-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 20px rgba(13,12,10,0.1) !important;
        }
        @media (max-width: 520px) {
          .form-stack { flex-direction: column !important; }
          .form-stack > button { width: 100% !important; }
          .hero-title { font-size: 36px !important; }
          .tick-wrap { gap: 8px !important; }
        }
        @media (max-width: 640px) {
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .audience-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100dvh', background: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>

        {/* ═══════════════════ HERO DARK ═══════════════════ */}
        <div style={{ background: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>

          {/* Subtle grid pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

          {/* Caramel glow */}
          <div style={{
            position: 'absolute', top: '-80px', right: '-80px', width: 320, height: 320,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,151,106,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Nav */}
          <nav style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BailioMark size={40} />
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.01em' }}>
                  Bailio
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  Plateforme immobilière
                </div>
              </div>
            </div>

            {totalCount !== null && totalCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4976a', animation: 'blink 2s infinite' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  <strong style={{ color: '#ffffff' }}>{totalCount.toLocaleString('fr-FR')}</strong> inscrits
                </span>
              </div>
            )}
          </nav>

          {/* Hero content */}
          <div style={{ padding: '40px 24px 80px', textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', animation: 'fadeInUp 0.7s ease both' }}>

            {/* Pill badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4976a' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#c4976a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Bientôt disponible — Rejoignez la liste
              </span>
            </div>

            <h1 className="hero-title" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(38px, 9vw, 62px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1.08, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
              La location immobilière
              <br />
              <span style={{ color: '#c4976a' }}>sans agence,</span> enfin simple.
            </h1>

            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 44px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              Bailio connecte <strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>propriétaires</strong> et <strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>locataires</strong> directement — vérification IA, contrats en ligne, zéro commission.
            </p>

            {/* Countdown */}
            <div className="tick-wrap" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 0, flexWrap: 'wrap' }}>
              {[
                { v: days, l: 'Jours' },
                { v: hours, l: 'Heures' },
                { v: minutes, l: 'Min' },
                { v: seconds, l: 'Sec' },
              ].map(({ v, l }) => (
                <div key={l} style={{ textAlign: 'center', minWidth: 62 }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', marginBottom: 5 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 700, color: '#ffffff', lineHeight: 1, display: 'block' }}>
                      {String(v).padStart(2, '0')}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════ FORM CARD ═══════════════════ */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 20px', marginTop: -40, position: 'relative', zIndex: 10 }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 20, padding: '36px 32px', boxShadow: '0 8px 32px rgba(13,12,10,0.12), 0 1px 2px rgba(13,12,10,0.06)' }}>

            {state.kind === 'success' ? (
              /* ── Success ── */
              <div style={{ animation: 'popIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards', textAlign: 'center' }}>
                {/* Animated checkmark */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                    <circle cx="36" cy="36" r="35" fill="#f4f2ee" />
                    <circle
                      cx="36" cy="36" r="26"
                      fill="none" stroke="#c4976a" strokeWidth="2.5"
                      strokeDasharray="163.4" strokeDashoffset="163.4"
                      style={{ animation: 'drawCircle 0.7s ease 0.15s forwards' }}
                    />
                    <polyline
                      points="24,36 32,45 50,26"
                      fill="none" stroke="#c4976a" strokeWidth="3.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="40" strokeDashoffset="40"
                      style={{ animation: 'drawCheck 0.4s ease 0.75s forwards' }}
                    />
                  </svg>
                </div>

                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 8px', lineHeight: 1.2 }}>
                  {state.alreadyRegistered
                    ? 'Déjà inscrit !'
                    : state.firstName ? `Bienvenue, ${state.firstName} !` : 'Vous êtes sur la liste !'}
                </p>
                <p style={{ fontSize: 14, color: '#5a5754', margin: '0 0 20px', lineHeight: 1.6 }}>
                  {state.alreadyRegistered
                    ? 'Vous serez notifié en avant-première dès l\'ouverture.'
                    : 'Votre email de confirmation est en route.'}
                </p>

                {state.isEarlyAccess ? (
                  <div style={{ animation: 'fadeIn 0.4s ease 0.9s both', background: 'linear-gradient(135deg, #fdf5ec 0%, #fef8f0 100%)', border: '1px solid #f3c99a', borderRadius: 12, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400e' }}>Accès anticipé confirmé</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#5a5754', lineHeight: 1.6 }}>
                      Vous faites partie des <strong style={{ color: '#0d0c0a' }}>150 premiers</strong> — <strong style={{ color: '#0d0c0a' }}>1 mois offert</strong> sur le plan Pro vous attend au lancement.
                    </p>
                  </div>
                ) : (
                  <div style={{ animation: 'fadeIn 0.4s ease 0.9s both', background: '#f4f2ee', borderRadius: 12, padding: '14px 18px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#5a5754', lineHeight: 1.6 }}>
                      Nous vous prévenons dès que Bailio ouvre ses portes. À très bientôt !
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 6px' }}>
                    Réservez votre accès
                  </h2>
                  <p style={{ fontSize: 13, color: '#9e9b96', margin: 0, lineHeight: 1.5 }}>
                    Les <strong style={{ color: '#c4976a' }}>150 premiers inscrits</strong> obtiennent 1 mois offert sur le plan Pro.
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Votre prénom (facultatif)"
                    disabled={state.kind === 'loading'}
                    className="wl-input"
                    style={{ width: '100%', padding: '13px 16px', background: '#f8f7f4', border: '1px solid #e4e1db', borderRadius: 10, fontSize: 14, color: '#0d0c0a', outline: 'none', fontFamily: "'DM Sans', system-ui, sans-serif' " }}
                  />
                  <div className="form-stack" style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.fr"
                      required
                      disabled={state.kind === 'loading'}
                      className="wl-input"
                      style={{ flex: 1, padding: '13px 16px', background: '#f8f7f4', border: '1px solid #e4e1db', borderRadius: 10, fontSize: 14, color: '#0d0c0a', outline: 'none', fontFamily: "'DM Sans', system-ui, sans-serif", minWidth: 0 }}
                    />
                    <button
                      type="submit"
                      disabled={state.kind === 'loading' || !email.trim()}
                      className="wl-btn"
                      style={{ padding: '13px 22px', background: '#1a1a2e', color: '#fafaf8', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: state.kind === 'loading' || !email.trim() ? 'not-allowed' : 'pointer', opacity: state.kind === 'loading' || !email.trim() ? 0.5 : 1, fontFamily: "'DM Sans', system-ui, sans-serif", whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      {state.kind === 'loading' ? 'Envoi…' : 'Rejoindre →'}
                    </button>
                  </div>

                  {state.kind === 'error' && (
                    <p style={{ margin: 0, fontSize: 13, color: '#9b1c1c', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px' }}>
                      {state.message}
                    </p>
                  )}
                </form>

                <p style={{ margin: '12px 0 0', fontSize: 11, color: '#9e9b96', textAlign: 'center' }}>
                  Aucun spam · Désabonnement en un clic · contact@bailio.fr
                </p>

                {totalCount !== null && totalCount > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e4e1db', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex' }}>
                      {['#1a1a2e', '#c4976a', '#1b5e3b'].map((bg, i) => (
                        <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #ffffff', background: bg, marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: '#5a5754' }}>
                      <strong style={{ color: '#0d0c0a' }}>{totalCount.toLocaleString('fr-FR')}</strong> propriétaires et locataires nous attendent
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ═══════════════════ FEATURES ═══════════════════ */}
        <section style={{ padding: '64px 20px 24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <p style={{ textAlign: 'center', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9b96', fontWeight: 600, marginBottom: 6 }}>
            Ce qui vous attend au lancement
          </p>
          <p style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 32px', lineHeight: 1.2 }}>
            Tout ce dont vous avez besoin,<br />au même endroit.
          </p>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} className="feat-card" style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 14, padding: '22px 18px', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4976a', marginBottom: 14 }}>
                  {f.icon}
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 14, color: '#0d0c0a', lineHeight: 1.3 }}>{f.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#9e9b96', lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════ FOR WHO ═══════════════════ */}
        <section style={{ padding: '24px 20px 64px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <div className="audience-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Propriétaires */}
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,151,106,0.15) 0%, transparent 70%)' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 18 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c4976a' }}>Propriétaires</span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '0 0 12px', lineHeight: 1.3 }}>
                Gérez vos biens en toute autonomie
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.65 }}>
                Publiez vos annonces, analysez les dossiers, signez les baux et encaissez les loyers — sans intermédiaire, sans commission.
              </p>
            </div>
            {/* Locataires */}
            <div style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 16, padding: '32px 28px', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#f4f2ee', border: '1px solid #e4e1db', borderRadius: 20, padding: '4px 12px', marginBottom: 18 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9e9b96' }}>Locataires</span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 12px', lineHeight: 1.3 }}>
                Trouvez et gérez votre logement simplement
              </p>
              <p style={{ fontSize: 13, color: '#9e9b96', margin: 0, lineHeight: 1.65 }}>
                Constituez votre dossier une fois, candidatez en un clic, suivez votre bail et communiquez directement avec votre propriétaire.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════ FOOTER ═══════════════════ */}
        <footer style={{ borderTop: '1px solid #e4e1db', padding: '24px 24px', background: '#ffffff' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BailioMark size={28} />
              <div>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a' }}>Bailio</span>
                <span style={{ fontSize: 11, color: '#9e9b96', marginLeft: 8 }}>© 2026 — Tous droits réservés</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {[
                { href: 'https://instagram.com/bailio.fr', label: '@bailio.fr', icon: <IconIG /> },
                { href: 'https://twitter.com/bailiofr', label: '@bailiofr', icon: <IconX /> },
                { href: 'https://linkedin.com/company/bailio', label: 'LinkedIn', icon: <IconLI /> },
              ].map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  title={label}
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e4e1db', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5754', textDecoration: 'none' }}
                >
                  {icon}
                </a>
              ))}
              <a href="mailto:contact@bailio.fr" style={{ fontSize: 12, color: '#9e9b96', textDecoration: 'none', fontWeight: 500, marginLeft: 4 }}>
                contact@bailio.fr
              </a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
