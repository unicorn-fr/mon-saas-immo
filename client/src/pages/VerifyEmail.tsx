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
      setMessage('Token de verification manquant')
      return
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token)
        setStatus('success')
        setMessage('Votre adresse email a ete verifiee avec succes !')
      } catch (err) {
        setStatus('error')
        setMessage(
          err instanceof Error
            ? err.message
            : 'Erreur lors de la verification de votre email'
        )
      }
    }

    verify()
  }, [token])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-primary-700 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 font-heading">ImmoParticuliers</span>
          </Link>
        </div>

        <div className="card text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Verification en cours...
              </h2>
              <p className="text-slate-600">
                Veuillez patienter pendant que nous verifions votre email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Email verifie !
              </h2>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link to="/login" className="btn btn-primary">
                Se connecter
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Erreur de verification
              </h2>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link to="/login" className="btn btn-primary">
                Retour a la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
