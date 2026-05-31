import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

/** Fade + slide-up reveal starting at `startFrame`. */
export function Reveal({
  children,
  startFrame,
  direction = 'up',
  distance = 40,
  duration = 22,
  style,
}: {
  children: React.ReactNode
  startFrame: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
  distance?: number
  duration?: number
  style?: React.CSSProperties
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - startFrame

  const progress = spring({
    frame: local,
    fps,
    config: { damping: 18, stiffness: 70, mass: 0.9 },
    durationInFrames: duration,
  })

  const opacity = interpolate(local, [0, duration * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const tx =
    direction === 'left'  ? interpolate(progress, [0, 1], [distance, 0])
    : direction === 'right' ? interpolate(progress, [0, 1], [-distance, 0])
    : 0
  const ty =
    direction === 'up'   ? interpolate(progress, [0, 1], [distance, 0])
    : direction === 'down' ? interpolate(progress, [0, 1], [-distance, 0])
    : 0
  const sc = direction === 'scale' ? interpolate(progress, [0, 1], [0.88, 1]) : 1

  return (
    <div
      style={{
        opacity,
        transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
        willChange: 'transform, opacity',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Staggered word reveal for large headlines */
export function WordReveal({
  text,
  startFrame,
  stagger = 4,
  style,
  wordStyle,
}: {
  text: string
  startFrame: number
  stagger?: number
  style?: React.CSSProperties
  wordStyle?: React.CSSProperties
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = text.split(' ')

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.22em', ...style }}>
      {words.map((word, i) => {
        const local = frame - startFrame - i * stagger
        const progress = spring({ frame: local, fps, config: { damping: 20, stiffness: 80 } })
        const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const ty = interpolate(progress, [0, 1], [28, 0])
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity,
              transform: `translateY(${ty}px)`,
              ...wordStyle,
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}

/** Horizontal line draw animation */
export function LineDraw({
  startFrame,
  color = 'rgba(196,151,106,0.6)',
  duration = 30,
  width = '100%',
  height = 1,
}: {
  startFrame: number
  color?: string
  duration?: number
  width?: string | number
  height?: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const scaleX = interpolate(local, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width,
        height,
        background: color,
        transformOrigin: 'left center',
        transform: `scaleX(${scaleX})`,
      }}
    />
  )
}
