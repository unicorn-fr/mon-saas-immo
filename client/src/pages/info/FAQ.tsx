import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

const FAQ_ITEMS = [
  {
    category: 'Général',
    questions: [
      {
        q: 'Qu\'est-ce qu\'Bailio ?',
        a: 'Bailio est une plateforme de mise en relation directe entre propriétaires et locataires. Elle permet de publier des annonces, rechercher des biens, constituer des dossiers de location et signer des baux électroniquement, le tout sans frais d\'agence.',
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
    <Layout showFooter={false}>
      <div className="min-h-screen" style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}>
        {/* Hero */}
        <section
          className="py-20 px-4 text-center"
          style={{ background: BAI.night }}
        >
          <div className="max-w-3xl mx-auto">
            <h1
              style={{
                fontFamily: BAI.fontDisplay,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '52px',
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '16px',
              }}
            >
              Foire aux questions
            </h1>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '16px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
              }}
            >
              Retrouvez les réponses aux questions les plus fréquentes
            </p>
          </div>
        </section>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-12">
            {FAQ_ITEMS.map((category) => (
              <div key={category.category}>
                {/* Category pill */}
                <div className="mb-5">
                  <span
                    style={{
                      display: 'inline-block',
                      background: BAI.bgMuted,
                      color: BAI.inkFaint,
                      fontFamily: BAI.fontBody,
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      padding: '4px 12px',
                      borderRadius: '100px',
                    }}
                  >
                    {category.category}
                  </span>
                </div>

                <div className="space-y-2">
                  {category.questions.map((item) => {
                    const key = `${category.category}-${item.q}`
                    const isOpen = openItems.has(key)
                    return (
                      <div
                        key={key}
                        style={{
                          background: BAI.bgSurface,
                          border: `1px solid ${BAI.border}`,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          borderLeft: isOpen ? `3px solid ${BAI.night}` : `1px solid ${BAI.border}`,
                          transition: 'border 0.15s ease',
                        }}
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between text-left transition-colors"
                          style={{
                            padding: '18px 20px',
                            background: 'transparent',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: BAI.fontBody,
                              fontWeight: 600,
                              fontSize: '15px',
                              color: BAI.ink,
                              paddingRight: '16px',
                            }}
                          >
                            {item.q}
                          </span>
                          <ChevronDown
                            className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            style={{ width: '18px', height: '18px', color: BAI.inkFaint }}
                          />
                        </button>
                        {isOpen && (
                          <div
                            style={{
                              borderTop: `1px solid ${BAI.border}`,
                              padding: '16px 20px 20px',
                            }}
                          >
                            <p
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: '14px',
                                color: BAI.inkMid,
                                lineHeight: 1.7,
                                margin: 0,
                              }}
                            >
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* CTA bottom */}
          <div
            className="text-center mt-14 py-10 px-8"
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: '12px',
            }}
          >
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '15px',
                color: BAI.inkMid,
                marginBottom: '20px',
              }}
            >
              Vous n'avez pas trouvé la réponse à votre question ?
            </p>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: BAI.night,
                color: '#ffffff',
                fontFamily: BAI.fontBody,
                fontWeight: 600,
                fontSize: '14px',
                padding: '10px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Contactez-nous
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </Layout>
  )
}
