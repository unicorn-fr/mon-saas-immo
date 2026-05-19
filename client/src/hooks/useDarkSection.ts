import { useEffect, useLayoutEffect, RefObject } from 'react'
import { useHeaderStore } from '../store/headerStore'

/**
 * Indique au Header que la section référencée est sombre.
 * Le header passe en texte blanc tant que le bas de la section
 * est encore visible derrière lui (> 64px depuis le haut).
 * useLayoutEffect pour le check initial : évite le flash blanc avant le premier paint.
 */
export function useDarkSection(ref: RefObject<HTMLElement | null>) {
  const setDark = useHeaderStore((s) => s.setDark)

  // Sync avant paint — élimine le flash de couleur au chargement
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDark(rect.bottom > 64)
  }, [setDark])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      const rect = el.getBoundingClientRect()
      setDark(rect.bottom > 64)
    }

    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })

    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      setDark(false)
    }
  }, [setDark])
}
