import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#f5f5f7' }}
    >
      <div className="text-center max-w-md mx-auto">
        {/* 404 number */}
        <div
          className="text-[120px] font-extrabold leading-none mb-4 select-none"
          style={{ color: '#007AFF', fontFamily: '"Plus Jakarta Sans", Inter, system-ui' }}
        >
          404
        </div>

        {/* Separator */}
        <div
          className="w-16 h-1 rounded-full mx-auto mb-6"
          style={{ background: '#aacfff' }}
        />

        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: '#1d1d1f', fontFamily: '"Plus Jakarta Sans", Inter, system-ui' }}
        >
          Page non trouvée
        </h2>
        <p className="mb-8 text-base leading-relaxed" style={{ color: '#515154' }}>
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl font-semibold px-5 py-2.5 text-sm transition-colors"
            style={{ background: '#007AFF', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0066d6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#007AFF')}
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl font-semibold px-5 py-2.5 text-sm border transition-colors"
            style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#3a3a3c' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  )
}
