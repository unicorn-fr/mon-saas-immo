/**
 * Super Admin Dashboard — Platform Overview
 */

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  Users, Home, FileText, Calendar, MessageSquare, FolderOpen,
  TrendingUp, Activity, ScrollText, ShieldCheck,
} from 'lucide-react'
import { superAdminService } from '../../services/superAdmin.service'
import toast from 'react-hot-toast'

interface Stats {
  users: { total: number; tenants: number; owners: number; admins: number; superAdmins: number; newLast7: number; newLast30: number }
  properties: { total: number; published: number }
  contracts: { total: number; active: number }
  bookings: { total: number; confirmed: number }
  documents: { total: number }
  messages: { total: number; conversations: number }
  auditLogs: { total: number }
  growthData: { date: string; count: number }[]
}

const StatCard = ({ icon: Icon, label, value, sub, color = '#00b4d8' }: {
  icon: any; label: string; value: number | string; sub?: string; color?: string
}) => (
  <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-5 flex items-start gap-4">
    <div className="p-2.5 rounded-lg" style={{ background: `${color}15` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </div>
  </div>
)

export default function SADashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    superAdminService.getStats()
      .then(setStats)
      .catch(() => toast.error('Erreur chargement stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Vue globale de la plateforme</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#00b4d8] bg-[#00b4d8]/10 border border-[#00b4d8]/30 px-3 py-1.5 rounded-lg">
          <Activity className="w-3.5 h-3.5" />
          Live
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Utilisateurs" value={stats.users.total}
          sub={`+${stats.users.newLast7} cette semaine`} />
        <StatCard icon={Home} label="Biens" value={stats.properties.total}
          sub={`${stats.properties.published} publiés`} color="#a78bfa" />
        <StatCard icon={FileText} label="Contrats" value={stats.contracts.total}
          sub={`${stats.contracts.active} actifs`} color="#34d399" />
        <StatCard icon={Calendar} label="Réservations" value={stats.bookings.total}
          sub={`${stats.bookings.confirmed} confirmées`} color="#fb923c" />
        <StatCard icon={FolderOpen} label="Documents" value={stats.documents.total}
          sub="dossiers locataires" color="#f472b6" />
        <StatCard icon={MessageSquare} label="Messages" value={stats.messages.total}
          sub={`${stats.messages.conversations} conversations`} color="#60a5fa" />
        <StatCard icon={ScrollText} label="Audit Logs" value={stats.auditLogs.total}
          sub="actions tracées" color="#fbbf24" />
        <StatCard icon={ShieldCheck} label="Super Admins" value={stats.users.superAdmins}
          sub="accès total" color="#f87171" />
      </div>

      {/* User role breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00b4d8]" />
            Croissance utilisateurs — 30 jours
          </h2>
          {stats.growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats.growthData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0d1526', border: '1px solid #1a2744', color: '#e2e8f0', fontSize: 12 }}
                  cursor={{ stroke: '#00b4d8', strokeWidth: 1, strokeDasharray: '4' }}
                />
                <Area type="monotone" dataKey="count" stroke="#00b4d8" fill="url(#areaGrad)"
                  strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#00b4d8' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">Aucune donnée</p>
          )}
        </div>

        <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00b4d8]" />
            Répartition des rôles
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Locataires', value: stats.users.tenants, total: stats.users.total, color: '#00b4d8' },
              { label: 'Propriétaires', value: stats.users.owners, total: stats.users.total, color: '#a78bfa' },
              { label: 'Admins', value: stats.users.admins, total: stats.users.total, color: '#34d399' },
              { label: 'Super Admins', value: stats.users.superAdmins, total: stats.users.total, color: '#f87171' },
            ].map(({ label, value, total, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-white font-medium">{value} <span className="text-slate-500">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
