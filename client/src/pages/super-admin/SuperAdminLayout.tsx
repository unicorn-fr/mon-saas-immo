/**
 * Super Admin Layout — Cerveau Central
 * Dark mode Command Center with cyber blue (#00b4d8) accents
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Users, FolderOpen, Database, MessageSquare,
  ScrollText, LogOut, ChevronLeft, ChevronRight, Shield, FileText,
  Terminal,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/users', icon: Users, label: 'Utilisateurs' },
  { to: '/super-admin/dossiers', icon: FolderOpen, label: 'Dossiers' },
  { to: '/super-admin/contracts', icon: FileText, label: 'Contrats' },
  { to: '/super-admin/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/super-admin/database', icon: Database, label: 'DB Explorer' },
  { to: '/super-admin/audit', icon: ScrollText, label: 'Audit Logs' },
]

export default function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#0a0e1a] text-white font-mono overflow-hidden">
      {/* ── Sidebar ─────────────────────────── */}
      <aside
        className={`flex flex-col border-r border-[#1a2744] bg-[#0d1526] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-[#1a2744]">
          <Terminal className="w-5 h-5 text-[#00b4d8] flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-bold text-[#00b4d8] tracking-widest uppercase whitespace-nowrap">
              Cerveau Central
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all text-sm ${
                  isActive
                    ? 'bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#1a2744] p-3 space-y-2">
          {!collapsed && user && (
            <div className="px-1 pb-1">
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#00b4d8] bg-[#00b4d8]/10 px-1.5 py-0.5 rounded">
                <Shield className="w-3 h-3" />
                SUPER_ADMIN
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-[#0a0e1a]">
        <Outlet />
      </main>
    </div>
  )
}
