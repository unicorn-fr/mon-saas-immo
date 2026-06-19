import { useState, useEffect } from 'react'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { BAI } from '../../constants/bailio-tokens'
import toast from 'react-hot-toast'

interface AuthGateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Message contextuel affiché en haut du modal */
  prompt?: string
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export function AuthGateModal({ isOpen, onClose, onSuccess, prompt }: AuthGateModalProps) {
  const { login, register } = useAuthStore()

  const [tab, setTab] = useState<'signup' | 'login'>('signup')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setFirstName(''); setLastName(''); setEmail(''); setPassword('')
      setLoading(false); setShowPwd(false)
    }
  }, [isOpen, tab])

  if (!isOpen) return null

  const handleGoogleAuth = () => {
    // Store return URL so GoogleOAuthCallback can redirect back here
    localStorage.setItem('authReturnTo', window.location.pathname + window.location.search)
    window.location.href = `${API_BASE}/auth/google/redirect?role=TENANT`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    try {
      if (tab === 'signup') {
        if (!firstName.trim()) { toast.error('Prénom requis'); setLoading(false); return }
        await register({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim() || firstName.trim(),
          role: 'TENANT',
        })
        toast.success('Compte créé — bienvenue !')
      } else {
        await login({ email: email.trim(), password })
        toast.success('Connecté !')
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Erreur')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: `1px solid ${BAI.border}`, borderRadius: 9,
    fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink,
    background: BAI.bgBase, outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(13,12,10,0.55)',
          zIndex: 1100,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal — bottom sheet mobile / centered desktop */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: BAI.bgSurface,
        borderRadius: '20px 20px 0 0',
        padding: 'clamp(24px,4vw,36px)',
        zIndex: 1101,
        maxWidth: 480,
        margin: '0 auto',
        boxShadow: '0 -8px 40px rgba(13,12,10,0.18)',
        fontFamily: BAI.fontBody,
        // On desktop: center vertically
        ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? {
          top: '50%', bottom: 'auto', left: '50%', right: 'auto',
          transform: 'translate(-50%, -50%)',
          borderRadius: 20,
          width: '90%',
          maxWidth: 440,
        } : {}),
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: BAI.bgMuted, border: 'none', borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: BAI.inkMid,
          }}
        >
          <X size={15} />
        </button>

        {/* Drag handle (mobile) */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: BAI.border, margin: '0 auto 20px' }} />

        {/* Prompt */}
        {prompt && (
          <p style={{ fontSize: 13, color: BAI.inkMid, textAlign: 'center', margin: '0 0 16px', lineHeight: 1.5 }}>
            {prompt}
          </p>
        )}

        {/* Title */}
        <h2 style={{
          fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
          fontSize: 26, color: BAI.ink, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.1,
        }}>
          {tab === 'signup' ? 'Créer un compte gratuit' : 'Bon retour !'}
        </h2>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '11px 16px', background: '#fff', border: `1px solid ${BAI.border}`, borderRadius: 10,
            fontSize: 14, fontWeight: 500, color: BAI.ink, cursor: 'pointer', marginBottom: 16,
            fontFamily: BAI.fontBody,
          }}
        >
          <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuer avec Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: BAI.border }} />
          <span style={{ fontSize: 11, color: BAI.inkFaint, fontWeight: 600, letterSpacing: '0.06em' }}>OU</span>
          <div style={{ flex: 1, height: 1, background: BAI.border }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input style={inp} placeholder="Prénom *" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
              <input style={inp} placeholder="Nom (optionnel)" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
            </div>
          )}

          <input
            style={inp} type="email" placeholder="Adresse email *"
            value={email} onChange={e => setEmail(e.target.value)}
            autoComplete="email" required
          />

          <div style={{ position: 'relative' }}>
            <input
              style={{ ...inp, paddingRight: 40 }}
              type={showPwd ? 'text' : 'password'}
              placeholder="Mot de passe *"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              required minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, display: 'flex' }}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 10, border: 'none',
              background: BAI.night, color: '#fff',
              fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4, minHeight: 48,
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {tab === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        {/* Tab switcher */}
        <p style={{ textAlign: 'center', fontSize: 13, color: BAI.inkMid, margin: '14px 0 0' }}>
          {tab === 'signup' ? 'Déjà inscrit ?' : 'Pas encore de compte ?'}{' '}
          <button
            type="button"
            onClick={() => setTab(tab === 'signup' ? 'login' : 'signup')}
            style={{ background: 'none', border: 'none', color: BAI.caramel, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: BAI.fontBody }}
          >
            {tab === 'signup' ? 'Se connecter' : 'S\'inscrire gratuitement'}
          </button>
        </p>

        {tab === 'signup' && (
          <p style={{ textAlign: 'center', fontSize: 11, color: BAI.inkFaint, margin: '10px 0 0', lineHeight: 1.5 }}>
            En créant un compte vous acceptez nos{' '}
            <a href="/cgu" target="_blank" style={{ color: BAI.inkFaint }}>CGU</a>.
            Gratuit, sans engagement.
          </p>
        )}
      </div>
    </>
  )
}
