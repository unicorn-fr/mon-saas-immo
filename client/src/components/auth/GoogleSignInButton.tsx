import { useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void
  onError?: (error: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  role?: string
}

const LABEL_MAP = {
  signin_with: 'Se connecter avec Google',
  signup_with: "S'inscrire avec Google",
  continue_with: 'Continuer avec Google',
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
  role,
}: GoogleSignInButtonProps) {
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  const handleClick = () => {
    const roleParam = role ? `?role=${encodeURIComponent(role)}` : ''
    const popupUrl = `${API_BASE}/auth/google/redirect${roleParam}`

    const popup = window.open(
      popupUrl,
      'google_auth',
      'width=500,height=620,scrollbars=yes,resizable=yes'
    )

    if (!popup) {
      onErrorRef.current?.('Le popup a été bloqué. Autorisez les popups pour ce site.')
      return
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        window.removeEventListener('message', onMessage)
        // The server returns full auth data — we forward the idToken placeholder
        // Actually we forward the full result to a special callback
        onSuccessRef.current('__popup_result__' + JSON.stringify(event.data))
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', onMessage)
        onErrorRef.current?.(event.data.error || 'Erreur Google')
      }
    }

    window.addEventListener('message', onMessage)

    // Check if popup was closed without completing auth
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed)
        window.removeEventListener('message', onMessage)
      }
    }, 500)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '12px 16px',
        background: '#ffffff',
        border: '1px solid #e4e1db',
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 500,
        color: '#0d0c0a',
        cursor: 'pointer',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#f8f7f4'
        e.currentTarget.style.borderColor = '#ccc9c3'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#ffffff'
        e.currentTarget.style.borderColor = '#e4e1db'
      }}
    >
      <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {LABEL_MAP[text]}
    </button>
  )
}
