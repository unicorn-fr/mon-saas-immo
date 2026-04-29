import { useState, FormEvent, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, ArrowRight, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/api.service'
import { celebrateBig } from '../utils/celebrate'
import { BailioLogo } from '../components/BailioLogo'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import toast from 'react-hot-toast'

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const font: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" }
const fontDisplay: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" }

const inputBase: React.CSSProperties = {
  width: '100%',
  background: '#f8f7f4',
  border: '1px solid #e4e1db',
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '16px', /* prevents iOS auto-zoom */
  color: '#0d0c0a',
  outline: 'none',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
}

function inp(focused: boolean): React.CSSProperties {
  return {
    ...inputBase,
    borderColor: focused ? '#1a1a2e' : '#e4e1db',
    boxShadow: focused ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
  }
}


/* ─── VerifyCodeScreen ───────────────────────────────────────────────────── */
function VerifyCodeScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleDigit = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    setCodeError('')
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKey = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...digits]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    const code = digits.join('')
    if (code.length !== 6) { setCodeError('Entrez les 6 chiffres du code'); return }
    setLoading(true)
    setCodeError('')
    try {
      await apiClient.post('/auth/verify-email-code', { email, code })
      toast.success('Email vérifié ! Bienvenue sur Bailio.')
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Code invalide'
        : 'Code invalide'
      setCodeError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await apiClient.post('/auth/resend-verification-public', { email })
      setResendDone(true)
      toast.success('Nouveau code envoyé !')
    } catch { toast.error('Erreur lors du renvoi.') }
    finally { setResendLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8', padding: '24px', ...font }}>
      <div style={{
        background: '#ffffff', border: '1px solid #e4e1db', borderRadius: '20px',
        padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center',
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 8px 24px rgba(13,12,10,0.07)',
      }}>
        {/* Icon */}
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fdf5ec', border: '1px solid #f3c99a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 8h24v16a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" stroke="#c4976a" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            <path d="M4 8l12 10L28 8" stroke="#c4976a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: '12px' }}>
          Vérification requise
        </div>
        <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '32px', color: '#0d0c0a', margin: '0 0 12px', lineHeight: 1.2 }}>
          Vérifiez votre email
        </h1>
        <p style={{ fontSize: '14px', color: '#5a5754', lineHeight: 1.7, margin: '0 0 6px' }}>
          Un code à 6 chiffres a été envoyé à
        </p>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 28px', wordBreak: 'break-all' }}>
          {email}
        </p>

        {/* Code boxes */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              onPaste={handlePaste}
              style={{
                width: '48px', height: '56px', textAlign: 'center',
                fontSize: '24px', fontWeight: 700, color: '#0d0c0a',
                background: '#f8f7f4',
                border: `2px solid ${codeError ? '#fca5a5' : d ? '#1a1a2e' : '#e4e1db'}`,
                borderRadius: '10px', outline: 'none',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#1a1a2e' }}
              onBlur={e => { e.currentTarget.style.borderColor = codeError ? '#fca5a5' : d ? '#1a1a2e' : '#e4e1db' }}
            />
          ))}
        </div>

        {codeError && (
          <p style={{ fontSize: '13px', color: '#9b1c1c', margin: '0 0 16px' }}>{codeError}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            width: '100%', background: loading ? '#5a5754' : '#1a1a2e', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '14px 32px',
            ...font, fontWeight: 600, fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2a2a4a' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1a1a2e' }}
        >
          {loading ? 'Vérification…' : 'Confirmer le code'}
        </button>

        <p style={{ fontSize: '13px', color: '#9e9b96', margin: '0 0 8px' }}>
          Code non reçu ?{' '}
          {resendDone ? (
            <span style={{ color: '#1b5e3b', fontWeight: 500 }}>Envoyé !</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              style={{ background: 'none', border: 'none', color: '#c4976a', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', fontFamily: 'inherit' }}
            >
              {resendLoading ? 'Envoi…' : 'Renvoyer le code'}
            </button>
          )}
        </p>
        <p style={{ fontSize: '13px', color: '#9e9b96' }}>
          Mauvaise adresse ?{' '}
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: '#c4976a', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', fontFamily: 'inherit' }}
          >
            Modifier l'email
          </button>
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page Register — 3 écrans
   1. welcome     → Landing: Google / Apple / "Créer un compte avec un email"
   2. form        → Formulaire complet + tagline
   3. verify_code → Saisie du code à 6 chiffres
═══════════════════════════════════════════════════════════════════════════ */
export default function Register() {
  const { register, googleLogin, isLoading } = useAuth()
  const navigate = useNavigate()

  type Screen = 'welcome' | 'form' | 'verify_code'
  const [screen, setScreen] = useState<Screen>('welcome')

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
  })
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState<Record<string, boolean>>({})

  const onFocus = (n: string) => setFocused(p => ({ ...p, [n]: true }))
  const onBlur = (n: string) => setFocused(p => ({ ...p, [n]: false }))

  const passwordChecks = [
    { text: '8 caractères min.', met: formData.password.length >= 8 },
    { text: 'Majuscule', met: /[A-Z]/.test(formData.password) },
    { text: 'Minuscule', met: /[a-z]/.test(formData.password) },
    { text: 'Chiffre', met: /[0-9]/.test(formData.password) },
  ]

  const validatePassword = (p: string) =>
    p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      const { user: u } = await googleLogin(idToken)
      const paths: Record<string, string> = {
        OWNER: '/dashboard/owner', TENANT: '/dashboard/tenant',
        SUPER_ADMIN: '/super-admin', ADMIN: '/admin',
      }
      navigate(paths[u.role] ?? '/', { replace: true })
    } catch {
      toast.error('Inscription Google échouée.')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs'); return
    }
    if (!validatePassword(formData.password)) {
      setError('Le mot de passe ne respecte pas les critères de sécurité'); return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas'); return
    }
    try {
      const prefix = formData.email.split('@')[0] || 'utilisateur'
      await register({
        email: formData.email,
        password: formData.password,
        firstName: prefix,
        lastName: prefix,
        role: 'TENANT',
      })
      celebrateBig()
      setRegisteredEmail(formData.email)
      setScreen('verify_code')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Échec de l\'inscription. Veuillez réessayer.'
      setError(msg)
      toast.error(msg, { duration: 5000 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  /* ── Écran saisie du code ─────────────────────────────────────────────── */
  if (screen === 'verify_code') {
    return <VerifyCodeScreen email={registeredEmail} onBack={() => { setScreen('form'); setRegisteredEmail('') }} />
  }

  /* ── Écran d'accueil ──────────────────────────────────────────────────
     Landing inscription : split panel caramel + droite auth
  ─────────────────────────────────────────────────────────────────────── */
  if (screen === 'welcome') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', ...font }}>

        {/* ── Panneau gauche ──────────────────────────────────────────── */}
        <div
          className="hidden md:flex"
          style={{ width: '44%', background: '#c4976a', flexDirection: 'column', padding: '40px 48px', position: 'relative' }}
        >
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BailioLogo size={28} />
            <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: '#1a1a2e', letterSpacing: '-0.02em' }}>
              Bailio
            </span>
          </Link>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '32px' }}>
            <div>
              <p style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: '30px', color: '#1a1a2e', margin: '0 0 8px', lineHeight: 1.3, maxWidth: '300px' }}>
                "Ensemble, nous trouvons ta maison idéale."
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.6)', margin: 0 }}>
                La location entre particuliers, sans intermédiaire.
              </p>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {['Zéro frais d\'agence', 'Documents sécurisés & anti-fraude', 'Contrats électroniques ALUR', 'Dossier locataire intelligent'].map(b => (
                <li key={b} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1.5 5.5l2.5 2.5 5-5" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: 400 }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.55)', margin: 0 }}>
            Déjà inscrit ?{' '}
            <Link to="/login" style={{ color: '#1a1a2e', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Se connecter
            </Link>
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
                Créer un compte
              </h1>
              <p style={{ fontSize: '14px', color: '#5a5754', margin: 0 }}>
                Rejoignez la plateforme en quelques minutes.
              </p>
            </div>

            {/* Google */}
            <GoogleSignInButton onSuccess={handleGoogleSuccess} text="signup_with" />

            {/* Séparateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e4e1db' }} />
              <span style={{ fontSize: 12, color: '#9e9b96' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: '#e4e1db' }} />
            </div>

            {/* Email CTA */}
            <button
              type="button"
              onClick={() => setScreen('form')}
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
              <UserPlus style={{ width: '16px', height: '16px', color: '#5a5754', flexShrink: 0 }} />
              Créer un compte avec un email
              <ArrowRight style={{ width: '14px', height: '14px', color: '#9e9b96', marginLeft: 'auto' }} />
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#9e9b96', marginTop: '28px', marginBottom: 0 }}>
              Vous avez déjà un compte ?{' '}
              <Link to="/login" style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                Se connecter →
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Formulaire d'inscription ─────────────────────────────────────────
     form : panneau gauche caramel + formulaire complet
  ─────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', ...font }}>

      {/* ── Panneau gauche ────────────────────────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{ width: '44%', background: '#c4976a', flexDirection: 'column', padding: '40px 48px', position: 'relative' }}
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <BailioLogo size={28} />
          <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: '#1a1a2e', letterSpacing: '-0.02em' }}>
            Bailio
          </span>
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '32px' }}>
          <div>
            <p style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: '30px', color: '#1a1a2e', margin: '0 0 8px', lineHeight: 1.3, maxWidth: '300px' }}>
              "Ensemble, nous trouvons ta maison idéale."
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.6)', margin: 0 }}>
              La location entre particuliers, sans intermédiaire.
            </p>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {['Zéro frais d\'agence', 'Documents sécurisés & anti-fraude', 'Contrats électroniques ALUR', 'Dossier locataire intelligent'].map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 5.5l2.5 2.5 5-5" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: 400 }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(26,26,46,0.55)', margin: 0 }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: '#1a1a2e', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            Se connecter
          </Link>
        </p>
      </div>

      {/* ── Panneau droit ─────────────────────────────────────────────── */}
      <div
        style={{ background: '#ffffff', overflowY: 'auto', display: 'flex', justifyContent: 'center', position: 'relative' }}
        className="w-full md:w-[56%]"
      >
        {/* Back button */}
        <button
          onClick={() => { setScreen('welcome'); setError('') }}
          style={{ position: 'absolute', top: '28px', left: '32px', background: 'none', border: 'none', fontSize: '13px', color: '#9e9b96', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}
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
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '34px', color: '#0d0c0a', margin: '0 0 6px', lineHeight: 1.1 }}>
              Créer votre compte
            </h1>
            <p style={{ fontSize: '14px', color: '#5a5754', margin: 0 }}>
              Rejoignez la plateforme en quelques minutes.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '18px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Email */}
            <div>
              <label style={{ ...font, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>Adresse email</label>
              <input id="email" name="email" type="email" placeholder="votre@email.com"
                value={formData.email} onChange={handleChange}
                onFocus={() => onFocus('email')} onBlur={() => onBlur('email')}
                disabled={isLoading} required style={inp(focused['email'])}
                autoComplete="email" />
            </div>

            {/* Password */}
            <div>
              <label style={{ ...font, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
              <input id="password" name="password" type="password" placeholder="••••••••"
                value={formData.password} onChange={handleChange}
                onFocus={() => onFocus('password')} onBlur={() => onBlur('password')}
                disabled={isLoading} required style={inp(focused['password'])}
                autoComplete="new-password" />
              {formData.password.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '10px' }}>
                  {passwordChecks.map(c => (
                    <div key={c.text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {c.met ? (
                        <CheckCircle style={{ width: '12px', height: '12px', color: '#16a34a', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid #d1d5db', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '11px', color: c.met ? '#16a34a' : '#9e9b96' }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ ...font, fontWeight: 500, fontSize: '13px', color: '#0d0c0a', display: 'block', marginBottom: '6px' }}>Confirmer le mot de passe</label>
              <input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••"
                value={formData.confirmPassword} onChange={handleChange}
                onFocus={() => onFocus('confirmPassword')} onBlur={() => onBlur('confirmPassword')}
                disabled={isLoading} required
                style={{
                  ...inp(focused['confirmPassword']),
                  borderColor: formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password
                    ? '#fca5a5'
                    : focused['confirmPassword'] ? '#1a1a2e' : '#e4e1db',
                }}
                autoComplete="new-password" />
              {formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password && (
                <p style={{ fontSize: '11px', color: '#dc2626', margin: '5px 0 0' }}>Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={isLoading}
              style={{
                width: '100%', background: isLoading ? '#4a4a6a' : '#1a1a2e',
                color: '#ffffff', border: 'none', borderRadius: '8px', padding: '14px 0',
                ...font, fontWeight: 600, fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '4px',
                transition: 'background 0.15s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
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
                  Inscription en cours…
                </>
              ) : 'Continuer'}
            </button>
          </form>

          <p style={{ ...font, textAlign: 'center', fontSize: '13px', color: '#5a5754', marginTop: '22px', marginBottom: 0 }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#0d0c0a', fontWeight: 500, textDecoration: 'underline', textDecorationColor: '#c4976a', textUnderlineOffset: '2px' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
