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

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bgBase:        '#fafaf8',
  bgSurface:     '#ffffff',
  bgMuted:       '#f4f2ee',
  ink:           '#0d0c0a',
  inkMid:        '#5a5754',
  inkFaint:      '#9e9b96',
  tenant:        '#1b5e3b',
  tenantLight:   '#edf7f2',
  tenantBorder:  '#9fd4ba',
  caramel:       '#c4976a',
  caramelLight:  '#fdf5ec',
  border:        '#e4e1db',
  borderMid:     '#ccc9c3',
  shadowCard:    '0 1px 2px rgba(13,12,10,0.05), 0 4px 16px rgba(13,12,10,0.06)',
  shadowHover:   '0 4px 8px rgba(13,12,10,0.08), 0 12px 32px rgba(13,12,10,0.10)',
}

const cardBase: React.CSSProperties = {
  background:   T.bgSurface,
  border:       `1px solid ${T.border}`,
  borderRadius: 16,
  boxShadow:    T.shadowCard,
}

// ─── Catégories requises pour le calcul de complétion du dossier ──────────────
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

  const activeContract            = contracts.find((c) => c.status === 'ACTIVE')
  const pendingSignatureContracts = contracts.filter((c) => ['SENT', 'SIGNED_OWNER'].includes(c.status) && !c.signedByTenant)
  const pendingApps               = applications.filter((a) => a.status === 'PENDING')
  const approvedApps              = applications.filter((a) => a.status === 'APPROVED')
  const activeApps                = applications.filter((a) => a.status !== 'WITHDRAWN')

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // Dossier ring geometry
  const RING_R          = 48
  const CIRCUMFERENCE   = 2 * Math.PI * RING_R  // ≈ 301.6
  const ringOffset      = CIRCUMFERENCE * (1 - dossierPercent / 100)
  const dossierColor    =
    dossierPercent >= 80 ? T.tenant
    : dossierPercent >= 50 ? T.caramel
    : '#b91c1c'

  // Category completion mapping
  const coveredCount = Math.round(dossierPercent / 100 * REQUIRED_CATEGORIES.length)

  const STATUS_STYLE: Record<string, React.CSSProperties> = {
    PENDING:  { background: T.caramelLight, border: `1px solid #e8c9a0`, color: T.caramel },
    APPROVED: { background: T.tenantLight,  border: `1px solid ${T.tenantBorder}`, color: T.tenant },
    REJECTED: { background: '#fef2f2',      border: '1px solid #fecaca', color: '#b91c1c' },
  }
  const STATUS_LABEL: Record<string, string> = {
    PENDING:  'En examen',
    APPROVED: 'Approuvée',
    REJECTED: 'Non retenue',
  }

  return (
    <Layout>
      <div style={{ background: T.bgBase, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 40px' }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 13, color: T.inkFaint, fontWeight: 400, marginBottom: 4, textTransform: 'capitalize' }}>
                {todayLabel}
              </p>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700, fontStyle: 'italic',
                fontSize: 52, color: T.ink, lineHeight: 1.05, margin: 0,
              }}>
                Bonjour, {user?.firstName}
              </h1>
            </div>
            <Link to="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: T.tenant, color: '#ffffff',
              fontWeight: 600, fontSize: 13, textDecoration: 'none',
            }}>
              <Search size={15} /> Chercher un logement
            </Link>
          </div>

          {/* ── Alerte signature ─────────────────────────────────────────── */}
          {pendingSignatureContracts.length > 0 && (
            <div style={{
              background: T.caramelLight, border: `1px solid #e8c9a0`,
              borderLeft: `3px solid ${T.caramel}`,
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'flex-start', gap: 12,
              marginBottom: 28,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: T.caramel, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <PenTool size={15} style={{ color: '#ffffff' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', margin: '0 0 4px' }}>
                  {pendingSignatureContracts.length === 1
                    ? 'Un contrat attend votre signature'
                    : `${pendingSignatureContracts.length} contrats attendent votre signature`}
                </p>
                <Link to={`/contracts/${pendingSignatureContracts[0].id}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 500, color: '#92400e', textDecoration: 'none',
                }}>
                  Voir et signer <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* ── KPI row ─────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16, marginBottom: 32,
          }}
            className="t-lg-grid-4"
          >
            {[
              {
                to: '/my-bookings',
                label: 'Visites à venir',
                value: upcomingBookings.length,
                sub: upcomingBookings.length > 0
                  ? `Prochaine le ${format(new Date(upcomingBookings[0].visitDate), 'd MMM', { locale: fr })}`
                  : 'Aucune programmée',
              },
              {
                to: '/my-applications',
                label: 'Candidatures',
                value: activeApps.length,
                sub: pendingApps.length > 0
                  ? `${pendingApps.length} en attente`
                  : approvedApps.length > 0
                    ? `${approvedApps.length} approuvée${approvedApps.length > 1 ? 's' : ''}`
                    : 'Aucune en cours',
              },
              {
                to: '/messages',
                label: 'Messages',
                value: unreadCount,
                sub: unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Tout lu',
              },
              {
                to: '/favorites',
                label: 'Favoris',
                value: favoriteIds.size,
                sub: favoriteIds.size > 0 ? `${favoriteIds.size} bien${favoriteIds.size > 1 ? 's' : ''}` : 'Aucun favori',
              },
            ].map((kpi) => (
              <Link key={kpi.label} to={kpi.to} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  ...cardBase,
                  borderTop: `3px solid ${T.tenant}`,
                  padding: 20,
                  display: 'flex', flexDirection: 'column',
                  boxSizing: 'border-box',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = T.shadowHover;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = T.shadowCard;
                    (e.currentTarget as HTMLElement).style.transform = 'none'
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.inkFaint, marginBottom: 12 }}>
                    {kpi.label}
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 700, fontSize: 44, color: T.ink,
                    lineHeight: 1, marginBottom: 4,
                  }}>
                    {kpi.value}
                  </p>
                  <p style={{ fontSize: 12, color: T.inkFaint }}>
                    {kpi.sub}
                  </p>
                  <ArrowRight size={14} style={{ color: T.inkFaint, marginTop: 'auto', alignSelf: 'flex-end' }} />
                </div>
              </Link>
            ))}
          </div>

          {/* ── Main grid ───────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="t-lg-grid-3col">

            {/* Left column (2/3) */}
            <div style={{ gridColumn: 'span 2' }} className="t-lg-col-span-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Dossier locatif widget ──────────────────────────── */}
                <div style={cardBase}>
                  <div style={{
                    padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint }}>
                        Mon dossier locatif
                      </span>
                    </div>
                    <Link to="/dossier" style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 500, color: T.tenant, textDecoration: 'none',
                    }}>
                      Gérer <ArrowRight size={12} />
                    </Link>
                  </div>

                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>

                      {/* SVG ring */}
                      <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="60" cy="60" r={RING_R} strokeWidth="8" fill="none" stroke={T.bgMuted} />
                          <circle cx="60" cy="60" r={RING_R} strokeWidth="8" fill="none"
                            style={{
                              stroke: dossierColor,
                              strokeDasharray: CIRCUMFERENCE,
                              strokeDashoffset: ringOffset,
                              strokeLinecap: 'round',
                              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)',
                            }}
                          />
                        </svg>
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 32, fontWeight: 700, color: T.ink, lineHeight: 1,
                          }}>
                            {dossierPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Right: status + pills */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                          {dossierPercent === 100
                            ? 'Dossier complet — prêt à candidater !'
                            : dossierPercent >= 50
                              ? 'Dossier en bonne voie, continuez !'
                              : 'Complétez votre dossier pour postuler'}
                        </p>
                        <p style={{ fontSize: 12, color: T.inkFaint, marginBottom: 16 }}>
                          {coveredCount} / {REQUIRED_CATEGORIES.length} catégories complètes
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {([
                            { id: 'IDENTITE', label: 'Identité',  Icon: CreditCard },
                            { id: 'EMPLOI',   label: 'Emploi',    Icon: Briefcase },
                            { id: 'REVENUS',  label: 'Revenus',   Icon: Banknote },
                            { id: 'DOMICILE', label: 'Domicile',  Icon: Home },
                          ] as const).map(({ id, label, Icon }, i) => {
                            const done = i < coveredCount
                            return (
                              <Link key={id} to="/dossier" style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                textDecoration: 'none',
                                background: done ? T.tenantLight : T.bgMuted,
                                border: `1px solid ${done ? T.tenantBorder : T.borderMid}`,
                                color: done ? T.tenant : T.inkFaint,
                                transition: 'opacity 0.15s',
                              }}>
                                <Icon size={13} style={{ flexShrink: 0 }} />
                                <span style={{ flex: 1 }}>{label}</span>
                                {done && <CheckCircle size={13} style={{ flexShrink: 0 }} />}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {dossierPercent < 100 && (
                      <Link to="/dossier" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '11px', borderRadius: 10,
                        background: T.tenant, color: '#ffffff',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      }}>
                        <FolderOpen size={15} /> Compléter mon dossier
                      </Link>
                    )}
                  </div>
                </div>

                {/* ── Candidatures ───────────────────────────────────────── */}
                <div style={cardBase}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint }}>
                          Mes candidatures
                        </span>
                        {pendingApps.length > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#ffffff',
                            background: T.tenant, borderRadius: 20, padding: '1px 8px',
                          }}>
                            {pendingApps.length}
                          </span>
                        )}
                      </div>
                      <Link to="/my-applications" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: T.tenant, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${T.border}` }} />
                  </div>

                  {activeApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: T.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <SendHorizonal size={18} style={{ color: T.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: T.inkMid, marginBottom: 8 }}>Aucune candidature en cours</p>
                      <Link to="/search" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 500, color: T.tenant, textDecoration: 'none',
                      }}>
                        <Search size={13} /> Parcourir les annonces
                      </Link>
                    </div>
                  ) : (
                    <div>
                      {activeApps.slice(0, 4).map((app, idx) => {
                        const isLast = idx === Math.min(activeApps.length, 4) - 1
                        return (
                          <div key={app.id} style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '12px 20px',
                            borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                            transition: 'background 0.15s',
                          }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.property?.title}
                              </p>
                              <p style={{ fontSize: 12, color: T.inkMid, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.property?.city} · {app.property?.price} €/mois · Score {app.score}/100
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 600,
                                padding: '3px 12px', borderRadius: 20,
                                ...(STATUS_STYLE[app.status] || {}),
                              }}>
                                {STATUS_LABEL[app.status] || app.status}
                              </span>
                              {app.status === 'APPROVED' && (
                                <Link to={`/property/${app.property?.id}`} style={{
                                  display: 'inline-flex', alignItems: 'center',
                                  padding: '5px 12px', borderRadius: 8,
                                  background: T.tenant, color: '#ffffff',
                                  fontSize: 12, fontWeight: 600, textDecoration: 'none',
                                }}>
                                  Réserver
                                </Link>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Visites à venir ────────────────────────────────────── */}
                <div style={cardBase}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint }}>
                        Visites à venir
                      </span>
                      <Link to="/my-bookings" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: T.tenant, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${T.border}` }} />
                  </div>

                  {isLoadingBookings ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                      <Loader2 size={24} style={{ color: T.inkFaint, animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : upcomingBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: T.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <Calendar size={18} style={{ color: T.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: T.inkMid, marginBottom: 8 }}>Aucune visite programmée</p>
                      <Link to="/search" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 500, color: T.tenant, textDecoration: 'none',
                      }}>
                        <Search size={13} /> Trouver un bien à visiter
                      </Link>
                    </div>
                  ) : (
                    <div>
                      {upcomingBookings.map((booking, idx) => {
                        const isLast = idx === upcomingBookings.length - 1
                        return (
                          <Link key={booking.id} to={`/property/${booking.property.id}`} style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '12px 20px',
                            borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                            textDecoration: 'none', transition: 'background 0.15s',
                          }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            {booking.property.images?.[0] ? (
                              <img src={booking.property.images[0]} alt={booking.property.title}
                                style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{
                                width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                                background: T.bgMuted, border: `1px solid ${T.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Home size={20} style={{ color: T.inkFaint }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {booking.property.title}
                              </p>
                              <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.inkMid, margin: '0 0 4px' }}>
                                <MapPin size={11} /> {booking.property.city}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: T.inkFaint }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Calendar size={11} />
                                  {format(new Date(booking.visitDate), 'dd MMM yyyy', { locale: fr })}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Clock size={11} />{booking.visitTime}
                                </span>
                              </div>
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, flexShrink: 0,
                              ...(booking.status === 'CONFIRMED'
                                ? { background: T.tenantLight, color: T.tenant, border: `1px solid ${T.tenantBorder}` }
                                : { background: T.caramelLight, color: T.caramel, border: '1px solid #e8c9a0' }),
                            }}>
                              {booking.status === 'CONFIRMED' ? 'Confirmée' : 'En attente'}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Bail actif ─────────────────────────────────────────── */}
                {activeContract && (
                  <div style={cardBase}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint }}>
                          Mon bail actif
                        </span>
                        <Link to="/contracts" style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 12, fontWeight: 500, color: T.tenant, textDecoration: 'none',
                        }}>
                          Voir le contrat <ArrowRight size={12} />
                        </Link>
                      </div>
                      <div style={{ borderTop: `1px solid ${T.border}` }} />
                    </div>

                    <div style={{ padding: 20 }}>
                      <Link to={`/contracts/${activeContract.id}`} style={{
                        display: 'block', padding: 20, borderRadius: 12,
                        background: T.tenantLight, border: `1px solid ${T.tenantBorder}`,
                        textDecoration: 'none', transition: 'box-shadow 0.2s, transform 0.2s',
                      }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = T.shadowHover;
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          (e.currentTarget as HTMLElement).style.transform = 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: T.ink, margin: '0 0 4px' }}>
                              {activeContract.property?.title}
                            </p>
                            <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.inkMid, margin: 0 }}>
                              <MapPin size={11} />
                              {activeContract.property?.address}, {activeContract.property?.city}
                            </p>
                          </div>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '4px 12px', borderRadius: 20,
                            background: '#ffffff', color: T.tenant,
                            border: `1px solid ${T.tenantBorder}`,
                            fontSize: 11, fontWeight: 600, flexShrink: 0,
                          }}>
                            <CheckCircle size={12} /> Actif
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                          {[
                            { label: 'Loyer',  value: `${activeContract.monthlyRent} €/mois`, isRent: true },
                            { label: 'Début',  value: format(new Date(activeContract.startDate), 'dd MMM yyyy', { locale: fr }), isRent: false },
                            { label: 'Fin',    value: format(new Date(activeContract.endDate),   'dd MMM yyyy', { locale: fr }), isRent: false },
                          ].map(({ label, value, isRent }) => (
                            <div key={label}>
                              <p style={{ fontSize: 11, color: T.inkFaint, margin: '0 0 3px' }}>{label}</p>
                              <p style={{
                                margin: 0,
                                fontFamily: isRent ? "'Cormorant Garamond', Georgia, serif" : "'DM Sans', system-ui, sans-serif",
                                fontSize: isRent ? 22 : 13,
                                fontWeight: 700,
                                color: isRent ? T.tenant : T.ink,
                              }}>
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ── Right sidebar (1/3) ──────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Journey checklist */}
              <div style={{ ...cardBase, padding: 20 }}>
                <p style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: T.inkFaint, marginBottom: 16,
                }}>
                  <Star size={13} style={{ color: T.caramel }} /> Votre parcours
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    {
                      done: dossierPercent === 100,
                      label: 'Dossier complet',
                      sub: `${dossierPercent}% complété`,
                      link: '/dossier',
                    },
                    {
                      done: applications.length > 0,
                      label: 'Postuler à une annonce',
                      sub: applications.length > 0 ? `${applications.length} candidature${applications.length > 1 ? 's' : ''}` : "Aucune pour l'instant",
                      link: '/search',
                    },
                    {
                      done: upcomingBookings.length > 0,
                      label: 'Réserver une visite',
                      sub: upcomingBookings.length > 0 ? `${upcomingBookings.length} visite${upcomingBookings.length > 1 ? 's' : ''} à venir` : 'Aucune programmée',
                      link: '/search',
                    },
                    {
                      done: !!activeContract,
                      label: 'Obtenir un bail actif',
                      sub: activeContract ? 'Bail en cours' : 'En attente',
                      link: '/contracts',
                    },
                  ].map(({ done, label, sub, link }) => (
                    <Link key={label} to={link} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none' }}>
                      <div style={{
                        flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${done ? T.tenant : T.borderMid}`,
                        background: done ? T.tenant : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        {done && <CheckCircle size={12} style={{ color: '#ffffff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, fontWeight: 600, margin: '0 0 2px',
                          color: done ? T.inkFaint : T.ink,
                          textDecoration: done ? 'line-through' : 'none',
                        }}>
                          {label}
                        </p>
                        <p style={{ fontSize: 11, color: T.inkFaint, margin: 0 }}>{sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div style={{ ...cardBase, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint, marginBottom: 16 }}>
                  Accès rapides
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { to: '/my-bookings',     icon: <Calendar size={16} />,       label: 'Mes visites',   badge: upcomingBookings.length },
                    { to: '/my-applications', icon: <SendHorizonal size={16} />,  label: 'Candidatures',  badge: pendingApps.length },
                    { to: '/dossier',         icon: <FolderOpen size={16} />,     label: 'Mon dossier',   badge: 0 },
                    { to: '/messages',        icon: <MessageSquare size={16} />,  label: 'Messages',      badge: unreadCount },
                    { to: '/favorites',       icon: <Heart size={16} />,          label: 'Favoris',       badge: 0 },
                    { to: '/contracts',       icon: <FileText size={16} />,       label: 'Contrats',      badge: pendingSignatureContracts.length },
                  ].map(({ to, icon, label, badge }, idx, arr) => (
                    <Link key={to} to={to} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 0',
                      borderBottom: idx < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                      textDecoration: 'none', color: T.ink,
                      transition: 'color 0.15s',
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.tenant }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.ink }}
                    >
                      <span style={{ color: 'inherit', display: 'flex', flexShrink: 0 }}>{icon}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{label}</span>
                      {badge > 0 ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: '#ffffff',
                          background: T.tenant, borderRadius: 20, padding: '1px 7px', flexShrink: 0,
                        }}>
                          {badge}
                        </span>
                      ) : (
                        <ChevronRight size={14} style={{ color: T.inkFaint, flexShrink: 0 }} />
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Search CTA */}
              <div style={{
                borderRadius: 16, padding: 20,
                background: T.tenantLight, border: `1px solid ${T.tenantBorder}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: T.tenant, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Search size={14} style={{ color: '#ffffff' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: 0 }}>Trouver votre logement</p>
                </div>
                <p style={{ fontSize: 12, color: T.inkMid, marginBottom: 14 }}>
                  {favoriteIds.size > 0
                    ? `${favoriteIds.size} bien${favoriteIds.size > 1 ? 's' : ''} en favori`
                    : 'Explorez les annonces disponibles.'}
                </p>
                <Link to="/search" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 10,
                  background: T.tenant, color: '#ffffff',
                  fontSize: 13, fontWeight: 600, textDecoration: 'none',
                }}>
                  <Search size={14} /> Parcourir les annonces
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Responsive grid helpers */}
      <style>{`
        @media (min-width: 1024px) {
          .t-lg-grid-4 { grid-template-columns: repeat(4, 1fr) !important; }
          .t-lg-grid-3col { grid-template-columns: 1fr 1fr 1fr !important; }
          .t-lg-col-span-2 { grid-column: span 2 !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  )
}
