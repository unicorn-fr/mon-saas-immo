import { useState, useEffect } from 'react'

/**
 * Hook générique pour réagir aux media queries CSS.
 * SSR-safe (retourne false côté serveur).
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    // Sync au montage en cas de changement entre SSR et hydratation
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** < 768px — mobile (iPhone, Galaxy) */
export const useIsMobile  = () => useMediaQuery('(max-width: 767px)')
/** 768px–1023px — tablettes */
export const useIsTablet  = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
/** ≥ 1024px — desktop */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
