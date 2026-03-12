import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft, MessageCircle, Mail, FileText, Shield } from 'lucide-react'
import Footer from '../../components/layout/Footer'

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
}

export default function Support() {
  return (
    <div className="min-h-screen" style={{ background: '#f5f5f7' }}>
      <header className="bg-white border-b border-[#d2d2d7]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#007AFF] rounded-xl flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 hidden sm:block">ImmoParticuliers</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#007AFF] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Centre d'aide</h1>
          <p className="text-slate-500">Besoin d'assistance ? Trouvez rapidement l'aide dont vous avez besoin.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/faq"
            style={cardStyle}
            className="p-5 flex items-start gap-4 hover:border-[#007AFF]/40 transition-colors group"
          >
            <div className="w-11 h-11 bg-[#e8f0fe] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#007AFF] transition-colors">
              <MessageCircle className="w-5 h-5 text-[#007AFF] group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1 text-sm">FAQ</h3>
              <p className="text-sm text-slate-500">Consultez les questions les plus fréquemment posées par nos utilisateurs.</p>
            </div>
          </Link>

          <Link
            to="/contact"
            style={cardStyle}
            className="p-5 flex items-start gap-4 hover:border-[#007AFF]/40 transition-colors group"
          >
            <div className="w-11 h-11 bg-[#e8f0fe] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#007AFF] transition-colors">
              <Mail className="w-5 h-5 text-[#007AFF] group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1 text-sm">Nous contacter</h3>
              <p className="text-sm text-slate-500">Envoyez-nous un message et recevez une réponse sous 24h.</p>
            </div>
          </Link>

          <Link
            to="/cgu"
            style={cardStyle}
            className="p-5 flex items-start gap-4 hover:border-[#007AFF]/40 transition-colors group"
          >
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
              <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1 text-sm">Conditions d'utilisation</h3>
              <p className="text-sm text-slate-500">Consultez nos CGU et nos conditions de service.</p>
            </div>
          </Link>

          <Link
            to="/confidentialite"
            style={cardStyle}
            className="p-5 flex items-start gap-4 hover:border-[#007AFF]/40 transition-colors group"
          >
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1 text-sm">Protection des données</h3>
              <p className="text-sm text-slate-500">Découvrez comment nous protégeons vos données personnelles.</p>
            </div>
          </Link>
        </div>

        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: '#007AFF' }}
        >
          <h2 className="text-lg font-bold text-white mb-2">Besoin d'aide urgente ?</h2>
          <p className="text-white/75 text-sm mb-5">Notre équipe support est disponible du lundi au vendredi de 9h à 18h.</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#007AFF] font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            Contacter le support
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
