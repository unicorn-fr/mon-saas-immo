import { useEffect } from 'react'

export default function GoogleOAuthCallback() {
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1)
      if (hash) {
        const data = JSON.parse(atob(hash))
        if (window.opener) {
          window.opener.postMessage(data, window.location.origin)
        }
      } else {
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Callback vide' }, window.location.origin)
        }
      }
    } catch {
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Erreur de callback Google' }, window.location.origin)
      }
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
