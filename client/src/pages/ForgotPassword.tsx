import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { authService } from '../services/auth.service'
import { BailioLogo } from '../components/BailioLogo'

const M = {
  bg: '#fafaf8',
  surface: '#ffffff',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  caramel: '#c4976a',
  border: '#e4e1db',
  inputBg: '#f8f7f4',
  danger: '#9b1c1c',
  dangerBg: '#fef2f2',
  dangerBorder: '#fca5a5',
  success: '#1b5e3b',
  successBg: '#edf7f2',
  successBorder: '#9fd4ba',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Veuillez entrer votre adresse email')
      return
    }

    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setIsSent(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de l\'envoi de l\'email'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: M.bg, fontFamily: M.body }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
            <BailioLogo size={34} />
            <span style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: M.night, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Bailio
            </span>
          </Link>
        </div>

        <div
          className="p-8"
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(13,12,10,0.08)',
          }}
        >
          {isSent ? (
            <div className="text-center">
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: M.successBg, border: `1px solid ${M.successBorder}`, borderRadius: '12px' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={M.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2
                className="mb-3"
                style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: M.ink }}
              >
                Email envoyé !
              </h2>
              <p className="mb-2" style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid, lineHeight: '1.6' }}>
                Si un compte existe avec l'adresse{' '}
                <span style={{ fontWeight: 600, color: M.ink }}>{email}</span>, vous recevrez un lien de réinitialisation.
              </p>
              <p className="mb-6" style={{ fontFamily: M.body, fontSize: '13px', color: M.inkFaint }}>
                Pensez à vérifier vos spams si vous ne recevez rien.
              </p>
              <Link
                to="/login"
                className="block w-full text-center py-2.5 transition-opacity hover:opacity-90"
                style={{
                  background: M.night,
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontFamily: M.body,
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1
                  className="mb-2"
                  style={{ fontFamily: M.display, fontStyle: 'italic', fontWeight: 700, fontSize: '32px', color: M.ink, lineHeight: '1.1' }}
                >
                  Mot de passe oublié ?
                </h1>
                <p style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid, lineHeight: '1.6' }}>
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {error && (
                <div
                  className="mb-4 p-3"
                  style={{ background: M.dangerBg, border: `1px solid ${M.dangerBorder}`, borderRadius: '8px' }}
                >
                  <p style={{ fontFamily: M.body, fontSize: '13px', color: M.danger }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-1.5"
                    style={{ fontFamily: M.body, fontSize: '13px', fontWeight: 500, color: M.ink }}
                  >
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: M.inkFaint }}
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="votre@email.com"
                      disabled={isLoading}
                      required
                      className="w-full pl-10 pr-4 py-2.5 outline-none transition-all"
                      style={{
                        background: M.inputBg,
                        border: `1px solid ${M.border}`,
                        borderRadius: '8px',
                        fontFamily: M.body,
                        fontSize: '13px',
                        color: M.ink,
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = M.night; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,26,46,0.08)` }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = M.border; e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: M.night,
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontFamily: M.body,
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi en cours...
                    </span>
                  ) : (
                    'Envoyer le lien'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 transition-colors hover:opacity-80"
              style={{ fontFamily: M.body, fontSize: '13px', color: M.inkMid }}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
