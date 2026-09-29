import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from './Logo'

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: 600,
  color: isActive ? BAI.ink : BAI.inkSoft,
  borderBottom: `2px solid ${isActive ? BAI.caramel : 'transparent'}`,
  padding: '6px 0',
})

export function EspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.bg }}>
      <header style={{ background: BAI.surface, borderBottom: `1px solid ${BAI.divider}` }}>
        <div className="container" style={{ maxWidth: 960, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Logo size={28} to="/espace" />
          <nav aria-label="Mon espace" style={{ display: 'flex', gap: 'clamp(16px, 3vw, 28px)' }}>
            <NavLink to="/espace" end style={linkStyle}>
              Aujourd'hui
            </NavLink>
            <NavLink to="/espace/compte" style={linkStyle}>
              Mon compte
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container" style={{ flex: 1, maxWidth: 960, paddingTop: 'clamp(32px, 5vw, 56px)', paddingBottom: 96 }}>
        {children}
      </main>
    </div>
  )
}
