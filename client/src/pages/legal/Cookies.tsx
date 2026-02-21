import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'

export default function Cookies() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Politique de cookies</h1>

        <div className="bg-white rounded-xl shadow-card p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Qu'est-ce qu'un cookie ?</h2>
            <p className="text-gray-600">
              Un cookie est un petit fichier texte stocké sur votre terminal (ordinateur, tablette,
              smartphone) lors de votre visite sur notre site. Il permet de mémoriser des informations
              relatives à votre navigation pour améliorer votre expérience utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Cookies utilisés</h2>
            <div className="overflow-x-auto">
              <table className="w-full mt-3 text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Cookie</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Durée</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Finalité</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">auth_token</td>
                    <td className="py-2 pr-4">Essentiel</td>
                    <td className="py-2 pr-4">Session</td>
                    <td className="py-2">Authentification de l'utilisateur</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">refresh_token</td>
                    <td className="py-2 pr-4">Essentiel</td>
                    <td className="py-2 pr-4">7 jours</td>
                    <td className="py-2">Maintien de la connexion</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">preferences</td>
                    <td className="py-2 pr-4">Fonctionnel</td>
                    <td className="py-2 pr-4">1 an</td>
                    <td className="py-2">Mémorisation des préférences</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Gestion des cookies</h2>
            <p className="text-gray-600">
              Vous pouvez à tout moment modifier vos préférences en matière de cookies
              depuis les paramètres de votre navigateur. Voici les liens vers les instructions
              des principaux navigateurs :
            </p>
            <ul className="mt-3 space-y-2 text-gray-600 text-sm list-disc list-inside">
              <li>Google Chrome : Paramètres &gt; Confidentialité et sécurité &gt; Cookies</li>
              <li>Mozilla Firefox : Options &gt; Vie privée et sécurité</li>
              <li>Safari : Préférences &gt; Confidentialité</li>
              <li>Microsoft Edge : Paramètres &gt; Cookies et autorisations de site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Cookies tiers</h2>
            <p className="text-gray-600">
              Notre site n'utilise actuellement aucun cookie tiers à des fins publicitaires.
              Seuls les cookies strictement nécessaires au fonctionnement du service sont déposés.
            </p>
          </section>
        </div>

        <p className="text-sm text-gray-400 text-center mt-8">Dernière mise à jour : Février 2026</p>
      </main>

      <Footer />
    </div>
  )
}
