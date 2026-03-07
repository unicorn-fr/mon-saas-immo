/**
 * Super Admin — Contracts Overview
 */

import { useEffect, useState, useCallback } from 'react'
import { superAdminService } from '../../services/superAdmin.service'
import { FileText, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', SENT: '#60a5fa', SIGNED_OWNER: '#a78bfa', SIGNED_TENANT: '#a78bfa',
  COMPLETED: '#34d399', ACTIVE: '#00b4d8', EXPIRED: '#fbbf24', TERMINATED: '#f87171', CANCELLED: '#f87171',
}

const STATUSES = ['', 'DRAFT', 'SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED']

export default function SAContracts() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await superAdminService.getContracts({ page, limit: 30, status: status || undefined })
      setData(res)
    } catch {
      toast.error('Erreur chargement contrats')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#00b4d8]" /> Contrats
          </h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? '—'} contrats</p>
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        className="px-3 py-2 bg-[#0d1526] border border-[#1a2744] text-sm text-slate-300 rounded-lg outline-none focus:border-[#00b4d8]/50">
        {STATUSES.map((s) => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
      </select>

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
                  <th className="px-4 py-3 text-left">Bien</th>
                  <th className="px-4 py-3 text-left">Locataire</th>
                  <th className="px-4 py-3 text-left">Propriétaire</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-right">Loyer</th>
                  <th className="px-4 py-3 text-right">Période</th>
                </tr>
              </thead>
              <tbody>
                {(data?.contracts ?? []).map((c: any) => (
                  <tr key={c.id} className="border-b border-[#1a2744]/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-xs font-medium">{c.property?.title}</p>
                      <p className="text-[11px] text-slate-500">{c.property?.city}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {c.tenant?.firstName} {c.tenant?.lastName}
                      <p className="text-[11px] text-slate-500">{c.tenant?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {c.owner?.firstName} {c.owner?.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ color: STATUS_COLORS[c.status] ?? '#94a3b8', borderColor: `${STATUS_COLORS[c.status] ?? '#94a3b8'}40`, background: `${STATUS_COLORS[c.status] ?? '#94a3b8'}12` }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-white font-medium">
                      {c.monthlyRent?.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {format(new Date(c.startDate), 'd MMM yy', { locale: fr })} →{' '}
                      {format(new Date(c.endDate), 'd MMM yy', { locale: fr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </div>
  )
}
