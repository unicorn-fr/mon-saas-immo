import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { authService, TotpRequiredError } from '../services/auth.service'
import { setApiTokens } from '../services/api.service'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { BailioLogo } from '../components/BailioLogo'

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
  ...fontBody,
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

/* ─── Parisian rooftop SVG ───────────────────────────────────────────────── */
function ParisianSkyline() {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '280px', opacity: 0.7 }}
    >
      {/* Ground line */}
      <line x1="0" y1="150" x2="320" y2="150" stroke="white" strokeWidth="1" strokeOpacity="0.4" />

      {/* Building 1 — narrow tower left */}
      <rect x="10" y="90" width="22" height="60" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <polygon points="10,90 21,70 32,90" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <rect x="16" y="108" width="5" height="8" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
      <rect x="24" y="108" width="5" height="8" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />

      {/* Building 2 — wide Haussmann */}
      <rect x="38" y="72" width="52" height="78" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      {/* Mansard roof */}
      <polygon points="38,72 64,50 90,72" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      {/* Dormer windows */}
      <rect x="50" y="56" width="8" height="10" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
      <rect x="66" y="56" width="8" height="10" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
      {/* Floor windows */}
      <rect x="46" y="82" width="8" height="10" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="60" y="82" width="8" height="10" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="74" y="82" width="8" height="10" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="46" y="100" width="8" height="10" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="60" y="100" width="8" height="10" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="74" y="100" width="8" height="10" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />

      {/* Building 3 — slim tall */}
      <rect x="96" y="60" width="28" height="90" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <polygon points="96,60 110,40 124,60" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      {/* Chimney */}
      <rect x="107" y="32" width="5" height="12" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
      <rect x="101" y="74" width="6" height="8" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="113" y="74" width="6" height="8" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="101" y="92" width="6" height="8" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="113" y="92" width="6" height="8" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />

      {/* Building 4 — wide center piece */}
      <rect x="130" y="65" width="60" height="85" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.7" />
      <polygon points="130,65 160,42 190,65" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.7" />
      {/* Attic dormer */}
      <rect x="153" y="48" width="14" height="12" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
      <line x1="160" y1="42" x2="160" y2="48" stroke="white" strokeWidth="0.6" strokeOpacity="0.4" />
      {/* Windows 3 rows */}
      <rect x="138" y="76" width="9" height="11" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="155" y="76" width="9" height="11" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="172" y="76" width="9" height="11" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="138" y="96" width="9" height="11" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="155" y="96" width="9" height="11" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="172" y="96" width="9" height="11" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      {/* Arched door */}
      <rect x="152" y="124" width="16" height="26" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
      <path d="M152,124 Q160,114 168,124" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />

      {/* Building 5 — right side medium */}
      <rect x="196" y="80" width="42" height="70" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <polygon points="196,80 217,62 238,80" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <rect x="202" y="90" width="7" height="9" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="215" y="90" width="7" height="9" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="228" y="90" width="7" height="9" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="202" y="108" width="7" height="9" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="215" y="108" width="7" height="9" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="228" y="108" width="7" height="9" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />

      {/* Building 6 — far right narrow */}
      <rect x="245" y="95" width="25" height="55" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.55" />
      <polygon points="245,95 257,78 270,95" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.55" />
      <rect x="250" y="105" width="6" height="8" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />
      <rect x="261" y="105" width="6" height="8" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.4" />

      {/* Building 7 — rightmost short */}
      <rect x="276" y="110" width="38" height="40" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.5" />
      <polygon points="276,110 295,96 314,110" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.5" />
      <rect x="283" y="120" width="7" height="9" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.35" />
      <rect x="299" y="120" width="7" height="9" stroke="white" strokeWidth="0.8" fill="none" strokeOpacity="0.35" />

      {/* Eiffel tower silhouette — subtle, far right bg */}
      <line x1="295" y1="30" x2="295" y2="96" stroke="white" strokeWidth="0.6" strokeOpacity="0.2" />
      <line x1="284" y1="96" x2="306" y2="96" stroke="white" strokeWidth="0.6" strokeOpacity="0.2" />
      <line x1="284" y1="96" x2="295" y2="30" stroke="white" strokeWidth="0.6" strokeOpacity="0.15" />
      <line x1="306" y1="96" x2="295" y2="30" stroke="white" strokeWidth="0.6" strokeOpacity="0.15" />
      <line x1="288" y1="75" x2="302" y2="75" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
    </svg>
  )
}

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

  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [totpFocused, setTotpFocused] = useState(false)

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

  // ── TOTP verification step ─────────────────────────────────────────────────
  if (totpRequired) {
    return (
      <div
        style={{ minHeight: '100vh', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', ...fontBody }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <BailioLogo size={36} />
              <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '28px', color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Bailio
              </span>
            </Link>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '40px', border: '1px solid #e4e1db', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
              <div style={{ width: '56px', height: '56px', background: '#fdf5ec', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(196,151,106,0.3)' }}>
                <Shield style={{ width: '26px', height: '26px', color: '#c4976a' }} />
              </div>
              <h2 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '32px', color: '#0d0c0a', textAlign: 'center', margin: '0 0 8px 0' }}>
                Vérification 2FA
              </h2>
              <p style={{ ...fontBody, fontSize: '14px', color: '#5a5754', textAlign: 'center', margin: 0, lineHeight: 1.55 }}>
                Ouvrez Google Authenticator ou Authy et saisissez le code à 6 chiffres.
              </p>
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ ...fontBody, fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000 000"
              value={totpCode}
              onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '')); if (error) setError('') }}
              onFocus={() => setTotpFocused(true)}
              onBlur={() => setTotpFocused(false)}
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: '28px',
                letterSpacing: '0.25em',
                marginBottom: '16px',
                borderColor: totpFocused ? '#1a1a2e' : '#e4e1db',
                boxShadow: totpFocused ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
              }}
              autoFocus
            />

            <button
              onClick={handleTotpVerify}
              disabled={totpLoading || totpCode.length !== 6}
              style={{
                width: '100%',
                background: totpLoading || totpCode.length !== 6 ? '#9ca3af' : '#1a1a2e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '13px 0',
                ...fontBody,
                fontWeight: 600,
                fontSize: '14px',
                cursor: totpLoading || totpCode.length !== 6 ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
                transition: 'background 0.15s',
              }}
            >
              {totpLoading ? 'Vérification…' : 'Confirmer'}
            </button>

            <button
              onClick={() => { setTotpRequired(false); setTotpCode(''); setError('') }}
              style={{ ...fontBody, fontSize: '13px', color: '#9e9b96', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center', padding: '4px 0' }}
            >
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Normal login form ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', ...fontBody }}>

      {/* ── Left panel ── */}
      <div
        className="hidden md:flex"
        style={{
          width: '50%',
          background: '#1a1a2e',
          flexDirection: 'column',
          padding: '40px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <BailioLogo size={30} variant="onDark" />
          <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Bailio
          </span>
        </Link>

        {/* Center content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '28px' }}>
          <ParisianSkyline />

          <div>
            <p style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 400, fontSize: '28px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.35, margin: '0 0 12px 0', maxWidth: '320px' }}>
              "L'immobilier entre particuliers, en toute confiance."
            </p>
            <p style={{ ...fontBody, fontWeight: 400, fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              2 500+ propriétaires · 15 000+ locataires
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ ...fontBody, fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Pas encore inscrit ?{' '}
            <Link to="/register" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Créer un compte
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        style={{
          width: '100%',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        className="md:w-1/2"
      >
        {/* Back link */}
        <div style={{ position: 'absolute', top: '28px', left: '32px' }}>
          <Link
            to="/"
            style={{ ...fontBody, fontSize: '13px', color: '#9e9b96', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#5a5754')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9e9b96')}
          >
            ← Accueil
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: '380px', padding: '48px 32px' }}>
          {/* Mobile logo */}
          <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '36px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <BailioLogo size={34} />
              <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Bailio
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '42px', color: '#0d0c0a', margin: '0 0 8px 0', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              Bon retour
            </h1>
            <p style={{ ...fontBody, fontWeight: 400, fontSize: '15px', color: '#5a5754', margin: 0 }}>
              Connectez-vous à votre espace personnel.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '20px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ ...fontBody, fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email */}
            <div>
              <label htmlFor="email" style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                disabled={isLoading}
                style={{
                  ...inputStyle,
                  borderColor: emailFocused ? '#1a1a2e' : '#e4e1db',
                  boxShadow: emailFocused ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label htmlFor="password" style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: '#0d0c0a' }}>
                  Mot de passe
                </label>
                <Link
                  to="/forgot-password"
                  style={{ ...fontBody, fontSize: '13px', color: '#c4976a', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                disabled={isLoading}
                style={{
                  ...inputStyle,
                  borderColor: passwordFocused ? '#1a1a2e' : '#e4e1db',
                  boxShadow: passwordFocused ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
                }}
              />
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
                  Connexion en cours…
                </>
              ) : (
                'Se connecter'
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
              text="signin_with"
            />
          </div>

          {/* Register link */}
          <p style={{ ...fontBody, textAlign: 'center', fontSize: '14px', color: '#5a5754', marginTop: '24px', marginBottom: '0' }}>
            Pas encore de compte ?{' '}
            <Link
              to="/register"
              style={{ color: '#0d0c0a', fontWeight: 500, textDecoration: 'underline', textDecorationColor: '#c4976a', textUnderlineOffset: '2px' }}
            >
              S'inscrire gratuitement
            </Link>
          </p>

          {/* Demo credentials */}
          <div style={{ marginTop: '24px', padding: '16px', background: '#fdf5ec', border: '1px solid rgba(196,151,106,0.3)', borderRadius: '8px' }}>
            <p style={{ ...fontBody, fontWeight: 600, fontSize: '11px', color: '#c4976a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 0' }}>
              Comptes de démonstration
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ ...fontBody, fontSize: '12px', color: '#5a5754', margin: 0 }}>
                <span style={{ fontWeight: 500, color: '#0d0c0a' }}>Propriétaire :</span> owner@example.com / owner123
              </p>
              <p style={{ ...fontBody, fontSize: '12px', color: '#5a5754', margin: 0 }}>
                <span style={{ fontWeight: 500, color: '#0d0c0a' }}>Locataire :</span> tenant@example.com / tenant123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
