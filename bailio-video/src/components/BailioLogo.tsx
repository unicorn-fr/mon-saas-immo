import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { B } from './tokens'

export function BailioLogo({
  startFrame = 0,
  size = 56,
  color = B.cream,
}: {
  startFrame?: number
  size?: number
  color?: string
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - startFrame

  const progress = spring({ frame: local, fps, config: { damping: 14, stiffness: 60 } })
  const opacity = interpolate(local, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scale = interpolate(progress, [0, 1], [0.7, 1])

  const dotScale = spring({
    frame: local - 8,
    fps,
    config: { damping: 10, stiffness: 100 },
  })

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, opacity, transform: `scale(${scale})` }}>
      <span
        style={{
          fontFamily: B.display,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: size,
          color,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        bailio
      </span>
      <span
        style={{
          fontFamily: B.display,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: size,
          color: B.caramel,
          lineHeight: 1,
          transform: `scale(${dotScale})`,
          display: 'inline-block',
          transformOrigin: 'bottom center',
        }}
      >
        .
      </span>
    </div>
  )
}
