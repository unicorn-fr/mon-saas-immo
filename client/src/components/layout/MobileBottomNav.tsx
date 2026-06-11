import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Home,
  MessageSquare, User, Search, ClipboardList,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

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
  { to: '/dashboard/owner',    label: 'Accueil',     icon: LayoutDashboard },
  { to: '/properties/owner/me', label: 'Biens',      icon: Home },
  { to: '/applications/manage', label: 'Dossiers',   icon: ClipboardList, badge: pending },
  { to: '/messages',            label: 'Messages',   icon: MessageSquare, badge: unread },
  { to: '/profile',             label: 'Profil',     icon: User },
]

const TENANT_ITEMS = (unread: number, pending: number): NavItem[] => [
  { to: '/dashboard/tenant',   label: 'Accueil',     icon: LayoutDashboard },
  { to: '/search',             label: 'Recherche',   icon: Search },
  { to: '/my-applications',    label: 'Candidatures',icon: ClipboardList, badge: pending },
  { to: '/messages',           label: 'Messages',    icon: MessageSquare, badge: unread },
  { to: '/profile',            label: 'Profil',      icon: User },
]

// Dark nav background — Hyperbeat-inspired
const NAV_BG      = '#0a0d1a'
const NAV_BORDER  = 'rgba(255,255,255,0.08)'
const ICON_ACTIVE = BAI.caramel
const ICON_IDLE   = 'rgba(255,255,255,0.40)'
const LABEL_IDLE  = 'rgba(255,255,255,0.35)'

export function MobileBottomNav({
  role,
  unreadMessages = 0,
  pendingApps = 0,
}: MobileBottomNavProps) {
  const location = useLocation()
  const items = role === 'OWNER'
    ? OWNER_ITEMS(unreadMessages, pendingApps)
    : TENANT_ITEMS(unreadMessages, pendingApps)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden"
      style={{
        background: NAV_BG,
        borderTop: `1px solid ${NAV_BORDER}`,
        zIndex: 1010,
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
              style={{ textDecoration: 'none' }}
            >
              {/* Indicator line under active icon */}
              {isActive && (
                <motion.span
                  layoutId="mobileNavActiveDark"
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 2,
                    borderRadius: 2,
                    background: ICON_ACTIVE,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}

              {/* Icon + badge */}
              <motion.div
                className="relative"
                whileTap={{ scale: 0.80 }}
                transition={{ duration: 0.11 }}
              >
                <Icon
                  size={20}
                  style={{ color: isActive ? ICON_ACTIVE : ICON_IDLE }}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                    style={{
                      position: 'absolute',
                      top: -6, right: -8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 16, height: 16,
                      padding: '0 3px', borderRadius: 99,
                      fontSize: 9, fontWeight: 700, color: '#fff',
                      background: BAI.caramel,
                      fontFamily: BAI.fontBody,
                    }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
              </motion.div>

              {/* Label — uniquement pour l'item actif */}
              {isActive && (
                <span
                  style={{
                    fontSize: 10, fontWeight: 700,
                    color: ICON_ACTIVE,
                    fontFamily: BAI.fontBody,
                    lineHeight: 1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {item.label}
                </span>
              )}
              {!isActive && (
                <span
                  style={{
                    fontSize: 9, fontWeight: 400,
                    color: LABEL_IDLE,
                    fontFamily: BAI.fontBody,
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
