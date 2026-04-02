import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const LAUNCH_DATE = new Date('2026-06-04T00:00:00Z')

// ─── Static data ──────────────────────────────────────────────────────────────

const CONF_COLORS = ['#1a3270', '#c4976a', '#1b5e3b', '#e4e1db', '#9e9b96', '#fdf5ec']
const PARTICLES = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  x: (i / 90) * 100 + Math.sin(i * 1.5) * 4,
  w: i % 3 === 2 ? (5 + (i % 7) * 1.5) * 2.4 : 5 + (i % 7) * 1.5,
  h: i % 3 === 2 ? (5 + (i % 7) * 1.5) * 0.4 : 5 + (i % 7) * 1.5,
  color: CONF_COLORS[i % CONF_COLORS.length],
  round: i % 3 === 1,
  dur: 2200 + (i % 11) * 250,
  delay: (i % 13) * 120,
  drift: Math.sin(i * 0.7) * 80,
}))

// Floating glass orbs — background atmosphere
const ORBS = [
  { size: 340, top: '-8%',  left: '-6%',  color: 'rgba(196,151,106,0.18)', dur: 9,   delay: 0 },
  { size: 260, top: '60%',  left: '-4%',  color: 'rgba(27,94,59,0.12)',    dur: 11,  delay: 2 },
  { size: 420, top: '-12%', left: '65%',  color: 'rgba(26,50,112,0.10)',   dur: 8,   delay: 1 },
  { size: 180, top: '70%',  left: '80%',  color: 'rgba(196,151,106,0.14)', dur: 10,  delay: 3 },
  { size: 300, top: '40%',  left: '40%',  color: 'rgba(27,94,59,0.06)',    dur: 13,  delay: 0.5 },
]

// Desktop building silhouettes — outline style on light bg
// [left%, width%, height(px), strokeOpacity]
const BUILDINGS: [number, number, number, number][] = [
  [0,   5.5, 300, 0.07],
  [4.5, 3.5, 538, 0.05],
  [7.5, 6.5, 226, 0.06],
  [13,  4,   680, 0.05],
  [16.5,7,   354, 0.07],
  [23,  3.5, 468, 0.05],
  [26,  5.5, 246, 0.06],
  [31,  8,   397, 0.07],
  [38,  4,   600, 0.05],
  [41.5,6.5, 272, 0.06],
  [47,  3.5, 738, 0.04],
  [50,  5.5, 328, 0.06],
  [55,  7.5, 215, 0.07],
  [62,  4.5, 508, 0.05],
  [66,  6,   380, 0.06],
  [71.5,3.5, 620, 0.05],
  [74.5,6,   277, 0.07],
  [80,  7.5, 200, 0.06],
  [87,  4.5, 446, 0.05],
  [91,  5.5, 340, 0.06],
  [96,  5,   502, 0.05],
]

const FEATURES = [
  {
    title: 'Dossiers vérifiés par IA',
    desc: 'Analyse automatique des justificatifs en quelques secondes. Score de solvabilité instantané.',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b5e3b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    accent: '#1b5e3b', accentBg: 'rgba(27,94,59,0.06)',
  },
  {
    title: 'Signature eIDAS',
    desc: 'Bail et état des lieux signés en ligne, valeur juridique garantie par la réglementation européenne.',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a3270" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
    accent: '#1a3270', accentBg: 'rgba(26,50,112,0.06)',
  },
  {
    title: 'Paiements automatiques',
    desc: 'Loyers encaissés chaque mois, quittances générées et envoyées sans intervention.',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    accent: '#c4976a', accentBg: 'rgba(196,151,106,0.08)',
  },
  {
    title: 'Messagerie sécurisée',
    desc: 'Canal dédié propriétaire–locataire, traçable et archivé. Chaque échange est horodaté.',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b5e3b" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    accent: '#1b5e3b', accentBg: 'rgba(27,94,59,0.06)',
  },
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }

@keyframes wUp {
  from { opacity:0; transform:translateY(20px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fIn {
  from { opacity:0; }
  to   { opacity:1; }
}
@keyframes cfFall {
  0%   { opacity:1; transform:translateY(0) rotate(0deg) translateX(0); }
  100% { opacity:0; transform:translateY(110vh) rotate(740deg) translateX(var(--d,0px)); }
}
@keyframes drawCircle {
  from { stroke-dashoffset:283; }
  to   { stroke-dashoffset:0; }
}
@keyframes drawCheck {
  from { stroke-dashoffset:60; }
  to   { stroke-dashoffset:0; }
}
@keyframes popIn {
  0%   { opacity:0; transform:scale(0.82) translateY(10px); }
  65%  { transform:scale(1.04); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes slideUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes orbDrift {
  0%,100% { transform:translate(0,0) scale(1); }
  33%     { transform:translate(18px,-14px) scale(1.06); }
  66%     { transform:translate(-12px,16px) scale(0.94); }
}
@keyframes arrowPulse {
  0%,100% { transform:translateX(0); }
  50%     { transform:translateX(5px); }
}
@keyframes borderShimmer {
  0%,100% { border-color:rgba(255,255,255,0.75); }
  50%     { border-color:rgba(255,255,255,0.95); }
}

/* Scroll reveal */
.bail-reveal {
  opacity:0; transform:translateY(28px);
  transition:opacity .7s ease, transform .7s ease;
}
.bail-reveal.vis { opacity:1; transform:translateY(0); }
.bail-d1 { transition-delay:.1s!important; }
.bail-d2 { transition-delay:.22s!important; }
.bail-d3 { transition-delay:.36s!important; }
.bail-d4 { transition-delay:.5s!important; }

/* Light glassmorphism card */
.glass-card {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  border: 1px solid rgba(255,255,255,0.85);
  border-top: 1px solid rgba(255,255,255,0.98);
  border-radius: 24px;
  box-shadow:
    0 8px 48px rgba(26,50,112,0.08),
    0 2px 16px rgba(26,50,112,0.04),
    0 1px 0 rgba(255,255,255,0.9) inset;
  animation: borderShimmer 6s ease-in-out infinite;
}

/* Underline inputs — light */
.bail-inp {
  background: transparent;
  border: none;
  border-bottom: 1.5px solid rgba(26,50,112,0.18);
  outline: none;
  width: 100%;
  padding: 10px 0 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: #1a3270;
  transition: border-color .3s;
  -webkit-appearance: none;
}
.bail-inp::placeholder { color: rgba(26,50,112,0.28); }
.bail-inp:focus { border-bottom-color: rgba(196,151,106,0.8); }

.bail-grp { position: relative; margin-bottom: 20px; }
.bail-lbl {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(26,50,112,0.38); margin-bottom: 2px;
}
.bail-bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 1.5px; background: #c4976a;
  transform: scaleX(0); transform-origin: left;
  transition: transform .35s ease;
}
.bail-grp:focus-within .bail-bar { transform: scaleX(1); }

/* CTA */
.bail-cta {
  width: 100%; padding: 14px 24px;
  background: #1a3270; color: #fff;
  border: none; border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  gap: 10px; letter-spacing: .01em;
  transition: background .25s, box-shadow .25s, opacity .25s;
  box-shadow: 0 4px 24px rgba(26,50,112,0.28);
}
.bail-cta:hover:not(:disabled) { background: #142560; box-shadow: 0 6px 32px rgba(26,50,112,0.38); }
.bail-cta:disabled { opacity: 0.38; cursor: default; box-shadow: none; }

/* Social cards */
.soc-card {
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 14px; padding: 16px 22px;
  text-decoration: none;
  box-shadow: 0 2px 16px rgba(26,50,112,0.07);
  transition: transform .2s ease, box-shadow .2s ease;
  min-width: 200px; flex: 1 1 200px;
}
.soc-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(26,50,112,0.12);
}

/* City skyline desktop */
.city-skyline { display: none; }
@media (min-width: 900px) {
  .city-skyline { display: block; }
  .edge-wins { display: none; }
}
`

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    function calc() {
      const diff = Math.max(0, target.getTime() - Date.now())
      setT({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) })
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id)
  }, [target])
  return t
}

// ─── Components ───────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {PARTICLES.map(p => (
        <div key={p.id} style={{ position: 'absolute', top: -20, left: `${p.x}%`, width: p.w, height: p.h, background: p.color, borderRadius: p.round ? '50%' : '1px', animation: `cfFall ${p.dur}ms ease-in ${p.delay}ms forwards`, '--d': `${p.drift}px` } as React.CSSProperties} />
      ))}
    </div>
  )
}

// Logo wordmark: "Bailio." — italic serif navy + caramel dot
function BailioWordmark({ fontSize = 22 }: { fontSize?: number }) {
  return (
    <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize, color: '#1a3270', letterSpacing: '-0.01em', lineHeight: 1 }}>
      Bailio<span style={{ color: '#c4976a' }}>.</span>
    </span>
  )
}

function CDUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 36 }}>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3.5vw,32px)', color: '#1a3270', lineHeight: 1 }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,50,112,0.35)', marginTop: 3 }}>{label}</div>
    </div>
  )
}

function SuccessBlock({ isEarlyAccess, alreadyRegistered, firstName }: { isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string }) {
  return (
    <div style={{ animation: 'slideUp .5s ease forwards' }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ marginBottom: 14 }}>
        <circle cx="26" cy="26" r="24" stroke="#1b5e3b" strokeWidth="2.5" strokeDasharray="283" strokeDashoffset="283"
          style={{ animation: 'drawCircle .8s ease .1s forwards' }} />
        <polyline points="14,27 21,34 38,18" stroke="#1b5e3b" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60"
          style={{ animation: 'drawCheck .45s ease .9s forwards' }} />
      </svg>
      <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3.5vw,34px)', color: '#1a3270', margin: '0 0 10px', lineHeight: 1.2 }}>
        {alreadyRegistered ? 'Déjà inscrit !' : firstName ? `Bienvenue, ${firstName} !` : 'Vous êtes sur la liste !'}
      </h2>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'rgba(26,50,112,0.5)', lineHeight: 1.75, margin: '0 0 18px' }}>
        {alreadyRegistered
          ? 'Cette adresse est déjà enregistrée. Vous serez parmi les premiers prévenus.'
          : "Inscription confirmée. Un email de bienvenue vient d'être envoyé."}
      </p>
      {isEarlyAccess && !alreadyRegistered && (
        <div style={{ animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) 1.4s both', background: 'rgba(196,151,106,0.08)', border: '1px solid rgba(196,151,106,0.3)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4976a', flexShrink: 0, marginTop: 3, boxShadow: '0 0 8px rgba(196,151,106,.5)' }} />
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#c4976a', marginBottom: 3 }}>Early Access · 150 premiers</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#5a5754', lineHeight: 1.55 }}>
              <strong style={{ color: '#1a3270' }}>1 mois offert</strong> sur le plan Pro au lancement. Aucune action requise.
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
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isEarlyAccess, setIsEarlyAccess] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [, setTotalCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const cd = useCountdown(LAUNCH_DATE)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
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
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target) } }),
      { threshold: 0.1 }
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
        body: JSON.stringify({ email: email.trim().toLowerCase(), firstName: firstName.trim() || undefined }),
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

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,5vw,48px)',
        background: scrolled ? 'rgba(250,250,248,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(26,50,112,0.08)' : '1px solid transparent',
        transition: 'background .4s, border-color .4s',
      }}>
        <BailioWordmark fontSize={20} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1b5e3b', boxShadow: '0 0 5px rgba(27,94,59,.6)' }} />
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,50,112,0.45)' }}>
            Liste d'attente ouverte
          </span>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — light, airy, glassmorphisme
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ minHeight: '100svh', background: '#fafaf8', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(72px,10vw,100px) clamp(16px,4vw,40px) 48px' }}>

        {/* ── Ambient color orbs ── */}
        {ORBS.map((o, i) => (
          <div key={i} style={{
            position: 'absolute', top: o.top, left: o.left,
            width: o.size, height: o.size,
            borderRadius: '50%',
            background: o.color,
            filter: 'blur(80px)',
            animation: `orbDrift ${o.dur}s ease-in-out ${o.delay}s infinite`,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        ))}

        {/* ── Desktop building silhouettes (outline) ── */}
        <div className="city-skyline" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '90%', pointerEvents: 'none', zIndex: 1 }}>
          {BUILDINGS.map(([l, w, h, op], i) => {
            const roofH = 8 + (i % 3) * 5
            return (
              <div key={i} style={{
                position: 'absolute', bottom: 0, left: `${l}%`, width: `${w}%`, height: h,
                background: 'transparent',
                border: `1px solid rgba(26,50,112,${op})`,
                borderBottom: 'none',
              }}>
                {/* Window grid — very subtle */}
                <div style={{
                  position: 'absolute', inset: '12px 6px 0',
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent 0, transparent 13px, rgba(26,50,112,${op * 0.6}) 13px, rgba(26,50,112,${op * 0.6}) 14px),
                    repeating-linear-gradient(90deg, transparent 0, transparent 16px, rgba(26,50,112,${op * 0.6}) 16px, rgba(26,50,112,${op * 0.6}) 17px)
                  `,
                }} />
                {/* Roof */}
                <div style={{ position: 'absolute', top: -roofH, left: i % 4 === 0 ? '15%' : '25%', width: i % 4 === 0 ? '70%' : '50%', height: roofH, border: `1px solid rgba(26,50,112,${op})`, borderBottom: 'none', background: 'transparent' }} />
              </div>
            )
          })}
          {/* Ground line */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'rgba(26,50,112,0.08)' }} />
          {/* Fade at bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, #fafaf8 0%, transparent 100%)' }} />
        </div>

        {/* ── Giant ghost "Bailio." watermark ── */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
          <span style={{
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(130px,20vw,280px)',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(26,50,112,0.05)',
            lineHeight: 1, userSelect: 'none',
            letterSpacing: '-0.02em', whiteSpace: 'nowrap',
          }}>Bailio.</span>
        </div>

        {/* ── Glass form card ── */}
        <div className="glass-card" style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 500,
          padding: 'clamp(28px,5vw,48px) clamp(24px,5vw,44px)',
          animation: 'fIn .9s ease .1s both',
        }}>
          {/* Card top */}
          <div style={{ marginBottom: 28 }}>
            {/* Logo + badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <BailioWordmark fontSize={26} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(27,94,59,0.07)', border: '1px solid rgba(27,94,59,0.15)', borderRadius: 20, padding: '4px 12px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1b5e3b', boxShadow: '0 0 4px rgba(27,94,59,.7)' }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1b5e3b' }}>Liste d'attente</span>
              </div>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(30px,4.5vw,46px)', color: '#1a3270', lineHeight: 1.08, margin: '0 0 4px' }}>
              {['La', 'location'].map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', opacity: 0, animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.35 + i * 0.12}s forwards` }}>{w}</span>
              ))}
              <br />
              {['sans', 'agence.'].map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', color: '#c4976a', opacity: 0, animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.60 + i * 0.12}s forwards` }}>{w}</span>
              ))}
            </h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'rgba(26,50,112,0.5)', lineHeight: 1.72, margin: '12px 0 0', opacity: 0, animation: 'fIn .7s ease 1.0s forwards' }}>
              Dossiers IA · Bail eIDAS · Paiements automatiques. La première plateforme de location 100% sans agence.
            </p>

            {/* Countdown */}
            <div style={{ display: 'flex', gap: 'clamp(10px,3vw,20px)', padding: '16px 0', marginTop: 18, borderTop: '1px solid rgba(26,50,112,0.07)', borderBottom: '1px solid rgba(26,50,112,0.07)', opacity: 0, animation: 'fIn .7s ease 1.2s forwards' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,50,112,0.3)', alignSelf: 'center', flexShrink: 0 }}>Lancement</div>
              <div style={{ flex: 1, height: 1, background: 'rgba(26,50,112,0.06)', alignSelf: 'center' }} />
              <CDUnit value={cd.days} label="Jours" />
              <div style={{ width: 1, background: 'rgba(26,50,112,0.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.hours} label="Heures" />
              <div style={{ width: 1, background: 'rgba(26,50,112,0.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.minutes} label="Min" />
              <div style={{ width: 1, background: 'rgba(26,50,112,0.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.seconds} label="Sec" />
            </div>
          </div>

          {/* Form / Success */}
          <div style={{ opacity: 0, animation: 'fIn .7s ease 1.4s forwards' }}>
            {!success ? (
              <form onSubmit={submit}>
                <div className="bail-grp">
                  <label className="bail-lbl">Prénom (optionnel)</label>
                  <input className="bail-inp" type="text" placeholder="Thomas" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                  <div className="bail-bar" />
                </div>
                <div className="bail-grp">
                  <label className="bail-lbl">Adresse email</label>
                  <input className="bail-inp" type="email" placeholder="thomas@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                  <div className="bail-bar" />
                </div>
                <button type="submit" disabled={loading || !emailValid} className="bail-cta" style={{ opacity: !emailValid && !loading ? 0.42 : 1 }}>
                  {loading
                    ? <span style={{ letterSpacing: '0.4em', fontSize: 18 }}>···</span>
                    : <>Rejoindre la liste <span style={{ display: 'inline-block', animation: emailValid ? 'arrowPulse 1.4s ease-in-out infinite' : 'none' }}>→</span></>
                  }
                </button>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10.5, color: 'rgba(26,50,112,0.28)', margin: '10px 0 0', textAlign: 'center' }}>
                  Gratuit · Aucune carte · Désabonnement en un clic
                </p>
              </form>
            ) : (
              <SuccessBlock isEarlyAccess={isEarlyAccess} alreadyRegistered={alreadyRegistered} firstName={firstName} />
            )}
          </div>

          {/* Card footer — mini stats */}
          <div style={{ display: 'flex', marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(26,50,112,0.06)' }}>
            {[{ val: '0 €', label: 'Commission' }, { val: '< 2 min', label: 'Dossier' }, { val: 'eIDAS', label: '100% légal' }].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(26,50,112,0.06)' : 'none' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 15, color: '#1a3270', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, color: 'rgba(26,50,112,0.35)', marginTop: 3, letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade to next section */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, #ffffff 0%, transparent 100%)', pointerEvents: 'none', zIndex: 5 }} />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SCROLL SECTIONS — clean, editorial
      ═══════════════════════════════════════════════════════════════════ */}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', padding: 'clamp(56px,9vw,104px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,68px)' }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9e9b96', margin: '0 0 14px' }}>Comment ça marche</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4.5vw,48px)', color: '#1a3270', margin: 0 }}>Simple. Rapide. Légal.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(32px,5vw,52px)' }}>
            {[
              { n: '1', title: 'Publiez votre bien', desc: 'Annonce professionnelle en 5 minutes. Photos, description, loyer — depuis votre téléphone.' },
              { n: '2', title: 'Sélectionnez', desc: 'Dossiers vérifiés par IA, scoring automatique, bail eIDAS en ligne. Zéro paperasse.' },
              { n: '3', title: 'Gérez sereinement', desc: "Loyers encaissés, quittances générées, messagerie archivée. Bailio s'occupe du reste." },
            ].map((step, i) => (
              <div key={i} className={`bail-reveal bail-d${i + 1}`} style={{ position: 'relative' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(80px,12vw,116px)', color: 'rgba(26,50,112,0.05)', lineHeight: 1, position: 'absolute', top: -18, left: -6, zIndex: 0, userSelect: 'none' }}>{step.n}</div>
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 40 }}>
                  <div style={{ width: 24, height: 2, background: '#c4976a', marginBottom: 14 }} />
                  <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, fontSize: 21, color: '#1a3270', margin: '0 0 9px', lineHeight: 1.3 }}>{step.title}</h3>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: '#5a5754', lineHeight: 1.72, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section style={{ background: '#fafaf8', padding: 'clamp(44px,7vw,68px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className={`bail-reveal bail-d${i % 4 + 1}`} style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 2px rgba(26,50,112,.03), 0 4px 12px rgba(26,50,112,.04)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: f.accentBg, border: `1px solid ${f.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, fontSize: 16, color: '#1a3270', marginBottom: 5, lineHeight: 1.3 }}>{f.title}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, color: '#9e9b96', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUDIENCE CARDS ───────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {/* Propriétaires — navy */}
          <div className="bail-reveal" style={{ background: '#1a3270', borderRadius: 18, padding: 'clamp(28px,4vw,40px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(196,151,106,0.12)', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4976a', marginBottom: 5 }}>Propriétaires</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 23, color: '#ffffff', marginBottom: 22, lineHeight: 1.2 }}>Vous gérez votre bien</div>
            {['Publiez sans agence ni commission', 'Dossiers locataires vérifiés par IA', 'Bail signé électroniquement (eIDAS)', 'Loyers encaissés automatiquement', 'Interface mobile, zéro paperasse'].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c4976a', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.65)' }}>{it}</span>
              </div>
            ))}
          </div>
          {/* Locataires — green tint */}
          <div className="bail-reveal bail-d1" style={{ background: 'rgba(27,94,59,0.04)', borderRadius: 18, padding: 'clamp(28px,4vw,40px)', border: '1px solid rgba(27,94,59,0.12)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(27,94,59,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1b5e3b', marginBottom: 5 }}>Locataires</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 23, color: '#1a3270', marginBottom: 22, lineHeight: 1.2 }}>Vous cherchez un logement</div>
            {['Dossier constitué en moins de 2 min', 'Zéro commission à votre charge', 'Justificatifs vérifiés, signature sécurisée', 'Quittances automatiques chaque mois', 'Messagerie directe avec le propriétaire'].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1b5e3b', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#5a5754' }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LA PROMESSE ──────────────────────────────────────────────── */}
      <section style={{ background: '#fafaf8', padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,56px)' }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9e9b96', margin: '0 0 14px' }}>La promesse Bailio</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,44px)', color: '#1a3270', margin: 0 }}>La location telle qu'elle devrait être.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2 }}>
            {[
              { n: '01', title: 'Zéro intermédiaire', body: 'Pas d\'agence, pas de frais cachés. Propriétaire et locataire se trouvent directement, en toute transparence.', dark: false },
              { n: '02', title: 'Tout est légal', body: 'Chaque étape — dossier, bail, paiement — respecte le cadre juridique français et européen. Aucun risque.', dark: true },
              { n: '03', title: 'Depuis votre téléphone', body: 'Publiez, sélectionnez, signez et encaissez sans jamais ouvrir un ordinateur. Bailio est mobile-first.', dark: false },
            ].map((item, i) => (
              <div key={i} className={`bail-reveal bail-d${i + 1}`} style={{ background: item.dark ? '#1a3270' : '#ffffff', border: '1px solid', borderColor: item.dark ? '#1a3270' : '#e4e1db', padding: 'clamp(24px,4vw,36px)', borderRadius: i === 1 ? 0 : 0 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', color: item.dark ? 'rgba(196,151,106,.7)' : '#c4976a', marginBottom: 18 }}>{item.n}</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(20px,2.5vw,26px)', color: item.dark ? '#ffffff' : '#1a3270', margin: '0 0 12px', lineHeight: 1.2 }}>{item.title}</h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: item.dark ? 'rgba(255,255,255,.55)' : '#5a5754', lineHeight: 1.72, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL ───────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', padding: 'clamp(40px,6vw,64px) clamp(16px,5vw,64px)', borderTop: '1px solid #e4e1db' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div className="bail-reveal">
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9e9b96', margin: '0 0 10px' }}>Suivez l'aventure</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3.5vw,36px)', color: '#1a3270', margin: '0 0 32px' }}>Restez au courant du lancement.</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              {[
                { href: 'https://instagram.com/bailio.fr', handle: '@bailio.fr', desc: 'Coulisses du lancement', color: '#e1306c', bg: 'rgba(225,48,108,0.08)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/></svg> },
                { href: 'https://twitter.com/bailiofr', handle: '@bailiofr', desc: 'Actualités produit', color: '#1a3270', bg: 'rgba(26,50,112,0.08)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { href: 'https://linkedin.com/company/bailio', handle: 'Bailio', desc: 'Vision & immobilier', color: '#0a66c2', bg: 'rgba(10,102,194,0.08)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className={`soc-card bail-reveal bail-d${i + 1}`}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 8px 32px rgba(26,50,112,0.12)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '0 2px 16px rgba(26,50,112,0.07)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: '#1a3270', lineHeight: 1.2 }}>{s.handle}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11.5, color: '#9e9b96', marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4d1cb" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background: '#fafaf8', borderTop: '1px solid #e4e1db', padding: 'clamp(20px,4vw,32px) clamp(16px,5vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <BailioWordmark fontSize={18} />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(26,50,112,0.25)', margin: 0 }}>
            © 2026 Bailio. Tous droits réservés.
          </p>
        </div>
      </footer>
    </>
  )
}
