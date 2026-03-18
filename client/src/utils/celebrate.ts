/**
 * celebrate.ts — Confetti effects for key user milestones.
 * Uses canvas-confetti for lightweight, zero-dependency bursts.
 */
import confetti from 'canvas-confetti'

const NIGHT   = '#1a1a2e'
const CARAMEL = '#c4976a'
const CREAM   = '#f5f4f0'

/** Short burst — first message sent, minor success */
export function celebrateSmall() {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.65 },
    colors: [NIGHT, CARAMEL, CREAM, '#9fd4ba'],
    scalar: 0.9,
    gravity: 1.2,
  })
}

/** Full burst — account created, property published, dossier completed */
export function celebrateBig() {
  const opts = {
    colors: [NIGHT, CARAMEL, CREAM, '#9fd4ba', '#b8ccf0'],
    scalar: 1.1,
  }
  // Two cannons from left and right
  confetti({ ...opts, particleCount: 80, angle: 60,  spread: 65, origin: { x: 0, y: 0.65 } })
  confetti({ ...opts, particleCount: 80, angle: 120, spread: 65, origin: { x: 1, y: 0.65 } })

  // Delayed center burst
  setTimeout(() => {
    confetti({ ...opts, particleCount: 50, spread: 90, origin: { y: 0.55 }, gravity: 0.7 })
  }, 300)
}

/** Stars shower — property approved, lease signed */
export function celebrateStars() {
  confetti({
    particleCount: 100,
    spread: 160,
    origin: { y: 0.3 },
    shapes: ['star'],
    colors: [CARAMEL, '#f6d860', CREAM, '#fdf5ec'],
    scalar: 1.2,
    gravity: 0.6,
  })
}
