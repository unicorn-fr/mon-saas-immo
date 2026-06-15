import { useState, FormEvent, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, CheckCircle2, Home, Key } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../services/api.service'
import { celebrateBig } from '../utils/celebrate'
import { BAI } from '../constants/bailio-tokens'
import { BailioLogo } from '../components/BailioLogo'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import toast from 'react-hot-toast'

const ROLE_PATHS: Record<string, string> = {
  OWNER: '/dashboard/owner',
  TENANT: '/dashboard/tenant',
  ADMIN: '/admin',
  SUPER_ADMIN: '/super-admin/dashboard',
}

/* ─── Styles partagés ────────────────────────────────────────────────────── */
const fontBody: React.CSSProperties = { fontFamily: BAI.fontBody }
const fontDisplay: React.CSSProperties = { fontFamily: BAI.fontDisplay }

function inputStyle(focused: boolean, error?: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: BAI.bgInput,
    border: `1px solid ${error ? '#fca5a5' : focused ? BAI.night : BAI.border}`,
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '16px',
    color: BAI.ink,
    outline: 'none',
    fontFamily: BAI.fontBody,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
    boxShadow: focused && !error ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
  }
}

/* ─── Panneau gauche dark ────────────────────────────────────────────────── */
const BULLETS = [
  'Zéro frais d\'agence',
  'Documents sécurisés & anti-fraude',
  'Contrats électroniques ALUR',
  'Dossier locataire intelligent',
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
      {/* Glows */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,151,106,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '60px', left: '-40px',
        width: '240px', height: '240px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,26,46,0.7) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
        <BailioLogo size={28} variant="onDark" />
        <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: '#ffffff', letterSpacing: '-0.02em' }}>
          Bailio
        </span>
      </Link>

      {/* Contenu central */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '32px', position: 'relative', zIndex: 1 }}>
        <div>
          <p style={{
            ...fontDisplay, fontStyle: 'italic', fontWeight: 400,
            fontSize: 'clamp(22px, 2.5vw, 30px)',
            color: 'rgba(255,255,255,0.92)', lineHeight: 1.4,
            margin: '0 0 8px', maxWidth: '300px',
          }}>
            "Commencez gratuitement."
          </p>
          <p style={{ ...fontBody, fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            La location entre particuliers, sans intermédiaire.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {BULLETS.map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2
                style={{ width: '18px', height: '18px', color: BAI.caramel, flexShrink: 0 }}
              />
              <span style={{ ...fontBody, fontSize: '14px', color: 'rgba(255,255,255,0.68)' }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ ...fontBody, fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0, position: 'relative', zIndex: 1 }}>
        Déjà inscrit ?{' '}
        <Link to="/login" style={{ color: BAI.caramel, fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          Se connecter
        </Link>
      </p>
    </div>
  )
}

/* ─── VerifyCodeScreen ───────────────────────────────────────────────────── */
function VerifyCodeScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate()
  const { setUser, setTokens } = useAuthStore()
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
      const res = await apiClient.post('/auth/verify-email-code', { email, code })
      const { user, accessToken, refreshToken } = res.data.data
      setTokens(accessToken, refreshToken)
      setUser(user)
      celebrateBig()
      toast.success('Email vérifié ! Bienvenue sur Bailio.')
      navigate(ROLE_PATHS[user.role] ?? '/', { replace: true })
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
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BAI.bgBase, padding: '24px', ...fontBody }}>
      <div style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '440px', width: '100%', textAlign: 'center',
        boxShadow: BAI.shadowLg,
      }}>
        {/* Icon */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: BAI.caramelLight, border: `1px solid ${BAI.caramelBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 8h24v16a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" stroke={BAI.caramel} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            <path d="M4 8l12 10L28 8" stroke={BAI.caramel} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ ...fontBody, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '12px' }}>
          Vérification requise
        </div>
        <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '32px', color: BAI.ink, margin: '0 0 12px', lineHeight: 1.2 }}>
          Vérifiez votre email
        </h1>
        <p style={{ ...fontBody, fontSize: '14px', color: BAI.inkMid, lineHeight: 1.7, margin: '0 0 6px' }}>
          Un code à 6 chiffres a été envoyé à
        </p>
        <p style={{ ...fontBody, fontSize: '14px', fontWeight: 600, color: BAI.night, margin: '0 0 28px', wordBreak: 'break-all' }}>
          {email}
        </p>

        {/* Boxes code */}
        <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 10px)', justifyContent: 'center', marginBottom: '20px' }}>
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
                width: 'clamp(38px, 10vw, 48px)', height: 'clamp(44px, 12vw, 56px)', textAlign: 'center',
                fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 700, color: BAI.ink,
                background: BAI.bgInput,
                border: `2px solid ${codeError ? '#fca5a5' : d ? BAI.night : BAI.border}`,
                borderRadius: '10px', outline: 'none',
                fontFamily: BAI.fontBody,
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = BAI.night }}
              onBlur={e => { e.currentTarget.style.borderColor = codeError ? '#fca5a5' : d ? BAI.night : BAI.border }}
            />
          ))}
        </div>

        {codeError && (
          <p style={{ ...fontBody, fontSize: '13px', color: BAI.error, margin: '0 0 16px' }}>{codeError}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            width: '100%', background: loading ? '#5a5754' : BAI.night,
            color: '#fff', border: 'none', borderRadius: '8px', padding: '14px 32px',
            ...fontBody, fontWeight: 600, fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px', transition: 'background 0.15s',
            minHeight: '48px',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2a2a4a' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = BAI.night }}
        >
          {loading ? 'Vérification…' : 'Confirmer le code'}
        </button>

        <p style={{ ...fontBody, fontSize: '13px', color: BAI.inkFaint, margin: '0 0 8px' }}>
          Code non reçu ?{' '}
          {resendDone ? (
            <span style={{ color: BAI.tenant, fontWeight: 500 }}>Envoyé !</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              style={{ background: 'none', border: 'none', color: BAI.caramel, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', fontFamily: 'inherit' }}
            >
              {resendLoading ? 'Envoi…' : 'Renvoyer le code'}
            </button>
          )}
        </p>
        <p style={{ ...fontBody, fontSize: '13px', color: BAI.inkFaint }}>
          Mauvaise adresse ?{' '}
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: BAI.caramel, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', fontFamily: 'inherit' }}
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
   1. welcome     → Choix rôle + Google
   2. form        → Formulaire complet
   3. verify_code → Code 6 chiffres
═══════════════════════════════════════════════════════════════════════════ */
export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillEmail = searchParams.get('email') ?? ''
  const prefillRole = (searchParams.get('role') ?? '') as 'OWNER' | 'TENANT' | ''
  const { register } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  type Screen = 'welcome' | 'method' | 'form' | 'verify_code' | 'waitlist'
  const [screen, setScreen] = useState<Screen>(prefillRole ? 'form' : 'welcome')

  const [formData, setFormData] = useState({
    email: prefillEmail, password: '', confirmPassword: '',
    firstName: '', lastName: '', role: prefillRole,
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Veuillez remplir tous les champs'); return
    }
    if (!formData.role) {
      setError('Veuillez choisir votre profil (locataire ou propriétaire)'); return
    }
    if (!validatePassword(formData.password)) {
      setError('Le mot de passe ne respecte pas les critères de sécurité'); return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas'); return
    }
    setIsSubmitting(true)
    try {
      const { emailVerified } = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
      })
      if (emailVerified) {
        toast.success('Compte créé ! Connectez-vous maintenant.')
        navigate(`/login?email=${encodeURIComponent(formData.email)}`, { replace: true })
        return
      }
      setRegisteredEmail(formData.email)
      setScreen('verify_code')
    } catch (err) {
      const code = (err as { code?: string })?.code
      if (code === 'REGISTRATIONS_CLOSED') {
        setScreen('waitlist')
        return
      }
      const msg = err instanceof Error ? err.message : 'Échec de l\'inscription. Veuillez réessayer.'
      setError(msg)
      toast.error(msg, { duration: 5000 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Waitlist ──────────────────────────────────────────────────────────── */
  if (screen === 'waitlist') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BAI.bgBase, padding: '24px', ...fontBody }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '32px' }}>
            <BailioLogo size={36} />
          </Link>
          <div style={{ background: BAI.caramelLight, border: `1px solid ${BAI.caramelBorder}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: BAI.warning, fontWeight: 500 }}>
            Bailio est en accès anticipé
          </div>
          <h1 style={{ ...fontDisplay, fontSize: '32px', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, marginBottom: '12px' }}>
            Rejoignez la liste d'attente
          </h1>
          <p style={{ ...fontBody, fontSize: '14px', color: BAI.inkMid, marginBottom: '32px', lineHeight: 1.6 }}>
            Bailio ouvre progressivement. Laissez-nous votre email et nous vous préviendrons dès que votre accès est disponible.
          </p>
          <a
            href="mailto:contact@bailio.fr?subject=Liste d'attente Bailio"
            style={{
              display: 'inline-block', background: BAI.night, color: '#ffffff',
              borderRadius: '8px', padding: '12px 28px', fontSize: '14px',
              fontWeight: 600, textDecoration: 'none', marginBottom: '16px',
            }}
          >
            M'inscrire sur la liste d'attente
          </a>
          <p style={{ ...fontBody, fontSize: '13px', color: BAI.inkFaint }}>
            <Link to="/" style={{ color: BAI.caramel, textDecoration: 'none' }}>← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    )
  }

  /* ── Verify code ───────────────────────────────────────────────────────── */
  if (screen === 'verify_code') {
    return <VerifyCodeScreen email={registeredEmail} onBack={() => { setScreen('form'); setRegisteredEmail('') }} />
  }

  /* ── Écran 1 — Choix du rôle ─────────────────────────────────────────── */
  if (screen === 'welcome') {
    const roleOptions = [
      {
        value: 'TENANT' as const,
        label: 'Locataire',
        desc: 'Je cherche un logement à louer',
        icon: <Home style={{ width: '26px', height: '26px', color: BAI.tenant }} />,
        iconBg: BAI.tenantLight,
        border: BAI.tenantBorder,
        accent: BAI.tenant,
      },
      {
        value: 'OWNER' as const,
        label: 'Propriétaire',
        desc: 'Je souhaite louer mon bien',
        icon: <Key style={{ width: '26px', height: '26px', color: BAI.owner }} />,
        iconBg: BAI.ownerLight,
        border: BAI.ownerBorder,
        accent: BAI.owner,
      },
    ]

    return (
      <div style={{ minHeight: '100dvh', display: 'flex', ...fontBody }}>
        <LeftPanel />

        <div
          style={{ background: BAI.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          className="w-full md:w-[55%]"
        >
          <div style={{ position: 'absolute', top: '24px', left: '28px' }}>
            <Link to="/" style={{ ...fontBody, fontSize: '13px', color: BAI.inkFaint, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = BAI.inkMid)}
              onMouseLeave={e => (e.currentTarget.style.color = BAI.inkFaint)}>
              ← Accueil
            </Link>
          </div>

          <div style={{ width: '100%', maxWidth: '420px', padding: '64px 32px 48px' }}>
            <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '28px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <BailioLogo size={30} />
                <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: BAI.night }}>Bailio</span>
              </Link>
            </div>

            <div style={{ marginBottom: '36px' }}>
              <p style={{ ...fontBody, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
                Étape 1 sur 2
              </p>
              <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px, 6vw, 36px)', color: BAI.ink, margin: '0 0 8px', lineHeight: 1.1 }}>
                Vous êtes…
              </h1>
              <p style={{ ...fontBody, fontSize: '14px', color: BAI.inkMid, margin: 0 }}>
                Choisissez votre profil pour commencer.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              {roleOptions.map((opt, i) => (
                <motion.button
                  key={opt.value}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.28 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setFormData(p => ({ ...p, role: opt.value }))
                    setScreen('method')
                  }}
                  style={{
                    padding: '28px 16px 20px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: `1.5px solid ${BAI.border}`,
                    background: BAI.bgSurface,
                    fontFamily: BAI.fontBody,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                    transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.18s',
                    boxShadow: BAI.shadowSm,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = opt.accent
                    el.style.boxShadow = `0 4px 20px ${opt.iconBg}`
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = BAI.border
                    el.style.boxShadow = BAI.shadowSm
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: opt.iconBg, border: `1px solid ${opt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {opt.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: BAI.ink, marginBottom: 4 }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: BAI.inkFaint, lineHeight: 1.4 }}>{opt.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: '13px', color: BAI.inkFaint }}>
              Vous avez déjà un compte ?{' '}
              <Link to="/login" style={{ color: BAI.night, fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                Se connecter →
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Écran 2 — Choisir la méthode (Google ou email) ───────────────────── */
  if (screen === 'method') {
    const isOwner = formData.role === 'OWNER'
    const roleLabel = isOwner ? 'Propriétaire' : 'Locataire'
    const roleColor = isOwner ? BAI.owner : BAI.tenant
    const roleBg = isOwner ? BAI.ownerLight : BAI.tenantLight

    return (
      <div style={{ minHeight: '100dvh', display: 'flex', ...fontBody }}>
        <LeftPanel />

        <div
          style={{ background: BAI.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          className="w-full md:w-[55%]"
        >
          <button
            onClick={() => setScreen('welcome')}
            style={{ position: 'absolute', top: '28px', left: '32px', background: 'none', border: 'none', fontSize: '13px', color: BAI.inkFaint, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: BAI.fontBody }}
            onMouseEnter={e => (e.currentTarget.style.color = BAI.inkMid)}
            onMouseLeave={e => (e.currentTarget.style.color = BAI.inkFaint)}
          >
            ← Retour
          </button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ width: '100%', maxWidth: '400px', padding: '72px 32px 48px' }}
          >
            <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '28px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <BailioLogo size={30} />
                <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: BAI.night }}>Bailio</span>
              </Link>
            </div>

            {/* Badge rôle sélectionné */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ ...fontBody, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
                Étape 2 sur 2
              </p>
              <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px, 5vw, 34px)', color: BAI.ink, margin: '0 0 12px', lineHeight: 1.1 }}>
                Créer mon compte
              </h1>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: roleBg, border: `1px solid ${isOwner ? BAI.ownerBorder : BAI.tenantBorder}`, borderRadius: 8, padding: '6px 12px' }}>
                <span style={{ ...fontBody, fontSize: '13px', fontWeight: 600, color: roleColor }}>{roleLabel}</span>
                <button
                  onClick={() => setScreen('welcome')}
                  style={{ ...fontBody, fontSize: '11px', color: BAI.inkFaint, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Modifier
                </button>
              </div>
            </div>

            {/* Google */}
            <div style={{ marginBottom: '16px' }}>
              <GoogleSignInButton
                text="signup_with"
                role={formData.role as 'OWNER' | 'TENANT'}
              />
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: BAI.border }} />
              <span style={{ ...fontBody, fontSize: '12px', color: BAI.inkFaint, whiteSpace: 'nowrap' }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: BAI.border }} />
            </div>

            {/* Email/form */}
            <button
              type="button"
              onClick={() => setScreen('form')}
              style={{
                width: '100%', background: BAI.bgSurface, color: BAI.ink,
                border: `1.5px solid ${BAI.border}`, borderRadius: '8px', padding: '13px 0',
                ...fontBody, fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s', minHeight: '48px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BAI.night; (e.currentTarget as HTMLButtonElement).style.background = BAI.bgMuted }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BAI.border; (e.currentTarget as HTMLButtonElement).style.background = BAI.bgSurface }}
            >
              Continuer avec mon email
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: BAI.inkFaint, marginTop: '20px' }}>
              Vous avez déjà un compte ?{' '}
              <Link to="/login" style={{ color: BAI.night, fontWeight: 600, textDecoration: 'none' }}>
                Se connecter →
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  /* ── Formulaire d'inscription ──────────────────────────────────────────── */
  const stepLabels = ['Profil', 'Informations', 'Mot de passe']
  const currentStep = 1 // toujours step 1 dans ce contexte (form = étape 2 sur 3 conceptuellement)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', ...fontBody }}>
      <LeftPanel />

      {/* Panneau droit */}
      <div
        style={{
          background: BAI.bgBase,
          overflowY: 'auto', display: 'flex', justifyContent: 'center', position: 'relative',
        }}
        className="w-full md:w-[55%]"
      >
        <button
          onClick={() => { setScreen('welcome'); setError('') }}
          style={{
            position: 'absolute', top: '28px', left: '32px',
            background: 'none', border: 'none', fontSize: '13px', color: BAI.inkFaint,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: BAI.fontBody,
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

          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '28px' }}>
            {stepLabels.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentStep ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '50px',
                  background: idx === currentStep ? BAI.caramel : idx < currentStep ? BAI.caramel : BAI.border,
                  transition: 'all 0.2s ease',
                  opacity: idx > currentStep ? 0.4 : 1,
                }}
              />
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px, 5vw, 34px)', color: BAI.ink, margin: '0 0 6px', lineHeight: 1.1 }}>
              Compte {formData.role === 'OWNER' ? 'propriétaire' : 'locataire'}
            </h1>
            <p style={{ ...fontBody, fontSize: '14px', color: BAI.inkMid, margin: 0 }}>
              Rejoignez la plateforme en quelques minutes.
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: '18px', padding: '12px 14px',
              background: BAI.errorLight, border: '1px solid #fecaca',
              borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px',
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ ...fontBody, fontSize: '13px', color: BAI.error, margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Prénom + Nom */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '10px' }}>
              <div>
                <label style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: BAI.ink, display: 'block', marginBottom: '6px' }}>Prénom</label>
                <input id="firstName" name="firstName" type="text" placeholder="Jean"
                  value={formData.firstName} onChange={handleChange}
                  onFocus={() => onFocus('firstName')} onBlur={() => onBlur('firstName')}
                  disabled={isSubmitting} required style={inputStyle(focused['firstName'])}
                  autoComplete="given-name" />
              </div>
              <div>
                <label style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: BAI.ink, display: 'block', marginBottom: '6px' }}>Nom</label>
                <input id="lastName" name="lastName" type="text" placeholder="Dupont"
                  value={formData.lastName} onChange={handleChange}
                  onFocus={() => onFocus('lastName')} onBlur={() => onBlur('lastName')}
                  disabled={isSubmitting} required style={inputStyle(focused['lastName'])}
                  autoComplete="family-name" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: BAI.ink, display: 'block', marginBottom: '6px' }}>Adresse email</label>
              <input id="email" name="email" type="email" placeholder="votre@email.com"
                value={formData.email} onChange={handleChange}
                onFocus={() => onFocus('email')} onBlur={() => onBlur('email')}
                disabled={isSubmitting} required style={inputStyle(focused['email'])}
                autoComplete="email" />
            </div>

            {/* Mot de passe */}
            <div>
              <label style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: BAI.ink, display: 'block', marginBottom: '6px' }}>Mot de passe</label>
              <input id="password" name="password" type="password" placeholder="••••••••"
                value={formData.password} onChange={handleChange}
                onFocus={() => onFocus('password')} onBlur={() => onBlur('password')}
                disabled={isSubmitting} required style={inputStyle(focused['password'])}
                autoComplete="new-password" />
              {formData.password.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '10px' }}>
                  {passwordChecks.map(c => (
                    <div key={c.text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {c.met ? (
                        <CheckCircle style={{ width: '12px', height: '12px', color: BAI.success, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: `1.5px solid ${BAI.border}`, flexShrink: 0 }} />
                      )}
                      <span style={{ ...fontBody, fontSize: '11px', color: c.met ? BAI.success : BAI.inkFaint }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label style={{ ...fontBody, fontWeight: 500, fontSize: '13px', color: BAI.ink, display: 'block', marginBottom: '6px' }}>Confirmer le mot de passe</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••"
                value={formData.confirmPassword} onChange={handleChange}
                onFocus={() => onFocus('confirmPassword')} onBlur={() => onBlur('confirmPassword')}
                disabled={isSubmitting} required
                style={inputStyle(
                  focused['confirmPassword'],
                  formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password
                )}
                autoComplete="new-password" />
              {formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password && (
                <p style={{ ...fontBody, fontSize: '11px', color: '#dc2626', margin: '5px 0 0' }}>Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            {/* Bouton submit */}
            <button
              type="submit" disabled={isSubmitting}
              style={{
                width: '100%',
                background: isSubmitting ? '#4a4a6a' : BAI.night,
                color: '#ffffff', border: 'none', borderRadius: '8px', padding: '14px 0',
                ...fontBody, fontWeight: 600, fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '4px',
                transition: 'background 0.15s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', minHeight: '48px',
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
                  Inscription en cours…
                </>
              ) : 'Créer mon compte'}
            </button>
          </form>

          <p style={{ ...fontBody, textAlign: 'center', fontSize: '13px', color: BAI.inkMid, marginTop: '22px', marginBottom: 0 }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: BAI.ink, fontWeight: 500, textDecoration: 'underline', textDecorationColor: BAI.caramel, textUnderlineOffset: '2px' }}>
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
