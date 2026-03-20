import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'

// ─── Maison tokens ────────────────────────────────────────────────────────────

const M = {
  bg: '#fafaf8', surface: '#ffffff', muted: '#f4f2ee',
  ink: '#0d0c0a', inkMid: '#5a5754', inkFaint: '#9e9b96',
  night: '#1a1a2e', caramel: '#c4976a',
  border: '#e4e1db',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

function SectionH2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: M.display,
        fontStyle: 'italic',
        fontSize: '26px',
        fontWeight: 700,
        color: M.ink,
        marginBottom: '12px',
      }}
    >
      {children}
    </h2>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5" style={{ marginTop: '14px' }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            fontFamily: M.body,
            fontSize: '15px',
            color: M.inkMid,
            lineHeight: 1.6,
            paddingLeft: '20px',
            position: 'relative' as const,
          }}
        >
          <span
            style={{
              position: 'absolute' as const,
              left: 0,
              top: '9px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: M.border,
              display: 'inline-block',
            }}
          />
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function PolitiqueConfidentialite() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: M.bg, fontFamily: M.body }}>

      {/* Hero */}
      <section style={{ backgroundColor: M.night, padding: '64px 16px 56px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ fontFamily: M.body, fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', display: 'inline-flex' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <p
            style={{
              fontFamily: M.body,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: M.caramel,
              marginBottom: '12px',
            }}
          >
            Légal
          </p>
          <h1
            style={{
              fontFamily: M.display,
              fontStyle: 'italic',
              fontSize: '40px',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '12px',
            }}
          >
            Politique de confidentialité
          </h1>
          <p style={{ fontFamily: M.body, fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
            Dernière mise à jour : Février 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '56px 16px 80px' }}>
        <div className="space-y-10">

          <section>
            <SectionH2>1. Collecte des données</SectionH2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Bailio collecte les données personnelles suivantes lors de votre inscription
              et de votre utilisation du service :
            </p>
            <BulletList
              items={[
                'Nom, prénom et adresse email',
                'Numéro de téléphone (optionnel)',
                'Données de connexion (adresse IP, navigateur)',
                'Documents d\'identité (pour la vérification des propriétaires)',
                'Informations relatives aux biens immobiliers publiés',
              ]}
            />
          </section>

          <section>
            <SectionH2>2. Finalités du traitement</SectionH2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Vos données sont collectées pour :
            </p>
            <BulletList
              items={[
                'La création et la gestion de votre compte utilisateur',
                'La mise en relation entre propriétaires et locataires',
                'La vérification de l\'identité des utilisateurs',
                'L\'amélioration de nos services',
                'L\'envoi de notifications relatives à votre activité',
              ]}
            />
          </section>

          <section>
            <SectionH2>3. Base légale</SectionH2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Le traitement de vos données repose sur votre consentement lors de l'inscription,
              l'exécution du contrat de service, et nos obligations légales
              (notamment en matière de lutte contre la fraude).
            </p>
          </section>

          <section>
            <SectionH2>4. Durée de conservation</SectionH2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Vos données personnelles sont conservées pendant la durée de votre inscription
              et pendant une durée de 3 ans après la suppression de votre compte,
              conformément aux obligations légales.
            </p>
          </section>

          <section>
            <SectionH2>5. Vos droits</SectionH2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Conformément au Règlement Général sur la Protection des Données (RGPD),
              vous disposez des droits suivants :
            </p>
            <BulletList
              items={[
                'Droit d\'accès à vos données personnelles',
                'Droit de rectification',
                'Droit à l\'effacement (« droit à l\'oubli »)',
                'Droit à la limitation du traitement',
                'Droit à la portabilité des données',
                'Droit d\'opposition',
              ]}
            />
            <div
              style={{
                backgroundColor: M.muted,
                borderLeft: `3px solid ${M.caramel}`,
                borderRadius: '0 8px 8px 0',
                padding: '14px 20px',
                marginTop: '20px',
              }}
            >
              <p style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid, lineHeight: 1.6 }}>
                Pour exercer ces droits, contactez-nous à :{' '}
                <strong style={{ color: M.ink, fontWeight: 600 }}>dpo@bailio.fr</strong>
              </p>
            </div>
          </section>

          <section>
            <SectionH2>6. Sécurité</SectionH2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Bailio met en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données contre tout accès non autorisé,
              modification, divulgation ou destruction. Les données sont chiffrées
              en transit (TLS) et au repos.
            </p>
          </section>

          <section>
            <SectionH2>7. Contact DPO</SectionH2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Pour toute question relative à la protection de vos données, vous pouvez contacter
              notre Délégué à la Protection des Données :{' '}
              <strong style={{ color: M.ink, fontWeight: 600 }}>dpo@bailio.fr</strong>
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
