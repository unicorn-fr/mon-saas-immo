import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../hooks/useAuth'

export default function NotFound() {
  const { user } = useAuth()
  const dashboardLink = user?.role === 'OWNER' ? '/dashboard/owner'
    : user?.role === 'TENANT' ? '/dashboard/tenant'
    : user?.role === 'ADMIN' ? '/admin'
    : user?.role === 'SUPER_ADMIN' ? '/super-admin/dashboard'
    : '/'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#0a0d1a', fontFamily: BAI.fontBody }}
    >
      <div className="text-center" style={{ maxWidth: 480 }}>

        {/* Caramel overline */}
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: BAI.caramel,
          margin: '0 0 12px',
        }}>
          Page introuvable
        </p>

        {/* 404 large white number */}
        <div
          className="select-none"
          style={{
            fontFamily: BAI.fontDisplay,
            fontSize: 'clamp(96px, 22vw, 160px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#ffffff',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            margin: '0 0 16px',
          }}
        >
          404
        </div>

        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 15,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.65,
            maxWidth: 360,
            margin: '0 auto 40px',
          }}
        >
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
            style={{
              background: BAI.night,
              color: '#ffffff',
              borderRadius: 10,
              fontFamily: BAI.fontBody,
              fontSize: 15,
              fontWeight: 600,
              padding: '13px 36px',
              textDecoration: 'none',
              minHeight: 48,
              letterSpacing: '0.01em',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            Retour à l'accueil
          </Link>

          <Link
            to={dashboardLink}
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{
              fontFamily: BAI.fontBody,
              fontSize: 13,
              color: BAI.caramel,
              textDecoration: 'none',
              marginTop: 4,
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
