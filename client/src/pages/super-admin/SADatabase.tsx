/**
 * Super Admin — DB Explorer (read-only)
 */

import { useEffect, useState } from 'react'
import { superAdminService } from '../../services/superAdmin.service'
import { Database, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SADatabase() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    superAdminService.getTableList().then(setTables).catch(() => toast.error('Erreur tables'))
  }, [])

  const loadTable = async (table: string, p = 1) => {
    setLoading(true)
    try {
      const res = await superAdminService.queryTable(table, p, 50)
      setData(res)
    } catch {
      toast.error('Erreur chargement table')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTable = (table: string) => {
    setSelectedTable(table)
    setPage(1)
    loadTable(table, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    loadTable(selectedTable, newPage)
  }

  const rows: any[] = Array.isArray(data?.rows) ? data.rows : []
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  const formatCell = (val: any): string => {
    if (val === null || val === undefined) return '—'
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 80) + (JSON.stringify(val).length > 80 ? '…' : '')
    const str = String(val)
    return str.length > 80 ? str.slice(0, 80) + '…' : str
  }

  return (
    <div className="px-4 sm:px-6 py-6 h-full flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-[#00b4d8]" /> DB Explorer
          </h1>
          <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded mt-1 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            Mode lecture seule — aucune modification possible
          </p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Table list */}
        <div className="w-48 flex-shrink-0 bg-[#0d1526] border border-[#1a2744] rounded-xl p-3 overflow-y-auto">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">Tables</p>
          {tables.map((t) => (
            <button
              key={t}
              onClick={() => handleSelectTable(t)}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-mono transition-all mb-0.5 ${
                selectedTable === t
                  ? 'bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table content */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {selectedTable ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[#00b4d8]">"{selectedTable}"</span>
                  {data && <span className="text-xs text-slate-500">{data.total} lignes</span>}
                </div>
                <button onClick={() => loadTable(selectedTable, page)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 bg-[#0d1526] border border-[#1a2744] rounded-xl overflow-hidden">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-auto h-full">
                    <table className="w-full text-xs font-mono">
                      <thead className="sticky top-0 bg-[#0a0e1a]">
                        <tr className="border-b border-[#1a2744]">
                          {columns.map((col) => (
                            <th key={col} className="px-3 py-2 text-left text-[#00b4d8] whitespace-nowrap border-r border-[#1a2744] last:border-r-0">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i} className="border-b border-[#1a2744]/40 hover:bg-white/[0.02] transition-colors">
                            {columns.map((col) => (
                              <td key={col} className="px-3 py-1.5 text-slate-300 whitespace-nowrap border-r border-[#1a2744]/30 last:border-r-0 max-w-48 overflow-hidden text-ellipsis"
                                title={String(row[col] ?? '')}>
                                {formatCell(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={columns.length || 1} className="px-4 py-8 text-center text-slate-500">
                              Aucune donnée
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Page {page} / {data.totalPages} ({data.total} lignes)</span>
                  <div className="flex gap-2">
                    <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1}
                      className="p-1.5 border border-[#1a2744] rounded-lg hover:border-[#00b4d8]/50 disabled:opacity-40 transition-all">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handlePageChange(Math.min(data.totalPages, page + 1))} disabled={page === data.totalPages}
                      className="p-1.5 border border-[#1a2744] rounded-lg hover:border-[#00b4d8]/50 disabled:opacity-40 transition-all">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-600">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sélectionnez une table</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
