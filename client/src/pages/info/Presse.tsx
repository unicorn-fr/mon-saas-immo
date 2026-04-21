import { Download, Mail } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

const STATS = [
  { value: '10 000+', label: 'Annonces actives' },
  { value: '15 000+', label: 'Utilisateurs' },
  { value: '98%', label: 'Satisfaction' },
]

export default function Presse() {
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
              Espace presse
            </h1>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '16px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
              }}
            >
              Retrouvez toutes les informations sur Bailio pour vos articles et reportages.
            </p>
          </div>
        </section>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
          {/* About section */}
          <div
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: '12px',
              padding: '40px',
            }}
          >
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '32px',
                color: BAI.ink,
                marginBottom: '16px',
              }}
            >
              À propos d'Bailio
            </h2>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '15px',
                color: BAI.inkMid,
                lineHeight: 1.7,
                marginBottom: '32px',
              }}
            >
              Fondée en 2024, Bailio est la première plateforme française dédiée
              à la location immobilière entre particuliers. Notre mission : simplifier
              le marché locatif en supprimant les intermédiaires tout en garantissant
              une sécurité maximale.
            </p>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center"
                  style={{
                    background: BAI.bgMuted,
                    borderRadius: '10px',
                    padding: '24px 16px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: BAI.fontDisplay,
                      fontWeight: 700,
                      fontSize: '48px',
                      color: BAI.ink,
                      lineHeight: 1,
                      marginBottom: '8px',
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    style={{
                      fontFamily: BAI.fontBody,
                      fontSize: '13px',
                      color: BAI.inkMid,
                      margin: 0,
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Press kit section */}
          <div
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: '12px',
              padding: '40px',
            }}
          >
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '32px',
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              Kit presse
            </h2>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '15px',
                color: BAI.inkMid,
                lineHeight: 1.7,
                marginBottom: '24px',
              }}
            >
              Téléchargez notre kit presse contenant le logo, les photos officielles
              et un dossier de présentation.
            </p>
            <button
              onClick={() => alert('Kit presse bientôt disponible')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: BAI.caramel,
                color: '#ffffff',
                fontFamily: BAI.fontBody,
                fontWeight: 600,
                fontSize: '14px',
                padding: '11px 22px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Download style={{ width: '15px', height: '15px' }} />
              Télécharger le kit presse
            </button>
          </div>

          {/* Press contact section */}
          <div
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: '12px',
              padding: '40px',
            }}
          >
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '32px',
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              Contact presse
            </h2>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: '15px',
                color: BAI.inkMid,
                lineHeight: 1.7,
                marginBottom: '20px',
              }}
            >
              Pour toute demande d'interview, de partenariat média ou d'information complémentaire :
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '40px',
                  height: '40px',
                  background: BAI.bgMuted,
                  borderRadius: '10px',
                }}
              >
                <Mail style={{ width: '17px', height: '17px', color: BAI.night }} />
              </div>
              <span
                style={{
                  fontFamily: BAI.fontBody,
                  fontWeight: 600,
                  fontSize: '15px',
                  color: BAI.ink,
                }}
              >
                presse@bailio.fr
              </span>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </Layout>
  )
}
