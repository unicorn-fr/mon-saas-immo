import { useEffect, useState } from 'react'

const CHANNEL_NAME = 'bailio_google_auth'
const STORAGE_KEY = 'google_auth_result'

export default function GoogleOAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Decode the data from the URL hash (set by the backend after Google auth)
    let data: Record<string, unknown>
    try {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        data = { type: 'GOOGLE_AUTH_ERROR', error: 'Callback vide — aucune donnée reçue de Google.' }
      } else {
        // Handle both standard base64 and URL-safe base64
        const normalized = hash.replace(/-/g, '+').replace(/_/g, '/')
        // Use TextDecoder to handle UTF-8 names (accented chars) correctly
        const bytes = Uint8Array.from(atob(normalized), c => c.charCodeAt(0))
        const decoded = new TextDecoder().decode(bytes)
        data = JSON.parse(decoded)
      }
    } catch (e) {
      data = { type: 'GOOGLE_AUTH_ERROR', error: `Erreur décodage: ${e instanceof Error ? e.message : String(e)}` }
    }

    const isSuccess = (data as Record<string, unknown>).type === 'GOOGLE_AUTH_SUCCESS'
    const error = (data as Record<string, unknown>).error as string | undefined

    if (isSuccess) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMsg(error || 'Erreur inconnue')
      console.error('[GoogleOAuthCallback] Error:', error, data)
    }

    const json = JSON.stringify(data)

    // 1. BroadcastChannel — instant, reliable within same browsing context group
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME)
      bc.postMessage(data)
      setTimeout(() => bc.close(), 1000)
    } catch {
      // BroadcastChannel not available
    }

    // 2. localStorage — reliable across browsing context groups (COOP)
    try {
      localStorage.setItem(STORAGE_KEY, json)
    } catch {
      // storage blocked
    }

    // Close popup after a short delay to ensure messages are delivered
    // Errors stay visible for 3s so user can read them
    const delay = isSuccess ? 1200 : 3500
    const t = setTimeout(() => window.close(), delay)
    return () => clearTimeout(t)
  }, [])

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#9b1c1c', fontSize: 14, gap: 12, padding: 24, textAlign: 'center', background: '#fef2f2' }}>
        <div style={{ fontSize: 28 }}>⚠️</div>
        <strong style={{ fontSize: 15 }}>Erreur Google OAuth</strong>
        <p style={{ color: '#5a5754', maxWidth: 320, lineHeight: 1.5 }}>{errorMsg}</p>
        <p style={{ color: '#9e9b96', fontSize: 12 }}>Cette fenêtre va se fermer…</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#5a5754', fontSize: 14, gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e4e1db', borderTopColor: '#c4976a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      {status === 'success' ? 'Connexion réussie…' : 'Connexion en cours…'}
    </div>
  )
}
