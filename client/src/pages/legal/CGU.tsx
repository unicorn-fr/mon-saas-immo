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

export default function CGU() {
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
            Conditions Générales d'Utilisation
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
              1. Objet
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation
              de la plateforme Bailio accessible à l'adresse bailio.fr.
              En accédant au site, l'utilisateur accepte sans réserve les présentes CGU.
            </p>
          </section>

          <section>
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
              2. Description des services
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Bailio est une plateforme de mise en relation entre propriétaires
              et locataires pour la location immobilière entre particuliers. Les services incluent :
            </p>
            <div
              style={{
                backgroundColor: M.muted,
                borderLeft: `3px solid ${M.caramel}`,
                borderRadius: '0 8px 8px 0',
                padding: '16px 20px',
                marginTop: '14px',
              }}
            >
              <ul className="space-y-2">
                {[
                  'Publication d\'annonces de location',
                  'Recherche de biens immobiliers',
                  'Messagerie intégrée entre utilisateurs',
                  'Gestion de dossiers de location dématérialisés',
                  'Génération et signature électronique de baux',
                  'État des lieux dématérialisé',
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      fontFamily: M.body,
                      fontSize: '14px',
                      color: M.inkMid,
                      lineHeight: 1.6,
                      paddingLeft: '16px',
                      position: 'relative' as const,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute' as const,
                        left: 0,
                        top: '8px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: M.caramel,
                        display: 'inline-block',
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
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
              3. Inscription
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              L'inscription est gratuite et ouverte à toute personne physique majeure.
              L'utilisateur s'engage à fournir des informations exactes et à jour.
              Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion.
            </p>
          </section>

          <section>
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
              4. Obligations des utilisateurs
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7, marginBottom: '14px' }}>
              L'utilisateur s'engage à :
            </p>
            <ul className="space-y-2.5">
              {[
                'Ne publier que des annonces correspondant à des biens réels dont il est propriétaire ou mandataire',
                'Fournir des informations exactes sur les biens proposés à la location',
                'Respecter la législation en vigueur, notamment la loi Alur',
                'Ne pas utiliser la plateforme à des fins frauduleuses',
                'Respecter les autres utilisateurs dans les échanges',
              ].map((item) => (
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
          </section>

          <section>
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
              5. Responsabilité
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Bailio agit en tant qu'intermédiaire technique et n'est pas partie
              aux contrats de location conclus entre les utilisateurs. La plateforme ne peut
              être tenue responsable des litiges entre propriétaires et locataires.
            </p>
          </section>

          <section>
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
              6. Propriété intellectuelle
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Les contenus publiés par les utilisateurs restent leur propriété. En publiant
              sur la plateforme, l'utilisateur accorde à Bailio une licence
              non exclusive d'utilisation pour les besoins du service.
            </p>
          </section>

          <section>
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
              7. Résiliation
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              L'utilisateur peut supprimer son compte à tout moment depuis les paramètres
              de son profil. Bailio se réserve le droit de suspendre ou supprimer
              un compte en cas de manquement aux présentes CGU.
            </p>
          </section>

          <section>
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
              8. Modification des CGU
            </h2>
            <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
              Bailio se réserve le droit de modifier les présentes CGU à tout moment.
              Les utilisateurs seront informés par email de toute modification substantielle.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
