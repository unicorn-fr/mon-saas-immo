import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/api.service'
import toast from 'react-hot-toast'
import { BAI } from '../constants/bailio-tokens'
import { User, ArrowRight } from 'lucide-react'

export default function CompleteProfile() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName]   = useState(user?.lastName ?? '')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Veuillez renseigner votre prénom et votre nom.')
      return
    }
    setIsLoading(true)
    try {
      await apiClient.patch('/auth/profile', { firstName: firstName.trim(), lastName: lastName.trim() })
      updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() })
      toast.success('Profil complété !')
      const role = user?.role
      navigate(role === 'OWNER' ? '/dashboard/owner' : '/dashboard/tenant', { replace: true })
    } catch {
      toast.error('Une erreur est survenue, veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: BAI.bgInput,
    border: `1px solid ${BAI.border}`,
    borderRadius: 8,
    padding: '0.7rem 1rem',
    color: BAI.ink,
    fontSize: 15,
    outline: 'none',
    width: '100%',
    fontFamily: BAI.fontBody,
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: BAI.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: BAI.fontBody }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontFamily: BAI.fontDisplay, fontSize: 32, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>
            Bailio<span style={{ color: BAI.caramel }}>.</span>
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`,
          borderRadius: 16,
          padding: '36px 32px',
          boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 24px rgba(13,12,10,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} style={{ color: BAI.inkMid }} />
            </div>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: BAI.ink, margin: 0 }}>
              Complétez votre profil
            </h1>
          </div>
          <p style={{ fontSize: 14, color: BAI.inkMid, marginBottom: 28, lineHeight: 1.6 }}>
            Pour des raisons de sécurité et de traçabilité, votre prénom et nom sont requis avant d'accéder à la plateforme.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jean"
                  autoFocus
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = BAI.night; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.10)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: BAI.inkMid, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Dupont"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = BAI.night; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.10)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
              style={{
                background: BAI.night,
                border: 'none',
                borderRadius: 8,
                padding: '0.75rem 1.25rem',
                color: '#ffffff',
                fontSize: 14,
                fontFamily: BAI.fontBody,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading || !firstName.trim() || !lastName.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4,
                transition: 'background 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#2d2d4e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = BAI.night }}
            >
              {isLoading ? 'Enregistrement…' : <>Accéder à mon espace <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: BAI.inkFaint, marginTop: 20 }}>
          Ces informations sont utilisées pour identifier les signataires des contrats et quittances.
        </p>
      </div>
    </div>
  )
}
