import { ReactNode } from 'react'
import { Header } from './Header'
import { OwnerSidebar } from './OwnerSidebar'
import { TenantSidebar } from './TenantSidebar'
import { useAuth } from '../../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
  showHeader?: boolean
}

export const Layout = ({ children, showHeader = true }: LayoutProps) => {
  const { isAuthenticated, user } = useAuth()

  const hasSidebar =
    isAuthenticated &&
    (user?.role === 'OWNER' || user?.role === 'TENANT')

  const dataRole = user?.role === 'OWNER' ? 'owner' : user?.role === 'TENANT' ? 'tenant' : undefined

  // ── Layout sans sidebar (pages publiques, admin) ──────────────────────────
  if (!hasSidebar) {
    return (
      <div className="min-h-screen" style={{ background: '#f5f5f7' }}>
        {showHeader && <Header />}
        <main id="main-content">{children}</main>
      </div>
    )
  }

  // ── Layout SaaS — Sidebar fixe + colonne principale ────────────────────────
  return (
    <div className="h-screen flex overflow-hidden" data-role={dataRole} style={{ background: '#f5f5f7' }}>
      {/* Skip to content */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-white focus:font-semibold focus:text-sm"
        style={{ background: 'var(--thread, #007AFF)' }}>
        Aller au contenu principal
      </a>

      {/* Sidebar — pleine hauteur */}
      {user?.role === 'OWNER' && <OwnerSidebar />}
      {user?.role === 'TENANT' && <TenantSidebar />}

      {/* Colonne droite */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {showHeader && <Header />}
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
