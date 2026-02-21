import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'

export default function PolitiqueConfidentialite() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Politique de confidentialité</h1>

        <div className="bg-white rounded-xl shadow-card p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Collecte des données</h2>
            <p className="text-gray-600">
              ImmoParticuliers collecte les données personnelles suivantes lors de votre inscription
              et de votre utilisation du service :
            </p>
            <ul className="mt-3 space-y-2 text-gray-600 text-sm list-disc list-inside">
              <li>Nom, prénom et adresse email</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Données de connexion (adresse IP, navigateur)</li>
              <li>Documents d'identité (pour la vérification des propriétaires)</li>
              <li>Informations relatives aux biens immobiliers publiés</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Finalités du traitement</h2>
            <p className="text-gray-600">Vos données sont collectées pour :</p>
            <ul className="mt-3 space-y-2 text-gray-600 text-sm list-disc list-inside">
              <li>La création et la gestion de votre compte utilisateur</li>
              <li>La mise en relation entre propriétaires et locataires</li>
              <li>La vérification de l'identité des utilisateurs</li>
              <li>L'amélioration de nos services</li>
              <li>L'envoi de notifications relatives à votre activité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Base légale</h2>
            <p className="text-gray-600">
              Le traitement de vos données repose sur votre consentement lors de l'inscription,
              l'exécution du contrat de service, et nos obligations légales
              (notamment en matière de lutte contre la fraude).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Durée de conservation</h2>
            <p className="text-gray-600">
              Vos données personnelles sont conservées pendant la durée de votre inscription
              et pendant une durée de 3 ans après la suppression de votre compte,
              conformément aux obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Vos droits</h2>
            <p className="text-gray-600">
              Conformément au Règlement Général sur la Protection des Données (RGPD),
              vous disposez des droits suivants :
            </p>
            <ul className="mt-3 space-y-2 text-gray-600 text-sm list-disc list-inside">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (« droit à l'oubli »)</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition</li>
            </ul>
            <p className="text-gray-600 mt-3">
              Pour exercer ces droits, contactez-nous à : <strong>dpo@immoparticuliers.fr</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Sécurité</h2>
            <p className="text-gray-600">
              ImmoParticuliers met en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données contre tout accès non autorisé,
              modification, divulgation ou destruction. Les données sont chiffrées
              en transit (TLS) et au repos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact DPO</h2>
            <p className="text-gray-600">
              Pour toute question relative à la protection de vos données, vous pouvez contacter
              notre Délégué à la Protection des Données : <strong>dpo@immoparticuliers.fr</strong>
            </p>
          </section>
        </div>

        <p className="text-sm text-gray-400 text-center mt-8">Dernière mise à jour : Février 2026</p>
      </main>

      <Footer />
    </div>
  )
}
