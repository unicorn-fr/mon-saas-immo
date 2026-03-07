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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full opacity-50 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-38 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute -bottom-32 left-1/4 w-[420px] h-[420px] rounded-full opacity-28 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-heading text-gradient-brand">ImmoParticuliers</span>
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
