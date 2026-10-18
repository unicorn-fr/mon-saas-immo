import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, sans, serif } from './theme'

/**
 * Boîte à outils « motion design » : les gestes d'un monteur After Effects, en code.
 * Courbes rapides en sortie (easeOutExpo), dépassements contrôlés, textes révélés par masque,
 * caméra qui pousse en continu, grain et vignettage.
 */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1) // « expo out » : arrive vite, se pose en douceur
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1)
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0)

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** Progression 0 → 1 entre deux images, avec une courbe. */
export function useProgress(start: number, duration: number, easing = easeOut) {
  const frame = useCurrentFrame()
  return interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing })
}

/** Ressort avec un léger dépassement (rebond) : pour les objets qui « claquent ». */
export function useBounce(delay = 0, stiffness = 220, damping = 13) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - delay, fps, config: { stiffness, damping, mass: 0.6 } })
}

export const title = (size: number, color: string = C.ink): CSSProperties => ({ fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: size, lineHeight: 0.95, color, letterSpacing: -2 })
export const label = (size: number, color: string = C.ink, weight = 700): CSSProperties => ({ fontFamily: sans, fontWeight: weight, fontSize: size, lineHeight: 1.1, color, letterSpacing: -0.5 })

/** Ligne de texte révélée par un masque : elle monte de derrière une limite invisible (le geste n° 1 des titres AE). */
export function MaskLine({ children, delay = 0, duration = 16, style }: { children: ReactNode; delay?: number; duration?: number; style?: CSSProperties }) {
  const p = useProgress(delay, duration)
  return (
    <div style={{ overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%) skewY(${(1 - p) * 6}deg)`, ...style }}>{children}</div>
    </div>
  )
}

/** Mot qui « claque » à l'écran : arrive en grand avec un flou de vitesse, rebondit à sa taille. */
export function Slam({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const s = useBounce(delay, 260, 14)
  const local = frame - delay
  const blur = interpolate(local, [0, 4], [18, 0], clamp)
  return <div style={{ transform: `scale(${interpolate(s, [0, 1], [2.4, 1])})`, opacity: local < 0 ? 0 : interpolate(local, [0, 2], [0, 1], clamp), filter: `blur(${blur}px)`, ...style }}>{children}</div>
}

/** Surligneur qui se dessine derrière un mot. */
export function Highlight({ children, delay = 0, color = C.caramel, style }: { children: ReactNode; delay?: number; color?: string; style?: CSSProperties }) {
  const p = useProgress(delay, 12)
  return (
    <span style={{ position: 'relative', display: 'inline-block', ...style }}>
      <span style={{ position: 'absolute', left: '-0.08em', right: '-0.08em', top: '18%', bottom: '4%', background: color, transform: `scaleX(${p}) rotate(-1.5deg)`, transformOrigin: 'left', borderRadius: 10, zIndex: 0 }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </span>
  )
}

/** Caméra : poussée lente et continue sur toute la scène, plus une secousse ponctuelle. */
export function Camera({ children, frames, push = 0.06, shakeAt }: { children: ReactNode; frames: number; push?: number; shakeAt?: number }) {
  const frame = useCurrentFrame()
  const z = interpolate(frame, [0, frames], [1, 1 + push], { ...clamp, easing: easeInOut })
  let x = 0
  let y = 0
  if (shakeAt !== undefined && frame >= shakeAt && frame < shakeAt + 8) {
    const k = 1 - (frame - shakeAt) / 8
    x = (random(`x${frame}`) - 0.5) * 34 * k
    y = (random(`y${frame}`) - 0.5) * 34 * k
  }
  return <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${z})` }}>{children}</AbsoluteFill>
}

/** Fond : couleur pleine, grille fine qui défile, halo de couleur qui respire. */
export function Backdrop({ dark = false, accent = C.caramel }: { dark?: boolean; accent?: string }) {
  const frame = useCurrentFrame()
  const line = dark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.05)'
  const glow = 0.5 + Math.sin(frame / 25) * 0.15
  return (
    <AbsoluteFill style={{ background: dark ? C.night : C.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${line} 2px, transparent 2px), linear-gradient(90deg, ${line} 2px, transparent 2px)`, backgroundSize: '120px 120px', backgroundPosition: `0 ${frame * 1.2}px` }} />
      <div style={{ position: 'absolute', width: 1300, height: 1300, left: -110, top: 300, borderRadius: '50%', background: `radial-gradient(circle, ${accent} 0%, transparent 65%)`, opacity: (dark ? 0.35 : 0.22) * glow }} />
    </AbsoluteFill>
  )
}

/** Grain de pellicule et vignettage : enlèvent l'aspect « trop propre » d'une image de synthèse. */
export function FilmLook() {
  const frame = useCurrentFrame()
  const seed = Math.floor(frame / 2)
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay' }}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.28) 100%)' }} />
    </AbsoluteFill>
  )
}
