import { useEffect, useRef, useState } from 'react'

/**
 * Triggers a visible state once the element enters the viewport.
 * Pair with CSS classes: `reveal` (initial hidden state) + `reveal-visible` (animated in).
 */
export function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}
