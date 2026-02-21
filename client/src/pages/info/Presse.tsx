import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft, Download, Mail } from 'lucide-react'
import Footer from '../../components/layout/Footer'

export default function Presse() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <HomeIcon className="w-7 h-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">ImmoParticuliers</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Espace presse</h1>
          <p className="text-gray-500">Retrouvez toutes les informations sur ImmoParticuliers pour vos articles et reportages.</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">À propos d'ImmoParticuliers</h2>
          <p className="text-gray-600 mb-4">
            Fondée en 2024, ImmoParticuliers est la première plateforme française dédiée
            à la location immobilière entre particuliers. Notre mission : simplifier
            le marché locatif en supprimant les intermédiaires tout en garantissant
            une sécurité maximale.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-primary-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">10 000+</p>
              <p className="text-sm text-gray-600">Annonces actives</p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-secondary-600">15 000+</p>
              <p className="text-sm text-gray-600">Utilisateurs</p>
            </div>
            <div className="bg-success-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-success-500">98%</p>
              <p className="text-sm text-gray-600">Satisfaction</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kit presse</h2>
          <p className="text-gray-600 mb-4">
            Téléchargez notre kit presse contenant le logo, les photos officielles
            et un dossier de présentation.
          </p>
          <button className="btn btn-outline flex items-center gap-2" onClick={() => alert('Kit presse bientôt disponible')}>
            <Download className="w-4 h-4" />
            Télécharger le kit presse
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact presse</h2>
          <p className="text-gray-600 mb-4">
            Pour toute demande d'interview, de partenariat média ou d'information complémentaire :
          </p>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary-500" />
            <span className="text-gray-700 font-medium">presse@immoparticuliers.fr</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
