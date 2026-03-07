/**
 * Super Admin — Dossier Verification Center
 * Review all tenant documents with status management
 */

import { useEffect, useState, useCallback } from 'react'
import { superAdminService } from '../../services/superAdmin.service'
import {
  FolderOpen, Search, ChevronLeft, ChevronRight, CheckCircle,
  XCircle, Clock, FileText, RefreshCw, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'En attente', color: '#fbbf24', icon: Clock },
  UPLOADED: { label: 'Uploadé', color: '#60a5fa', icon: FileText },
  VALIDATED: { label: 'Validé', color: '#34d399', icon: CheckCircle },
  REJECTED: { label: 'Refusé', color: '#f87171', icon: XCircle },
}

const CATEGORIES = ['', 'IDENTITE', 'SITUATION_PRO', 'REVENUS', 'HISTORIQUE', 'GARANTIES']

export default function SADossiers() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState<{ id: string; status: string } | null>(null)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await superAdminService.getDossiers({ page, limit: 30, status: status || undefined, category: category || undefined })
      setData(res)
    } catch {
      toast.error('Erreur chargement dossiers')
    } finally {
      setLoading(false)
    }
  }, [page, status, category])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === 'REJECTED') {
      setNoteModal({ id, status: newStatus })
      return
    }
    setUpdating(id)
    try {
      await superAdminService.updateDocumentStatus(id, newStatus)
      toast.success(`Document ${STATUS_CONFIG[newStatus]?.label}`)
      load()
    } catch {
      toast.error('Erreur')
    } finally {
      setUpdating(null)
    }
  }

  const submitRejection = async () => {
    if (!noteModal) return
    setUpdating(noteModal.id)
    try {
      await superAdminService.updateDocumentStatus(noteModal.id, noteModal.status, note || undefined)
      toast.success('Document refusé')
      setNoteModal(null)
      setNote('')
      load()
    } catch {
      toast.error('Erreur')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = search
    ? (data?.documents ?? []).filter((d: any) =>
        d.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        d.docType?.toLowerCase().includes(search.toLowerCase())
      )
    : (data?.documents ?? [])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#00b4d8]" /> Dossiers locataires
          </h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? '—'} documents</p>
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
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Email ou type de document…"
            className="w-full pl-9 pr-4 py-2 bg-[#0d1526] border border-[#1a2744] text-white text-sm rounded-lg outline-none focus:border-[#00b4d8]/50"
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-[#0d1526] border border-[#1a2744] text-sm text-slate-300 rounded-lg outline-none focus:border-[#00b4d8]/50">
          <option value="">Tous statuts</option>
          {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-[#0d1526] border border-[#1a2744] text-sm text-slate-300 rounded-lg outline-none focus:border-[#00b4d8]/50">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'Toutes catégories'}</option>)}
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
                  <th className="px-4 py-3 text-left">Locataire</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc: any) => {
                  const cfg = STATUS_CONFIG[doc.status]
                  const Icon = cfg?.icon ?? FileText
                  return (
                    <tr key={doc.id} className="border-b border-[#1a2744]/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{doc.user?.firstName} {doc.user?.lastName}</p>
                        <p className="text-[11px] text-slate-500">{doc.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">{doc.docType}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{doc.category}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{ color: cfg?.color, borderColor: `${cfg?.color}40`, background: `${cfg?.color}12` }}>
                          <Icon className="w-3 h-3" />
                          {cfg?.label}
                        </span>
                        {doc.note && <p className="text-[10px] text-slate-500 mt-1 max-w-32 truncate">{doc.note}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {format(new Date(doc.createdAt), 'd MMM yy', { locale: fr })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-[#00b4d8] hover:bg-[#00b4d8]/10 rounded-lg transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {doc.status !== 'VALIDATED' && (
                            <button
                              onClick={() => handleStatusChange(doc.id, 'VALIDATED')}
                              disabled={updating === doc.id}
                              className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all disabled:opacity-50"
                              title="Valider">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {doc.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleStatusChange(doc.id, 'REJECTED')}
                              disabled={updating === doc.id}
                              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                              title="Refuser">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      {/* Note / Rejection Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0d1526] border border-[#1a2744] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-semibold mb-3">Motif de refus</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Expliquer le motif du refus (optionnel)…"
              className="w-full px-3 py-2 bg-[#1a2744] border border-[#243656] text-white text-sm rounded-lg outline-none focus:border-red-500/50 mb-4 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setNoteModal(null)}
                className="flex-1 py-2 text-sm text-slate-400 border border-[#1a2744] rounded-lg hover:bg-white/5 transition-all">
                Annuler
              </button>
              <button onClick={submitRejection}
                className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold">
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
