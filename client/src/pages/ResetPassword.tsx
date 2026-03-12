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
    { text: 'Au moins 8 caractères', met: newPassword.length >= 8 },
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
    if (pct <= 50) return 'bg-orange-500'
    if (pct <= 75) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Token de réinitialisation manquant')
      return
    }

    if (!isPasswordStrong) {
      setError('Le mot de passe ne respecte pas les critères de sécurité')
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
          : 'Erreur lors de la réinitialisation du mot de passe'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const inputWithIconClass = "w-full bg-white border border-[#d2d2d7] rounded-xl pl-10 pr-4 py-2.5 text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.12)] transition-all text-sm"

  const LogoHeader = () => (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-sm">
          <Home className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-[#1d1d1f]" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>FOYER</span>
      </Link>
    </div>
  )

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LogoHeader />
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#d2d2d7] text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
              Lien invalide
            </h2>
            <p className="text-[#515154] text-sm mb-6">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link
              to="/forgot-password"
              className="block w-full bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold py-2.5 text-center transition-colors"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LogoHeader />

        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#d2d2d7]">
          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                Mot de passe réinitialisé !
              </h2>
              <p className="text-[#515154] text-sm mb-6">
                Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link
                to="/login"
                className="block w-full bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold py-2.5 text-center transition-colors"
              >
                Se connecter
              </Link>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                Erreur
              </h2>
              <p className="text-[#515154] text-sm mb-6">{error}</p>
              <Link
                to="/forgot-password"
                className="block w-full bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold py-2.5 text-center transition-colors"
              >
                Demander un nouveau lien
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1d1d1f]" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                  Nouveau mot de passe
                </h1>
                <p className="text-[#515154] text-sm mt-1">
                  Choisissez votre nouveau mot de passe.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputWithIconClass}
                      placeholder="••••••••"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {newPassword && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-[#f0f0f2] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${getStrengthPercent()}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {passwordRequirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {req.met ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#b0b0b8] flex-shrink-0" />
                        )}
                        <span className={`text-xs ${req.met ? 'text-emerald-600' : 'text-[#86868b]'}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputWithIconClass}
                      placeholder="••••••••"
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
                  className="w-full bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !isPasswordStrong || newPassword !== confirmPassword}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      En cours...
                    </span>
                  ) : (
                    'Réinitialiser le mot de passe'
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
