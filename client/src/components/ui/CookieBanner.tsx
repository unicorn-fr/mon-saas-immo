import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'

const COOKIE_KEY = 'bailio_cookie_consent'

type ConsentValue = 'accepted' | 'declined' | null

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(() => {
    try { return (localStorage.getItem(COOKIE_KEY) as ConsentValue) ?? null }
    catch { return null }
  })

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setConsent('accepted')
  }

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined')
    setConsent('declined')
  }

  return { consent, accept, decline, pending: consent === null }
}

export default function CookieBanner() {
  const { pending, accept, decline } = useCookieConsent()
  const [visible, setVisible] = useState(false)

  // Small delay so banner doesn't flash on first paint
  useEffect(() => {
    if (!pending) return
    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [pending])

  if (!visible || !pending) return null

  return (
    <>
      <style>{`
        @keyframes slide-up-banner {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .cookie-banner { animation: slide-up-banner 0.35s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div
        className="cookie-banner"
        role="dialog"
        aria-label="Paramètres des cookies"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#0a0d1a',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          padding: 'clamp(16px,3vw,24px) clamp(16px,5vw,48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.4)',
          fontFamily: BAI.fontBody,
        }}
      >
        {/* Text */}
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.72)',
          margin: 0,
          lineHeight: 1.6,
          flex: '1 1 300px',
        }}>
          Bailio utilise uniquement des cookies strictement nécessaires (authentification, session).
          Aucun cookie publicitaire.{' '}
          <Link
            to="/cookies"
            style={{ color: BAI.caramel, textDecoration: 'underline' }}
          >
            En savoir plus
          </Link>
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            onClick={decline}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: BAI.fontBody,
              transition: 'border-color 0.15s, color 0.15s',
              minHeight: 40,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
            }}
          >
            Refuser
          </button>
          <button
            onClick={accept}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: BAI.caramel,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: BAI.fontBody,
              transition: 'background 0.15s',
              minHeight: 40,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#b07f54')}
            onMouseLeave={e => (e.currentTarget.style.background = BAI.caramel)}
          >
            Accepter
          </button>
        </div>
      </div>
    </>
  )
}
