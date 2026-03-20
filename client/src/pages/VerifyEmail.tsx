import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authService } from '../services/auth.service'
import { BailioLogo } from '../components/BailioLogo'

const M = {
  bg: '#fafaf8',
  surface: '#ffffff',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  border: '#e4e1db',
  danger: '#9b1c1c',
  dangerBg: '#fef2f2',
  dangerBorder: '#fca5a5',
  success: '#1b5e3b',
  successBg: '#edf7f2',
  successBorder: '#9fd4ba',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de vérification manquant')
      return
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token)
        setStatus('success')
        setMessage('Votre adresse email a été vérifiée avec succès !')
      } catch (err) {
        setStatus('error')
        setMessage(
          err instanceof Error
            ? err.message
            : 'Erreur lors de la vérification de votre email'
        )
      }
    }

    verify()
  }, [token])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: M.bg, fontFamily: M.body }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
            <BailioLogo size={34} />
            <span style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: M.night, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Bailio
            </span>
          </Link>
        </div>

        <div
          className="p-8 text-center"
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(13,12,10,0.08)',
          }}
        >
          {status === 'loading' && (
            <>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: '#f4f2ee', border: `1px solid ${M.border}`, borderRadius: '12px' }}
              >
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: M.night }} />
              </div>
              <h2
                className="mb-3"
                style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: M.ink }}
              >
                Vérification en cours...
              </h2>
              <p style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid, lineHeight: '1.6' }}>
                Veuillez patienter pendant que nous vérifions votre email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: M.successBg, border: `1px solid ${M.successBorder}`, borderRadius: '12px' }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: M.success }} />
              </div>
              <h2
                className="mb-3"
                style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: M.ink }}
              >
                Email vérifié !
              </h2>
              <p
                className="mb-6"
                style={{ fontFamily: M.display, fontStyle: 'italic', fontSize: '16px', color: M.inkMid, lineHeight: '1.6' }}
              >
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block px-8 py-2.5 transition-opacity hover:opacity-90"
                style={{ background: M.night, color: '#ffffff', borderRadius: '8px', fontFamily: M.body, fontSize: '14px', fontWeight: 500 }}
              >
                Se connecter
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: M.dangerBg, border: `1px solid ${M.dangerBorder}`, borderRadius: '12px' }}
              >
                <XCircle className="w-8 h-8" style={{ color: M.danger }} />
              </div>
              <h2
                className="mb-3"
                style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: M.ink }}
              >
                Erreur de vérification
              </h2>
              <p className="mb-6" style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid, lineHeight: '1.6' }}>
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block px-8 py-2.5 transition-opacity hover:opacity-90"
                style={{ background: M.night, color: '#ffffff', borderRadius: '8px', fontFamily: M.body, fontSize: '14px', fontWeight: 500 }}
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
