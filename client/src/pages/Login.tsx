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
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full opacity-50 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-38 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-32 left-1/4 w-[420px] h-[420px] rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 bg-primary-700 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 font-heading">ImmoParticuliers</span>
            </Link>
          </div>

          <div className="card">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-7 h-7 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-center">Vérification 2FA</h2>
              <p className="text-sm text-slate-500 mt-1 text-center">
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
              className="input w-full text-center text-3xl tracking-widest mb-4"
              autoFocus
            />

            <button
              onClick={handleTotpVerify}
              disabled={totpLoading || totpCode.length !== 6}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {totpLoading ? 'Vérification…' : 'Confirmer'}
            </button>

            <button
              onClick={() => { setTotpRequired(false); setTotpCode(''); setError('') }}
              className="text-sm text-slate-500 hover:text-slate-700 w-full text-center"
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      {/* Glass blobs */}
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full opacity-50 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-38 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute -bottom-32 left-1/4 w-[420px] h-[420px] rounded-full opacity-28 pointer-events-none" style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-heading text-gradient-brand">ImmoParticuliers</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">Connexion</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email" name="email" type="email" placeholder="votre@email.com"
                  className="input pl-10" value={formData.email}
                  onChange={handleChange} required disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password" name="password" type="password" placeholder="••••••••"
                  className="input pl-10" value={formData.password}
                  onChange={handleChange} required disabled={isLoading}
                />
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setError(err)}
            text="signin_with"
          />

          <p className="text-center text-slate-600 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              S'inscrire
            </Link>
          </p>

          <div className="mt-6 p-3 bg-primary-50 border border-primary-200 rounded-xl">
            <p className="text-xs font-semibold text-blue-900 mb-2">Comptes de démonstration :</p>
            <div className="space-y-1 text-xs text-blue-800">
              <p><strong>Propriétaire:</strong> owner@example.com / owner123</p>
              <p><strong>Locataire:</strong> tenant@example.com / tenant123</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-slate-600 hover:text-slate-900">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )
}
