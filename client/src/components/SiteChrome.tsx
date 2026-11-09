import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../lib/auth'
import { Logo } from './Logo'
import { MegaMenu, MobileMenu } from './SiteMenu'
import { display } from './ui'

export function SiteHeader() {
  const { user } = useAuth()
  return (
    <header className="container" style={{ position: 'relative', zIndex: 30, height: 'clamp(72px, 9vw, 88px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <Logo size={26} />
      <nav aria-label="Menu" className="site-nav" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 24px)', fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap' }}>
        <MegaMenu linkStyle={{ textDecoration: 'none', color: BAI.ink, display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 12px' }} />
        {user ? (
          <Link to="/espace" className="hide-md" style={{ textDecoration: 'none', color: BAI.inkMid, display: 'inline-block', padding: '13px 2px' }}>
            Mon espace
          </Link>
        ) : (
          <Link to="/connexion" className="hide-md" style={{ textDecoration: 'none', color: BAI.inkMid, display: 'inline-block', padding: '13px 2px' }}>
            Se connecter
          </Link>
        )}
        <MobileMenu
          account={
            <Link to={user ? '/espace' : '/connexion'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 999, border: `1.5px solid ${BAI.borderStrong}`, color: BAI.ink, fontWeight: 600, textDecoration: 'none' }}>
              {user ? 'Mon espace' : 'Se connecter'}
            </Link>
          }
          cta={null}
        />
        <Link to="/commencer" className="btn btn-primary" style={{ textDecoration: 'none', background: BAI.cta, color: BAI.ctaInk, border: `1.5px solid ${BAI.cta}`, padding: '12px clamp(14px, 2vw, 24px)', borderRadius: 999, fontWeight: 600 }}>
          Créer mon bail
        </Link>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  const links = [
    { to: '/guides', label: 'Guides' },
    { to: '/modeles', label: 'Modèles gratuits' },
    { to: '/fonctionnalites', label: 'Fonctionnalités' },
    { to: '/tarifs', label: 'Tarifs' },
    { to: '/a-propos', label: 'À propos' },
    { to: '/demo', label: 'Essayer la démo' },
    { to: '/changer-pour-bailio', label: 'Changer pour Bailio' },
    { to: '/mentions-legales', label: 'Mentions légales' },
    { to: '/conditions', label: 'Conditions' },
    { to: '/confidentialite', label: 'Confidentialité' },
    { to: '/cookies', label: 'Cookies' },
    { to: '/prix-et-remboursement', label: 'Prix et remboursement' },
    { to: '/accessibilite', label: 'Accessibilité' },
    { to: '/securite', label: 'Sécurité' },
    { to: '/contact', label: 'Contact' },
  ]
  return (
    <footer style={{ background: BAI.night }}>
      <div className="container col-md" style={{ padding: '40px clamp(20px, 6.6vw, 96px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <Logo size={28} onDark />
        <nav aria-label="Liens légaux" className="wrap-md" style={{ display: 'flex', flexWrap: 'wrap', columnGap: 28, rowGap: 0, fontSize: 14 }}>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.surface }}>
      <SiteHeader />
      <main className="container" style={{ flex: 1, maxWidth: 800, paddingTop: 48, paddingBottom: 96 }}>
        <h1 style={display('clamp(40px, 7vw, 60px)', { margin: '0 0 32px' })}>{title}</h1>
        <div style={{ fontSize: 17, lineHeight: 1.65, color: BAI.inkMid }}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}
