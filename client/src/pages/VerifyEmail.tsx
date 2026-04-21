import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authService } from '../services/auth.service'
import { BailioLogo } from '../components/BailioLogo'
import { BAI } from '../constants/bailio-tokens'

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
      style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
            <BailioLogo size={34} />
            <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.night, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Bailio
            </span>
          </Link>
        </div>

        <div
          className="p-8 text-center"
          style={{
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(13,12,10,0.08)',
          }}
        >
          {status === 'loading' && (
            <>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: '#f4f2ee', border: `1px solid ${BAI.border}`, borderRadius: '12px' }}
              >
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: BAI.night }} />
              </div>
              <h2
                className="mb-3"
                style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.ink }}
              >
                Vérification en cours...
              </h2>
              <p style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid, lineHeight: '1.6' }}>
                Veuillez patienter pendant que nous vérifions votre email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, borderRadius: '12px' }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: BAI.tenant }} />
              </div>
              <h2
                className="mb-3"
                style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.ink }}
              >
                Email vérifié !
              </h2>
              <p
                className="mb-6"
                style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: '16px', color: BAI.inkMid, lineHeight: '1.6' }}
              >
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block px-8 py-2.5 transition-opacity hover:opacity-90"
                style={{ background: BAI.night, color: '#ffffff', borderRadius: '8px', fontFamily: BAI.fontBody, fontSize: '14px', fontWeight: 500 }}
              >
                Se connecter
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: BAI.errorLight, border: `1px solid ${'#fca5a5'}`, borderRadius: '12px' }}
              >
                <XCircle className="w-8 h-8" style={{ color: BAI.error }} />
              </div>
              <h2
                className="mb-3"
                style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.ink }}
              >
                Erreur de vérification
              </h2>
              <p className="mb-6" style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid, lineHeight: '1.6' }}>
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block px-8 py-2.5 transition-opacity hover:opacity-90"
                style={{ background: BAI.night, color: '#ffffff', borderRadius: '8px', fontFamily: BAI.fontBody, fontSize: '14px', fontWeight: 500 }}
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
