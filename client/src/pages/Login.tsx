import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Mail, Lock, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { authService, TotpRequiredError } from '../services/auth.service'
import { setApiTokens } from '../services/api.service'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, googleLogin, isLoading, setUser, setTokens } = useAuth()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  // TOTP step
  const [totpRequired, setTotpRequired] = useState(false)
  const [totpUserId, setTotpUserId] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)

  const redirectByRole = (role: string) => {
    const from = (location.state as { from?: string })?.from
    if (from) {
      navigate(from, { replace: true })
    } else if (role === 'SUPER_ADMIN') {
      navigate('/super-admin', { replace: true })
    } else if (role === 'OWNER') {
      navigate('/dashboard/owner', { replace: true })
    } else if (role === 'TENANT') {
      navigate('/dashboard/tenant', { replace: true })
    } else if (role === 'ADMIN') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    try {
      const userData = await login(formData)
      redirectByRole(userData.role)
    } catch (err) {
      if (err instanceof TotpRequiredError) {
        setTotpRequired(true)
        setTotpUserId(err.userId)
        return
      }
      setError('Identifiants incorrects. Veuillez réessayer.')
    }
  }

  const handleTotpVerify = async () => {
    if (!/^\d{6}$/.test(totpCode)) {
      setError('Code à 6 chiffres requis')
      return
    }
    setError('')
    setTotpLoading(true)
    try {
      const result = await authService.totpVerify(totpUserId, totpCode)
      setApiTokens(result.accessToken, result.refreshToken)
      setTokens(result.accessToken, result.refreshToken)
      setUser(result.user)
      redirectByRole(result.user.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code incorrect')
    } finally {
      setTotpLoading(false)
    }
  }

  const handleGoogleSuccess = async (idToken: string) => {
    setError('')
    try {
      const userData = await googleLogin(idToken)
      redirectByRole(userData.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la connexion Google')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  // ── TOTP verification step ────────────────────────────────────────────────
  if (totpRequired) {
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
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 bg-[#e8f0fe] rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-[#007AFF]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1d1d1f] text-center" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
                Vérification 2FA
              </h2>
              <p className="text-sm text-[#515154] mt-2 text-center">
                Ouvrez Google Authenticator ou Authy et saisissez le code à 6 chiffres.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000 000"
              value={totpCode}
              onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '')); if (error) setError('') }}
              className="w-full text-center text-3xl tracking-widest mb-4 bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-[#1d1d1f] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.12)] transition-all"
              autoFocus
            />

            <button
              onClick={handleTotpVerify}
              disabled={totpLoading || totpCode.length !== 6}
              className="w-full bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {totpLoading ? 'Vérification…' : 'Confirmer'}
            </button>

            <button
              onClick={() => { setTotpRequired(false); setTotpCode(''); setError('') }}
              className="text-sm text-[#515154] hover:text-[#1d1d1f] w-full text-center transition-colors"
            >
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Normal login form ─────────────────────────────────────────────────────
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

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#d2d2d7]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1d1d1f]" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
              Connexion
            </h1>
            <p className="text-[#515154] text-sm mt-1">Bienvenue, ravi de vous revoir.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#86868b]" />
                <input
                  id="email" name="email" type="email" placeholder="votre@email.com"
                  className="w-full bg-white border border-[#d2d2d7] rounded-xl pl-10 pr-4 py-2.5 text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.12)] transition-all text-sm"
                  value={formData.email}
                  onChange={handleChange} required disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-[#1d1d1f]">
                  Mot de passe
                </label>
                <Link to="/forgot-password" className="text-xs text-[#007AFF] hover:text-[#0066d6] font-medium transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#86868b]" />
                <input
                  id="password" name="password" type="password" placeholder="••••••••"
                  className="w-full bg-white border border-[#d2d2d7] rounded-xl pl-10 pr-4 py-2.5 text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.12)] transition-all text-sm"
                  value={formData.password}
                  onChange={handleChange} required disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#007AFF] text-white hover:bg-[#0066d6] rounded-xl font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#d2d2d7]" />
            <span className="text-xs font-medium text-[#86868b]">ou</span>
            <div className="flex-1 h-px bg-[#d2d2d7]" />
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setError(err)}
            text="signin_with"
          />

          <p className="text-center text-[#515154] text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-[#007AFF] hover:text-[#0066d6] font-semibold transition-colors">
              S'inscrire
            </Link>
          </p>

          <div className="mt-5 p-3.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl">
            <p className="text-xs font-semibold text-[#1d1d1f] mb-2">Comptes de démonstration :</p>
            <div className="space-y-1 text-xs text-[#515154]">
              <p><span className="font-medium text-[#1d1d1f]">Propriétaire :</span> owner@example.com / owner123</p>
              <p><span className="font-medium text-[#1d1d1f]">Locataire :</span> tenant@example.com / tenant123</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[#515154] hover:text-[#1d1d1f] transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
