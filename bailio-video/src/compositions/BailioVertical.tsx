import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { B, IMGS } from '../components/tokens'
import { Reveal, WordReveal, LineDraw, Orb, Dot, Ring } from '../components/Reveal'
import { BailioLogo, LogoMark } from '../components/BailioLogo'

const S = {
  intro:     0,
  hook:      65,
  feat1:     195,
  feat2:     325,
  feat3:     455,
  available: 590,
  outro:     760,
}

function Fade({ at, len = 18 }: { at: number; len?: number }) {
  const frame = useCurrentFrame()
  const op = interpolate(frame - at, [0, len * 0.4, len * 0.6, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ background: B.night, opacity: op, zIndex: 50, pointerEvents: 'none' }} />
}

function BgImg({ src, opacity = 0.16, start = 0 }: { src: string; opacity?: number; start?: number }) {
  const frame = useCurrentFrame()
  const op = interpolate(frame - start, [0, 30], [0, opacity], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill>
      <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: op }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,46,0.80)' }} />
    </AbsoluteFill>
  )
}

function VFeature({ start, tag, headline, sub, img }: { start: number; tag: string; headline: string; sub: string; img: string }) {
  const frame = useCurrentFrame()
  const local = frame - start
  const bgOp = interpolate(local, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOp }}>
      <BgImg src={img} opacity={0.18} start={start} />
      <Orb x={540} y={500} r={480} color="rgba(196,151,106,0.22)" start={start} />
      <Ring x={540} y={960} r={300} start={start + 8} />
      <Dot x={80}  y={200} start={start + 4} size={4} opacity={0.35} />
      <Dot x={980} y={300} start={start + 7} size={3} opacity={0.30} />
      <Dot x={100} y={1700} start={start + 3} size={5} opacity={0.30} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 72px' }}>
        <Reveal startFrame={start + 6} direction="scale" style={{ marginBottom: 36 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(196,151,106,0.16)', border: '1.5px solid rgba(196,151,106,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogoMark size={38} color={B.caramel} />
          </div>
        </Reveal>
        <Reveal startFrame={start + 10} direction="up" distance={14} style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: B.caramel, textAlign: 'center', margin: 0 }}>{tag}</p>
        </Reveal>
        <WordReveal
          text={headline}
          startFrame={start + 18}
          stagger={5}
          style={{ justifyContent: 'center', marginBottom: 0 }}
          wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 78, color: B.cream, lineHeight: 1.1, letterSpacing: '-0.022em' }}
        />
        <div style={{ marginTop: 28, marginBottom: 26 }}>
          <LineDraw startFrame={start + 36} width={80} color="rgba(196,151,106,0.70)" />
        </div>
        <Reveal startFrame={start + 42} direction="up" distance={16}>
          <p style={{ fontFamily: B.body, fontSize: 21, color: 'rgba(250,250,248,0.58)', lineHeight: 1.65, textAlign: 'center', maxWidth: 480, margin: 0 }}>{sub}</p>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export function BailioVertical() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const show = (from: number, to: number) => frame >= from - 5 && frame < to + 5

  /* Intro logo */
  const introBgOp = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  /* Hook */
  const hookBgOp = interpolate(frame - S.hook, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  /* Available */
  const avLocal = frame - S.available
  const avBgOp = interpolate(avLocal, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const avMainP = spring({ frame: Math.max(0, avLocal - 18), fps, config: { damping: 22, stiffness: 48 } })
  const avMainY = interpolate(avMainP, [0, 1], [55, 0])
  const avMainOp = interpolate(avLocal - 18, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const avSubOp = interpolate(avLocal - 50, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const avSubP = spring({ frame: Math.max(0, avLocal - 50), fps, config: { damping: 18, stiffness: 60 } })
  const avSubY = interpolate(avSubP, [0, 1], [28, 0])
  const avPulse = 0.55 + 0.45 * Math.sin((avLocal * Math.PI) / 32)
  const avLineW = interpolate(avLocal - 4, [0, 28], [0, 1080], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const outroLocal = frame - S.outro
  const outroBgOp = interpolate(outroLocal, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const outroPulse = 0.55 + 0.45 * Math.sin((outroLocal * Math.PI) / 40)

  return (
    <AbsoluteFill style={{ background: B.night }}>

      {/* ── Intro ── */}
      {show(S.intro, S.hook) && (
        <AbsoluteFill style={{ background: B.night, opacity: introBgOp }}>
          <BgImg src={IMGS.paris} opacity={0.18} start={8} />
          <Orb x={540} y={600} r={600} color="rgba(196,151,106,0.30)" start={5} />
          <Ring x={540} y={960} r={380} start={15} />
          <Dot x={80}  y={200} start={5} size={4} opacity={0.35} />
          <Dot x={980} y={300} start={8} size={3} opacity={0.30} />
          <Dot x={100} y={1700} start={3} size={5} opacity={0.30} />
          <Dot x={1000} y={1600} start={6} size={4} opacity={0.30} />
          <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BailioLogo startFrame={20} size={80} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ── Hook ── */}
      {show(S.hook, S.feat1) && (
        <AbsoluteFill style={{ background: B.night, opacity: hookBgOp }}>
          <BgImg src={IMGS.apartment} opacity={0.14} start={S.hook} />
          <Orb x={540} y={700} r={580} color="rgba(196,151,106,0.22)" start={S.hook} />
          <Ring x={540} y={960} r={340} start={S.hook + 10} />
          <Dot x={80}  y={280} start={S.hook + 4} size={4} opacity={0.35} />
          <Dot x={980} y={400} start={S.hook + 7} size={3} opacity={0.30} />
          <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 72px' }}>
            <Reveal startFrame={S.hook + 6} direction="up" distance={14} style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <LogoMark size={26} color={B.caramel} />
              <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: B.caramel, margin: 0 }}>Bailio</p>
            </Reveal>
            <WordReveal
              text="Louer sans agence, enfin."
              startFrame={S.hook + 14}
              stagger={6}
              style={{ justifyContent: 'center', marginBottom: 0 }}
              wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 86, color: B.cream, lineHeight: 1.1, letterSpacing: '-0.025em' }}
            />
            <div style={{ marginTop: 32, marginBottom: 28 }}>
              <LineDraw startFrame={S.hook + 44} width={90} color="rgba(196,151,106,0.68)" />
            </div>
            <Reveal startFrame={S.hook + 50} direction="up" distance={16}>
              <p style={{ fontFamily: B.body, fontSize: 22, color: 'rgba(250,250,248,0.56)', lineHeight: 1.65, textAlign: 'center', maxWidth: 480, margin: 0 }}>
                Entre particuliers.<br />Zéro frais d'agence.
              </p>
            </Reveal>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ── Features ── */}
      {show(S.feat1, S.feat2) && <VFeature start={S.feat1} tag="Annonce" headline="Publiez en 8 minutes." sub="Votre bien visible immédiatement, partout en France." img={IMGS.interior} />}
      {show(S.feat2, S.feat3) && <VFeature start={S.feat2} tag="Bail électronique" headline="Signez en ligne, c'est légal." sub="Signature eIDAS certifiée. Valeur juridique complète." img={IMGS.contract} />}
      {show(S.feat3, S.available) && <VFeature start={S.feat3} tag="Aucun frais d'agence" headline="0 € de commission." sub="Ni pour le locataire, ni pour le propriétaire." img={IMGS.keys} />}

      {/* ── Disponible maintenant ── */}
      {show(S.available, S.outro) && (
        <AbsoluteFill style={{ background: B.night, opacity: avBgOp }}>
          <BgImg src={IMGS.paris} opacity={0.13} start={S.available} />
          <Orb x={540} y={960} r={700} color="rgba(196,151,106,0.26)" start={S.available} />
          <Ring x={540} y={960} r={440} start={S.available + 10} />
          <Dot x={80}  y={300} start={S.available + 4} size={5} opacity={0.35} />
          <Dot x={980} y={400} start={S.available + 7} size={4} opacity={0.30} />
          <Dot x={100} y={1700} start={S.available + 3} size={4} opacity={0.35} />
          {/* Line top + bottom */}
          <div style={{ position: 'absolute', top: 240, left: 0, height: 1, width: avLineW, background: 'rgba(196,151,106,0.40)' }} />
          <div style={{ position: 'absolute', bottom: 240, left: 0, height: 1, width: avLineW, background: 'rgba(196,151,106,0.40)' }} />

          <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 72px' }}>
            <div style={{ opacity: avMainOp, transform: `translateY(${avMainY}px)`, textAlign: 'center' }}>
              <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 120, color: B.cream, display: 'block', lineHeight: 0.92, letterSpacing: '-0.03em' }}>Disponible</span>
              <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 120, color: B.caramel, display: 'block', lineHeight: 0.92, letterSpacing: '-0.03em' }}>maintenant.</span>
            </div>
            <div style={{ marginTop: 48, marginBottom: 36 }}>
              <LineDraw startFrame={S.available + 44} width={100} color="rgba(196,151,106,0.65)" />
            </div>
            <div style={{ opacity: avSubOp, transform: `translateY(${avSubY}px)`, textAlign: 'center' }}>
              <p style={{ fontFamily: B.body, fontSize: 20, color: 'rgba(250,250,248,0.50)', margin: '0 0 16px' }}>Créez votre compte gratuit sur</p>
              <p style={{ fontFamily: B.display, fontStyle: 'italic', fontSize: 38, color: B.caramel, margin: 0, opacity: avPulse }}>bailio.fr</p>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ── Outro ── */}
      {frame >= S.outro - 5 && (
        <AbsoluteFill style={{ background: B.night, opacity: outroBgOp }}>
          <Orb x={540} y={960} r={620} color="rgba(196,151,106,0.28)" start={S.outro} />
          <Ring x={540} y={960} r={380} start={S.outro + 8} />
          <Dot x={80}  y={300} start={S.outro + 4} size={4} opacity={0.30} />
          <Dot x={980} y={400} start={S.outro + 6} size={3} opacity={0.25} />
          <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            <BailioLogo startFrame={S.outro + 10} size={88} />
            <Reveal startFrame={S.outro + 36} direction="up" distance={12} style={{ marginTop: 40 }}>
              <p style={{ fontFamily: B.body, fontSize: 16, color: 'rgba(250,250,248,0.32)', letterSpacing: '0.20em', textTransform: 'uppercase', textAlign: 'center' }}>
                Location entre particuliers.
              </p>
            </Reveal>
            <Reveal startFrame={S.outro + 50} direction="up" distance={10} style={{ marginTop: 16 }}>
              <p style={{ fontFamily: B.body, fontSize: 22, color: B.caramel, letterSpacing: '0.08em', opacity: outroPulse, textAlign: 'center' }}>
                bailio.fr
              </p>
            </Reveal>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* Transitions */}
      <Fade at={S.hook      - 8} />
      <Fade at={S.feat1     - 8} />
      <Fade at={S.feat2     - 8} />
      <Fade at={S.feat3     - 8} />
      <Fade at={S.available - 8} />
      <Fade at={S.outro     - 8} />
    </AbsoluteFill>
  )
}
