import { useEffect, useRef, useState } from 'react'

/**
 * Nombre qui défile jusqu'à sa valeur : à sa première apparition à l'écran, puis à chaque changement. Rien ne bouge si
 * l'appareil demande moins d'animations. Le texte final est toujours le vrai nombre (lecteurs d'écran compris).
 */
export function CountUp({ value, ms = 900 }: { value: number; ms?: number }) {
  const [shown, setShown] = useState(value)
  const ref = useRef<HTMLSpanElement | null>(null)
  const from = useRef(0)
  const seen = useRef(false)

  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (still || typeof IntersectionObserver === 'undefined') return setShown(value)
    let raf = 0
    const run = () => {
      const start = performance.now()
      const a = from.current
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / ms)
        setShown(Math.round(a + (value - a) * (1 - Math.pow(1 - p, 4))))
        if (p < 1) raf = requestAnimationFrame(step)
        else from.current = value
      }
      raf = requestAnimationFrame(step)
    }
    if (seen.current) {
      run()
      return () => cancelAnimationFrame(raf)
    }
    setShown(0)
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        seen.current = true
        io.disconnect()
        run()
      }
    }, { threshold: 0.6 })
    if (ref.current) io.observe(ref.current)
    return () => (io.disconnect(), cancelAnimationFrame(raf))
  }, [value, ms])

  return (
    <span ref={ref}>
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
