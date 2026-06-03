/**
 * BailioMain4K — Composition 4K native (3840×2160)
 * Style : Apple / Stripe / Linear — niveau Awwwards
 * Technique : CSS 3D premium (aucun WebGL — headless compatible)
 * Effets : perspective 3D, bloom CSS, light sweep, particles, lens flare, chromatic aberration
 */
import {
  AbsoluteFill, Audio, Img,
  interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion'
import { B, IMGS } from '../components/tokens'

/* ─── Tokens 4K (tout × 2 vs 1080p) ──────────────────────────────────────── */
const T = {
  ...B,
  bg: '#070614',          // quasi-OLED
  caramelGlow: 'rgba(196,151,106,0.35)',
} as const

/* ─── Timings (@30fps) ───────────────────────────────────────────────────── */
const S = {
  cold:      0,
  logo:      50,
  tagline:   190,
  feat1:     400,
  feat2:     590,
  feat3:     780,
  feat4:     970,
  split:     1160,
  zero:      1350,
  available: 1540,
  outro:     1710,
} as const

/* ─── Utilitaires ─────────────────────────────────────────────────────────── */
function sp(frame: number, fps: number, cfg = { damping: 20, stiffness: 65 }) {
  return spring({ frame: Math.max(0, frame), fps, config: cfg })
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

/* ─── Composants de base ──────────────────────────────────────────────────── */

/** Fondu noir cross-dissolve */
function Dissolve({ at, len = 24 }: { at: number; len?: number }) {
  const f = useCurrentFrame()
  const op = interpolate(f - at, [0, len * 0.4, len * 0.6, len], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  return <AbsoluteFill style={{ background: T.bg, opacity: op, zIndex: 60, pointerEvents: 'none' }} />
}

/** Image Unsplash en fond full-bleed */
function Bg({ src, opacity = 0.14, start = 0 }: { src: string; opacity?: number; start?: number }) {
  const f = useCurrentFrame()
  const op = interpolate(f - start, [0, 40], [0, opacity], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: op }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${T.bg} 0%, rgba(7,6,20,0.82) 100%)` }} />
    </AbsoluteFill>
  )
}

/** Orbe de lumière ambiante */
function Orb({ x, y, r, color, start = 0 }: { x: number; y: number; r: number; color: string; start?: number }) {
  const f = useCurrentFrame()
  const op = interpolate(f - start, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div aria-hidden style={{
      position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2,
      borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
      filter: 'blur(80px)', opacity: op, pointerEvents: 'none',
    }} />
  )
}

/** Lens flare CSS */
function LensFlare({ x, y, start = 0, size = 300 }: { x: number; y: number; start?: number; size?: number }) {
  const f = useCurrentFrame()
  const local = f - start
  const op = interpolate(local, [0, 12, 30, 60], [0, 0.8, 0.4, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div aria-hidden style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, rgba(255,240,200,0.9) 0%, rgba(196,151,106,0.4) 25%, transparent 70%)`,
      filter: 'blur(2px)', opacity: op, pointerEvents: 'none', mixBlendMode: 'screen',
    }} />
  )
}

/** Rayon de lumière diagonal */
function LightRay({ start = 0, duration = 45, angle = -30 }: { start?: number; duration?: number; angle?: number }) {
  const f = useCurrentFrame()
  const x = interpolate(f - start, [0, duration], [-600, 5000], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 8 }}>
      <div style={{
        position: 'absolute', left: x, top: -200, width: 160, height: 3000,
        background: 'linear-gradient(to right, transparent, rgba(196,151,106,0.08), transparent)',
        transform: `rotate(${angle}deg)`,
      }} />
    </div>
  )
}

/** Particule unique */
function P({ x, y, d, s = 3, op = 0.5 }: { x: number; y: number; d: number; s?: number; op?: number }) {
  const f = useCurrentFrame()
  const a = interpolate(f - d, [0, 20], [0, op], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const dy = Math.sin((f / 60 + d) * 0.5) * 8
  return <div aria-hidden style={{ position: 'absolute', left: x, top: y + dy, width: s, height: s, borderRadius: '50%', background: T.caramel, opacity: a, pointerEvents: 'none' }} />
}

/** Grille de particules */
function Particles({ count = 40, seed = 0 }: { count?: number; seed?: number }) {
  const pts = Array.from({ length: count }, (_, i) => {
    const r = Math.sin(i * 127.1 + seed) * 0.5 + 0.5
    const r2 = Math.sin(i * 311.7 + seed) * 0.5 + 0.5
    return {
      x: r * 3840, y: r2 * 2160,
      d: (i * 7) % 40,
      s: 2 + (i % 4),
      op: 0.2 + r * 0.4,
    }
  })
  return <>{pts.map((p, i) => <P key={i} {...p} />)}</>
}

/** Ligne horizontale qui se dessine */
function Line({ start = 0, duration = 35, y = 540, color = 'rgba(196,151,106,0.55)' }: {
  start?: number; duration?: number; y?: number; color?: string
}) {
  const f = useCurrentFrame()
  const w = interpolate(f - start, [0, duration], [0, 3840], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <div aria-hidden style={{ position: 'absolute', left: 0, top: y, width: w, height: 2, background: color, pointerEvents: 'none' }} />
}

/** Anneau (ring) décoratif */
function Ring({ cx, cy, r, start = 0 }: { cx: number; cy: number; r: number; start?: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = sp(f - start, fps, { damping: 28, stiffness: 38 })
  const scale = interpolate(p, [0, 1], [0.3, 1])
  const op = interpolate(f - start, [0, 30], [0, 0.22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div aria-hidden style={{
      position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2,
      borderRadius: '50%', border: `1.5px solid rgba(196,151,106,0.6)`,
      opacity: op, transform: `scale(${scale})`, pointerEvents: 'none',
    }} />
  )
}

/** Word-by-word reveal */
function Words({
  text, startFrame, stagger = 5, style, ws,
}: {
  text: string; startFrame: number; stagger?: number
  style?: React.CSSProperties; ws?: React.CSSProperties
}) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = text.split(' ')
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', ...style }}>
      {words.map((w, i) => {
        const p = sp(f - startFrame - i * stagger, fps, { damping: 22, stiffness: 70 })
        const op = interpolate(f - startFrame - i * stagger, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <span key={i} style={{ display: 'inline-block', opacity: op, transform: `translateY(${lerp(28, 0, p)}px)`, marginRight: '0.28em', ...ws }}>
            {w}
          </span>
        )
      })}
    </div>
  )
}

/** Reveal simple */
function Rev({
  children, start, dir = 'up', dist = 48, style,
}: {
  children: React.ReactNode; start: number; dir?: 'up' | 'down' | 'left' | 'right' | 'scale'; dist?: number; style?: React.CSSProperties
}) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = sp(f - start, fps, { damping: 20, stiffness: 62 })
  const op = interpolate(f - start, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const tx = dir === 'left' ? lerp(dist, 0, p) : dir === 'right' ? lerp(-dist, 0, p) : 0
  const ty = dir === 'up' ? lerp(dist, 0, p) : dir === 'down' ? lerp(-dist, 0, p) : 0
  const sc = dir === 'scale' ? lerp(0.88, 1, p) : 1
  return (
    <div style={{ opacity: op, transform: `translate(${tx}px,${ty}px) scale(${sc})`, ...style }}>
      {children}
    </div>
  )
}

/** Logo Bailio animé */
function Logo({ start = 0, size = 96 }: { start?: number; size?: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = sp(f - start, fps, { damping: 16, stiffness: 52 })
  const op = interpolate(f - start, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const sc = lerp(0.7, 1, p)
  const dotp = sp(Math.max(0, f - start - 10), fps, { damping: 10, stiffness: 130 })
  const dotSc = lerp(0, 1, dotp)
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, opacity: op, transform: `scale(${sc})` }}>
      {/* House SVG */}
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 48 48" fill="none" style={{ marginRight: 18, flexShrink: 0 }}>
        <rect x="8" y="20" width="32" height="24" rx="3" stroke={T.cream} strokeWidth="2" />
        <path d="M4 22 L24 6 L44 22" stroke={T.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="30" width="12" height="14" rx="2" fill={T.caramel} />
        <circle cx="38" cy="10" r="4" fill={T.caramel} />
      </svg>
      <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: size, color: T.cream, lineHeight: 1, letterSpacing: '-0.025em' }}>bailio</span>
      <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: size, color: T.caramel, lineHeight: 1, display: 'inline-block', transform: `scale(${dotSc})`, transformOrigin: 'bottom center' }}>.</span>
    </div>
  )
}

/* ─── 3D PHONE mockup CSS ─────────────────────────────────────────────────── */
function Phone3D({ start, rotY = -18, rotX = 4 }: { start: number; rotY?: number; rotX?: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = f - start
  const p = sp(local - 10, fps, { damping: 16, stiffness: 42 })
  const op = interpolate(local - 10, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const ty = lerp(240, 0, p)
  const ry = interpolate(local, [0, 200], [rotY, rotY + 22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const W = 480, H = 980
  const sw = W + 48, sh = H + 80

  return (
    <div style={{ opacity: op, transform: `translateY(${ty}px)`, perspective: 2400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: sw, height: sh,
        transform: `perspective(2400px) rotateY(${ry}deg) rotateX(${rotX}deg)`,
        transformStyle: 'preserve-3d',
        filter: `drop-shadow(${-ry * 0.8}px 60px 100px rgba(0,0,0,0.7)) drop-shadow(0px 0px 40px rgba(196,151,106,0.25))`,
      }}>
        {/* Phone body */}
        <div style={{ width: sw, height: sh, borderRadius: 72, background: 'linear-gradient(145deg, #1a1a2e 0%, #0d0c18 100%)', boxShadow: 'inset 0 0 0 2px #2a2a3e, inset 0 0 0 3px #111125', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '24px 24px 32px' }}>
          {/* Notch */}
          <div style={{ width: 140, height: 36, background: '#0d0c18', borderRadius: '0 0 24px 24px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#1a1a2e' }} />
            <div style={{ width: 70, height: 8, borderRadius: 5, background: '#1a1a2e' }} />
          </div>
          {/* Screen */}
          <div style={{ width: W, height: H, borderRadius: 52, overflow: 'hidden', position: 'relative' }}>
            {/* Screen gradient — simule l'UI Bailio */}
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, #1a1a2e 0%, #0f0e22 40%, #1a1a2e 100%)` }}>
              {/* Nav bar simulée */}
              <div style={{ height: 72, display: 'flex', alignItems: 'center', padding: '0 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: T.caramel }}>bailio.</span>
              </div>
              {/* Hero search */}
              <div style={{ padding: '32px 28px 20px' }}>
                <div style={{ height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)' }} />
                  <span style={{ fontFamily: T.body, fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>Ville, code postal...</span>
                </div>
              </div>
              {/* Cards */}
              <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { price: '1 200 €/mois', rooms: '3 pièces · 65 m²', city: 'Paris 11e', col: '#1a3270' },
                  { price: '850 €/mois', rooms: '2 pièces · 42 m²', city: 'Lyon 3e', col: '#1b5e3b' },
                  { price: '1 650 €/mois', rooms: '4 pièces · 90 m²', city: 'Bordeaux', col: '#4a2a10' },
                ].map((card, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden', display: 'flex', height: 80 }}>
                    <div style={{ width: 80, background: card.col, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: '12px 16px' }}>
                      <p style={{ fontFamily: T.body, fontSize: 15, fontWeight: 700, color: T.cream, margin: 0 }}>{card.price}</p>
                      <p style={{ fontFamily: T.body, fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{card.rooms} · {card.city}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Reflet */}
        <div style={{ position: 'absolute', bottom: -sh * 0.12, left: 0, width: sw, height: sh * 0.15, borderRadius: '0 0 72px 72px', background: `linear-gradient(to bottom, rgba(196,151,106,0.06), transparent)`, filter: 'blur(4px)', transform: 'scaleY(-0.5)', opacity: 0.4 }} />
      </div>
    </div>
  )
}

/* ─── 3D BROWSER mockup CSS ──────────────────────────────────────────────── */
function Browser3D({ start, rotX = 12 }: { start: number; rotX?: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = f - start
  const p = sp(local - 8, fps, { damping: 18, stiffness: 40 })
  const op = interpolate(local - 8, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const ty = lerp(200, 0, p)
  const rx = interpolate(local, [0, 200], [rotX, -4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const W = 1400, H = 820

  return (
    <div style={{ opacity: op, transform: `translateY(${ty}px)`, perspective: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `perspective(3000px) rotateX(${rx}deg)`, transformStyle: 'preserve-3d', filter: 'drop-shadow(0px 60px 120px rgba(0,0,0,0.75))' }}>
        {/* Browser chrome */}
        <div style={{ width: W, background: '#1e1e1e', borderRadius: 16, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px #333' }}>
          <div style={{ height: 52, background: '#2a2a2a', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10 }}>
            {['#ff5f57','#febc2e','#28c840'].map((c,i) => <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />)}
            <div style={{ flex: 1, maxWidth: 500, height: 30, margin: '0 auto', background: '#3a3a3a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #777' }} />
              <span style={{ fontSize: 14, color: '#aaa', fontFamily: T.body }}>bailio.fr/dashboard</span>
            </div>
          </div>
          {/* Page content — dashboard simulé */}
          <div style={{ width: W, height: H, display: 'flex', background: '#f4f2ee', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{ width: 240, background: '#1a1a2e', padding: '24px 0' }}>
              <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
                <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 26, color: T.caramel }}>bailio</span>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: T.body, margin: '3px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Propriétaire</p>
              </div>
              {['Mes annonces','Candidatures','Visites','Messages','Contrats','Quittances'].map((l, i) => (
                <div key={l} style={{ padding: '9px 13px', margin: '1px 8px', borderRadius: 8, background: i === 0 ? 'rgba(196,151,106,0.15)' : 'transparent', borderLeft: i === 0 ? `3px solid ${T.caramel}` : '3px solid transparent' }}>
                  <span style={{ fontSize: 14, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.55)', fontFamily: T.body, fontWeight: i === 0 ? 600 : 400 }}>{l}</span>
                </div>
              ))}
            </div>
            {/* Main */}
            <div style={{ flex: 1, padding: '32px 36px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 4px', fontFamily: T.body }}>Tableau de bord</p>
              <h2 style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 32, color: T.ink, margin: '0 0 28px' }}>Mes annonces</h2>
              <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
                {[{ l:'Biens actifs',v:'2',c:'#1b5e3b',bg:'#edf7f2'},{l:'Candidatures',v:'8',c:'#1a3270',bg:'#eaf0fb'},{l:'Visites',v:'3',c:T.caramel,bg:'#fdf5ec'}].map(({l,v,c,bg}) => (
                  <div key={l} style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '18px 22px', border: '1px solid #e4e1db' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#9e9b96', margin: '0 0 8px', fontFamily: T.body }}>{l}</p>
                    <p style={{ fontSize: 38, fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, color: c, margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {['3P — Paris 11e','2P — Lyon 3e'].map((t,i) => (
                  <div key={t} style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #e4e1db', overflow: 'hidden' }}>
                    <div style={{ height: 110, background: i === 0 ? '#1a3270' : '#1b5e3b' }} />
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 18, fontWeight: 700, color: T.ink, margin: 0 }}>{t}</p>
                      <p style={{ fontFamily: T.body, fontSize: 13, color: '#888', margin: '3px 0 0' }}>{i===0?'1 200 €/mois · Loué':'850 €/mois · Disponible'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Reflet */}
        <div style={{ position: 'absolute', bottom: -H * 0.08, left: 0, width: W, height: H * 0.1, background: `linear-gradient(to bottom, rgba(26,26,46,0.25), transparent)`, filter: 'blur(3px)', transform: 'scaleY(-0.6)', opacity: 0.35 }} />
      </div>
    </div>
  )
}

/* ─── Feature Card 3D ─────────────────────────────────────────────────────── */
function FeatureCard3D({ start, index, icon, title, sub, color, bg }: {
  start: number; index: number; icon: string; title: string; sub: string; color: string; bg: string
}) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const delay = index * 15
  const local = f - start - delay
  const p = sp(local - 14, fps, { damping: 16, stiffness: 50 })
  const op = interpolate(local - 14, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const ty = lerp(160, 0, p)
  const rotY = index === 0 ? 10 : index === 2 ? -10 : 0
  const tz = index === 1 ? 0 : -60
  const floatY = Math.sin(f / 35 + index * 1.3) * 10

  return (
    <div style={{ opacity: op, transform: `translateY(${ty + floatY}px)`, perspective: 1800 }}>
      <div style={{
        width: 360,
        transform: `perspective(1800px) rotateY(${rotY}deg) translateZ(${tz}px)`,
        transformStyle: 'preserve-3d',
        filter: `drop-shadow(0px ${20 + Math.abs(floatY)}px 50px rgba(0,0,0,0.25))`,
      }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px', border: '1px solid #e4e1db', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: color, borderRadius: '5px 5px 0 0' }} />
          <div style={{ width: 72, height: 72, borderRadius: 18, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, fontSize: 34 }}>{icon}</div>
          <p style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: T.ink, margin: '0 0 12px', lineHeight: 1.2 }}>{title}</p>
          <p style={{ fontFamily: T.body, fontSize: 17, color: T.inkMid, margin: 0, lineHeight: 1.6 }}>{sub}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Scènes ──────────────────────────────────────────────────────────────── */

function SceneCold() {
  const f = useCurrentFrame()
  const op = interpolate(f, [0, 10, 40, 50], [1, 0, 0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ background: '#fff', opacity: op }} />
}

function SceneLogo() {
  const f = useCurrentFrame()
  const local = f - S.logo
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: T.bg, opacity: bgOp }}>
      <Orb x={3000} y={400} r={1200} color={T.caramelGlow} start={S.logo} />
      <Orb x={400} y={1800} r={900} color="rgba(196,151,106,0.12)" start={S.logo + 15} />
      <Ring cx={1920} cy={1080} r={700} start={S.logo + 12} />
      <Ring cx={1920} cy={1080} r={1050} start={S.logo + 24} />
      <Ring cx={1920} cy={1080} r={1400} start={S.logo + 36} />
      <Particles count={50} seed={1} />

      <LightRay start={S.logo + 30} duration={60} angle={-20} />
      <LensFlare x={3200} y={250} start={S.logo + 40} size={600} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <Logo start={S.logo + 20} size={120} />
        <Rev start={S.logo + 55} dir="up" dist={32} style={{ marginTop: 36 }}>
          <p style={{ fontFamily: T.body, fontSize: 22, color: 'rgba(250,250,248,0.40)', letterSpacing: '0.24em', textTransform: 'uppercase', textAlign: 'center' }}>
            Location entre particuliers
          </p>
        </Rev>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function SceneTagline() {
  const f = useCurrentFrame()
  const local = f - S.tagline
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: T.bg, opacity: bgOp }}>
      <Bg src={IMGS.paris} opacity={0.12} start={S.tagline} />
      <Orb x={1920} y={300} r={1400} color="rgba(196,151,106,0.18)" start={S.tagline} />
      <Particles count={35} seed={2} />
      <LightRay start={S.tagline + 22} duration={55} angle={-28} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 240px' }}>
        <Rev start={S.tagline + 8} dir="up" dist={20} style={{ marginBottom: 36, display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="20" width="32" height="24" rx="3" stroke={T.caramel} strokeWidth="2" />
            <path d="M4 22 L24 6 L44 22" stroke={T.caramel} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="18" y="30" width="12" height="14" rx="2" fill={T.caramel} />
            <circle cx="38" cy="10" r="4" fill={T.caramel} />
          </svg>
          <p style={{ fontFamily: T.body, fontSize: 17, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.caramel, margin: 0 }}>Bailio</p>
        </Rev>

        <Words
          text="La location immobilière réinventée."
          startFrame={S.tagline + 18}
          stagger={6}
          style={{ justifyContent: 'center', maxWidth: 1800, marginBottom: 0 }}
          ws={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 128, color: T.cream, lineHeight: 1.1, letterSpacing: '-0.03em' }}
        />

        <div style={{ marginTop: 44, marginBottom: 44 }}>
          <div style={{ width: 0, height: 2, background: T.caramel, animation: 'none' }}>
            <Line start={S.tagline + 68} duration={32} y={0} color="rgba(196,151,106,0.80)" />
          </div>
        </div>

        <Rev start={S.tagline + 78} dir="up" dist={24}>
          <p style={{ fontFamily: T.body, fontSize: 28, color: 'rgba(250,250,248,0.56)', lineHeight: 1.65, textAlign: 'center', maxWidth: 1200, margin: 0 }}>
            Propriétaires et locataires, connectés directement.<br />Sans agence. Sans commission.
          </p>
        </Rev>
      </AbsoluteFill>

      <Line start={S.tagline + 68} duration={32} y={1080 * 2 - 240} color="rgba(196,151,106,0.25)" />
      <Audio src={staticFile('audio/s1_tagline.mp3')} startFrom={0} volume={0.92} />
    </AbsoluteFill>
  )
}

function SceneFeat1() {
  const f = useCurrentFrame()
  const local = f - S.feat1
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: T.bg, opacity: bgOp, display: 'flex', alignItems: 'center' }}>
      <Bg src={IMGS.interior} opacity={0.11} start={S.feat1} />
      <Orb x={400} y={1080} r={1100} color="rgba(196,151,106,0.22)" start={S.feat1} />
      <Particles count={28} seed={3} />
      <LightRay start={S.feat1 + 28} duration={50} angle={-18} />

      {/* Left: text */}
      <div style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', padding: '0 100px 0 140px', zIndex: 2 }}>
        <Rev start={S.feat1 + 8} dir="left" dist={40} style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: T.body, fontSize: 15, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.caramel, margin: 0 }}>Annonce</p>
        </Rev>
        <Words
          text="Publiez en 8 minutes."
          startFrame={S.feat1 + 16}
          stagger={5}
          style={{ marginBottom: 36 }}
          ws={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 84, color: T.cream, lineHeight: 1.1, letterSpacing: '-0.02em' }}
        />
        <Line start={S.feat1 + 34} duration={28} y={0} color="rgba(196,151,106,0.70)" />
        <div style={{ height: 3 }} />
        <Rev start={S.feat1 + 42} dir="up" dist={20} style={{ marginTop: 28 }}>
          <p style={{ fontFamily: T.body, fontSize: 22, color: 'rgba(250,250,248,0.58)', lineHeight: 1.7, maxWidth: 600, margin: 0 }}>
            Photos, description, loyer — votre bien est en ligne immédiatement, partout en France.
          </p>
        </Rev>
        <Rev start={S.feat1 + 56} dir="up" dist={16} style={{ marginTop: 28, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {['iOS & Android','Notifications temps réel','Signature mobile'].map(tag => (
            <span key={tag} style={{ fontFamily: T.body, fontSize: 14, fontWeight: 600, color: T.caramel, background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.30)', borderRadius: 40, padding: '6px 18px' }}>{tag}</span>
          ))}
        </Rev>
      </div>

      {/* Right: 3D phone */}
      <div style={{ flex: '0 0 54%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Phone3D start={S.feat1} rotY={-22} />
      </div>

      <Audio src={staticFile('audio/s2_feat1.mp3')} startFrom={0} volume={0.88} />
    </AbsoluteFill>
  )
}

function SceneFeat2() {
  const f = useCurrentFrame()
  const local = f - S.feat2
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: T.bg, opacity: bgOp, display: 'flex', alignItems: 'center' }}>
      <Bg src={IMGS.handshake} opacity={0.10} start={S.feat2} />
      <Orb x={3500} y={1080} r={1100} color="rgba(196,151,106,0.20)" start={S.feat2} />
      <Particles count={28} seed={4} />

      {/* Left: 3D browser */}
      <div style={{ flex: '0 0 52%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 60 }}>
        <Browser3D start={S.feat2} rotX={10} />
      </div>

      {/* Right: text */}
      <div style={{ flex: '0 0 48%', display: 'flex', flexDirection: 'column', padding: '0 140px 0 60px', zIndex: 2 }}>
        <Rev start={S.feat2 + 8} dir="right" dist={40} style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: T.body, fontSize: 15, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.caramel, margin: 0 }}>Candidatures</p>
        </Rev>
        <Words
          text="Choisissez votre locataire."
          startFrame={S.feat2 + 16}
          stagger={5}
          style={{ marginBottom: 36 }}
          ws={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 78, color: T.cream, lineHeight: 1.1, letterSpacing: '-0.02em' }}
        />
        <Line start={S.feat2 + 34} duration={28} y={0} color="rgba(196,151,106,0.70)" />
        <div style={{ height: 3 }} />
        <Rev start={S.feat2 + 42} dir="up" dist={20} style={{ marginTop: 28 }}>
          <p style={{ fontFamily: T.body, fontSize: 22, color: 'rgba(250,250,248,0.58)', lineHeight: 1.7, maxWidth: 600, margin: 0 }}>
            Recevez les dossiers complets, comparez les profils et répondez en un seul clic.
          </p>
        </Rev>
      </div>

      <Audio src={staticFile('audio/s3_feat2.mp3')} startFrom={0} volume={0.88} />
    </AbsoluteFill>
  )
}

function SceneFeat3() {
  const f = useCurrentFrame()
  const local = f - S.feat3
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: '#f0ede8', opacity: bgOp, display: 'flex', alignItems: 'center' }}>
      <Orb x={3600} y={200} r={1000} color="rgba(196,151,106,0.15)" start={S.feat3} />
      <LightRay start={S.feat3 + 20} duration={50} angle={-22} />

      {/* Left: text */}
      <div style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', padding: '0 80px 0 140px', zIndex: 2 }}>
        <Rev start={S.feat3 + 8} dir="left" dist={40} style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: T.body, fontSize: 15, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.caramel, margin: 0 }}>Bail électronique</p>
        </Rev>
        <Words
          text="Signez en ligne. C'est légal."
          startFrame={S.feat3 + 16}
          stagger={4}
          style={{ marginBottom: 36 }}
          ws={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 80, color: T.ink, lineHeight: 1.1, letterSpacing: '-0.02em' }}
        />
        <Rev start={S.feat3 + 40} dir="up" dist={20} style={{ marginTop: 4 }}>
          <p style={{ fontFamily: T.body, fontSize: 22, color: T.inkMid, lineHeight: 1.7, maxWidth: 600, margin: 0 }}>
            Signature eIDAS certifiée. Votre contrat a la même valeur juridique qu'un acte notarié.
          </p>
        </Rev>
      </div>

      {/* Right: contract 3D tilt */}
      <div style={{ flex: '0 0 54%', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1600 }}>
        {(() => {
          const { fps } = useVideoConfig()
          const p = sp(f - S.feat3 - 10, fps, { damping: 18, stiffness: 44 })
          const op = interpolate(f - S.feat3 - 10, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const ty = lerp(200, 0, p)
          const rx = interpolate(f - S.feat3, [0, 180], [20, -5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const floatY = Math.sin(f / 50) * 12
          return (
            <div style={{ opacity: op, transform: `translateY(${ty + floatY}px) perspective(1600px) rotateX(${rx}deg) rotateZ(-2deg)`, filter: 'drop-shadow(0px 40px 80px rgba(0,0,0,0.18))' }}>
              <div style={{ width: 640, height: 860, background: '#fff', borderRadius: 20, border: '1px solid #ddd', padding: '48px 48px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                  <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="20" width="32" height="24" rx="3" stroke={T.caramel} strokeWidth="2" />
                    <path d="M4 22 L24 6 L44 22" stroke={T.caramel} strokeWidth="2" strokeLinecap="round" />
                    <rect x="18" y="30" width="12" height="14" rx="2" fill={T.caramel} />
                  </svg>
                  <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: T.caramel }}>bailio</span>
                </div>
                <h3 style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: T.ink, margin: '0 0 24px', lineHeight: 1.2 }}>Contrat de location<br />– Bail ALUR</h3>
                {[...Array(12)].map((_, i) => (
                  <div key={i} style={{ height: i % 4 === 3 ? 18 : 12, background: i < 5 ? '#0d0c0a' : '#e4e1db', borderRadius: 4, marginBottom: 14, width: i % 3 === 2 ? '60%' : i % 5 === 4 ? '80%' : '100%', opacity: i < 5 ? 1 : 0.7 }} />
                ))}
                <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, height: 56, borderRadius: 8, background: T.caramel, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: T.body, fontSize: 15, fontWeight: 700, color: '#fff' }}>Signer — eIDAS</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      <Audio src={staticFile('audio/s4_feat3.mp3')} startFrom={0} volume={0.88} />
    </AbsoluteFill>
  )
}

function SceneFeat4() {
  const f = useCurrentFrame()
  const local = f - S.feat4
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: '#f0ede8', opacity: bgOp }}>
      <Orb x={1920} y={300} r={1100} color="rgba(196,151,106,0.12)" start={S.feat4} />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 240px' }}>
        <Rev start={S.feat4 + 6} dir="up" dist={20} style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="20" width="32" height="24" rx="3" stroke={T.caramel} strokeWidth="2" />
            <path d="M4 22 L24 6 L44 22" stroke={T.caramel} strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="30" width="12" height="14" rx="2" fill={T.caramel} />
          </svg>
          <p style={{ fontFamily: T.body, fontSize: 15, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.caramel, margin: 0 }}>Gestion complète</p>
        </Rev>
        <Words
          text="Une plateforme, tout inclus."
          startFrame={S.feat4 + 14}
          stagger={5}
          style={{ justifyContent: 'center', marginBottom: 60 }}
          ws={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 96, color: T.ink, lineHeight: 1.1, letterSpacing: '-0.025em' }}
        />
        {/* 3 Floating feature cards */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start', perspective: 1600 }}>
          <FeatureCard3D start={S.feat4} index={0} icon="📄" title="Bail électronique" sub="Signature eIDAS certifiée, valeur juridique complète." color="#1a3270" bg="#eaf0fb" />
          <FeatureCard3D start={S.feat4} index={1} icon="✅" title="État des lieux digital" sub="Photos comparatives entrée/sortie, désaccords gérés en ligne." color="#1b5e3b" bg="#edf7f2" />
          <FeatureCard3D start={S.feat4} index={2} icon="🧾" title="Quittances automatiques" sub="Générées et envoyées le 1er du mois, sans intervention." color={T.caramel} bg="#fdf5ec" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function SceneSplit() {
  const f = useCurrentFrame()
  const local = f - S.split
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const leftP = sp(local - 4, fps, { damping: 20, stiffness: 52 })
  const rightP = sp(local - 4, fps, { damping: 20, stiffness: 52 })
  const op = interpolate(local - 4, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: T.bg, opacity: bgOp, display: 'flex' }}>
      <Bg src={IMGS.interior} opacity={0.10} start={S.split} />
      <div style={{ position: 'absolute', left: '50%', top: '8%', width: 1, height: '84%', background: 'rgba(196,151,106,0.28)', transform: 'translateX(-0.5px)' }} />

      {/* Propriétaire */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px', opacity: op, transform: `translateX(${lerp(-180, 0, leftP)}px)` }}>
        <div style={{ marginBottom: 40, perspective: 1400 }}>
          <Browser3D start={S.split} rotX={8} />
        </div>
        <Rev start={S.split + 18} dir="up" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: T.body, fontSize: 15, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5b78c4', margin: '0 0 12px' }}>Propriétaire</p>
          <h2 style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: T.cream, lineHeight: 1.1, textAlign: 'center', margin: '0 0 16px' }}>Gérez vos biens sereinement.</h2>
          <p style={{ fontFamily: T.body, fontSize: 20, color: 'rgba(250,250,248,0.55)', textAlign: 'center', lineHeight: 1.6, maxWidth: 440 }}>Annonces, candidatures, bail, quittances — tout en ligne.</p>
        </Rev>
      </div>

      {/* Locataire */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px', opacity: op, transform: `translateX(${lerp(180, 0, rightP)}px)` }}>
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Phone3D start={S.split} rotY={18} />
        </div>
        <Rev start={S.split + 18} dir="up" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: T.body, fontSize: 15, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#55a87a', margin: '0 0 12px' }}>Locataire</p>
          <h2 style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: T.cream, lineHeight: 1.1, textAlign: 'center', margin: '0 0 16px' }}>Trouvez sans frais d'agence.</h2>
          <p style={{ fontFamily: T.body, fontSize: 20, color: 'rgba(250,250,248,0.55)', textAlign: 'center', lineHeight: 1.6, maxWidth: 440 }}>Des annonces de particuliers, partout en France.</p>
        </Rev>
      </div>
    </AbsoluteFill>
  )
}

function SceneZero() {
  const f = useCurrentFrame()
  const local = f - S.zero
  const { fps, width } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const bigP = sp(local - 16, fps, { damping: 26, stiffness: 40 })
  const bigScale = lerp(0.45, 1, bigP)
  const bigOp = interpolate(local - 16, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#f0ede8', opacity: bgOp }}>
      <Orb x={width * 0.85} y={200} r={1200} color="rgba(196,151,106,0.20)" start={S.zero} />
      <Ring cx={1920} cy={1080} r={600} start={S.zero + 8} />
      <Ring cx={1920} cy={1080} r={950} start={S.zero + 20} />
      <Particles count={24} seed={7} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 200px' }}>
        <Rev start={S.zero + 5} dir="up" dist={20} style={{ marginBottom: 36, display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="20" width="32" height="24" rx="3" stroke={T.caramel} strokeWidth="2" />
            <path d="M4 22 L24 6 L44 22" stroke={T.caramel} strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="30" width="12" height="14" rx="2" fill={T.caramel} />
          </svg>
          <p style={{ fontFamily: T.body, fontSize: 16, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.caramel, margin: 0 }}>La différence Bailio</p>
        </Rev>

        <div style={{ opacity: bigOp, transform: `scale(${bigScale})` }}>
          <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 420, color: T.ink, lineHeight: 0.85, letterSpacing: '-0.04em', display: 'block', textAlign: 'center' }}>
            0 €
          </span>
        </div>

        <div style={{ marginTop: 40, marginBottom: 36, width: 0, height: 3 }}>
          <Line start={S.zero + 34} duration={30} y={0} color="rgba(196,151,106,0.85)" />
        </div>
        <div style={{ height: 3 }} />

        <Rev start={S.zero + 40} dir="up" dist={24}>
          <p style={{ fontFamily: T.body, fontSize: 30, color: T.inkMid, textAlign: 'center', margin: 0, lineHeight: 1.5, letterSpacing: '0.02em' }}>
            de frais d'agence — pour tout le monde.
          </p>
        </Rev>
        <Rev start={S.zero + 56} dir="up" dist={16} style={{ marginTop: 20 }}>
          <p style={{ fontFamily: T.body, fontSize: 18, color: T.inkFaint, textAlign: 'center', letterSpacing: '0.06em' }}>
            Ni pour le locataire. Ni pour le propriétaire.
          </p>
        </Rev>
      </AbsoluteFill>

      <Audio src={staticFile('audio/s5_zero.mp3')} startFrom={0} volume={0.90} />
    </AbsoluteFill>
  )
}

function SceneAvailable() {
  const f = useCurrentFrame()
  const local = f - S.available
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const lineW = interpolate(local - 5, [0, 42], [0, 3840], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const mainP = sp(local - 22, fps, { damping: 22, stiffness: 46 })
  const mainY = lerp(100, 0, mainP)
  const mainOp = interpolate(local - 22, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const subP = sp(local - 62, fps, { damping: 18, stiffness: 62 })
  const subY = lerp(40, 0, subP)
  const subOp = interpolate(local - 62, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pulse = 0.55 + 0.45 * Math.sin((local * Math.PI) / 38)

  return (
    <AbsoluteFill style={{ background: T.bg, opacity: bgOp }}>
      <Bg src={IMGS.apartment} opacity={0.13} start={S.available} />
      <Orb x={1920} y={1080} r={1500} color="rgba(196,151,106,0.26)" start={S.available} />
      <Ring cx={1920} cy={1080} r={900} start={S.available + 10} />
      <Ring cx={1920} cy={1080} r={1350} start={S.available + 22} />
      <Ring cx={1920} cy={1080} r={1800} start={S.available + 34} />
      <Particles count={55} seed={8} />
      <LightRay start={S.available + 30} duration={70} angle={-20} />
      <LensFlare x={3400} y={300} start={S.available + 35} size={700} />
      <LensFlare x={400} y={1800} start={S.available + 45} size={500} />

      {/* Horizontal lines */}
      <div style={{ position: 'absolute', top: 220, left: 0, height: 2, width: lineW, background: 'rgba(196,151,106,0.50)' }} />
      <div style={{ position: 'absolute', bottom: 220, left: 0, height: 2, width: lineW, background: 'rgba(196,151,106,0.50)' }} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: mainOp, transform: `translateY(${mainY}px)`, textAlign: 'center' }}>
          <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 296, color: T.cream, display: 'block', lineHeight: 0.9, letterSpacing: '-0.04em' }}>Disponible</span>
          <span style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 296, color: T.caramel, display: 'block', lineHeight: 0.9, letterSpacing: '-0.04em' }}>maintenant.</span>
        </div>

        <div style={{ marginTop: 60, marginBottom: 50 }}>
          <Line start={S.available + 48} duration={30} y={0} color="rgba(196,151,106,0.75)" />
          <div style={{ height: 2 }} />
        </div>

        <div style={{ opacity: subOp, transform: `translateY(${subY}px)`, textAlign: 'center' }}>
          <p style={{ fontFamily: T.body, fontSize: 26, color: 'rgba(250,250,248,0.55)', margin: '0 0 18px', letterSpacing: '0.03em' }}>
            Créez votre compte gratuitement sur
          </p>
          <p style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 58, color: T.caramel, margin: 0, opacity: pulse, letterSpacing: '-0.01em' }}>
            bailio.fr
          </p>
        </div>
      </AbsoluteFill>

      <Audio src={staticFile('audio/s6_available.mp3')} startFrom={0} volume={0.92} />
    </AbsoluteFill>
  )
}

function SceneOutro() {
  const f = useCurrentFrame()
  const local = f - S.outro
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pulse = 0.55 + 0.45 * Math.sin((local * Math.PI) / 44)
  const fadeOut = interpolate(local, [110, 150], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: T.bg, opacity: bgOp * fadeOut }}>
      <Orb x={1920} y={1080} r={1400} color="rgba(196,151,106,0.28)" start={S.outro} />
      <Ring cx={1920} cy={1080} r={750} start={S.outro + 8} />
      <Ring cx={1920} cy={1080} r={1100} start={S.outro + 18} />
      <Particles count={40} seed={9} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Logo start={S.outro + 10} size={120} />
        <Rev start={S.outro + 40} dir="up" dist={16} style={{ marginTop: 40 }}>
          <p style={{ fontFamily: T.body, fontSize: 18, color: 'rgba(250,250,248,0.30)', letterSpacing: '0.24em', textTransform: 'uppercase', textAlign: 'center' }}>
            Location entre particuliers, simplement.
          </p>
        </Rev>
        <Rev start={S.outro + 55} dir="up" dist={12} style={{ marginTop: 22 }}>
          <p style={{ fontFamily: T.body, fontSize: 24, color: T.caramel, letterSpacing: '0.10em', opacity: pulse, textAlign: 'center' }}>
            bailio.fr
          </p>
        </Rev>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── Main export ──────────────────────────────────────────────────────────── */
export function BailioMain4K() {
  const f = useCurrentFrame()
  const sh = (a: number, b: number) => f >= a - 7 && f < b + 7

  return (
    <AbsoluteFill style={{ background: T.bg }}>
      {f < S.logo + 10                && <SceneCold />}
      {sh(S.logo,      S.tagline)     && <SceneLogo />}
      {sh(S.tagline,   S.feat1)       && <SceneTagline />}
      {sh(S.feat1,     S.feat2)       && <SceneFeat1 />}
      {sh(S.feat2,     S.feat3)       && <SceneFeat2 />}
      {sh(S.feat3,     S.feat4)       && <SceneFeat3 />}
      {sh(S.feat4,     S.split)       && <SceneFeat4 />}
      {sh(S.split,     S.zero)        && <SceneSplit />}
      {sh(S.zero,      S.available)   && <SceneZero />}
      {sh(S.available, S.outro)       && <SceneAvailable />}
      {f >= S.outro - 7               && <SceneOutro />}

      <Dissolve at={S.tagline   - 12} />
      <Dissolve at={S.feat1     - 12} />
      <Dissolve at={S.feat2     - 12} />
      <Dissolve at={S.feat3     - 12} />
      <Dissolve at={S.feat4     - 12} />
      <Dissolve at={S.split     - 12} />
      <Dissolve at={S.zero      - 12} />
      <Dissolve at={S.available - 12} />
      <Dissolve at={S.outro     - 12} />
    </AbsoluteFill>
  )
}
