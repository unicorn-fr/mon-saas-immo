import { useState, useRef, useEffect } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { firebaseAuth } from '../../config/firebase'
import api from '../../services/api'
import toast from 'react-hot-toast'

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string) => void
  onClose: () => void
}

type Step = 'phone' | 'otp'

export default function PhoneVerification({ onVerified, onClose }: PhoneVerificationProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown pour renvoyer le code
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function initRecaptcha() {
    if (recaptchaRef.current) return
    recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
      size: 'invisible',
    })
  }

  async function sendCode() {
    const cleaned = phone.trim().replace(/\s/g, '')
    if (!cleaned.startsWith('+') || cleaned.length < 8) {
      toast.error('Entrez un numéro valide avec indicatif (ex: +33 6 12 34 56 78)')
      return
    }

    setLoading(true)
    try {
      initRecaptcha()
      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        cleaned,
        recaptchaRef.current!
      )
      confirmationRef.current = confirmation
      setStep('otp')
      setCountdown(60)
      toast.success('Code envoyé par SMS !')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('invalid-phone-number')) {
        toast.error('Numéro de téléphone invalide')
      } else if (msg.includes('too-many-requests')) {
        toast.error('Trop de tentatives. Réessayez plus tard.')
      } else {
        toast.error('Erreur lors de l\'envoi du SMS')
      }
      // Reset recaptcha en cas d'erreur
      recaptchaRef.current = null
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    const code = otp.join('')
    if (code.length !== 6) {
      toast.error('Entrez les 6 chiffres du code')
      return
    }

    setLoading(true)
    try {
      const result = await confirmationRef.current!.confirm(code)
      const firebaseIdToken = await result.user.getIdToken()

      // Envoyer au backend pour marquer phoneVerified = true
      const { data } = await api.post('/auth/verify-phone', { firebaseIdToken })
      toast.success('Téléphone vérifié !')
      onVerified(data.data.phoneNumber)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('invalid-verification-code')) {
        toast.error('Code incorrect')
      } else if (msg.includes('code-expired')) {
        toast.error('Code expiré. Renvoyez un nouveau code.')
        setStep('phone')
      } else {
        toast.error('Erreur de vérification')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(13,12,10,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: '16px',
        border: '1px solid #e4e1db', width: '100%', maxWidth: '420px',
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#1a1a2e', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: '4px' }}>
              Sécurité du compte
            </div>
            <div style={{ color: '#fff', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', fontWeight: 700, fontStyle: 'italic' }}>
              Vérification du téléphone
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9e9b96', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '28px' }}>
          {step === 'phone' ? (
            <>
              <p style={{ fontSize: '14px', color: '#5a5754', marginBottom: '20px', lineHeight: 1.6 }}>
                Entrez votre numéro de téléphone avec l'indicatif pays pour recevoir un code de vérification par SMS.
              </p>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5a5754', marginBottom: '6px' }}>
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendCode()}
                placeholder="+33 6 12 34 56 78"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: '#f8f7f4', border: '1px solid #e4e1db',
                  borderRadius: '8px', fontSize: '15px', color: '#0d0c0a',
                  outline: 'none', marginBottom: '16px',
                }}
              />
              <div id="recaptcha-container" />
              <button
                onClick={sendCode}
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? '#5a5754' : '#1a1a2e',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Envoi en cours…' : 'Envoyer le code SMS'}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '14px', color: '#5a5754', marginBottom: '4px', lineHeight: 1.6 }}>
                Code envoyé au <strong>{phone}</strong>
              </p>
              <p style={{ fontSize: '13px', color: '#9e9b96', marginBottom: '24px' }}>
                Entrez les 6 chiffres reçus par SMS.
              </p>

              {/* OTP inputs */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: '48px', height: '56px', textAlign: 'center',
                      fontSize: '22px', fontWeight: 700,
                      background: '#f8f7f4', border: '1px solid #e4e1db',
                      borderRadius: '8px', outline: 'none', color: '#0d0c0a',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={verifyCode}
                disabled={loading || otp.join('').length !== 6}
                style={{
                  width: '100%', padding: '12px',
                  background: (loading || otp.join('').length !== 6) ? '#5a5754' : '#1a1a2e',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 600,
                  cursor: (loading || otp.join('').length !== 6) ? 'not-allowed' : 'pointer',
                  marginBottom: '12px',
                }}
              >
                {loading ? 'Vérification…' : 'Confirmer le code'}
              </button>

              <div style={{ textAlign: 'center' }}>
                {countdown > 0 ? (
                  <span style={{ fontSize: '13px', color: '#9e9b96' }}>
                    Renvoyer dans {countdown}s
                  </span>
                ) : (
                  <button
                    onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']) }}
                    style={{ background: 'none', border: 'none', fontSize: '13px', color: '#c4976a', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Renvoyer le code
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
