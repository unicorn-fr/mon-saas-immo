import { useState, FormEvent, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types/auth.types'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { celebrateBig } from '../utils/celebrate'
import { BailioLogo } from '../components/BailioLogo'
import toast from 'react-hot-toast'

/* ─── Inline styles for the "Maison" design system ─────────────────────── */
const fontDisplay: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" }
const fontBody: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" }

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#f8f7f4',
  border: '1px solid #e4e1db',
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '14px',
  color: '#0d0c0a',
  outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
}

/* ─── Country codes ─────────────────────────────────────────────────────── */
const COUNTRY_CODES = [
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: '+41', flag: '🇨🇭', name: 'Suisse' },
  { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+49', flag: '🇩🇪', name: 'Allemagne' },
  { code: '+39', flag: '🇮🇹', name: 'Italie' },
  { code: '+34', flag: '🇪🇸', name: 'Espagne' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+44', flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: '+1', flag: '🇺🇸', name: 'États-Unis / Canada' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+243', flag: '🇨🇩', name: 'Congo (RDC)' },
  { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
]

/* ─── Benefits for left panel ────────────────────────────────────────────── */
const benefits = [
  'Zéro frais d\'agence',
  'Documents sécurisés & anti-fraude',
  'Contrats électroniques ALUR',
  'Dossier locataire intelligent',
  'Messagerie directe propriétaire-locataire',
]

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
    phoneNumber: '',
    terms: false,
  })
  const [countryCode, setCountryCode] = useState('+33')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [error, setError] = useState('')
  const [, setPasswordErrors] = useState<string[]>([])
  const phoneInputRef = useRef<HTMLInputElement>(null)

  // Focus states
  const [focused, setFocused] = useState<Record<string, boolean>>({})

  const handleFocus = (name: string) => setFocused(prev => ({ ...prev, [name]: true }))
  const handleBlur = (name: string) => setFocused(prev => ({ ...prev, [name]: false }))

  const focusedInputStyle = (name: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused[name] ? '#1a1a2e' : '#e4e1db',
    boxShadow: focused[name] ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
  })

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
      const fullPhone = formData.phoneNumber
        ? `${countryCode}${formData.phoneNumber.replace(/^0/, '')}`
        : undefined

      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: userType,
        phone: fullPhone,
      })

      celebrateBig()
      setRegisteredEmail(formData.email)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Échec de l\'inscription. Veuillez réessayer.'
      setError(msg)
      toast.error(msg, { duration: 5000 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const passwordChecks = [
    { text: '8 caractères min.', met: formData.password.length >= 8 },
    { text: 'Majuscule', met: /[A-Z]/.test(formData.password) },
    { text: 'Minuscule', met: /[a-z]/.test(formData.password) },
    { text: 'Chiffre', met: /[0-9]/.test(formData.password) },
  ]

  // ── Email verification pending screen ──────────────────────────────────
  if (registeredEmail) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8', padding: '24px', ...fontBody }}>
        <div style={{ maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          {/* Icon */}
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fdf5ec', border: '1px solid #f3c99a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 8h24v16a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" stroke="#c4976a" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
              <path d="M4 8l12 10L28 8" stroke="#c4976a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: '12px' }}>
            Vérification requise
          </div>
          <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '34px', color: '#0d0c0a', margin: '0 0 14px', lineHeight: 1.2 }}>
            Confirmez votre email
          </h1>
          <p style={{ fontSize: '15px', color: '#5a5754', lineHeight: 1.7, margin: '0 0 8px' }}>
            Un email de vérification a été envoyé à
          </p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 28px', wordBreak: 'break-all' }}>
            {registeredEmail}
          </p>
          <p style={{ fontSize: '13px', color: '#9e9b96', lineHeight: 1.6, margin: '0 0 32px' }}>
            Cliquez sur le lien dans l'email pour activer votre compte.<br />
            Vérifiez aussi vos spams si vous ne le trouvez pas.
          </p>

          <button
            onClick={() => navigate('/login')}
            style={{
              background: '#1a1a2e', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '13px 32px',
              ...fontBody, fontWeight: 600, fontSize: '14px',
              cursor: 'pointer', marginBottom: '16px', width: '100%',
            }}
          >
            Aller à la connexion
          </button>

          <p style={{ fontSize: '13px', color: '#9e9b96' }}>
            Email non reçu ?{' '}
            <button
              onClick={() => setRegisteredEmail('')}
              style={{ background: 'none', border: 'none', color: '#c4976a', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}
            >
              Corriger l'adresse
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', ...fontBody }}>

      {/* ── Left panel ── */}
      <div
        className="hidden md:flex"
        style={{
          width: '50%',
          background: '#c4976a',
          flexDirection: 'column',
          padding: '40px 48px',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <BailioLogo size={30} />
          <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Bailio
          </span>
        </Link>

        {/* Center content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '32px' }}>
          <div>
            <h2 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: '34px', color: '#1a1a2e', margin: '0 0 6px 0', lineHeight: 1.2 }}>
              La location sans intermédiaire.
            </h2>
            <p style={{ ...fontBody, fontSize: '14px', color: 'rgba(26,26,46,0.65)', margin: 0 }}>
              Tout ce dont vous avez besoin, en un seul endroit.
            </p>
          </div>

          {/* Benefits list */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {benefits.map((benefit) => (
              <li key={benefit} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ ...fontBody, fontSize: '14px', color: '#1a1a2e', fontWeight: 400 }}>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <div>
          <p style={{ ...fontBody, fontSize: '13px', color: 'rgba(26,26,46,0.6)', margin: 0 }}>
            Déjà inscrit ?{' '}
            <Link to="/login" style={{ color: '#1a1a2e', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        style={{
          background: '#ffffff',
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
        }}
        className="w-full md:w-1/2"
      >
        {/* Back link */}
        <div style={{ position: 'absolute', top: '28px', left: '32px' }}>
          <Link
            to="/"
            style={{ ...fontBody, fontSize: '13px', color: '#9e9b96', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#5a5754')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9e9b96')}
          >
            ← Accueil
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: '380px', padding: '72px 32px 48px' }}>
          {/* Mobile logo */}
          <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '32px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <BailioLogo size={34} />
              <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Bailio
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '36px', color: '#0d0c0a', margin: '0 0 8px 0', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              Créer un compte
            </h1>
            <p style={{ ...fontBody, fontWeight: 400, fontSize: '15px', color: '#5a5754', margin: 0 }}>
              Rejoignez la plateforme en quelques minutes.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '20px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ ...fontBody, fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* User type toggle */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', padding: '4px', background: '#f4f2ee', borderRadius: '10px' }}>
            {(['TENANT', 'OWNER'] as UserRole[]).map((type) => {
              const active = userType === type
              const label = type === 'TENANT' ? 'Locataire' : 'Propriétaire'
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: '7px',
                    border: 'none',
                    ...fontBody,
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: active ? '#1a1a2e' : 'transparent',
                    color: active ? '#ffffff' : '#5a5754',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (!active && !isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#e4e1db' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="firstName" style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>
                  Prénom
                </label>
                <input
                  id="firstName" name="firstName" type="text" placeholder="Jean"
                  value={formData.firstName}
                  onChange={handleChange}
                  onFocus={() => handleFocus('firstName')}
                  onBlur={() => handleBlur('firstName')}
                  disabled={isLoading} required
                  style={focusedInputStyle('firstName')}
                />
              </div>
              <div>
                <label htmlFor="lastName" style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>
                  Nom
                </label>
                <input
                  id="lastName" name="lastName" type="text" placeholder="Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                  onFocus={() => handleFocus('lastName')}
                  onBlur={() => handleBlur('lastName')}
                  disabled={isLoading} required
                  style={focusedInputStyle('lastName')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>
                Adresse email
              </label>
              <input
                id="email" name="email" type="email" placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                disabled={isLoading} required
                style={focusedInputStyle('email')}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>
                Téléphone{' '}
                <span style={{ fontWeight: 400, color: '#9e9b96' }}>(optionnel)</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Country code selector */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    disabled={isLoading}
                    style={{
                      appearance: 'none',
                      background: '#f8f7f4',
                      border: '1px solid #e4e1db',
                      borderRadius: '8px',
                      padding: '12px 32px 12px 12px',
                      fontSize: '14px',
                      color: '#0d0c0a',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      minWidth: '90px',
                    }}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code + c.name} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <svg
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9e9b96' }}
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {/* Number input */}
                <input
                  ref={phoneInputRef}
                  id="phoneNumber" name="phoneNumber" type="tel"
                  placeholder="6 12 34 56 78"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onFocus={() => handleFocus('phoneNumber')}
                  onBlur={() => handleBlur('phoneNumber')}
                  disabled={isLoading}
                  style={{ ...focusedInputStyle('phoneNumber'), flex: 1 }}
                />
              </div>
              <p style={{ ...fontBody, fontSize: '11px', color: '#9e9b96', marginTop: '5px' }}>
                {formData.phoneNumber
                  ? `Numéro complet : ${countryCode}${formData.phoneNumber.replace(/^0/, '')}`
                  : 'Ex : 6 12 34 56 78 (sans le 0)'}
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>
                Mot de passe
              </label>
              <input
                id="password" name="password" type="password" placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                disabled={isLoading} required
                style={focusedInputStyle('password')}
              />
              {/* Password checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                {passwordChecks.map((check) => (
                  <div key={check.text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {check.met ? (
                      <CheckCircle style={{ width: '13px', height: '13px', color: '#16a34a', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1.5px solid #d1d5db', flexShrink: 0 }} />
                    )}
                    <span style={{ ...fontBody, fontSize: '11px', color: check.met ? '#16a34a' : '#9e9b96' }}>
                      {check.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => handleFocus('confirmPassword')}
                onBlur={() => handleBlur('confirmPassword')}
                disabled={isLoading} required
                style={focusedInputStyle('confirmPassword')}
              />
            </div>

            {/* Terms checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingTop: '2px' }}>
              <div style={{ position: 'relative', flexShrink: 0, marginTop: '1px' }}>
                <input
                  id="terms" name="terms" type="checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                  disabled={isLoading} required
                  style={{ position: 'absolute', opacity: 0, width: '18px', height: '18px', cursor: 'pointer', margin: 0, zIndex: 1 }}
                />
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: `1.5px solid ${formData.terms ? '#1a1a2e' : '#e4e1db'}`,
                  background: formData.terms ? '#1a1a2e' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {formData.terms && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <label htmlFor="terms" style={{ ...fontBody, fontSize: '13px', color: '#5a5754', cursor: 'pointer', lineHeight: 1.5 }}>
                J'accepte les{' '}
                <a href="/terms" style={{ color: '#0d0c0a', fontWeight: 500, textDecoration: 'underline', textDecorationColor: '#c4976a', textUnderlineOffset: '2px' }}>
                  conditions d'utilisation
                </a>
                {' '}et la{' '}
                <a href="/privacy" style={{ color: '#0d0c0a', fontWeight: 500, textDecoration: 'underline', textDecorationColor: '#c4976a', textUnderlineOffset: '2px' }}>
                  politique de confidentialité
                </a>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                background: isLoading ? '#4a4a6a' : '#1a1a2e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 0',
                ...fontBody,
                fontWeight: 600,
                fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a4a' }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#1a1a2e' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Inscription en cours…
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e4e1db' }} />
            <span style={{ ...fontBody, fontSize: '12px', color: '#9e9b96' }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: '#e4e1db' }} />
          </div>

          {/* Google */}
          <div style={{ border: '1px solid #e4e1db', borderRadius: '8px', overflow: 'hidden' }}>
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(err) => setError(err)}
              text="signup_with"
            />
          </div>

          {/* Login link */}
          <p style={{ ...fontBody, textAlign: 'center', fontSize: '14px', color: '#5a5754', marginTop: '24px', marginBottom: '0' }}>
            Déjà un compte ?{' '}
            <Link
              to="/login"
              style={{ color: '#0d0c0a', fontWeight: 500, textDecoration: 'underline', textDecorationColor: '#c4976a', textUnderlineOffset: '2px' }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
