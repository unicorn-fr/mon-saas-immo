import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft, ChevronDown } from 'lucide-react'
import Footer from '../../components/layout/Footer'

const FAQ_ITEMS = [
  {
    category: 'Général',
    questions: [
      {
        q: 'Qu\'est-ce qu\'ImmoParticuliers ?',
        a: 'ImmoParticuliers est une plateforme de mise en relation directe entre propriétaires et locataires. Elle permet de publier des annonces, rechercher des biens, constituer des dossiers de location et signer des baux électroniquement, le tout sans frais d\'agence.',
      },
      {
        q: 'L\'inscription est-elle gratuite ?',
        a: 'Oui, l\'inscription est entièrement gratuite pour les propriétaires comme pour les locataires. La publication d\'annonces est également gratuite.',
      },
      {
        q: 'Comment fonctionne la vérification des profils ?',
        a: 'Les propriétaires doivent fournir une pièce d\'identité et un justificatif de propriété avant de pouvoir publier une annonce. Les locataires peuvent constituer un dossier sécurisé avec leurs documents certifiés.',
      },
    ],
  },
  {
    category: 'Pour les propriétaires',
    questions: [
      {
        q: 'Comment publier une annonce ?',
        a: 'Créez votre compte en tant que propriétaire, puis cliquez sur "Publier une annonce". Remplissez les informations du bien, ajoutez vos photos, et fournissez les documents de vérification requis. Votre annonce sera en ligne une fois validée.',
      },
      {
        q: 'Comment fonctionne le contrat de location ?',
        a: 'Notre plateforme génère un bail conforme à la loi Alur avec toutes les clauses obligatoires. Vous pouvez le personnaliser, puis l\'envoyer au locataire pour signature électronique.',
      },
      {
        q: 'Qu\'est-ce que la garantie loyers impayés ?',
        a: 'C\'est une assurance optionnelle qui vous protège en cas de défaut de paiement de votre locataire. Elle couvre les loyers impayés et les éventuels frais de procédure.',
      },
    ],
  },
  {
    category: 'Pour les locataires',
    questions: [
      {
        q: 'Comment contacter un propriétaire ?',
        a: 'Depuis la page d\'un bien, cliquez sur "Contacter le propriétaire". Vous pourrez envoyer un message directement via notre messagerie intégrée.',
      },
      {
        q: 'Comment constituer mon dossier de location ?',
        a: 'Dans votre espace locataire, accédez à la section "Mon dossier". Vous pourrez y télécharger vos justificatifs (identité, revenus, emploi, etc.) de manière sécurisée.',
      },
      {
        q: 'Y a-t-il des frais pour les locataires ?',
        a: 'Non, l\'utilisation de la plateforme est 100% gratuite pour les locataires. Aucun frais d\'agence ne vous sera demandé.',
      },
    ],
  },
  {
    category: 'Sécurité',
    questions: [
      {
        q: 'Mes données sont-elles sécurisées ?',
        a: 'Oui, nous utilisons un chiffrement de bout en bout pour protéger vos données. Vos documents personnels sont stockés de manière sécurisée et ne sont accessibles qu\'aux personnes autorisées.',
      },
      {
        q: 'Comment signaler un problème ou une fraude ?',
        a: 'Vous pouvez signaler tout comportement suspect via le bouton "Signaler" présent sur chaque annonce et profil, ou en contactant directement notre équipe support.',
      },
    ],
  },
]

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Foire aux questions</h1>
          <p className="text-gray-500">Retrouvez les réponses aux questions les plus fréquentes</p>
        </div>

        <div className="space-y-8">
          {FAQ_ITEMS.map((category) => (
            <div key={category.category}>
              <h2 className="text-lg font-semibold text-primary-600 mb-4">{category.category}</h2>
              <div className="space-y-3">
                {category.questions.map((item) => {
                  const key = `${category.category}-${item.q}`
                  const isOpen = openItems.has(key)
                  return (
                    <div key={key} className="bg-white rounded-xl shadow-card overflow-hidden">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <p className="text-gray-600 text-sm">{item.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 p-6 bg-white rounded-xl shadow-card">
          <p className="text-gray-600 mb-3">Vous n'avez pas trouvé la réponse à votre question ?</p>
          <Link to="/contact" className="btn btn-primary">
            Contactez-nous
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
