import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full opacity-50 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-38 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute -bottom-32 left-1/4 w-[420px] h-[420px] rounded-full opacity-28 pointer-events-none" style={{ background: 'radial-gradient(circle, #e879f9 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="text-center relative z-10">
        <h1 className="text-9xl font-extrabold mb-4 text-gradient-brand">404</h1>
        <h2 className="text-3xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Page non trouvée</h2>
        <p className="mb-8 max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="btn btn-primary flex items-center gap-2">
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          <button onClick={() => window.history.back()} className="btn-neon-violet flex items-center gap-2 px-5 py-2.5">
            <ArrowLeft className="w-5 h-5" />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  )
}
