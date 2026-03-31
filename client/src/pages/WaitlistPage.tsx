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

function Tick({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e4e1db',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 5,
        minWidth: 56,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04)',
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 32,
          fontWeight: 700,
          color: '#0d0c0a',
          lineHeight: 1,
          display: 'block',
        }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9e9b96' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Social Icons ─────────────────────────────────────────────────────────────

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

// ─── Success state ────────────────────────────────────────────────────────────

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string }
  | { kind: 'error'; message: string }

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
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
      title: 'Dossiers vérifiés par IA',
      desc: 'Analyse automatique des justificatifs en quelques secondes. Fiabilité maximale.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
      title: 'Contrats & bail en ligne',
      desc: 'Signature électronique légale (eIDAS). Bail, état des lieux — 100 % valide.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
      title: 'Paiements sécurisés',
      desc: 'Quittances automatiques, historique complet, zéro commission d'agence.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
      title: 'Messagerie directe',
      desc: 'Canal sécurisé propriétaire ↔ locataire. Archivé, traçable, confidentiel.',
    },
  ]

  return (
    <>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(12px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes drawCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }
        .wl-input:focus { border-color: #c4976a !important; }
        .wl-btn:hover:not(:disabled) { opacity: 0.88; }
        .social-link { opacity: 0.6; transition: opacity 0.15s, color 0.15s; }
        .social-link:hover { opacity: 1; color: #c4976a !important; }
        @media (max-width: 500px) {
          .form-row { flex-direction: column !important; }
          .form-row button { width: 100% !important; }
        }
      `}</style>

      <div style={{ minHeight: '100dvh', background: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <header style={{ padding: '18px 20px', borderBottom: '1px solid #e4e1db', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', letterSpacing: '-0.01em' }}>
              Bailio
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9e9b96', paddingLeft: 6, borderLeft: '1px solid #e4e1db', marginLeft: 2 }}>
              Immobilier
            </span>
          </div>
          {totalCount !== null && totalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4976a', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, color: '#5a5754', fontWeight: 500 }}>
                <strong style={{ color: '#0d0c0a' }}>{totalCount.toLocaleString('fr-FR')}</strong> inscrits
              </span>
            </div>
          )}
        </header>

        {/* ── Main ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ── Hero ── */}
          <section style={{ width: '100%', maxWidth: 620, padding: '52px 20px 36px', textAlign: 'center' }}>

            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fdf5ec', border: '1px solid #f3c99a', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#92400e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Plateforme immobilière · Bientôt disponible
              </span>
            </div>

            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(34px, 8vw, 54px)', fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', lineHeight: 1.1, margin: '0 0 18px' }}>
              Louer sans agence,<br />gérer sans stress.
            </h1>

            <p style={{ fontSize: 15, color: '#5a5754', lineHeight: 1.7, margin: '0 0 10px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
              Bailio est la plateforme de gestion locative pour les <strong style={{ color: '#0d0c0a', fontWeight: 600 }}>propriétaires</strong> et les <strong style={{ color: '#0d0c0a', fontWeight: 600 }}>locataires</strong> qui veulent reprendre le contrôle.
            </p>
            <p style={{ fontSize: 14, color: '#9e9b96', lineHeight: 1.6, margin: '0 0 36px' }}>
              Zéro intermédiaire. Zéro commission. Tout ce dont vous avez besoin, au même endroit.
            </p>

            {/* Countdown */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
              <Tick value={days} label="jours" />
              <Tick value={hours} label="heures" />
              <Tick value={minutes} label="min" />
              <Tick value={seconds} label="sec" />
            </div>

            {/* ── Form / Success ── */}
            {state.kind === 'success' ? (
              <div style={{ animation: 'popIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards', background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 16, padding: '36px 28px', boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 8px 24px rgba(13,12,10,0.08)' }}>
                {/* Checkmark */}
                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="30" fill="#f4f2ee" />
                    <circle
                      cx="32" cy="32" r="22"
                      fill="none" stroke="#c4976a" strokeWidth="2"
                      strokeDasharray="138.2" strokeDashoffset="138.2"
                      style={{ animation: 'drawCircle 0.7s ease 0.1s forwards' }}
                    />
                    <polyline
                      points="21,32 28,40 43,24"
                      fill="none" stroke="#c4976a" strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="34" strokeDashoffset="34"
                      style={{ animation: 'drawCheck 0.4s ease 0.6s forwards' }}
                    />
                  </svg>
                </div>

                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 8px' }}>
                  {state.alreadyRegistered
                    ? 'Vous êtes déjà sur la liste !'
                    : `${state.firstName ? `Bienvenue, ${state.firstName} !` : 'Vous êtes sur la liste !'}`}
                </p>

                <p style={{ fontSize: 14, color: '#5a5754', margin: '0 0 20px', lineHeight: 1.6 }}>
                  {state.alreadyRegistered
                    ? 'Vous recevrez une notification dès le lancement de Bailio.'
                    : 'Un email de confirmation vient de vous être envoyé.'}
                </p>

                {/* Early access block */}
                {state.isEarlyAccess ? (
                  <div style={{ animation: 'fadeUp 0.4s ease 0.8s both', background: '#fdf5ec', border: '1px solid #f3c99a', borderRadius: 10, padding: '16px 20px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#92400e' }}>
                        Accès anticipé · Early Access
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#5a5754', lineHeight: 1.6 }}>
                      Vous faites partie des <strong style={{ color: '#0d0c0a' }}>150 premiers</strong> — vous bénéficierez d'<strong style={{ color: '#0d0c0a' }}>1 mois offert</strong> sur le plan Pro dès le lancement. Aucune action requise.
                    </p>
                  </div>
                ) : (
                  <div style={{ animation: 'fadeUp 0.4s ease 0.8s both', background: '#f4f2ee', border: '1px solid #e4e1db', borderRadius: 10, padding: '14px 18px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#5a5754', lineHeight: 1.6 }}>
                      Vous serez notifié en avant-première dès que Bailio ouvre ses portes.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480, margin: '0 auto' }}>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Votre prénom (facultatif)"
                  disabled={state.kind === 'loading'}
                  className="wl-input"
                  style={{ width: '100%', padding: '13px 16px', background: '#f8f7f4', border: '1px solid #e4e1db', borderRadius: 8, fontSize: 14, color: '#0d0c0a', outline: 'none', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                />
                <div className="form-row" style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    required
                    disabled={state.kind === 'loading'}
                    className="wl-input"
                    style={{ flex: 1, padding: '13px 16px', background: '#f8f7f4', border: '1px solid #e4e1db', borderRadius: 8, fontSize: 14, color: '#0d0c0a', outline: 'none', fontFamily: "'DM Sans', system-ui, sans-serif", minWidth: 0, transition: 'border-color 0.15s' }}
                  />
                  <button
                    type="submit"
                    disabled={state.kind === 'loading' || !email.trim()}
                    className="wl-btn"
                    style={{ padding: '13px 22px', background: '#1a1a2e', color: '#fafaf8', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: state.kind === 'loading' || !email.trim() ? 'not-allowed' : 'pointer', opacity: state.kind === 'loading' || !email.trim() ? 0.55 : 1, fontFamily: "'DM Sans', system-ui, sans-serif", whiteSpace: 'nowrap', transition: 'opacity 0.15s', flexShrink: 0 }}
                  >
                    {state.kind === 'loading' ? 'Inscription…' : "Rejoindre →"}
                  </button>
                </div>

                {state.kind === 'error' && (
                  <p style={{ margin: 0, fontSize: 13, color: '#9b1c1c' }}>{state.message}</p>
                )}

                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9e9b96', textAlign: 'center', lineHeight: 1.5 }}>
                  Les <strong style={{ color: '#c4976a' }}>150 premiers inscrits</strong> obtiennent 1 mois offert.
                  <br />Aucun spam. Désinscription en un clic.
                </p>
              </form>
            )}
          </section>

          {/* ── Social proof ── */}
          {totalCount !== null && totalCount > 0 && state.kind !== 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 24, marginBottom: 48 }}>
              <div style={{ display: 'flex' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #ffffff', background: ['#1a1a2e', '#c4976a', '#1b5e3b'][i], marginLeft: i > 0 ? -9 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: '#5a5754', fontWeight: 500 }}>
                <strong style={{ color: '#0d0c0a' }}>{totalCount.toLocaleString('fr-FR')}</strong> propriétaires et locataires nous attendent
              </span>
            </div>
          )}

          {/* ── Features ── */}
          <section style={{ width: '100%', maxWidth: 920, padding: '0 20px 60px' }}>
            <p style={{ textAlign: 'center', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9b96', fontWeight: 600, marginBottom: 20 }}>
              Ce que vous allez pouvoir faire
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {features.map((f, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 12, padding: '20px 18px', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4976a', marginBottom: 12 }}>
                    {f.icon}
                  </div>
                  <p style={{ margin: '0 0 5px', fontWeight: 600, fontSize: 14, color: '#0d0c0a' }}>{f.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#9e9b96', lineHeight: 1.55 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── For who ── */}
          <section style={{ width: '100%', maxWidth: 920, padding: '0 20px 60px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '28px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Propriétaires</span>
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '0 0 10px', lineHeight: 1.3 }}>
                  Gérez vos biens en toute autonomie
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
                  Publiez vos annonces, analysez les dossiers, signez les baux, encaissez les loyers — le tout depuis une seule plateforme.
                </p>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 14, padding: '28px 24px', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9e9b96' }}>Locataires</span>
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 10px', lineHeight: 1.3 }}>
                  Trouvez et gérez votre logement sereinement
                </p>
                <p style={{ fontSize: 13, color: '#9e9b96', margin: 0, lineHeight: 1.6 }}>
                  Constituez votre dossier une seule fois, candidatez en un clic, suivez votre bail et communiquez directement avec votre propriétaire.
                </p>
              </div>
            </div>
          </section>

        </main>

        {/* ── Footer ── */}
        <footer style={{ borderTop: '1px solid #e4e1db', padding: '24px 20px', background: '#ffffff' }}>
          <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a' }}>Bailio</span>
              <span style={{ fontSize: 12, color: '#9e9b96' }}>© 2026</span>
            </div>

            {/* Social links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <a
                href="https://instagram.com/bailio.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e4e1db', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5754', textDecoration: 'none' }}
                title="Instagram @bailio.fr"
              >
                <IconInstagram />
              </a>
              <a
                href="https://twitter.com/bailiofr"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e4e1db', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5754', textDecoration: 'none' }}
                title="Twitter @bailiofr"
              >
                <IconX />
              </a>
              <a
                href="https://linkedin.com/company/bailio"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e4e1db', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5754', textDecoration: 'none' }}
                title="LinkedIn Bailio"
              >
                <IconLinkedIn />
              </a>
              <a
                href="mailto:contact@bailio.fr"
                className="social-link"
                style={{ fontSize: 12, color: '#5a5754', textDecoration: 'none', fontWeight: 500, marginLeft: 4 }}
              >
                contact@bailio.fr
              </a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
