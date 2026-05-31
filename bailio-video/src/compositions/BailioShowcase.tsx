/**
 * BailioShowcase — After Effects-style presentation with:
 * - 3D CSS perspective transforms on UI mockups
 * - Phone + browser mockups with real Bailio UI
 * - Voice-over (edge-tts, fr-FR-DeniseNeural)
 * - Kinetic typography with glitch + light sweep
 * - Particle field
 * - Depth-of-field blur layers
 */
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { B, IMGS } from '../components/tokens'
import { Reveal, WordReveal, LineDraw, Orb, Dot, Ring } from '../components/Reveal'
import { BailioLogo, LogoMark } from '../components/BailioLogo'
import { BrowserFrame, PhoneFrame, BailioHomeMockup, BailioDashboardMockup } from '../components/UIMockup'

/* ─── Timing (30fps) ──────────────────────────────────────────────────────── */
const S = {
  cold:      0,    // 0-2s   — cold open flash
  intro:     60,   // 2-5s   — logo on dark
  tagline:   150,  // 5-11s  — kinetic headline + voice
  phone3d:   330,  // 11-18s — 3D phone reveal showing home page
  browser3d: 540,  // 18-25s — 3D browser tilt showing dashboard
  feat3d:    750,  // 25-32s — feature cards floating 3D
  split3d:   960,  // 32-38s — split screen 3D depth
  zero:      1140, // 38-45s — "0 €" cinematic
  available: 1350, // 45-56s — "Disponible maintenant" + voice
  outro:     1680, // 56-62s — logo outro
} as const

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function usePx(frame: number) {
  const { fps } = useVideoConfig()
  return (f: number, cfg = { damping: 20, stiffness: 65, mass: 1 }) =>
    spring({ frame: Math.max(0, frame - f), fps, config: cfg })
}

function FadeOut({ start, len = 22 }: { start: number; len?: number; at?: never }) {
  const f = useCurrentFrame()
  const op = interpolate(f - start, [0, len * 0.4, len * 0.6, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ background: B.night, opacity: op, zIndex: 50, pointerEvents: 'none' }} />
}

function BgImg({ src, opacity = 0.16, start = 0, blur = 0 }: { src: string; opacity?: number; start?: number; blur?: number }) {
  const f = useCurrentFrame()
  const op = interpolate(f - start, [0, 30], [0, opacity], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: op, filter: blur ? `blur(${blur}px)` : undefined }} />
      <div style={{ position: 'absolute', inset: 0, background: `rgba(26,26,46,0.80)` }} />
    </AbsoluteFill>
  )
}

/* Light sweep effect */
function LightSweep({ start, duration = 40, angle = -25 }: { start: number; duration?: number; angle?: number }) {
  const f = useCurrentFrame()
  const x = interpolate(f - start, [0, duration], [-400, 2400], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div aria-hidden style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5,
    }}>
      <div style={{
        position: 'absolute',
        left: x, top: -100, width: 120, height: 1400,
        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)',
        transform: `rotate(${angle}deg)`,
      }} />
    </div>
  )
}

/* Scanline overlay for slight grittiness */
function Scanlines({ opacity = 0.025 }: { opacity?: number }) {
  return (
    <div aria-hidden style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 99,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)',
      backgroundSize: '100% 4px', opacity,
    }} />
  )
}

/* ─── Scene: Cold open (flash to black) ──────────────────────────────────── */
function SceneCold() {
  const f = useCurrentFrame()
  const op = interpolate(f, [0, 8, 30, 50], [1, 0, 0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ background: '#fff', opacity: op }} />
}

/* ─── Scene: Intro logo ──────────────────────────────────────────────────── */
function SceneIntro() {
  const f = useCurrentFrame()
  const local = f - S.intro
  const bgOp = interpolate(local, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp }}>
      <Orb x={960} y={540} r={650} color="rgba(196,151,106,0.22)" start={S.intro} />
      <Ring x={960} y={540} r={380} start={S.intro + 12} />
      <Dot x={300}  y={180} start={S.intro + 5} size={4} opacity={0.35} />
      <Dot x={1660} y={200} start={S.intro + 8} size={3} opacity={0.30} />
      <Dot x={200}  y={860} start={S.intro + 4} size={5} opacity={0.30} />
      <Dot x={1750} y={850} start={S.intro + 6} size={4} opacity={0.30} />
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BailioLogo startFrame={S.intro + 14} size={96} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── Scene: Kinetic tagline ─────────────────────────────────────────────── */
function SceneTagline() {
  const f = useCurrentFrame()
  const local = f - S.tagline
  void usePx(local)
  const bgOp = interpolate(local, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  /* Line that draws itself, then subtitle slides in, then line 2 */
  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp }}>
      <BgImg src={IMGS.paris} opacity={0.13} start={S.tagline} />
      <Orb x={1600} y={200} r={560} color="rgba(196,151,106,0.22)" start={S.tagline} />
      <LightSweep start={S.tagline + 20} duration={50} />
      <Dot x={120} y={160} start={S.tagline + 4} size={5} opacity={0.40} />
      <Dot x={1800} y={900} start={S.tagline + 7} size={3} opacity={0.30} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 160px' }}>
        <Reveal startFrame={S.tagline + 8} direction="up" distance={14} style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
          <LogoMark size={30} color={B.caramel} />
          <p style={{ fontFamily: B.body, fontSize: 14, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: B.caramel, margin: 0 }}>Bailio</p>
        </Reveal>

        {/* BIG word reveal */}
        <WordReveal
          text="La location immobilière réinventée."
          startFrame={S.tagline + 16}
          stagger={5}
          style={{ justifyContent: 'center', textAlign: 'center', maxWidth: 1200, marginBottom: 36 }}
          wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 104, color: B.cream, lineHeight: 1.1, letterSpacing: '-0.03em' }}
        />

        <LineDraw startFrame={S.tagline + 58} width={200} color="rgba(196,151,106,0.70)" duration={28} />

        <Reveal startFrame={S.tagline + 66} direction="up" distance={18} style={{ marginTop: 30, textAlign: 'center' }}>
          <p style={{ fontFamily: B.body, fontSize: 23, color: 'rgba(250,250,248,0.58)', lineHeight: 1.65, maxWidth: 700, margin: 0 }}>
            Propriétaires et locataires, connectés directement.<br />
            Sans agence. Sans commission.
          </p>
        </Reveal>
      </AbsoluteFill>

      {/* Voice-over */}
      <Audio src={staticFile('audio/s1_tagline.mp3')} startFrom={0} volume={0.92} />
    </AbsoluteFill>
  )
}

/* ─── Scene: 3D Phone with Bailio home ────────────────────────────────────── */
function ScenePhone3D() {
  const f = useCurrentFrame()
  const local = f - S.phone3d
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  /* Phone 3D entry */
  const phoneP = spring({ frame: Math.max(0, local - 10), fps, config: { damping: 18, stiffness: 45, mass: 1.2 } })
  const phoneY = interpolate(phoneP, [0, 1], [200, 0])
  const phoneOp = interpolate(local - 10, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  /* Slow rotation oscillation */
  const rotY = interpolate(local, [0, 180], [-18, 8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const rotX = 4

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 100px' }}>
      <BgImg src={IMGS.interior} opacity={0.12} start={S.phone3d} />
      <Orb x={300} y={540} r={500} color="rgba(196,151,106,0.20)" start={S.phone3d} />
      <LightSweep start={S.phone3d + 30} duration={55} />

      {/* Left: text */}
      <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <Reveal startFrame={S.phone3d + 8} direction="left" distance={30} style={{ marginBottom: 18 }}>
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: B.caramel, margin: 0 }}>Interface mobile</p>
        </Reveal>
        <WordReveal
          text="Tout dans votre poche."
          startFrame={S.phone3d + 16}
          stagger={4}
          style={{ marginBottom: 20 }}
          wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 66, color: B.cream, lineHeight: 1.1, letterSpacing: '-0.02em' }}
        />
        <LineDraw startFrame={S.phone3d + 32} width={80} color="rgba(196,151,106,0.65)" />
        <Reveal startFrame={S.phone3d + 38} direction="up" distance={14} style={{ marginTop: 20 }}>
          <p style={{ fontFamily: B.body, fontSize: 18, color: 'rgba(250,250,248,0.58)', lineHeight: 1.65, maxWidth: 400, margin: 0 }}>
            Publiez, gérez vos candidatures et signez vos baux directement depuis votre smartphone.
          </p>
        </Reveal>
        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          {['iOS & Android','Notifications temps réel','Signature mobile'].map(tag => (
            <Reveal key={tag} startFrame={S.phone3d + 48} direction="up" distance={10}>
              <span style={{ fontFamily: B.body, fontSize: 12, fontWeight: 600, color: B.caramel, background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.30)', borderRadius: 20, padding: '4px 14px', display: 'inline-block' }}>{tag}</span>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Right: 3D phone */}
      <div style={{
        flex: '0 0 50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        perspective: 1400,
      }}>
        <div style={{
          opacity: phoneOp,
          transform: `translateY(${phoneY}px) perspective(1400px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          transformStyle: 'preserve-3d',
          filter: 'drop-shadow(-30px 40px 60px rgba(0,0,0,0.65))',
        }}>
          <PhoneFrame width={340} height={736}>
            <BailioHomeMockup scale={0.265} />
          </PhoneFrame>
        </div>
      </div>

      <Audio src={staticFile('audio/s2_feat1.mp3')} startFrom={0} volume={0.88} />
    </AbsoluteFill>
  )
}

/* ─── Scene: 3D Browser showing Dashboard ────────────────────────────────── */
function SceneBrowser3D() {
  const f = useCurrentFrame()
  const local = f - S.browser3d
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const browserP = spring({ frame: Math.max(0, local - 8), fps, config: { damping: 20, stiffness: 42, mass: 1.2 } })
  const browserY = interpolate(browserP, [0, 1], [160, 0])
  const browserOp = interpolate(local - 8, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const tilt = interpolate(local, [0, 180], [12, -4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#0e0d1a', opacity: bgOp }}>
      <Orb x={960} y={200} r={700} color="rgba(196,151,106,0.18)" start={S.browser3d} />
      <LightSweep start={S.browser3d + 25} duration={60} angle={-18} />
      <Dot x={140} y={140} start={S.browser3d + 4} size={5} opacity={0.35} />
      <Dot x={1780} y={900} start={S.browser3d + 6} size={4} opacity={0.30} />
      <Ring x={960} y={900} r={280} start={S.browser3d + 15} />

      {/* Top label */}
      <Reveal startFrame={S.browser3d + 6} direction="up" distance={16} style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: B.caramel, margin: '0 0 8px', textAlign: 'center' }}>Tableau de bord</p>
      </Reveal>
      <WordReveal
        text="Gérez tout depuis une seule interface."
        startFrame={S.browser3d + 14}
        stagger={4}
        style={{ position: 'absolute', top: 114, left: 0, right: 0, justifyContent: 'center', textAlign: 'center' }}
        wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 54, color: B.cream, lineHeight: 1.1, letterSpacing: '-0.02em' }}
      />

      {/* 3D browser */}
      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: `translateX(-50%)`,
        perspective: 2000,
      }}>
        <div style={{
          opacity: browserOp,
          transform: `translateY(${browserY}px) perspective(2000px) rotateX(${tilt}deg)`,
          transformStyle: 'preserve-3d',
          filter: 'drop-shadow(0px 50px 80px rgba(0,0,0,0.70))',
        }}>
          <BrowserFrame width={1100} height={560} url="bailio.fr/dashboard/owner">
            <BailioDashboardMockup scale={1100 / 1280} />
          </BrowserFrame>
        </div>
        {/* Reflection */}
        <div style={{
          width: 1100, height: 100, marginTop: -4,
          background: 'linear-gradient(to bottom, rgba(26,26,46,0.35), transparent)',
          opacity: browserOp * 0.5,
          transform: `perspective(2000px) rotateX(${tilt}deg) scaleY(-1)`,
          filter: 'blur(2px)',
        }}>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <BailioDashboardMockup scale={1100 / 1280} />
          </div>
        </div>
      </div>

      <Audio src={staticFile('audio/s3_feat2.mp3')} startFrom={0} volume={0.88} />
    </AbsoluteFill>
  )
}

/* ─── Scene: Floating feature cards ─────────────────────────────────────── */
function SceneFeat3D() {
  const f = useCurrentFrame()
  const local = f - S.feat3d
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const cards = [
    { icon: '📄', title: 'Bail électronique', sub: 'Signature eIDAS certifiée', color: '#1a3270', bg: '#eaf0fb', delay: 0 },
    { icon: '✅', title: 'État des lieux digital', sub: 'Photos + comparatif entrée/sortie', color: '#1b5e3b', bg: '#edf7f2', delay: 12 },
    { icon: '🧾', title: 'Quittances auto', sub: 'Générées et envoyées chaque mois', color: B.caramel, bg: '#fdf5ec', delay: 24 },
  ]

  return (
    <AbsoluteFill style={{ background: '#f0ede8', opacity: bgOp, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      <Orb x={960} y={200} r={500} color="rgba(196,151,106,0.18)" start={S.feat3d} />
      <Dot x={140} y={140} start={S.feat3d + 4} size={5} opacity={0.28} />
      <Dot x={1780} y={880} start={S.feat3d + 6} size={4} opacity={0.22} />

      <Reveal startFrame={S.feat3d + 6} direction="up" distance={14} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <LogoMark size={28} color={B.caramel} />
        <p style={{ fontFamily: B.body, fontSize: 14, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: B.caramel, margin: 0 }}>Gestion complète</p>
      </Reveal>
      <WordReveal
        text="Une plateforme, tout inclus."
        startFrame={S.feat3d + 14}
        stagger={4}
        style={{ justifyContent: 'center', marginBottom: 48 }}
        wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 76, color: B.night, lineHeight: 1.1, letterSpacing: '-0.025em' }}
      />

      {/* 3D floating cards */}
      <div style={{ display: 'flex', gap: 28, perspective: 1200 }}>
        {cards.map(({ icon, title, sub, color, bg, delay }) => {
          const cp = spring({ frame: Math.max(0, local - 28 - delay), fps, config: { damping: 16, stiffness: 55, mass: 1.1 } })
          const cy = interpolate(cp, [0, 1], [120, 0])
          const cop = interpolate(local - 28 - delay, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          /* Gentle float */
          const floatY = Math.sin((local / 30) + delay * 0.2) * 6

          return (
            <div key={title} style={{
              opacity: cop,
              transform: `translateY(${cy + floatY}px) perspective(1200px) rotateY(${delay === 12 ? 0 : delay === 0 ? 8 : -8}deg) rotateX(4deg)`,
              transformStyle: 'preserve-3d',
              filter: `drop-shadow(0px ${20 + Math.abs(floatY)}px 40px rgba(0,0,0,0.18))`,
            }}>
              <div style={{
                width: 300, background: '#fff',
                borderRadius: 20, padding: '28px 24px',
                border: `1px solid ${B.border}`,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Top color band */}
                <div style={{ height: 4, background: color, borderRadius: '4px 4px 0 0', position: 'absolute', top: 0, left: 0, right: 0 }} />
                <div style={{ width: 56, height: 56, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: 26 }}>{icon}</div>
                <p style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: B.night, margin: '0 0 8px', lineHeight: 1.2 }}>{title}</p>
                <p style={{ fontFamily: B.body, fontSize: 14, color: B.inkMid, margin: 0, lineHeight: 1.55 }}>{sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      <Audio src={staticFile('audio/s4_feat3.mp3')} startFrom={0} volume={0.88} />
    </AbsoluteFill>
  )
}

/* ─── Scene: Split 3D depth ──────────────────────────────────────────────── */
function SceneSplit3D() {
  const f = useCurrentFrame()
  const local = f - S.split3d
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const leftP = spring({ frame: Math.max(0, local - 4), fps, config: { damping: 20, stiffness: 55 } })
  const leftX = interpolate(leftP, [0, 1], [-150, 0])
  const rightP = spring({ frame: Math.max(0, local - 4), fps, config: { damping: 20, stiffness: 55 } })
  const rightX = interpolate(rightP, [0, 1], [150, 0])
  const op = interpolate(local - 4, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp, display: 'flex' }}>
      <Orb x={960} y={540} r={600} color="rgba(196,151,106,0.18)" start={S.split3d} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(196,151,106,0.25)', transform: 'translateX(-0.5px)' }} />

      {/* Prop side */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', opacity: op, transform: `translateX(${leftX}px)` }}>
        <div style={{ perspective: 1200 }}>
          <div style={{ transform: 'perspective(1200px) rotateY(12deg) rotateX(3deg)', filter: 'drop-shadow(-20px 30px 50px rgba(0,0,0,0.50))', marginBottom: 32 }}>
            <BrowserFrame width={480} height={260} url="bailio.fr/dashboard/owner">
              <BailioDashboardMockup scale={480 / 1280} />
            </BrowserFrame>
          </div>
        </div>
        <Reveal startFrame={S.split3d + 18} direction="up" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: '#5b78c4', margin: '0 0 10px' }}>Propriétaire</p>
          <h2 style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 44, color: B.cream, lineHeight: 1.1, textAlign: 'center', margin: '0 0 14px' }}>Gérez vos biens sereinement.</h2>
          <p style={{ fontFamily: B.body, fontSize: 16, color: 'rgba(250,250,248,0.55)', textAlign: 'center', lineHeight: 1.6, maxWidth: 340 }}>Annonces, candidatures, bail, quittances — tout en ligne.</p>
        </Reveal>
      </div>

      {/* Tenant side */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', opacity: op, transform: `translateX(${rightX}px)` }}>
        <div style={{ perspective: 1200 }}>
          <div style={{ transform: 'perspective(1200px) rotateY(-12deg) rotateX(3deg)', filter: 'drop-shadow(20px 30px 50px rgba(0,0,0,0.50))', marginBottom: 32 }}>
            <PhoneFrame width={220} height={476}>
              <BailioHomeMockup scale={220 / 1280} />
            </PhoneFrame>
          </div>
        </div>
        <Reveal startFrame={S.split3d + 18} direction="up" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: '#55a87a', margin: '0 0 10px' }}>Locataire</p>
          <h2 style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 44, color: B.cream, lineHeight: 1.1, textAlign: 'center', margin: '0 0 14px' }}>Trouvez sans frais d'agence.</h2>
          <p style={{ fontFamily: B.body, fontSize: 16, color: 'rgba(250,250,248,0.55)', textAlign: 'center', lineHeight: 1.6, maxWidth: 340 }}>Des annonces de particuliers, partout en France.</p>
        </Reveal>
      </div>
    </AbsoluteFill>
  )
}

/* ─── Scene: 0 € ─────────────────────────────────────────────────────────── */
function SceneZero() {
  const f = useCurrentFrame()
  const local = f - S.zero
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const bigP = spring({ frame: Math.max(0, local - 16), fps, config: { damping: 26, stiffness: 42 } })
  const bigScale = interpolate(bigP, [0, 1], [0.5, 1])
  const bigOp = interpolate(local - 16, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#f0ede8', opacity: bgOp }}>
      <Orb x={1750} y={100} r={520} color="rgba(196,151,106,0.22)" start={S.zero} />
      <Ring x={200} y={900} r={280} start={S.zero + 10} />
      <Dot x={140} y={140} start={S.zero + 4} size={5} opacity={0.28} />
      <Dot x={1780} y={880} start={S.zero + 6} size={4} opacity={0.22} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 160px' }}>
        <Reveal startFrame={S.zero + 5} direction="up" distance={14} style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
          <LogoMark size={30} color={B.caramel} />
          <p style={{ fontFamily: B.body, fontSize: 14, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: B.caramel, margin: 0 }}>La différence Bailio</p>
        </Reveal>
        <div style={{ opacity: bigOp, transform: `scale(${bigScale})` }}>
          <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 210, color: B.night, lineHeight: 0.88, letterSpacing: '-0.04em', display: 'block', textAlign: 'center' }}>0 €</span>
        </div>
        <div style={{ margin: '28px 0' }}>
          <LineDraw startFrame={S.zero + 34} width={160} color="rgba(196,151,106,0.80)" duration={28} />
        </div>
        <Reveal startFrame={S.zero + 40} direction="up" distance={20}>
          <p style={{ fontFamily: B.body, fontSize: 26, color: B.inkMid, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>de frais d'agence — pour tout le monde.</p>
        </Reveal>
        <Reveal startFrame={S.zero + 55} direction="up" distance={14} style={{ marginTop: 18 }}>
          <p style={{ fontFamily: B.body, fontSize: 16, color: B.inkFaint, textAlign: 'center' }}>Ni pour le locataire. Ni pour le propriétaire.</p>
        </Reveal>
      </AbsoluteFill>

      <Audio src={staticFile('audio/s5_zero.mp3')} startFrom={0} volume={0.90} />
    </AbsoluteFill>
  )
}

/* ─── Scene: Disponible maintenant ──────────────────────────────────────── */
function SceneAvailable() {
  const f = useCurrentFrame()
  const local = f - S.available
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const lineW = interpolate(local - 4, [0, 40], [0, 1920], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const mainP = spring({ frame: Math.max(0, local - 22), fps, config: { damping: 22, stiffness: 46 } })
  const mainY = interpolate(mainP, [0, 1], [80, 0])
  const mainOp = interpolate(local - 22, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const subP = spring({ frame: Math.max(0, local - 58), fps, config: { damping: 18, stiffness: 62 } })
  const subY = interpolate(subP, [0, 1], [30, 0])
  const subOp = interpolate(local - 58, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pulse = 0.55 + 0.45 * Math.sin((local * Math.PI) / 36)

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp }}>
      <BgImg src={IMGS.apartment} opacity={0.14} start={S.available} />
      <Orb x={960} y={540} r={700} color="rgba(196,151,106,0.24)" start={S.available} />
      <Ring x={960} y={540} r={440} start={S.available + 10} />
      <Ring x={960} y={540} r={620} start={S.available + 22} />
      <LightSweep start={S.available + 30} duration={65} />
      {[[180,160,5,5,0.40],[1740,200,8,4,0.35],[200,900,3,3,0.30],[1800,850,6,5,0.35]].map(([x,y,s,sz,op],i) => (
        <Dot key={i} x={x} y={y} start={s} size={sz} opacity={op} />
      ))}
      <div style={{ position: 'absolute', top: 172, left: 0, height: 1, width: lineW, background: 'rgba(196,151,106,0.45)' }} />
      <div style={{ position: 'absolute', bottom: 172, left: 0, height: 1, width: lineW, background: 'rgba(196,151,106,0.45)' }} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: mainOp, transform: `translateY(${mainY}px)`, textAlign: 'center' }}>
          <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 148, color: B.cream, display: 'block', lineHeight: 0.92, letterSpacing: '-0.04em' }}>Disponible</span>
          <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 148, color: B.caramel, display: 'block', lineHeight: 0.92, letterSpacing: '-0.04em' }}>maintenant.</span>
        </div>
        <div style={{ margin: '44px 0' }}>
          <LineDraw startFrame={S.available + 46} width={160} color="rgba(196,151,106,0.70)" duration={28} />
        </div>
        <div style={{ opacity: subOp, transform: `translateY(${subY}px)`, textAlign: 'center' }}>
          <p style={{ fontFamily: B.body, fontSize: 22, color: 'rgba(250,250,248,0.55)', margin: '0 0 16px', letterSpacing: '0.03em' }}>Créez votre compte gratuitement sur</p>
          <p style={{ fontFamily: B.display, fontStyle: 'italic', fontSize: 44, color: B.caramel, margin: 0, opacity: pulse, letterSpacing: '-0.01em' }}>bailio.fr</p>
        </div>
      </AbsoluteFill>

      <Audio src={staticFile('audio/s6_available.mp3')} startFrom={0} volume={0.92} />
    </AbsoluteFill>
  )
}

/* ─── Scene: Outro ───────────────────────────────────────────────────────── */
function SceneOutro() {
  const f = useCurrentFrame()
  const local = f - S.outro
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pulse = 0.55 + 0.45 * Math.sin((local * Math.PI) / 44)

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp }}>
      <Orb x={960} y={540} r={620} color="rgba(196,151,106,0.28)" start={S.outro} />
      <Ring x={960} y={540} r={380} start={S.outro + 8} />
      <Dot x={300}  y={200} start={S.outro + 4} size={4} opacity={0.30} />
      <Dot x={1620} y={180} start={S.outro + 7} size={3} opacity={0.25} />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <BailioLogo startFrame={S.outro + 10} size={110} />
        <Reveal startFrame={S.outro + 38} direction="up" distance={14} style={{ marginTop: 36 }}>
          <p style={{ fontFamily: B.body, fontSize: 17, color: 'rgba(250,250,248,0.32)', letterSpacing: '0.22em', textTransform: 'uppercase', textAlign: 'center' }}>Location entre particuliers, simplement.</p>
        </Reveal>
        <Reveal startFrame={S.outro + 52} direction="up" distance={10} style={{ marginTop: 20 }}>
          <p style={{ fontFamily: B.body, fontSize: 22, color: B.caramel, letterSpacing: '0.10em', opacity: pulse, textAlign: 'center' }}>bailio.fr</p>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export function BailioShowcase() {
  const f = useCurrentFrame()
  const sh = (a: number, b: number) => f >= a - 6 && f < b + 6

  return (
    <AbsoluteFill style={{ background: B.night }}>
      {f < S.intro + 8        && <SceneCold />}
      {sh(S.intro, S.tagline) && <SceneIntro />}
      {sh(S.tagline, S.phone3d) && <SceneTagline />}
      {sh(S.phone3d, S.browser3d) && <ScenePhone3D />}
      {sh(S.browser3d, S.feat3d)  && <SceneBrowser3D />}
      {sh(S.feat3d, S.split3d)    && <SceneFeat3D />}
      {sh(S.split3d, S.zero)      && <SceneSplit3D />}
      {sh(S.zero, S.available)    && <SceneZero />}
      {sh(S.available, S.outro)   && <SceneAvailable />}
      {f >= S.outro - 6           && <SceneOutro />}

      <FadeOut start={S.tagline   - 10} />
      <FadeOut start={S.phone3d   - 10} />
      <FadeOut start={S.browser3d - 10} />
      <FadeOut start={S.feat3d    - 10} />
      <FadeOut start={S.split3d   - 10} />
      <FadeOut start={S.zero      - 10} />
      <FadeOut start={S.available - 10} />
      <FadeOut start={S.outro     - 10} />

      <Scanlines />
    </AbsoluteFill>
  )
}
