import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BAI } from '../constants/bailio-tokens'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
    >
      <div className="text-center max-w-md mx-auto">
        {/* Large muted 404 */}
        <div
          className="leading-none select-none mb-2"
          style={{
            fontFamily: BAI.fontDisplay,
            fontSize: '120px',
            fontWeight: 700,
            color: BAI.border,
            lineHeight: 1,
          }}
        >
          404
        </div>

        {/* Architectural SVG ornament */}
        <div className="flex justify-center mb-6">
          <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="18" width="48" height="2" rx="1" fill={BAI.border} />
            <rect x="18" y="10" width="12" height="8" rx="1" fill="none" stroke={BAI.border} strokeWidth="1.5" />
            <rect x="22" y="14" width="4" height="4" rx="0.5" fill={BAI.border} />
            <path d="M14 10 L24 2 L34 10" stroke={BAI.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <h1
          className="mb-3"
          style={{
            fontFamily: BAI.fontDisplay,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '40px',
            color: BAI.ink,
            lineHeight: '1.1',
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
            lineHeight: '1.65',
          }}
        >
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full max-w-xs py-2.5 transition-opacity hover:opacity-90"
            style={{
              background: BAI.night,
              color: '#ffffff',
              borderRadius: '8px',
              fontFamily: BAI.fontBody,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Retour à l'accueil
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 transition-colors"
            style={{ fontFamily: BAI.fontBody, fontSize: '13px', color: BAI.inkMid }}
            onMouseEnter={(e) => (e.currentTarget.style.color = BAI.ink)}
            onMouseLeave={(e) => (e.currentTarget.style.color = BAI.inkMid)}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
