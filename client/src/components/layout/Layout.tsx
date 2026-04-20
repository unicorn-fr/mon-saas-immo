import { ReactNode } from 'react'
import { Header } from './Header'
import Footer from './Footer'
import { OwnerSidebar } from './OwnerSidebar'
import { TenantSidebar } from './TenantSidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { useAuth } from '../../hooks/useAuth'
import { OnboardingModal, useOnboarding } from '../onboarding/OnboardingModal'
import { BugReportButton } from '../BugReportButton'

interface LayoutProps {
  children: ReactNode
  showHeader?: boolean
  /** Affiche le footer Bailio — true par défaut sur les pages publiques (sans sidebar) */
  showFooter?: boolean
}

export const Layout = ({ children, showHeader = true, showFooter }: LayoutProps) => {
  const { isAuthenticated, user } = useAuth()

  const hasSidebar =
    isAuthenticated &&
    (user?.role === 'OWNER' || user?.role === 'TENANT')

  const dataRole = user?.role === 'OWNER' ? 'owner' : user?.role === 'TENANT' ? 'tenant' : undefined

  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding(
    hasSidebar ? user?.id : undefined
  )

  // ── Layout sans sidebar (pages publiques, admin) ──────────────────────────
  if (!hasSidebar) {
    // Par défaut : footer visible sur toutes les pages publiques
    const displayFooter = showFooter !== false
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>
        {showHeader && <Header />}
        <main id="main-content" className="flex-1">{children}</main>
        {displayFooter && <Footer />}
      </div>
    )
  }

  // ── Layout SaaS — Sidebar fixe + colonne principale ────────────────────────
  return (
    <div className="h-screen flex overflow-hidden" data-role={dataRole} style={{
      background: 'var(--bg-base)',
      backgroundImage: `
        radial-gradient(ellipse at 20% 20%, rgba(196,151,106,0.06) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 80%, rgba(26,50,112,0.05) 0%, transparent 60%)
      `,
      fontFamily: 'var(--font-body)',
    }}>
      {/* Skip to content */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-white focus:font-semibold focus:text-sm"
        style={{ background: 'var(--thread, #1a1a2e)' }}>
        Aller au contenu principal
      </a>

      {/* Sidebar — pleine hauteur */}
      {user?.role === 'OWNER' && <OwnerSidebar />}
      {user?.role === 'TENANT' && <TenantSidebar />}

      {/* Colonne droite */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {showHeader && <Header />}
        <main id="main-content" className="flex-1 overflow-y-auto pb-16 md:pb-0 pt-16">
          {children}
        </main>
      </div>

      {/* Bottom nav iOS-style — mobile uniquement */}
      {(user?.role === 'OWNER' || user?.role === 'TENANT') && (
        <MobileBottomNav role={user.role as 'OWNER' | 'TENANT'} />
      )}

      {/* Onboarding — premier accès */}
      {showOnboarding && user && (user.role === 'OWNER' || user.role === 'TENANT') && (
        <OnboardingModal
          userId={user.id}
          role={user.role as 'OWNER' | 'TENANT'}
          onClose={dismissOnboarding}
        />
      )}

      {/* Bouton rapport de bug */}
      <BugReportButton />
    </div>
  )
}
