import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { B } from './tokens'
import { Reveal, WordReveal, LineDraw } from './Reveal'

export function FeatureScene({
  startFrame,
  tag,
  headline,
  sub,
  accent = B.caramel,
  icon,
  lightBg = false,
}: {
  startFrame: number
  tag: string
  headline: string
  sub: string
  accent?: string
  icon: React.ReactNode
  lightBg?: boolean
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - startFrame

  const bg = lightBg ? B.cream : B.night
  const fg = lightBg ? B.ink : B.cream
  const fgMid = lightBg ? B.inkMid : 'rgba(250,250,248,0.65)'

  const bgOpacity = interpolate(local, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const iconProgress = spring({ frame: local - 10, fps, config: { damping: 12, stiffness: 80 } })
  const iconScale = interpolate(iconProgress, [0, 1], [0.5, 1])
  const iconOpacity = interpolate(local - 10, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bg,
        opacity: bgOpacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 160px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 28,
          background: `${accent}22`,
          border: `1.5px solid ${accent}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 48,
          opacity: iconOpacity,
          transform: `scale(${iconScale})`,
        }}
      >
        {icon}
      </div>

      {/* Tag */}
      <Reveal startFrame={startFrame + 6} direction="up" distance={20}>
        <span
          style={{
            fontFamily: B.body,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: 24,
            display: 'block',
          }}
        >
          {tag}
        </span>
      </Reveal>

      {/* Headline */}
      <WordReveal
        text={headline}
        startFrame={startFrame + 14}
        stagger={3}
        style={{ justifyContent: 'center', marginBottom: 32, textAlign: 'center' }}
        wordStyle={{
          fontFamily: B.display,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 80,
          color: fg,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
        }}
      />

      {/* Line */}
      <LineDraw startFrame={startFrame + 22} color={`${accent}70`} duration={25} width={120} height={2} />

      {/* Sub */}
      <Reveal startFrame={startFrame + 28} direction="up" distance={16} style={{ marginTop: 28, textAlign: 'center' }}>
        <p
          style={{
            fontFamily: B.body,
            fontSize: 22,
            color: fgMid,
            lineHeight: 1.6,
            maxWidth: 640,
            margin: 0,
          }}
        >
          {sub}
        </p>
      </Reveal>
    </div>
  )
}
