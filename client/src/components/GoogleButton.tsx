import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (opts: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

let clientIdPromise: Promise<string | null> | null = null
const loadClientId = () => (clientIdPromise ??= api<{ googleClientId: string | null }>('/auth/config').then((c) => c.googleClientId).catch(() => null))

let scriptPromise: Promise<void> | null = null
function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Google indisponible'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

/** Bouton « Continuer avec Google » officiel. Rien n'est affiché si Google n'est pas configuré. */
export function GoogleButton({ onCredential, onReady }: { onCredential: (credential: string) => void; onReady?: (available: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(false)
  const cb = useRef(onCredential)
  cb.current = onCredential

  useEffect(() => {
    let cancelled = false
    loadClientId().then(async (clientId) => {
      if (!clientId || cancelled) return onReady?.(false)
      try {
        await loadScript()
        if (cancelled || !window.google || !ref.current) return
        window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential) })
        window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: Math.min(ref.current.offsetWidth || 400, 400), locale: 'fr' })
        setAvailable(true)
        onReady?.(true)
      } catch {
        onReady?.(false)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={ref} style={{ display: available ? 'flex' : 'none', justifyContent: 'center', minHeight: available ? 44 : 0 }} />
}
