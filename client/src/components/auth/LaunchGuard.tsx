/**
 * LaunchGuard — Bloque les routes d'inscription en mode waitlist.
 *
 * Lecture des variables Vite :
 *   VITE_LAUNCH_MODE=waitlist | live
 *   VITE_ADMIN_SECRET=BAILIO_ADMIN_2024   (ou ce que vous définissez)
 *
 * Bypass : ajouter ?secret=<VITE_ADMIN_SECRET> dans l'URL.
 * Le secret est mémorisé en sessionStorage pour la session entière.
 *
 * Utilisation dans App.tsx :
 *   <Route path="/register" element={<LaunchGuard><Register /></LaunchGuard>} />
 */
import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

const LAUNCH_MODE  = import.meta.env.VITE_LAUNCH_MODE  ?? 'live'
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? ''
const SESSION_KEY  = 'bailio_admin_unlocked'

function isAdminUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true'
}

interface LaunchGuardProps {
  children: React.ReactNode
}

export function LaunchGuard({ children }: LaunchGuardProps) {
  const [searchParams] = useSearchParams()
  const secretParam    = searchParams.get('secret')

  // Si le secret URL est valide → mémoriser pour la session
  useEffect(() => {
    if (ADMIN_SECRET && secretParam === ADMIN_SECRET) {
      sessionStorage.setItem(SESSION_KEY, 'true')
    }
  }, [secretParam])

  // Mode live → accès libre
  if (LAUNCH_MODE !== 'waitlist') {
    return <>{children}</>
  }

  // Secret URL valide (présent maintenant ou mémorisé)
  const hasSecret =
    (ADMIN_SECRET && secretParam === ADMIN_SECRET) || isAdminUnlocked()

  if (hasSecret) {
    return <>{children}</>
  }

  // Bloqué → redirection vers la page d'accueil (waitlist)
  return <Navigate to="/" replace />
}
