import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export function Reveal({
  children,
  startFrame,
  direction = 'up',
  distance = 32,
  style,
}: {
  children: React.ReactNode
  startFrame: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
  distance?: number
  style?: React.CSSProperties
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = Math.max(0, frame - startFrame)

  const progress = spring({ frame: local, fps, config: { damping: 20, stiffness: 65, mass: 1 } })
  const opacity = interpolate(local, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const tx = direction === 'left' ? interpolate(progress, [0, 1], [distance, 0])
           : direction === 'right' ? interpolate(progress, [0, 1], [-distance, 0]) : 0
  const ty = direction === 'up'   ? interpolate(progress, [0, 1], [distance, 0])
           : direction === 'down' ? interpolate(progress, [0, 1], [-distance, 0]) : 0
  const sc = direction === 'scale' ? interpolate(progress, [0, 1], [0.9, 1]) : 1

  return (
    <div style={{ opacity, transform: `translate(${tx}px,${ty}px) scale(${sc})`, willChange: 'transform,opacity', ...style }}>
      {children}
    </div>
  )
}

/** Word-by-word staggered reveal */
export function WordReveal({
  text, startFrame, stagger = 5, style, wordStyle,
}: {
  text: string; startFrame: number; stagger?: number
  style?: React.CSSProperties; wordStyle?: React.CSSProperties
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = text.split(' ')

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', ...style }}>
      {words.map((word, i) => {
        const local = Math.max(0, frame - startFrame - i * stagger)
        const p = spring({ frame: local, fps, config: { damping: 22, stiffness: 75, mass: 0.85 } })
        const opacity = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const ty = interpolate(p, [0, 1], [22, 0])
        return (
          <span key={i} style={{ display: 'inline-block', opacity, transform: `translateY(${ty}px)`, marginRight: '0.28em', ...wordStyle }}>
            {word}
          </span>
        )
      })}
    </div>
  )
}

/** Animated horizontal line */
export function LineDraw({ startFrame, color = 'rgba(196,151,106,0.55)', duration = 28, width = 120 }: {
  startFrame: number; color?: string; duration?: number; width?: number
}) {
  const frame = useCurrentFrame()
  const scaleX = interpolate(frame - startFrame, [0, duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{ width, height: 1.5, background: color, transformOrigin: 'left center', transform: `scaleX(${scaleX})` }} />
  )
}

/** Ambient glow orb */
export function Orb({ x, y, r, color, start = 0 }: { x: number; y: number; r: number; color: string; start?: number }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame - start, [0, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div aria-hidden style={{
      position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2,
      borderRadius: '50%', background: `radial-gradient(circle,${color} 0%,transparent 68%)`,
      filter: 'blur(55px)', opacity, pointerEvents: 'none',
    }} />
  )
}

/** Small decorative caramel dot */
export function Dot({ x, y, size = 4, start = 0, opacity: maxOp = 0.5 }: {
  x: number; y: number; size?: number; start?: number; opacity?: number
}) {
  const frame = useCurrentFrame()
  const op = interpolate(frame - start, [0, 20], [0, maxOp], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div aria-hidden style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: '50%', background: '#c4976a', opacity: op, pointerEvents: 'none',
    }} />
  )
}

/** Thin decorative ring / circle outline */
export function Ring({ x, y, r, start = 0 }: { x: number; y: number; r: number; start?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = spring({ frame: Math.max(0, frame - start), fps, config: { damping: 30, stiffness: 40 } })
  const scale = interpolate(p, [0, 1], [0.4, 1])
  const opacity = interpolate(frame - start, [0, 25], [0, 0.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div aria-hidden style={{
      position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2,
      borderRadius: '50%', border: '1px solid rgba(196,151,106,0.5)',
      opacity, transform: `scale(${scale})`, pointerEvents: 'none',
    }} />
  )
}
