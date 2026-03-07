import { ReactNode } from 'react'
import { Header } from './Header'
import { OwnerSidebar } from './OwnerSidebar'
import { TenantSidebar } from './TenantSidebar'
import { useAuth } from '../../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
  showHeader?: boolean
}

/**
 * Blobs de couleur floutés — la "matière" que le glassmorphism floute.
 * position: fixed, z-index: -10 → toujours derrière le contenu, même en scroll.
 */
function GlassBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      {/* Violet — top-left */}
      <div
        className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full opacity-[0.50] dark:opacity-[0.55]"
        style={{
          background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)',
          filter: 'blur(90px)',
          animation: 'blobPulse 12s ease-in-out infinite',
        }}
      />
      {/* Blue — center-right */}
      <div
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.40] dark:opacity-[0.44]"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)',
          filter: 'blur(90px)',
          animation: 'blobPulse 16s ease-in-out infinite reverse',
        }}
      />
      {/* Cyan — bottom-left */}
      <div
        className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] rounded-full opacity-[0.36] dark:opacity-[0.40]"
        style={{
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 65%)',
          filter: 'blur(90px)',
          animation: 'blobPulse 20s ease-in-out infinite',
          animationDelay: '-6s',
        }}
      />
      {/* Rose — bottom-right */}
      <div
        className="absolute -bottom-32 right-1/4 w-[480px] h-[480px] rounded-full opacity-[0.30] dark:opacity-[0.34]"
        style={{
          background: 'radial-gradient(circle, #ec4899 0%, transparent 65%)',
          filter: 'blur(90px)',
          animation: 'blobPulse 18s ease-in-out infinite reverse',
          animationDelay: '-3s',
        }}
      />
    </div>
  )
}

export const Layout = ({ children, showHeader = true }: LayoutProps) => {
  const { isAuthenticated, user } = useAuth()

  const hasSidebar =
    isAuthenticated &&
    (user?.role === 'OWNER' || user?.role === 'TENANT')

  // ── Layout sans sidebar (pages publiques, admin) ──────────────────────────
  if (!hasSidebar) {
    return (
      <div className="min-h-screen relative">
        <GlassBackground />
        {showHeader && <Header />}
        <main className="relative">{children}</main>
      </div>
    )
  }

  // ── Layout SaaS — Sidebar fixe à gauche (hauteur totale) ─────────────────
  // Structure : [Sidebar] | [Topbar + Main scrollable]
  // La sidebar va du haut en bas de l'écran, sans être coupée par le header.
  return (
    <div className="h-screen flex overflow-hidden relative">
      <GlassBackground />

      {/* Sidebar — pleine hauteur, à gauche */}
      {user?.role === 'OWNER' && <OwnerSidebar />}
      {user?.role === 'TENANT' && <TenantSidebar />}

      {/* Colonne droite : Topbar + Contenu scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {showHeader && <Header />}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  )
}
