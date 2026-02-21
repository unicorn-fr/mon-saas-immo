import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'

export default function MentionsLegales() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions légales</h1>

        <div className="bg-white rounded-xl shadow-card p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Éditeur du site</h2>
            <p className="text-gray-600">
              Le site ImmoParticuliers est édité par la société ImmoParticuliers SAS,
              au capital de 10 000 euros, immatriculée au Registre du Commerce et des Sociétés
              de Paris sous le numéro RCS Paris XXX XXX XXX.
            </p>
            <ul className="mt-3 space-y-1 text-gray-600 text-sm">
              <li><strong>Siège social :</strong> 12 Rue de la Paix, 75002 Paris, France</li>
              <li><strong>Directeur de la publication :</strong> [Nom du directeur]</li>
              <li><strong>Email :</strong> contact@immoparticuliers.fr</li>
              <li><strong>Téléphone :</strong> 01 XX XX XX XX</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Hébergement</h2>
            <p className="text-gray-600">
              Le site est hébergé par OVH SAS, 2 Rue Kellermann, 59100 Roubaix, France.
              Téléphone : 1007.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Propriété intellectuelle</h2>
            <p className="text-gray-600">
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, etc.)
              est la propriété exclusive d'ImmoParticuliers SAS ou de ses partenaires.
              Toute reproduction, représentation, modification, publication ou adaptation
              de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Responsabilité</h2>
            <p className="text-gray-600">
              ImmoParticuliers s'efforce de fournir des informations aussi précises que possible.
              Toutefois, elle ne pourra être tenue responsable des omissions, des inexactitudes
              et des carences dans la mise à jour. ImmoParticuliers se réserve le droit de modifier
              le contenu du site à tout moment et sans préavis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Droit applicable</h2>
            <p className="text-gray-600">
              Les présentes mentions légales sont soumises au droit français. En cas de litige,
              les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>

        <p className="text-sm text-gray-400 text-center mt-8">Dernière mise à jour : Février 2026</p>
      </main>

      <Footer />
    </div>
  )
}
