import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { AbsoluteFill, interpolate } from 'remotion'

/**
 * Transitions de monteur : chaque scène ne « coupe » pas, elle est emportée par un mouvement.
 * Le flou est proportionnel à la vitesse (flou de bougé), comme un vrai panoramique rapide.
 */

type Dir = { direction: 'gauche' | 'droite' | 'haut' }

/** Panoramique fouetté : l'image part très vite d'un côté, la suivante arrive de l'autre. */
function WhipView({ children, presentationDirection, presentationProgress: p, passedProps }: TransitionPresentationComponentProps<Dir>) {
  const sign = passedProps.direction === 'gauche' ? -1 : 1
  const vertical = passedProps.direction === 'haut'
  const offset = presentationDirection === 'exiting' ? interpolate(p, [0, 1], [0, sign * 100]) : interpolate(p, [0, 1], [-sign * 100, 0])
  const speed = Math.sin(p * Math.PI) // vitesse maximale au milieu du geste
  const t = vertical ? `translateY(${-Math.abs(offset)}%)` : `translateX(${offset}%)`
  return <AbsoluteFill style={{ transform: `${t} scale(${1 + speed * 0.08})`, filter: `blur(${speed * 22}px)` }}>{children}</AbsoluteFill>
}
export const whip = (direction: Dir['direction'] = 'gauche'): TransitionPresentation<Dir> => ({ component: WhipView, props: { direction } })

/** Zoom traversant : on plonge dans l'image, la suivante sort du fond. */
function ZoomView({ children, presentationDirection, presentationProgress: p }: TransitionPresentationComponentProps<Record<string, never>>) {
  const speed = Math.sin(p * Math.PI)
  const scale = presentationDirection === 'exiting' ? interpolate(p, [0, 1], [1, 3.2]) : interpolate(p, [0, 1], [0.55, 1])
  const opacity = presentationDirection === 'exiting' ? interpolate(p, [0.5, 1], [1, 0], { extrapolateLeft: 'clamp' }) : interpolate(p, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ transform: `scale(${scale})`, opacity, filter: `blur(${speed * 16}px)` }}>{children}</AbsoluteFill>
}
export const zoomThrough = (): TransitionPresentation<Record<string, never>> => ({ component: ZoomView, props: {} })

/** Cercle qui s'ouvre depuis un point (là où l'on vient de « toucher » l'écran). */
type Origin = { x: number; y: number }
function CircleView({ children, presentationDirection, presentationProgress: p, passedProps }: TransitionPresentationComponentProps<Origin>) {
  if (presentationDirection === 'exiting') return <AbsoluteFill style={{ transform: `scale(${1 + p * 0.06})`, filter: `brightness(${1 - p * 0.3})` }}>{children}</AbsoluteFill>
  const r = interpolate(p, [0, 1], [0, 150])
  return <AbsoluteFill style={{ clipPath: `circle(${r}% at ${passedProps.x}% ${passedProps.y}%)` }}>{children}</AbsoluteFill>
}
export const circleReveal = (x = 50, y = 50): TransitionPresentation<Origin> => ({ component: CircleView, props: { x, y } })
