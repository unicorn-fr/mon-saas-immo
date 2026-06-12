import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BailioLogo } from '../components/BailioLogo'
import { Home, Building2, ChevronRight, Loader2 } from 'lucide-react'
import { BAI } from '../constants/bailio-tokens'

export default function SelectRole() {
  const navigate = useNavigate()
  const { updateProfile, user } = useAuth()
  const [loading, setLoading] = useState<'TENANT' | 'OWNER' | null>(null)

  const handleSelect = async (role: 'TENANT' | 'OWNER') => {
    setLoading(role)
    try {
      await updateProfile({ role } as Parameters<typeof updateProfile>[0])
      navigate(role === 'OWNER' ? '/dashboard/owner' : '/dashboard/tenant', { replace: true })
    } catch {
      setLoading(null)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0a0d1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(32px,6vw,64px) clamp(16px,4vw,32px)',
        fontFamily: BAI.fontBody,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
        <BailioLogo size={32} variant="onDark" />
        <span style={{
          fontFamily: BAI.fontDisplay,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 24,
          color: '#ffffff',
          letterSpacing: '-0.02em',
        }}>
          Bailio
        </span>
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 480 }}>
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: BAI.caramel,
          margin: '0 0 12px',
        }}>
          Dernière étape
        </p>
        <h1 style={{
          fontFamily: BAI.fontDisplay,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 'clamp(32px,6vw,48px)',
          color: '#ffffff',
          margin: '0 0 12px',
          lineHeight: 1.1,
        }}>
          Vous êtes…
        </h1>
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 15,
          color: 'rgba(255,255,255,0.55)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          Choisissez votre profil pour accéder à votre espace personnalisé.
        </p>
      </div>

      {/* Role cards — side by side md+, stacked on mobile */}
      <div
        className="flex flex-col md:flex-row"
        style={{ gap: 16, width: '100%', maxWidth: 600 }}
      >

        {/* Locataire */}
        <button
          onClick={() => handleSelect('TENANT')}
          disabled={loading !== null}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 16,
            padding: '28px 24px',
            textAlign: 'left',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 16,
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.12s',
            opacity: loading === 'OWNER' ? 0.45 : 1,
            minHeight: 44,
          }}
          onMouseEnter={e => {
            if (!loading) {
              const b = e.currentTarget as HTMLButtonElement
              b.style.borderColor = 'rgba(196,151,106,0.6)'
              b.style.boxShadow = '0 8px 32px rgba(196,151,106,0.12)'
              b.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = 'rgba(255,255,255,0.13)'
            b.style.boxShadow = 'none'
            b.style.transform = 'translateY(0)'
          }}
        >
          {/* Icon */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: 'rgba(27,94,59,0.30)',
            border: '1px solid rgba(27,94,59,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {loading === 'TENANT' ? (
              <Loader2 size={22} color="#4ade80" className="animate-spin" />
            ) : (
              <Home size={24} color="#4ade80" strokeWidth={1.8} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontFamily: BAI.fontBody,
                fontWeight: 700,
                fontSize: 16,
                color: '#ffffff',
              }}>
                Locataire
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: BAI.tenant,
                background: 'rgba(27,94,59,0.20)',
                border: '1px solid rgba(27,94,59,0.35)',
                borderRadius: 20,
                padding: '2px 8px',
              }}>
                Locataire
              </span>
            </div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.60)', margin: 0, lineHeight: 1.5 }}>
              Je recherche un logement à louer
            </p>
          </div>

          <ChevronRight size={18} color="rgba(255,255,255,0.35)" style={{ alignSelf: 'flex-end' }} />
        </button>

        {/* Propriétaire */}
        <button
          onClick={() => handleSelect('OWNER')}
          disabled={loading !== null}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 16,
            padding: '28px 24px',
            textAlign: 'left',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 16,
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.12s',
            opacity: loading === 'TENANT' ? 0.45 : 1,
            minHeight: 44,
          }}
          onMouseEnter={e => {
            if (!loading) {
              const b = e.currentTarget as HTMLButtonElement
              b.style.borderColor = 'rgba(196,151,106,0.6)'
              b.style.boxShadow = '0 8px 32px rgba(196,151,106,0.15)'
              b.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = 'rgba(255,255,255,0.13)'
            b.style.boxShadow = 'none'
            b.style.transform = 'translateY(0)'
          }}
        >
          {/* Icon */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: 'rgba(196,151,106,0.20)',
            border: '1px solid rgba(196,151,106,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {loading === 'OWNER' ? (
              <Loader2 size={22} color={BAI.caramel} className="animate-spin" />
            ) : (
              <Building2 size={24} color={BAI.caramel} strokeWidth={1.8} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontFamily: BAI.fontBody,
                fontWeight: 700,
                fontSize: 16,
                color: '#ffffff',
              }}>
                Propriétaire
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: BAI.caramel,
                background: 'rgba(196,151,106,0.15)',
                border: '1px solid rgba(196,151,106,0.30)',
                borderRadius: 20,
                padding: '2px 8px',
              }}>
                Propriétaire
              </span>
            </div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.60)', margin: 0, lineHeight: 1.5 }}>
              Je mets un logement en location
            </p>
          </div>

          <ChevronRight size={18} color="rgba(255,255,255,0.35)" style={{ alignSelf: 'flex-end' }} />
        </button>
      </div>

      {/* Bottom note */}
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 12,
        color: 'rgba(255,255,255,0.30)',
        textAlign: 'center',
        marginTop: 28,
        lineHeight: 1.6,
      }}>
        Vous pourrez changer de profil à tout moment depuis les paramètres de votre compte.
        {user?.email && (
          <><br />Connecté en tant que {user.email}</>
        )}
      </p>
    </div>
  )
}
