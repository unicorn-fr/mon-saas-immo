import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../services/api.service'
import { useAuthStore } from '../store/authStore'

type Status = 'loading' | 'success' | 'error'

export default function VerifyMagicLink() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser, setTokens } = useAuthStore()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setErrorMsg('Lien invalide ou incomplet.')
      setStatus('error')
      return
    }

    apiClient
      .post('/auth/magic-link/verify', { token })
      .then((res) => {
        const { accessToken, refreshToken, user } = res.data.data
        setTokens(accessToken, refreshToken)
        setUser(user)

        // Redirect by role after short delay so user sees success state
        setTimeout(() => {
          if (user.role === 'OWNER' || user.role === 'ADMIN') {
            navigate('/dashboard/owner', { replace: true })
          } else if (user.role === 'TENANT') {
            navigate('/dashboard/tenant', { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        }, 1500)

        setStatus('success')
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          'Ce lien a expiré ou a déjà été utilisé.'
        setErrorMsg(msg)
        setStatus('error')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#fafaf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e4e1db',
          borderRadius: 16,
          padding: '48px 40px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 700,
              fontSize: 26,
              fontStyle: 'italic',
              color: '#0d0c0a',
              letterSpacing: '-0.5px',
            }}
          >
            Foyer
          </span>
        </div>

        {status === 'loading' && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid #e4e1db',
                borderTopColor: '#1a1a2e',
                margin: '0 auto 24px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#5a5754', fontSize: 15, margin: 0 }}>
              Connexion en cours...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#edf7f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#1b5e3b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 24,
                color: '#0d0c0a',
                margin: '0 0 8px',
              }}
            >
              Connexion réussie
            </h2>
            <p style={{ color: '#5a5754', fontSize: 14, margin: 0 }}>
              Redirection vers votre espace...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="#9b1c1c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 24,
                color: '#0d0c0a',
                margin: '0 0 8px',
              }}
            >
              Lien invalide
            </h2>
            <p
              style={{
                color: '#9b1c1c',
                fontSize: 14,
                margin: '0 0 28px',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#1a1a2e',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  )
}
