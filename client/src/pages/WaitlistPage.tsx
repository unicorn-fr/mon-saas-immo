import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const LAUNCH_DATE = new Date('2026-09-01T00:00:00Z')

// ─── Static data (outside component = no rerenders) ───────────────────────────

const STARS = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  top: ((i * 37 + 11) % 68) + 2,
  left: ((i * 53 + 7) % 96) + 2,
  big: i % 4 === 0,
  dur: 2 + (i % 5),
  delay: (i * 0.3) % 4,
}))

const CONF_COLORS = ['#c4976a', '#fdf5ec', '#f3c99a', '#1a1a2e', '#5a5754', '#e4e1db', '#9e9b96']
const PARTICLES = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  x: (i / 90) * 100 + Math.sin(i * 1.5) * 4,
  w: i % 3 === 2 ? (5 + (i % 7) * 1.5) * 2.4 : 5 + (i % 7) * 1.5,
  h: i % 3 === 2 ? (5 + (i % 7) * 1.5) * 0.4 : i % 3 === 1 ? 5 + (i % 7) * 1.5 : 5 + (i % 7) * 1.5,
  color: CONF_COLORS[i % CONF_COLORS.length],
  round: i % 3 === 1,
  dur: 2200 + (i % 11) * 250,
  delay: (i % 13) * 120,
  drift: Math.sin(i * 0.7) * 80,
  rot: i * 37,
}))

// Window data: [lit, hasShutter, animDelay]
type WinRow = [boolean, boolean, number][]
const FLOORS: WinRow[] = [
  [[true, false, 0], [false, true, 0.5], [true, false, 0.2], [false, false, 0]],
  [[false, true, 0.8], [true, false, 0.1], [false, false, 0], [true, true, 0.6]],
  [[true, false, 0.3], [false, false, 0], [true, true, 0.9], [false, false, 0]],
  [[false, false, 0], [true, false, 0.4], [false, true, 0.7], [true, false, 0.2]],
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

@keyframes wUp {
  from { opacity:0; transform:translateY(22px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fIn {
  from { opacity:0; }
  to   { opacity:1; }
}
@keyframes slideUp {
  from { opacity:0; transform:translateY(32px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes cfFall {
  0%   { opacity:1; transform:translateY(0) rotate(0deg) translateX(0); }
  100% { opacity:0; transform:translateY(110vh) rotate(720deg) translateX(var(--d,0px)); }
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
  0%   { opacity:0; transform:scale(0.85) translateY(10px); }
  70%  { transform:scale(1.03); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes winFlicker {
  0%,85%,100% { opacity:1; }
  88%          { opacity:0.65; }
  93%          { opacity:0.9; }
}
@keyframes curtSway {
  0%,100% { transform:scaleX(1) skewX(0deg); }
  50%     { transform:scaleX(0.94) skewX(1.8deg); }
}
@keyframes lampGlow {
  0%,100% { box-shadow:0 0 6px 3px rgba(196,151,106,.45),0 0 18px 8px rgba(196,151,106,.18); }
  50%     { box-shadow:0 0 11px 5px rgba(196,151,106,.6),0 0 28px 12px rgba(196,151,106,.25); }
}
@keyframes arrowBounce {
  0%,100% { transform:translateX(0); }
  50%     { transform:translateX(5px); }
}
@keyframes starBlink {
  0%,100% { opacity:.2; }
  50%     { opacity:.85; }
}
@keyframes ticker {
  0%   { transform:translateY(100%); opacity:0; }
  15%  { transform:translateY(0);    opacity:1; }
  85%  { transform:translateY(0);    opacity:1; }
  100% { transform:translateY(-100%);opacity:0; }
}

.bail-reveal {
  opacity:0;
  transform:translateY(28px);
  transition:opacity .65s ease, transform .65s ease;
}
.bail-reveal.vis { opacity:1; transform:translateY(0); }
.bail-d1 { transition-delay:.12s!important; }
.bail-d2 { transition-delay:.24s!important; }
.bail-d3 { transition-delay:.38s!important; }

.bail-inp {
  background:transparent;
  border:none;
  border-bottom:1.5px solid rgba(255,255,255,.2);
  outline:none;
  width:100%;
  padding:10px 0 8px;
  font-family:'DM Sans',sans-serif;
  font-size:15px;
  color:#fff;
  transition:border-color .3s;
  -webkit-appearance:none;
}
.bail-inp::placeholder { color:rgba(255,255,255,.3); }
.bail-inp:focus { border-bottom-color:rgba(196,151,106,.7); }

.bail-inp-group { position:relative; margin-bottom:22px; }
.bail-inp-bar {
  position:absolute;
  bottom:0; left:0; right:0;
  height:1.5px;
  background:#c4976a;
  transform:scaleX(0);
  transform-origin:left;
  transition:transform .35s ease;
}
.bail-inp-group:focus-within .bail-inp-bar { transform:scaleX(1); }

.bail-cta {
  width:100%;
  padding:15px 24px;
  background:#c4976a;
  color:#fff;
  border:none;
  border-radius:6px;
  font-family:'DM Sans',sans-serif;
  font-size:14px;
  font-weight:600;
  cursor:pointer;
  letter-spacing:.01em;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  transition:background .25s, box-shadow .25s, opacity .25s;
  box-shadow:0 4px 20px rgba(196,151,106,.32);
}
.bail-cta:hover { background:#b8865a; box-shadow:0 6px 28px rgba(196,151,106,.45); }
.bail-cta:disabled { background:rgba(196,151,106,.32); box-shadow:none; cursor:default; }

.social-btn {
  width:38px; height:38px; border-radius:8px;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.1);
  display:flex; align-items:center; justify-content:center;
  color:rgba(255,255,255,.5);
  text-decoration:none;
  transition:color .2s, background .2s, border-color .2s;
}
.social-btn:hover { color:#c4976a; background:rgba(196,151,106,.1); border-color:rgba(196,151,106,.3); }
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

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: -20, left: `${p.x}%`,
          width: p.w, height: p.h,
          background: p.color,
          borderRadius: p.round ? '50%' : '1px',
          animation: `cfFall ${p.dur}ms ease-in ${p.delay}ms forwards`,
          '--d': `${p.drift}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

// ─── BailioMark ───────────────────────────────────────────────────────────────
function BailioMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="20" fill="#1a1a2e" />
      <text x="50" y="70" textAnchor="middle" fontFamily="'Cormorant Garamond',Georgia,serif" fontStyle="italic" fontWeight="700" fontSize="64" fill="#ffffff">B</text>
      <rect x="30" y="80" width="40" height="3" rx="1.5" fill="#c4976a" />
    </svg>
  )
}

// ─── Parisian Facade (pure CSS) ───────────────────────────────────────────────
function Win({ lit, shutter, delay }: { lit: boolean; shutter: boolean; delay: number }) {
  return (
    <div style={{
      flex: 1, height: 42,
      border: '1.5px solid rgba(255,255,255,.13)',
      borderRadius: 2,
      background: lit ? '#1c140a' : '#090c18',
      overflow: 'hidden',
      position: 'relative',
      animation: lit ? `winFlicker ${3.5 + delay}s ease-in-out ${delay}s infinite` : 'none',
    }}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,.07)', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,.07)', transform: 'translateX(-50%)' }} />
      {lit && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 10%, rgba(196,151,106,.22) 0%, transparent 70%)' }} />}
      {lit && <>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '26%', background: 'rgba(180,140,88,.1)', transformOrigin: 'top left', animation: `curtSway ${4 + delay * 2}s ease-in-out ${delay}s infinite` }} />
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '26%', background: 'rgba(180,140,88,.1)', transformOrigin: 'top right', animation: `curtSway ${4.6 + delay}s ease-in-out ${delay + 0.4}s infinite alternate` }} />
      </>}
      {shutter && <>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '20%', background: 'rgba(255,255,255,.04)', borderRight: '1px solid rgba(255,255,255,.07)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '20%', background: 'rgba(255,255,255,.04)', borderLeft: '1px solid rgba(255,255,255,.07)' }} />
      </>}
    </div>
  )
}

function ParisianFacade() {
  return (
    <div style={{ width: '100%', maxWidth: 300, margin: '0 auto', userSelect: 'none', filter: 'drop-shadow(0 20px 60px rgba(0,0,0,.5))' }}>
      {/* Roof */}
      <div style={{ height: 30, background: '#0d1020', borderRadius: '6px 6px 0 0', border: '1.5px solid rgba(255,255,255,.1)', borderBottom: 'none', position: 'relative', overflow: 'hidden' }}>
        {[20, 50, 80].map((x, i) => (
          <div key={i} style={{ position: 'absolute', bottom: 0, left: `${x}%`, transform: 'translateX(-50%)', width: 20, height: 16, border: '1.5px solid rgba(255,255,255,.1)', borderBottom: 'none', borderRadius: '3px 3px 0 0', background: '#090c18' }} />
        ))}
        {[8, 60, 90].map((x, i) => (
          <div key={i} style={{ position: 'absolute', bottom: 0, left: `${x}%`, width: 9, height: [13, 18, 10][i], background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderBottom: 'none', borderRadius: '2px 2px 0 0' }} />
        ))}
      </div>

      {/* Facade body */}
      <div style={{ background: '#141826', border: '1.5px solid rgba(255,255,255,.09)', borderTop: 'none', borderBottom: 'none', padding: '0 14px' }}>
        {FLOORS.map((row, fi) => (
          <div key={fi}>
            <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
              {row.map(([lit, sh, d], wi) => <Win key={wi} lit={lit} shutter={sh} delay={d} />)}
            </div>
            {/* Balcony railing */}
            <div style={{ height: 14, position: 'relative', marginTop: 3 }}>
              <div style={{ position: 'absolute', top: 0, left: -14, right: -14, height: 2, background: 'rgba(255,255,255,.2)' }} />
              <div style={{ position: 'absolute', top: 2, left: -14, right: -14, bottom: 0, background: 'repeating-linear-gradient(90deg, transparent 0, transparent 6px, rgba(255,255,255,.13) 6px, rgba(255,255,255,.13) 8px)' }} />
            </div>
            {fi < FLOORS.length - 1 && <div style={{ height: 3, background: 'rgba(255,255,255,.03)', margin: '0 -14px', borderTop: '1px solid rgba(255,255,255,.06)' }} />}
          </div>
        ))}

        {/* Ground floor */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <Win lit={false} shutter={false} delay={0} />
          <div style={{ flex: 2, height: 52, border: '1.5px solid rgba(255,255,255,.14)', borderRadius: '50px 50px 0 0', borderBottom: 'none', background: '#040710', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 5 }}>
            <div style={{ width: 1.5, height: 26, background: 'rgba(255,255,255,.1)' }} />
          </div>
          <Win lit={true} shutter={false} delay={0.5} />
        </div>
      </div>

      {/* Sidewalk */}
      <div style={{ height: 16, background: '#0c0f1e', border: '1.5px solid rgba(255,255,255,.07)', borderTop: '2px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4976a', animation: 'lampGlow 2.8s ease-in-out infinite' }} />
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)', margin: '0 10px' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4976a', animation: 'lampGlow 2.8s ease-in-out 1.4s infinite' }} />
      </div>
    </div>
  )
}

// ─── Countdown unit ───────────────────────────────────────────────────────────
function CDUnit({ value, label, dark }: { value: number; label: string; dark?: boolean }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 40 }}>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: dark ? '#ffffff' : '#0d0c0a', lineHeight: 1 }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.35)' : '#9e9b96', marginTop: 3 }}>{label}</div>
    </div>
  )
}

// ─── Success ──────────────────────────────────────────────────────────────────
function SuccessBlock({ isEarlyAccess, alreadyRegistered, firstName }: { isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string }) {
  return (
    <div style={{ animation: 'slideUp .5s ease forwards' }}>
      <svg width="54" height="54" viewBox="0 0 54 54" fill="none" style={{ marginBottom: 14 }}>
        <circle cx="27" cy="27" r="25" stroke="#c4976a" strokeWidth="2.5" strokeDasharray="283" strokeDashoffset="283"
          style={{ animation: 'drawCircle .8s ease .1s forwards' }} />
        <polyline points="15,28 22,35 39,19" stroke="#c4976a" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="60" strokeDashoffset="60"
          style={{ animation: 'drawCheck .45s ease .9s forwards' }} />
      </svg>
      <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: '#ffffff', margin: '0 0 10px', lineHeight: 1.2 }}>
        {alreadyRegistered ? 'Déjà inscrit !' : firstName ? `Bienvenue, ${firstName} !` : 'Vous êtes sur la liste !'}
      </h2>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, margin: '0 0 18px', maxWidth: 360 }}>
        {alreadyRegistered
          ? 'Cette adresse est déjà enregistrée — vous serez parmi les premiers prévenus au lancement.'
          : "Inscription confirmée. Un email de bienvenue vient d'être envoyé."}
      </p>
      {isEarlyAccess && !alreadyRegistered && (
        <div style={{
          animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) 1.4s both',
          background: '#fdf5ec', border: '1px solid #f3c99a', borderRadius: 10,
          padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4976a', flexShrink: 0, marginTop: 3, boxShadow: '0 0 8px rgba(196,151,106,.7)' }} />
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400e', marginBottom: 3 }}>Early Access · 150 premiers</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#5a5754', lineHeight: 1.55 }}>
              <strong style={{ color: '#0d0c0a' }}>1 mois offert</strong> sur le plan Pro vous attend au lancement. Aucune action requise.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Feature cards data ───────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'Dossiers vérifiés par IA',
    desc: 'Analyse automatique des justificatifs en quelques secondes. Score de solvabilité instantané.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    title: 'Signature eIDAS',
    desc: 'Bail et état des lieux signés en ligne, valeur juridique garantie par la réglementation européenne.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    title: 'Paiements automatiques',
    desc: "Loyers encaissés chaque mois, quittances générées et envoyées sans intervention de votre part.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    title: 'Messagerie sécurisée',
    desc: 'Canal dédié propriétaire–locataire, traçable et archivé. Chaque échange est horodaté.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────
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
    const els = document.querySelectorAll('.bail-reveal')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target) } })
    }, { threshold: 0.1 })
    els.forEach(el => io.observe(el))
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
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,5vw,48px)',
        background: scrolled ? '#1a1a2e' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(196,151,106,.22)' : '1px solid transparent',
        transition: 'background .4s ease, border-color .4s ease',
      }}>
        <BailioMark size={32} />
        {totalCount > 0 && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.55)', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '4px 14px', animation: 'fIn .5s ease forwards' }}>
            <span style={{ color: '#c4976a', fontWeight: 600 }}>{totalCount.toLocaleString('fr-FR')}</span> inscrits
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100svh', background: '#1a1a2e', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: 'clamp(80px,14vw,120px) clamp(16px,5vw,64px) 56px' }}>
        {/* Stars */}
        {STARS.map(s => (
          <div key={s.id} style={{ position: 'absolute', top: `${s.top}%`, left: `${s.left}%`, width: s.big ? 2 : 1, height: s.big ? 2 : 1, borderRadius: '50%', background: 'rgba(255,255,255,.75)', animation: `starBlink ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
        ))}

        <div style={{ maxWidth: 1160, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,280px), 1fr))', gap: 'clamp(40px,8vw,96px)', alignItems: 'center' }}>

          {/* Building */}
          <div style={{ opacity: 0, animation: 'fIn 1.4s ease .2s forwards', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ParisianFacade />
          </div>

          {/* Content */}
          <div>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, opacity: 0, animation: 'wUp .5s ease .1s forwards' }}>
              <div style={{ width: 18, height: 1.5, background: '#c4976a' }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c4976a' }}>Automne 2026 · Rejoignez la liste</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(38px,5.5vw,64px)', color: '#ffffff', lineHeight: 1.08, margin: '0 0 4px' }}>
              {['La', 'location'].map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', opacity: 0, animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.3 + i * 0.12}s forwards` }}>{w}</span>
              ))}
              <br />
              {['sans', 'agence.'].map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', color: '#c4976a', opacity: 0, animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.56 + i * 0.12}s forwards` }}>{w}</span>
              ))}
            </h1>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,34px)', color: 'rgba(255,255,255,.35)', lineHeight: 1.2, margin: '0 0 24px' }}>
              {['Sans', 'commission.'].map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', opacity: 0, animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.82 + i * 0.12}s forwards` }}>{w}</span>
              ))}
            </h2>

            {/* Subtext */}
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: 'rgba(255,255,255,.42)', lineHeight: 1.75, margin: '0 0 32px', maxWidth: 390, opacity: 0, animation: 'fIn .8s ease 1.1s forwards' }}>
              Bailio réinvente la gestion locative en France — dossiers IA, signature eIDAS, paiements automatiques. Depuis votre téléphone, sans agence.
            </p>

            {/* Countdown */}
            <div style={{ display: 'flex', gap: 'clamp(12px,3vw,24px)', marginBottom: 36, opacity: 0, animation: 'fIn .8s ease 1.3s forwards' }}>
              <CDUnit value={cd.days} label="Jours" dark />
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.hours} label="Heures" dark />
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.minutes} label="Min" dark />
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)', alignSelf: 'stretch' }} />
              <CDUnit value={cd.seconds} label="Sec" dark />
            </div>

            {/* Form / Success */}
            <div style={{ maxWidth: 420, opacity: 0, animation: 'fIn .8s ease 1.5s forwards' }}>
              {!success ? (
                <form onSubmit={submit}>
                  <div className="bail-inp-group">
                    <label style={{ display: 'block', fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(255,255,255,.32)', marginBottom: 2 }}>Prénom (optionnel)</label>
                    <input className="bail-inp" type="text" placeholder="Thomas" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                    <div className="bail-inp-bar" />
                  </div>
                  <div className="bail-inp-group">
                    <label style={{ display: 'block', fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(255,255,255,.32)', marginBottom: 2 }}>Adresse email</label>
                    <input className="bail-inp" type="email" placeholder="thomas@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    <div className="bail-inp-bar" />
                  </div>
                  <button type="submit" disabled={loading || !emailValid} className="bail-cta" style={{ opacity: !emailValid && !loading ? 0.45 : 1 }}>
                    {loading
                      ? <span style={{ letterSpacing: '0.4em', fontSize: 18, lineHeight: 1 }}>···</span>
                      : <>Rejoindre la liste <span style={{ display: 'inline-block', animation: emailValid ? 'arrowBounce 1.4s ease-in-out infinite' : 'none' }}>→</span></>
                    }
                  </button>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.22)', margin: '12px 0 0', textAlign: 'center' }}>Gratuit · Aucune carte requise · Désabonnement en un clic</p>
                </form>
              ) : (
                <SuccessBlock isEarlyAccess={isEarlyAccess} alreadyRegistered={alreadyRegistered} firstName={firstName} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #e4e1db', borderBottom: '1px solid #e4e1db', overflowX: 'auto' }}>
        <div className="bail-reveal" style={{ display: 'flex', justifyContent: 'center', minWidth: 480 }}>
          {[{ val: '0 €', label: 'de commission' }, { val: '< 2 min', label: 'dossier locataire' }, { val: '100 %', label: 'légal eIDAS' }].map((s, i) => (
            <div key={i} style={{ flex: '1 1 160px', textAlign: 'center', padding: 'clamp(20px,4vw,32px) 20px', borderRight: i < 2 ? '1px solid #e4e1db' : 'none' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(30px,5vw,46px)', color: '#0d0c0a', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#9e9b96', marginTop: 6, letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ background: '#fafaf8', padding: 'clamp(56px,9vw,104px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,72px)' }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9e9b96', margin: '0 0 14px' }}>Comment ça marche</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4.5vw,48px)', color: '#0d0c0a', margin: 0 }}>Simple. Rapide. Légal.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(32px,5vw,52px)' }}>
            {[
              { n: '1', title: 'Publiez votre bien', desc: 'Annonce professionnelle en moins de 5 minutes depuis votre téléphone. Photos, description, loyer — tout en un.' },
              { n: '2', title: 'Sélectionnez votre locataire', desc: 'Dossiers vérifiés par IA, scoring automatique, signature de bail eIDAS. Zéro paperasse, zéro agence.' },
              { n: '3', title: 'Gérez sereinement', desc: "Loyers encaissés, quittances envoyées, messagerie archivée. Bailio s'occupe de tout." },
            ].map((step, i) => (
              <div key={i} className={`bail-reveal bail-d${i + 1}`} style={{ position: 'relative' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(80px,12vw,116px)', color: '#f4f2ee', lineHeight: 1, position: 'absolute', top: -18, left: -6, zIndex: 0, userSelect: 'none' }}>{step.n}</div>
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 40 }}>
                  <div style={{ width: 26, height: 2, background: '#c4976a', marginBottom: 14 }} />
                  <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, fontSize: 21, color: '#0d0c0a', margin: '0 0 9px', lineHeight: 1.3 }}>{step.title}</h3>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: '#5a5754', lineHeight: 1.72, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS ───────────────────────────────────────────────── */}
      <section style={{ background: '#f4f2ee', padding: 'clamp(48px,7vw,72px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className={`bail-reveal bail-d${i % 4 + 1}`} style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 12, padding: '22px 18px', boxShadow: '0 1px 2px rgba(13,12,10,.04), 0 4px 12px rgba(13,12,10,.05)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fdf5ec', border: '1px solid #f3c99a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}>
                {f.icon}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, fontSize: 16, color: '#0d0c0a', marginBottom: 6, lineHeight: 1.3 }}>{f.title}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, color: '#9e9b96', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUDIENCE CARDS ──────────────────────────────────────────────── */}
      <section style={{ background: '#fafaf8', padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {/* Propriétaires */}
          <div className="bail-reveal" style={{ background: '#1a1a2e', borderRadius: 16, padding: 'clamp(28px,4vw,40px)' }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4976a', marginBottom: 5 }}>Propriétaires</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: '#ffffff', marginBottom: 22, lineHeight: 1.2 }}>Vous gérez votre bien</div>
            {['Publiez sans agence ni commission', 'Dossiers locataires vérifiés par IA', 'Bail signé électroniquement (eIDAS)', 'Loyers encaissés automatiquement', 'Interface mobile, zéro paperasse'].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c4976a', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>{it}</span>
              </div>
            ))}
          </div>
          {/* Locataires */}
          <div className="bail-reveal bail-d1" style={{ background: '#ffffff', borderRadius: 16, padding: 'clamp(28px,4vw,40px)', border: '1px solid #e4e1db', boxShadow: '0 1px 2px rgba(13,12,10,.04), 0 4px 12px rgba(13,12,10,.06)' }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: 5 }}>Locataires</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: '#0d0c0a', marginBottom: 22, lineHeight: 1.2 }}>Vous cherchez un logement</div>
            {['Dossier constitué en moins de 2 min', 'Zéro commission à votre charge', 'Justificatifs vérifiés, signature sécurisée', 'Quittances automatiques chaque mois', 'Messagerie directe avec le propriétaire'].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c4976a', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#5a5754', lineHeight: 1.5 }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ──────────────────────────────────────────────────── */}
      <section style={{ background: '#f4f2ee', padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,64px)', textAlign: 'center' }}>
        <div className="bail-reveal" style={{ maxWidth: 660, margin: '0 auto' }}>
          <div style={{ width: 36, height: 2, background: '#c4976a', margin: '0 auto 26px' }} />
          <blockquote style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(19px,3vw,28px)', color: '#0d0c0a', lineHeight: 1.55, margin: '0 0 22px' }}>
            "Pour la première fois, j'ai loué mon appartement à Paris sans agence. Le bail était signé en moins d'une heure, tout depuis mon téléphone."
          </blockquote>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e4e1db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: '#9e9b96' }}>S</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: '#0d0c0a' }}>Sophie M.</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#9e9b96' }}>Propriétaire · Paris 11e</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ background: '#1a1a2e', padding: 'clamp(28px,5vw,44px) clamp(16px,5vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <BailioMark size={30} />
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: '#ffffff' }}>Bailio</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.28)', letterSpacing: '0.05em' }}>Plateforme immobilière · 2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="https://instagram.com/bailio.fr" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/></svg>
            </a>
            <a href="https://twitter.com/bailiofr" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Twitter / X">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://linkedin.com/company/bailio" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="LinkedIn">
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
