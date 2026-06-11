import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BailioLogo } from '../components/BailioLogo'
import { Check, Home, Building2, ChevronRight, Loader2 } from 'lucide-react'

const font: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" }
const fontDisplay: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" }

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
    <div style={{ minHeight: '100dvh', display: 'flex', ...font }}>

      {/* ── Panneau gauche ────────────────────────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{ width: '44%', background: '#1a1a2e', flexDirection: 'column', padding: '40px 48px' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <BailioLogo size={28} variant="onDark" />
          <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: '#ffffff', letterSpacing: '-0.02em' }}>
            Bailio
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '28px' }}>
          <div>
            <p style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 400, fontSize: '28px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.4, margin: '0 0 16px', maxWidth: '300px' }}>
              "Chaque logement a une histoire. Racontons la vôtre."
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Votre rôle détermine votre espace de travail.<br />
              Vous pourrez le modifier depuis votre profil.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Locataire', desc: 'Recherchez, candidatez, gérez votre dossier' },
              { label: 'Propriétaire', desc: 'Publiez, gérez vos biens et locataires' },
            ].map(({ label, desc }) => (
              <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(196,151,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Check size={9} color="#c4976a" strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          Connecté en tant que {user?.email}
        </p>
      </div>

      {/* ── Panneau droit ─────────────────────────────────────────────── */}
      <div
        style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        className="w-full md:w-[56%]"
      >
        <div style={{ width: '100%', maxWidth: '420px', padding: '48px 32px' }}>

          {/* Mobile logo */}
          <div className="flex md:hidden" style={{ justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <BailioLogo size={30} />
              <span style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: '#1a1a2e', letterSpacing: '-0.02em' }}>Bailio</span>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: '10px' }}>
              Dernière étape
            </div>
            <h1 style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '36px', color: '#0d0c0a', margin: '0 0 8px', lineHeight: 1.1 }}>
              Vous êtes…
            </h1>
            <p style={{ fontSize: '14px', color: '#5a5754', margin: 0 }}>
              Choisissez votre profil pour accéder à votre espace personnalisé.
            </p>
          </div>

          {/* Role cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Locataire */}
            <button
              onClick={() => handleSelect('TENANT')}
              disabled={loading !== null}
              style={{
                display: 'flex', alignItems: 'center', gap: '20px',
                padding: '22px 24px', width: '100%', textAlign: 'left',
                background: '#ffffff', border: '1.5px solid #e4e1db',
                borderRadius: '14px', cursor: loading !== null ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
                opacity: loading === 'OWNER' ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.borderColor = '#1a1a2e'
                  b.style.boxShadow = '0 4px 16px rgba(13,12,10,0.08)'
                  b.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.borderColor = '#e4e1db'
                b.style.boxShadow = 'none'
                b.style.transform = 'translateY(0)'
              }}
            >
              {/* Icon */}
              <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {loading === 'TENANT' ? (
                  <Loader2 size={22} color="#1a1a2e" className="animate-spin" />
                ) : (
                  <Home size={24} color="#1a1a2e" strokeWidth={1.8} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ ...font, fontWeight: 700, fontSize: '16px', color: '#0d0c0a', margin: '0 0 4px' }}>
                  Locataire
                </p>
                <p style={{ fontSize: '13px', color: '#5a5754', margin: 0, lineHeight: 1.4 }}>
                  Je recherche un logement à louer
                </p>
              </div>

              <ChevronRight size={18} color="#9e9b96" style={{ flexShrink: 0 }} />
            </button>

            {/* Propriétaire */}
            <button
              onClick={() => handleSelect('OWNER')}
              disabled={loading !== null}
              style={{
                display: 'flex', alignItems: 'center', gap: '20px',
                padding: '22px 24px', width: '100%', textAlign: 'left',
                background: '#ffffff', border: '1.5px solid #e4e1db',
                borderRadius: '14px', cursor: loading !== null ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
                opacity: loading === 'TENANT' ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.borderColor = '#c4976a'
                  b.style.boxShadow = '0 4px 16px rgba(196,151,106,0.15)'
                  b.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.borderColor = '#e4e1db'
                b.style.boxShadow = 'none'
                b.style.transform = 'translateY(0)'
              }}
            >
              {/* Icon */}
              <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#fdf5ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {loading === 'OWNER' ? (
                  <Loader2 size={22} color="#c4976a" className="animate-spin" />
                ) : (
                  <Building2 size={24} color="#c4976a" strokeWidth={1.8} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ ...font, fontWeight: 700, fontSize: '16px', color: '#0d0c0a', margin: '0 0 4px' }}>
                  Propriétaire
                </p>
                <p style={{ fontSize: '13px', color: '#5a5754', margin: 0, lineHeight: 1.4 }}>
                  Je mets un logement en location
                </p>
              </div>

              <ChevronRight size={18} color="#9e9b96" style={{ flexShrink: 0 }} />
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#9e9b96', textAlign: 'center', marginTop: '24px', lineHeight: 1.6 }}>
            Vous pourrez changer de profil à tout moment<br />depuis les paramètres de votre compte.
          </p>
        </div>
      </div>
    </div>
  )
}
