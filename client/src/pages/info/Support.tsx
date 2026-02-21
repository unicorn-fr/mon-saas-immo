import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft, MessageCircle, Mail, FileText, Shield } from 'lucide-react'
import Footer from '../../components/layout/Footer'

export default function Support() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Centre d'aide</h1>
          <p className="text-gray-500">Besoin d'assistance ? Trouvez rapidement l'aide dont vous avez besoin.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Link to="/faq" className="card hover:border-primary-200 border-2 border-transparent transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">FAQ</h3>
                <p className="text-sm text-gray-600">Consultez les questions les plus fréquemment posées par nos utilisateurs.</p>
              </div>
            </div>
          </Link>

          <Link to="/contact" className="card hover:border-secondary-200 border-2 border-transparent transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-secondary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Nous contacter</h3>
                <p className="text-sm text-gray-600">Envoyez-nous un message et recevez une réponse sous 24h.</p>
              </div>
            </div>
          </Link>

          <Link to="/cgu" className="card hover:border-primary-200 border-2 border-transparent transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-warning-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Conditions d'utilisation</h3>
                <p className="text-sm text-gray-600">Consultez nos CGU et nos conditions de service.</p>
              </div>
            </div>
          </Link>

          <Link to="/confidentialite" className="card hover:border-secondary-200 border-2 border-transparent transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-success-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Protection des données</h3>
                <p className="text-sm text-gray-600">Découvrez comment nous protégeons vos données personnelles.</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-3">Besoin d'aide urgente ?</h2>
          <p className="text-white/80 mb-5">Notre équipe support est disponible du lundi au vendredi de 9h à 18h.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-colors">
            Contacter le support
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
