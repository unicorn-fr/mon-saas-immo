import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { BAI } from '../constants/bailio-tokens'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
    >
      <div className="text-center" style={{ maxWidth: 400 }}>

        {/* Architectural ornament */}
        <div className="flex justify-center mb-4">
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
          }}>
            <Home className="w-7 h-7" style={{ color: BAI.inkFaint }} />
          </div>
        </div>

        {/* 404 muted number */}
        <div
          className="select-none mb-1"
          style={{
            fontFamily: BAI.fontDisplay,
            fontSize: 'clamp(72px, 20vw, 120px)',
            fontWeight: 700,
            color: BAI.border,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          404
        </div>

        <h1
          className="mb-3"
          style={{
            fontFamily: BAI.fontDisplay,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 'clamp(24px, 6vw, 36px)',
            color: BAI.ink,
            lineHeight: 1.15,
          }}
        >
          Page introuvable
        </h1>

        <p
          className="mb-8"
          style={{
            fontFamily: BAI.fontBody,
            fontSize: '15px',
            color: BAI.inkMid,
            lineHeight: 1.65,
            maxWidth: 320,
            margin: '0 auto 32px',
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
              borderRadius: '10px',
              fontFamily: BAI.fontBody,
              fontSize: '14px',
              fontWeight: 600,
              padding: '11px 28px',
              textDecoration: 'none',
              minHeight: 44,
            }}
          >
            Retour à l'accueil
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 transition-colors"
            style={{ fontFamily: BAI.fontBody, fontSize: '13px', color: BAI.inkMid, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = BAI.ink)}
            onMouseLeave={(e) => (e.currentTarget.style.color = BAI.inkMid)}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
