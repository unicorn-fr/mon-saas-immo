import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const M = {
  bg: '#fafaf8',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  night: '#1a1a2e',
  border: '#e4e1db',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: M.bg, fontFamily: M.body }}
    >
      <div className="text-center max-w-md mx-auto">
        {/* Large muted 404 */}
        <div
          className="leading-none select-none mb-2"
          style={{
            fontFamily: M.display,
            fontSize: '120px',
            fontWeight: 700,
            color: M.border,
            lineHeight: 1,
          }}
        >
          404
        </div>

        {/* Architectural SVG ornament */}
        <div className="flex justify-center mb-6">
          <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="18" width="48" height="2" rx="1" fill={M.border} />
            <rect x="18" y="10" width="12" height="8" rx="1" fill="none" stroke={M.border} strokeWidth="1.5" />
            <rect x="22" y="14" width="4" height="4" rx="0.5" fill={M.border} />
            <path d="M14 10 L24 2 L34 10" stroke={M.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <h1
          className="mb-3"
          style={{
            fontFamily: M.display,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '40px',
            color: M.ink,
            lineHeight: '1.1',
          }}
        >
          Page introuvable
        </h1>

        <p
          className="mb-8"
          style={{
            fontFamily: M.body,
            fontSize: '15px',
            color: M.inkMid,
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
              background: M.night,
              color: '#ffffff',
              borderRadius: '8px',
              fontFamily: M.body,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Retour à l'accueil
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 transition-colors"
            style={{ fontFamily: M.body, fontSize: '13px', color: M.inkMid }}
            onMouseEnter={(e) => (e.currentTarget.style.color = M.ink)}
            onMouseLeave={(e) => (e.currentTarget.style.color = M.inkMid)}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
