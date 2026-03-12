import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft, Download, Mail } from 'lucide-react'
import Footer from '../../components/layout/Footer'

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
}

export default function Presse() {
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Espace presse</h1>
          <p className="text-slate-500">Retrouvez toutes les informations sur ImmoParticuliers pour vos articles et reportages.</p>
        </div>

        <div style={cardStyle} className="p-8 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">À propos d'ImmoParticuliers</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Fondée en 2024, ImmoParticuliers est la première plateforme française dédiée
            à la location immobilière entre particuliers. Notre mission : simplifier
            le marché locatif en supprimant les intermédiaires tout en garantissant
            une sécurité maximale.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#e8f0fe] rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#007AFF]">10 000+</p>
              <p className="text-xs text-slate-600 mt-1">Annonces actives</p>
            </div>
            <div className="bg-[#e8f0fe] rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#007AFF]">15 000+</p>
              <p className="text-xs text-slate-600 mt-1">Utilisateurs</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-600">98%</p>
              <p className="text-xs text-slate-600 mt-1">Satisfaction</p>
            </div>
          </div>
        </div>

        <div style={cardStyle} className="p-8 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Kit presse</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-5">
            Téléchargez notre kit presse contenant le logo, les photos officielles
            et un dossier de présentation.
          </p>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d2d2d7] bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            onClick={() => alert('Kit presse bientôt disponible')}
          >
            <Download className="w-4 h-4" />
            Télécharger le kit presse
          </button>
        </div>

        <div style={cardStyle} className="p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Contact presse</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Pour toute demande d'interview, de partenariat média ou d'information complémentaire :
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#e8f0fe] rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-[#007AFF]" />
            </div>
            <span className="text-slate-700 font-semibold text-sm">presse@immoparticuliers.fr</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
