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

        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#d2d2d7]">
          {isSent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                Email envoyé !
              </h2>
              <p className="text-[#515154] text-sm mb-2">
                Si un compte existe avec l'adresse <span className="font-semibold text-[#1d1d1f]">{email}</span>, vous recevrez un lien de réinitialisation.
              </p>
              <p className="text-xs text-[#86868b] mb-6">
                Pensez à vérifier vos spams si vous ne recevez rien.
              </p>
              <Link
                to="/login"
                className="block w-full bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold py-2.5 text-center transition-colors"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1d1d1f]" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                  Mot de passe oublié ?
                </h1>
                <p className="text-[#515154] text-sm mt-1">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="votre@email.com"
                      className="w-full bg-white border border-[#d2d2d7] rounded-xl pl-10 pr-4 py-2.5 text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.12)] transition-all text-sm"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              className="inline-flex items-center gap-2 text-sm text-[#515154] hover:text-[#1d1d1f] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
