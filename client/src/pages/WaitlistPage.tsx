import { useState, useEffect, useRef } from 'react'

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

// ─── Confetti ────────────────────────────────────────────────────────────────

const COLORS = ['#c4976a', '#ffffff', '#f3c99a', '#e4c090', '#fdf5ec', '#d4a96a', '#b8860b', '#1a1a2e']
const SHAPES = ['square', 'circle', 'rect'] as const

interface Particle {
  id: number; x: number; size: number; color: string
  shape: typeof SHAPES[number]; dur: number; delay: number; rotate: number; drift: number
}

function makeParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i, x: Math.random() * 100, size: 6 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    dur: 1800 + Math.random() * 1400, delay: Math.random() * 700,
    rotate: Math.random() * 360, drift: (Math.random() - 0.5) * 120,
  }))
}

function Confetti({ active }: { active: boolean }) {
  const [particles] = useState<Particle[]>(() => makeParticles(90))
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: -20, left: `${p.x}%`,
          width: p.shape === 'rect' ? p.size * 2.2 : p.size,
          height: p.shape === 'rect' ? p.size * 0.5 : p.size,
          background: p.color, opacity: 0,
          borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '1px',
          animation: `confettiFall ${p.dur}ms ease-in ${p.delay}ms forwards`,
          '--drift': `${p.drift}px`, '--rot': `${p.rotate + 720}deg`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function CityScape() {
  return (
    <svg viewBox="0 0 480 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0c1a" />
          <stop offset="100%" stopColor="#1a1a2e" />
        </linearGradient>
        <linearGradient id="moonGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4976a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c4976a" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="480" height="280" fill="url(#skyGrad)" />

      {/* Moon glow */}
      <circle cx="400" cy="50" r="70" fill="url(#moonGlow)" />
      {/* Moon */}
      <circle cx="400" cy="50" r="22" fill="#fdf5ec" opacity="0.9" />
      <circle cx="410" cy="44" r="17" fill="#1a1a2e" />

      {/* Stars */}
      {[[60,30],[120,18],[180,40],[240,22],[310,35],[350,15],[440,28],[30,55],[150,10],[280,48]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="#ffffff" opacity={0.4 + Math.random() * 0.4} />
      ))}

      {/* Ground */}
      <rect x="0" y="245" width="480" height="35" fill="#0d0c1a" />

      {/* Building 1 — far left, tall */}
      <rect x="10" y="90" width="52" height="155" rx="3" fill="#0f1020" />
      <rect x="10" y="90" width="52" height="155" rx="3" fill="rgba(255,255,255,0.03)" />
      {/* windows */}
      {[0,1,2,3,4,5,6,7].map(row => [0,1,2].map(col => (
        <rect key={`b1-${row}-${col}`} x={18 + col * 14} y={98 + row * 18} width="8" height="10" rx="1"
          fill={Math.random() > 0.45 ? '#c4976a' : 'rgba(255,255,255,0.08)'} opacity={Math.random() > 0.45 ? 0.7 : 1} />
      )))}
      {/* Rooftop detail */}
      <rect x="22" y="82" width="28" height="10" rx="2" fill="#0f1020" />
      <rect x="28" y="76" width="16" height="8" rx="2" fill="#0f1020" />

      {/* Building 2 — shorter, left-center */}
      <rect x="74" y="140" width="44" height="105" rx="3" fill="#111225" />
      {[0,1,2,3,4].map(row => [0,1].map(col => (
        <rect key={`b2-${row}-${col}`} x={82 + col * 18} y={150 + row * 18} width="10" height="11" rx="1"
          fill={Math.random() > 0.4 ? '#e8d4b0' : 'rgba(255,255,255,0.06)'} opacity={0.65} />
      )))}

      {/* Building 3 — center-left, mid-height */}
      <rect x="128" y="110" width="60" height="135" rx="3" fill="#0e1122" />
      {[0,1,2,3,4,5,6].map(row => [0,1,2].map(col => (
        <rect key={`b3-${row}-${col}`} x={136 + col * 16} y={120 + row * 17} width="10" height="10" rx="1"
          fill={Math.random() > 0.35 ? '#c4976a' : 'rgba(255,255,255,0.07)'} opacity={Math.random() > 0.35 ? 0.6 : 1} />
      )))}
      {/* Balconies */}
      <rect x="126" y="142" width="64" height="2" fill="rgba(196,151,106,0.3)" />
      <rect x="126" y="176" width="64" height="2" fill="rgba(196,151,106,0.3)" />

      {/* Building 4 — HERO center tall */}
      <rect x="198" y="60" width="76" height="185" rx="4" fill="#131326" />
      {/* Accent facade */}
      <rect x="198" y="60" width="4" height="185" fill="rgba(196,151,106,0.25)" />
      {[0,1,2,3,4,5,6,7,8].map(row => [0,1,2,3].map(col => (
        <rect key={`b4-${row}-${col}`} x={208 + col * 16} y={72 + row * 18} width="10" height="11" rx="1"
          fill={Math.random() > 0.3 ? '#c4976a' : 'rgba(255,255,255,0.08)'} opacity={Math.random() > 0.3 ? 0.75 : 1} />
      )))}
      {/* Roof terrace */}
      <rect x="196" y="52" width="80" height="10" rx="3" fill="#0f1020" />
      <rect x="210" y="44" width="52" height="10" rx="3" fill="#0f1020" />
      {/* Antenna */}
      <line x1="236" y1="44" x2="236" y2="24" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <circle cx="236" cy="22" r="2" fill="#c4976a" opacity="0.8" />
      {/* Balconies center */}
      <rect x="196" y="140" width="78" height="3" fill="rgba(196,151,106,0.4)" />
      <rect x="196" y="188" width="78" height="3" fill="rgba(196,151,106,0.4)" />

      {/* Building 5 — center right */}
      <rect x="284" y="115" width="58" height="130" rx="3" fill="#0e1124" />
      {[0,1,2,3,4,5,6].map(row => [0,1,2].map(col => (
        <rect key={`b5-${row}-${col}`} x={292 + col * 16} y={125 + row * 17} width="10" height="10" rx="1"
          fill={Math.random() > 0.4 ? '#e8d4b0' : 'rgba(255,255,255,0.06)'} opacity={0.6} />
      )))}

      {/* Building 6 — right */}
      <rect x="352" y="95" width="64" height="150" rx="3" fill="#111226" />
      {[0,1,2,3,4,5,6,7].map(row => [0,1,2].map(col => (
        <rect key={`b6-${row}-${col}`} x={360 + col * 18} y={105 + row * 17} width="11" height="10" rx="1"
          fill={Math.random() > 0.35 ? '#c4976a' : 'rgba(255,255,255,0.07)'} opacity={Math.random() > 0.35 ? 0.65 : 1} />
      )))}
      <rect x="350" y="87" width="68" height="10" rx="3" fill="#0f1020" />

      {/* Building 7 — far right small */}
      <rect x="426" y="155" width="46" height="90" rx="3" fill="#0f1122" />
      {[0,1,2,3].map(row => [0,1].map(col => (
        <rect key={`b7-${row}-${col}`} x={434 + col * 18} y={163 + row * 18} width="10" height="10" rx="1"
          fill={Math.random() > 0.5 ? '#e8d4b0' : 'rgba(255,255,255,0.05)'} opacity={0.6} />
      )))}

      {/* Street lights */}
      {[55, 115, 195, 285, 355, 430].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="245" x2={x} y2="210" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <circle cx={x} cy="207" r="4" fill="#c4976a" opacity="0.5" />
          <circle cx={x} cy="207" r="8" fill="#c4976a" opacity="0.08" />
        </g>
      ))}

      {/* Road line */}
      <line x1="0" y1="258" x2="480" y2="258" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      {[0,1,2,3,4,5,6,7].map(i => (
        <rect key={i} x={30 + i * 60} y="260" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
      ))}

      {/* Overlay gradient bottom */}
      <defs>
        <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="#1a1a2e" />
        </linearGradient>
      </defs>
      <rect x="0" y="200" width="480" height="80" fill="url(#fadeBottom)" />
    </svg>
  )
}

function IlluKey() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#f4f2ee" />
      <circle cx="14" cy="16" r="6" stroke="#c4976a" strokeWidth="2" fill="none" />
      <circle cx="14" cy="16" r="2.5" fill="#c4976a" />
      <path d="M19 16H30M27 16V19M24 16V18.5" stroke="#c4976a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IlluDoc() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#f4f2ee" />
      <rect x="10" y="8" width="16" height="20" rx="2" fill="#1a1a2e" opacity="0.08" stroke="#1a1a2e" strokeWidth="1.5" strokeOpacity="0.2" />
      <line x1="13" y1="14" x2="23" y2="14" stroke="#c4976a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="18" x2="23" y2="18" stroke="#c4976a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 22l3 3 7-7" stroke="#1b5e3b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IlluCard() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#f4f2ee" />
      <rect x="7" y="12" width="22" height="13" rx="3" fill="#1a1a2e" opacity="0.12" stroke="#1a1a2e" strokeWidth="1.5" strokeOpacity="0.2" />
      <line x1="7" y1="17" x2="29" y2="17" stroke="#c4976a" strokeWidth="1.5" />
      <rect x="10" y="20" width="7" height="2.5" rx="1" fill="#1a1a2e" opacity="0.3" />
    </svg>
  )
}

function IlluChat() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#f4f2ee" />
      <path d="M8 10h12a2 2 0 012 2v6a2 2 0 01-2 2h-2l-2 3-2-3H8a2 2 0 01-2-2v-6a2 2 0 012-2z" fill="#1a3270" opacity="0.15" stroke="#1a3270" strokeWidth="1.4" strokeOpacity="0.5" />
      <path d="M16 18h8a2 2 0 012 2v4a2 2 0 01-2 2h-1l-1 2-1-2h-3a2 2 0 01-2-2v-4a2 2 0 012-2z" fill="#1b5e3b" opacity="0.15" stroke="#1b5e3b" strokeWidth="1.4" strokeOpacity="0.5" />
    </svg>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function BailioMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="22" fill="#1a1a2e" />
      <text x="50" y="68" textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontStyle="italic" fontWeight="700" fontSize="62" fill="#ffffff">B</text>
      <rect x="32" y="78" width="36" height="2.5" rx="1.25" fill="#c4976a" />
    </svg>
  )
}

// ─── Social icons ─────────────────────────────────────────────────────────────

function IconIG() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg>
}
function IconX() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function IconLI() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
}

// ─── Types ───────────────────────────────────────────────────────────────────

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
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE)

  useEffect(() => {
    fetch(`${API_BASE}/waitlist/count`)
      .then(r => r.json())
      .then(d => { if (d.success) setTotalCount(d.data.total) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    return () => { if (confettiTimer.current) clearTimeout(confettiTimer.current) }
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
      setState({ kind: 'success', isEarlyAccess: data.data.isEarlyAccess, alreadyRegistered: data.data.alreadyRegistered, firstName: firstName.trim() })
      if (!data.data.alreadyRegistered) {
        setTotalCount(c => (c !== null ? c + 1 : 1))
        setShowConfetti(true)
        confettiTimer.current = setTimeout(() => setShowConfetti(false), 4200)
      }
    } catch {
      setState({ kind: 'error', message: 'Impossible de rejoindre la liste. Réessayez.' })
    }
  }

  const features = [
    { icon: <IlluKey />, title: 'Annonces vérifiées', desc: 'Chaque logement et chaque propriétaire est contrôlé avant publication.' },
    { icon: <IlluDoc />, title: 'Dossier & bail en ligne', desc: 'Vérification IA des dossiers. Signature électronique légale eIDAS.' },
    { icon: <IlluCard />, title: 'Paiements sécurisés', desc: 'Loyers, quittances automatiques — zéro commission d\'agence.' },
    { icon: <IlluChat />, title: 'Messagerie directe', desc: 'Canal sécurisé propriétaire ↔ locataire. Archivé et traçable.' },
  ]

  return (
    <>
      <Confetti active={showConfetti} />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes drawCircle { to { stroke-dashoffset: 0; } }
        @keyframes drawCheck  { to { stroke-dashoffset: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes confettiFall {
          0%   { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(100vh) translateX(var(--drift)) rotate(var(--rot)); }
        }

        .wl-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .wl-input:focus { border-color: #c4976a !important; box-shadow: 0 0 0 3px rgba(196,151,106,0.14) !important; outline: none !important; }
        .wl-btn { transition: background 0.15s, transform 0.15s, box-shadow 0.15s; }
        .wl-btn:hover:not(:disabled) { background: #252540 !important; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,26,46,0.35); }
        .social-btn { transition: background 0.15s, color 0.15s; }
        .social-btn:hover { background: #f4f2ee !important; color: #c4976a !important; }
        .feat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .feat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(13,12,10,0.1) !important; }

        /* Responsive */
        .hero-split { display: flex; align-items: center; gap: 0; }
        .hero-text { flex: 1; }
        .hero-visual { flex: 0 0 52%; max-width: 52%; }
        .features-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .audience-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-row { display: flex; gap: 10px; }

        @media (max-width: 900px) {
          .hero-split { flex-direction: column-reverse; }
          .hero-text { text-align: center; }
          .hero-visual { flex: none; max-width: 100%; width: 100%; margin-bottom: 0; }
          .features-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr 1fr; }
          .audience-grid { grid-template-columns: 1fr; }
          .form-row { flex-direction: column; }
          .form-row button { width: 100%; }
        }
        @media (max-width: 400px) {
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ minHeight: '100dvh', background: '#fafaf8', fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>

        {/* ══ HERO DARK ══════════════════════════════════════════════════════ */}
        <div style={{ background: '#1a1a2e', position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>

          {/* grid pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />

          {/* NAV */}
          <nav style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2, maxWidth: 1080, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BailioMark size={42} />
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 24, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1 }}>Bailio</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Plateforme immobilière</div>
              </div>
            </div>
            {totalCount !== null && totalCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 14px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4976a', animation: 'blink 2s infinite' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  <strong style={{ color: '#fff' }}>{totalCount.toLocaleString('fr-FR')}</strong> inscrits
                </span>
              </div>
            )}
          </nav>

          {/* HERO CONTENT + CITY */}
          <div className="hero-split" style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 28px 0', position: 'relative', zIndex: 2 }}>

            {/* Text side */}
            <div className="hero-text" style={{ paddingBottom: 60, paddingRight: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(196,151,106,0.14)', border: '1px solid rgba(196,151,106,0.28)', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4976a' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#c4976a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Bientôt disponible</span>
              </div>

              <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 'clamp(36px,5vw,58px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1.08, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
                Louer sans agence,<br />
                <span style={{ color: '#c4976a' }}>gérer en toute liberté.</span>
              </h1>

              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 32px', maxWidth: 420 }}>
                Bailio est la première plateforme immobilière qui connecte <strong style={{ color: 'rgba(255,255,255,0.8)' }}>propriétaires</strong> et <strong style={{ color: 'rgba(255,255,255,0.8)' }}>locataires</strong> en direct — sans intermédiaire, sans commission.
              </p>

              {/* Countdown */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 0 }}>
                {[{ v: days, l: 'Jours' }, { v: hours, l: 'Heures' }, { v: minutes, l: 'Min' }, { v: seconds, l: 'Sec' }].map(({ v, l }) => (
                  <div key={l} style={{ textAlign: 'center', minWidth: 58 }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 12px', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1, display: 'block' }}>{String(v).padStart(2, '0')}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* City illustration */}
            <div className="hero-visual" style={{ animation: 'float 6s ease-in-out infinite', transformOrigin: 'bottom center' }}>
              <CityScape />
            </div>
          </div>
        </div>

        {/* ══ FORM CARD ══════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 20px', marginTop: -48, position: 'relative', zIndex: 10 }}>
          <div style={{ width: '100%', maxWidth: 540, background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 20, padding: '36px 32px', boxShadow: '0 12px 48px rgba(13,12,10,0.14), 0 2px 4px rgba(13,12,10,0.06)' }}>

            {state.kind === 'success' ? (
              <div style={{ animation: 'popIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                    <circle cx="36" cy="36" r="35" fill="#f4f2ee" />
                    <circle cx="36" cy="36" r="26" fill="none" stroke="#c4976a" strokeWidth="2.5"
                      strokeDasharray="163.4" strokeDashoffset="163.4"
                      style={{ animation: 'drawCircle 0.7s ease 0.15s forwards' }} />
                    <polyline points="24,36 32,45 50,26" fill="none" stroke="#c4976a" strokeWidth="3.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="40" strokeDashoffset="40"
                      style={{ animation: 'drawCheck 0.4s ease 0.75s forwards' }} />
                  </svg>
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 8px' }}>
                  {state.alreadyRegistered ? 'Déjà inscrit !' : state.firstName ? `Bienvenue, ${state.firstName} !` : 'Vous êtes sur la liste !'}
                </p>
                <p style={{ fontSize: 14, color: '#5a5754', margin: '0 0 20px', lineHeight: 1.6 }}>
                  {state.alreadyRegistered ? 'Vous serez notifié dès l\'ouverture.' : 'Email de confirmation en route.'}
                </p>
                {state.isEarlyAccess ? (
                  <div style={{ animation: 'fadeIn 0.4s ease 0.9s both', background: '#fdf5ec', border: '1px solid #f3c99a', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400e' }}>Accès anticipé confirmé</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#5a5754', lineHeight: 1.6 }}>
                      Parmi les <strong style={{ color: '#0d0c0a' }}>150 premiers</strong> — <strong style={{ color: '#0d0c0a' }}>1 mois offert</strong> sur le plan Pro vous attend.
                    </p>
                  </div>
                ) : (
                  <div style={{ animation: 'fadeIn 0.4s ease 0.9s both', background: '#f4f2ee', borderRadius: 12, padding: '14px 18px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#5a5754' }}>Nous vous prévenons en avant-première dès que Bailio ouvre ses portes.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 23, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 5px' }}>Réservez votre accès</h2>
                  <p style={{ fontSize: 13, color: '#9e9b96', margin: 0 }}>
                    Les <strong style={{ color: '#c4976a' }}>150 premiers</strong> obtiennent 1 mois offert sur le plan Pro.
                  </p>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Votre prénom (facultatif)" disabled={state.kind === 'loading'}
                    className="wl-input"
                    style={{ width: '100%', padding: '13px 16px', background: '#f8f7f4', border: '1px solid #e4e1db', borderRadius: 10, fontSize: 14, color: '#0d0c0a', fontFamily: "'DM Sans',system-ui,sans-serif" }} />
                  <div className="form-row">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.fr" required disabled={state.kind === 'loading'}
                      className="wl-input"
                      style={{ flex: 1, padding: '13px 16px', background: '#f8f7f4', border: '1px solid #e4e1db', borderRadius: 10, fontSize: 14, color: '#0d0c0a', fontFamily: "'DM Sans',system-ui,sans-serif", minWidth: 0 }} />
                    <button type="submit" disabled={state.kind === 'loading' || !email.trim()}
                      className="wl-btn"
                      style={{ padding: '13px 22px', background: '#1a1a2e', color: '#fafaf8', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: state.kind === 'loading' || !email.trim() ? 'not-allowed' : 'pointer', opacity: state.kind === 'loading' || !email.trim() ? 0.5 : 1, fontFamily: "'DM Sans',system-ui,sans-serif", whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {state.kind === 'loading' ? 'Envoi…' : 'Rejoindre →'}
                    </button>
                  </div>
                  {state.kind === 'error' && (
                    <p style={{ margin: 0, fontSize: 13, color: '#9b1c1c', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px' }}>{state.message}</p>
                  )}
                </form>
                <p style={{ margin: '12px 0 0', fontSize: 11, color: '#9e9b96', textAlign: 'center' }}>
                  Aucun spam · Désabonnement en un clic · contact@bailio.fr
                </p>
                {totalCount !== null && totalCount > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e4e1db', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex' }}>
                      {['#1a1a2e', '#c4976a', '#1b5e3b'].map((bg, i) => (
                        <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #fff', background: bg, marginLeft: i > 0 ? -9 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: '#5a5754' }}><strong style={{ color: '#0d0c0a' }}>{totalCount.toLocaleString('fr-FR')}</strong> propriétaires et locataires nous attendent</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ══ IMMOBILIER PITCH ═══════════════════════════════════════════════ */}
        <section style={{ padding: '72px 24px 16px', maxWidth: 1080, margin: '0 auto', width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: 8 }}>
            Pourquoi Bailio ?
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 14px', lineHeight: 1.15 }}>
            L'immobilier tel qu'il aurait<br />toujours dû fonctionner.
          </h2>
          <p style={{ fontSize: 15, color: '#5a5754', maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.7 }}>
            En France, 73% des litiges locatifs viennent d'une mauvaise communication. Bailio change ça — avec des outils pensés pour les deux parties.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap', marginBottom: 56, borderTop: '1px solid #e4e1db', borderBottom: '1px solid #e4e1db' }}>
            {[
              { val: '0€', label: 'Commission d\'agence' },
              { val: '< 2min', label: 'Pour créer un dossier' },
              { val: '100%', label: 'Légal & sécurisé' },
            ].map((s, i) => (
              <div key={i} style={{ flex: '1 1 160px', padding: '28px 20px', borderLeft: i > 0 ? '1px solid #e4e1db' : 'none', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 38, fontWeight: 700, fontStyle: 'italic', color: '#1a1a2e', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#9e9b96', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ FEATURES ═══════════════════════════════════════════════════════ */}
        <section style={{ padding: '0 24px 56px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feat-card" style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 14, padding: '22px 18px', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
                <div style={{ marginBottom: 14 }}>{f.icon}</div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 14, color: '#0d0c0a', lineHeight: 1.3 }}>{f.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#9e9b96', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ AUDIENCE ═══════════════════════════════════════════════════════ */}
        <section style={{ padding: '0 24px 72px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
          <div className="audience-grid">
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,151,106,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 18 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c4976a' }}>Propriétaires</span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '0 0 12px', lineHeight: 1.3 }}>Gérez vos biens en toute autonomie</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px', lineHeight: 1.7 }}>Publiez, sélectionnez les dossiers, signez les baux, encaissez les loyers — sans agence, sans commission, depuis une seule plateforme.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Vérification IA des locataires', 'Génération automatique des quittances', 'État des lieux numérique'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(196,151,106,0.2)', border: '1px solid rgba(196,151,106,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#c4976a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e4e1db', borderRadius: 16, padding: '32px 28px', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#f4f2ee', border: '1px solid #e4e1db', borderRadius: 20, padding: '4px 12px', marginBottom: 18 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9e9b96' }}>Locataires</span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 12px', lineHeight: 1.3 }}>Trouvez et gérez votre logement sereinement</p>
              <p style={{ fontSize: 13, color: '#9e9b96', margin: '0 0 20px', lineHeight: 1.7 }}>Constituez votre dossier une seule fois, candidatez en un clic, suivez votre bail et communiquez en direct avec votre propriétaire.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Dossier locatif unifié et sécurisé', 'Signature du bail en ligne (eIDAS)', 'Historique des paiements & échanges'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#edf7f2', border: '1px solid #9fd4ba', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1b5e3b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: 13, color: '#5a5754' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
        <footer style={{ borderTop: '1px solid #e4e1db', padding: '22px 24px', background: '#ffffff' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BailioMark size={28} />
              <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a' }}>Bailio</span>
              <span style={{ fontSize: 11, color: '#9e9b96' }}>© 2026</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[
                { href: 'https://instagram.com/bailio.fr', icon: <IconIG />, label: '@bailio.fr' },
                { href: 'https://twitter.com/bailiofr', icon: <IconX />, label: '@bailiofr' },
                { href: 'https://linkedin.com/company/bailio', icon: <IconLI />, label: 'LinkedIn' },
              ].map(({ href, icon, label }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" title={label}
                  className="social-btn"
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e4e1db', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5754', textDecoration: 'none' }}>
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
