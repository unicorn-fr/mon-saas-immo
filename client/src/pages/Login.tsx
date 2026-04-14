import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle, ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiClient as api } from '../services/api.service'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { BailioLogo } from '../components/BailioLogo'
import toast from 'react-hot-toast'

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const font: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" }
const fontDisplay: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" }

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.22)',
  borderRadius: '10px',
  padding: '14px 16px',
  fontSize: '15px',
  color: 'rgba(255, 255, 255, 0.95)',
  outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
  boxSizing: 'border-box',
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    ...inputBase,
    borderColor: focused ? 'rgba(102, 126, 234, 0.80)' : 'rgba(255, 255, 255, 0.22)',
    background: focused ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.08)',
    boxShadow: focused ? '0 0 0 3px rgba(102,126,234,0.20)' : 'none',
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

/* ═══════════════════════════════════════════════════════════════════════════
   Page principale — 2 écrans
   1. welcome      → Landing: Google / Apple / "Se connecter avec un email"
   2. email_login  → Formulaire email + mot de passe
═══════════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, googleLogin, isLoading } = useAuth()

  type Screen = 'welcome' | 'email_login'
  const [screen, setScreen] = useState<Screen>('welcome')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState('')
  const [error, setError] = useState('')

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
      const { user, isNewUser } = await googleLogin(idToken)
      if (isNewUser) {
        navigate('/select-role', { replace: true })
      } else {
        redirectByRole(user.role)
      }
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

  /* ── Écran d'accueil ──────────────────────────────────────────────────
     Landing connexion : split panel gauche (#1a1a2e) + droite auth
  ─────────────────────────────────────────────────────────────────────── */
  if (screen === 'welcome') {
    return (
      <div className="page-glass-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', ...font }}>
        {/* Orbe central */}
        <div style={{ position: 'fixed', top: '25%', right: '12%', width: '360px', height: '360px', background: 'var(--orb-3)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

        {/* Glass card */}
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '40px 36px', zIndex: 1 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <BailioLogo size={32} variant="onDark" />
              <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '24px', color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}>
                Bailio
              </span>
            </Link>
          </div>

          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '34px', color: 'rgba(255,255,255,0.95)', margin: '0 0 8px', lineHeight: 1.1 }}>
              Bienvenue
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              Connectez-vous pour accéder à votre espace.
            </p>
          </div>

          {/* Social */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.20)', borderRadius: '10px', overflow: 'hidden' }}>
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
              padding: '13px 16px',
              background: 'rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.90)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: '10px',
              fontSize: '14px', fontWeight: 500,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.17)'; b.style.borderColor = 'rgba(255,255,255,0.35)' }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.10)'; b.style.borderColor = 'rgba(255,255,255,0.22)' }}
          >
            <Mail style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.60)', flexShrink: 0 }} />
            Se connecter avec un email
            <ArrowRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.40)', marginLeft: 'auto' }} />
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '28px', marginBottom: 0 }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'rgba(196,151,106,0.95)', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Créer un compte →
            </Link>
          </p>
        </div>
      </div>
    )
  }

  /* ── Formulaire de connexion email ────────────────────────────────────
     email_login : Google · Apple · email + password
  ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="page-glass-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto', ...font }}>
      {/* Orbe central */}
      <div style={{ position: 'fixed', top: '25%', right: '12%', width: '360px', height: '360px', background: 'var(--orb-3)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Glass card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '36px 36px 40px', zIndex: 1 }}>

        {/* Back + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <button
            onClick={() => { setScreen('welcome'); setError(''); setEmailNotVerified(false) }}
            style={{ background: 'none', border: 'none', fontSize: '13px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit', padding: 0, minWidth: 'unset', minHeight: 'unset' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
          >
            ← Retour
          </button>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BailioLogo size={24} variant="onDark" />
            <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '18px', color: 'rgba(255,255,255,0.90)', letterSpacing: '-0.02em' }}>Bailio</span>
          </Link>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '32px', color: 'rgba(255,255,255,0.95)', margin: '0 0 6px', lineHeight: 1.1 }}>
            Connexion par email
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Utilisez votre adresse email et votre mot de passe.
          </p>
        </div>

        {/* Social (rappel) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.20)', borderRadius: '10px', overflow: 'hidden' }}>
            <GoogleSignInButton onSuccess={handleGoogle} onError={setError} text="signin_with" />
          </div>
          <AppleButton onClick={handleApple} />
        </div>

        <div style={{ marginBottom: '20px' }}><Sep /></div>

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '11px 14px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: '8px', display: 'flex', gap: '8px' }}>
            <AlertCircle style={{ width: '15px', height: '15px', color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Email not verified banner */}
        {emailNotVerified && (
          <div style={{ marginBottom: '16px', padding: '14px 16px', background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.35)', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(232,185,122,0.95)', margin: '0 0 10px', fontWeight: 500 }}>
              Email non vérifié. Vérifiez votre boîte mail.
            </p>
            {resendDone ? (
              <p style={{ fontSize: '12px', color: '#4ade80', fontWeight: 500, margin: 0 }}>Email envoyé !</p>
            ) : (
              <button onClick={handleResendVerif} disabled={resendLoading}
                style={{ fontSize: '12px', color: 'rgba(196,151,106,0.95)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit', minWidth: 'unset', minHeight: 'unset' }}>
                {resendLoading ? 'Envoi…' : 'Renvoyer le lien de vérification'}
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>Mot de passe</label>
              <Link to="/forgot-password"
                style={{ fontSize: '13px', color: 'rgba(196,151,106,0.90)', textDecoration: 'none' }}
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
            className="btn-glass-primary"
            style={{
              width: '100%', padding: '14px', marginTop: '4px',
              fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              minWidth: 'unset', minHeight: 'unset',
            }}
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
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.40)', marginTop: '14px', marginBottom: 0 }}>
            Mot de passe oublié ?{' '}
            <button
              onClick={handleMagicLink}
              style={{ background: 'none', border: 'none', color: 'rgba(196,151,106,0.90)', fontWeight: 500, cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', fontFamily: 'inherit', minWidth: 'unset', minHeight: 'unset' }}
            >
              Recevoir un lien de connexion
            </button>
          </p>
        )}

        {/* Demo credentials */}
        <div style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.25)', borderRadius: '8px' }}>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: '11px', color: 'rgba(232,185,122,0.90)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 0' }}>
            Comptes de démonstration
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.80)' }}>Propriétaire :</span> owner@example.com / owner123
            </p>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.80)' }}>Locataire :</span> tenant@example.com / tenant123
            </p>
          </div>
        </div>

        {/* Create account */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '24px', marginBottom: 0 }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: 'rgba(196,151,106,0.95)', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
