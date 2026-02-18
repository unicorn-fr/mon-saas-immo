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

  // If GSI SDK is loaded and initialized, show the official button
  if (clientId && gsiReady) {
    return (
      <div className="flex justify-center">
        <div ref={buttonRef} />
      </div>
    )
  }

  // Fallback: custom styled button (shown always, works when clientId is set)
  return (
    <div className="flex justify-center">
      {/* Hidden div for GSI to render into when ready */}
      {clientId && <div ref={buttonRef} className="hidden" />}

      <button
        type="button"
        onClick={() => {
          if (!clientId) {
            toast.error('Google OAuth non configure. Contactez l\'administrateur.')
            return
          }
          // If clientId exists but GSI not loaded yet
          toast.error('Google Sign-In est en cours de chargement, reessayez.')
        }}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {LABEL_MAP[text]}
      </button>
    </div>
  )
}
