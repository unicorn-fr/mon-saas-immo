import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react'
import { authService } from '../services/auth.service'

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
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1d1d1f]" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>FOYER</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#d2d2d7] text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-[#e8f0fe] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                Vérification en cours...
              </h2>
              <p className="text-[#515154] text-sm">
                Veuillez patienter pendant que nous vérifions votre email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                Email vérifié !
              </h2>
              <p className="text-[#515154] text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold px-8 py-2.5 transition-colors"
              >
                Se connecter
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                Erreur de vérification
              </h2>
              <p className="text-[#515154] text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold px-8 py-2.5 transition-colors"
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
