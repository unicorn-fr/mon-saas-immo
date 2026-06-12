import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../services/api.service'
import { useAuthStore } from '../store/authStore'
import { BAI } from '../constants/bailio-tokens'

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
        background: '#0a0d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: BAI.fontBody,
        padding: '24px',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Glass card on dark background */}
      <div
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: 20,
          padding: '48px 40px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontFamily: BAI.fontDisplay,
              fontWeight: 700,
              fontSize: 26,
              fontStyle: 'italic',
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            Bailio
          </span>
        </div>

        {status === 'loading' && (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: `3px solid rgba(196,151,106,0.25)`,
                borderTopColor: BAI.caramel,
                margin: '0 auto 24px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 15, margin: 0, fontFamily: BAI.fontBody }}>
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
                background: 'rgba(27,94,59,0.25)',
                border: '1px solid rgba(27,94,59,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#4ade80"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 24,
                color: '#ffffff',
                margin: '0 0 8px',
              }}
            >
              Connexion réussie
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14, margin: 0, fontFamily: BAI.fontBody }}>
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
                background: 'rgba(155,28,28,0.20)',
                border: '1px solid rgba(155,28,28,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="#fca5a5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 24,
                color: '#ffffff',
                margin: '0 0 8px',
              }}
            >
              Lien invalide
            </h2>
            <p
              style={{
                color: '#fca5a5',
                fontSize: 14,
                margin: '0 0 28px',
                background: 'rgba(155,28,28,0.15)',
                border: '1px solid rgba(155,28,28,0.30)',
                borderRadius: 8,
                padding: '10px 14px',
                fontFamily: BAI.fontBody,
              }}
            >
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: BAI.night,
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: BAI.fontBody,
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
