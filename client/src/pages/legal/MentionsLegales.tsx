import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

function SectionH2({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </h2>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, lineHeight: 1.7 }}>
      {children}
    </p>
  )
}

export default function MentionsLegales() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody }}>

      {/* Hero */}
      <section style={{ backgroundColor: '#0a0d1a', padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,48px) clamp(40px,6vw,60px)' }}>
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
              fontSize: 'clamp(28px,5vw,44px)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '12px',
            }}
          >
            Mentions légales
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
            <SectionH2>1. Éditeur du site</SectionH2>
            <Body>
              Le site Bailio est édité par la société Bailio SAS,
              au capital de 10 000 euros, immatriculée au Registre du Commerce et des Sociétés
              de Paris sous le numéro RCS Paris XXX XXX XXX.
            </Body>
            <div
              style={{
                backgroundColor: BAI.bgMuted,
                borderLeft: `3px solid ${BAI.caramel}`,
                borderRadius: '0 8px 8px 0',
                padding: '16px 20px',
                marginTop: '16px',
              }}
            >
              <ul className="space-y-2.5">
                {[
                  { label: 'Siège social', value: '12 Rue de la Paix, 75002 Paris, France' },
                  { label: 'Directeur de la publication', value: '[Nom du directeur]' },
                  { label: 'Email', value: 'contact@bailio.fr' },
                  { label: 'Téléphone', value: '01 XX XX XX XX' },
                ].map(({ label, value }) => (
                  <li
                    key={label}
                    style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkMid, lineHeight: 1.6 }}
                  >
                    <span style={{ fontWeight: 600, color: BAI.ink }}>{label} : </span>
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <SectionH2>2. Hébergement</SectionH2>
            <Body>
              Le site est hébergé par Railway Corp., 340 S Lemon Ave, Suite 4133,
              Walnut CA 91789, États-Unis. Site : railway.app.
              Les données sont stockées en Europe (région EU West).
            </Body>
          </section>

          <section>
            <SectionH2>3. Propriété intellectuelle</SectionH2>
            <Body>
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, etc.)
              est la propriété exclusive d'Bailio SAS ou de ses partenaires.
              Toute reproduction, représentation, modification, publication ou adaptation
              de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.
            </Body>
          </section>

          <section>
            <SectionH2>4. Responsabilité</SectionH2>
            <Body>
              Bailio s'efforce de fournir des informations aussi précises que possible.
              Toutefois, elle ne pourra être tenue responsable des omissions, des inexactitudes
              et des carences dans la mise à jour. Bailio se réserve le droit de modifier
              le contenu du site à tout moment et sans préavis.
            </Body>
          </section>

          <section>
            <SectionH2>5. Statut de la plateforme</SectionH2>
            <Body>
              Bailio est une plateforme d'intermédiation numérique au sens de l'article L.111-7
              du Code de la consommation. Bailio n'est pas un agent immobilier et n'exerce pas
              d'activités soumises à la loi Hoguet du 2 janvier 1970. Les transactions et contrats
              sont conclus directement entre les utilisateurs ; Bailio n'est pas partie à ces actes.
            </Body>
          </section>

          <section>
            <SectionH2>6. Droit applicable</SectionH2>
            <Body>
              Les présentes mentions légales sont soumises au droit français. En cas de litige,
              et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
            </Body>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
