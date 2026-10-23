import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { clamp, easeInOut } from './fx'
import { C } from './theme'

/**
 * Flèche guide : un seul curseur pour toute la vidéo. Dans chaque scène il se pose sur l'élément important
 * (et clique dessus) ; à chaque transition il file en arc vers la scène suivante, avec une traînée,
 * et « emmène » l'œil d'un plan à l'autre comme un raccord de monteur.
 */
export interface GuideStop {
  /** Pointe de la flèche, en pixels de l'image (1080 × 1920). */
  x: number
  y: number
  /** Direction de la pointe au repos, en degrés (0 = vers la droite, -135 = vers le haut à gauche). */
  dir?: number
  /** Image de la scène où la flèche clique. */
  click?: number
  /** Pas de flèche dans cette scène (elle attend hors champ). */
  hide?: boolean
}

const OFF = { x: 1260, y: 2150, dir: -135 }
const REST_DIR = -125

type Pose = { x: number; y: number; dir: number }

const stopPose = (s: GuideStop): Pose => (s.hide ? OFF : { x: s.x, y: s.y, dir: s.dir ?? REST_DIR })

function mixAngle(a: number, b: number, t: number) {
  const d = ((((b - a) % 360) + 540) % 360) - 180
  return a + d * t
}

/** Position de la flèche à l'image f de la vidéo. Le trajet occupe la transition (plus quelques images avant). */
export function guidePose(f: number, stops: GuideStop[], starts: number[], T: number): Pose {
  for (let i = stops.length - 1; i >= 1; i--) {
    const t0 = starts[i] - 5
    const t1 = starts[i] + T + 3
    if (f < t0) continue
    const to = stopPose(stops[i])
    if (f >= t1) return float(to, f, stops[i].hide)
    const from = float(stopPose(stops[i - 1]), t0, stops[i - 1].hide)
    const p = easeInOut((f - t0) / (t1 - t0))
    // Arc : point de contrôle décalé perpendiculairement au trajet, d'un côté puis de l'autre.
    const mx = (from.x + to.x) / 2
    const my = (from.y + to.y) / 2
    const dx = to.x - from.x
    const dy = to.y - from.y
    const len = Math.hypot(dx, dy) || 1
    const bend = (i % 2 ? 1 : -1) * Math.min(320, len * 0.35)
    const cx = mx - (dy / len) * bend
    const cy = my + (dx / len) * bend
    const x = (1 - p) ** 2 * from.x + 2 * (1 - p) * p * cx + p ** 2 * to.x
    const y = (1 - p) ** 2 * from.y + 2 * (1 - p) * p * cy + p ** 2 * to.y
    // Pendant le trajet, la pointe regarde où elle va.
    const tx = 2 * (1 - p) * (cx - from.x) + 2 * p * (to.x - cx)
    const ty = 2 * (1 - p) * (cy - from.y) + 2 * p * (to.y - cy)
    const tangent = (Math.atan2(ty, tx) * 180) / Math.PI
    const rest = mixAngle(from.dir, to.dir, p)
    return { x, y, dir: mixAngle(rest, tangent, Math.sin(p * Math.PI) * 0.9) }
  }
  return float(stopPose(stops[0]), f, stops[0].hide)
}

/** Au repos, la flèche flotte un peu : elle n'est jamais figée. */
const float = (p: Pose, f: number, hide?: boolean): Pose => (hide ? p : { x: p.x + Math.sin(f / 13) * 7, y: p.y + Math.cos(f / 17) * 6, dir: p.dir + Math.sin(f / 21) * 3 })

/** Curseur : pointe en (0, 0), corps vers le bas à droite (direction de la pointe : -125°). */
function Arrow({ x, y, dir, scale = 1, opacity = 1, ghost = false }: Pose & { scale?: number; opacity?: number; ghost?: boolean }) {
  return (
    <svg width={160} height={160} viewBox="-20 -20 160 160" style={{ position: 'absolute', left: x - 20, top: y - 20, overflow: 'visible', opacity, transformOrigin: `${20}px ${20}px`, transform: `rotate(${dir - REST_DIR}deg) scale(${scale * 1.35})`, filter: ghost ? 'blur(3px)' : 'drop-shadow(0 14px 18px rgba(26,26,46,0.35))' }}>
      <path d="M0 0 L0 84 L21 64 L36 98 L52 91 L37 58 L66 58 Z" fill={C.caramel} stroke={C.surface} strokeWidth={6} strokeLinejoin="round" />
    </svg>
  )
}

export function Guide({ stops, starts, T }: { stops: GuideStop[]; starts: number[]; T: number }) {
  const f = useCurrentFrame()
  const pose = guidePose(f, stops, starts, T)
  // Scène en cours et clic éventuel.
  const i = starts.reduce((acc, s, k) => (s <= f ? k : acc), 0)
  const click = stops[i]?.click
  const local = f - starts[i]
  const pressed = click !== undefined && local >= click && local < click + 5
  const ring = click !== undefined ? interpolate(local, [click, click + 16], [0, 1], clamp) : 0
  const prev = [1, 2, 3, 4, 5].map((k) => guidePose(f - k, stops, starts, T))
  const speed = Math.min(1, Math.hypot(pose.x - prev[0].x, pose.y - prev[0].y) / 45)
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {speed > 0.05 ? prev.map((p, k) => <Arrow key={k} {...p} ghost opacity={speed * 0.28 * (1 - k / 5)} />) : null}
      {ring > 0 && ring < 1 ? (
        <div style={{ position: 'absolute', left: pose.x - 90, top: pose.y - 90, width: 180, height: 180, borderRadius: 90, border: `7px solid ${C.caramel}`, transform: `scale(${0.2 + ring})`, opacity: 1 - ring }} />
      ) : null}
      <Arrow {...pose} scale={pressed ? 0.82 : 1} />
    </AbsoluteFill>
  )
}
