/**
 * Super Admin — Audit Logs
 */

import { useEffect, useState, useCallback } from 'react'
import { superAdminService } from '../../services/superAdmin.service'
import { ScrollText, Search, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Info, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const SEVERITY_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  INFO: { color: '#60a5fa', icon: Info, label: 'Info' },
  WARNING: { color: '#fbbf24', icon: AlertTriangle, label: 'Attention' },
  CRITICAL: { color: '#f87171', icon: Zap, label: 'Critique' },
}

export default function SAAuditLogs() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [severity, setSeverity] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await superAdminService.getAuditLogs({
        page, limit: 50,
        action: action || undefined,
        severity: severity || undefined,
      })
      setData(res)
    } catch {
      toast.error('Erreur chargement audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, action, severity])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-[#00b4d8]" /> Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? '—'} actions tracées</p>
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
            value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }}
            placeholder="Filtrer par action (DELETE_USER…)"
            className="w-full pl-9 pr-4 py-2 bg-[#0d1526] border border-[#1a2744] text-white text-sm rounded-lg outline-none focus:border-[#00b4d8]/50"
          />
        </div>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-[#0d1526] border border-[#1a2744] text-sm text-slate-300 rounded-lg outline-none focus:border-[#00b4d8]/50">
          <option value="">Toutes sévérités</option>
          {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Log list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (data?.items ?? []).length === 0 ? (
          <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl py-12 text-center text-slate-500">
            <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun log trouvé</p>
          </div>
        ) : (
          (data?.items ?? []).map((log: any) => {
            const cfg = SEVERITY_CONFIG[log.severity] ?? SEVERITY_CONFIG.INFO
            const Icon = cfg.icon
            const isOpen = expanded === log.id
            return (
              <div key={log.id}
                className="bg-[#0d1526] border border-[#1a2744] rounded-xl overflow-hidden transition-all cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : log.id)}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="p-1.5 rounded-lg" style={{ background: `${cfg.color}12` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-semibold text-white">{log.action}</span>
                      <span className="text-xs text-slate-500">→ {log.resource}</span>
                      {log.resourceId && (
                        <span className="text-[10px] text-slate-600 font-mono">{log.resourceId.slice(0, 8)}…</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{log.actorEmail ?? 'Système'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}12` }}>
                      {cfg.label}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {format(new Date(log.createdAt), 'd MMM yy HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                {isOpen && log.metadata && (
                  <div className="px-4 pb-3 border-t border-[#1a2744]">
                    <pre className="text-[11px] text-slate-400 font-mono bg-[#0a0e1a] rounded-lg p-3 overflow-x-auto mt-2">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })
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
    </div>
  )
}
