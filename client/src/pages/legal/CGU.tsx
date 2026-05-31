import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

export default function CGU() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody }}>

      {/* Hero */}
      <section style={{ backgroundColor: BAI.night, padding: '64px 16px 56px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ fontFamily: BAI.fontBody, fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', display: 'inline-flex' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <p
            style={{
              fontFamily: BAI.fontBody,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: BAI.caramel,
              marginBottom: '12px',
            }}
          >
            Légal
          </p>
          <h1
            style={{
              fontFamily: BAI.fontDisplay,
              fontStyle: 'italic',
              fontSize: 'clamp(26px, 7vw, 40px)',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '12px',
            }}
          >
            Conditions Générales d'Utilisation
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
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
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              1. Objet
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation
              de la plateforme Bailio accessible à l'adresse bailio.fr.
              En accédant au site, l'utilisateur accepte sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              2. Description des services
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Bailio est une plateforme de mise en relation entre propriétaires
              et locataires pour la location immobilière entre particuliers. Les services incluent :
            </p>
            <div
              style={{
                backgroundColor: BAI.bgMuted,
                borderLeft: `3px solid ${BAI.caramel}`,
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
                      fontFamily: BAI.fontBody,
                      fontSize: '14px',
                      color: BAI.inkMid,
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
                        backgroundColor: BAI.caramel,
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
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              3. Inscription
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              L'inscription est gratuite et ouverte à toute personne physique majeure.
              L'utilisateur s'engage à fournir des informations exactes et à jour.
              Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              4. Obligations des utilisateurs
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7, marginBottom: '14px' }}>
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
                    fontFamily: BAI.fontBody,
                    fontSize: '15px',
                    color: BAI.inkMid,
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
                      backgroundColor: BAI.border,
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
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              5. Responsabilité
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Bailio agit en tant qu'intermédiaire technique et n'est pas partie
              aux contrats de location conclus entre les utilisateurs. La plateforme ne peut
              être tenue responsable des litiges entre propriétaires et locataires.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              6. Propriété intellectuelle
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Les contenus publiés par les utilisateurs restent leur propriété. En publiant
              sur la plateforme, l'utilisateur accorde à Bailio une licence
              non exclusive d'utilisation pour les besoins du service.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontSize: '26px',
                fontWeight: 700,
                color: BAI.ink,
                marginBottom: '12px',
              }}
            >
              7. Résiliation
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              L'utilisateur peut supprimer son compte à tout moment depuis les paramètres
              de son profil. Bailio se réserve le droit de suspendre ou supprimer
              un compte en cas de manquement aux présentes CGU.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: '26px', fontWeight: 700, color: BAI.ink, marginBottom: '12px' }}>
              8. Statut juridique de la plateforme — Non-application de la loi Hoguet
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7, marginBottom: '12px' }}>
              <strong style={{ color: BAI.ink }}>Bailio n'est pas un agent immobilier</strong> et n'exerce
              pas d'activités soumises à la loi n°70-9 du 2 janvier 1970 dite « loi Hoguet ».
              Bailio n'est pas titulaire d'une carte professionnelle d'agent immobilier (carte T ou carte G)
              et n'en a pas besoin pour les activités qu'elle exerce.
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7, marginBottom: '12px' }}>
              Bailio est une <strong style={{ color: BAI.ink }}>plateforme d'intermédiation numérique</strong> au
              sens de l'article L.111-7 du Code de la consommation et du règlement européen 2022/2065
              (Digital Services Act). Elle met en relation directe des particuliers (propriétaires et locataires)
              sans intervenir dans la négociation ni détenir de fonds.
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Les contrats de bail sont conclus <strong style={{ color: BAI.ink }}>directement entre le propriétaire et le locataire</strong>,
              sans que Bailio ne soit partie au contrat. L'outil de génération de bail est fourni à titre
              d'aide à la rédaction et ne constitue pas un acte de mandataire au sens de la loi Hoguet.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: '26px', fontWeight: 700, color: BAI.ink, marginBottom: '12px' }}>
              9. Médiation de la consommation
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7, marginBottom: '12px' }}>
              Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, Bailio propose
              un dispositif de médiation de la consommation. En cas de litige non résolu avec le service client,
              l'utilisateur peut saisir gratuitement le médiateur compétent.
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Coordonnées du service client : <strong style={{ color: BAI.ink }}>contact@bailio.fr</strong>.
              La Commission européenne met à disposition une plateforme de règlement en ligne des litiges (RLL)
              accessible à l'adresse <strong style={{ color: BAI.ink }}>ec.europa.eu/consumers/odr</strong>.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: '26px', fontWeight: 700, color: BAI.ink, marginBottom: '12px' }}>
              10. Protection des données personnelles (RGPD)
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7, marginBottom: '12px' }}>
              Bailio collecte et traite des données personnelles en qualité de responsable de traitement
              au sens du RGPD (Règlement UE 2016/679). Les données collectées sont nécessaires au
              fonctionnement du service (création de compte, mise en relation, contrats, paiements).
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Vous disposez des droits d'accès, rectification, suppression, portabilité et opposition.
              Pour exercer ces droits : <strong style={{ color: BAI.ink }}>privacy@bailio.fr</strong>.
              Pour plus d'informations, consultez notre{' '}
              <a href="/politique-confidentialite" style={{ color: BAI.caramel }}>Politique de confidentialité</a>.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: '26px', fontWeight: 700, color: BAI.ink, marginBottom: '12px' }}>
              11. Modification des CGU
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
              Bailio se réserve le droit de modifier les présentes CGU à tout moment.
              Les utilisateurs seront informés par email de toute modification substantielle.
              La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles CGU.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
