import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { B } from './tokens'

/** SVG Bailio logo mark (stylised "b" with caramel dot) */
export function LogoMark({ size = 48, color = B.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* House/building icon with a caramel dot */}
      <rect x="8" y="20" width="32" height="24" rx="3" stroke={color} strokeWidth="2" fill="none" />
      <path d="M4 22 L24 6 L44 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="18" y="30" width="12" height="14" rx="2" fill={B.caramel} />
      <circle cx="38" cy="10" r="4" fill={B.caramel} />
    </svg>
  )
}

/** Full animated Bailio wordmark */
export function BailioLogo({ startFrame = 0, size = 72, color = B.cream }: {
  startFrame?: number; size?: number; color?: string
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = Math.max(0, frame - startFrame)

  const p = spring({ frame: local, fps, config: { damping: 16, stiffness: 55, mass: 1 } })
  const opacity = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scale = interpolate(p, [0, 1], [0.75, 1])

  const dotP = spring({ frame: Math.max(0, local - 10), fps, config: { damping: 10, stiffness: 120 } })
  const dotScale = interpolate(dotP, [0, 1], [0, 1])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity, transform: `scale(${scale})` }}>
      {/* Logo mark */}
      <div style={{ flexShrink: 0 }}>
        <LogoMark size={size * 0.7} color={color} />
      </div>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
        <span style={{
          fontFamily: B.display, fontStyle: 'italic', fontWeight: 700,
          fontSize: size, color, lineHeight: 1, letterSpacing: '-0.025em',
        }}>
          bailio
        </span>
        <span style={{
          fontFamily: B.display, fontStyle: 'italic', fontWeight: 700,
          fontSize: size, color: B.caramel, lineHeight: 1,
          display: 'inline-block', transform: `scale(${dotScale})`, transformOrigin: 'bottom center',
        }}>
          .
        </span>
      </div>
    </div>
  )
}
