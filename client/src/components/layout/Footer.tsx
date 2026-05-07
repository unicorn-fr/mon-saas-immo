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

const LEGAL = [
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/cgu',              label: 'CGU' },
  { to: '/confidentialite',  label: 'Confidentialité' },
]

export default function Footer() {
  return (
    <footer style={{ background: night, color: 'rgba(255,255,255,0.7)', fontFamily: fontBody }}>
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: clamp(32px, 4vw, 56px);
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-legal {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
          .footer-brand {
            grid-column: 1 / -1;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .footer-legal {
            gap: 16px;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(48px,8vh,80px) clamp(20px,5vw,48px) clamp(24px,4vh,40px)' }}>

        {/* Grid principale */}
        <div className="footer-grid" style={{ marginBottom: 'clamp(32px,5vh,48px)', paddingBottom: 'clamp(32px,5vh,48px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <p style={{ fontFamily: fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: '#fff', letterSpacing: '-0.01em', margin: '0 0 12px', lineHeight: 1 }}>
                Bailio<span style={{ color: caramel }}>.</span>
              </p>
            </Link>
            <p style={{ fontSize: 13, maxWidth: '36ch', lineHeight: 1.65, margin: '0 0 20px', color: 'rgba(255,255,255,0.5)' }}>
              Location immobilière entre particuliers. Zéro frais d'agence, bail électronique, dossiers vérifiés par IA.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Bailio SAS · 75011 Paris</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>contact@bailio.fr</p>
            </div>
          </div>

          {/* Colonnes nav */}
          {COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <h5 style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', margin: '0 0 18px' }}>
                {heading}
              </h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link
                      to={l.to}
                      style={{ fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Barre du bas */}
        <div className="footer-bottom">
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} Bailio. Tous droits réservés.
          </span>
          <div className="footer-legal">
            {LEGAL.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
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
