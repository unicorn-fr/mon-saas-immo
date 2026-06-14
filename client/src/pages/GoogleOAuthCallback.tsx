import { useEffect } from 'react'

const CHANNEL_NAME = 'bailio_google_auth'
const STORAGE_KEY = 'google_auth_result'

export default function GoogleOAuthCallback() {
  useEffect(() => {
    // Decode the data from the URL hash (set by the backend after Google auth)
    let data: object
    try {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        data = { type: 'GOOGLE_AUTH_ERROR', error: 'Callback vide' }
      } else {
        // Handle both standard base64 and URL-safe base64
        const normalized = hash.replace(/-/g, '+').replace(/_/g, '/')
        // Use TextDecoder to handle UTF-8 names (accented chars) correctly
        const bytes = Uint8Array.from(atob(normalized), c => c.charCodeAt(0))
        const decoded = new TextDecoder().decode(bytes)
        data = JSON.parse(decoded)
      }
    } catch {
      data = { type: 'GOOGLE_AUTH_ERROR', error: 'Erreur callback Google' }
    }

    const json = JSON.stringify(data)

    // 1. BroadcastChannel — instant, reliable, bypasses COOP restrictions
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME)
      bc.postMessage(data)
      setTimeout(() => bc.close(), 1000)
    } catch {
      // BroadcastChannel not available (very old browser) — fall back to localStorage
    }

    // 2. localStorage — fallback for browsers without BroadcastChannel
    try {
      localStorage.setItem(STORAGE_KEY, json)
    } catch {
      // storage blocked (unlikely but possible in private mode)
    }

    // Close popup after a short delay to ensure messages are delivered
    setTimeout(() => window.close(), 1200)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#5a5754', fontSize: 14, gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e4e1db', borderTopColor: '#c4976a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      Connexion en cours…
    </div>
  )
}
