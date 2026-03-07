/**
 * Super Admin — Message Interceptor
 * Read all platform conversations
 */

import { useEffect, useState, useCallback } from 'react'
import { superAdminService } from '../../services/superAdmin.service'
import { MessageSquare, Search, ChevronLeft, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function SAMessages() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any>(null)
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgPage, setMsgPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await superAdminService.getConversations({ page, limit: 30, search: search || undefined })
      setData(res)
    } catch {
      toast.error('Erreur chargement conversations')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const openConversation = async (conv: any, p = 1) => {
    setActiveConv(conv)
    setMsgLoading(true)
    try {
      const res = await superAdminService.getConversationMessages(conv.id, p)
      setMessages(res)
      setMsgPage(p)
    } catch {
      toast.error('Erreur chargement messages')
    } finally {
      setMsgLoading(false)
    }
  }

  if (activeConv) {
    const msgs: any[] = messages?.messages ?? []
    return (
      <div className="p-6 space-y-4 h-full flex flex-col">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveConv(null); setMessages(null) }}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-white font-semibold text-sm">
              {activeConv.user1?.email} ↔ {activeConv.user2?.email}
            </h2>
            <p className="text-xs text-slate-500">{activeConv._count?.messages ?? 0} messages</p>
          </div>
        </div>

        <div className="flex-1 bg-[#0d1526] border border-[#1a2744] rounded-xl overflow-hidden flex flex-col">
          {msgLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {[...msgs].reverse().map((msg: any) => (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="text-slate-300 font-medium">{msg.sender?.firstName} {msg.sender?.lastName}</span>
                    <span>·</span>
                    <span>{format(new Date(msg.createdAt), 'd MMM HH:mm', { locale: fr })}</span>
                    {!msg.isRead && <span className="text-[10px] text-[#00b4d8]">• non lu</span>}
                  </div>
                  <div className="bg-[#1a2744] border border-[#243656] rounded-xl px-3 py-2 text-sm text-slate-200 max-w-xl">
                    {msg.content}
                  </div>
                </div>
              ))}
              {msgs.length === 0 && <p className="text-center text-slate-500 text-sm py-8">Aucun message</p>}
            </div>
          )}
        </div>

        {messages && messages.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Page {msgPage} / {messages.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => openConversation(activeConv, Math.max(1, msgPage - 1))} disabled={msgPage === 1}
                className="p-1.5 border border-[#1a2744] rounded-lg hover:border-[#00b4d8]/50 disabled:opacity-40 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => openConversation(activeConv, Math.min(messages.totalPages, msgPage + 1))} disabled={msgPage === messages.totalPages}
                className="p-1.5 border border-[#1a2744] rounded-lg hover:border-[#00b4d8]/50 disabled:opacity-40 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#00b4d8]" /> Messages
          </h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? '—'} conversations</p>
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Rechercher par email…"
          className="w-full pl-9 pr-4 py-2 bg-[#0d1526] border border-[#1a2744] text-white text-sm rounded-lg outline-none focus:border-[#00b4d8]/50"
        />
      </div>

      <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-[#1a2744]">
            {(data?.conversations ?? []).map((conv: any) => (
              <button key={conv.id} onClick={() => openConversation(conv)}
                className="w-full text-left px-4 py-3 hover:bg-white/[0.02] transition-colors flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1a2744] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#00b4d8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {conv.user1?.email} ↔ {conv.user2?.email}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessageText || 'Aucun message'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">
                    {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'd MMM', { locale: fr }) : '—'}
                  </p>
                  <p className="text-[11px] text-[#00b4d8] mt-0.5">{conv._count?.messages ?? 0} msgs</p>
                </div>
              </button>
            ))}
            {(data?.conversations ?? []).length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">Aucune conversation</p>
            )}
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
