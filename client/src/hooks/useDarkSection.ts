import { useEffect, RefObject } from 'react'
import { useHeaderStore } from '../store/headerStore'

/**
 * Indique au Header que la section référencée est sombre.
 * Le header passe en texte blanc tant que le bas de la section
 * est encore visible derrière lui (> 64px depuis le haut).
 */
export function useDarkSection(ref: RefObject<HTMLElement | null>) {
  const setDark = useHeaderStore((s) => s.setDark)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      const rect = el.getBoundingClientRect()
      setDark(rect.bottom > 64)
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })

    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      setDark(false)
    }
  }, [setDark])
}
