import { useState, FormEvent } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Home, Lock, CheckCircle, XCircle } from 'lucide-react'
import { authService } from '../services/auth.service'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form')
  const [error, setError] = useState('')

  const passwordRequirements = [
    { text: 'Au moins 8 caracteres', met: newPassword.length >= 8 },
    { text: 'Une majuscule', met: /[A-Z]/.test(newPassword) },
    { text: 'Une minuscule', met: /[a-z]/.test(newPassword) },
    { text: 'Un chiffre', met: /[0-9]/.test(newPassword) },
  ]

  const isPasswordStrong = passwordRequirements.every((r) => r.met)

  const getStrengthPercent = () => {
    const met = passwordRequirements.filter((r) => r.met).length
    return (met / passwordRequirements.length) * 100
  }

  const getStrengthColor = () => {
    const pct = getStrengthPercent()
    if (pct <= 25) return 'bg-red-500'
    if (pct <= 50) return 'bg-accent-500'
    if (pct <= 75) return 'bg-warning-500'
    return 'bg-success-500'
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Token de reinitialisation manquant')
      return
    }

    if (!isPasswordStrong) {
      setError('Le mot de passe ne respecte pas les criteres de securite')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword(token, newPassword)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la reinitialisation du mot de passe'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full opacity-50 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-38 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="w-full max-w-md relative z-10">
          <div className="card text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Lien invalide</h2>
            <p className="text-slate-600 mb-6">
              Ce lien de reinitialisation est invalide ou a expire.
            </p>
            <Link to="/forgot-password" className="btn btn-primary">
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    )
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
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Mot de passe reinitialise !
              </h2>
              <p className="text-slate-600 mb-6">
                Votre mot de passe a ete modifie avec succes. Vous pouvez maintenant vous connecter.
              </p>
              <Link to="/login" className="btn btn-primary w-full">
                Se connecter
              </Link>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Link to="/forgot-password" className="btn btn-primary w-full">
                Demander un nouveau lien
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center mb-2">
                Nouveau mot de passe
              </h2>
              <p className="text-slate-600 text-center mb-6">
                Choisissez votre nouveau mot de passe.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input pl-10 w-full"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {newPassword && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${getStrengthPercent()}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {req.met ? (
                          <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                        )}
                        <span
                          className={`text-xs ${
                            req.met ? 'text-success-600' : 'text-slate-500'
                          }`}
                        >
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pl-10 w-full"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full disabled:opacity-50"
                  disabled={
                    isLoading ||
                    !isPasswordStrong ||
                    newPassword !== confirmPassword
                  }
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      En cours...
                    </span>
                  ) : (
                    'Reinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
