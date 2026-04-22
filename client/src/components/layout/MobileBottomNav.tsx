/**
 * MobileBottomNav — Maison Design System
 * Navigation iOS-style fixée en bas de l'écran sur mobile (< md).
 * Cachée sur md: et plus (sidebar desktop prend le relais).
 *
 * Utilise les vraies routes de l'application (App.tsx).
 * Icônes Lucide (déjà installé dans le projet).
 */
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Home,
  MessageSquare, User, Search, ClipboardList,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  badge?: number
}

interface MobileBottomNavProps {
  role: 'OWNER' | 'TENANT'
  unreadMessages?: number
  pendingApps?: number
}

const OWNER_ITEMS = (unread: number, pending: number): NavItem[] => [
  { to: '/dashboard/owner',   label: 'Accueil',     icon: LayoutDashboard },
  { to: '/properties/owner/me', label: 'Biens',     icon: Home },
  { to: '/applications/manage', label: 'Dossiers',  icon: ClipboardList, badge: pending },
  { to: '/messages',           label: 'Messages',   icon: MessageSquare, badge: unread },
  { to: '/profile',            label: 'Profil',     icon: User },
]

const TENANT_ITEMS = (unread: number, pending: number): NavItem[] => [
  { to: '/dashboard/tenant', label: 'Accueil',      icon: LayoutDashboard },
  { to: '/search',           label: 'Recherche',    icon: Search },
  { to: '/my-applications',  label: 'Candidatures', icon: ClipboardList, badge: pending },
  { to: '/messages',         label: 'Messages',     icon: MessageSquare, badge: unread },
  { to: '/profile',          label: 'Profil',       icon: User },
]

const OWNER_COLOR  = '#1a3270'
const TENANT_COLOR = '#1b5e3b'
const INK_FAINT    = '#9e9b96'
const BORDER       = '#e4e1db'

export function MobileBottomNav({
  role,
  unreadMessages = 0,
  pendingApps = 0,
}: MobileBottomNavProps) {
  const location = useLocation()
  const activeColor = role === 'OWNER' ? OWNER_COLOR : TENANT_COLOR
  const items = role === 'OWNER'
    ? OWNER_ITEMS(unreadMessages, pendingApps)
    : TENANT_ITEMS(unreadMessages, pendingApps)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[1010] md:hidden"
      style={{
        background: '#ffffff',
        borderTop: `1px solid ${BORDER}`,
        boxShadow: '0 -1px 2px rgba(13,12,10,0.04), 0 -4px 12px rgba(13,12,10,0.06)',
        // Safe area pour les iPhones avec barre d'accueil (Dynamic Island, etc.)
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
      }}
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch justify-around" style={{ height: 60 }}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
            || (item.to !== '/dashboard/owner' && item.to !== '/dashboard/tenant'
              && location.pathname.startsWith(item.to))

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center flex-1 gap-0.5 py-1.5"
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Indicateur actif en haut */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: activeColor }}
                />
              )}

              {/* Icône + badge */}
              <div className="relative">
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? activeColor : INK_FAINT }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 flex items-center justify-center
                      min-w-[16px] h-4 px-1 rounded-full text-white"
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      background: '#c4976a', // caramel Maison
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className="truncate max-w-full"
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? activeColor : INK_FAINT,
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
