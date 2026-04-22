import { Link } from 'react-router-dom'
import { Check, X, Zap, Building2, Crown, ArrowRight, HelpCircle } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { useReveal } from '../hooks/useReveal'
import { BAI } from '../constants/bailio-tokens'

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
      className="relative flex flex-col transition-all duration-500"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible
          ? plan.highlighted ? 'translateY(0) scale(1.02)' : 'translateY(0)'
          : 'translateY(24px)',
        backgroundColor: BAI.bgSurface,
        border: plan.highlighted ? `2px solid ${BAI.night}` : `1px solid ${BAI.border}`,
        borderRadius: '12px',
        boxShadow: plan.highlighted
          ? '0 8px 40px rgba(26,26,46,0.14), 0 2px 8px rgba(26,26,46,0.08)'
          : '0 1px 4px rgba(13,12,10,0.05)',
        fontFamily: BAI.fontBody,
      }}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            style={{
              backgroundColor: BAI.night,
              color: '#ffffff',
              fontFamily: BAI.fontBody,
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              padding: '4px 14px',
              borderRadius: '100px',
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-7 flex-1 flex flex-col">
        {/* Plan header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: plan.highlighted ? BAI.night : BAI.bgMuted,
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{
                color: plan.highlighted ? '#ffffff' : plan.id === 'enterprise' ? BAI.caramel : BAI.inkFaint,
              }}
            />
          </div>
          <h3
            style={{
              fontFamily: BAI.fontDisplay,
              fontStyle: 'italic',
              fontSize: '22px',
              fontWeight: 700,
              color: BAI.ink,
            }}
          >
            {plan.name}
          </h3>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span
              style={{
                fontFamily: BAI.fontDisplay,
                fontSize: '56px',
                fontWeight: 600,
                color: BAI.ink,
                lineHeight: 1,
              }}
            >
              {plan.price}
            </span>
          </div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkFaint, marginTop: '4px' }}>
            {plan.priceNote}
          </p>
        </div>

        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: '14px',
            color: BAI.inkMid,
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          {plan.tagline}
        </p>

        {/* CTA */}
        <Link
          to={plan.ctaLink}
          className="w-full text-center flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          style={{
            fontFamily: BAI.fontBody,
            fontSize: '14px',
            fontWeight: 600,
            padding: '11px 20px',
            borderRadius: '8px',
            marginBottom: '28px',
            ...(plan.highlighted
              ? { backgroundColor: BAI.night, color: '#ffffff', border: 'none' }
              : { backgroundColor: 'transparent', color: BAI.inkMid, border: `1px solid ${BAI.border}` }),
          }}
        >
          {plan.cta}
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Separator */}
        <div style={{ height: '1px', backgroundColor: BAI.border, marginBottom: '20px' }} />

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {plan.features.map((f) => (
            <li key={f.label} className="flex items-start gap-2.5">
              {f.included ? (
                <Check
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: BAI.tenant }}
                />
              ) : (
                <X
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: BAI.border }}
                />
              )}
              <span style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: f.included ? BAI.ink : BAI.inkFaint }}>
                {f.label}
                {f.note && (
                  <span style={{ display: 'block', fontSize: '12px', color: BAI.inkFaint, marginTop: '1px' }}>
                    {f.note}
                  </span>
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
      <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody }}>

        {/* Hero */}
        <section
          style={{ backgroundColor: BAI.night, padding: '80px 16px 72px' }}
          className="text-center"
        >
          <div
            ref={heroReveal.ref as React.RefObject<HTMLDivElement>}
            className="transition-all duration-700"
            style={{ opacity: heroReveal.visible ? 1 : 0, transform: heroReveal.visible ? 'translateY(0)' : 'translateY(16px)' }}
          >
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: BAI.caramel,
                marginBottom: '16px',
              }}
            >
              Tarifs
            </p>
            <h1
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: 'clamp(38px, 5vw, 52px)',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '18px',
                lineHeight: 1.15,
              }}
            >
              Simple. Transparent. Sans surprise.
            </h1>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '16px',
                color: 'rgba(255,255,255,0.65)',
                maxWidth: '560px',
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              Que vous soyez propriétaire d'un studio ou gestionnaire d'un parc locatif, il existe une formule taillée pour vous — et une période d'essai pour en être certain.
            </p>
          </div>
        </section>

        {/* Plans grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} delay={i * 120} />
            ))}
          </div>

          {/* Enterprise note */}
          <p
            className="text-center"
            style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkFaint, marginTop: '32px' }}
          >
            Vous gérez plus de 50 biens ?{' '}
            <Link
              to="/contact"
              style={{ color: BAI.night, textDecoration: 'underline', fontWeight: 500 }}
            >
              Demandez un devis sur mesure
            </Link>.
          </p>
        </section>

        {/* FAQ */}
        <section
          ref={faqReveal.ref as React.RefObject<HTMLElement>}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700"
          style={{
            paddingBottom: '80px',
            opacity: faqReveal.visible ? 1 : 0,
            transform: faqReveal.visible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-8">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: BAI.caramelLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HelpCircle className="w-4 h-4" style={{ color: BAI.caramel }} />
            </div>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
              }}
            >
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                style={{
                  backgroundColor: BAI.bgSurface,
                  border: `1px solid ${BAI.border}`,
                  borderRadius: '12px',
                  padding: '20px 24px',
                }}
              >
                <p
                  style={{
                    fontFamily: BAI.fontBody,
                    fontSize: '15px',
                    fontWeight: 600,
                    color: BAI.ink,
                    marginBottom: '8px',
                  }}
                >
                  {item.q}
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid, lineHeight: 1.7 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  )
}
