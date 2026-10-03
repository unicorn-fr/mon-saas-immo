import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../lib/auth'
import { Logo } from './Logo'

export function SiteHeader() {
  const { user } = useAuth()
  return (
    <header className="container" style={{ height: 'clamp(72px, 9vw, 88px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <Logo size={30} />
      <nav aria-label="Menu" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 32px)', fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap' }}>
        <a href="/#tarifs" className="hide-md" style={{ textDecoration: 'none', color: BAI.inkMid, display: 'inline-block', padding: '13px 2px' }}>
          Tarif
        </a>
        {user ? (
          <Link to="/espace" style={{ textDecoration: 'none', color: BAI.inkMid, display: 'inline-block', padding: '13px 2px' }}>
            Mon espace
          </Link>
        ) : (
          <Link to="/connexion" style={{ textDecoration: 'none', color: BAI.inkMid, display: 'inline-block', padding: '13px 2px' }}>
            Se connecter
          </Link>
        )}
        <Link to="/commencer" style={{ textDecoration: 'none', background: BAI.night, color: BAI.surface, padding: '12px clamp(14px, 2vw, 22px)', borderRadius: 12, fontWeight: 600 }}>
          Créer mon bail
        </Link>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  const links = [
    { to: '/mentions-legales', label: 'Mentions légales' },
    { to: '/conditions', label: 'Conditions' },
    { to: '/confidentialite', label: 'Confidentialité' },
    { to: '/cookies', label: 'Cookies' },
    { to: '/prix-et-remboursement', label: 'Prix et remboursement' },
    { to: '/accessibilite', label: 'Accessibilité' },
    { to: '/contact', label: 'Contact' },
  ]
  return (
    <footer style={{ background: BAI.night }}>
      <div className="container col-md" style={{ padding: '40px clamp(20px, 6.6vw, 96px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <Logo size={28} color={BAI.caramel} />
        <nav aria-label="Liens légaux" className="wrap-md" style={{ display: 'flex', columnGap: 28, rowGap: 0, fontSize: 14 }}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} style={{ color: BAI.onDark, textDecoration: 'none', display: 'inline-block', padding: '13px 0' }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}

/** Page de contenu simple (pages légales, pages d'information). */
export function SimplePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.bg }}>
      <SiteHeader />
      <main className="container" style={{ flex: 1, maxWidth: 800, paddingTop: 48, paddingBottom: 96 }}>
        <h1 style={{ margin: '0 0 32px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(40px, 7vw, 60px)', lineHeight: 1.02 }}>{title}</h1>
        <div style={{ fontSize: 17, lineHeight: 1.65, color: BAI.inkMid }}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}
