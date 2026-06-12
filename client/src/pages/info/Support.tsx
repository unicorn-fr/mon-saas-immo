import { Link } from 'react-router-dom'
import { MessageCircle, Mail, FileText, Shield } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

const SUPPORT_LINKS = [
  {
    to: '/faq',
    icon: MessageCircle,
    title: 'FAQ',
    description: 'Consultez les questions les plus fréquemment posées par nos utilisateurs.',
    iconBg: BAI.bgMuted,
    iconColor: BAI.night,
  },
  {
    to: '/contact',
    icon: Mail,
    title: 'Nous contacter',
    description: 'Envoyez-nous un message et recevez une réponse sous 24h.',
    iconBg: BAI.bgMuted,
    iconColor: BAI.night,
  },
  {
    to: '/cgu',
    icon: FileText,
    title: 'Conditions d\'utilisation',
    description: 'Consultez nos CGU et nos conditions de service.',
    iconBg: BAI.caramelLight,
    iconColor: BAI.caramel,
  },
  {
    to: '/confidentialite',
    icon: Shield,
    title: 'Protection des données',
    description: 'Découvrez comment nous protégeons vos données personnelles.',
    iconBg: BAI.caramelLight,
    iconColor: BAI.caramel,
  },
]

export default function Support() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen" style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}>
        {/* Hero */}
        <section
          style={{
            background: '#0a0d1a',
            padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,48px) clamp(40px,6vw,60px)',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: BAI.caramel,
                margin: '0 0 10px',
              }}
            >
              Support
            </p>
            <h1
              style={{
                fontFamily: BAI.fontDisplay,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 'clamp(32px,6vw,52px)',
                color: '#ffffff',
                lineHeight: 1.1,
                margin: '8px 0 12px',
              }}
            >
              Centre d'aide
            </h1>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '15px',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.6,
                maxWidth: 520,
                margin: '0 auto',
              }}
            >
              Besoin d'assistance ? Trouvez rapidement l'aide dont vous avez besoin.
            </p>
          </div>
        </section>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {SUPPORT_LINKS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-start gap-4 group transition-shadow"
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: '12px',
                    padding: '24px',
                    textDecoration: 'none',
                    boxShadow: BAI.shadowMd,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = BAI.shadowLg
                    e.currentTarget.style.borderColor = BAI.borderStrong
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = BAI.shadowMd
                    e.currentTarget.style.borderColor = BAI.border
                  }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      background: item.iconBg,
                      borderRadius: '10px',
                    }}
                  >
                    <Icon style={{ width: '20px', height: '20px', color: item.iconColor }} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: BAI.fontBody,
                        fontWeight: 700,
                        fontSize: '16px',
                        color: BAI.ink,
                        marginBottom: '4px',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: BAI.fontBody,
                        fontSize: '14px',
                        color: BAI.inkMid,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Urgent help banner */}
          <div
            className="text-center py-12 px-8"
            style={{
              background: BAI.night,
              borderRadius: '12px',
            }}
          >
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '32px',
                color: '#ffffff',
                marginBottom: '10px',
              }}
            >
              Besoin d'aide urgente ?
            </h2>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '15px',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '24px',
                lineHeight: 1.6,
              }}
            >
              Notre équipe support est disponible du lundi au vendredi de 9h à 18h.
            </p>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: BAI.night,
                fontFamily: BAI.fontBody,
                fontWeight: 600,
                fontSize: '14px',
                padding: '10px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Contacter le support
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </Layout>
  )
}
