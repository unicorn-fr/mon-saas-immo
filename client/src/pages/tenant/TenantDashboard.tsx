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
    dossierPercent >= 80 ? '#10b981'
    : dossierPercent >= 50 ? '#f59e0b'
    : '#ef4444'

  const STATUS_STYLE: Record<string, string> = {
    PENDING:  'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
  }
  const STATUS_LABEL: Record<string, string> = {
    PENDING:  'En examen',
    APPROVED: 'Approuvée ✓',
    REJECTED: 'Non retenue',
  }

  // ── Panel style helper ─────────────────────────────────────────────────────
  const panelStyle = {
    background: 'var(--glass-bg-heavy)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-reflection), 0 8px 32px rgba(0,0,0,0.07)',
  }

  return (
    <Layout>
      <div className="py-5 px-4 md:px-6 space-y-5 page-enter">

          {/* ── EN-TÊTE ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between animate-fade-up">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'var(--text-tertiary)', letterSpacing: '0.10em' }}>
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {greeting}, {user?.firstName}
              </h1>
            </div>
            <Link to="/search"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shimmer-btn"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                boxShadow: '0 4px 14px rgba(124,58,237,0.38)',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}>
              <Search className="w-4 h-4" /> Chercher un logement
            </Link>
          </div>

          {/* ── ALERTE SIGNATURE ──────────────────────────────────── */}
          {pendingSignatureContracts.length > 0 && (
            <div className="rounded-2xl p-3.5 flex items-start gap-3 animate-fade-up delay-50"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.20)',
                borderLeft: '3px solid #f59e0b',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}>
              <div className="icon-box flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)', width: 32, height: 32, borderRadius: 10 }}>
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#92400e' }}>
                  {pendingSignatureContracts.length === 1
                    ? 'Un contrat attend votre signature'
                    : `${pendingSignatureContracts.length} contrats attendent votre signature`}
                </p>
                <Link to={`/contracts/${pendingSignatureContracts[0].id}`}
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#b45309' }}>
                  Voir et signer <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* ── QUICK STATS ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                to: '/my-bookings',
                iconGradient: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                icon: <Calendar className="w-4 h-4 text-white" />,
                accent: 'linear-gradient(90deg,#7c3aed,#3b82f6)',
                value: upcomingBookings.length,
                label: 'Visites à venir',
                sub: upcomingBookings.length > 0
                  ? `Prochaine le ${format(new Date(upcomingBookings[0].visitDate), 'd MMM', { locale: fr })}`
                  : 'Aucune programmée',
              },
              {
                to: '/my-applications',
                iconGradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                icon: <SendHorizonal className="w-4 h-4 text-white" />,
                accent: 'linear-gradient(90deg,#3b82f6,#1e40af)',
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
                iconGradient: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                icon: <MessageSquare className="w-4 h-4 text-white" />,
                accent: 'linear-gradient(90deg,#3b82f6,#7c3aed)',
                value: unreadCount,
                label: 'Messages',
                sub: unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Tout lu',
                live: unreadCount > 0,
              },
              {
                to: '/favorites',
                iconGradient: 'linear-gradient(135deg,#ef4444,#f43f5e)',
                icon: <Heart className="w-4 h-4 text-white" />,
                accent: 'linear-gradient(90deg,#f43f5e,#d946ef)',
                value: favoriteIds.size,
                label: 'Favoris',
                sub: favoriteIds.size > 0 ? `${favoriteIds.size} bien${favoriteIds.size > 1 ? 's' : ''}` : 'Aucun favori',
              },
            ].map(({ to, iconGradient, icon, accent, value, label, sub, live }, i) => (
              <Link key={label} to={to}
                className="kpi-card flex flex-col gap-3 group animate-fade-up"
                style={{ '--kpi-accent': accent, animationDelay: `${i * 55}ms` } as React.CSSProperties}>
                <div className="flex items-start justify-between">
                  <div className="icon-box" style={{ background: iconGradient }}>
                    {icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {live && <span className="live-dot-violet" style={{ width: 7, height: 7 }} />}
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-[26px] font-extrabold leading-none tracking-tight mb-1 animate-count-up"
                    style={{ color: 'var(--text-primary)', animationDelay: `${i * 60}ms` }}>{value}</p>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── CONTENU PRINCIPAL ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-up delay-200">

            {/* ── Colonne principale (2/3) ──────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Widget dossier locatif */}
              <div className="rounded-2xl overflow-hidden" style={panelStyle}>
                <div className="section-header">
                  <span className="section-header-title">
                    <div className="icon-box" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', width: 28, height: 28, borderRadius: 8 }}>
                      <FolderOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    Mon dossier locatif
                  </span>
                  <Link to="/dossier" className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#7c3aed' }}>
                    Gérer <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Anneau circulaire */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" strokeWidth="4.5" className="fill-none" style={{ stroke: 'var(--surface-subtle)' }} />
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
                      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        {dossierPercent === 100
                          ? 'Dossier complet — prêt à candidater !'
                          : dossierPercent >= 50
                            ? 'Dossier en bonne voie, continuez !'
                            : 'Complétez votre dossier pour postuler'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {Math.round(dossierPercent / 100 * REQUIRED_CATEGORIES.length)} / {REQUIRED_CATEGORIES.length} catégories complètes
                      </p>
                      <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--surface-subtle)' }}>
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${dossierPercent}%`, background: `linear-gradient(90deg, ${dossierColor}cc, ${dossierColor})` }} />
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
                            ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.28)', color: '#059669' }
                            : { background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate flex-1">{label}</span>
                          {done && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                        </Link>
                      )
                    })}
                  </div>
                  {dossierPercent < 100 && (
                    <Link to="/dossier"
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white shimmer-btn transition-all hover:opacity-90"
                      style={{ background: '#2563eb', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                      <FolderOpen className="w-4 h-4" /> Compléter mon dossier
                    </Link>
                  )}
                </div>
              </div>

              {/* Mes candidatures */}
              <div className="rounded-2xl overflow-hidden" style={panelStyle}>
                <div className="section-header">
                  <span className="section-header-title">
                    <div className="icon-box" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', width: 28, height: 28, borderRadius: 8 }}>
                      <SendHorizonal className="w-3.5 h-3.5 text-white" />
                    </div>
                    Mes candidatures
                    {pendingApps.length > 0 && (
                      <span className="text-[11px] font-bold text-white rounded-full px-2 py-0.5"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>
                        {pendingApps.length}
                      </span>
                    )}
                  </span>
                  <Link to="/my-applications" className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#7c3aed' }}>
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {activeApps.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--surface-subtle)' }}>
                      <SendHorizonal className="w-5 h-5 opacity-40" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aucune candidature en cours</p>
                    <Link to="/search" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold hover:opacity-80" style={{ color: '#7c3aed' }}>
                      <Search className="w-3.5 h-3.5" /> Parcourir les annonces
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                    {activeApps.slice(0, 4).map((app) => (
                      <div key={app.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {app.property?.title}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {app.property?.city} · {app.property?.price} €/mois · Score {app.score}/100
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[11px] border rounded-full px-2.5 py-0.5 font-semibold ${STATUS_STYLE[app.status] || ''}`}>
                            {STATUS_LABEL[app.status] || app.status}
                          </span>
                          {app.status === 'APPROVED' && (
                            <Link to={`/property/${app.property?.id}`}
                              className="text-[11px] font-semibold text-white px-2.5 py-1.5 rounded-lg transition-all hover:-translate-y-px"
                              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.22)' }}>
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
              <div className="rounded-2xl overflow-hidden" style={panelStyle}>
                <div className="section-header">
                  <span className="section-header-title">
                    <div className="icon-box" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', width: 28, height: 28, borderRadius: 8 }}>
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    Visites à venir
                  </span>
                  <Link to="/my-bookings" className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#7c3aed' }}>
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 px-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--surface-subtle)' }}>
                      <Calendar className="w-5 h-5 opacity-40" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aucune visite programmée</p>
                    <Link to="/search" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold hover:opacity-80" style={{ color: '#7c3aed' }}>
                      <Search className="w-3.5 h-3.5" /> Trouver un bien à visiter
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                    {upcomingBookings.map((booking) => (
                      <Link key={booking.id} to={`/property/${booking.property.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
                        {booking.property.images?.[0] ? (
                          <img src={booking.property.images[0]} alt={booking.property.title}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-subtle)' }}>
                            <Home className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{booking.property.title}</p>
                          <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            <MapPin className="w-2.5 h-2.5" />{booking.property.city}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(booking.visitDate), 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{booking.visitTime}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {booking.status === 'CONFIRMED' ? 'Confirmée' : 'En attente'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mon bail actif */}
              {activeContract && (
                <div className="rounded-2xl overflow-hidden" style={panelStyle}>
                  <div className="section-header">
                    <span className="section-header-title">
                      <div className="icon-box" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', width: 28, height: 28, borderRadius: 8 }}>
                        <FileText className="w-3.5 h-3.5 text-white" />
                      </div>
                      Mon bail actif
                    </span>
                    <Link to="/contracts" className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                      style={{ color: '#7c3aed' }}>
                      Voir le contrat <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="p-4">
                    <Link to={`/contracts/${activeContract.id}`}
                      className="block p-4 rounded-xl transition-all hover:-translate-y-0.5"
                      style={{ border: '1px solid rgba(59,130,246,0.20)', background: 'rgba(59,130,246,0.04)', boxShadow: '0 0 0 1px rgba(59,130,246,0.06)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{activeContract.property?.title}</p>
                          <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            <MapPin className="w-2.5 h-2.5" />
                            {activeContract.property?.address}, {activeContract.property?.city}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
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
                            <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                            <p className="text-sm font-bold" style={{ color: label === 'Loyer' ? '#7c3aed' : 'var(--text-primary)' }}>{value}</p>
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
              <div className="rounded-2xl p-4 overflow-hidden relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(59,130,246,0.10) 100%)',
                  border: '1px solid rgba(124,58,237,0.20)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}>
                {/* Subtle background glow */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="icon-box" style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', width: 28, height: 28, borderRadius: 8 }}>
                    <Search className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Trouver votre logement</p>
                </div>
                <p className="text-[11px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {favoriteIds.size > 0
                    ? `${favoriteIds.size} bien${favoriteIds.size > 1 ? 's' : ''} en favori`
                    : 'Explorez les annonces disponibles.'}
                </p>
                <Link to="/search"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white shimmer-btn transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', boxShadow: '0 4px 14px rgba(124,58,237,0.38)' }}>
                  <Search className="w-3.5 h-3.5" /> Parcourir les annonces
                </Link>
              </div>

              {/* Prochaines étapes */}
              <div className="rounded-2xl p-4" style={panelStyle}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5"
                  style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
                  <Star className="w-3.5 h-3.5 text-amber-500" /> Parcours
                </p>
                <div className="space-y-3">
                  {[
                    { done: dossierPercent === 100, label: 'Dossier complet', sub: `${dossierPercent}% complété`, link: '/dossier' },
                    { done: applications.length > 0, label: 'Postuler à une annonce', sub: applications.length > 0 ? `${applications.length} candidature${applications.length > 1 ? 's' : ''}` : "Aucune pour l'instant", link: '/search' },
                    { done: upcomingBookings.length > 0, label: 'Réserver une visite', sub: upcomingBookings.length > 0 ? `${upcomingBookings.length} visite${upcomingBookings.length > 1 ? 's' : ''} à venir` : 'Aucune programmée', link: '/search' },
                    { done: !!activeContract, label: 'Obtenir un bail actif', sub: activeContract ? 'Bail en cours ✓' : 'En attente', link: '/contracts' },
                  ].map(({ done, label, sub, link }) => (
                    <Link key={label} to={link} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={done
                          ? { borderColor: '#10b981', background: '#10b981' }
                          : { borderColor: 'var(--glass-border)' }}>
                        {done && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold transition-colors"
                          style={{ color: done ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                          {label}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Navigation rapide */}
              <div className="rounded-2xl p-4" style={panelStyle}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
                  Accès rapides
                </p>
                <div className="space-y-1">
                  {[
                    { to: '/my-bookings',     iconBg: 'linear-gradient(135deg,#7c3aed,#a855f7)', icon: <Calendar className="w-3.5 h-3.5 text-white" />,      label: 'Mes visites',  badge: upcomingBookings.length },
                    { to: '/my-applications', iconBg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', icon: <SendHorizonal className="w-3.5 h-3.5 text-white" />, label: 'Candidatures', badge: pendingApps.length },
                    { to: '/dossier',         iconBg: 'linear-gradient(135deg,#f59e0b,#f97316)', icon: <FolderOpen className="w-3.5 h-3.5 text-white" />,    label: 'Mon dossier',  badge: 0 },
                    { to: '/messages',        iconBg: 'linear-gradient(135deg,#3b82f6,#6366f1)', icon: <MessageSquare className="w-3.5 h-3.5 text-white" />, label: 'Messages',     badge: unreadCount },
                    { to: '/favorites',       iconBg: 'linear-gradient(135deg,#ef4444,#f43f5e)', icon: <Heart className="w-3.5 h-3.5 text-white" />,         label: 'Favoris',      badge: 0 },
                    { to: '/contracts',       iconBg: 'linear-gradient(135deg,#d946ef,#7c3aed)', icon: <FileText className="w-3.5 h-3.5 text-white" />,      label: 'Contrats',     badge: pendingSignatureContracts.length },
                  ].map(({ to, iconBg, icon, label, badge }) => (
                    <Link key={to} to={to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5">
                      <div className="icon-box flex-shrink-0" style={{ background: iconBg, width: 28, height: 28, borderRadius: 8 }}>{icon}</div>
                      <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                      {badge > 0 ? (
                        <span className="text-[11px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>{badge}</span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-25 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
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
