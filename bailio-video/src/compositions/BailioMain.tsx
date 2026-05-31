import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { B, IMGS } from '../components/tokens'
import { Reveal, WordReveal, LineDraw, Orb, Dot, Ring } from '../components/Reveal'
import { BailioLogo, LogoMark } from '../components/BailioLogo'

/* ─── Timings (frames @30fps) ─────────────────────────────────────────────── */
const S = {
  intro:     0,    //  0 – 3s   logo reveal
  tagline:   90,   //  3 – 9s   headline
  feat1:     280,  //  9 – 15s  Publiez en 8 min
  feat2:     460,  // 15 – 21s  Candidatures
  feat3:     640,  // 21 – 27s  Bail électronique
  feat4:     820,  // 27 – 33s  Quittances
  split:     1000, // 33 – 39s  Propriétaire / Locataire
  zero:      1180, // 39 – 46s  0 €
  available: 1390, // 46 – 56s  Disponible maintenant
  outro:     1690, // 56 – 62s  bailio.fr
}

/* ─── Cross-dissolve transition ───────────────────────────────────────────── */
function Fade({ at, len = 22 }: { at: number; len?: number }) {
  const frame = useCurrentFrame()
  const op = interpolate(
    frame - at,
    [0, len * 0.4, len * 0.6, len],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  return <AbsoluteFill style={{ background: B.night, opacity: op, zIndex: 50, pointerEvents: 'none' }} />
}

/* ─── Full-bleed background image ─────────────────────────────────────────── */
function BgImg({ src, opacity = 0.18, startFrame = 0 }: { src: string; opacity?: number; startFrame?: number }) {
  const frame = useCurrentFrame()
  const op = interpolate(frame - startFrame, [0, 35], [0, opacity], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: op }} />
      {/* Night overlay so text stays readable */}
      <div style={{ position: 'absolute', inset: 0, background: `rgba(26,26,46,0.78)` }} />
    </AbsoluteFill>
  )
}

/* ─── Scene 1: Intro ─────────────────────────────────────────────────────── */
function SceneIntro() {
  const frame = useCurrentFrame()
  const op = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: B.night, opacity: op }}>
      <BgImg src={IMGS.paris} opacity={0.20} startFrame={8} />
      <Orb x={1400} y={200} r={520} color="rgba(196,151,106,0.35)" start={5} />
      <Orb x={250}  y={880} r={380} color="rgba(196,151,106,0.15)" start={15} />
      <Ring x={960} y={540} r={320} start={12} />
      <Ring x={960} y={540} r={500} start={22} />
      {/* Decorative dots */}
      {[[240,160,0],[560,300,8],[1660,150,5],[1720,500,10],[800,70,18],[1200,920,6],[440,720,14]].map(([x,y,d],i) => (
        <Dot key={i} x={x} y={y} start={d} size={2+(i%3)} opacity={0.45} />
      ))}
      {/* Centered logo */}
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <BailioLogo startFrame={22} size={90} />
        <Reveal startFrame={55} direction="up" distance={16} style={{ marginTop: 28 }}>
          <p style={{ fontFamily: B.body, fontSize: 18, color: 'rgba(250,250,248,0.40)', letterSpacing: '0.22em', textTransform: 'uppercase', textAlign: 'center' }}>
            Location entre particuliers
          </p>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── Scene 2: Tagline ───────────────────────────────────────────────────── */
function SceneTagline() {
  const frame = useCurrentFrame()
  const local = frame - S.tagline
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp }}>
      <BgImg src={IMGS.apartment} opacity={0.16} startFrame={S.tagline} />
      <Orb x={960} y={160} r={600} color="rgba(196,151,106,0.20)" start={S.tagline} />
      <Ring x={1700} y={850} r={240} start={S.tagline + 10} />
      <Dot x={160} y={200} start={S.tagline + 5} size={5} opacity={0.4} />
      <Dot x={1750} y={300} start={S.tagline + 8} size={3} opacity={0.35} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 180px' }}>

        {/* Overline */}
        <Reveal startFrame={S.tagline + 8} direction="up" distance={14} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LogoMark size={28} color={B.caramel} />
            <p style={{ fontFamily: B.body, fontSize: 14, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: B.caramel, margin: 0 }}>
              Bailio
            </p>
          </div>
        </Reveal>

        {/* Big headline — word by word */}
        <WordReveal
          text="La location immobilière réinventée."
          startFrame={S.tagline + 18}
          stagger={5}
          style={{ justifyContent: 'center', textAlign: 'center', maxWidth: 1300, marginBottom: 0 }}
          wordStyle={{
            fontFamily: B.display, fontStyle: 'italic', fontWeight: 700,
            fontSize: 106, color: B.cream, lineHeight: 1.12, letterSpacing: '-0.025em',
          }}
        />

        {/* Separator line */}
        <div style={{ marginTop: 36, marginBottom: 32 }}>
          <LineDraw startFrame={S.tagline + 60} width={200} color="rgba(196,151,106,0.70)" />
        </div>

        {/* Subtitle */}
        <Reveal startFrame={S.tagline + 68} direction="up" distance={18}>
          <p style={{ fontFamily: B.body, fontSize: 24, color: 'rgba(250,250,248,0.58)', lineHeight: 1.65, textAlign: 'center', maxWidth: 720, margin: 0 }}>
            Propriétaires et locataires, connectés directement.<br />Sans agence. Sans commission.
          </p>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── Generic Feature scene ─────────────────────────────────────────────── */
function SceneFeature({
  start, tag, headline, sub, img, lightBg = false,
  iconSvg,
}: {
  start: number; tag: string; headline: string; sub: string
  img: string; lightBg?: boolean; iconSvg: React.ReactNode
}) {
  const frame = useCurrentFrame()
  const local = frame - start
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const { fps } = useVideoConfig()

  const bg    = lightBg ? '#f0ede8' : B.night
  const fg    = lightBg ? B.ink    : B.cream
  const fgSub = lightBg ? B.inkMid : 'rgba(250,250,248,0.60)'
  const _imgOp = lightBg ? 0.10 : 0.18; void _imgOp

  /* Image panel slides in from right */
  const imgP = spring({ frame: Math.max(0, local - 12), fps, config: { damping: 22, stiffness: 55 } })
  const imgX = interpolate(imgP, [0, 1], [120, 0])
  const imgOpa = interpolate(local - 12, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: bg, opacity: bgOp, display: 'flex' }}>
      {/* Left: text content */}
      <div style={{ flex: '0 0 52%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px 0 100px', gap: 0, position: 'relative', zIndex: 2 }}>
        <Orb x={-80} y={540} r={450} color={lightBg ? 'rgba(196,151,106,0.10)' : 'rgba(196,151,106,0.25)'} start={start} />

        {/* Icon badge */}
        <Reveal startFrame={start + 6} direction="scale" style={{ marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: lightBg ? 'rgba(196,151,106,0.14)' : 'rgba(196,151,106,0.16)',
            border: '1.5px solid rgba(196,151,106,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {iconSvg}
          </div>
        </Reveal>

        {/* Tag */}
        <Reveal startFrame={start + 10} direction="up" distance={14} style={{ marginBottom: 18 }}>
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: B.caramel, margin: 0 }}>
            {tag}
          </p>
        </Reveal>

        {/* Headline */}
        <WordReveal
          text={headline}
          startFrame={start + 18}
          stagger={4}
          style={{ marginBottom: 0 }}
          wordStyle={{
            fontFamily: B.display, fontStyle: 'italic', fontWeight: 700,
            fontSize: 68, color: fg, lineHeight: 1.12, letterSpacing: '-0.02em',
          }}
        />

        {/* Line */}
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <LineDraw startFrame={start + 36} width={90} color="rgba(196,151,106,0.65)" />
        </div>

        {/* Sub */}
        <Reveal startFrame={start + 42} direction="up" distance={14}>
          <p style={{ fontFamily: B.body, fontSize: 20, color: fgSub, lineHeight: 1.65, maxWidth: 480, margin: 0 }}>
            {sub}
          </p>
        </Reveal>
      </div>

      {/* Right: image panel */}
      <div style={{
        flex: '0 0 48%', position: 'relative', overflow: 'hidden',
        opacity: imgOpa, transform: `translateX(${imgX}px)`,
      }}>
        <Img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        {/* Gradient overlay on left edge to blend with text side */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to right, ${bg} 0%, transparent 28%)`,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: lightBg ? 'rgba(240,237,232,0.15)' : 'rgba(26,26,46,0.32)' }} />
      </div>

      {/* Decorative dots */}
      <Dot x={80} y={80} start={start + 4} size={4} opacity={0.4} />
      <Dot x={1820} y={920} start={start + 8} size={3} opacity={0.3} />
    </AbsoluteFill>
  )
}

/* ─── Scene: Split (Pour tous) ───────────────────────────────────────────── */
function SceneSplit() {
  const frame = useCurrentFrame()
  const local = frame - S.split
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const leftP = spring({ frame: Math.max(0, local - 4), fps, config: { damping: 20, stiffness: 55 } })
  const leftX = interpolate(leftP, [0, 1], [-100, 0])
  const rightP = spring({ frame: Math.max(0, local - 4), fps, config: { damping: 20, stiffness: 55 } })
  const rightX = interpolate(rightP, [0, 1], [100, 0])

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp, display: 'flex' }}>
      <BgImg src={IMGS.interior} opacity={0.12} startFrame={S.split} />
      {/* Divider */}
      <div style={{ position: 'absolute', left: '50%', top: '10%', width: 1, height: '80%', background: 'rgba(196,151,106,0.30)', transform: 'translateX(-0.5px)' }} />
      <Dot x={957} y={80} start={S.split + 5} size={6} opacity={0.55} />
      <Dot x={957} y={960} start={S.split + 5} size={6} opacity={0.55} />

      {/* Left — Propriétaire */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px', transform: `translateX(${leftX}px)` }}>
        <div style={{ marginBottom: 28 }}>
          <LogoMark size={52} color="rgba(26,50,112,0.9)" />
        </div>
        <Reveal startFrame={S.split + 16} direction="up" style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: '#5b78c4', margin: 0, textAlign: 'center' }}>
            Propriétaire
          </p>
        </Reveal>
        <WordReveal
          text="Publiez, gérez, encaissez."
          startFrame={S.split + 24}
          stagger={4}
          style={{ justifyContent: 'center', marginBottom: 24 }}
          wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 56, color: B.cream, lineHeight: 1.12, letterSpacing: '-0.02em' }}
        />
        <Reveal startFrame={S.split + 44} direction="up" distance={14}>
          <p style={{ fontFamily: B.body, fontSize: 18, color: 'rgba(250,250,248,0.55)', textAlign: 'center', lineHeight: 1.6, maxWidth: 380 }}>
            Annonce, candidatures, bail, quittances — tout en ligne.
          </p>
        </Reveal>
      </div>

      {/* Right — Locataire */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px', transform: `translateX(${rightX}px)` }}>
        <div style={{ marginBottom: 28 }}>
          <LogoMark size={52} color="rgba(27,94,59,0.9)" />
        </div>
        <Reveal startFrame={S.split + 16} direction="up" style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: '#55a87a', margin: 0, textAlign: 'center' }}>
            Locataire
          </p>
        </Reveal>
        <WordReveal
          text="Trouvez, postulez, emménagez."
          startFrame={S.split + 24}
          stagger={4}
          style={{ justifyContent: 'center', marginBottom: 24 }}
          wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 56, color: B.cream, lineHeight: 1.12, letterSpacing: '-0.02em' }}
        />
        <Reveal startFrame={S.split + 44} direction="up" distance={14}>
          <p style={{ fontFamily: B.body, fontSize: 18, color: 'rgba(250,250,248,0.55)', textAlign: 'center', lineHeight: 1.6, maxWidth: 380 }}>
            Des annonces de particuliers. Zéro frais d'agence.
          </p>
        </Reveal>
      </div>
    </AbsoluteFill>
  )
}

/* ─── Scene: 0 € ─────────────────────────────────────────────────────────── */
function SceneZero() {
  const frame = useCurrentFrame()
  const local = frame - S.zero
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const bigP = spring({ frame: Math.max(0, local - 14), fps, config: { damping: 24, stiffness: 45 } })
  const bigScale = interpolate(bigP, [0, 1], [0.55, 1])
  const bigOp = interpolate(local - 14, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#f0ede8', opacity: bgOp }}>
      <Orb x={1750} y={100} r={520} color="rgba(196,151,106,0.22)" start={S.zero} />
      <Orb x={100}  y={1000} r={380} color="rgba(196,151,106,0.12)" start={S.zero + 10} />
      <Ring x={960} y={540} r={280} start={S.zero + 8} />
      <Dot x={200}  y={200} start={S.zero}     size={5} opacity={0.3} />
      <Dot x={1700} y={880} start={S.zero + 6} size={4} opacity={0.25} />
      <Dot x={1820} y={200} start={S.zero + 3} size={3} opacity={0.3} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 160px' }}>
        <Reveal startFrame={S.zero + 5} direction="up" distance={14} style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
          <LogoMark size={30} color={B.caramel} />
          <p style={{ fontFamily: B.body, fontSize: 14, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: B.caramel, margin: 0 }}>
            La différence Bailio
          </p>
        </Reveal>

        <div style={{ opacity: bigOp, transform: `scale(${bigScale})` }}>
          <span style={{
            fontFamily: B.display, fontStyle: 'italic', fontWeight: 700,
            fontSize: 210, color: B.night, lineHeight: 0.9, letterSpacing: '-0.04em',
            display: 'block', textAlign: 'center',
          }}>
            0 €
          </span>
        </div>

        <div style={{ marginTop: 28, marginBottom: 24 }}>
          <LineDraw startFrame={S.zero + 32} width={160} color="rgba(196,151,106,0.80)" />
        </div>

        <Reveal startFrame={S.zero + 38} direction="up" distance={20}>
          <p style={{ fontFamily: B.body, fontSize: 26, color: B.inkMid, textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.5, margin: 0 }}>
            de frais d'agence — pour tout le monde.
          </p>
        </Reveal>

        <Reveal startFrame={S.zero + 52} direction="up" distance={14} style={{ marginTop: 20 }}>
          <p style={{ fontFamily: B.body, fontSize: 16, color: B.inkFaint, textAlign: 'center', letterSpacing: '0.06em' }}>
            Ni pour le locataire. Ni pour le propriétaire.
          </p>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── Scene: Disponible maintenant ──────────────────────────────────────── */
function SceneAvailable() {
  const frame = useCurrentFrame()
  const local = frame - S.available
  const { fps } = useVideoConfig()
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const lineW = interpolate(local - 4, [0, 35], [0, 1920], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const mainP = spring({ frame: Math.max(0, local - 22), fps, config: { damping: 22, stiffness: 48 } })
  const mainY = interpolate(mainP, [0, 1], [70, 0])
  const mainOp = interpolate(local - 22, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const subP = spring({ frame: Math.max(0, local - 55), fps, config: { damping: 18, stiffness: 62 } })
  const subY = interpolate(subP, [0, 1], [32, 0])
  const subOp = interpolate(local - 55, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const pulse = 0.5 + 0.5 * Math.sin((local * Math.PI) / 36)

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp }}>
      <BgImg src={IMGS.apartment} opacity={0.14} startFrame={S.available} />
      <Orb x={960} y={540} r={700} color="rgba(196,151,106,0.24)" start={S.available} />
      <Ring x={960} y={540} r={420} start={S.available + 10} />
      <Ring x={960} y={540} r={600} start={S.available + 20} />
      <Dot x={180} y={160} start={S.available + 5} size={5} opacity={0.40} />
      <Dot x={1740} y={200} start={S.available + 8} size={4} opacity={0.35} />
      <Dot x={200}  y={900} start={S.available + 3} size={3} opacity={0.30} />
      <Dot x={1800} y={850} start={S.available + 6} size={5} opacity={0.35} />

      {/* Animated lines */}
      <div style={{ position: 'absolute', top: 172, left: 0, height: 1, width: lineW, background: 'rgba(196,151,106,0.45)' }} />
      <div style={{ position: 'absolute', bottom: 172, left: 0, height: 1, width: lineW, background: 'rgba(196,151,106,0.45)' }} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Main reveal */}
        <div style={{ opacity: mainOp, transform: `translateY(${mainY}px)`, textAlign: 'center' }}>
          <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 148, color: B.cream, display: 'block', lineHeight: 0.92, letterSpacing: '-0.04em' }}>
            Disponible
          </span>
          <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 148, color: B.caramel, display: 'block', lineHeight: 0.92, letterSpacing: '-0.04em' }}>
            maintenant.
          </span>
        </div>

        {/* Separator */}
        <div style={{ marginTop: 44, marginBottom: 40 }}>
          <LineDraw startFrame={S.available + 44} width={160} color="rgba(196,151,106,0.65)" />
        </div>

        {/* Sub + URL */}
        <div style={{ opacity: subOp, transform: `translateY(${subY}px)`, textAlign: 'center' }}>
          <p style={{ fontFamily: B.body, fontSize: 22, color: 'rgba(250,250,248,0.55)', margin: '0 0 16px', letterSpacing: '0.03em' }}>
            Créez votre compte gratuitement sur
          </p>
          <p style={{
            fontFamily: B.display, fontStyle: 'italic', fontSize: 42, color: B.caramel,
            margin: 0, opacity: 0.65 + 0.35 * pulse, letterSpacing: '-0.01em',
          }}>
            bailio.fr
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── Scene: Outro ───────────────────────────────────────────────────────── */
function SceneOutro() {
  const frame = useCurrentFrame()
  const local = frame - S.outro
  const bgOp = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pulse = 0.55 + 0.45 * Math.sin((local * Math.PI) / 44)

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp }}>
      <Orb x={960} y={540} r={600} color="rgba(196,151,106,0.28)" start={S.outro} />
      <Ring x={960} y={540} r={360} start={S.outro + 8} />
      <Dot x={300}  y={200} start={S.outro + 4} size={4} opacity={0.35} />
      <Dot x={1620} y={180} start={S.outro + 7} size={3} opacity={0.30} />
      <Dot x={200}  y={880} start={S.outro + 3} size={5} opacity={0.30} />
      <Dot x={1740} y={860} start={S.outro + 5} size={4} opacity={0.30} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <BailioLogo startFrame={S.outro + 10} size={108} />

        <Reveal startFrame={S.outro + 36} direction="up" distance={14} style={{ marginTop: 36 }}>
          <p style={{ fontFamily: B.body, fontSize: 18, color: 'rgba(250,250,248,0.35)', letterSpacing: '0.22em', textTransform: 'uppercase', textAlign: 'center' }}>
            Location entre particuliers, simplement.
          </p>
        </Reveal>

        <Reveal startFrame={S.outro + 50} direction="up" distance={10} style={{ marginTop: 20 }}>
          <p style={{ fontFamily: B.body, fontSize: 22, color: B.caramel, letterSpacing: '0.10em', opacity: pulse }}>
            bailio.fr
          </p>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
const ic = (path: React.ReactNode) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={B.caramel} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
)
const IconAnnonce    = () => ic(<><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></>)
const IconCandidature= () => ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>)
const IconBail       = () => ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>)
const IconQuittance  = () => ic(<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>)

/* ─── Main composition ────────────────────────────────────────────────────── */
export function BailioMain() {
  const frame = useCurrentFrame()

  const show = (from: number, to: number) => frame >= from - 6 && frame < to + 6

  return (
    <AbsoluteFill style={{ background: B.night }}>

      {/* Scenes */}
      {show(S.intro,     S.tagline)   && <SceneIntro />}
      {show(S.tagline,   S.feat1)     && <SceneTagline />}
      {show(S.feat1,     S.feat2) && <SceneFeature start={S.feat1} tag="Annonce" headline="Publiez en 8 minutes." sub="Photos, description, loyer — votre bien est en ligne immédiatement." img={IMGS.interior} iconSvg={<IconAnnonce />} />}
      {show(S.feat2,     S.feat3) && <SceneFeature start={S.feat2} tag="Candidatures" headline="Choisissez votre locataire." sub="Recevez les dossiers, comparez les profils, répondez en un clic." img={IMGS.handshake} iconSvg={<IconCandidature />} />}
      {show(S.feat3,     S.feat4) && <SceneFeature start={S.feat3} tag="Bail électronique" headline="Signez en ligne. C'est légal." sub="Signature eIDAS certifiée — même valeur juridique qu'un acte notarié." img={IMGS.contract} lightBg iconSvg={<IconBail />} />}
      {show(S.feat4,     S.split) && <SceneFeature start={S.feat4} tag="Quittances" headline="Automatiques chaque mois." sub="Bailio génère et envoie vos quittances sans que vous n'ayez rien à faire." img={IMGS.keys} lightBg iconSvg={<IconQuittance />} />}
      {show(S.split,     S.zero)      && <SceneSplit />}
      {show(S.zero,      S.available) && <SceneZero />}
      {show(S.available, S.outro)     && <SceneAvailable />}
      {frame >= S.outro - 6           && <SceneOutro />}

      {/* Cross-dissolve transitions */}
      <Fade at={S.tagline   - 10} />
      <Fade at={S.feat1     - 10} />
      <Fade at={S.feat2     - 10} />
      <Fade at={S.feat3     - 10} />
      <Fade at={S.feat4     - 10} />
      <Fade at={S.split     - 10} />
      <Fade at={S.zero      - 10} />
      <Fade at={S.available - 10} />
      <Fade at={S.outro     - 10} />
    </AbsoluteFill>
  )
}
