import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/api.service'
import toast from 'react-hot-toast'
import { BAI } from '../constants/bailio-tokens'
import { ArrowRight } from 'lucide-react'

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

  const darkInputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: '0.7rem 1rem',
    color: '#ffffff',
    fontSize: 15,
    outline: 'none',
    width: '100%',
    fontFamily: BAI.fontBody,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: BAI.fontBody,
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p
            style={{
              fontFamily: BAI.fontDisplay,
              fontSize: 32,
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#ffffff',
              margin: 0,
            }}
          >
            Bailio<span style={{ color: BAI.caramel }}>.</span>
          </p>
        </div>

        {/* Glass card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 16,
            padding: '36px 32px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 24,
                color: '#ffffff',
                margin: 0,
              }}
            >
              Complétez votre profil
            </h1>
          </div>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            Pour des raisons de sécurité et de traçabilité, votre prénom et nom sont requis avant d'accéder à la plateforme.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jean"
                  autoFocus
                  style={darkInputStyle}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(196,151,106,0.7)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Dupont"
                  style={darkInputStyle}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(196,151,106,0.7)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
              style={{
                background: BAI.night,
                border: '1px solid rgba(255,255,255,0.15)',
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
              onMouseEnter={e => {
                if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#2d2d4e'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = BAI.night
              }}
            >
              {isLoading ? 'Enregistrement…' : <>Accéder à mon espace <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
            marginTop: 20,
          }}
        >
          Ces informations sont utilisées pour identifier les signataires des contrats et quittances.
        </p>
      </div>
    </div>
  )
}
