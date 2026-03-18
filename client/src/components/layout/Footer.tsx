import { Link } from 'react-router-dom'

const fontBody    = "'DM Sans', system-ui, sans-serif"
const night       = '#1a1a2e'
const caramel     = '#c4976a'

const NAV = [
  {
    heading: 'Plateforme',
    links: [
      { to: '/search',   label: 'Annonces' },
      { to: '/pricing',  label: 'Tarifs' },
      { to: '/register', label: "S'inscrire" },
    ],
  },
  {
    heading: 'Ressources',
    links: [
      { to: '/faq',     label: 'FAQ' },
      { to: '/support', label: 'Support' },
      { to: '/contact', label: 'Contact' },
      { to: '/presse',  label: 'Presse' },
    ],
  },
  {
    heading: 'Légal',
    links: [
      { to: '/cgu',              label: 'CGU' },
      { to: '/confidentialite',  label: 'Confidentialité' },
      { to: '/cookies',          label: 'Cookies' },
      { to: '/mentions-legales', label: 'Mentions légales' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ backgroundColor: night, padding: '64px 24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 40,
            paddingBottom: 48,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Brand */}
          <div>
            <Link
              to="/"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: 2, marginBottom: 16 }}
            >
              <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 18, color: '#f5f4f0', letterSpacing: '-0.02em' }}>
                Bailio
              </span>
            </Link>
            <p style={{ fontFamily: fontBody, fontSize: 14, color: 'rgba(255,255,255,0.40)', lineHeight: 1.65, maxWidth: 260, margin: '0 0 24px' }}>
              La plateforme de location immobilière entre particuliers. Simple, sécurisée, sans intermédiaire.
            </p>
            <p style={{ fontFamily: fontBody, fontSize: 12, color: caramel, opacity: 0.8, margin: 0, fontStyle: 'italic' }}>
              Hébergé en France · RGPD conforme
            </p>
          </div>

          {/* Nav columns */}
          {NAV.map(({ heading, links }) => (
            <div key={heading}>
              <p style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', marginBottom: 20 }}>
                {heading}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      style={{ fontFamily: fontBody, fontSize: 14, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f5f4f0' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 28px', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: 0 }}>
            © {new Date().getFullYear()} Bailio. Tous droits réservés.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { to: '/cgu',             label: 'CGU' },
              { to: '/confidentialite', label: 'Vie privée' },
              { to: '/cookies',         label: 'Cookies' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{ fontFamily: fontBody, fontSize: 12, color: 'rgba(255,255,255,0.28)', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
