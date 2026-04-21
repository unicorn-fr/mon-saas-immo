import { useState, FormEvent } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Lock, CheckCircle, XCircle } from 'lucide-react'
import { authService } from '../services/auth.service'
import { BailioLogo } from '../components/BailioLogo'
import { BAI } from '../constants/bailio-tokens'

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
    if (pct <= 25) return '#ef4444'
    if (pct <= 50) return '#f97316'
    if (pct <= 75) return '#eab308'
    return '#22c55e'
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

  const LogoHeader = () => (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
        <BailioLogo size={34} />
        <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.night, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Bailio
        </span>
      </Link>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    background: BAI.bgInput,
    border: `1px solid ${BAI.border}`,
    borderRadius: '8px',
    fontFamily: BAI.fontBody,
    fontSize: '13px',
    color: BAI.ink,
  }

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
      >
        <div className="w-full max-w-md">
          <LogoHeader />
          <div
            className="p-8 text-center"
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(13,12,10,0.08)',
            }}
          >
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
              Lien invalide
            </h2>
            <p className="mb-6" style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link
              to="/forgot-password"
              className="block w-full text-center py-2.5 transition-opacity hover:opacity-90"
              style={{ background: BAI.night, color: '#ffffff', borderRadius: '8px', fontFamily: BAI.fontBody, fontSize: '14px', fontWeight: 500 }}
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
    >
      <div className="w-full max-w-md">
        <LogoHeader />

        <div
          className="p-8"
          style={{
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(13,12,10,0.08)',
          }}
        >
          {status === 'success' ? (
            <div className="text-center">
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
                Mot de passe réinitialisé !
              </h2>
              <p className="mb-6" style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid, lineHeight: '1.6' }}>
                Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link
                to="/login"
                className="block w-full text-center py-2.5 transition-opacity hover:opacity-90"
                style={{ background: BAI.night, color: '#ffffff', borderRadius: '8px', fontFamily: BAI.fontBody, fontSize: '14px', fontWeight: 500 }}
              >
                Se connecter
              </Link>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
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
                Erreur
              </h2>
              <p className="mb-6" style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>{error}</p>
              <Link
                to="/forgot-password"
                className="block w-full text-center py-2.5 transition-opacity hover:opacity-90"
                style={{ background: BAI.night, color: '#ffffff', borderRadius: '8px', fontFamily: BAI.fontBody, fontSize: '14px', fontWeight: 500 }}
              >
                Demander un nouveau lien
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1
                  className="mb-2"
                  style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '32px', color: BAI.ink, lineHeight: '1.1' }}
                >
                  Nouveau mot de passe
                </h1>
                <p style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid }}>
                  Choisissez votre nouveau mot de passe.
                </p>
              </div>

              {error && (
                <div
                  className="mb-4 p-3"
                  style={{ background: BAI.errorLight, border: `1px solid ${'#fca5a5'}`, borderRadius: '8px' }}
                >
                  <p style={{ fontFamily: BAI.fontBody, fontSize: '13px', color: BAI.error }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block mb-1.5"
                    style={{ fontFamily: BAI.fontBody, fontSize: '13px', fontWeight: 500, color: BAI.ink }}
                  >
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BAI.inkFaint }} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      required
                      className="w-full pl-10 pr-4 py-2.5 outline-none transition-all"
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = BAI.night; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,26,46,0.08)` }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>

                  {newPassword && (
                    <div className="mt-2">
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ background: BAI.border }}
                      >
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: `${getStrengthPercent()}%`, background: getStrengthColor() }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {passwordRequirements.map((req, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: '11px',
                          fontWeight: 500,
                          background: req.met ? BAI.tenantLight : '#f4f2ee',
                          color: req.met ? BAI.tenant : BAI.inkFaint,
                          border: `1px solid ${req.met ? BAI.tenantBorder : BAI.border}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {req.met ? (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <polyline points="10 3 5 9 2 6" stroke={BAI.tenant} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span style={{ width: 10, height: 10, display: 'inline-block', borderRadius: '50%', border: `1.5px solid ${BAI.inkFaint}` }} />
                        )}
                        {req.text}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="block mb-1.5"
                    style={{ fontFamily: BAI.fontBody, fontSize: '13px', fontWeight: 500, color: BAI.ink }}
                  >
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BAI.inkFaint }} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      required
                      className="w-full pl-10 pr-4 py-2.5 outline-none transition-all"
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = BAI.night; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,26,46,0.08)` }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1" style={{ fontFamily: BAI.fontBody, fontSize: '12px', color: BAI.error }}>
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordStrong || newPassword !== confirmPassword}
                  className="w-full py-2.5 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: BAI.night,
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontFamily: BAI.fontBody,
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: (isLoading || !isPasswordStrong || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer',
                  }}
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
