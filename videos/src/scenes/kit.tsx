import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import { C, sans, serif } from '../theme'

/** Ressort court, nerveux : l'animation de base de toutes les apparitions. */
export function useSpring(delay = 0, damping = 14, mass = 0.7) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - delay, fps, config: { damping, mass, stiffness: 180 } })
}

/** Fond vivant : crème ou nuit, avec deux formes floues qui dérivent lentement. */
export function Background({ dark = false, accent = C.caramel }: { dark?: boolean; accent?: string }) {
  const frame = useCurrentFrame()
  const a = Math.sin(frame / 40) * 120
  const b = Math.cos(frame / 55) * 160
  return (
    <AbsoluteFill style={{ background: dark ? C.night : C.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: 450, background: accent, opacity: dark ? 0.22 : 0.18, filter: 'blur(140px)', left: -250 + a, top: 120 + b }} />
      <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: 400, background: dark ? C.owner : C.owner, opacity: dark ? 0.45 : 0.1, filter: 'blur(160px)', right: -260 - a, bottom: 80 - b }} />
    </AbsoluteFill>
  )
}

/** Mot qui surgit : glisse du bas, léger flou de mouvement, rebond. */
export function Pop({ children, delay = 0, style, from = 80 }: { children: ReactNode; delay?: number; style?: CSSProperties; from?: number }) {
  const s = useSpring(delay)
  const blur = interpolate(s, [0, 0.6, 1], [12, 2, 0], { extrapolateRight: 'clamp' })
  return <div style={{ transform: `translateY(${(1 - s) * from}px) scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 1.4), filter: `blur(${blur}px)`, ...style }}>{children}</div>
}

export const titleStyle = (size: number, color: string = C.ink): CSSProperties => ({ fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: size, lineHeight: 1, color, letterSpacing: -1 })
export const bodyStyle = (size: number, color: string = C.inkMid, weight = 500): CSSProperties => ({ fontFamily: sans, fontWeight: weight, fontSize: size, lineHeight: 1.25, color })

/** Téléphone avec une capture de Bailio : entre en glissant, flotte, zoom facultatif vers le haut de l'écran. */
export function Phone({ src, side = 'droite', delay = 0, zoom = false, badge }: { src: string; side?: 'droite' | 'gauche'; delay?: number; zoom?: boolean; badge?: string }) {
  const frame = useCurrentFrame()
  const s = useSpring(delay, 16, 0.9)
  const dir = side === 'droite' ? 1 : -1
  const float = Math.sin(frame / 18) * 10
  const tilt = interpolate(s, [0, 1], [dir * 18, dir * 4])
  const scale = zoom ? interpolate(frame, [delay + 20, delay + 120], [1, 1.12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }) : 1
  const b = useSpring(delay + 22)
  return (
    <div style={{ position: 'absolute', left: '50%', top: 720, width: 620, height: 1180, marginLeft: -310, transform: `translateX(${(1 - s) * dir * 900}px) translateY(${float}px) rotate(${tilt}deg)` }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 74, background: C.night, padding: 18, boxShadow: '0 60px 120px rgba(26,26,46,0.35)' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 58, overflow: 'hidden', background: C.bg }}>
          <Img src={staticFile(src)} style={{ width: '100%', transform: `scale(${scale})`, transformOrigin: 'top center' }} />
        </div>
      </div>
      {badge ? (
        <div style={{ position: 'absolute', top: 120, [side === 'droite' ? 'left' : 'right']: -70, transform: `scale(${b}) rotate(${-dir * 8}deg)`, background: C.green, color: C.surface, ...bodyStyle(52, C.surface, 700), padding: '22px 40px', borderRadius: 999, boxShadow: '0 20px 40px rgba(27,94,59,0.35)' }}>{badge}</div>
      ) : null}
    </div>
  )
}

/** Sous-titres façon karaoké : la phrase de la voix off, mot à mot (lisible sans le son). */
export function Captions({ text, frames, dark = false }: { text: string; frames: number; dark?: boolean }) {
  const frame = useCurrentFrame()
  const words = text.split(/\s+/)
  // Groupes de 4 à 5 mots, affichés au rythme de la voix (proportionnel au nombre de lettres).
  const groups: string[][] = []
  for (let i = 0; i < words.length; i += 5) groups.push(words.slice(i, i + 5))
  const weights = groups.map((g) => g.join(' ').length)
  const total = weights.reduce((a, b) => a + b, 0)
  const usable = frames * 0.92
  let acc = 0
  let current = 0
  let start = 0
  for (let i = 0; i < groups.length; i++) {
    const len = (weights[i] / total) * usable
    if (frame >= acc) {
      current = i
      start = acc
    }
    acc += len
  }
  const local = frame - start
  const g = groups[current]
  const appear = interpolate(local, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, bottom: 150, display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.88)', borderRadius: 26, padding: '22px 34px', opacity: appear, transform: `translateY(${(1 - appear) * 20}px)`, textAlign: 'center', ...bodyStyle(50, C.surface, 700), lineHeight: 1.2 }}>
        {g.map((w, i) => (
          <span key={i} style={{ color: i <= Math.floor((local / Math.max(1, (weights[current] / total) * usable)) * g.length) ? (i === g.length - 1 ? C.caramel : C.surface) : 'rgba(255,255,255,0.45)' }}>
            {w}{' '}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Volet de transition caramel qui balaie l'écran en fin de scène. */
export function Wipe({ frames }: { frames: number }) {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [frames - 8, frames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) })
  if (p <= 0) return null
  return <div style={{ position: 'absolute', inset: 0, background: C.caramel, transform: `translateY(${(1 - p) * 100}%)` }} />
}

/** Entrée de scène : le volet repart vers le haut. */
export function Reveal() {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
  if (p >= 1) return null
  return <div style={{ position: 'absolute', inset: 0, background: C.caramel, transform: `translateY(${-p * 100}%)` }} />
}
