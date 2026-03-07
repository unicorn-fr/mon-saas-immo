/**
 * Super Admin — User Management
 * Full RBAC control with double-confirm delete
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminService } from '../../services/superAdmin.service'
import {
  Users, Search, ChevronLeft, ChevronRight, Trash2,
  MailCheck, X, AlertTriangle, CheckCircle, RefreshCw, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ROLES = ['', 'TENANT', 'OWNER', 'ADMIN', 'SUPER_ADMIN']
const ROLE_COLORS: Record<string, string> = {
  TENANT: '#00b4d8', OWNER: '#a78bfa', ADMIN: '#34d399', SUPER_ADMIN: '#f87171',
}

type ConfirmAction = { type: 'delete' | 'role'; userId: string; userEmail: string; payload?: string } | null

export default function SAUsers() {
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [confirm, setConfirm] = useState<ConfirmAction>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const [actionUser, setActionUser] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await superAdminService.getUsers({ page, limit: 30, role: role || undefined, search: search || undefined })
      setData(res)
    } catch {
      toast.error('Erreur chargement utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [page, role, search])

  useEffect(() => { load() }, [load])

  const handleRoleChange = (userId: string, userEmail: string, newRole: string) => {
    setConfirm({ type: 'role', userId, userEmail, payload: newRole })
    setConfirmInput('')
  }

  const handleDelete = (userId: string, userEmail: string) => {
    setConfirm({ type: 'delete', userId, userEmail })
    setConfirmInput('')
  }

  const executeConfirm = async () => {
    if (!confirm) return
    if (confirmInput !== 'CONFIRMER') {
      toast.error('Tapez exactement "CONFIRMER" pour valider')
      return
    }
    setActionUser(confirm.userId)
    try {
      if (confirm.type === 'delete') {
        await superAdminService.deleteUser(confirm.userId)
        toast.success('Utilisateur supprimé')
      } else if (confirm.type === 'role') {
        await superAdminService.updateUserRole(confirm.userId, confirm.payload!)
        toast.success(`Rôle mis à jour → ${confirm.payload}`)
      }
      setConfirm(null)
      setConfirmInput('')
      load()
    } catch {
      toast.error('Erreur lors de l\'action')
    } finally {
      setActionUser(null)
    }
  }

  const handleForceVerify = async (userId: string) => {
    try {
      await superAdminService.forceVerifyEmail(userId)
      toast.success('Email vérifié de force')
      load()
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00b4d8]" /> Utilisateurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? '—'} comptes</p>
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Email, nom, prénom, téléphone…"
            className="w-full pl-9 pr-4 py-2 bg-[#0d1526] border border-[#1a2744] text-white text-sm rounded-lg outline-none focus:border-[#00b4d8]/50"
          />
        </div>
        <select
          value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-[#0d1526] border border-[#1a2744] text-sm text-slate-300 rounded-lg outline-none focus:border-[#00b4d8]/50"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r || 'Tous les rôles'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2744] text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Utilisateur</th>
                  <th className="px-4 py-3 text-left">Rôle</th>
                  <th className="px-4 py-3 text-left">Vérif.</th>
                  <th className="px-4 py-3 text-right">Activité</th>
                  <th className="px-4 py-3 text-right">Inscrit</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.users ?? []).map((u: any) => (
                  <tr key={u.id}
                    onClick={() => navigate(`/super-admin/users/${u.id}`)}
                    className="border-b border-[#1a2744]/50 hover:bg-[#00b4d8]/5 cursor-pointer transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium group-hover:text-[#00b4d8] transition-colors">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      {u.phone && <p className="text-xs text-slate-600">{u.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ color: ROLE_COLORS[u.role] ?? '#94a3b8', borderColor: `${ROLE_COLORS[u.role] ?? '#94a3b8'}40`, background: `${ROLE_COLORS[u.role] ?? '#94a3b8'}12` }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {u.emailVerified
                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                        : <button onClick={() => handleForceVerify(u.id)} title="Forcer vérification"
                            className="p-1 text-amber-400 hover:bg-amber-400/10 rounded transition-all">
                            <MailCheck className="w-4 h-4" />
                          </button>
                      }
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      <div>{u._count.ownedProperties} biens</div>
                      <div>{u._count.tenantContracts} contrats</div>
                      <div>{u._count.tenantDocuments} docs</div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {format(new Date(u.createdAt), 'd MMM yy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/super-admin/users/${u.id}`)}
                          className="p-1.5 text-[#00b4d8] hover:bg-[#00b4d8]/10 rounded-lg transition-all"
                          title="Voir le profil"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <select
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) handleRoleChange(u.id, u.email, e.target.value) }}
                          className="text-[11px] bg-[#1a2744] border border-[#243656] text-slate-300 rounded px-1.5 py-1 outline-none"
                        >
                          <option value="" disabled>Rôle…</option>
                          {['TENANT','OWNER','ADMIN','SUPER_ADMIN'].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          disabled={actionUser === u.id}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Page {page} / {data.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 border border-[#1a2744] rounded-lg hover:border-[#00b4d8]/50 disabled:opacity-40 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
              className="p-1.5 border border-[#1a2744] rounded-lg hover:border-[#00b4d8]/50 disabled:opacity-40 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0d1526] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  {confirm.type === 'delete' ? 'Supprimer l\'utilisateur' : 'Changer le rôle'}
                </h3>
                <p className="text-xs text-slate-500">{confirm.userEmail}</p>
              </div>
              <button onClick={() => setConfirm(null)} className="ml-auto text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              {confirm.type === 'delete'
                ? 'Cette action est irréversible. Toutes les données associées seront supprimées.'
                : `Le rôle sera changé en ${confirm.payload}.`}
            </p>
            <p className="text-xs text-slate-500 mb-2">Tapez <span className="text-red-400 font-mono font-bold">CONFIRMER</span> pour valider :</p>
            <input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') executeConfirm() }}
              placeholder="CONFIRMER"
              className="w-full px-3 py-2 bg-[#1a2744] border border-[#243656] text-white text-sm rounded-lg outline-none focus:border-red-500/50 mb-4 font-mono"
            />
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2 text-sm text-slate-400 border border-[#1a2744] rounded-lg hover:bg-white/5 transition-all">
                Annuler
              </button>
              <button
                onClick={executeConfirm}
                disabled={confirmInput !== 'CONFIRMER'}
                className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
