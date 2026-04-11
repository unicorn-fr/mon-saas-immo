import React, { useState, useEffect } from 'react'
import {
  Key, FileText, PenTool, CreditCard,
  CheckCircle, Shield, Zap, Home, Euro, ArrowRight,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const LAUNCH_DATE = new Date('2026-06-04T00:00:00Z')

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONF_COLORS = ['#E8B847', '#1A3D2B', '#346246', '#F9EDBE', '#E8E2D5']
const PARTICLES = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: (i / 80) * 100 + Math.sin(i * 1.5) * 4,
  w: i % 3 === 2 ? (5 + (i % 7) * 1.5) * 2.2 : 5 + (i % 7) * 1.5,
  h: i % 3 === 2 ? (5 + (i % 7) * 1.5) * 0.4 : 5 + (i % 7) * 1.5,
  color: CONF_COLORS[i % CONF_COLORS.length],
  round: i % 3 === 1,
  dur: 2200 + (i % 11) * 250,
  delay: (i % 13) * 120,
  drift: Math.sin(i * 0.7) * 80,
}))

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Work+Sans:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; scroll-behavior: smooth; }

:root {
  --c-foret:    #1A3D2B;
  --c-nuit:     #0B1811;
  --c-mousse:   #346246;
  --c-or:       #E8B847;
  --c-or-pale:  #F9EDBE;
  --c-coquille: #F5F1EA;
  --c-calcaire: #E8E2D5;
  --c-limon:    #D7D0BE;
  --c-ink:      #0d0c0a;
  --c-ink-mid:  #4a4a42;
  --c-ink-faint:#8a8878;
  --c-surface:  #ffffff;
  --c-border:   #E8E2D5;
  --font-display: 'Big Shoulders Display', sans-serif;
  --font-body:    'Work Sans', sans-serif;
  --shadow-card: 0 1px 2px rgba(11,24,17,0.04), 0 4px 16px rgba(11,24,17,0.07);
  --shadow-hover: 0 4px 8px rgba(11,24,17,0.08), 0 12px 32px rgba(11,24,17,0.12);
}

@keyframes wUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes cfFall {
  0%   { opacity: 1; transform: translateY(0) rotate(0deg) translateX(0); }
  100% { opacity: 0; transform: translateY(110vh) rotate(720deg) translateX(var(--d,0px)); }
}
@keyframes drawCircle {
  from { stroke-dashoffset: 283; }
  to   { stroke-dashoffset: 0; }
}
@keyframes drawCheck {
  from { stroke-dashoffset: 60; }
  to   { stroke-dashoffset: 0; }
}
@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.84) translateY(8px); }
  65%  { transform: scale(1.03); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); }
  50%       { transform: translateX(5px); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-14px); }
}

/* ── Scroll reveal ─────────────────────────────────────────────────────────── */
.bail-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity .65s ease, transform .65s ease;
}
.bail-reveal.vis { opacity: 1; transform: translateY(0); }
.bail-d1 { transition-delay: .08s !important; }
.bail-d2 { transition-delay: .18s !important; }
.bail-d3 { transition-delay: .30s !important; }
.bail-d4 { transition-delay: .44s !important; }

/* ── Form inputs ───────────────────────────────────────────────────────────── */
.bail-inp {
  background: rgba(255,255,255,0.07);
  border: 1.5px solid rgba(255,255,255,0.16);
  border-radius: 8px;
  outline: none;
  width: 100%;
  padding: 12px 14px;
  font-family: var(--font-body);
  font-size: 15px;
  color: #ffffff;
  transition: border-color .2s, background .2s;
  -webkit-appearance: none;
}
.bail-inp::placeholder { color: rgba(255,255,255,0.28); }
.bail-inp:focus { border-color: var(--c-or); background: rgba(255,255,255,0.12); }

.bail-lbl {
  display: block;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.40);
  margin-bottom: 6px;
}
.bail-grp { margin-bottom: 14px; }

/* ── CTA ────────────────────────────────────────────────────────────────────── */
.bail-cta {
  width: 100%;
  padding: 14px 24px;
  background: var(--c-or);
  color: var(--c-nuit);
  border: none;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: .01em;
  transition: background .2s, box-shadow .2s, opacity .2s;
  box-shadow: 0 4px 20px rgba(232,184,71,0.30);
  margin-top: 18px;
}
.bail-cta:hover:not(:disabled) {
  background: #d4a535;
  box-shadow: 0 6px 28px rgba(232,184,71,0.45);
}
.bail-cta:disabled { opacity: .4; cursor: default; }

/* ── Feature cards ─────────────────────────────────────────────────────────── */
.feat-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  padding: clamp(22px,3vw,30px);
  transition: transform .22s ease, box-shadow .22s ease;
  box-shadow: var(--shadow-card);
}
.feat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

/* ── Countdown unit ────────────────────────────────────────────────────────── */
.cd-unit {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 8px;
  padding: 6px 10px;
  text-align: center;
  min-width: 44px;
}

/* ── Social cards ──────────────────────────────────────────────────────────── */
.soc-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 14px 18px;
  text-decoration: none;
  box-shadow: var(--shadow-card);
  transition: transform .2s ease, box-shadow .2s ease;
  flex: 1 1 175px;
  min-width: 160px;
}
.soc-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* ── Shape ─────────────────────────────────────────────────────────────────── */
.shape-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
`

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    function calc() {
      const diff = Math.max(0, target.getTime() - Date.now())
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

// ─── Components ───────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {PARTICLES.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute', top: -20, left: `${p.x}%`,
            width: p.w, height: p.h, background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animation: `cfFall ${p.dur}ms ease-in ${p.delay}ms forwards`,
            '--d': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function BailioLogo({ light = false }: { light?: boolean }) {
  return (
    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#E8B847"/>
        <circle cx="50" cy="36" r="14" fill="#0B1811"/>
        <path d="M 43 49 L 38 74 L 62 74 L 57 49 Z" fill="#0B1811"/>
      </svg>
      <span style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
        color: light ? '#ffffff' : 'var(--c-foret)', letterSpacing: '-0.02em',
      }}>
        bailio<span style={{ color: 'var(--c-or)' }}>.fr</span>
      </span>
    </a>
  )
}

function CDUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="cd-unit">
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'clamp(14px,2vw,18px)', color: '#ffffff', lineHeight: 1 }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 8, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
        {label}
      </div>
    </div>
  )
}

function SuccessBlock({ isEarlyAccess, alreadyRegistered, firstName }: { isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string }) {
  return (
    <div style={{ animation: 'slideUp .5s ease forwards', textAlign: 'center' }}>
      <svg width="48" height="48" viewBox="0 0 52 52" fill="none" style={{ marginBottom: 14 }}>
        <circle cx="26" cy="26" r="24" stroke="var(--c-or)" strokeWidth="2"
          strokeDasharray="283" strokeDashoffset="283"
          style={{ animation: 'drawCircle .8s ease .1s forwards' }} />
        <polyline points="14,27 21,34 38,18" stroke="var(--c-or)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="60" strokeDashoffset="60"
          style={{ animation: 'drawCheck .45s ease .9s forwards' }} />
      </svg>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,3vw,30px)', color: '#ffffff', margin: '0 0 8px', lineHeight: 1.1 }}>
        {alreadyRegistered ? 'Déjà inscrit !' : firstName ? `Bienvenue, ${firstName} !` : "T'es sur la liste !"}
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.60)', lineHeight: 1.72, margin: '0 0 16px' }}>
        {alreadyRegistered
          ? 'Cet email est déjà enregistré. Tu seras parmi les premiers prévenus.'
          : "Inscription confirmée. Un email de bienvenue vient d'être envoyé."}
      </p>
      {isEarlyAccess && !alreadyRegistered && (
        <div style={{
          animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) 1.4s both',
          background: 'rgba(232,184,71,0.12)',
          border: '1px solid rgba(232,184,71,0.30)',
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--c-or)', flexShrink: 0, marginTop: 4 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-or)', marginBottom: 3 }}>
              Early Access · 150 premiers
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 1.5 }}>
              <strong style={{ color: '#ffffff' }}>1 mois offert</strong> sur le plan Pro au lancement.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<'owner' | 'tenant' | ''>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isEarlyAccess, setIsEarlyAccess] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const cd = useCountdown(LAUNCH_DATE)

  useEffect(() => {
    fetch(`${API_BASE}/waitlist/count`)
      .then(r => r.json())
      .then(d => { if (d.success) setTotalCount(d.data.total) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target) }
      }),
      { threshold: 0.10 },
    )
    document.querySelectorAll('.bail-reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailValid || loading) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim() || undefined,
          userType: userType || undefined,
        }),
      })
      const d = await res.json()
      if (d.success) {
        setIsEarlyAccess(d.data.isEarlyAccess)
        setAlreadyRegistered(d.data.alreadyRegistered)
        setSuccess(true)
        if (!d.data.alreadyRegistered) {
          setTotalCount(c => c + 1)
          setConfetti(true)
          setTimeout(() => setConfetti(false), 4500)
        }
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }

  return (
    <>
      <style>{CSS}</style>
      <Confetti active={confetti} />

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100svh',
        background: 'var(--c-nuit)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(80px,10vw,120px) clamp(16px,5vw,40px) clamp(48px,6vw,72px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* "bailio." fond décoratif géant */}
        <span style={{
          position: 'absolute',
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(140px, 22vw, 320px)',
          color: 'rgba(255,255,255,0.025)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          animation: 'float 7s ease-in-out infinite',
          zIndex: 0,
        }}>bailio.</span>

        {/* Cercles décoratifs */}
        <div className="shape-circle" style={{ width: 480, height: 480, background: 'rgba(232,184,71,0.04)', bottom: -100, left: -140, zIndex: 0 }} />
        <div className="shape-circle" style={{ width: 240, height: 240, background: 'rgba(52,98,70,0.15)', top: 30, right: -70, zIndex: 0 }} />

        {/* Logo nav */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, display: 'flex', alignItems: 'center', padding: '0 clamp(16px,5vw,48px)', zIndex: 10 }}>
          <BailioLogo light />
        </div>

        {/* Contenu centré */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 540, textAlign: 'center' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(232,184,71,0.12)',
            border: '1px solid rgba(232,184,71,0.25)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 22,
            opacity: 0, animation: 'wUp .5s ease .1s forwards',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--c-or)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-or)' }}>
              Accès anticipé · Lancement 2026
            </span>
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(42px,7vw,88px)', lineHeight: 0.95,
            margin: '0 0 20px', color: '#ffffff',
            letterSpacing: '-0.02em',
            opacity: 0, animation: 'wUp .55s cubic-bezier(.22,1,.36,1) .20s forwards',
          }}>
            La clé de ta<br />
            <span style={{ color: 'var(--c-or)' }}>prochaine location.</span>
          </h1>

          {/* Sous-titre */}
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 16,
            color: 'rgba(255,255,255,0.50)', lineHeight: 1.7,
            margin: '0 0 32px',
            opacity: 0, animation: 'fIn .6s ease .45s forwards',
          }}>
            Dossier locatif en 2 min. Bail signé en ligne.<br />
            Loyers encaissés automatiquement. Zéro agence.
          </p>

          {/* Social proof */}
          {totalCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28,
              opacity: 0, animation: 'fIn .5s ease .65s forwards',
            }}>
              <div style={{ display: 'flex' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: `hsl(${140 + i * 20}, 35%, 45%)`,
                    border: '2px solid var(--c-nuit)',
                    marginLeft: i > 0 ? -9 : 0,
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                <strong style={{ color: '#ffffff' }}>{totalCount.toLocaleString('fr-FR')}</strong> personnes inscrites
              </span>
            </div>
          )}

          {/* Formulaire */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 16,
            padding: 'clamp(20px,3vw,28px)',
            textAlign: 'left',
            opacity: 0, animation: 'fIn .7s ease .80s forwards',
          }}>
            {/* Countdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                Lancement dans
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ display: 'flex', gap: 5 }}>
                <CDUnit value={cd.days} label="Jours" />
                <CDUnit value={cd.hours} label="H" />
                <CDUnit value={cd.minutes} label="Min" />
                <CDUnit value={cd.seconds} label="Sec" />
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

            {!success ? (
              <form onSubmit={submit}>
                <div className="bail-grp">
                  <label className="bail-lbl">Ton prénom (optionnel)</label>
                  <input className="bail-inp" type="text" placeholder="Thomas"
                    value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
                <div className="bail-grp">
                  <label className="bail-lbl">Ton email *</label>
                  <input className="bail-inp" type="email" placeholder="thomas@exemple.fr"
                    value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                </div>

                <div style={{ marginBottom: 4 }}>
                  <label className="bail-lbl">Tu es</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { val: 'owner', label: 'Propriétaire', color: 'var(--c-or-pale)', bg: 'rgba(232,184,71,0.15)', border: 'rgba(232,184,71,0.35)' },
                      { val: 'tenant', label: 'Locataire', color: '#a8d5b5', bg: 'rgba(52,98,70,0.25)', border: 'rgba(52,98,70,0.45)' },
                    ].map(({ val, label, color, bg, border }) => {
                      const active = userType === val
                      return (
                        <button
                          key={val} type="button"
                          onClick={() => setUserType(userType === val as 'owner' | 'tenant' ? '' : val as 'owner' | 'tenant')}
                          style={{
                            flex: 1, padding: '9px 12px', borderRadius: 8,
                            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', transition: 'all .18s',
                            background: active ? bg : 'rgba(255,255,255,0.05)',
                            border: `1.5px solid ${active ? border : 'rgba(255,255,255,0.10)'}`,
                            color: active ? color : 'rgba(255,255,255,0.38)',
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button type="submit" disabled={loading || !emailValid} className="bail-cta">
                  {loading
                    ? <span style={{ letterSpacing: '0.35em', fontSize: 18 }}>···</span>
                    : (
                      <>
                        <span>Rejoindre la liste d'attente</span>
                        <span style={{ display: 'inline-flex', animation: emailValid ? 'arrowPulse 1.4s ease-in-out infinite' : 'none' }}>
                          <ArrowRight size={16} />
                        </span>
                      </>
                    )
                  }
                </button>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.22)', margin: '10px 0 0', textAlign: 'center' }}>
                  Gratuit. Sans engagement. Tu te désinscrits quand tu veux.
                </p>
              </form>
            ) : (
              <SuccessBlock isEarlyAccess={isEarlyAccess} alreadyRegistered={alreadyRegistered} firstName={firstName} />
            )}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.12)', zIndex: 1 }}>
          © {new Date().getFullYear()} Bailio.fr — Fait avec passion depuis une chambre d'étudiant.
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--c-foret)',
        padding: 'clamp(28px,4vw,44px) clamp(16px,5vw,64px)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(20px,4vw,48px)' }}>
            {[
              { Icon: Euro, stat: '0 €', label: 'de commission agence' },
              { Icon: Zap, stat: '< 2 min', label: 'pour monter ton dossier' },
              { Icon: Shield, stat: 'eIDAS', label: 'bail valide légalement' },
            ].map(({ Icon, stat, label }, i) => (
              <div key={i} className={`bail-reveal bail-d${i + 1}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                <Icon size={22} color="var(--c-or)" strokeWidth={1.8} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,36px)', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {stat}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          POUR QUI
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--c-coquille)', padding: 'clamp(56px,9vw,96px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,52px)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-mousse)', margin: '0 0 12px' }}>
              Pour qui ?
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(30px,5vw,52px)', color: 'var(--c-foret)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              Fait pour toi, que tu loues<br />ou que tu gères.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Propriétaires */}
            <div className="bail-reveal feat-card" style={{ borderTop: '3px solid var(--c-foret)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(26,61,43,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Key size={20} color="var(--c-foret)" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-mousse)', marginBottom: 2 }}>Propriétaires</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--c-foret)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>Gère tout, sans intermédiaire.</div>
                </div>
              </div>
              {[
                'Publie ton annonce, garde tes loyers.',
                'On vérifie les dossiers pour toi, en quelques secondes.',
                'Bail signé en ligne. Valeur légale garantie.',
                'Tes loyers tombent chaque mois. Automatiquement.',
                'Tout depuis ton téléphone. Zéro paperasse.',
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 11 }}>
                  <CheckCircle size={14} color="var(--c-foret)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 3 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.5 }}>{it}</span>
                </div>
              ))}
            </div>

            {/* Locataires */}
            <div className="bail-reveal bail-d1 feat-card" style={{ borderTop: '3px solid var(--c-or)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(232,184,71,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Home size={20} color="#b8922b" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8922b', marginBottom: 2 }}>Locataires</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--c-foret)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>Trouve, postule, signe. Sans stress.</div>
                </div>
              </div>
              {[
                'Dossier prêt en 2 min chrono.',
                'Tu ne paies rien. Zéro frais d\'agence.',
                'Tes docs sont vérifiés. Ta signature est sécurisée.',
                'Ta quittance arrive toute seule, chaque mois.',
                'Tu parles directement avec le propriétaire. Pas d\'intermédiaire.',
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 11 }}>
                  <CheckCircle size={14} color="#b8922b" strokeWidth={2} style={{ flexShrink: 0, marginTop: 3 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.5 }}>{it}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--c-calcaire)', borderTop: '1px solid var(--c-limon)', borderBottom: '1px solid var(--c-limon)', padding: 'clamp(48px,7vw,80px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(32px,5vw,52px)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-mousse)', margin: '0 0 12px' }}>
              Fonctionnalités
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px,5vw,50px)', color: 'var(--c-foret)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              Ce qu'on fait pour toi.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
            {[
              {
                Icon: FileText,
                title: 'Dossier vérifié en quelques secondes',
                desc: "On analyse tes justificatifs automatiquement. Score de solvabilité immédiat. Tu n'as plus à éplucher des liasses de papiers.",
                color: 'var(--c-foret)', bg: 'rgba(26,61,43,0.08)',
              },
              {
                Icon: PenTool,
                title: 'Bail signé en ligne, valide légalement',
                desc: "Le bail et l'état des lieux se signent directement depuis Bailio. C'est conforme au règlement européen eIDAS — même valeur qu'un original papier.",
                color: '#b8922b', bg: 'rgba(232,184,71,0.12)',
              },
              {
                Icon: CreditCard,
                title: 'Tes loyers arrivent tout seuls',
                desc: "Chaque mois, le loyer tombe. La quittance part. Tu n'as rien à faire. C'est ça, la gestion locative en 2025.",
                color: 'var(--c-mousse)', bg: 'rgba(52,98,70,0.08)',
              },
            ].map(({ Icon, title, desc, color, bg }, i) => (
              <div key={i} className={`feat-card bail-reveal bail-d${i + 1}`}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--c-foret)', marginBottom: 10, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                  {title}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.65 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FONDATEUR
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--c-surface)', padding: 'clamp(48px,7vw,80px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="bail-reveal">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-mousse)', margin: '0 0 28px' }}>
              Pourquoi j'ai lancé Bailio
            </p>

            <div style={{ display: 'flex', gap: 'clamp(20px,4vw,40px)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(26,61,43,0.08)', border: '2px solid rgba(26,61,43,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--c-foret)' }}>E</span>
                </div>
                <div style={{ marginTop: 8, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--c-ink)' }}>Enzo</div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--c-ink-faint)' }}>Fondateur</div>
              </div>

              <div style={{ flex: '1 1 280px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(17px,2.5vw,22px)', color: 'var(--c-foret)', lineHeight: 1.3, marginBottom: 18, letterSpacing: '-0.01em' }}>
                  "J'ai lancé Bailio à 20 ans depuis ma chambre d'étudiant."
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.80, margin: '0 0 14px' }}>
                  Au départ c'est simple : mes parents galèrent à louer leur appartement. Des dossiers
                  perdus, une agence qui prend 15&nbsp;%, des emails sans réponse pendant des semaines.
                  Je me suis dit — il <em>doit</em> exister un meilleur moyen.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.80, margin: '0 0 14px' }}>
                  Alors j'ai construit Bailio. Pas une startup qui veut changer le monde — juste un outil honnête qui fait le boulot à ta place.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink)', lineHeight: 1.80, margin: 0, fontWeight: 500 }}>
                  Si tu es là, c'est que tu cherches exactement ça. Bienvenue.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--c-border)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--c-foret)' }}>Enzo,</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--c-ink-faint)' }}>fondateur de Bailio · 20 ans · École de commerce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SOCIAL
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--c-coquille)', borderTop: '1px solid var(--c-limon)', padding: 'clamp(40px,6vw,64px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div className="bail-reveal" style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,40px)', color: 'var(--c-foret)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              Suis l'aventure en direct.
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {[
              {
                href: 'https://instagram.com/bailio.fr', handle: '@bailio.fr', desc: 'Coulisses du lancement', color: '#e1306c',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/></svg>,
              },
              {
                href: 'https://twitter.com/bailiofr', handle: '@bailiofr', desc: 'Actualités produit', color: 'var(--c-ink)',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
              },
              {
                href: 'https://linkedin.com/company/bailio', handle: 'Bailio', desc: 'Vision & immobilier', color: '#0a66c2',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
              },
              {
                href: 'https://facebook.com/bailio.immobilier', handle: 'Bailio Immobilier', desc: 'Actualités & nouveautés', color: '#1877f2',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.428c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>,
              },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className={`soc-card bail-reveal bail-d${(i % 4) + 1}`}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--c-calcaire)', border: '1px solid var(--c-limon)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--c-ink)', lineHeight: 1.2 }}>{s.handle}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--c-ink-faint)', marginTop: 2 }}>{s.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: 'var(--c-nuit)', padding: 'clamp(20px,4vw,32px) clamp(16px,5vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <BailioLogo light />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px,3vw,28px)', alignItems: 'center' }}>
            {[
              { label: 'Mentions légales', href: '/legal' },
              { label: 'Confidentialité', href: '/privacy' },
              { label: 'CGU', href: '/terms' },
              { label: 'Contact', href: 'mailto:hello@bailio.fr' },
            ].map((l, i) => (
              <a key={i} href={l.href}
                style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.30)', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}>
                {l.label}
              </a>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
            © {new Date().getFullYear()} Bailio.fr — Fait avec passion depuis une chambre d'étudiant.
          </div>
        </div>
      </footer>
    </>
  )
}
