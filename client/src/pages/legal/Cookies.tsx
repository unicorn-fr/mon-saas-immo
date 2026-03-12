import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'

export default function Cookies() {
  return (
    <div className="min-h-screen" style={{ background: '#f5f5f7' }}>
      <header className="bg-white border-b border-[#d2d2d7]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 lg:p-12">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Politique de cookies</h1>
          <p className="text-sm text-slate-400 mb-8">Dernière mise à jour : Février 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">1. Qu'est-ce qu'un cookie ?</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Un cookie est un petit fichier texte stocké sur votre terminal (ordinateur, tablette,
                smartphone) lors de votre visite sur notre site. Il permet de mémoriser des informations
                relatives à votre navigation pour améliorer votre expérience utilisateur.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">2. Cookies utilisés</h2>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#d2d2d7]">
                      <th className="text-left py-3 pr-4 font-semibold text-slate-900">Cookie</th>
                      <th className="text-left py-3 pr-4 font-semibold text-slate-900">Type</th>
                      <th className="text-left py-3 pr-4 font-semibold text-slate-900">Durée</th>
                      <th className="text-left py-3 font-semibold text-slate-900">Finalité</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-b border-[#f0f0f2]">
                      <td className="py-3 pr-4 font-mono text-xs">auth_token</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 bg-[#e8f0fe] text-[#007AFF] rounded text-xs font-medium">Essentiel</span>
                      </td>
                      <td className="py-3 pr-4">Session</td>
                      <td className="py-3">Authentification de l'utilisateur</td>
                    </tr>
                    <tr className="border-b border-[#f0f0f2]">
                      <td className="py-3 pr-4 font-mono text-xs">refresh_token</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 bg-[#e8f0fe] text-[#007AFF] rounded text-xs font-medium">Essentiel</span>
                      </td>
                      <td className="py-3 pr-4">7 jours</td>
                      <td className="py-3">Maintien de la connexion</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-mono text-xs">preferences</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">Fonctionnel</span>
                      </td>
                      <td className="py-3 pr-4">1 an</td>
                      <td className="py-3">Mémorisation des préférences</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">3. Gestion des cookies</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Vous pouvez à tout moment modifier vos préférences en matière de cookies
                depuis les paramètres de votre navigateur. Voici les liens vers les instructions
                des principaux navigateurs :
              </p>
              <ul className="mt-3 space-y-1.5 text-slate-600 text-sm list-disc list-inside leading-relaxed">
                <li>Google Chrome : Paramètres &gt; Confidentialité et sécurité &gt; Cookies</li>
                <li>Mozilla Firefox : Options &gt; Vie privée et sécurité</li>
                <li>Safari : Préférences &gt; Confidentialité</li>
                <li>Microsoft Edge : Paramètres &gt; Cookies et autorisations de site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">4. Cookies tiers</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Notre site n'utilise actuellement aucun cookie tiers à des fins publicitaires.
                Seuls les cookies strictement nécessaires au fonctionnement du service sont déposés.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
