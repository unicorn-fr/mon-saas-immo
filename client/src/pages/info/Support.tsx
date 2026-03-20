import { Link } from 'react-router-dom'
import { MessageCircle, Mail, FileText, Shield } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import Footer from '../../components/layout/Footer'

const M = {
  bg: '#fafaf8',
  surface: '#ffffff',
  muted: '#f4f2ee',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  caramel: '#c4976a',
  caramelLight: '#fdf5ec',
  border: '#e4e1db',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

const SUPPORT_LINKS = [
  {
    to: '/faq',
    icon: MessageCircle,
    title: 'FAQ',
    description: 'Consultez les questions les plus fréquemment posées par nos utilisateurs.',
    iconBg: M.muted,
    iconColor: M.night,
  },
  {
    to: '/contact',
    icon: Mail,
    title: 'Nous contacter',
    description: 'Envoyez-nous un message et recevez une réponse sous 24h.',
    iconBg: M.muted,
    iconColor: M.night,
  },
  {
    to: '/cgu',
    icon: FileText,
    title: 'Conditions d\'utilisation',
    description: 'Consultez nos CGU et nos conditions de service.',
    iconBg: M.caramelLight,
    iconColor: M.caramel,
  },
  {
    to: '/confidentialite',
    icon: Shield,
    title: 'Protection des données',
    description: 'Découvrez comment nous protégeons vos données personnelles.',
    iconBg: M.caramelLight,
    iconColor: M.caramel,
  },
]

export default function Support() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen" style={{ background: M.bg, fontFamily: M.body }}>
        {/* Hero */}
        <section
          className="py-20 px-4 text-center"
          style={{ background: M.night }}
        >
          <div className="max-w-3xl mx-auto">
            <h1
              style={{
                fontFamily: M.display,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '52px',
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '16px',
              }}
            >
              Centre d'aide
            </h1>
            <p
              style={{
                fontFamily: M.body,
                fontSize: '16px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
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
                    background: M.surface,
                    border: `1px solid ${M.border}`,
                    borderRadius: '12px',
                    padding: '24px',
                    textDecoration: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                    e.currentTarget.style.borderColor = '#c8c4bc'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                    e.currentTarget.style.borderColor = M.border
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
                        fontFamily: M.body,
                        fontWeight: 600,
                        fontSize: '15px',
                        color: M.ink,
                        marginBottom: '4px',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: M.body,
                        fontSize: '14px',
                        color: M.inkMid,
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
              background: M.night,
              borderRadius: '12px',
            }}
          >
            <h2
              style={{
                fontFamily: M.display,
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
                fontFamily: M.body,
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
                color: M.night,
                fontFamily: M.body,
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
