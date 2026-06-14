import { useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'

interface EmailCaptureProps {
  variant?: 'dark' | 'light'
  placeholder?: string
  ctaLabel?: string
  successMessage?: string
  source?: string
}

export default function EmailCapture({
  variant = 'dark',
  placeholder = 'Votre adresse email',
  ctaLabel = 'Recevoir les alertes',
  successMessage = 'Parfait ! Vous serez notifié dès qu\'un bien correspond à vos critères.',
  source = 'home',
}: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isDark = variant === 'dark'
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : BAI.border
  const textColor = isDark ? '#fff' : BAI.ink
  const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : BAI.inkFaint

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Entrez une adresse email valide')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      await apiClient.post('/newsletter/subscribe', { email: trimmed, source })
      setStatus('success')
    } catch (err: unknown) {
      // If 409 (already subscribed), treat as success
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 409) { setStatus('success'); return }
      }
      setStatus('error')
      setErrorMsg('Une erreur est survenue. Réessayez dans un instant.')
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: isDark ? 'rgba(27,94,59,0.2)' : BAI.tenantLight,
        border: `1px solid ${isDark ? 'rgba(159,212,186,0.3)' : BAI.tenantBorder}`,
        borderRadius: 10, padding: '14px 18px',
      }}>
        <span style={{ fontSize: 18 }}>✓</span>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: isDark ? '#9fd4ba' : BAI.tenant, margin: 0, lineHeight: 1.5 }}>
          {successMessage}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrorMsg('') }}
            placeholder={placeholder}
            disabled={status === 'loading'}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: 10,
              border: `1px solid ${errorMsg ? '#f87171' : borderColor}`,
              background: isDark ? 'rgba(255,255,255,0.07)' : BAI.bgSurface,
              color: textColor,
              fontFamily: BAI.fontBody,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = BAI.caramel)}
            onBlur={e => (e.currentTarget.style.borderColor = errorMsg ? '#f87171' : borderColor)}
          />
          <style>{`::placeholder { color: ${placeholderColor}; }`}</style>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '13px 22px',
            borderRadius: 10,
            border: 'none',
            background: BAI.caramel,
            color: '#fff',
            fontFamily: BAI.fontBody,
            fontSize: 14,
            fontWeight: 600,
            cursor: status === 'loading' ? 'wait' : 'pointer',
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
            minHeight: 46,
            opacity: status === 'loading' ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.background = '#b07f54' }}
          onMouseLeave={e => (e.currentTarget.style.background = BAI.caramel)}
        >
          {status === 'loading' ? '…' : ctaLabel}
        </button>
      </div>

      {errorMsg && (
        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#f87171', margin: '6px 0 0' }}>
          {errorMsg}
        </p>
      )}
    </form>
  )
}
