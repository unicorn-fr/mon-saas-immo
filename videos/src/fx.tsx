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

/**
 * Fond : dégradé « maillé » qui dérive lentement (deux halos de couleur qui tournent l'un autour de l'autre),
 * trame de points très fine. Jamais immobile, jamais distrayant.
 */
export function Backdrop({ dark = false, accent = C.caramel }: { dark?: boolean; accent?: string }) {
  const frame = useCurrentFrame()
  const dot = dark ? 'rgba(255,255,255,0.07)' : 'rgba(26,26,46,0.07)'
  const a = frame / 70
  const blob = (color: string, x: number, y: number, size: number, opacity: number) => (
    <div style={{ position: 'absolute', width: size, height: size, left: x - size / 2, top: y - size / 2, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, transparent 62%)`, opacity }} />
  )
  return (
    <AbsoluteFill style={{ background: dark ? `linear-gradient(170deg, ${C.night} 0%, ${C.nightSoft} 130%)` : C.bg, overflow: 'hidden' }}>
      {blob(accent, 540 + Math.cos(a) * 260, 700 + Math.sin(a) * 220, 1500, dark ? 0.32 : 0.26)}
      {blob(dark ? C.owner : C.ownerLight, 540 - Math.cos(a * 0.8) * 300, 1350 - Math.sin(a * 0.8) * 200, 1700, dark ? 0.55 : 0.9)}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${dot} 2px, transparent 2.5px)`, backgroundSize: '44px 44px', backgroundPosition: `0 ${frame * 0.6}px`, maskImage: 'linear-gradient(180deg, black 0%, transparent 75%)' }} />
    </AbsoluteFill>
  )
}

/** Carte « verre dépoli » : fond translucide flouté, liseré clair, ombre douce (les cartes flottantes façon fintech). */
export const glass = (dark = false): CSSProperties => ({
  background: dark ? 'rgba(46,46,74,0.72)' : 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px) saturate(1.4)',
  border: `2px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)'}`,
  boxShadow: '0 30px 80px rgba(26,26,46,0.22), 0 4px 14px rgba(26,26,46,0.08)',
  borderRadius: 40,
})

/** Nombre qui défile jusqu'à sa valeur (compteur), au format français. */
export function useCount(to: number, delay: number, duration = 24, decimals = 2) {
  const p = useProgress(delay, duration)
  return (to * p).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
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

/**
 * Texte cinétique : chaque mot monte de derrière une limite, avec un flou de mouvement, l'un après l'autre
 * (l'« animator » de texte d'After Effects).
 */
export function KineticText({ text, delay = 0, stagger = 3, style }: { text: string; delay?: number; stagger?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const words = text.split(' ')
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.25em', ...style }}>
      {words.map((w, i) => {
        const p = interpolate(frame, [delay + i * stagger, delay + i * stagger + 14], [0, 1], { ...clamp, easing: easeOut })
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 100}%) rotate(${(1 - p) * 4}deg)`, filter: `blur(${(1 - p) * 10}px)`, opacity: Math.min(1, p * 1.5) }}>{w}</span>
          </span>
        )
      })}
    </div>
  )
}

/** Mot dont les lettres tombent une à une avec un rebond (accroche, logo). */
export function Letters({ text, delay = 0, stagger = 1.4, style }: { text: string; delay?: number; stagger?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div style={{ display: 'inline-flex', whiteSpace: 'pre', ...style }}>
      {[...text].map((ch, i) => {
        const s = spring({ frame: frame - delay - i * stagger, fps, config: { stiffness: 260, damping: 14, mass: 0.5 } })
        const local = frame - delay - i * stagger
        return (
          <span key={i} style={{ display: 'inline-block', transform: `translateY(${(1 - s) * 60}px) scale(${interpolate(s, [0, 1], [1.8, 1])})`, opacity: local < 0 ? 0 : Math.min(1, s * 2), filter: `blur(${Math.max(0, (1 - s) * 14)}px)` }}>{ch}</span>
        )
      })}
    </div>
  )
}

/** Sortie de plan : 0 pendant la scène, 1 juste avant la transition (le titre et les cartes partent avant la coupe). */
export function useExit(frames: number, transition: number) {
  const frame = useCurrentFrame()
  return interpolate(frame, [frames - transition - 8, frames - transition + 2], [0, 1], { ...clamp, easing: easeIn })
}
