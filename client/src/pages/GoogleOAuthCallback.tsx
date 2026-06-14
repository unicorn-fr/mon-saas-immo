import { useEffect } from 'react'

export default function GoogleOAuthCallback() {
  useEffect(() => {
    let data: object
    try {
      const hash = window.location.hash.slice(1)
      data = hash
        ? JSON.parse(atob(hash))
        : { type: 'GOOGLE_AUTH_ERROR', error: 'Callback vide' }
    } catch {
      data = { type: 'GOOGLE_AUTH_ERROR', error: 'Erreur callback Google' }
    }

    // Write BEFORE closing so parent's storage event fires reliably
    localStorage.setItem('google_auth_result', JSON.stringify(data))

    // Delay window.close() so the StorageEvent has time to propagate to the
    // parent window before this popup is destroyed (race condition fix)
    setTimeout(() => window.close(), 800)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#5a5754', fontSize: 14, gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e4e1db', borderTopColor: '#c4976a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      Connexion en cours…
    </div>
  )
}
