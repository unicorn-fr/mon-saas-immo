import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle, Shield, ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { authService, TotpRequiredError } from '../services/auth.service'
import { setApiTokens } from '../services/api.service'
import api from '../services/api'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { BailioLogo } from '../components/BailioLogo'
import toast from 'react-hot-toast'

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const font: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" }
const fontDisplay: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" }

const inputBase: React.CSSProperties = {
  width: '100%',
  background: '#f8f7f4',
  border: '1px solid #e4e1db',
  borderRadius: '10px',
  padding: '14px 16px',
  fontSize: '15px',
  color: '#0d0c0a',
  outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    ...inputBase,
    borderColor: focused ? '#1a1a2e' : '#e4e1db',
    boxShadow: focused ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
  }
}

/* ─── Apple button ───────────────────────────────────────────────────────── */
function AppleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', padding: '12px 16px',
        background: '#0d0c0a', color: '#ffffff', border: 'none',
        borderRadius: '10px', cursor: 'pointer',
        fontSize: '14px', fontWeight: 600,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0d0c0a' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      Continuer avec Apple
    </button>
  )
}

/* ─── Separator ──────────────────────────────────────────────────────────── */
function Sep() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: 1, height: '1px', background: '#e4e1db' }} />
      <span style={{ ...font, fontSize: '12px', color: '#9e9b96' }}>ou</span>
      <div style={{ flex: 1, height: '1px', background: '#e4e1db' }} />
    </div>
  )
}

/* ─── TOTP screen ────────────────────────────────────────────────────────── */
function TotpScreen({
  userId, onBack, onSuccess,
}: { userId: string; onBack: () => void; onSuccess: (role: string) => void }) {
  const { setUser, setTokens } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) { setError('Code à 6 chiffres requis'); return }
    setLoading(true); setError('')
    try {
      const result = await authService.totpVerify(userId, code)
      setApiTokens(result.accessToken, result.refreshToken)
      setTokens(result.accessToken, result.refreshToken)
      setUser(result.user)
      onSuccess(result.user.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code incorrect')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', ...font }}>
      <div style={{
        background: '#ffffff', border: '1px solid #e4e1db', borderRadius: '16px',
        padding: '48px 40px', maxWidth: '400px', width: '100%',
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: '#fdf5ec', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(196,151,106,0.3)' }}>
            <Shield style={{ width: '24px', height: '24px', color: '#c4976a' }} />
          </div>
          <h2 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '28px', color: '#0d0c0a', margin: '0 0 8px' }}>
            Vérification 2FA
          </h2>
          <p style={{ fontSize: '14px', color: '#5a5754', lineHeight: 1.5, margin: 0 }}>
            Saisissez le code à 6 chiffres de votre application.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', gap: '8px' }}>
            <AlertCircle style={{ width: '15px', height: '15px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
          </div>
        )}

        <input
          type="text" inputMode="numeric" maxLength={6} placeholder="000 000"
          value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, '')); if (error) setError('') }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === 'Enter' && verify()}
          style={{ ...inputStyle(focused), textAlign: 'center', fontSize: '28px', letterSpacing: '0.3em', marginBottom: '16px' }}
          autoFocus
        />

        <button
          onClick={verify}
          disabled={loading || code.length !== 6}
          style={{
            width: '100%', padding: '13px', marginBottom: '12px',
            background: (loading || code.length !== 6) ? '#9ca3af' : '#1a1a2e',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: 600,
            cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Vérification…' : 'Confirmer'}
        </button>

        <button
          onClick={onBack}
          style={{ ...font, fontSize: '13px', color: '#9e9b96', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center', padding: '4px 0' }}
        >
          ← Retour
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page principale — 3 écrans
   1. welcome      → Landing: Google / Apple / "Se connecter avec un email"
   2. email_login  → Formulaire email + mot de passe
   3. totp         → Vérification 2FA
═══════════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, googleLogin, isLoading } = useAuth()

  type Screen = 'welcome' | 'email_login' | 'totp'
  const [screen, setScreen] = useState<Screen>('welcome')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState('')
  const [error, setError] = useState('')
  const [totpUserId, setTotpUserId] = useState('')

  // Email non vérifié
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  const redirectByRole = (role: string) => {
    const from = (location.state as { from?: string })?.from
    if (from) return navigate(from, { replace: true })
    const paths: Record<string, string> = {
      SUPER_ADMIN: '/super-admin', OWNER: '/dashboard/owner',
      TENANT: '/dashboard/tenant', ADMIN: '/admin',
    }
    navigate(paths[role] ?? '/', { replace: true })
  }

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Remplissez tous les champs'); return }
    setError(''); setEmailNotVerified(false)
    try {
      const userData = await login({ email, password })
      redirectByRole(userData.role)
    } catch (err) {
      if (err instanceof TotpRequiredError) {
        setTotpUserId(err.userId); setScreen('totp'); return
      }
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'EMAIL_NOT_VERIFIED') { setEmailNotVerified(true); return }
      setError('Identifiants incorrects. Vérifiez votre email et mot de passe.')
    }
  }

  const handleResendVerif = async () => {
    setResendLoading(true)
    try {
      await api.post('/auth/resend-verification-public', { email })
      setResendDone(true)
      toast.success('Email de vérification envoyé !')
    } catch { toast.error('Erreur lors de l\'envoi.') }
    finally { setResendLoading(false) }
  }

  const handleGoogle = async (idToken: string) => {
    setError('')
    try {
      const userData = await googleLogin(idToken)
      redirectByRole(userData.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec connexion Google')
    }
  }

  const handleApple = () => toast('Connexion Apple bientôt disponible', { icon: '🍎' })

  const handleMagicLink = async () => {
    if (!email.trim()) { setError('Entrez votre adresse email'); return }
    try {
      await api.post('/auth/magic-link', { email: email.trim() })
      toast.success('Lien de connexion envoyé à ' + email)
    } catch {
      toast.error('Erreur lors de l\'envoi.')
    }
  }

  /* ── TOTP ────────────────────────────────────────────────────────────── */
  if (screen === 'totp') {
    return (
      <TotpScreen
        userId={totpUserId}
        onBack={() => setScreen('email_login')}
        onSuccess={redirectByRole}
      />
    )
  }

  /* ── Écran d'accueil ──────────────────────────────────────────────────
     Landing connexion : split panel gauche (#1a1a2e) + droite auth
  ─────────────────────────────────────────────────────────────────────── */
  if (screen === 'welcome') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', ...font }}>

        {/* ── Panneau gauche ──────────────────────────────────────────── */}
        <div
          className="hidden md:flex"
          style={{ width: '44%', background: '#1a1a2e', flexDirection: 'column', padding: '40px 48px', position: 'relative', overflow: 'hidden' }}
        >
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BailioLogo size={28} variant="onDark" />
            <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Bailio
            </span>
          </Link>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '32px' }}>
            <blockquote style={{ margin: 0 }}>
              <p style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 400, fontSize: '28px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.4, margin: '0 0 20px', maxWidth: '320px' }}>
                "La location entre particuliers, en toute confiance."
              </p>
            </blockquote>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Zéro frais d\'agence', 'Contrats électroniques ALUR', 'Dossier locataire intelligent', 'Messagerie directe'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(196,151,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#c4976a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            2 500+ propriétaires · 15 000+ locataires
          </p>
        </div>

        {/* ── Panneau droit ───────────────────────────────────────────── */}
        <div
          style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          className="w-full md:w-[56%]"
        >
          <div style={{ position: 'absolute', top: '24px', left: '28px' }}>
            <Link to="/" style={{ fontSize: '13px', color: '#9e9b96', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#5a5754')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9e9b96')}
            >← Accueil</Link>
          </div>

          <div style={{ width: '100%', maxWidth: '380px', padding: '64px 32px 48px' }}>

            {/* Mobile logo */}
            <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '28px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <BailioLogo size={30} />
                <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: '#1a1a2e', letterSpacing: '-0.02em' }}>Bailio</span>
              </Link>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '36px', color: '#0d0c0a', margin: '0 0 6px', lineHeight: 1.1 }}>
                Bienvenue
              </h1>
              <p style={{ fontSize: '14px', color: '#5a5754', margin: 0 }}>
                Connectez-vous pour accéder à votre espace.
              </p>
            </div>

            {/* Social */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ border: '1px solid #e4e1db', borderRadius: '10px', overflow: 'hidden' }}>
                <GoogleSignInButton onSuccess={handleGoogle} onError={setError} text="signin_with" />
              </div>
              <AppleButton onClick={handleApple} />
            </div>

            <div style={{ marginBottom: '20px' }}><Sep /></div>

            {/* Email CTA */}
            <button
              type="button"
              onClick={() => setScreen('email_login')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '13px 16px', background: '#ffffff', color: '#0d0c0a',
                border: '1px solid #ccc9c3', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#f4f2ee'; b.style.borderColor = '#9e9b96' }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#ffffff'; b.style.borderColor = '#ccc9c3' }}
            >
              <Mail style={{ width: '16px', height: '16px', color: '#5a5754', flexShrink: 0 }} />
              Se connecter avec un email
              <ArrowRight style={{ width: '14px', height: '14px', color: '#9e9b96', marginLeft: 'auto' }} />
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#9e9b96', marginTop: '28px', marginBottom: 0 }}>
              Pas encore de compte ?{' '}
              <Link to="/register" style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                Créer un compte →
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Formulaire de connexion email ────────────────────────────────────
     email_login : Google · Apple · email + password
  ─────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', ...font }}>

      {/* ── Panneau gauche (desktop) ───────────────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{ width: '44%', background: '#1a1a2e', flexDirection: 'column', padding: '40px 48px', position: 'relative', overflow: 'hidden' }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <BailioLogo size={28} variant="onDark" />
          <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: '#ffffff', letterSpacing: '-0.02em' }}>
            Bailio
          </span>
        </Link>

        {/* Center */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '32px' }}>
          <blockquote style={{ margin: 0 }}>
            <p style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 400, fontSize: '28px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.4, margin: '0 0 20px', maxWidth: '320px' }}>
              "La location entre particuliers, en toute confiance."
            </p>
          </blockquote>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Zéro frais d\'agence', 'Contrats électroniques ALUR', 'Dossier locataire intelligent', 'Messagerie directe'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(196,151,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#c4976a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          2 500+ propriétaires · 15 000+ locataires
        </p>
      </div>

      {/* ── Panneau droit ─────────────────────────────────────────────── */}
      <div
        style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflowY: 'auto' }}
        className="w-full md:w-[56%]"
      >
        {/* Back button */}
        <button
          onClick={() => { setScreen('welcome'); setError(''); setEmailNotVerified(false) }}
          style={{ position: 'absolute', top: '24px', left: '28px', background: 'none', border: 'none', fontSize: '13px', color: '#9e9b96', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#5a5754')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9e9b96')}
        >
          ← Retour
        </button>

        <div style={{ width: '100%', maxWidth: '380px', padding: '72px 32px 48px' }}>

          {/* Mobile logo */}
          <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '28px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <BailioLogo size={30} />
              <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: '#1a1a2e', letterSpacing: '-0.02em' }}>Bailio</span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '36px', color: '#0d0c0a', margin: '0 0 6px', lineHeight: 1.1 }}>
              Connexion par email
            </h1>
            <p style={{ fontSize: '14px', color: '#5a5754', margin: 0 }}>
              Utilisez votre adresse email et votre mot de passe.
            </p>
          </div>

          {/* Social (rappel) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <div style={{ border: '1px solid #e4e1db', borderRadius: '10px', overflow: 'hidden' }}>
              <GoogleSignInButton onSuccess={handleGoogle} onError={setError} text="signin_with" />
            </div>
            <AppleButton onClick={handleApple} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Sep />
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ marginBottom: '16px', padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', gap: '8px' }}>
              <AlertCircle style={{ width: '15px', height: '15px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Email not verified banner */}
          {emailNotVerified && (
            <div style={{ marginBottom: '16px', padding: '14px 16px', background: '#fdf5ec', border: '1px solid #f3c99a', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: '#92400e', margin: '0 0 10px', fontWeight: 500 }}>
                Email non vérifié. Vérifiez votre boîte mail.
              </p>
              {resendDone ? (
                <p style={{ fontSize: '12px', color: '#1b5e3b', fontWeight: 500, margin: 0 }}>Email envoyé !</p>
              ) : (
                <button onClick={handleResendVerif} disabled={resendLoading}
                  style={{ fontSize: '12px', color: '#92400e', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>
                  {resendLoading ? 'Envoi…' : 'Renvoyer le lien de vérification'}
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>
                Adresse email
              </label>
              <input
                type="email" placeholder="votre@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) setError(''); setEmailNotVerified(false) }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                required disabled={isLoading}
                style={inputStyle(focusedField === 'email')}
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#0d0c0a' }}>Mot de passe</label>
                <Link to="/forgot-password"
                  style={{ fontSize: '13px', color: '#c4976a', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password" placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); if (error) setError('') }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                required disabled={isLoading}
                style={inputStyle(focusedField === 'password')}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              style={{
                width: '100%', padding: '14px', marginTop: '4px',
                background: isLoading ? '#4a4a6a' : '#1a1a2e',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a4a' }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#1a1a2e' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          {/* Magic link fallback */}
          {email.trim() && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#9e9b96', marginTop: '14px', marginBottom: 0 }}>
              Mot de passe oublié ?{' '}
              <button
                onClick={handleMagicLink}
                style={{ background: 'none', border: 'none', color: '#c4976a', fontWeight: 500, cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', fontFamily: 'inherit' }}
              >
                Recevoir un lien de connexion
              </button>
            </p>
          )}

          {/* Create account */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#9e9b96', marginTop: '24px', marginBottom: 0 }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
