/**
 * Super Admin — User Detail
 * Vue complète d'un utilisateur : profil, conversations, publications, documents, contrats
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { superAdminService } from '../../services/superAdmin.service'
import {
  ArrowLeft, User, CheckCircle, XCircle,
  Home, FileText, FolderOpen, MessageSquare, Heart,
  Calendar, Bell,
  ExternalLink, ChevronDown, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ROLE_COLORS: Record<string, string> = {
  TENANT: '#00b4d8', OWNER: '#a78bfa', ADMIN: '#34d399', SUPER_ADMIN: '#f87171',
}

const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING: '#fbbf24', UPLOADED: '#60a5fa', VALIDATED: '#34d399', REJECTED: '#f87171',
}

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#64748b', SENT: '#60a5fa', SIGNED_OWNER: '#a78bfa', SIGNED_TENANT: '#a78bfa',
  COMPLETED: '#34d399', ACTIVE: '#00b4d8', EXPIRED: '#fbbf24', TERMINATED: '#f87171', CANCELLED: '#f87171',
}

type Tab = 'profil' | 'conversations' | 'publications' | 'documents' | 'contrats' | 'reservations' | 'favoris' | 'notifications'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'conversations', label: 'Messages', icon: MessageSquare },
  { id: 'publications', label: 'Publications', icon: Home },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'contrats', label: 'Contrats', icon: FileText },
  { id: 'reservations', label: 'Réservations', icon: Calendar },
  { id: 'favoris', label: 'Favoris', icon: Heart },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

// ── Small helpers ──────────────────────────────────────────────────────────

const InfoRow = ({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#1a2744]/50 last:border-0">
      <span className="text-xs text-slate-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-200 break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-4">
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</h3>
    {children}
  </div>
)

// ── Conversation row with expand ───────────────────────────────────────────

function ConvRow({ conv, currentUserId }: { conv: any; currentUserId: string }) {
  const [open, setOpen] = useState(false)
  const other = conv.user1?.id === currentUserId ? conv.user2 : conv.user1
  const msgs: any[] = conv.messages ?? []

  return (
    <div className="border border-[#1a2744] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#1a2744] flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-[#00b4d8]" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {other?.firstName} {other?.lastName}
            <span className="text-xs text-slate-500 ml-2">{other?.email}</span>
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessageText || 'Aucun message'}</p>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'd MMM', { locale: fr }) : '—'}
          </span>
          {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#1a2744] bg-[#080c18] p-4 space-y-3">
          {msgs.length === 0 && <p className="text-xs text-slate-500 text-center py-2">Aucun message récent</p>}
          {[...msgs].reverse().map((msg: any) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-slate-500">
                {msg.senderId === currentUserId ? '👤 Cet utilisateur' : `💬 ${other?.firstName}`}
                <span className="ml-2">{format(new Date(msg.createdAt), 'd MMM HH:mm', { locale: fr })}</span>
              </span>
              <div className={`text-sm px-3 py-1.5 rounded-xl inline-block max-w-md ${
                msg.senderId === currentUserId
                  ? 'bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-slate-200'
                  : 'bg-[#1a2744] border border-[#243656] text-slate-300'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-600 text-center pt-1">5 derniers messages affichés</p>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SAUserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('profil')

  useEffect(() => {
    if (!id) return
    superAdminService.getUserDetail(id)
      .then(setUser)
      .catch(() => toast.error('Utilisateur introuvable'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Utilisateur introuvable.</p>
        <button onClick={() => navigate('/super-admin/users')} className="mt-3 text-[#00b4d8] text-sm hover:underline">
          Retour
        </button>
      </div>
    )
  }

  const conversations = [
    ...(user.conversationsUser1 ?? []),
    ...(user.conversationsUser2 ?? []),
  ].sort((a: any, b: any) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime())

  const roleColor = ROLE_COLORS[user.role] ?? '#94a3b8'

  return (
    <div className="p-6 space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/super-admin/users')}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#1a2744] border border-[#243656] flex items-center justify-center flex-shrink-0">
            {user.avatar
              ? <img src={user.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover" />
              : <User className="w-6 h-6 text-slate-400" />
            }
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{user.firstName} {user.lastName}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs text-slate-400">{user.email}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                style={{ color: roleColor, borderColor: `${roleColor}40`, background: `${roleColor}12` }}>
                {user.role}
              </span>
              {user.emailVerified
                ? <span className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Email vérifié</span>
                : <span className="text-[11px] text-amber-400 flex items-center gap-1"><XCircle className="w-3 h-3" />Email non vérifié</span>
              }
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {[
            { label: 'Publications', value: user.ownedProperties?.length ?? 0, color: '#a78bfa' },
            { label: 'Contrats', value: (user.tenantContracts?.length ?? 0) + (user.ownerContracts?.length ?? 0), color: '#34d399' },
            { label: 'Documents', value: user.tenantDocuments?.length ?? 0, color: '#60a5fa' },
            { label: 'Messages', value: user.messageCount ?? 0, color: '#00b4d8' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0d1526] border border-[#1a2744] rounded-xl px-3 py-2 text-center min-w-16">
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              tab === tabId
                ? 'bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── PROFIL tab ──────────────────────────────────────────────── */}
      {tab === 'profil' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section title="Informations personnelles">
            <InfoRow label="Prénom" value={user.firstName} />
            <InfoRow label="Nom" value={user.lastName} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Téléphone" value={user.phone} />
            <InfoRow label="Bio" value={user.bio} />
            <InfoRow label="Inscrit le" value={format(new Date(user.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })} />
            <InfoRow label="Dernière connexion" value={user.lastLoginAt ? format(new Date(user.lastLoginAt), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Jamais'} />
            <InfoRow label="2FA activée" value={user.totpEnabled ? 'Oui' : 'Non'} />
          </Section>

          <Section title="Document d'identité (extrait par l'IA)">
            <InfoRow label="Date de naissance" value={user.birthDate} />
            <InfoRow label="Ville de naissance" value={user.birthCity} />
            <InfoRow label="Nationalité" value={user.nationality} />
            <InfoRow label="N° Sécurité Sociale" value={user.nationalNumber} mono />
            <InfoRow label="N° Document" value={user.documentNumber} mono />
            <InfoRow label="Expiration" value={user.documentExpiry} />
          </Section>

          {user.profileMeta && Object.keys(user.profileMeta).length > 0 && (
            <div className="lg:col-span-2">
              <Section title="Métadonnées IA (tous documents scannés)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(user.profileMeta).map(([category, meta]: [string, any]) => (
                    <div key={category} className="bg-[#080c18] rounded-xl p-3 border border-[#1a2744]/50">
                      <p className="text-[11px] font-semibold text-[#00b4d8] uppercase tracking-wider mb-2">{category}</p>
                      {Object.entries(meta ?? {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs py-0.5 border-b border-[#1a2744]/30 last:border-0">
                          <span className="text-slate-500">{k}</span>
                          <span className="text-slate-300 font-mono ml-3 text-right max-w-40 truncate" title={String(v)}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>
      )}

      {/* ── CONVERSATIONS tab ───────────────────────────────────────── */}
      {tab === 'conversations' && (
        <div className="space-y-3">
          {conversations.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          )}
          {conversations.map((conv: any) => (
            <ConvRow key={conv.id} conv={conv} currentUserId={user.id} />
          ))}
        </div>
      )}

      {/* ── PUBLICATIONS tab ────────────────────────────────────────── */}
      {tab === 'publications' && (
        <div className="space-y-3">
          {(user.ownedProperties ?? []).length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Home className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun bien publié</p>
            </div>
          )}
          {(user.ownedProperties ?? []).map((p: any) => (
            <div key={p.id} className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-4 flex items-center gap-4">
              {p.images?.[0] && (
                <img src={p.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-white font-medium">{p.title}</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1a2744] text-slate-400">{p.status}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{p.city} · {p.surface} m² · {p.bedrooms} ch.</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.views} vues · {p.contactCount} contacts</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-white">{p.price?.toLocaleString('fr-FR')} €/mois</p>
                <p className="text-[11px] text-slate-500 mt-1">{format(new Date(p.createdAt), 'd MMM yy', { locale: fr })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DOCUMENTS tab ───────────────────────────────────────────── */}
      {tab === 'documents' && (
        <div className="space-y-2">
          {(user.tenantDocuments ?? []).length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun document</p>
            </div>
          )}
          {(user.tenantDocuments ?? []).map((doc: any) => {
            const color = DOC_STATUS_COLORS[doc.status] ?? '#94a3b8'
            return (
              <div key={doc.id} className="bg-[#0d1526] border border-[#1a2744] rounded-xl px-4 py-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{doc.docType}</p>
                  <p className="text-xs text-slate-500">{doc.category} · {(doc.fileSize / 1024).toFixed(1)} Ko · {doc.mimeType}</p>
                  {doc.note && <p className="text-xs text-amber-400 mt-0.5">Note : {doc.note}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                    {doc.status}
                  </span>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-[#00b4d8] hover:bg-[#00b4d8]/10 rounded-lg transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── CONTRATS tab ────────────────────────────────────────────── */}
      {tab === 'contrats' && (
        <div className="space-y-4">
          {/* As tenant */}
          {(user.tenantContracts ?? []).length > 0 && (
            <Section title="En tant que locataire">
              {user.tenantContracts.map((c: any) => {
                const color = CONTRACT_STATUS_COLORS[c.status] ?? '#94a3b8'
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-[#1a2744]/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{c.property?.title}</p>
                      <p className="text-xs text-slate-500">{c.property?.city} · Propriétaire : {c.owner?.firstName} {c.owner?.lastName}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(c.startDate), 'd MMM yy', { locale: fr })} → {format(new Date(c.endDate), 'd MMM yy', { locale: fr })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                        {c.status}
                      </span>
                      <p className="text-xs text-white font-medium mt-1">{c.monthlyRent?.toLocaleString('fr-FR')} €/m</p>
                    </div>
                  </div>
                )
              })}
            </Section>
          )}

          {/* As owner */}
          {(user.ownerContracts ?? []).length > 0 && (
            <Section title="En tant que propriétaire">
              {user.ownerContracts.map((c: any) => {
                const color = CONTRACT_STATUS_COLORS[c.status] ?? '#94a3b8'
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-[#1a2744]/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{c.property?.title}</p>
                      <p className="text-xs text-slate-500">{c.property?.city} · Locataire : {c.tenant?.firstName} {c.tenant?.lastName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                        {c.status}
                      </span>
                      <p className="text-xs text-white font-medium mt-1">{c.monthlyRent?.toLocaleString('fr-FR')} €/m</p>
                    </div>
                  </div>
                )
              })}
            </Section>
          )}

          {(user.tenantContracts ?? []).length === 0 && (user.ownerContracts ?? []).length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun contrat</p>
            </div>
          )}
        </div>
      )}

      {/* ── RÉSERVATIONS tab ────────────────────────────────────────── */}
      {tab === 'reservations' && (
        <div className="space-y-2">
          {(user.bookings ?? []).length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune réservation</p>
            </div>
          )}
          {(user.bookings ?? []).map((b: any) => (
            <div key={b.id} className="bg-[#0d1526] border border-[#1a2744] rounded-xl px-4 py-3 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{b.property?.title}</p>
                <p className="text-xs text-slate-500">{b.property?.city}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  b.status === 'CONFIRMED' ? 'text-emerald-400 bg-emerald-400/10' :
                  b.status === 'CANCELLED' ? 'text-red-400 bg-red-400/10' :
                  'text-amber-400 bg-amber-400/10'
                }`}>{b.status}</span>
                <p className="text-xs text-slate-500 mt-1">
                  {format(new Date(b.visitDate), 'd MMM yy', { locale: fr })} · {b.visitTime}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FAVORIS tab ─────────────────────────────────────────────── */}
      {tab === 'favoris' && (
        <div className="space-y-2">
          {(user.favorites ?? []).length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun favori</p>
            </div>
          )}
          {(user.favorites ?? []).map((f: any) => (
            <div key={f.id} className="bg-[#0d1526] border border-[#1a2744] rounded-xl px-4 py-3 flex items-center gap-3">
              <Heart className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{f.property?.title}</p>
                <p className="text-xs text-slate-500">{f.property?.city}</p>
              </div>
              <p className="text-sm font-semibold text-white flex-shrink-0">{f.property?.price?.toLocaleString('fr-FR')} €/m</p>
            </div>
          ))}
        </div>
      )}

      {/* ── NOTIFICATIONS tab ───────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="space-y-2">
          {(user.notifications ?? []).length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune notification</p>
            </div>
          )}
          {(user.notifications ?? []).map((n: any) => (
            <div key={n.id} className={`bg-[#0d1526] border rounded-xl px-4 py-3 ${n.isRead ? 'border-[#1a2744]' : 'border-[#00b4d8]/30'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-slate-600 mt-1">{n.type}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] text-slate-500">{format(new Date(n.createdAt), 'd MMM HH:mm', { locale: fr })}</p>
                  {!n.isRead && <span className="text-[10px] text-[#00b4d8]">• Non lu</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
