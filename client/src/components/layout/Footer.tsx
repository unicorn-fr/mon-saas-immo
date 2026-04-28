import { Link } from 'react-router-dom'

const fontDisplay = "'Cormorant Garamond', Georgia, serif"
const fontBody    = "'DM Sans', system-ui, sans-serif"
const night       = '#1a1a2e'
const caramel     = '#c4976a'

const COLUMNS = [
  {
    heading: 'Produit',
    links: [
      { to: '/proprietaires', label: 'Propriétaires' },
      { to: '/locataires',    label: 'Locataires' },
      { to: '/pricing',       label: 'Tarifs' },
      { to: '/search',        label: 'Chercher un bien' },
    ],
  },
  {
    heading: 'Ressources',
    links: [
      { to: '/faq',     label: 'Questions fréquentes' },
      { to: '/support', label: 'Support' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Société',
    links: [
      { to: '/a-propos',       label: 'À propos' },
      { to: '/contact',        label: 'Contact' },
      { to: '/presse',         label: 'Presse' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ background: night, color: 'rgba(255,255,255,0.7)', padding: '80px 0 36px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'clamp(32px,5vw,48px)',
          marginBottom: 48,
          paddingBottom: 48,
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}>

          {/* Brand */}
          <div style={{ gridColumn: '1 / span 1' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <p style={{
                fontFamily: fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 32, color: '#fff', letterSpacing: '-0.01em', margin: '0 0 14px',
              }}>
                Bailio<span style={{ color: caramel }}>.</span>
              </p>
            </Link>
            <p style={{ fontFamily: fontBody, fontSize: 13, maxWidth: '36ch', lineHeight: 1.6, margin: '0 0 18px', color: 'rgba(255,255,255,0.5)' }}>
              Location immobilière entre particuliers. Zéro frais d'agence, bail électronique, dossiers vérifiés par IA.
            </p>
            <p style={{ fontFamily: fontBody, fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Bailio SAS · 75011 Paris
            </p>
          </div>

          {/* Nav columns */}
          {COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <h5 style={{
                fontFamily: fontBody, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#fff', margin: '0 0 20px',
              }}>
                {heading}
              </h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link
                      to={l.to}
                      style={{ fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: fontBody, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} Bailio. Tous droits réservés.
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { to: '/mentions-legales', label: 'Mentions légales' },
              { to: '/cgu',              label: 'CGU' },
              { to: '/confidentialite',  label: 'Confidentialité' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{ fontFamily: fontBody, fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
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
