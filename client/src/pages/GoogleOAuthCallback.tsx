import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function GoogleOAuthCallback() {
  const navigate = useNavigate()
  const setAuthFromPopup = useAuthStore(s => s.setAuthFromPopup)

  useEffect(() => {
    let data: Record<string, unknown>
    try {
      const hash = window.location.hash.slice(1)
      if (!hash) throw new Error('Callback vide — aucune donnée reçue de Google.')
      const normalized = hash.replace(/-/g, '+').replace(/_/g, '/')
      const bytes = Uint8Array.from(atob(normalized), c => c.charCodeAt(0))
      data = JSON.parse(new TextDecoder().decode(bytes))
    } catch (e) {
      const msg = `Erreur décodage OAuth: ${e instanceof Error ? e.message : String(e)}`
      navigate('/login', { replace: true, state: { googleError: msg } })
      return
    }

    if (data.type !== 'GOOGLE_AUTH_SUCCESS') {
      const msg = (data.error as string) || 'Connexion Google échouée.'
      navigate('/login', { replace: true, state: { googleError: msg } })
      return
    }

    setAuthFromPopup(data as Parameters<typeof setAuthFromPopup>[0])

    if (data.isNewUser) {
      navigate('/select-role', { replace: true })
      return
    }

    // Si l'utilisateur venait d'une page spécifique (ex: annonce), y revenir
    const returnTo = localStorage.getItem('authReturnTo')
    if (returnTo) {
      localStorage.removeItem('authReturnTo')
      navigate(returnTo, { replace: true })
      return
    }

    const role = (data.user as Record<string, unknown>)?.role as string | undefined
    const paths: Record<string, string> = {
      SUPER_ADMIN: '/super-admin',
      OWNER: '/dashboard/owner',
      TENANT: '/dashboard/tenant',
      ADMIN: '/admin',
    }
    navigate(paths[role ?? ''] ?? '/dashboard/tenant', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#5a5754', fontSize: 14, gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e4e1db', borderTopColor: '#c4976a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      Connexion en cours…
    </div>
  )
}
