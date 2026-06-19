import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Mail, CheckCircle2, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiClient as api } from '../services/api.service'
import { BAI } from '../constants/bailio-tokens'
import { BailioLogo } from '../components/BailioLogo'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import toast from 'react-hot-toast'

/* ─── Styles partagés ────────────────────────────────────────────────────── */
const fontBody: React.CSSProperties = { fontFamily: BAI.fontBody }
const fontDisplay: React.CSSProperties = { fontFamily: BAI.fontDisplay }

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: BAI.bgInput,
    border: `1px solid ${focused ? BAI.night : BAI.border}`,
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '16px',
    color: BAI.ink,
    outline: 'none',
    fontFamily: BAI.fontBody,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
    boxShadow: focused ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
  }
}

/* ─── Panneau gauche dark — partagé entre welcome et email_login ─────────── */
const BULLETS = [
  '0€ de frais d\'agence',
  'Signature électronique eIDAS',
  'Dossier locataire en ligne',
  'Messagerie directe propriétaire',
]

function LeftPanel() {
  return (
    <div
      className="hidden md:flex"
      style={{
        width: '45%',
        background: '#0a0d1a',
        flexDirection: 'column',
        padding: '40px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glows décoratifs (sans backdrop-filter) */}
      <div style={{
        position: 'absolute', top: '-80px', left: '-80px',
        width: '360px', height: '360px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,151,106,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '40px', right: '-60px',
        width: '280px', height: '280px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,26,46,0.6) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
        <BailioLogo size={28} variant="onDark" />
        <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: '#ffffff', letterSpacing: '-0.02em' }}>
          Bailio
        </span>
      </Link>

      {/* Citation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '36px', position: 'relative', zIndex: 1 }}>
        <blockquote style={{ margin: 0 }}>
          <p style={{
            ...fontDisplay, fontStyle: 'italic', fontWeight: 400,
            fontSize: 'clamp(22px, 2.5vw, 30px)',
            color: 'rgba(255,255,255,0.92)', lineHeight: 1.4,
            margin: '0 0 8px', maxWidth: '320px',
          }}>
            "La location immobilière mérite mieux qu'une agence."
          </p>
        </blockquote>

        {/* Bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {BULLETS.map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2
                style={{ width: '18px', height: '18px', color: BAI.caramel, flexShrink: 0 }}
              />
              <span style={{ ...fontBody, fontSize: '14px', color: 'rgba(255,255,255,0.70)' }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {['12 000+ annonces', '0€ frais d\'agence', 'Signature eIDAS'].map(chip => (
          <span
            key={chip}
            style={{
              ...fontBody, fontSize: '11px', fontWeight: 600,
              padding: '5px 12px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50px',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page principale — 2 écrans
   1. welcome      → Google / "Se connecter avec un email"
   2. email_login  → Formulaire email + mot de passe
═══════════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login, verifyTotp } = useAuth()

  const prefillEmail = searchParams.get('email') ?? ''

  type Screen = 'welcome' | 'email_login' | 'totp'
  const [screen, setScreen] = useState<Screen>(prefillEmail ? 'email_login' : 'welcome')

  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRegisterHint, setShowRegisterHint] = useState(false)
  const [preAuthToken, setPreAuthToken] = useState('')
  const [totpCode, setTotpCode] = useState('')

  // Show Google OAuth errors sent back via navigation state
  useEffect(() => {
    const googleError = (location.state as { googleError?: string })?.googleError
    if (googleError) toast.error(googleError)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setError('')
    setShowRegisterHint(false)
    setIsSubmitting(true)
    try {
      const userData = await login({ email, password })
      redirectByRole(userData.role)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'TOTP_REQUIRED') {
        const token = (err as Error & { preAuthToken?: string }).preAuthToken ?? ''
        setPreAuthToken(token)
        setTotpCode('')
        setError('')
        setIsSubmitting(false)
        setScreen('totp')
        return
      }
      if (msg === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { state: { email }, replace: true })
        return
      }
      if (msg === 'Network Error' || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
        setError('Serveur inaccessible — vérifiez votre connexion ou réessayez dans quelques secondes.')
        setIsSubmitting(false)
        return
      }
      if (msg.includes('Too Many') || msg.includes('429')) {
        setError('Trop de tentatives. Réessayez dans 15 minutes.')
        setIsSubmitting(false)
        return
      }
      setError('Email ou mot de passe incorrect.')
      setShowRegisterHint(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email.trim()) { setError('Entrez votre adresse email'); return }
    try {
      await api.post('/auth/magic-link', { email: email.trim() })
      toast.success('Lien de connexion envoyé à ' + email)
    } catch {
      toast.error('Erreur lors de l\'envoi.')
    }
  }

  const handleTotpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const code = totpCode.replace(/\s/g, '')
    if (!/^\d{6}$/.test(code)) { setError('Entrez le code à 6 chiffres'); return }
    setError('')
    setIsSubmitting(true)
    try {
      const userData = await verifyTotp(preAuthToken, code)
      redirectByRole(userData.role)
    } catch {
      setError('Code incorrect ou expiré. Réessayez.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Écran TOTP (2FA) ──────────────────────────────────────────────────── */
  if (screen === 'totp') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', ...fontBody }}>
        <LeftPanel />
        <div
          style={{ background: BAI.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflowY: 'auto' }}
          className="w-full md:w-[55%]"
        >
          <button
            onClick={() => { setScreen('email_login'); setError('') }}
            style={{ position: 'absolute', top: '24px', left: '28px', background: 'none', border: 'none', fontSize: '13px', color: BAI.inkFaint, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: BAI.fontBody }}
            onMouseEnter={e => (e.currentTarget.style.color = BAI.inkMid)}
            onMouseLeave={e => (e.currentTarget.style.color = BAI.inkFaint)}
          >
            ← Retour
          </button>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%', maxWidth: '400px', padding: '72px 32px 48px' }}
          >
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} style={{ color: BAI.night }} />
              </div>
            </div>

            <div style={{ marginBottom: '28px', textAlign: 'center' }}>
              <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px, 6vw, 34px)', color: BAI.ink, margin: '0 0 8px', lineHeight: 1.1 }}>
                Double authentification
              </h1>
              <p style={{ ...fontBody, fontSize: '14px', color: BAI.inkMid, margin: 0 }}>
                Ouvrez votre application d'authentification et entrez le code à 6 chiffres.
              </p>
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '11px 14px', background: BAI.errorLight, border: '1px solid #fecaca', borderRadius: 8, display: 'flex', gap: 8 }}>
                <AlertCircle style={{ width: 15, height: 15, color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                <p style={{ ...fontBody, fontSize: 13, color: BAI.error, margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleTotpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={e => { setTotpCode(e.target.value.replace(/\D/g, '')); if (error) setError('') }}
                onFocus={() => setFocusedField('totp')}
                onBlur={() => setFocusedField('')}
                autoFocus
                disabled={isSubmitting}
                style={{ ...inputStyle(focusedField === 'totp'), textAlign: 'center', fontSize: 28, letterSpacing: '0.3em', fontWeight: 700 }}
              />
              <button
                type="submit"
                disabled={isSubmitting || totpCode.length < 6}
                style={{
                  width: '100%', padding: '14px', background: (isSubmitting || totpCode.length < 6) ? '#4a4a6a' : BAI.night,
                  color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: (isSubmitting || totpCode.length < 6) ? 'not-allowed' : 'pointer',
                  fontFamily: BAI.fontBody, minHeight: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" style={{ width: 15, height: 15 }} viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Vérification…
                  </>
                ) : 'Vérifier le code'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: BAI.inkFaint, marginTop: 20 }}>
              Google Authenticator · Authy · 1Password
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  /* ── Écran d'accueil ───────────────────────────────────────────────────── */
  if (screen === 'welcome') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', ...fontBody }}>
        <LeftPanel />

        {/* Panneau droit */}
        <div
          style={{
            background: BAI.bgBase,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          className="w-full md:w-[55%]"
        >
          <div style={{ position: 'absolute', top: '24px', left: '28px' }}>
            <Link
              to="/"
              style={{ ...fontBody, fontSize: '13px', color: BAI.inkFaint, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = BAI.inkMid)}
              onMouseLeave={e => (e.currentTarget.style.color = BAI.inkFaint)}
            >
              ← Accueil
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%', maxWidth: '400px', padding: '64px 32px 48px' }}
          >
            {/* Mobile logo */}
            <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '28px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <BailioLogo size={30} />
                <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: BAI.night, letterSpacing: '-0.02em' }}>Bailio</span>
              </Link>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px, 6vw, 38px)', color: BAI.ink, margin: '0 0 8px', lineHeight: 1.1 }}>
                Bon retour.
              </h1>
              <p style={{ ...fontBody, fontSize: '14px', color: BAI.inkMid, margin: 0 }}>
                Connectez-vous pour accéder à votre espace.
              </p>
            </div>

            <GoogleSignInButton text="signin_with" />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
              <div style={{ flex: 1, height: 1, background: BAI.border }} />
              <span style={{ ...fontBody, fontSize: 12, color: BAI.inkFaint }}>ou</span>
              <div style={{ flex: 1, height: 1, background: BAI.border }} />
            </div>

            <button
              type="button"
              onClick={() => setScreen('email_login')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '13px 16px',
                background: BAI.bgSurface,
                color: BAI.ink,
                border: `1px solid ${BAI.border}`,
                borderRadius: '10px',
                fontSize: '14px', fontWeight: 500,
                fontFamily: BAI.fontBody,
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                minHeight: '48px',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget
                b.style.background = BAI.bgMuted
                b.style.borderColor = BAI.inkFaint
              }}
              onMouseLeave={e => {
                const b = e.currentTarget
                b.style.background = BAI.bgSurface
                b.style.borderColor = BAI.border
              }}
            >
              <Mail style={{ width: '16px', height: '16px', color: BAI.inkMid, flexShrink: 0 }} />
              Continuer avec un email
            </button>

            {/* Stat chips mobile */}
            <div className="flex md:hidden" style={{ gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '24px' }}>
              {['12 000+ annonces', '0€ frais', 'Signature eIDAS'].map(chip => (
                <span
                  key={chip}
                  style={{
                    ...fontBody, fontSize: '11px', fontWeight: 600,
                    padding: '5px 12px',
                    background: 'rgba(13,12,10,0.05)',
                    border: `1px solid ${BAI.border}`,
                    borderRadius: '50px',
                    color: BAI.inkFaint,
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: '13px', color: BAI.inkFaint, marginTop: '28px', marginBottom: 0 }}>
              Pas encore de compte ?{' '}
              <Link
                to="/register"
                style={{ color: BAI.night, fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                S'inscrire →
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  /* ── Formulaire email + mot de passe ──────────────────────────────────── */
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', ...fontBody }}>
      <LeftPanel />

      {/* Panneau droit */}
      <div
        style={{
          background: BAI.bgBase,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflowY: 'auto',
        }}
        className="w-full md:w-[55%]"
      >
        <button
          onClick={() => { setScreen('welcome'); setError('') }}
          style={{
            position: 'absolute', top: '24px', left: '28px',
            background: 'none', border: 'none', fontSize: '13px',
            color: BAI.inkFaint, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontFamily: BAI.fontBody,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = BAI.inkMid)}
          onMouseLeave={e => (e.currentTarget.style.color = BAI.inkFaint)}
        >
          ← Retour
        </button>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '400px', padding: '72px 32px 48px' }}
        >
          {/* Mobile logo */}
          <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '28px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <BailioLogo size={30} />
              <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: BAI.night, letterSpacing: '-0.02em' }}>Bailio</span>
            </Link>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px, 6vw, 36px)', color: BAI.ink, margin: '0 0 6px', lineHeight: 1.1 }}>
              Connexion par email
            </h1>
            <p style={{ ...fontBody, fontSize: '14px', color: BAI.inkMid, margin: 0 }}>
              Utilisez votre adresse email et votre mot de passe.
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                padding: '11px 14px',
                background: BAI.errorLight,
                border: `1px solid #fecaca`,
                borderRadius: '8px',
                display: 'flex', gap: '8px',
              }}>
                <AlertCircle style={{ width: '15px', height: '15px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ ...fontBody, fontSize: '13px', color: BAI.error, margin: 0 }}>{error}</p>
              </div>
              {showRegisterHint && (
                <div style={{
                  marginTop: '10px', padding: '12px 14px',
                  background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                  borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}>
                  <p style={{ ...fontBody, fontSize: '13px', color: BAI.inkMid, margin: 0 }}>Pas encore de compte ?</p>
                  <Link
                    to={`/register?email=${encodeURIComponent(email)}`}
                    style={{
                      ...fontBody, fontSize: '13px', fontWeight: 700, color: BAI.night,
                      textDecoration: 'none', whiteSpace: 'nowrap',
                      border: `1px solid ${BAI.night}`, padding: '5px 12px', borderRadius: 7, transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BAI.night; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = BAI.night }}
                  >
                    Créer un compte →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ ...fontBody, fontSize: '13px', fontWeight: 500, color: BAI.ink, display: 'block', marginBottom: '6px' }}>
                Adresse email
              </label>
              <input
                type="email" placeholder="votre@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) setError('') }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                required disabled={isSubmitting}
                style={inputStyle(focusedField === 'email')}
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ ...fontBody, fontSize: '13px', fontWeight: 500, color: BAI.ink }}>Mot de passe</label>
                <Link
                  to="/forgot-password"
                  style={{ ...fontBody, fontSize: '13px', color: BAI.caramel, textDecoration: 'none' }}
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
                required disabled={isSubmitting}
                style={inputStyle(focusedField === 'password')}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit" disabled={isSubmitting}
              style={{
                width: '100%', padding: '14px', marginTop: '4px',
                background: isSubmitting ? '#4a4a6a' : BAI.night,
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: BAI.fontBody, transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                minHeight: '48px',
              }}
              onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a4a' }}
              onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = BAI.night }}
            >
              {isSubmitting ? (
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

          {/* Magic link */}
          {email.trim() && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: BAI.inkFaint, marginTop: '14px', marginBottom: 0 }}>
              Mot de passe oublié ?{' '}
              <button
                onClick={handleMagicLink}
                style={{
                  background: 'none', border: 'none', color: BAI.caramel,
                  fontWeight: 500, cursor: 'pointer', fontSize: '12px',
                  textDecoration: 'underline', fontFamily: BAI.fontBody,
                }}
              >
                Recevoir un lien de connexion
              </button>
            </p>
          )}

          {/* Lien inscription */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: BAI.inkFaint, marginTop: '24px', marginBottom: 0 }}>
            Pas encore de compte ?{' '}
            <Link
              to="/register"
              style={{ color: BAI.night, fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Créer un compte
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
