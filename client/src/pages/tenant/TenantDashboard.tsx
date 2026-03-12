import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Heart, MessageSquare, Search, Home, Clock, MapPin,
  CheckCircle, FileText, PenTool, FolderOpen, SendHorizonal,
  ChevronRight, ArrowRight, Loader2, Star, CreditCard, Briefcase, Banknote,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useBookings } from '../../hooks/useBookings'
import { useFavoriteStore } from '../../store/favoriteStore'
import { useMessages } from '../../hooks/useMessages'
import { useContractStore } from '../../store/contractStore'
import { applicationService } from '../../services/application.service'
import { dossierService } from '../../services/dossierService'
import { Layout } from '../../components/layout/Layout'
import type { Application } from '../../types/application.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Catégories requises pour le calcul de complétion du dossier ──────────────
// Correspond aux IDs définis dans DossierLocatif.tsx
const REQUIRED_CATEGORIES = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE'] as const

function computeDossierPercent(docs: { category: string }[]): number {
  if (docs.length === 0) return 0
  const uploaded = new Set(docs.map((d) => d.category))
  const covered = REQUIRED_CATEGORIES.filter((cat) => uploaded.has(cat)).length
  return Math.round((covered / REQUIRED_CATEGORIES.length) * 100)
}

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TenantDashboard() {
  const { user } = useAuth()
  const { bookings, fetchBookings, isLoading: isLoadingBookings } = useBookings()
  const { favoriteIds, loadFavorites } = useFavoriteStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const { contracts, fetchContracts, fetchStatistics: fetchContractStatistics } = useContractStore()
  const [applications, setApplications] = useState<Application[]>([])
  const [dossierPercent, setDossierPercent] = useState(0)

  useEffect(() => {
    fetchBookings()
    loadFavorites()
    fetchUnreadCount()
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
    applicationService.list().then(setApplications).catch(() => {})
    dossierService.getDocuments().then((docs) => {
      setDossierPercent(computeDossierPercent(docs))
    }).catch(() => {})
  }, [fetchBookings, loadFavorites, fetchUnreadCount, fetchContracts, fetchContractStatistics])

  // ── Données dérivées ──────────────────────────────────────────────────────
  const upcomingBookings = useMemo(() =>
    bookings
      .filter((b) => (b.status === 'PENDING' || b.status === 'CONFIRMED') && new Date(b.visitDate) >= new Date())
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
      .slice(0, 3),
    [bookings]
  )

  const activeContract             = contracts.find((c) => c.status === 'ACTIVE')
  const pendingSignatureContracts  = contracts.filter((c) => ['SENT', 'SIGNED_OWNER'].includes(c.status) && !c.signedByTenant)
  const pendingApps                = applications.filter((a) => a.status === 'PENDING')
  const approvedApps               = applications.filter((a) => a.status === 'APPROVED')
  const activeApps                 = applications.filter((a) => a.status !== 'WITHDRAWN')

  // Greeting
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // Dossier color
  const dossierColor =
    dossierPercent >= 80 ? '#059669'
    : dossierPercent >= 50 ? '#d97706'
    : '#dc2626'

  const STATUS_STYLE: Record<string, React.CSSProperties> = {
    PENDING:  { background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' },
    APPROVED: { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' },
    REJECTED: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' },
  }
  const STATUS_LABEL: Record<string, string> = {
    PENDING:  'En examen',
    APPROVED: 'Approuvée',
    REJECTED: 'Non retenue',
  }

  return (
    <Layout>
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f5f5f7' }}>

          {/* ── EN-TÊTE ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-slate-400">
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {greeting}, {user?.firstName}
              </h1>
            </div>
            <Link to="/search"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: '#3b82f6', boxShadow: '0 4px 14px rgba(59,130,246,0.30)' }}>
              <Search className="w-4 h-4" /> Chercher un logement
            </Link>
          </div>

          {/* ── ALERTE SIGNATURE ──────────────────────────────────── */}
          {pendingSignatureContracts.length > 0 && (
            <div className="rounded-2xl p-4 flex items-start gap-3 mb-6"
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderLeft: '3px solid #d97706',
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}>
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-amber-800">
                  {pendingSignatureContracts.length === 1
                    ? 'Un contrat attend votre signature'
                    : `${pendingSignatureContracts.length} contrats attendent votre signature`}
                </p>
                <Link to={`/contracts/${pendingSignatureContracts[0].id}`}
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-700 hover:opacity-70 transition-opacity">
                  Voir et signer <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* ── QUICK STATS ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              {
                to: '/my-bookings',
                iconBg: '#3b82f6',
                icon: <Calendar className="w-4 h-4 text-white" />,
                value: upcomingBookings.length,
                label: 'Visites à venir',
                sub: upcomingBookings.length > 0
                  ? `Prochaine le ${format(new Date(upcomingBookings[0].visitDate), 'd MMM', { locale: fr })}`
                  : 'Aucune programmée',
                live: false,
              },
              {
                to: '/my-applications',
                iconBg: '#3b82f6',
                icon: <SendHorizonal className="w-4 h-4 text-white" />,
                value: activeApps.length,
                label: 'Candidatures',
                sub: pendingApps.length > 0
                  ? `${pendingApps.length} en attente`
                  : approvedApps.length > 0
                    ? `${approvedApps.length} approuvée${approvedApps.length > 1 ? 's' : ''}`
                    : 'Aucune en cours',
                live: pendingApps.length > 0,
              },
              {
                to: '/messages',
                iconBg: '#3b82f6',
                icon: <MessageSquare className="w-4 h-4 text-white" />,
                value: unreadCount,
                label: 'Messages',
                sub: unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Tout lu',
                live: unreadCount > 0,
              },
              {
                to: '/favorites',
                iconBg: '#ef4444',
                icon: <Heart className="w-4 h-4 text-white" />,
                value: favoriteIds.size,
                label: 'Favoris',
                sub: favoriteIds.size > 0 ? `${favoriteIds.size} bien${favoriteIds.size > 1 ? 's' : ''}` : 'Aucun favori',
                live: false,
              },
            ].map(({ to, iconBg, icon, value, label, sub, live }) => (
              <Link key={label} to={to}
                className="flex flex-col gap-3 p-4 rounded-2xl group transition-all hover:-translate-y-0.5"
                style={{
                  ...cardStyle,
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)'
                }}>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                    {icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {live && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-[26px] font-extrabold leading-none tracking-tight mb-1 text-slate-900">{value}</p>
                  <p className="text-xs font-semibold mb-0.5 text-slate-700">{label}</p>
                  <p className="text-[11px] text-slate-400">{sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── CONTENU PRINCIPAL ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Colonne principale (2/3) ──────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Widget dossier locatif */}
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f59e0b' }}>
                      <FolderOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-semibold text-sm text-slate-900">Mon dossier locatif</span>
                  </div>
                  <Link to="/dossier" className="text-xs font-semibold text-blue-500 flex items-center gap-1 hover:opacity-70 transition-opacity">
                    Gérer <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Anneau circulaire */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" strokeWidth="4.5" className="fill-none" stroke="#d2d2d7" />
                        <circle cx="32" cy="32" r="26" strokeWidth="4.5" className="fill-none"
                          style={{
                            stroke: dossierColor,
                            strokeDasharray: 2 * Math.PI * 26,
                            strokeDashoffset: 2 * Math.PI * 26 * (1 - dossierPercent / 100),
                            strokeLinecap: 'round',
                            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)',
                          }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-extrabold" style={{ color: dossierColor }}>{dossierPercent}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1 text-slate-900">
                        {dossierPercent === 100
                          ? 'Dossier complet — prêt à candidater !'
                          : dossierPercent >= 50
                            ? 'Dossier en bonne voie, continuez !'
                            : 'Complétez votre dossier pour postuler'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {Math.round(dossierPercent / 100 * REQUIRED_CATEGORIES.length)} / {REQUIRED_CATEGORIES.length} catégories complètes
                      </p>
                      <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden bg-slate-100">
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${dossierPercent}%`, background: dossierColor }} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                      { id: 'IDENTITE', label: 'Identité',  Icon: CreditCard },
                      { id: 'EMPLOI',   label: 'Emploi',    Icon: Briefcase },
                      { id: 'REVENUS',  label: 'Revenus',   Icon: Banknote },
                      { id: 'DOMICILE', label: 'Domicile',  Icon: Home },
                    ] as const).map(({ id, label, Icon }, i) => {
                      const done = i < Math.round(dossierPercent / 100 * REQUIRED_CATEGORIES.length)
                      return (
                        <Link key={id} to="/dossier"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                          style={done
                            ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }
                            : { background: '#f5f5f7', border: '1px solid #d2d2d7', color: '#515154' }}>
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate flex-1">{label}</span>
                          {done && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                        </Link>
                      )
                    })}
                  </div>
                  {dossierPercent < 100 && (
                    <Link to="/dossier"
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: '#3b82f6', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }}>
                      <FolderOpen className="w-4 h-4" /> Compléter mon dossier
                    </Link>
                  )}
                </div>
              </div>

              {/* Mes candidatures */}
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
                      <SendHorizonal className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-semibold text-sm text-slate-900">Mes candidatures</span>
                    {pendingApps.length > 0 && (
                      <span className="text-[11px] font-bold text-white rounded-full px-2 py-0.5 bg-blue-500">
                        {pendingApps.length}
                      </span>
                    )}
                  </div>
                  <Link to="/my-applications" className="text-xs font-semibold text-blue-500 flex items-center gap-1 hover:opacity-70 transition-opacity">
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {activeApps.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-slate-50">
                      <SendHorizonal className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500">Aucune candidature en cours</p>
                    <Link to="/search" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-500 hover:opacity-80">
                      <Search className="w-3.5 h-3.5" /> Parcourir les annonces
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeApps.slice(0, 4).map((app) => (
                      <div key={app.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-slate-900">
                            {app.property?.title}
                          </p>
                          <p className="text-[11px] mt-0.5 text-slate-400">
                            {app.property?.city} · {app.property?.price} €/mois · Score {app.score}/100
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] border rounded-full px-2.5 py-0.5 font-semibold"
                            style={STATUS_STYLE[app.status] || {}}>
                            {STATUS_LABEL[app.status] || app.status}
                          </span>
                          {app.status === 'APPROVED' && (
                            <Link to={`/property/${app.property?.id}`}
                              className="text-[11px] font-semibold text-white px-2.5 py-1.5 rounded-lg transition-all hover:-translate-y-px"
                              style={{ background: '#3b82f6', boxShadow: '0 2px 8px rgba(59,130,246,0.22)' }}>
                              Réserver
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visites à venir */}
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-semibold text-sm text-slate-900">Visites à venir</span>
                  </div>
                  <Link to="/my-bookings" className="text-xs font-semibold text-blue-500 flex items-center gap-1 hover:opacity-70 transition-opacity">
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 px-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-slate-50">
                      <Calendar className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500">Aucune visite programmée</p>
                    <Link to="/search" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-500 hover:opacity-80">
                      <Search className="w-3.5 h-3.5" /> Trouver un bien à visiter
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {upcomingBookings.map((booking) => (
                      <Link key={booking.id} to={`/property/${booking.property.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                        {booking.property.images?.[0] ? (
                          <img src={booking.property.images[0]} alt={booking.property.title}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
                            <Home className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-slate-900">{booking.property.title}</p>
                          <p className="text-[11px] flex items-center gap-1 mt-0.5 text-slate-400">
                            <MapPin className="w-2.5 h-2.5" />{booking.property.city}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(booking.visitDate), 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{booking.visitTime}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                          style={booking.status === 'CONFIRMED'
                            ? { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }
                            : { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                          {booking.status === 'CONFIRMED' ? 'Confirmée' : 'En attente'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mon bail actif */}
              {activeContract && (
                <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
                        <FileText className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900">Mon bail actif</span>
                    </div>
                    <Link to="/contracts" className="text-xs font-semibold text-blue-500 flex items-center gap-1 hover:opacity-70 transition-opacity">
                      Voir le contrat <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="p-4">
                    <Link to={`/contracts/${activeContract.id}`}
                      className="block p-4 rounded-xl transition-all hover:-translate-y-0.5"
                      style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{activeContract.property?.title}</p>
                          <p className="text-[11px] flex items-center gap-1 mt-0.5 text-slate-400">
                            <MapPin className="w-2.5 h-2.5" />
                            {activeContract.property?.address}, {activeContract.property?.city}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          <CheckCircle className="w-3 h-3" /> Actif
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Loyer', value: `${activeContract.monthlyRent} €/mois` },
                          { label: 'Début', value: format(new Date(activeContract.startDate), 'dd MMM yyyy', { locale: fr }) },
                          { label: 'Fin',   value: format(new Date(activeContract.endDate),   'dd MMM yyyy', { locale: fr }) },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[11px] mb-0.5 text-slate-400">{label}</p>
                            <p className="text-sm font-bold" style={{ color: label === 'Loyer' ? '#3b82f6' : '#1d1d1f' }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar droite (1/3) ──────────────────────────── */}
            <div className="space-y-4">

              {/* CTA recherche */}
              <div className="rounded-2xl p-4 overflow-hidden"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
                    <Search className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900">Trouver votre logement</p>
                </div>
                <p className="text-[11px] mb-3 text-slate-500">
                  {favoriteIds.size > 0
                    ? `${favoriteIds.size} bien${favoriteIds.size > 1 ? 's' : ''} en favori`
                    : 'Explorez les annonces disponibles.'}
                </p>
                <Link to="/search"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: '#3b82f6', boxShadow: '0 4px 14px rgba(59,130,246,0.30)' }}>
                  <Search className="w-3.5 h-3.5" /> Parcourir les annonces
                </Link>
              </div>

              {/* Prochaines étapes */}
              <div className="rounded-2xl p-4" style={cardStyle}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-slate-400">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Parcours
                </p>
                <div className="space-y-3">
                  {[
                    { done: dossierPercent === 100, label: 'Dossier complet', sub: `${dossierPercent}% complété`, link: '/dossier' },
                    { done: applications.length > 0, label: 'Postuler à une annonce', sub: applications.length > 0 ? `${applications.length} candidature${applications.length > 1 ? 's' : ''}` : "Aucune pour l'instant", link: '/search' },
                    { done: upcomingBookings.length > 0, label: 'Réserver une visite', sub: upcomingBookings.length > 0 ? `${upcomingBookings.length} visite${upcomingBookings.length > 1 ? 's' : ''} à venir` : 'Aucune programmée', link: '/search' },
                    { done: !!activeContract, label: 'Obtenir un bail actif', sub: activeContract ? 'Bail en cours' : 'En attente', link: '/contracts' },
                  ].map(({ done, label, sub, link }) => (
                    <Link key={label} to={link} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={done
                          ? { borderColor: '#059669', background: '#059669' }
                          : { borderColor: '#d2d2d7' }}>
                        {done && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold transition-colors"
                          style={{ color: done ? '#86868b' : '#1d1d1f', textDecoration: done ? 'line-through' : 'none' }}>
                          {label}
                        </p>
                        <p className="text-[11px] mt-0.5 text-slate-400">{sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Navigation rapide */}
              <div className="rounded-2xl p-4" style={cardStyle}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-slate-400">
                  Accès rapides
                </p>
                <div className="space-y-1">
                  {[
                    { to: '/my-bookings',     iconBg: '#3b82f6', icon: <Calendar className="w-3.5 h-3.5 text-white" />,      label: 'Mes visites',  badge: upcomingBookings.length },
                    { to: '/my-applications', iconBg: '#3b82f6', icon: <SendHorizonal className="w-3.5 h-3.5 text-white" />, label: 'Candidatures', badge: pendingApps.length },
                    { to: '/dossier',         iconBg: '#f59e0b', icon: <FolderOpen className="w-3.5 h-3.5 text-white" />,    label: 'Mon dossier',  badge: 0 },
                    { to: '/messages',        iconBg: '#3b82f6', icon: <MessageSquare className="w-3.5 h-3.5 text-white" />, label: 'Messages',     badge: unreadCount },
                    { to: '/favorites',       iconBg: '#ef4444', icon: <Heart className="w-3.5 h-3.5 text-white" />,         label: 'Favoris',      badge: 0 },
                    { to: '/contracts',       iconBg: '#3b82f6', icon: <FileText className="w-3.5 h-3.5 text-white" />,      label: 'Contrats',     badge: pendingSignatureContracts.length },
                  ].map(({ to, iconBg, icon, label, badge }) => (
                    <Link key={to} to={to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>{icon}</div>
                      <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
                      {badge > 0 ? (
                        <span className="text-[11px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center flex-shrink-0 bg-blue-500">{badge}</span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </div>
    </Layout>
  )
}
