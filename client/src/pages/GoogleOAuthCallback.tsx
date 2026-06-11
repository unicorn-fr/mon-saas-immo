import { useEffect } from 'react'

export default function GoogleOAuthCallback() {
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1)
      const data = hash
        ? JSON.parse(atob(hash))
        : { type: 'GOOGLE_AUTH_ERROR', error: 'Callback vide' }
      localStorage.setItem('google_auth_result', JSON.stringify(data))
    } catch {
      localStorage.setItem('google_auth_result', JSON.stringify({ type: 'GOOGLE_AUTH_ERROR', error: 'Erreur callback Google' }))
    } finally {
      window.close()
    }
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#5a5754', fontSize: 14 }}>
      Connexion en cours…
    </div>
  )
}
