import { useEffect, useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authService } from '../services/auth.service'
import { apiClient } from '../services/api.service'
import { useAuthStore } from '../store/authStore'
import { BailioLogo } from '../components/BailioLogo'
import { BAI } from '../constants/bailio-tokens'
import toast from 'react-hot-toast'

const font: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" }
const fontDisplay: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" }

/* ─── Code screen (6 digit boxes) ──────────────────────────────────────── */
const ROLE_PATHS: Record<string, string> = {
  OWNER: '/dashboard/owner',
  TENANT: '/dashboard/tenant',
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/super-admin/dashboard',
}

function CodeEntry({ email: initialEmail }: { email: string }) {
  const navigate = useNavigate()
  const { setUser, setTokens } = useAuthStore()
  const [email, setEmail] = useState(initialEmail)
  const [editingEmail, setEditingEmail] = useState(!initialEmail)
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
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BAI.bgBase, padding: '24px', ...font }}>
      <div style={{
        background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: '20px',
        padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center',
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 8px 24px rgba(13,12,10,0.07)',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '32px' }}>
          <BailioLogo size={28} />
          <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: BAI.night, letterSpacing: '-0.02em' }}>
            Bailio
          </span>
        </Link>

        {/* Icon */}
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fdf5ec', border: '1px solid #f3c99a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M4 8h24v16a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" stroke="#c4976a" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            <path d="M4 8l12 10L28 8" stroke="#c4976a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '12px' }}>
          Vérification requise
        </div>
        <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '30px', color: BAI.ink, margin: '0 0 12px', lineHeight: 1.2 }}>
          Vérifiez votre email
        </h1>
        {editingEmail ? (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: '14px', color: BAI.inkMid, lineHeight: 1.7, margin: '0 0 10px' }}>
              Entrez votre adresse email pour recevoir le code
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${BAI.border}`, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, background: '#f8f7f4', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
              autoFocus
            />
            <button
              onClick={async () => {
                if (!email.trim()) return
                setResendLoading(true)
                try {
                  await apiClient.post('/auth/resend-verification-public', { email: email.trim() })
                  setEditingEmail(false)
                  setResendDone(false)
                  toast.success('Code envoyé à ' + email.trim())
                } catch { toast.error('Email introuvable ou erreur.') }
                finally { setResendLoading(false) }
              }}
              disabled={resendLoading || !email.trim()}
              style={{ width: '100%', background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, cursor: resendLoading ? 'not-allowed' : 'pointer' }}
            >
              {resendLoading ? 'Envoi…' : 'Envoyer le code'}
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: BAI.inkMid, lineHeight: 1.7, margin: '0 0 6px' }}>
              Un code à 6 chiffres a été envoyé à
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: BAI.night, margin: '0 0 4px', wordBreak: 'break-all' }}>
              {email}
            </p>
            <button
              onClick={() => setEditingEmail(true)}
              style={{ background: 'none', border: 'none', color: BAI.caramel, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', fontFamily: 'inherit', marginBottom: 20 }}
            >
              Mauvaise adresse ? Modifier
            </button>
          </>
        )}

        {/* Code boxes — masqués si on édite l'email */}
        {!editingEmail && <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
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
                fontSize: '24px', fontWeight: 700, color: BAI.ink,
                background: '#f8f7f4',
                border: `2px solid ${codeError ? '#fca5a5' : d ? BAI.night : BAI.border}`,
                borderRadius: '10px', outline: 'none',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = BAI.night }}
              onBlur={e => { e.currentTarget.style.borderColor = codeError ? '#fca5a5' : d ? BAI.night : BAI.border }}
            />
          ))}
        </div>}

        {!editingEmail && codeError && (
          <p style={{ fontSize: '13px', color: BAI.error, margin: '0 0 16px' }}>{codeError}</p>
        )}

        {!editingEmail && (
          <button
            onClick={handleVerify}
            disabled={loading}
            style={{
              width: '100%', background: loading ? BAI.inkMid : BAI.night, color: '#fff', border: 'none',
              borderRadius: '8px', padding: '14px 32px',
              ...font, fontWeight: 600, fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2a2a4a' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = BAI.night }}
          >
            {loading ? 'Vérification…' : 'Confirmer le code'}
          </button>
        )}

        {!editingEmail && <p style={{ fontSize: '13px', color: BAI.inkFaint, margin: '0 0 8px' }}>
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
        </p>}
        <p style={{ fontSize: '13px', color: BAI.inkFaint }}>
          <button
            onClick={() => { useAuthStore.getState().clearAuth(); navigate('/login', { replace: true }) }}
            style={{ background: 'none', border: 'none', color: BAI.caramel, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', fontFamily: 'inherit' }}
          >
            Retour à la connexion
          </button>
        </p>
      </div>
    </div>
  )
}

/* ─── Token verification (legacy link-click) ────────────────────────────── */
function TokenVerification({ token }: { token: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verify = async () => {
      try {
        await authService.verifyEmail(token)
        setStatus('success')
        setMessage('Votre adresse email a été vérifiée avec succès !')
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Erreur lors de la vérification')
      }
    }
    verify()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
            <BailioLogo size={34} />
            <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.night, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Bailio
            </span>
          </Link>
        </div>
        <div className="p-8 text-center" style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: '16px', boxShadow: '0 4px 24px rgba(13,12,10,0.08)' }}>
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ background: '#f4f2ee', border: `1px solid ${BAI.border}`, borderRadius: '12px' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: BAI.night }} />
              </div>
              <h2 className="mb-3" style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.ink }}>
                Vérification en cours…
              </h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, borderRadius: '12px' }}>
                <CheckCircle className="w-8 h-8" style={{ color: BAI.tenant }} />
              </div>
              <h2 className="mb-3" style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.ink }}>Email vérifié !</h2>
              <p className="mb-6" style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid, lineHeight: '1.6' }}>{message}</p>
              <Link to="/login" className="inline-block px-8 py-2.5 transition-opacity hover:opacity-90" style={{ background: BAI.night, color: '#ffffff', borderRadius: '8px', fontFamily: BAI.fontBody, fontSize: '14px', fontWeight: 500 }}>
                Se connecter
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ background: BAI.errorLight, border: '1px solid #fca5a5', borderRadius: '12px' }}>
                <XCircle className="w-8 h-8" style={{ color: BAI.error }} />
              </div>
              <h2 className="mb-3" style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: BAI.ink }}>Erreur de vérification</h2>
              <p className="mb-6" style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid, lineHeight: '1.6' }}>{message}</p>
              <Link to="/login" className="inline-block px-8 py-2.5 transition-opacity hover:opacity-90" style={{ background: BAI.night, color: '#ffffff', borderRadius: '8px', fontFamily: BAI.fontBody, fontSize: '14px', fontWeight: 500 }}>
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Route entry point ─────────────────────────────────────────────────── */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const token = searchParams.get('token')
  const stateEmail = (location.state as { email?: string } | null)?.email

  // Legacy: ?token= in URL → auto-verify
  if (token) return <TokenVerification token={token} />

  // Redirect from Login with EMAIL_NOT_VERIFIED
  const email = stateEmail ?? ''
  return <CodeEntry email={email} />
}
