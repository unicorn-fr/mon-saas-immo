import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Home, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { authService } from '../services/auth.service'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Veuillez entrer votre adresse email')
      return
    }

    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setIsSent(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de l\'envoi de l\'email'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full opacity-50 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-38 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] rounded-full opacity-28 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-heading text-gradient-brand">ImmoParticuliers</span>
          </Link>
        </div>

        <div className="card">
          {isSent ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Email envoye !
              </h2>
              <p className="text-slate-600 mb-6">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous
                recevrez un lien de reinitialisation.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Pensez a verifier vos spams si vous ne recevez rien.
              </p>
              <Link to="/login" className="btn btn-primary w-full">
                Retour a la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center mb-2">
                Mot de passe oublie ?
              </h2>
              <p className="text-slate-600 text-center mb-6">
                Entrez votre email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="votre@email.com"
                      className="input pl-10 w-full"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi en cours...
                    </span>
                  ) : (
                    'Envoyer le lien'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour a la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

