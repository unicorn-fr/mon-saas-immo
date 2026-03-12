import { Link } from 'react-router-dom'
import { Check, X, Zap, Building2, Crown, ArrowRight, HelpCircle } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { useReveal } from '../hooks/useReveal'

// ─── Plan data ────────────────────────────────────────────────────────────────

interface Plan {
  id: string
  name: string
  price: string
  priceNote: string
  tagline: string
  cta: string
  ctaLink: string
  highlighted: boolean
  badge?: string
  icon: React.ElementType
  features: { label: string; included: boolean; note?: string }[]
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0 €',
    priceNote: 'pour toujours',
    tagline: 'Pour découvrir la plateforme et gérer un premier bien.',
    cta: 'Démarrer gratuitement',
    ctaLink: '/register',
    highlighted: false,
    icon: Building2,
    features: [
      { label: '1 annonce active', included: true },
      { label: 'Recherche & favoris', included: true },
      { label: 'Messagerie directe', included: true },
      { label: 'Réservation de visites', included: true },
      { label: 'Contrat de bail basique', included: true },
      { label: 'Dossier locataire numérique', included: true },
      { label: 'Annonces illimitées', included: false },
      { label: 'Priorité dans les résultats', included: false },
      { label: 'Signature électronique avancée', included: false },
      { label: 'Statistiques de performance', included: false },
      { label: 'Support prioritaire', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,90 €',
    priceNote: 'par mois, sans engagement',
    tagline: 'Pour les propriétaires qui gèrent plusieurs biens sérieusement.',
    cta: 'Essayer 14 jours gratuit',
    ctaLink: '/register?plan=pro',
    highlighted: true,
    badge: 'Le plus populaire',
    icon: Zap,
    features: [
      { label: 'Annonces illimitées', included: true },
      { label: 'Recherche & favoris', included: true },
      { label: 'Messagerie directe', included: true },
      { label: 'Réservation de visites', included: true },
      { label: 'Contrats & modèles complets', included: true, note: 'Bail, EDL, cautionnement' },
      { label: 'Dossier locataire numérique', included: true },
      { label: 'Priorité dans les résultats', included: true },
      { label: 'Signature électronique avancée', included: true },
      { label: 'Statistiques de performance', included: true },
      { label: 'Alertes locataires en temps réel', included: true },
      { label: 'Support prioritaire', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '29,90 €',
    priceNote: 'par mois, facturation annuelle',
    tagline: 'Pour les agences, marchands de biens et gestionnaires multi-patrimoines.',
    cta: "Contacter l'équipe commerciale",
    ctaLink: '/contact',
    highlighted: false,
    icon: Crown,
    features: [
      { label: 'Tout ce qui est dans Pro', included: true },
      { label: 'Gestion multi-utilisateurs', included: true, note: "Jusqu'à 10 comptes" },
      { label: 'API & intégrations', included: true, note: 'Logiciels tiers, CRM' },
      { label: 'Tableau de bord patrimoine', included: true },
      { label: 'Rapports PDF exportables', included: true },
      { label: 'Statistiques de performance', included: true },
      { label: 'Onboarding dédié', included: true },
      { label: 'Support prioritaire 7j/7', included: true },
      { label: 'SLA garanti', included: true },
      { label: 'Personnalisation marque blanche', included: true },
      { label: "Formation de l'équipe", included: true },
    ],
  },
]

const FAQ = [
  {
    q: 'Puis-je changer de formule à tout moment ?',
    a: "Oui. Le passage de Gratuit à Pro est immédiat. L'annulation prend effet à la fin de la période en cours — aucun remboursement prorata n'est effectué.",
  },
  {
    q: "La période d'essai Pro nécessite-t-elle une carte bancaire ?",
    a: 'Non. Vous créez votre compte et profitez de 14 jours complets en accès Pro, sans renseigner de moyen de paiement.',
  },
  {
    q: 'Comment fonctionne la facturation Enterprise ?',
    a: "L'offre Enterprise est facturée annuellement, ce qui représente une économie de 20 % par rapport à un tarif mensuel. Un devis personnalisé est disponible pour les structures de plus de 50 biens.",
  },
  {
    q: 'Les données de mes locataires sont-elles protégées ?',
    a: "L'ensemble des documents stockés sur notre plateforme est chiffré au repos (AES-256) et en transit (TLS 1.3). Nous sommes conformes RGPD et hébergeons nos données exclusivement en France.",
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function PlanCard({ plan, delay }: { plan: Plan; delay: number }) {
  const { ref, visible } = useReveal()
  const Icon = plan.icon

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative flex flex-col rounded-2xl border transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{
        transitionDelay: `${delay}ms`,
        backgroundColor: '#ffffff',
        borderColor: plan.highlighted ? '#007AFF' : '#d2d2d7',
        boxShadow: plan.highlighted
          ? '0 0 0 2px rgba(0,122,255,0.12), 0 8px 32px rgba(0,122,255,0.12)'
          : '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
        transform: plan.highlighted ? 'scale(1.02)' : undefined,
      }}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-[#007AFF] text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-7 flex-1 flex flex-col">
        {/* Plan header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: plan.highlighted ? '#e8f0fe' : '#f5f5f7' }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: plan.highlighted ? '#007AFF' : plan.id === 'enterprise' ? '#d97706' : '#86868b' }}
            />
          </div>
          <h3 className="font-bold text-lg text-[#1d1d1f]">{plan.name}</h3>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tracking-tight text-[#1d1d1f]">{plan.price}</span>
          </div>
          <p className="text-sm mt-0.5 text-[#86868b]">{plan.priceNote}</p>
        </div>

        <p className="text-sm mb-6 leading-relaxed text-[#515154]">{plan.tagline}</p>

        {/* CTA */}
        <Link
          to={plan.ctaLink}
          className={`w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-7`}
          style={
            plan.highlighted
              ? { backgroundColor: '#007AFF', color: '#ffffff' }
              : { backgroundColor: '#f5f5f7', color: '#515154', border: '1px solid #d2d2d7' }
          }
          onMouseEnter={e => {
            if (plan.highlighted) e.currentTarget.style.backgroundColor = '#0066d6'
            else e.currentTarget.style.backgroundColor = '#f0f0f2'
          }}
          onMouseLeave={e => {
            if (plan.highlighted) e.currentTarget.style.backgroundColor = '#007AFF'
            else e.currentTarget.style.backgroundColor = '#f5f5f7'
          }}
        >
          {plan.cta}
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {plan.features.map((f) => (
            <li key={f.label} className="flex items-start gap-2.5 text-sm">
              {f.included
                ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                : <X className="w-4 h-4 text-[#d2d2d7] flex-shrink-0 mt-0.5" />
              }
              <span style={{ color: f.included ? '#1d1d1f' : '#86868b' }}>
                {f.label}
                {f.note && (
                  <span className="block text-xs mt-0.5 text-[#86868b]">{f.note}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Pricing() {
  const heroReveal = useReveal()
  const faqReveal = useReveal()

  return (
    <Layout>
      <div style={{ backgroundColor: '#f5f5f7', fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}>

        {/* Hero */}
        <section
          ref={heroReveal.ref as React.RefObject<HTMLElement>}
          className={`pt-16 pb-12 text-center px-4 transition-all duration-700 ${
            heroReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#007AFF] mb-3">Tarifs</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[#1d1d1f]">
            Simple. Transparent. Sans surprise.
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-[#515154]">
            Que vous soyez propriétaire d'un studio ou gestionnaire d'un parc locatif, il existe une formule taillée pour vous — et une période d'essai pour en être certain.
          </p>
        </section>

        {/* Plans grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} delay={i * 120} />
            ))}
          </div>

          {/* Enterprise note */}
          <p className="text-center text-sm mt-8 text-[#86868b]">
            Vous gérez plus de 50 biens ?{' '}
            <Link to="/contact" className="text-[#007AFF] hover:underline font-medium">
              Demandez un devis sur mesure
            </Link>.
          </p>
        </section>

        {/* FAQ */}
        <section
          ref={faqReveal.ref as React.RefObject<HTMLElement>}
          className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 transition-all duration-700 ${
            faqReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-[#007AFF]" />
            <h2 className="text-xl font-bold text-[#1d1d1f]">Questions fréquentes</h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-[#d2d2d7] p-5 bg-white"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <p className="font-semibold text-sm mb-2 text-[#1d1d1f]">{item.q}</p>
                <p className="text-sm leading-relaxed text-[#515154]">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  )
}
