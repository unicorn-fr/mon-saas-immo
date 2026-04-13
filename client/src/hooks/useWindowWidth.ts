import { useState, useEffect } from 'react'

/**
 * Retourne la largeur courante de la fenêtre en pixels.
 * SSR-safe : retourne 1280 si window n'est pas disponible.
 */
export function useWindowWidth(): number {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}
