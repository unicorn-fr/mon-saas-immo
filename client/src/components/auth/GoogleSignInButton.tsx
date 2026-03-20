import { useEffect, useRef, useCallback, useState } from 'react'
import toast from 'react-hot-toast'

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void
  onError?: (error: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string
              size?: string
              text?: string
              width?: number
              locale?: string
            }
          ) => void
        }
      }
    }
  }
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
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [gsiReady, setGsiReady] = useState(false)

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      if (response.credential) {
        onSuccess(response.credential)
      } else {
        onError?.('No credential received from Google')
      }
    },
    [onSuccess, onError]
  )

  useEffect(() => {
    if (!clientId) return

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        width: 400,
        locale: 'fr',
      })

      setGsiReady(true)
    }

    if (window.google) {
      initializeGoogle()
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle)
          initializeGoogle()
        }
      }, 100)

      const timeout = setTimeout(() => clearInterval(checkGoogle), 5000)

      return () => {
        clearInterval(checkGoogle)
        clearTimeout(timeout)
      }
    }
  }, [clientId, handleCredentialResponse, text])

  return (
    <div className="flex justify-center flex-col items-center">
      {/* GSI renders here — always mounted so Google can paint into it */}
      <div ref={buttonRef} style={{ display: gsiReady ? 'block' : 'none' }} />

      {/* Fallback shown while GSI loads or if no clientId */}
      {!gsiReady && (
        <button
          type="button"
          onClick={() => {
            if (!clientId) {
              toast.error("Google OAuth non configuré. Contactez l'administrateur.")
              return
            }
            toast.error('Google Sign-In est en cours de chargement, réessayez dans un instant.')
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '10px 16px',
            background: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 500,
            color: '#0d0c0a',
            cursor: 'pointer',
            fontFamily: "'DM Sans', system-ui, sans-serif",
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
      )}
    </div>
  )
}
