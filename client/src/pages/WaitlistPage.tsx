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
      setT({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) })
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id)
  }, [target])
  return t
}

// ─── Confetti ────────────────────────────────────────────────────────────────
const CONF_COLORS = ['#c4976a', '#ffffff', '#f3c99a', '#e4c090', '#fdf5ec', '#d4a96a', '#1a1a2e', '#b8860b']
interface Particle { id: number; x: number; size: number; color: string; shape: 'sq' | 'ci' | 're'; dur: number; delay: number; drift: number; rot: number }
function mkParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, x: Math.random() * 100, size: 5 + Math.random() * 9, color: CONF_COLORS[i % CONF_COLORS.length], shape: (['sq', 'ci', 're'] as const)[i % 3], dur: 1600 + Math.random() * 1600, delay: Math.random() * 700, drift: (Math.random() - 0.5) * 130, rot: Math.random() * 360 }))
}
function Confetti({ active }: { active: boolean }) {
  const [p] = useState(() => mkParticles(90))
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {p.map(q => <div key={q.id} style={{ position: 'absolute', top: -16, left: `${q.x}%`, width: q.shape === 're' ? q.size * 2.4 : q.size, height: q.shape === 're' ? q.size * 0.45 : q.size, background: q.color, opacity: 0, borderRadius: q.shape === 'ci' ? '50%' : '2px', animation: `cfFall ${q.dur}ms ease-in ${q.delay}ms forwards`, '--d': `${q.drift}px`, '--r': `${q.rot + 720}deg` } as React.CSSProperties} />)}
    </div>
  )
}

// ─── Particle Building Canvas ─────────────────────────────────────────────────

interface PtData { x: number; y: number; tx: number; ty: number; vx: number; vy: number; color: string; size: number; phase: number; escapeTimer: number }

function buildTargets(W: number, H: number): PtData[] {
  const pts: PtData[] = []
  const sc = Math.min(W / 480, H / 520, 1)
  const cx = W / 2, by = H * 0.86
  const WALL = 'rgba(250,250,248,0.12)', LIT = 'rgba(196,151,106,0.85)', DIM = 'rgba(196,151,106,0.25)', DETAIL = 'rgba(250,250,248,0.22)'

  function dot(x: number, y: number, col: string, sz = 1.6) {
    const px = cx + x * sc, py = by - y * sc
    pts.push({ x: px + (Math.random() - 0.5) * 80, y: py + (Math.random() - 0.5) * 80, tx: px, ty: py, vx: 0, vy: 0, color: col, size: sz * (0.8 + Math.random() * 0.4), phase: Math.random() * Math.PI * 2, escapeTimer: Math.random() * 200 })
  }

  function rect(x: number, y: number, w: number, h: number, col: string, step = 9, sz = 1.6) {
    for (let dy = 0; dy < h; dy += step) for (let dx = 0; dx < w; dx += step)
      dot(x + dx - w / 2, y + dy, col, sz)
  }

  function hline(y: number, x0: number, x1: number, col: string, step = 6) {
    for (let x = x0; x <= x1; x += step) dot(x, y, col, 1.3)
  }

  function vline(x: number, y0: number, y1: number, col: string, step = 6) {
    for (let y = y0; y <= y1; y += step) dot(x, y, col, 1.3)
  }

  const BW = 170, FLOOR = 38, FLOORS = 5

  // ── Main facade walls (sparse)
  for (let f = 0; f < FLOORS; f++) {
    const fy = f * FLOOR
    rect(-BW / 2, fy, 12, FLOOR - 2, WALL, 11)
    rect(BW / 2 - 12, fy, 12, FLOOR - 2, WALL, 11)
  }

  // ── Floor separator lines
  for (let f = 1; f <= FLOORS; f++) {
    hline(f * FLOOR - 1, -BW / 2, BW / 2, DETAIL, 5)
  }

  // ── Base line
  hline(0, -BW / 2 - 4, BW / 2 + 4, DETAIL, 4)

  // ── Windows — 3 per floor, randomized lit/dim
  const winX = [-52, 0, 52]
  for (let f = 0; f < FLOORS; f++) {
    winX.forEach((wx, wi) => {
      const isLit = Math.random() > 0.38
      const col = isLit ? LIT : DIM
      rect(wx, f * FLOOR + 7, 22, 18, col, 4, 1.8)
      // window cross divider
      hline(f * FLOOR + 16, wx - 11, wx + 11, isLit ? 'rgba(196,151,106,0.3)' : 'rgba(255,255,255,0.06)', 4)
      vline(wx, f * FLOOR + 7, f * FLOOR + 25, isLit ? 'rgba(196,151,106,0.3)' : 'rgba(255,255,255,0.06)', 4)
      // shutters
      if (wi !== 1) {
        dot(wx - 13, f * FLOOR + 16, WALL, 1.2)
        dot(wx + 13, f * FLOOR + 16, WALL, 1.2)
      }
    })
  }

  // ── Balcony railings (floors 2-5)
  for (let f = 2; f <= FLOORS; f++) {
    const ry = f * FLOOR - 2
    hline(ry, -BW / 2, BW / 2, 'rgba(196,151,106,0.45)', 4)
    // railing posts
    for (let px = -BW / 2 + 8; px < BW / 2; px += 16)
      dot(px, ry - 6, 'rgba(196,151,106,0.3)', 1.1)
  }

  // ── Grand entrance (ground floor center)
  rect(0, 2, 28, 32, 'rgba(196,151,106,0.18)', 7)
  hline(34, -14, 14, 'rgba(196,151,106,0.5)', 3)
  // arch
  for (let a = 0; a <= Math.PI; a += Math.PI / 10) {
    dot(Math.cos(a) * 14, 34 + Math.sin(a) * 10, 'rgba(196,151,106,0.6)', 1.4)
  }

  // ── Vertical pilasters
  for (const px of [-BW / 2 + 22, -22, 0, 22, BW / 2 - 22]) {
    vline(px, 0, FLOORS * FLOOR, 'rgba(250,250,248,0.06)', 8)
  }

  // ── Mansard roof
  const roofH = 80, roofY = FLOORS * FLOOR
  for (let ry = 0; ry < roofH; ry += 8) {
    const rw = BW / 2 - ry * 0.55
    hline(roofY + ry, -rw, rw, ry < 10 ? DETAIL : 'rgba(250,250,248,0.08)', 7)
  }

  // Roof cornice
  hline(roofY + 2, -BW / 2 - 6, BW / 2 + 6, 'rgba(196,151,106,0.5)', 4)

  // ── Dormer windows (2)
  const dormers = [-40, 40]
  dormers.forEach(dx => {
    rect(dx, roofY + 14, 26, 24, 'rgba(196,151,106,0.55)', 5, 1.6)
    for (let a = 0; a <= Math.PI; a += Math.PI / 8) {
      dot(dx + Math.cos(a) * 13, roofY + 38 + Math.sin(a) * 10, 'rgba(196,151,106,0.6)', 1.3)
    }
  })

  // ── Chimneys
  ;[[-60, roofY + 60], [60, roofY + 58]].forEach(([cx2, cy]) => {
    rect(cx2, cy, 14, 24, WALL, 7)
    hline(cy + 24, cx2 - 8, cx2 + 8, DETAIL, 3)
  })

  // ── Antenna / flag
  vline(0, roofY + 72, roofY + 102, 'rgba(250,250,248,0.15)', 5)
  dot(0, roofY + 103, '#c4976a', 2.5)
  dot(0, roofY + 103, '#c4976a', 1.5)

  // ── Ground level detail — cobblestone suggestion
  for (let gx = -BW / 2 - 20; gx < BW / 2 + 20; gx += 18) {
    dot(gx, -8, 'rgba(250,250,248,0.05)', 1.2)
    dot(gx + 9, -14, 'rgba(250,250,248,0.04)', 1)
  }

  // ── Ambient floating dust particles
  for (let i = 0; i < 30; i++) {
    dot((Math.random() - 0.5) * 300, Math.random() * 320 - 20, `rgba(196,151,106,${0.04 + Math.random() * 0.08})`, 1 + Math.random())
  }

  return pts
}

function BuildingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ptsRef = useRef<PtData[]>([])
  const rafRef = useRef(0)
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0

    function resize() {
      const dpr = window.devicePixelRatio || 1
      W = canvas.clientWidth; H = canvas.clientHeight
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ptsRef.current = buildTargets(W, H)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw() {
      ctx.clearRect(0, 0, W, H)
      tRef.current += 0.008

      for (const p of ptsRef.current) {
        // Sinusoidal drift around target
        const drift = 1.8
        const ftx = p.tx + Math.sin(tRef.current + p.phase) * drift
        const fty = p.ty + Math.cos(tRef.current * 0.7 + p.phase) * drift

        // Occasional escape
        p.escapeTimer -= 0.5
        let etx = ftx, ety = fty
        if (p.escapeTimer < -60 && p.escapeTimer > -120) {
          etx = ftx + Math.sin(p.phase * 3) * 35
          ety = fty + Math.cos(p.phase * 2) * 35
        }
        if (p.escapeTimer < -180) p.escapeTimer = 80 + Math.random() * 160

        const dx = etx - p.x, dy = ety - p.y
        p.vx += dx * 0.038; p.vy += dy * 0.038
        p.vx *= 0.86; p.vy *= 0.86
        p.x += p.vx; p.y += p.vy

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function BailioMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="22" fill="#1a1a2e" />
      <text x="50" y="68" textAnchor="middle" fontFamily="'Cormorant Garamond',Georgia,serif" fontStyle="italic" fontWeight="700" fontSize="62" fill="#ffffff">B</text>
      <rect x="32" y="78" width="36" height="2.5" rx="1.25" fill="#c4976a" />
    </svg>
  )
}

// ─── Social icons ──────────────────────────────────────────────────────────────
const IconIG = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg>
const IconX = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
const IconLI = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>

// ─── Types ────────────────────────────────────────────────────────────────────
type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'success'; isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string } | { kind: 'error'; message: string }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const cfTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE)

  useEffect(() => {
    fetch(`${API_BASE}/waitlist/count`).then(r => r.json()).then(d => { if (d.success) setTotalCount(d.data.total) }).catch(() => {})
    return () => { if (cfTimer.current) clearTimeout(cfTimer.current) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!email.trim()) return
    setState({ kind: 'loading' })
    try {
      const res = await fetch(`${API_BASE}/waitlist/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), firstName: firstName.trim() || undefined }) })
      const data = await res.json()
      if (!res.ok || !data.success) { setState({ kind: 'error', message: data.message || 'Une erreur est survenue' }); return }
      setState({ kind: 'success', isEarlyAccess: data.data.isEarlyAccess, alreadyRegistered: data.data.alreadyRegistered, firstName: firstName.trim() })
      if (!data.data.alreadyRegistered) { setTotalCount(c => (c !== null ? c + 1 : 1)); setShowConfetti(true); cfTimer.current = setTimeout(() => setShowConfetti(false), 4500) }
    } catch { setState({ kind: 'error', message: 'Impossible de rejoindre la liste. Réessayez.' }) }
  }

  const features = [
    { title: 'Dossiers vérifiés par IA', desc: 'Analyse des justificatifs en quelques secondes. Fiabilité maximale.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
    { title: 'Bail & signature eIDAS', desc: 'Contrats signés en ligne. Valeur juridique complète garantie.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg> },
    { title: 'Loyers & quittances auto', desc: 'Paiements sécurisés, quittances générées, historique complet.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    { title: 'Messagerie sécurisée', desc: 'Canal direct propriétaire ↔ locataire. Archivé, traçable.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  ]

  return (
    <>
      <Confetti active={showConfetti} />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes cfFall { 0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(100vh) translateX(var(--d)) rotate(var(--r)); } }
        @keyframes revealUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes revealIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.86) translateY(18px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes drawCircle { to { stroke-dashoffset: 0; } }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
        @keyframes tickIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

        .wl-input { transition: border-color .2s, box-shadow .2s; background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.12) !important; color: #fff !important; }
        .wl-input::placeholder { color: rgba(255,255,255,0.3) !important; }
        .wl-input:focus { border-color: #c4976a !important; box-shadow: 0 0 0 3px rgba(196,151,106,0.18) !important; outline: none !important; }
        .wl-btn { transition: background .15s, transform .15s, box-shadow .15s; }
        .wl-btn:hover:not(:disabled) { background: #c4976a !important; color: #1a1a2e !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(196,151,106,0.35); }
        .feat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(13,12,10,0.1) !important; }
        .feat-card { transition: transform .2s, box-shadow .2s; }
        .sb:hover { opacity: 1 !important; color: #c4976a !important; background: #f4f2ee !important; }
        .sb { transition: opacity .15s, color .15s, background .15s; }

        @media (min-width: 900px) {
          .hero-inner { flex-direction: row !important; min-height: 90vh; }
          .hero-canvas { flex: 0 0 55%; max-width: 55%; min-height: 560px; }
          .hero-form-col { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 52px !important; }
        }
        @media (max-width: 899px) {
          .hero-canvas { height: 54vw; min-height: 260px; max-height: 380px; }
          .hero-form-col { padding: 36px 20px 48px !important; }
        }
        @media (max-width: 580px) {
          .feat-grid { grid-template-columns: 1fr 1fr !important; }
          .aud-grid { grid-template-columns: 1fr !important; }
          .form-row { flex-direction: column !important; }
          .form-row button { width: 100% !important; }
          .stats-row > div { border-left: none !important; border-top: 1px solid #e4e1db; padding: 20px !important; }
          .stats-row > div:first-child { border-top: none; }
        }
        @media (max-width: 380px) {
          .feat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100dvh', background: '#fafaf8', fontFamily: "'DM Sans',system-ui,sans-serif", display: 'flex', flexDirection: 'column' }}>

        {/* ═══ HERO ═════════════════════════════════════════════════════════ */}
        <div style={{ background: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>

          {/* Noise texture overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, pointerEvents: 'none', zIndex: 0, opacity: 0.6 }} />

          {/* Caramel radial glow — right/center */}
          <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '50vw', height: '50vw', maxWidth: 480, maxHeight: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,151,106,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

          {/* NAV */}
          <nav style={{ position: 'relative', zIndex: 10, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'revealUp .6s ease both' }}>
              <BailioMark size={42} />
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 24, fontWeight: 700, fontStyle: 'italic', color: '#fff', lineHeight: 1 }}>Bailio</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>Plateforme immobilière</div>
              </div>
            </div>
            {totalCount !== null && totalCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(196,151,106,0.1)', border: '1px solid rgba(196,151,106,0.22)', borderRadius: 20, padding: '5px 14px', animation: 'revealIn .5s ease .2s both' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4976a', animation: 'blink 2s infinite' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}><strong style={{ color: '#fff' }}>{totalCount.toLocaleString('fr-FR')}</strong> inscrits</span>
              </div>
            )}
          </nav>

          {/* HERO SPLIT */}
          <div className="hero-inner" style={{ display: 'flex', flexDirection: 'column', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2 }}>

            {/* Canvas */}
            <div className="hero-canvas" style={{ position: 'relative' }}>
              <BuildingCanvas />
              {/* Gradient fade at bottom of canvas */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, transparent, #1a1a2e)', pointerEvents: 'none' }} />
            </div>

            {/* Form column */}
            <div className="hero-form-col" style={{ padding: '40px 20px 60px' }}>
              {/* Tag */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(196,151,106,0.13)', border: '1px solid rgba(196,151,106,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 22, animation: 'revealUp .6s ease .1s both' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c4976a' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#c4976a', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Bientôt disponible</span>
              </div>

              <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 'clamp(34px,4.5vw,52px)', fontWeight: 700, fontStyle: 'italic', color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.01em', animation: 'revealUp .7s ease .15s both' }}>
                La location sans agence,<br /><span style={{ color: '#c4976a' }}>enfin à votre portée.</span>
              </h1>

              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, marginBottom: 32, maxWidth: 380, animation: 'revealUp .6s ease .25s both' }}>
                Bailio connecte <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>propriétaires</strong> et <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>locataires</strong> directement — vérification IA, contrats eIDAS, zéro commission.
              </p>

              {/* Countdown */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', animation: 'revealUp .6s ease .3s both' }}>
                {[{ v: days, l: 'Jours' }, { v: hours, l: 'Heures' }, { v: minutes, l: 'Min' }, { v: seconds, l: 'Sec' }].map(({ v, l }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', minWidth: 56, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1, display: 'block', animation: 'tickIn .2s ease' }}>{String(v).padStart(2, '0')}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>{l}</span>
                  </div>
                ))}
              </div>

              {/* Form / Success */}
              {state.kind === 'success' ? (
                <div style={{ animation: 'popIn .45s cubic-bezier(0.16,1,0.3,1) both', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(196,151,106,0.25)', borderRadius: 18, padding: '28px 24px', textAlign: 'center', backdropFilter: 'blur(0px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                      <circle cx="34" cy="34" r="33" fill="rgba(196,151,106,0.12)" />
                      <circle cx="34" cy="34" r="24" fill="none" stroke="#c4976a" strokeWidth="2.5" strokeDasharray="150.8" strokeDashoffset="150.8" style={{ animation: 'drawCircle .7s ease .1s forwards' }} />
                      <polyline points="22,34 30,43 47,25" fill="none" stroke="#c4976a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="38" strokeDashoffset="38" style={{ animation: 'drawCheck .4s ease .7s forwards' }} />
                    </svg>
                  </div>
                  <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, fontWeight: 700, fontStyle: 'italic', color: '#fff', marginBottom: 8 }}>
                    {state.alreadyRegistered ? 'Déjà inscrit !' : state.firstName ? `Bienvenue, ${state.firstName} !` : 'Vous êtes sur la liste !'}
                  </p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 18, lineHeight: 1.6 }}>
                    {state.alreadyRegistered ? 'Vous serez notifié en avant-première.' : 'Email de confirmation envoyé.'}
                  </p>
                  {state.isEarlyAccess ? (
                    <div style={{ animation: 'fadeSlide .5s ease .9s both', background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.3)', borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4976a' }}>Accès anticipé · Early Access</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                        Parmi les <strong style={{ color: '#c4976a' }}>150 premiers</strong> — <strong style={{ color: '#fff' }}>1 mois offert</strong> sur le plan Pro vous attend.
                      </p>
                    </div>
                  ) : (
                    <div style={{ animation: 'fadeSlide .5s ease .9s both', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 16px' }}>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Nous vous prévenons dès l'ouverture de Bailio.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ animation: 'revealUp .6s ease .35s both' }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Rejoindre la liste d'attente</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>Les <strong style={{ color: '#c4976a' }}>150 premiers</strong> obtiennent 1 mois offert.</div>
                  </div>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom (facultatif)" disabled={state.kind === 'loading'} className="wl-input"
                      style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '1px solid', fontSize: 14, fontFamily: "'DM Sans',system-ui,sans-serif" }} />
                    <div className="form-row" style={{ display: 'flex', gap: 10 }}>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required disabled={state.kind === 'loading'} className="wl-input"
                        style={{ flex: 1, padding: '13px 16px', borderRadius: 10, border: '1px solid', fontSize: 14, fontFamily: "'DM Sans',system-ui,sans-serif", minWidth: 0 }} />
                      <button type="submit" disabled={state.kind === 'loading' || !email.trim()} className="wl-btn"
                        style={{ padding: '13px 22px', background: '#c4976a', color: '#1a1a2e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: state.kind === 'loading' || !email.trim() ? 'not-allowed' : 'pointer', opacity: state.kind === 'loading' || !email.trim() ? 0.45 : 1, fontFamily: "'DM Sans',system-ui,sans-serif", whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {state.kind === 'loading' ? '…' : 'Rejoindre →'}
                      </button>
                    </div>
                    {state.kind === 'error' && <p style={{ fontSize: 13, color: '#fca5a5', background: 'rgba(155,28,28,0.2)', border: '1px solid rgba(252,165,165,0.3)', borderRadius: 8, padding: '10px 14px' }}>{state.message}</p>}
                  </form>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10, textAlign: 'center' }}>Aucun spam · Désabonnement en un clic</p>
                  {totalCount !== null && totalCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex' }}>
                        {['#1a1a2e','#c4976a','#1b5e3b'].map((bg, i) => (
                          <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #1a1a2e', background: bg, marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}><strong style={{ color: 'rgba(255,255,255,0.7)' }}>{totalCount.toLocaleString('fr-FR')}</strong> propriétaires et locataires nous attendent</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ STATS ════════════════════════════════════════════════════════ */}
        <div className="stats-row" style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #e4e1db', background: '#fff' }}>
          {[{ val: '0 €', sub: 'Commission d\'agence' }, { val: '< 2 min', sub: 'Pour créer un dossier' }, { val: '100 %', sub: 'Légal & certifié eIDAS' }].map((s, i) => (
            <div key={i} style={{ flex: '1 1 200px', padding: '28px 32px', textAlign: 'center', borderLeft: i > 0 ? '1px solid #e4e1db' : 'none' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#1a1a2e', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#9e9b96', marginTop: 6, fontWeight: 500 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ═══ FEATURES ═════════════════════════════════════════════════════ */}
        <section style={{ padding: '64px 24px 40px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: 10 }}>Ce qui vous attend</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', lineHeight: 1.2 }}>
              Tout ce dont vous avez besoin,<br />au même endroit.
            </h2>
          </div>
          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} className="feat-card" style={{ background: '#fff', border: '1px solid #e4e1db', borderRadius: 14, padding: '22px 18px', boxShadow: '0 1px 2px rgba(13,12,10,0.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fdf5ec', border: '1px solid #f3c99a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{f.icon}</div>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#0d0c0a', marginBottom: 6, lineHeight: 1.3 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: '#9e9b96', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ AUDIENCE ═════════════════════════════════════════════════════ */}
        <section style={{ padding: '0 24px 72px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
          <div className="aud-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              {
                dark: true, label: 'Propriétaires', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
                title: 'Gérez vos biens en toute autonomie', body: 'Publiez, sélectionnez les dossiers, signez les baux et encaissez les loyers — sans agence, depuis une seule plateforme.',
                items: ['Vérification IA des locataires', 'Génération automatique des quittances', 'État des lieux numérique'],
                ck: '#c4976a', cb: 'rgba(196,151,106,0.2)',
              },
              {
                dark: false, label: 'Locataires', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c4976a" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                title: 'Trouvez et gérez votre logement sereinement', body: 'Constituez votre dossier une fois, candidatez en un clic, suivez votre bail en direct.',
                items: ['Dossier locatif unifié & sécurisé', 'Signature du bail en ligne (eIDAS)', 'Historique des échanges & paiements'],
                ck: '#1b5e3b', cb: '#edf7f2',
              },
            ].map(({ dark, label, icon, title, body, items, ck, cb }) => (
              <div key={label} style={{ background: dark ? '#1a1a2e' : '#fff', border: dark ? 'none' : '1px solid #e4e1db', borderRadius: 16, padding: '32px 28px', position: 'relative', overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 2px rgba(13,12,10,0.04)' }}>
                {dark && <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,151,106,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: dark ? 'rgba(196,151,106,0.13)' : '#f4f2ee', border: dark ? '1px solid rgba(196,151,106,0.22)' : '1px solid #e4e1db', borderRadius: 20, padding: '4px 12px', marginBottom: 18 }}>
                  {icon}<span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: dark ? '#c4976a' : '#9e9b96' }}>{label}</span>
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: dark ? '#fff' : '#0d0c0a', marginBottom: 12, lineHeight: 1.3 }}>{title}</p>
                <p style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,0.42)' : '#9e9b96', marginBottom: 20, lineHeight: 1.7 }}>{body}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {items.map(it => (
                    <div key={it} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: cb, border: `1px solid ${ck}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={ck} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,0.5)' : '#5a5754' }}>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
        <footer style={{ borderTop: '1px solid #e4e1db', padding: '22px 28px', background: '#fff' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BailioMark size={28} />
              <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a' }}>Bailio</span>
              <span style={{ fontSize: 11, color: '#9e9b96' }}>© 2026</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {[{ href: 'https://instagram.com/bailio.fr', icon: <IconIG />, label: '@bailio.fr' }, { href: 'https://twitter.com/bailiofr', icon: <IconX />, label: '@bailiofr' }, { href: 'https://linkedin.com/company/bailio', icon: <IconLI />, label: 'LinkedIn' }].map(({ href, icon, label }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" title={label} className="sb" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e4e1db', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5754', textDecoration: 'none', opacity: 0.7 }}>{icon}</a>
              ))}
              <a href="mailto:contact@bailio.fr" style={{ fontSize: 12, color: '#9e9b96', textDecoration: 'none', fontWeight: 500, marginLeft: 4 }}>contact@bailio.fr</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
