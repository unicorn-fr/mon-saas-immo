import { useEffect, useRef, useCallback } from 'react'

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

export default function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

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
    }

    // Check if Google script is already loaded
    if (window.google) {
      initializeGoogle()
    } else {
      // Wait for the script to load
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle)
          initializeGoogle()
        }
      }, 100)

      // Clean up after 5 seconds if it still hasn't loaded
      const timeout = setTimeout(() => clearInterval(checkGoogle), 5000)

      return () => {
        clearInterval(checkGoogle)
        clearTimeout(timeout)
      }
    }
  }, [clientId, handleCredentialResponse, text])

  if (!clientId) return null

  return (
    <div className="flex justify-center">
      <div ref={buttonRef} />
    </div>
  )
}
