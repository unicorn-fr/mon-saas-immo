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

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: M.body, fontSize: '15px', color: M.inkMid, lineHeight: 1.7 }}>
      {children}
    </p>
  )
}

export default function MentionsLegales() {
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
            Mentions légales
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
            <SectionH2>1. Éditeur du site</SectionH2>
            <Body>
              Le site Bailio est édité par la société Bailio SAS,
              au capital de 10 000 euros, immatriculée au Registre du Commerce et des Sociétés
              de Paris sous le numéro RCS Paris XXX XXX XXX.
            </Body>
            <div
              style={{
                backgroundColor: M.muted,
                borderLeft: `3px solid ${M.caramel}`,
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
                    style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid, lineHeight: 1.6 }}
                  >
                    <span style={{ fontWeight: 600, color: M.ink }}>{label} : </span>
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <SectionH2>2. Hébergement</SectionH2>
            <Body>
              Le site est hébergé par OVH SAS, 2 Rue Kellermann, 59100 Roubaix, France.
              Téléphone : 1007.
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
            <SectionH2>5. Droit applicable</SectionH2>
            <Body>
              Les présentes mentions légales sont soumises au droit français. En cas de litige,
              les tribunaux français seront seuls compétents.
            </Body>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
