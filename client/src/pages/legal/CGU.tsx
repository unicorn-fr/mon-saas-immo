import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'

export default function CGU() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions Générales d'Utilisation</h1>

        <div className="bg-white rounded-xl shadow-card p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Objet</h2>
            <p className="text-gray-600">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation
              de la plateforme ImmoParticuliers accessible à l'adresse immoparticuliers.fr.
              En accédant au site, l'utilisateur accepte sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description des services</h2>
            <p className="text-gray-600">
              ImmoParticuliers est une plateforme de mise en relation entre propriétaires
              et locataires pour la location immobilière entre particuliers. Les services incluent :
            </p>
            <ul className="mt-3 space-y-2 text-gray-600 text-sm list-disc list-inside">
              <li>Publication d'annonces de location</li>
              <li>Recherche de biens immobiliers</li>
              <li>Messagerie intégrée entre utilisateurs</li>
              <li>Gestion de dossiers de location dématérialisés</li>
              <li>Génération et signature électronique de baux</li>
              <li>État des lieux dématérialisé</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Inscription</h2>
            <p className="text-gray-600">
              L'inscription est gratuite et ouverte à toute personne physique majeure.
              L'utilisateur s'engage à fournir des informations exactes et à jour.
              Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Obligations des utilisateurs</h2>
            <p className="text-gray-600">L'utilisateur s'engage à :</p>
            <ul className="mt-3 space-y-2 text-gray-600 text-sm list-disc list-inside">
              <li>Ne publier que des annonces correspondant à des biens réels dont il est propriétaire ou mandataire</li>
              <li>Fournir des informations exactes sur les biens proposés à la location</li>
              <li>Respecter la législation en vigueur, notamment la loi Alur</li>
              <li>Ne pas utiliser la plateforme à des fins frauduleuses</li>
              <li>Respecter les autres utilisateurs dans les échanges</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Responsabilité</h2>
            <p className="text-gray-600">
              ImmoParticuliers agit en tant qu'intermédiaire technique et n'est pas partie
              aux contrats de location conclus entre les utilisateurs. La plateforme ne peut
              être tenue responsable des litiges entre propriétaires et locataires.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Propriété intellectuelle</h2>
            <p className="text-gray-600">
              Les contenus publiés par les utilisateurs restent leur propriété. En publiant
              sur la plateforme, l'utilisateur accorde à ImmoParticuliers une licence
              non exclusive d'utilisation pour les besoins du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Résiliation</h2>
            <p className="text-gray-600">
              L'utilisateur peut supprimer son compte à tout moment depuis les paramètres
              de son profil. ImmoParticuliers se réserve le droit de suspendre ou supprimer
              un compte en cas de manquement aux présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Modification des CGU</h2>
            <p className="text-gray-600">
              ImmoParticuliers se réserve le droit de modifier les présentes CGU à tout moment.
              Les utilisateurs seront informés par email de toute modification substantielle.
            </p>
          </section>
        </div>

        <p className="text-sm text-gray-400 text-center mt-8">Dernière mise à jour : Février 2026</p>
      </main>

      <Footer />
    </div>
  )
}
