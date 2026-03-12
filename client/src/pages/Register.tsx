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

    if (name === 'password') {
      validatePassword(value)
    }

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

  const inputClass = "w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.12)] transition-all text-sm"
  const inputWithIconClass = "w-full bg-white border border-[#d2d2d7] rounded-xl pl-10 pr-4 py-2.5 text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[rgba(0,122,255,0.12)] transition-all text-sm"

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 py-12">
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

        {/* Register Card */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#d2d2d7]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1d1d1f]" style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui" }}>
              Créer un compte
            </h1>
            <p className="text-[#515154] text-sm mt-1">Rejoignez la plateforme en quelques minutes.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* User Type Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setUserType('TENANT')}
              disabled={isLoading}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                userType === 'TENANT'
                  ? 'border-[#007AFF] bg-[#e8f0fe]'
                  : 'border-[#d2d2d7] hover:border-[#b0b0b8] bg-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Users
                className={`w-7 h-7 mb-2 ${userType === 'TENANT' ? 'text-[#007AFF]' : 'text-[#86868b]'}`}
              />
              <p className={`text-sm font-semibold ${userType === 'TENANT' ? 'text-[#007AFF]' : 'text-[#1d1d1f]'}`}>
                Locataire
              </p>
              <p className="text-xs text-[#86868b] mt-0.5">Je cherche un logement</p>
            </button>

            <button
              type="button"
              onClick={() => setUserType('OWNER')}
              disabled={isLoading}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                userType === 'OWNER'
                  ? 'border-[#007AFF] bg-[#e8f0fe]'
                  : 'border-[#d2d2d7] hover:border-[#b0b0b8] bg-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Home
                className={`w-7 h-7 mb-2 ${userType === 'OWNER' ? 'text-[#007AFF]' : 'text-[#86868b]'}`}
              />
              <p className={`text-sm font-semibold ${userType === 'OWNER' ? 'text-[#007AFF]' : 'text-[#1d1d1f]'}`}>
                Propriétaire
              </p>
              <p className="text-xs text-[#86868b] mt-0.5">Je mets en location</p>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                  Prénom
                </label>
                <input
                  id="firstName" name="firstName" type="text" placeholder="Jean"
                  className={inputClass} value={formData.firstName}
                  onChange={handleChange} disabled={isLoading} required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                  Nom
                </label>
                <input
                  id="lastName" name="lastName" type="text" placeholder="Dupont"
                  className={inputClass} value={formData.lastName}
                  onChange={handleChange} disabled={isLoading} required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                <input
                  id="email" name="email" type="email" placeholder="votre@email.com"
                  className={inputWithIconClass} value={formData.email}
                  onChange={handleChange} disabled={isLoading} required
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                Téléphone <span className="text-[#86868b] font-normal">(optionnel)</span>
              </label>
              <input
                id="phone" name="phone" type="tel" placeholder="+33 6 12 34 56 78"
                className={inputClass} value={formData.phone}
                onChange={handleChange} disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                <input
                  id="password" name="password" type="password" placeholder="••••••••"
                  className={inputWithIconClass} value={formData.password}
                  onChange={handleChange} disabled={isLoading} required
                />
              </div>
              {/* Password requirements */}
              <div className="mt-2 grid grid-cols-2 gap-1">
                {[
                  { text: 'Au moins 8 caractères', met: formData.password.length >= 8 },
                  { text: 'Une majuscule', met: /[A-Z]/.test(formData.password) },
                  { text: 'Une minuscule', met: /[a-z]/.test(formData.password) },
                  { text: 'Un chiffre', met: /[0-9]/.test(formData.password) },
                ].map((req, i) => (
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                <input
                  id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••"
                  className={inputWithIconClass} value={formData.confirmPassword}
                  onChange={handleChange} disabled={isLoading} required
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <input
                id="terms" name="terms" type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-[#d2d2d7] text-[#007AFF] focus:ring-[#007AFF] cursor-pointer"
                checked={formData.terms}
                onChange={handleChange} disabled={isLoading} required
              />
              <label htmlFor="terms" className="text-sm text-[#515154] cursor-pointer">
                J'accepte les{' '}
                <a href="/terms" className="text-[#007AFF] hover:text-[#0066d6] font-medium">
                  conditions d'utilisation
                </a>
                {' '}et la{' '}
                <a href="/privacy" className="text-[#007AFF] hover:text-[#0066d6] font-medium">
                  politique de confidentialité
                </a>
              </label>
            </div>

            {/* Turnstile anti-bot */}
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
                  Inscription en cours...
                </span>
              ) : (
                'S\'inscrire'
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
            text="signup_with"
          />

          <p className="text-center text-[#515154] text-sm mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-[#007AFF] hover:text-[#0066d6] font-semibold transition-colors">
              Se connecter
            </Link>
          </p>
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
