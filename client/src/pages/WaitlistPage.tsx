import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const LAUNCH_DATE = new Date('2026-09-01T00:00:00Z')

// ─── Static deterministic data ────────────────────────────────────────────────

const STARS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  top: ((i * 41 + 13) % 78) + 3,
  left: ((i * 67 + 9) % 94) + 3,
  size: i % 6 === 0 ? 2 : 1,
  dur: 2.2 + (i % 6) * 0.6,
  delay: (i * 0.31) % 4,
}))

// Tiny lit windows on distant buildings at edges
const WINDOWS = [
  // Left wall
  ...[0,1,2,3,4,5,6,7].map(i => ({
    top: 10 + i * 9, left: i % 2 === 0 ? 1.5 : 4.5,
    lit: i % 3 !== 1, delay: (i * 0.7) % 4,
  })),
  // Right wall
  ...[0,1,2,3,4,5,6,7].map(i => ({
    top: 8 + i * 9.5, left: i % 2 === 0 ? 93.5 : 96.5,
    lit: i % 3 !== 2, delay: (i * 0.9 + 0.5) % 4,
  })),
]

const CONF_COLORS = ['#c4976a', '#fdf5ec', '#f3c99a', '#1a1a2e', '#5a5754', '#e4e1db', '#9e9b96']
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

const FEATURES = [
  {
    title: 'Dossiers vérifiés par IA',
    desc: 'Analyse automatique des justificatifs en quelques secondes. Score de solvabilité instantané.',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  },
  {
    title: 'Signature eIDAS',
    desc: 'Bail et état des lieux signés en ligne, valeur juridique garantie par la réglementation européenne.',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  },
  {
    title: 'Paiements automatiques',
    desc: 'Loyers encaissés chaque mois, quittances générées et envoyées sans intervention.',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  {
    title: 'Messagerie sécurisée',
    desc: 'Canal dédié propriétaire–locataire, traçable et archivé. Chaque échange est horodaté.',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }

@keyframes wUp {
  from { opacity:0; transform:translateY(22px); }
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
  0%   { opacity:0; transform:scale(0.82) translateY(12px); }
  65%  { transform:scale(1.04); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes slideUp {
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lampGlow {
  0%,100% { opacity:var(--lop,0.18); transform:translate(-50%,-50%) scale(1); }
  50%     { opacity:calc(var(--lop,0.18)*1.5); transform:translate(-50%,-50%) scale(1.08); }
}
@keyframes winFlicker {
  0%,80%,100% { opacity:1; }
  83%          { opacity:0.5; }
  88%          { opacity:0.85; }
}
@keyframes starBlink {
  0%,100% { opacity:0.12; }
  50%     { opacity:0.75; }
}
@keyframes arrowPulse {
  0%,100% { transform:translateX(0); }
  50%     { transform:translateX(5px); }
}
@keyframes floorScroll {
  from { background-position: 0 0; }
  to   { background-position: 0 80px; }
}
@keyframes borderPulse {
  0%,100% { border-color:rgba(255,255,255,0.1); }
  50%     { border-color:rgba(196,151,106,0.22); }
}

/* Scroll reveal */
.bail-reveal {
  opacity:0; transform:translateY(30px);
  transition:opacity .7s ease, transform .7s ease;
}
.bail-reveal.vis { opacity:1; transform:translateY(0); }
.bail-d1 { transition-delay:.1s!important; }
.bail-d2 { transition-delay:.22s!important; }
.bail-d3 { transition-delay:.36s!important; }
.bail-d4 { transition-delay:.5s!important; }

/* Glass card */
.glass {
  background: rgba(8,12,28,0.62);
  backdrop-filter: blur(32px) saturate(1.6);
  -webkit-backdrop-filter: blur(32px) saturate(1.6);
  border: 1px solid rgba(255,255,255,0.1);
  border-top: 1px solid rgba(255,255,255,0.2);
  border-radius: 22px;
  box-shadow:
    0 40px 100px rgba(0,0,0,0.7),
    0 1px 0 rgba(255,255,255,0.1) inset,
    0 0 0 1px rgba(196,151,106,0.05);
  animation: borderPulse 6s ease-in-out infinite;
}

/* Underline inputs */
.bail-inp {
  background:transparent; border:none;
  border-bottom:1.5px solid rgba(255,255,255,0.16);
  outline:none; width:100%;
  padding:10px 0 8px;
  font-family:'DM Sans',sans-serif; font-size:15px; color:#fff;
  transition:border-color .3s; -webkit-appearance:none;
}
.bail-inp::placeholder { color:rgba(255,255,255,0.25); }
.bail-inp:focus { border-bottom-color:rgba(196,151,106,0.75); }

.bail-grp { position:relative; margin-bottom:20px; }
.bail-lbl {
  display:block; font-family:'DM Sans',sans-serif;
  font-size:9px; font-weight:600; letter-spacing:0.15em;
  text-transform:uppercase; color:rgba(255,255,255,0.28); margin-bottom:2px;
}
.bail-bar {
  position:absolute; bottom:0; left:0; right:0; height:1.5px;
  background:#c4976a; transform:scaleX(0); transform-origin:left;
  transition:transform .35s ease;
}
.bail-grp:focus-within .bail-bar { transform:scaleX(1); }

/* CTA button */
.bail-cta {
  width:100%; padding:14px 24px;
  background:#c4976a; color:#fff; border:none; border-radius:8px;
  font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  gap:10px; letter-spacing:0.01em;
  transition:background .25s, box-shadow .25s, opacity .25s;
  box-shadow:0 4px 24px rgba(196,151,106,0.42);
}
.bail-cta:hover:not(:disabled) { background:#b8855a; box-shadow:0 6px 34px rgba(196,151,106,0.55); }
.bail-cta:disabled { opacity:0.38; cursor:default; box-shadow:none; }

/* Social */
.soc-btn {
  width:36px; height:36px; border-radius:8px;
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
  display:flex; align-items:center; justify-content:center;
  color:rgba(255,255,255,0.45); text-decoration:none;
  transition:color .2s, background .2s, border-color .2s;
}
.soc-btn:hover { color:#c4976a; background:rgba(196,151,106,0.1); border-color:rgba(196,151,106,0.3); }
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

// ─── Sub-components ───────────────────────────────────────────────────────────
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

function BailioMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="20" fill="#1a1a2e" />
      <text x="50" y="70" textAnchor="middle" fontFamily="'Cormorant Garamond',Georgia,serif" fontStyle="italic" fontWeight="700" fontSize="64" fill="#ffffff">B</text>
      <rect x="30" y="80" width="40" height="3" rx="1.5" fill="#c4976a" />
    </svg>
  )
}

function CDUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 36 }}>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3.5vw,32px)', color: '#ffffff', lineHeight: 1 }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.32)', marginTop: 3 }}>{label}</div>
    </div>
  )
}

function SuccessBlock({ isEarlyAccess, alreadyRegistered, firstName }: { isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string }) {
  return (
    <div style={{ animation: 'slideUp .5s ease forwards' }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ marginBottom: 14 }}>
        <circle cx="26" cy="26" r="24" stroke="#c4976a" strokeWidth="2.5" strokeDasharray="283" strokeDashoffset="283"
          style={{ animation: 'drawCircle .8s ease .1s forwards' }} />
        <polyline points="14,27 21,34 38,18" stroke="#c4976a" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60"
          style={{ animation: 'drawCheck .45s ease .9s forwards' }} />
      </svg>
      <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3.5vw,34px)', color: '#ffffff', margin: '0 0 10px', lineHeight: 1.2 }}>
        {alreadyRegistered ? 'Déjà inscrit !' : firstName ? `Bienvenue, ${firstName} !` : 'Vous êtes sur la liste !'}
      </h2>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'rgba(255,255,255,.48)', lineHeight: 1.75, margin: '0 0 18px' }}>
        {alreadyRegistered
          ? 'Cette adresse est déjà enregistrée. Vous serez parmi les premiers prévenus.'
          : "Inscription confirmée. Un email de bienvenue vient d'être envoyé."}
      </p>
      {isEarlyAccess && !alreadyRegistered && (
        <div style={{ animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) 1.4s both', background: 'rgba(253,245,236,0.08)', border: '1px solid rgba(243,201,154,0.35)', borderRadius: 10, padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c4976a', flexShrink: 0, marginTop: 3, boxShadow: '0 0 8px rgba(196,151,106,.8)' }} />
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#f3c99a', marginBottom: 3 }}>Early Access · 150 premiers</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.55 }}>
              <strong style={{ color: '#ffffff' }}>1 mois offert</strong> sur le plan Pro au lancement. Aucune action requise.
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
  const [totalCount, setTotalCount] = useState(0)
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
      { threshold: 0.12 }
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
        background: scrolled ? 'rgba(10,14,28,0.9)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(196,151,106,.2)' : '1px solid transparent',
        transition: 'background .4s, border-color .4s',
      }}>
        <BailioMark size={30} />
        {totalCount > 0 && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(255,255,255,.5)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 20, padding: '4px 13px', animation: 'fIn .5s ease' }}>
            <span style={{ color: '#c4976a', fontWeight: 600 }}>{totalCount.toLocaleString('fr-FR')}</span> inscrits
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — full atmosphere
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ minHeight: '100svh', background: '#0d1020', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(72px,10vw,100px) clamp(16px,4vw,40px) 48px' }}>

        {/* ── Stars ── */}
        {STARS.map(s => (
          <div key={s.id} style={{ position: 'absolute', top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, borderRadius: '50%', background: '#fff', animation: `starBlink ${s.dur}s ease-in-out ${s.delay}s infinite`, pointerEvents: 'none' }} />
        ))}

        {/* ── Ambient light pools (street lamps / interior glow) ── */}
        {[
          { top: '12%', left: '18%', size: 420, op: 0.12, dur: 4 },
          { top: '70%', left: '10%', size: 300, op: 0.09, dur: 5 },
          { top: '20%', left: '78%', size: 380, op: 0.11, dur: 3.5 },
          { top: '75%', left: '82%', size: 260, op: 0.08, dur: 4.8 },
          { top: '50%', left: '50%', size: 700, op: 0.04, dur: 6 },
        ].map((l, i) => (
          <div key={i} style={{
            position: 'absolute', top: l.top, left: l.left, pointerEvents: 'none',
            width: l.size, height: l.size,
            background: `radial-gradient(circle, rgba(196,151,106,${l.op}) 0%, transparent 65%)`,
            transform: 'translate(-50%,-50%)',
            animation: `lampGlow ${l.dur}s ease-in-out ${i * 0.7}s infinite`,
            '--lop': l.op,
          } as React.CSSProperties} />
        ))}

        {/* ── Tiny windows on distant buildings (edges) ── */}
        {WINDOWS.map((w, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${w.top}%`, left: `${w.left}%`,
            width: 14, height: 20,
            background: w.lit ? 'rgba(196,151,106,0.55)' : 'rgba(255,255,255,0.06)',
            borderRadius: 1,
            boxShadow: w.lit ? '0 0 8px 2px rgba(196,151,106,0.25)' : 'none',
            animation: w.lit ? `winFlicker ${3.5 + w.delay}s ease-in-out ${w.delay}s infinite` : 'none',
            pointerEvents: 'none',
          }} />
        ))}

        {/* ── Perspective floor grid (parquet / cobblestone) ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: '-30%', right: '-30%', height: '28%',
          backgroundImage: `
            linear-gradient(rgba(196,151,106,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,151,106,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          transform: 'perspective(380px) rotateX(52deg)',
          transformOrigin: 'bottom center',
          pointerEvents: 'none',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 100%)',
        }} />

        {/* ── Architectural lines (ceiling / wainscoting) ── */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(196,151,106,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '28%', left: 0, right: 0, height: 1, background: 'rgba(196,151,106,0.1)', pointerEvents: 'none' }} />

        {/* ── Giant ghost "Bailio" watermark ── */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 1,
          overflow: 'hidden',
        }}>
          <span style={{
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(120px, 22vw, 260px)',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.05)',
            lineHeight: 1,
            userSelect: 'none',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}>Bailio</span>
        </div>

        {/* ── Central glass card ── */}
        <div className="glass" style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 480,
          padding: 'clamp(28px,5vw,44px) clamp(24px,5vw,40px)',
          animation: 'fIn .9s ease .2s both',
        }}>
          {/* Card header */}
          <div style={{ marginBottom: 28 }}>
            {/* Bailio logo + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <BailioMark size={30} />
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: '#ffffff', lineHeight: 1 }}>Bailio</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginTop: 1 }}>Plateforme immobilière</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4976a', boxShadow: '0 0 6px rgba(196,151,106,.8)' }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, color: '#c4976a', letterSpacing: '0.06em' }}>Liste d'attente</span>
              </div>
            </div>

            {/* Main headline */}
            <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4.5vw,42px)', color: '#ffffff', lineHeight: 1.1, margin: '0 0 8px' }}>
              {['La', 'location'].map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', opacity: 0, animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.4 + i * 0.12}s forwards` }}>{w}</span>
              ))}
              <br />
              {['sans', 'agence.'].map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', color: '#c4976a', opacity: 0, animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.66 + i * 0.12}s forwards` }}>{w}</span>
              ))}
            </h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.7, margin: '0 0 22px', opacity: 0, animation: 'fIn .7s ease 1.1s forwards' }}>
              Dossiers IA · Signature eIDAS · Paiements automatiques. Rejoignez les premiers à découvrir Bailio.
            </p>

            {/* Countdown strip */}
            <div style={{ display: 'flex', gap: 'clamp(10px,3vw,20px)', padding: '14px 0', borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 24, opacity: 0, animation: 'fIn .7s ease 1.3s forwards' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', alignSelf: 'center', flexShrink: 0 }}>Lancement</div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)', alignSelf: 'center' }} />
              <CDUnit value={cd.days} label="Jours" />
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.hours} label="Heures" />
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.minutes} label="Min" />
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.seconds} label="Sec" />
            </div>
          </div>

          {/* Form or Success */}
          <div style={{ opacity: 0, animation: 'fIn .7s ease 1.5s forwards' }}>
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
                <button type="submit" disabled={loading || !emailValid} className="bail-cta">
                  {loading
                    ? <span style={{ letterSpacing: '0.4em', fontSize: 18 }}>···</span>
                    : <>
                        Rejoindre la liste
                        <span style={{ display: 'inline-block', animation: emailValid ? 'arrowPulse 1.4s ease-in-out infinite' : 'none' }}>→</span>
                      </>
                  }
                </button>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10.5, color: 'rgba(255,255,255,.2)', margin: '10px 0 0', textAlign: 'center' }}>
                  Gratuit · Aucune carte · Désabonnement en un clic
                </p>
              </form>
            ) : (
              <SuccessBlock isEarlyAccess={isEarlyAccess} alreadyRegistered={alreadyRegistered} firstName={firstName} />
            )}
          </div>

          {/* Card footer stats */}
          <div style={{ display: 'flex', gap: 0, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.06)' }}>
            {[{ val: '0 €', label: 'Commission' }, { val: '< 2 min', label: 'Dossier' }, { val: 'eIDAS', label: '100% légal' }].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: '#ffffff', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, color: 'rgba(255,255,255,.3)', marginTop: 3, letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom fade ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, #fafaf8 0%, transparent 100%)', pointerEvents: 'none', zIndex: 5 }} />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          BELOW FOLD — light editorial sections
      ═══════════════════════════════════════════════════════════════════ */}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ background: '#fafaf8', padding: 'clamp(56px,9vw,104px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,68px)' }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9e9b96', margin: '0 0 14px' }}>Comment ça marche</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4.5vw,48px)', color: '#0d0c0a', margin: 0 }}>Simple. Rapide. Légal.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(32px,5vw,52px)' }}>
            {[
              { n: '1', title: 'Publiez votre bien', desc: 'Annonce professionnelle en 5 minutes. Photos, description, loyer — tout depuis votre téléphone.' },
              { n: '2', title: 'Sélectionnez', desc: 'Dossiers vérifiés par IA, scoring automatique, bail eIDAS signé en ligne. Zéro paperasse.' },
              { n: '3', title: 'Gérez sereinement', desc: "Loyers encaissés, quittances générées, messagerie archivée. Bailio s'occupe du reste." },
            ].map((step, i) => (
              <div key={i} className={`bail-reveal bail-d${i + 1}`} style={{ position: 'relative' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(80px,12vw,116px)', color: '#f4f2ee', lineHeight: 1, position: 'absolute', top: -18, left: -6, zIndex: 0, userSelect: 'none' }}>{step.n}</div>
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 40 }}>
                  <div style={{ width: 24, height: 2, background: '#c4976a', marginBottom: 14 }} />
                  <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, fontSize: 21, color: '#0d0c0a', margin: '0 0 9px', lineHeight: 1.3 }}>{step.title}</h3>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: '#5a5754', lineHeight: 1.72, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section style={{ background: '#f4f2ee', padding: 'clamp(44px,7vw,68px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className={`bail-reveal bail-d${i % 4 + 1}`} style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 12, padding: '20px 18px', boxShadow: '0 1px 2px rgba(13,12,10,.04), 0 4px 12px rgba(13,12,10,.05)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: '#fdf5ec', border: '1px solid #f3c99a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, fontSize: 16, color: '#0d0c0a', marginBottom: 5, lineHeight: 1.3 }}>{f.title}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, color: '#9e9b96', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUDIENCE CARDS ───────────────────────────────────────────── */}
      <section style={{ background: '#fafaf8', padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          <div className="bail-reveal" style={{ background: '#1a1a2e', borderRadius: 16, padding: 'clamp(28px,4vw,40px)' }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4976a', marginBottom: 5 }}>Propriétaires</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: '#ffffff', marginBottom: 22, lineHeight: 1.2 }}>Vous gérez votre bien</div>
            {['Publiez sans agence ni commission', 'Dossiers locataires vérifiés par IA', 'Bail signé électroniquement (eIDAS)', 'Loyers encaissés automatiquement', 'Interface mobile, zéro paperasse'].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c4976a', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.65)' }}>{it}</span>
              </div>
            ))}
          </div>
          <div className="bail-reveal bail-d1" style={{ background: '#ffffff', borderRadius: 16, padding: 'clamp(28px,4vw,40px)', border: '1px solid #e4e1db', boxShadow: '0 1px 2px rgba(13,12,10,.04), 0 4px 12px rgba(13,12,10,.06)' }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: 5 }}>Locataires</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: '#0d0c0a', marginBottom: 22, lineHeight: 1.2 }}>Vous cherchez un logement</div>
            {['Dossier constitué en moins de 2 min', 'Zéro commission à votre charge', 'Justificatifs vérifiés, signature sécurisée', 'Quittances automatiques chaque mois', 'Messagerie directe avec le propriétaire'].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c4976a', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#5a5754' }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ───────────────────────────────────────────────── */}
      <section style={{ background: '#f4f2ee', padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,64px)', textAlign: 'center' }}>
        <div className="bail-reveal" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ width: 36, height: 2, background: '#c4976a', margin: '0 auto 24px' }} />
          <blockquote style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(18px,3vw,28px)', color: '#0d0c0a', lineHeight: 1.55, margin: '0 0 20px' }}>
            "Pour la première fois, j'ai loué mon appartement sans agence. Le bail était signé en moins d'une heure, tout depuis mon téléphone."
          </blockquote>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e4e1db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 15, color: '#9e9b96' }}>S</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: '#0d0c0a' }}>Sophie M.</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#9e9b96' }}>Propriétaire · Paris 11e</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background: '#1a1a2e', padding: 'clamp(28px,5vw,44px) clamp(16px,5vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <BailioMark size={28} />
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: '#ffffff' }}>Bailio</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.28)', letterSpacing: '0.05em' }}>Plateforme immobilière · 2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="https://instagram.com/bailio.fr" target="_blank" rel="noopener noreferrer" className="soc-btn" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/></svg>
            </a>
            <a href="https://twitter.com/bailiofr" target="_blank" rel="noopener noreferrer" className="soc-btn" aria-label="Twitter / X">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://linkedin.com/company/bailio" target="_blank" rel="noopener noreferrer" className="soc-btn" aria-label="LinkedIn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.18)', margin: 0, width: '100%', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)' }}>
            © 2026 Bailio. Tous droits réservés.
          </p>
        </div>
      </footer>
    </>
  )
}
