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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900"
          >
            <Home className="w-8 h-8 text-primary-500" />
            ImmoParticuliers
          </Link>
        </div>

        <div className="card">
          {isSent ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Email envoye !
              </h2>
              <p className="text-gray-600 mb-6">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous
                recevrez un lien de reinitialisation.
              </p>
              <p className="text-sm text-gray-500 mb-6">
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
              <p className="text-gray-600 text-center mb-6">
                Entrez votre email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
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
