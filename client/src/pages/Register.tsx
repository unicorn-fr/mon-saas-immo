import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, Mail, Lock, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types/auth.types'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { Turnstile } from '@marsidev/react-turnstile'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

export default function Register() {
  const navigate = useNavigate()
  const { register, googleLogin, isLoading } = useAuth()

  const [userType, setUserType] = useState<UserRole>('TENANT')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    terms: false,
  })
  const [error, setError] = useState('')
  const [, setPasswordErrors] = useState<string[]>([])
  const [turnstileToken, setTurnstileToken] = useState<string>('')

  // Password validation
  const validatePassword = (password: string) => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Au moins 8 caractères')
    if (!/[A-Z]/.test(password)) errors.push('Une majuscule')
    if (!/[a-z]/.test(password)) errors.push('Une minuscule')
    if (!/[0-9]/.test(password)) errors.push('Un chiffre')
    setPasswordErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!formData.terms) {
      setError('Vous devez accepter les conditions d\'utilisation')
      return
    }

    if (!validatePassword(formData.password)) {
      setError('Le mot de passe ne respecte pas les critères de sécurité')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: userType,
        phone: formData.phone || undefined,
        ...(turnstileToken ? { 'cf-turnstile-response': turnstileToken } : {}),
      })

      // Redirect to dashboard based on role
      const redirectPath = userType === 'OWNER' ? '/dashboard/owner' : '/dashboard/tenant'
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Échec de l\'inscription. Veuillez réessayer.'
      )
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Validate password on change
    if (name === 'password') {
      validatePassword(value)
    }

    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleGoogleSuccess = async (idToken: string) => {
    setError('')
    try {
      const userData = await googleLogin(idToken)
      const redirectPath = userData.role === 'OWNER' ? '/dashboard/owner' : '/dashboard/tenant'
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la connexion Google')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      {/* Glass blobs */}
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full opacity-50 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-38 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] rounded-full opacity-28 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)', filter: 'blur(80px)' }} />
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

        {/* Register Card */}
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">Créer un compte</h2>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* User Type Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setUserType('TENANT')}
              disabled={isLoading}
              className={`p-4 rounded-xl border-2 transition-all ${
                userType === 'TENANT'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Users
                className={`w-8 h-8 mx-auto mb-2 ${
                  userType === 'TENANT' ? 'text-primary-500' : 'text-slate-400'
                }`}
              />
              <p
                className={`font-medium ${
                  userType === 'TENANT' ? 'text-primary-700' : 'text-slate-700'
                }`}
              >
                Locataire
              </p>
            </button>

            <button
              type="button"
              onClick={() => setUserType('OWNER')}
              disabled={isLoading}
              className={`p-4 rounded-xl border-2 transition-all ${
                userType === 'OWNER'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Home
                className={`w-8 h-8 mx-auto mb-2 ${
                  userType === 'OWNER' ? 'text-primary-500' : 'text-slate-400'
                }`}
              />
              <p
                className={`font-medium ${
                  userType === 'OWNER' ? 'text-primary-700' : 'text-slate-700'
                }`}
              >
                Propriétaire
              </p>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Jean"
                  className="input"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Dupont"
                  className="input"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  className="input pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                Téléphone <span className="text-slate-400">(optionnel)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                className="input"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="input pl-10"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                {[
                  { text: 'Au moins 8 caractères', met: formData.password.length >= 8 },
                  { text: 'Une majuscule', met: /[A-Z]/.test(formData.password) },
                  { text: 'Une minuscule', met: /[a-z]/.test(formData.password) },
                  { text: 'Un chiffre', met: /[0-9]/.test(formData.password) },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {req.met ? (
                      <CheckCircle className="w-4 h-4 text-success-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                    )}
                    <span className={`text-xs ${req.met ? 'text-success-600' : 'text-slate-500'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="input pl-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="mt-1"
                checked={formData.terms}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <label htmlFor="terms" className="text-sm text-slate-600">
                J'accepte les{' '}
                <a href="/terms" className="text-primary-600 hover:text-primary-700">
                  conditions d'utilisation
                </a>
                {' '}et la{' '}
                <a href="/privacy" className="text-primary-600 hover:text-primary-700">
                  politique de confidentialité
                </a>
              </label>
            </div>

            {/* Turnstile anti-bot (only shown if VITE_TURNSTILE_SITE_KEY is set) */}
            {TURNSTILE_SITE_KEY && (
              <div className="flex justify-center">
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken('')}
                  onExpire={() => setTurnstileToken('')}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Inscription en cours...
                </span>
              ) : (
                'S\'inscrire'
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setError(err)}
            text="signup_with"
          />

          {/* Login Link */}
          <p className="text-center text-slate-600 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-slate-600 hover:text-slate-900">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
