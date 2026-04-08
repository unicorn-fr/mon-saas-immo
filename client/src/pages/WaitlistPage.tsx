import React, { useState, useEffect } from 'react'
import {
  Key, FileText, PenTool, CreditCard,
  CheckCircle, Shield, Zap, Home, Euro, ArrowRight,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const LAUNCH_DATE = new Date('2026-06-04T00:00:00Z')

// ─── Confetti (kept — good UX moment on sign-up) ──────────────────────────────
const CONF_COLORS = ['#c4976a', '#1a3270', '#1b5e3b', '#e4e1db', '#fdf5ec', '#b8ccf0']
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
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }

/* ── Design tokens ─────────────────────────────────────────────────────────── */
:root {
  --c-primary:        #1a3270;
  --c-primary-light:  #eaf0fb;
  --c-primary-border: #b8ccf0;
  --c-accent:         #c4976a;
  --c-accent-light:   #fdf5ec;
  --c-green:          #1b5e3b;
  --c-green-light:    #edf7f2;
  --c-green-border:   #9fd4ba;
  --c-bg:             #fafaf8;
  --c-surface:        #ffffff;
  --c-muted:          #f4f2ee;
  --c-ink:            #0d0c0a;
  --c-ink-mid:        #5a5754;
  --c-ink-faint:      #9e9b96;
  --c-border:         #e4e1db;
  --c-border-mid:     #ccc9c3;
  --c-night:          #1a1a2e;
  --shadow-card:  0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06);
  --shadow-hover: 0 4px 8px rgba(13,12,10,0.08), 0 12px 32px rgba(13,12,10,0.10);
  --shadow-glass: 0 8px 40px rgba(13,12,10,0.10), 0 2px 8px rgba(13,12,10,0.05);
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
}

/* ── Keyframes ─────────────────────────────────────────────────────────────── */
@keyframes wUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes cfFall {
  0%   { opacity: 1; transform: translateY(0) rotate(0deg) translateX(0); }
  100% { opacity: 0; transform: translateY(110vh) rotate(720deg) translateX(var(--d, 0px)); }
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
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); }
  50%       { transform: translateX(5px); }
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

/* ── Glass card — glassmorphism transparent ─────────────────────────────────── */
.glass-card {
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.70);
  border-top: 1px solid rgba(255, 255, 255, 0.90);
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(26,50,112,0.10), 0 2px 8px rgba(26,50,112,0.05), inset 0 1px 0 rgba(255,255,255,0.80);
}

/* ── Feature cards ─────────────────────────────────────────────────────────── */
.glass-mini {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  box-shadow: var(--shadow-card);
  transition: transform .22s ease, box-shadow .22s ease;
}
.glass-mini:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* ── Form inputs ───────────────────────────────────────────────────────────── */
.bail-inp {
  background: var(--c-muted);
  border: 1.5px solid var(--c-border);
  border-radius: 8px;
  outline: none;
  width: 100%;
  padding: 11px 14px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--c-ink);
  transition: border-color .2s, background .2s;
  -webkit-appearance: none;
}
.bail-inp::placeholder { color: var(--c-ink-faint); }
.bail-inp:focus { border-color: var(--c-accent); background: #fff; }
.bail-lbl {
  display: block;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-ink-mid);
  margin-bottom: 6px;
}
.bail-grp { margin-bottom: 14px; }

/* ── CTA button — caramel shimmer ──────────────────────────────────────────── */
.bail-cta {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(90deg, #b8865c 0%, #c4976a 35%, #dab07a 50%, #c4976a 65%, #b8865c 100%);
  background-size: 200% auto;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: .02em;
  transition: background-position .6s ease, box-shadow .25s, opacity .2s;
  box-shadow: 0 4px 20px rgba(196, 151, 106, 0.28);
  margin-top: 18px;
}
.bail-cta:not(:disabled) { animation: shimmer 2.8s linear infinite; }
.bail-cta:hover:not(:disabled) {
  background-position: right center;
  box-shadow: 0 6px 28px rgba(196, 151, 106, 0.42);
}
.bail-cta:disabled { opacity: .35; cursor: default; animation: none; }

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

/* ── Countdown unit ────────────────────────────────────────────────────────── */
.cd-unit {
  background: var(--c-muted);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 6px 10px;
  text-align: center;
  min-width: 44px;
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
            width: p.w, height: p.h,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animation: `cfFall ${p.dur}ms ease-in ${p.delay}ms forwards`,
            '--d': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function BailioWordmark({ fontSize = 22, light = false }: { fontSize?: number; light?: boolean }) {
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic', fontWeight: 700, fontSize,
      color: light ? 'rgba(255,252,245,0.92)' : 'var(--c-primary)',
      letterSpacing: '-0.01em', lineHeight: 1,
    }}>
      Bailio<span style={{ color: 'var(--c-accent)' }}>.</span>
    </span>
  )
}

function CDUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="cd-unit">
      <div style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic', fontWeight: 700,
        fontSize: 'clamp(15px,2.5vw,20px)',
        color: 'var(--c-ink)', lineHeight: 1,
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 8, fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--c-ink-faint)', marginTop: 3,
      }}>
        {label}
      </div>
    </div>
  )
}

function SuccessBlock({
  isEarlyAccess, alreadyRegistered, firstName,
}: { isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string }) {
  return (
    <div style={{ animation: 'slideUp .5s ease forwards' }}>
      <svg width="48" height="48" viewBox="0 0 52 52" fill="none" style={{ marginBottom: 14 }}>
        <circle cx="26" cy="26" r="24" stroke="var(--c-green)" strokeWidth="2"
          strokeDasharray="283" strokeDashoffset="283"
          style={{ animation: 'drawCircle .8s ease .1s forwards' }} />
        <polyline points="14,27 21,34 38,18" stroke="var(--c-green)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="60" strokeDashoffset="60"
          style={{ animation: 'drawCheck .45s ease .9s forwards' }} />
      </svg>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
        fontSize: 'clamp(20px,3vw,28px)', color: 'var(--c-ink)',
        margin: '0 0 8px', lineHeight: 1.2,
      }}>
        {alreadyRegistered
          ? 'Déjà inscrit !'
          : firstName ? `Bienvenue, ${firstName} !` : 'Vous êtes sur la liste !'}
      </h2>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 13.5,
        color: 'var(--c-ink-mid)', lineHeight: 1.72, margin: '0 0 16px',
      }}>
        {alreadyRegistered
          ? 'Cette adresse est déjà enregistrée. Vous serez parmi les premiers prévenus.'
          : "Inscription confirmée. Un email de bienvenue vient d'être envoyé."}
      </p>
      {isEarlyAccess && !alreadyRegistered && (
        <div style={{
          animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) 1.4s both',
          background: 'var(--c-accent-light)',
          border: '1px solid rgba(196,151,106,0.30)',
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--c-accent)', flexShrink: 0, marginTop: 4,
          }} />
          <div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 9.5, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--c-accent)', marginBottom: 3,
            }}>
              Early Access · 150 premiers
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--c-ink-mid)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--c-ink)' }}>1 mois offert</strong> sur le plan Pro au lancement.
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
  const [scrolled, setScrolled] = useState(false)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const cd = useCountdown(LAUNCH_DATE)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

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

      {/* ── Background image — fixed, true full-bleed cover ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: 'url(/bailio-3d.png)',
        backgroundSize: '200%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        mixBlendMode: 'multiply',
        opacity: 0.9,
        filter: 'saturate(1.3) contrast(1.05)',
      }} />

      {/* ══════════════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,5vw,48px)',
        background: scrolled ? 'rgba(250,250,248,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--c-border)' : '1px solid transparent',
        transition: 'background .35s, border-color .35s',
      }}>
        <BailioWordmark fontSize={20} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--c-green)',
            boxShadow: '0 0 0 3px var(--c-green-light)',
          }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
            color: 'var(--c-ink-mid)',
          }}>
            {"Liste d'attente ouverte"}
          </span>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — above fold, everything visible without scrolling
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100svh',
        background: 'var(--c-bg)',
        backgroundImage: [
          'radial-gradient(ellipse at 80% -5%, rgba(26,50,112,0.06) 0%, transparent 50%)',
          'radial-gradient(ellipse at -5% 95%, rgba(196,151,106,0.07) 0%, transparent 50%)',
        ].join(', '),
        position: 'relative', zIndex: 1, overflow: 'visible',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(80px,12vw,108px) clamp(16px,5vw,40px) clamp(48px,6vw,72px)',
      }}>


        {/* Center content column */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500 }}>

          {/* Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'var(--c-accent-light)',
              border: '1px solid rgba(196,151,106,0.32)',
              borderRadius: 20, padding: '6px 14px',
              opacity: 0, animation: 'wUp .5s ease .1s forwards',
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: 'var(--c-accent)',
              }} />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.09em', textTransform: 'uppercase',
                color: 'var(--c-accent)',
              }}>
                Bientôt disponible · Lancement 2026
              </span>
            </div>
          </div>

          {/* H1 — ultra-clair, 3 secondes */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(26px,5vw,44px)', lineHeight: 1.10,
            margin: '0 0 14px', textAlign: 'center',
            color: 'var(--c-ink)',
            opacity: 0, animation: 'wUp .55s cubic-bezier(.22,1,.36,1) .22s forwards',
          }}>
            La première plateforme de gestion locative{' '}
            <span style={{ color: 'var(--c-accent)' }}>100&nbsp;% sans agence.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--c-ink-faint)', lineHeight: 1.5,
            margin: '0 0 18px', textAlign: 'center',
            letterSpacing: '0.04em',
            opacity: 0, animation: 'fIn .6s ease .50s forwards',
          }}>
            Dossiers IA · Bail eIDAS · Paiements automatiques
          </p>

          {/* Social proof count */}
          {totalCount > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 20,
              opacity: 0, animation: 'fIn .5s ease .88s forwards',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--c-green-light)',
                border: '1px solid var(--c-green-border)',
                borderRadius: 20, padding: '5px 12px',
              }}>
                <CheckCircle size={12} color="var(--c-green)" strokeWidth={2.5} />
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                  color: 'var(--c-green)',
                }}>
                  {totalCount.toLocaleString('fr-FR')} personnes déjà inscrites
                </span>
              </div>
            </div>
          )}

          {/* ── Glass form card ── */}
          <div className="glass-card" style={{
            padding: 'clamp(22px,4vw,34px)',
            opacity: 0, animation: 'fIn .7s ease .98s forwards',
          }}>

            {/* Countdown */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
            }}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.09em', textTransform: 'uppercase',
                color: 'var(--c-ink-faint)', flexShrink: 0,
              }}>Lancement dans</span>
              <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
              <div style={{ display: 'flex', gap: 5 }}>
                <CDUnit value={cd.days} label="Jours" />
                <CDUnit value={cd.hours} label="H" />
                <CDUnit value={cd.minutes} label="Min" />
                <CDUnit value={cd.seconds} label="Sec" />
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--c-border)', marginBottom: 20 }} />

            {/* Form or success state */}
            {!success ? (
              <form onSubmit={submit}>
                <div className="bail-grp">
                  <label className="bail-lbl">Prénom (optionnel)</label>
                  <input
                    className="bail-inp" type="text" placeholder="Thomas"
                    value={firstName} onChange={e => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div className="bail-grp">
                  <label className="bail-lbl">Adresse email *</label>
                  <input
                    className="bail-inp" type="email" placeholder="thomas@exemple.fr"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email"
                  />
                </div>

                {/* User type toggle */}
                <div style={{ marginBottom: 4 }}>
                  <label className="bail-lbl">Je suis</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      {
                        val: 'owner', label: 'Propriétaire',
                        activeColor: 'var(--c-primary)', activeBg: 'var(--c-primary-light)',
                        activeBorder: 'var(--c-primary-border)',
                      },
                      {
                        val: 'tenant', label: 'Locataire',
                        activeColor: 'var(--c-green)', activeBg: 'var(--c-green-light)',
                        activeBorder: 'var(--c-green-border)',
                      },
                    ].map(({ val, label, activeColor, activeBg, activeBorder }) => {
                      const active = userType === val
                      return (
                        <button
                          key={val} type="button"
                          onClick={() => setUserType(userType === val as 'owner' | 'tenant' ? '' : val as 'owner' | 'tenant')}
                          style={{
                            flex: 1, padding: '9px 12px', borderRadius: 8,
                            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', transition: 'all .18s',
                            background: active ? activeBg : 'var(--c-muted)',
                            border: `1.5px solid ${active ? activeBorder : 'var(--c-border)'}`,
                            color: active ? activeColor : 'var(--c-ink-mid)',
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !emailValid}
                  className="bail-cta"
                >
                  {loading
                    ? <span style={{ letterSpacing: '0.35em', fontSize: 18 }}>···</span>
                    : (
                      <>
                        <span>Rejoindre la liste</span>
                        <span style={{
                          display: 'inline-flex',
                          animation: emailValid ? 'arrowPulse 1.4s ease-in-out infinite' : 'none',
                        }}>
                          <ArrowRight size={15} />
                        </span>
                      </>
                    )
                  }
                </button>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 11,
                  color: 'var(--c-ink-faint)',
                  margin: '10px 0 0', textAlign: 'center',
                }}>
                  Gratuit · Aucune carte requise · Désabonnement en un clic
                </p>
              </form>
            ) : (
              <SuccessBlock
                isEarlyAccess={isEarlyAccess}
                alreadyRegistered={alreadyRegistered}
                firstName={firstName}
              />
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PROOF STRIP — 3 stats clés
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--c-muted)',
        borderTop: '1px solid var(--c-border)',
        borderBottom: '1px solid var(--c-border)',
        padding: 'clamp(32px,5vw,48px) clamp(16px,5vw,64px)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(20px,4vw,48px)',
          }}>
            {[
              { Icon: Euro, stat: '0 €', label: 'Commission propriétaire', color: 'var(--c-primary)' },
              { Icon: Zap, stat: '< 2 min', label: 'Pour créer un dossier', color: 'var(--c-accent)' },
              { Icon: Shield, stat: 'eIDAS', label: 'Valeur juridique garantie', color: 'var(--c-green)' },
            ].map(({ Icon, stat, label, color }, i) => (
              <div
                key={i}
                className={`bail-reveal bail-d${i + 1}`}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 10, textAlign: 'center',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={color} strokeWidth={1.8} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(20px,3.5vw,30px)',
                  color: 'var(--c-ink)', lineHeight: 1,
                }}>
                  {stat}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--c-ink-mid)', lineHeight: 1.4,
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MOT DU FONDATEUR
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--c-surface)',
        borderTop: '1px solid var(--c-border)',
        padding: 'clamp(48px,7vw,80px) clamp(16px,5vw,64px)',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="bail-reveal">
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--c-accent)', margin: '0 0 28px',
            }}>Mot du fondateur</p>

            {/* Photo + quote layout */}
            <div style={{ display: 'flex', gap: 'clamp(20px,4vw,40px)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Avatar initiales */}
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--c-primary-light)',
                  border: '2px solid var(--c-primary-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic',
                    fontWeight: 700, fontSize: 22, color: 'var(--c-primary)',
                  }}>E</span>
                </div>
                <div style={{
                  marginTop: 8, textAlign: 'center',
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                  color: 'var(--c-ink)',
                }}>Enzo</div>
                <div style={{
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)', fontSize: 10,
                  color: 'var(--c-ink-faint)',
                }}>Fondateur</div>
              </div>

              {/* Texte — voix authentique */}
              <div style={{ flex: '1 1 280px' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic', fontWeight: 600,
                  fontSize: 'clamp(16px,2.5vw,20px)',
                  color: 'var(--c-ink)', lineHeight: 1.45,
                  marginBottom: 18,
                }}>
                  "J'ai lancé Bailio à 20 ans depuis ma chambre d'étudiant."
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--c-ink-mid)', lineHeight: 1.80,
                  margin: '0 0 14px',
                }}>
                  Au départ c'est simple : mes parents galèrent à louer leur appartement. Des dossiers
                  perdus, une agence qui prend 15&nbsp;%, des emails sans réponse pendant des semaines.
                  Je me suis dit — il <em>doit</em> exister un meilleur moyen.
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--c-ink-mid)', lineHeight: 1.80,
                  margin: '0 0 14px',
                }}>
                  Alors j'ai construit Bailio. Pas une startup qui veut tout révolutionner —
                  juste un outil honnête qui fait le travail à votre place : vérifier les dossiers,
                  générer le bail, encaisser les loyers. Tout ça, sans agence, sans frais cachés,
                  depuis votre téléphone.
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--c-ink)', lineHeight: 1.80,
                  margin: 0, fontWeight: 500,
                }}>
                  Si vous êtes ici, c'est que vous cherchez exactement ça. Bienvenue.
                </p>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginTop: 22,
                  paddingTop: 18, borderTop: '1px solid var(--c-border)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic',
                    fontWeight: 600, fontSize: 15, color: 'var(--c-primary)',
                  }}>Enzo,</span>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 12,
                    color: 'var(--c-ink-faint)',
                  }}>fondateur de Bailio · 20 ans · École de commerce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOR WHO — 2 colonnes propriétaires / locataires
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--c-bg)',
        padding: 'clamp(56px,9vw,96px) clamp(16px,5vw,64px)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,52px)' }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--c-accent)', margin: '0 0 12px',
            }}>Pour qui ?</p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(28px,4.5vw,44px)', color: 'var(--c-ink)', margin: 0,
            }}>
              Une plateforme, deux bénéficiaires.
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {/* Propriétaires */}
            <div
              className="bail-reveal glass-mini"
              style={{ padding: 'clamp(24px,4vw,38px)', borderTop: '3px solid var(--c-primary)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--c-primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Key size={20} color="var(--c-primary)" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--c-primary)', marginBottom: 2,
                  }}>Propriétaires</div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600,
                    fontSize: 18, color: 'var(--c-ink)', lineHeight: 1.2,
                  }}>Gérez sans intermédiaire</div>
                </div>
              </div>
              {[
                'Publiez sans agence ni commission',
                'Dossiers locataires vérifiés par IA',
                'Bail signé électroniquement (eIDAS)',
                'Loyers encaissés automatiquement',
                'Interface mobile, zéro paperasse',
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <CheckCircle
                    size={14} color="var(--c-primary)" strokeWidth={2}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 13.5,
                    color: 'var(--c-ink-mid)', lineHeight: 1.5,
                  }}>{it}</span>
                </div>
              ))}
            </div>

            {/* Locataires */}
            <div
              className="bail-reveal bail-d1 glass-mini"
              style={{ padding: 'clamp(24px,4vw,38px)', borderTop: '3px solid var(--c-green)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--c-green-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Home size={20} color="var(--c-green)" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--c-green)', marginBottom: 2,
                  }}>Locataires</div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600,
                    fontSize: 18, color: 'var(--c-ink)', lineHeight: 1.2,
                  }}>Trouvez et restez serein</div>
                </div>
              </div>
              {[
                'Dossier constitué en moins de 2 min',
                'Zéro commission à votre charge',
                'Justificatifs vérifiés, signature sécurisée',
                'Quittances automatiques chaque mois',
                'Messagerie directe avec le propriétaire',
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <CheckCircle
                    size={14} color="var(--c-green)" strokeWidth={2}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 13.5,
                    color: 'var(--c-ink-mid)', lineHeight: 1.5,
                  }}>{it}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES — glass mini cards
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--c-muted)',
        borderTop: '1px solid var(--c-border)',
        padding: 'clamp(48px,7vw,80px) clamp(16px,5vw,64px)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(32px,5vw,52px)' }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--c-accent)', margin: '0 0 12px',
            }}>Fonctionnalités</p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(26px,4vw,40px)', color: 'var(--c-ink)', margin: 0,
            }}>
              Tout ce dont vous avez besoin.
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 14,
          }}>
            {[
              {
                Icon: FileText,
                title: 'Dossiers vérifiés par IA',
                desc: "Analyse automatique des justificatifs. Score de solvabilité instantané, zéro manipulation manuelle.",
                color: 'var(--c-primary)',
              },
              {
                Icon: PenTool,
                title: 'Signature eIDAS',
                desc: "Bail et état des lieux signés en ligne. Valeur juridique garantie par la réglementation européenne.",
                color: 'var(--c-accent)',
              },
              {
                Icon: CreditCard,
                title: 'Paiements automatiques',
                desc: "Loyers encaissés chaque mois, quittances générées et envoyées sans la moindre intervention.",
                color: 'var(--c-green)',
              },
            ].map(({ Icon, title, desc, color }, i) => (
              <div
                key={i}
                className={`glass-mini bail-reveal bail-d${i + 1}`}
                style={{ padding: 'clamp(20px,3vw,28px)' }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: 'var(--c-muted)', border: '1px solid var(--c-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={20} color={color} strokeWidth={1.8} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18,
                  color: 'var(--c-ink)', marginBottom: 8, lineHeight: 1.3,
                }}>
                  {title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'var(--c-ink-mid)', lineHeight: 1.65,
                }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST SIGNAL — RGPD / sécurité
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--c-surface)',
        borderTop: '1px solid var(--c-border)',
        padding: 'clamp(40px,6vw,64px) clamp(16px,5vw,64px)',
      }}>
        <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
          <div className="bail-reveal">
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: 'var(--c-green-light)', border: '1px solid var(--c-green-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <Shield size={22} color="var(--c-green)" strokeWidth={1.8} />
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(20px,3vw,28px)', color: 'var(--c-ink)',
              margin: '0 0 12px',
            }}>
              Vos données sont protégées.
            </h3>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 14,
              color: 'var(--c-ink-mid)', lineHeight: 1.72, margin: 0,
            }}>
              Bailio est conforme au <strong style={{ color: 'var(--c-ink)' }}>RGPD</strong>.
              Vos données personnelles ne sont jamais vendues ni partagées avec des tiers.
              L'inscription à la liste d'attente ne crée aucun compte et n'implique aucun engagement.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SOCIAL
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--c-bg)',
        borderTop: '1px solid var(--c-border)',
        padding: 'clamp(40px,6vw,64px) clamp(16px,5vw,64px)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div className="bail-reveal" style={{ marginBottom: 28 }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--c-accent)', margin: '0 0 10px',
            }}>
              Suivez l'aventure
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(22px,3.5vw,34px)', color: 'var(--c-ink)', margin: 0,
            }}>
              Restez au courant du lancement.
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {[
              {
                href: 'https://instagram.com/bailio.fr', handle: '@bailio.fr',
                desc: 'Coulisses du lancement', color: '#e1306c',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/>
                  </svg>
                ),
              },
              {
                href: 'https://twitter.com/bailiofr', handle: '@bailiofr',
                desc: 'Actualités produit', color: 'var(--c-ink)',
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                ),
              },
              {
                href: 'https://linkedin.com/company/bailio', handle: 'Bailio',
                desc: 'Vision & immobilier', color: '#0a66c2',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
                    <rect x="2" y="9" width="4" height="12"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                ),
              },
              {
                href: 'https://facebook.com/bailio.immobilier', handle: 'Bailio Immobilier',
                desc: 'Actualités & nouveautés', color: '#1877f2',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.428c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                ),
              },
            ].map((s, i) => (
              <a
                key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                className={`soc-card bail-reveal bail-d${(i % 4) + 1}`}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'var(--c-muted)', border: '1px solid var(--c-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.color, flexShrink: 0,
                }}>
                  {s.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                    color: 'var(--c-ink)', lineHeight: 1.2,
                  }}>{s.handle}</div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'var(--c-ink-faint)', marginTop: 2,
                  }}>{s.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER MINIMAL
      ══════════════════════════════════════════════════════════════════ */}
      <footer style={{
        background: 'var(--c-night)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: 'clamp(20px,4vw,32px) clamp(16px,5vw,48px)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between',
          gap: 16,
        }}>
          <BailioWordmark fontSize={18} light />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px,3vw,28px)', alignItems: 'center' }}>
            {[
              { label: 'Mentions légales', href: '/legal' },
              { label: 'Confidentialité', href: '/privacy' },
              { label: 'CGU', href: '/terms' },
              { label: 'Contact', href: 'mailto:hello@bailio.fr' },
            ].map((l, i) => (
              <a
                key={i} href={l.href}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'rgba(255,252,245,0.35)', textDecoration: 'none',
                  transition: 'color .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,252,245,0.72)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,252,245,0.35)')}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'rgba(255,252,245,0.20)',
          }}>
            © {new Date().getFullYear()} Bailio · Tous droits réservés
          </div>
        </div>
      </footer>
    </>
  )
}
