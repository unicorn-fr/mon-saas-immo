import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { B } from '../components/tokens'
import { Reveal, WordReveal, LineDraw } from '../components/Reveal'
import { BailioLogo } from '../components/BailioLogo'

const S = {
  intro:     0,
  hook:      60,
  feat1:     180,
  feat2:     300,
  feat3:     420,
  available: 570,
  outro:     750,
} as const

function Orb({ cx, cy, r, color, start }: { cx: number; cy: number; r: number; color: string; start: number }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame - start, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{
      position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2,
      borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(50px)', opacity, pointerEvents: 'none',
    }} />
  )
}

function VerticalFeature({ startFrame, tag, headline, sub }: { startFrame: number; tag: string; headline: string; sub: string }) {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const bgOpacity = interpolate(local, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
      <Orb cx={540} cy={400} r={400} color="rgba(196,151,106,0.22)" start={startFrame} />
      <Reveal startFrame={startFrame + 8} direction="up">
        <p style={{ fontFamily: B.body, fontSize: 14, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: B.caramel, textAlign: 'center', marginBottom: 28 }}>{tag}</p>
      </Reveal>
      <WordReveal
        text={headline}
        startFrame={startFrame + 16}
        stagger={4}
        style={{ justifyContent: 'center', textAlign: 'center' }}
        wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 80, color: B.cream, lineHeight: 1.1, letterSpacing: '-0.02em' }}
      />
      <LineDraw startFrame={startFrame + 32} color={`${B.caramel}80`} duration={22} width={100} height={2} />
      <Reveal startFrame={startFrame + 40} direction="up" style={{ marginTop: 28, textAlign: 'center' }}>
        <p style={{ fontFamily: B.body, fontSize: 22, color: 'rgba(250,250,248,0.60)', lineHeight: 1.6, maxWidth: 480 }}>{sub}</p>
      </Reveal>
    </AbsoluteFill>
  )
}

function SceneAvailableV() {
  const frame = useCurrentFrame()
  const local = frame - S.available
  const { fps } = useVideoConfig()

  const bgOpacity = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const textP = spring({ frame: local - 12, fps, config: { damping: 20, stiffness: 50 } })
  const textY = interpolate(textP, [0, 1], [60, 0])
  const textOpacity = interpolate(local - 12, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pulse = interpolate(Math.sin((local * Math.PI) / 30), [-1, 1], [0.5, 1])

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
      <Orb cx={540} cy={960} r={600} color="rgba(196,151,106,0.28)" start={S.available} />
      <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, textAlign: 'center' }}>
        <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 128, color: B.cream, display: 'block', lineHeight: 0.95, letterSpacing: '-0.03em' }}>Disponible</span>
        <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 128, color: B.caramel, display: 'block', lineHeight: 0.95, letterSpacing: '-0.03em' }}>maintenant.</span>
      </div>
      <Reveal startFrame={S.available + 44} direction="up" style={{ marginTop: 56, textAlign: 'center' }}>
        <p style={{ fontFamily: B.body, fontSize: 22, color: 'rgba(250,250,248,0.50)', marginBottom: 12 }}>Créez votre compte gratuit sur</p>
        <p style={{ fontFamily: B.display, fontStyle: 'italic', fontSize: 38, color: B.caramel, opacity: pulse }}>bailio.fr</p>
      </Reveal>
    </AbsoluteFill>
  )
}

function Transition({ at }: { at: number }) {
  const frame = useCurrentFrame()
  const local = frame - at
  const opacity = interpolate(local, [0, 6, 12, 18], [0, 0.95, 0.95, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ background: B.night, opacity, pointerEvents: 'none' }} />
}

export function BailioVertical() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: B.night }}>
      {frame < S.hook + 10 && (
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Orb cx={540} cy={400} r={500} color="rgba(196,151,106,0.28)" start={0} />
          <BailioLogo startFrame={20} size={88} />
        </AbsoluteFill>
      )}

      {frame >= S.hook - 4 && frame < S.feat1 + 10 && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
          <Orb cx={540} cy={600} r={500} color="rgba(196,151,106,0.20)" start={S.hook} />
          <Reveal startFrame={S.hook + 6} direction="up">
            <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: B.caramel, textAlign: 'center', marginBottom: 28 }}>Bailio</p>
          </Reveal>
          <WordReveal
            text="Louer sans agence, enfin."
            startFrame={S.hook + 14}
            stagger={5}
            style={{ justifyContent: 'center', textAlign: 'center' }}
            wordStyle={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 90, color: B.cream, lineHeight: 1.08, letterSpacing: '-0.025em' }}
          />
          <Reveal startFrame={S.hook + 38} direction="up" style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ fontFamily: B.body, fontSize: 22, color: 'rgba(250,250,248,0.55)', lineHeight: 1.6 }}>Entre particuliers. Zéro frais d'agence.</p>
          </Reveal>
        </AbsoluteFill>
      )}

      {frame >= S.feat1 - 4 && frame < S.feat2 + 10 && (
        <VerticalFeature startFrame={S.feat1} tag="Annonce" headline="Publiez en 8 minutes." sub="Votre bien visible immédiatement." />
      )}
      {frame >= S.feat2 - 4 && frame < S.feat3 + 10 && (
        <VerticalFeature startFrame={S.feat2} tag="Bail électronique" headline="Signez en ligne, c'est légal." sub="Signature eIDAS, valeur juridique complète." />
      )}
      {frame >= S.feat3 - 4 && frame < S.available + 10 && (
        <VerticalFeature startFrame={S.feat3} tag="0 € de frais" headline="Aucune commission." sub="Ni pour le locataire, ni pour le propriétaire." />
      )}
      {frame >= S.available - 4 && frame < S.outro + 10 && <SceneAvailableV />}
      {frame >= S.outro - 4 && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Orb cx={540} cy={960} r={600} color="rgba(196,151,106,0.30)" start={S.outro} />
          <BailioLogo startFrame={S.outro + 8} size={100} />
          <Reveal startFrame={S.outro + 30} direction="up" style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ fontFamily: B.body, fontSize: 18, color: 'rgba(250,250,248,0.40)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Location entre particuliers, simplement.</p>
          </Reveal>
        </AbsoluteFill>
      )}

      <Transition at={S.hook - 6} />
      <Transition at={S.feat1 - 6} />
      <Transition at={S.feat2 - 6} />
      <Transition at={S.feat3 - 6} />
      <Transition at={S.available - 6} />
      <Transition at={S.outro - 6} />
    </AbsoluteFill>
  )
}
