import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Check, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { authService } from '../services/auth.service'
import { BailioLogo } from '../components/BailioLogo'
import { BAI } from '../constants/bailio-tokens'

type Step = 'email' | 'code' | 'success'

const inp: React.CSSProperties = {
  background: BAI.bgInput, border: `1px solid ${BAI.border}`, borderRadius: 8,
  fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, outline: 'none',
  width: '100%', padding: '11px 14px', boxSizing: 'border-box',
}

const passwordRequirements = (pw: string) => [
  { text: '8 caractères minimum', met: pw.length >= 8 },
  { text: 'Une majuscule', met: /[A-Z]/.test(pw) },
  { text: 'Une minuscule', met: /[a-z]/.test(pw) },
  { text: 'Un chiffre', met: /[0-9]/.test(pw) },
]

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const reqs = passwordRequirements(newPassword)
  const pwStrong = reqs.every(r => r.met)
  const strengthPct = (reqs.filter(r => r.met).length / reqs.length) * 100
  const strengthColor = strengthPct <= 25 ? '#ef4444' : strengthPct <= 50 ? '#f97316' : strengthPct <= 75 ? '#eab308' : '#22c55e'

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Entrez votre adresse email'); return }
    setError('')
    setIsLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      setStep('code')
    } catch {
      setError('Erreur lors de l\'envoi. Réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase().replace(/\s/g, '')
    if (cleanCode.length < 6) { setError('Entrez le code reçu par email'); return }
    if (!pwStrong) { setError('Le mot de passe ne respecte pas les critères'); return }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }
    setError('')
    setIsLoading(true)
    try {
      await authService.resetPassword(cleanCode, newPassword)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide ou expiré. Demandez un nouveau code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: BAI.bgBase, fontFamily: BAI.fontBody }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BailioLogo size={32} />
            <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: BAI.night, letterSpacing: '-0.02em' }}>Bailio</span>
          </Link>
        </div>

        <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(13,12,10,0.08)' }}>

          {/* ── STEP 1: Email ──────────────────────────────────── */}
          {step === 'email' && (
            <>
              <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 30, color: BAI.ink, margin: '0 0 8px', lineHeight: 1.1 }}>
                Mot de passe oublié ?
              </h1>
              <p style={{ fontSize: 14, color: BAI.inkMid, margin: '0 0 24px', lineHeight: 1.6 }}>
                Entrez votre email — nous vous enverrons un code à 8 caractères valable 15 minutes.
              </p>

              {error && <div style={{ marginBottom: 16, padding: '10px 14px', background: BAI.errorLight, border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: BAI.error }}>{error}</div>}

              <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint }} />
                  <input
                    type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="votre@email.com" required disabled={isLoading}
                    style={{ ...inp, paddingLeft: 36 }}
                    onFocus={e => e.currentTarget.style.borderColor = BAI.night}
                    onBlur={e => e.currentTarget.style.borderColor = BAI.border}
                  />
                </div>
                <button type="submit" disabled={isLoading} style={{ padding: '12px 16px', background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, fontFamily: BAI.fontBody }}>
                  {isLoading ? <><Loader2 size={15} className="animate-spin" /> Envoi…</> : 'Envoyer le code'}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: Code + nouveau mot de passe ───────────── */}
          {step === 'code' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={20} style={{ color: BAI.caramel }} />
                </div>
                <div>
                  <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: BAI.ink, margin: 0, lineHeight: 1.1 }}>Code envoyé</h1>
                  <p style={{ fontSize: 13, color: BAI.inkMid, margin: '4px 0 0' }}>Vérifiez <strong>{email}</strong></p>
                </div>
              </div>

              <p style={{ fontSize: 13, color: BAI.inkMid, margin: '0 0 20px', lineHeight: 1.6, padding: '10px 14px', background: BAI.bgMuted, borderRadius: 8 }}>
                Entrez le code à 8 caractères reçu par email, puis choisissez votre nouveau mot de passe.
              </p>

              {error && <div style={{ marginBottom: 16, padding: '10px 14px', background: BAI.errorLight, border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: BAI.error }}>{error}</div>}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Code field */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Code de vérification</label>
                  <input
                    type="text" value={code}
                    onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError('') }}
                    placeholder="EX: K7M2P9QX" maxLength={8}
                    autoFocus autoComplete="one-time-code"
                    style={{ ...inp, textAlign: 'center', fontSize: 22, letterSpacing: '0.25em', fontWeight: 700 }}
                    onFocus={e => e.currentTarget.style.borderColor = BAI.night}
                    onBlur={e => e.currentTarget.style.borderColor = BAI.border}
                  />
                </div>

                {/* New password */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint }} />
                    <input
                      type={showPwd ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••" required autoComplete="new-password"
                      style={{ ...inp, paddingLeft: 34, paddingRight: 38 }}
                      onFocus={e => e.currentTarget.style.borderColor = BAI.night}
                      onBlur={e => e.currentTarget.style.borderColor = BAI.border}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, display: 'flex' }}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 3, borderRadius: 2, background: BAI.border, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ height: '100%', width: `${strengthPct}%`, background: strengthColor, transition: 'all 0.3s' }} />
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {reqs.map((r, i) => (
                          <span key={i} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: r.met ? BAI.tenantLight : BAI.bgMuted, color: r.met ? BAI.tenant : BAI.inkFaint, border: `1px solid ${r.met ? BAI.tenantBorder : BAI.border}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {r.met && <Check size={9} style={{ color: BAI.tenant }} />}{r.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe</label>
                  <input
                    type={showPwd ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="new-password"
                    style={{ ...inp, ...(confirmPassword && newPassword !== confirmPassword ? { borderColor: BAI.error } : {}) }}
                    onFocus={e => e.currentTarget.style.borderColor = newPassword !== confirmPassword ? BAI.error : BAI.night}
                    onBlur={e => e.currentTarget.style.borderColor = newPassword !== confirmPassword ? BAI.error : BAI.border}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ fontSize: 12, color: BAI.error, margin: '4px 0 0' }}>Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <button type="submit" disabled={isLoading || !pwStrong || newPassword !== confirmPassword || code.length < 6}
                  style={{ padding: '12px 16px', background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: (isLoading || !pwStrong || newPassword !== confirmPassword || code.length < 6) ? 'not-allowed' : 'pointer', opacity: (isLoading || !pwStrong || newPassword !== confirmPassword || code.length < 6) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, fontFamily: BAI.fontBody, marginTop: 4 }}>
                  {isLoading ? <><Loader2 size={15} className="animate-spin" /> Réinitialisation…</> : 'Réinitialiser le mot de passe'}
                </button>
              </form>

              <button onClick={() => { setStep('email'); setCode(''); setError('') }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: BAI.inkMid, fontSize: 13, cursor: 'pointer', margin: '16px auto 0', fontFamily: BAI.fontBody }}>
                <ArrowLeft size={13} /> Changer d'email
              </button>
            </>
          )}

          {/* ── STEP 3: Success ───────────────────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Check size={26} style={{ color: BAI.tenant }} />
              </div>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.ink, margin: '0 0 10px' }}>Mot de passe réinitialisé !</h2>
              <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.6, margin: '0 0 24px' }}>
                Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link to="/login" style={{ display: 'block', padding: '12px 16px', background: BAI.night, color: '#fff', borderRadius: 8, fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Se connecter
              </Link>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: BAI.inkMid, textDecoration: 'none' }}>
            <ArrowLeft size={13} /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
