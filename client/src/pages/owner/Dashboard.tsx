import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { bookingService } from '../../services/booking.service'
import { applicationService } from '../../services/application.service'
import { Layout } from '../../components/layout/Layout'
import {
  Home, Plus, Eye, TrendingUp,
  Euro, ArrowRight, MapPin, FileText, PenLine,
  AlertTriangle, CalendarCheck, Users,
  ClipboardList, Zap, Banknote, ArrowUpRight, Clock,
} from 'lucide-react'
import type { Application } from '../../types/application.types'
import type { Booking } from '../../types/booking.types'
import { format, isAfter, parseISO } from 'date-fns'
import { BAI, glassStyle } from '../../constants/bailio-tokens'
import { fr } from 'date-fns/locale'


const cardBase: React.CSSProperties = {
  ...glassStyle('light', 'light'),
  borderRadius: 16,
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { statistics, myProperties, fetchMyStatistics, fetchMyProperties, isLoading } = useProperties()
  const { contracts, statistics: contractStats, fetchContracts, fetchStatistics: fetchContractStatistics } = useContractStore()
  const { fetchUnreadCount } = useMessages()
  const [pendingApps, setPendingApps] = useState<Application[]>([])
  const [upcomingVisits, setUpcomingVisits] = useState<Booking[]>([])

  useEffect(() => {
    fetchMyStatistics()
    fetchMyProperties({ page: 1, limit: 6 })
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
    fetchUnreadCount()
    applicationService.list().then((apps) => {
      setPendingApps(apps.filter((a) => a.status === 'PENDING'))
    }).catch(() => {})
    // Load upcoming confirmed visits
    const today = new Date().toISOString().split('T')[0]
    bookingService.getBookings({ status: 'CONFIRMED', dateFrom: today }, { page: 1, limit: 10 })
      .then(res => {
        const sorted = res.bookings
          .filter(b => isAfter(parseISO(b.visitDate), new Date(new Date().setHours(0,0,0,0))))
          .sort((a, b) => a.visitDate.localeCompare(b.visitDate) || a.visitTime.localeCompare(b.visitTime))
        setUpcomingVisits(sorted.slice(0, 5))
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeContracts   = contracts.filter((c) => c.status === 'ACTIVE')
  const monthlyRevenue    = activeContracts.reduce((sum, c) => sum + c.monthlyRent + (c.charges || 0), 0)
  const annualRevenue     = monthlyRevenue * 12
  const totalProps        = statistics?.totalProperties || 0
  const occupiedProps     = statistics?.occupiedProperties || 0
  const availableProps    = statistics?.availableProperties || 0
  const occupancyRate     = totalProps > 0 ? Math.round((occupiedProps / totalProps) * 100) : 0
  const pendingSignatures = (contractStats?.sent || 0) + (contractStats?.completed || 0)
  const drafts            = contractStats?.draft || 0
  const urgentContracts   = contracts.filter((c) => c.status === 'SIGNED_TENANT')
  const estimatedYield    = monthlyRevenue > 0 ? ((annualRevenue / (monthlyRevenue * 200)) * 100).toFixed(1) : '—'
  const cashflow          = monthlyRevenue

  const statusBadge: Record<string, { label: string; bg: string; text: string; border: string }> = {
    AVAILABLE: { label: 'Disponible',  bg: '#edf7f2', text: '#1b5e3b', border: '#9fd4ba' },
    OCCUPIED:  { label: 'En location', bg: BAI.caramelLight, text: BAI.caramel, border: '#e8c9a0' },
    RESERVED:  { label: 'Réservé',     bg: BAI.ownerLight, text: BAI.owner, border: BAI.ownerBorder },
    DRAFT:     { label: 'Hors marché', bg: BAI.bgMuted, text: BAI.inkMid, border: BAI.borderStrong },
  }

  const getContractStatusLabel = (status: string) => ({
    DRAFT: 'Brouillon', SENT: 'Envoyé', SIGNED_OWNER: 'En signature',
    SIGNED_TENANT: 'À signer', COMPLETED: 'Signé', ACTIVE: 'Actif',
    EXPIRED: 'Expiré', TERMINATED: 'Résilié',
  }[status] || status)

  const contractStatusStyle = (status: string): React.CSSProperties =>
    status === 'ACTIVE'        ? { background: '#edf7f2',   color: '#1b5e3b', border: '1px solid #9fd4ba' } :
    status === 'DRAFT'         ? { background: BAI.caramelLight, color: BAI.caramel, border: '1px solid #e8c9a0' } :
    status === 'SIGNED_TENANT' ? { background: '#fef2f2',   color: '#b91c1c', border: '1px solid #fecaca' } :
    { background: BAI.ownerLight, color: BAI.owner, border: `1px solid ${BAI.ownerBorder}` }

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading && !statistics) {
    return (
      <Layout showHeader={false}>
        <div style={{ background: BAI.bgBase, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `3px solid ${BAI.ownerLight}`,
            borderTopColor: BAI.owner,
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </Layout>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (totalProps === 0) {
    return (
      <Layout showHeader={false}>
        <div style={{ background: BAI.bgBase, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Home size={36} style={{ color: BAI.owner }} />
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 700, fontStyle: 'italic',
              fontSize: 32, color: BAI.ink, marginBottom: 12,
            }}>
              Votre patrimoine vous attend
            </h2>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 16, color: BAI.inkMid, marginBottom: 32, lineHeight: 1.6 }}>
              Ajoutez votre première propriété pour commencer à gérer vos locations et suivre vos revenus.
            </p>
            <Link to="/properties/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: BAI.owner, color: '#ffffff',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
              <Plus size={16} /> Ajouter ma première propriété
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Layout showHeader={false}>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 13, color: BAI.inkFaint, fontWeight: 400, marginBottom: 4, textTransform: 'capitalize' }}>
                {todayLabel}
              </p>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 700, fontStyle: 'italic',
                fontSize: 'clamp(32px, 6vw, 52px)', color: BAI.ink, lineHeight: 1.05, margin: 0,
              }}>
                Bonjour, {user?.firstName}
              </h1>
            </div>
            <Link to="/properties/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: BAI.owner, color: '#ffffff',
              fontWeight: 600, fontSize: 13, textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}>
              <Plus size={15} /> Nouveau bien
            </Link>
          </div>

          {/* ── Alertes ─────────────────────────────────────────────────── */}
          {(urgentContracts.length > 0 || pendingApps.length > 0 || drafts > 0) && (
            <div style={{
              background: BAI.caramelLight, border: `1px solid #e8c9a0`,
              borderLeft: `3px solid ${BAI.caramel}`,
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
              marginBottom: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <AlertTriangle size={15} style={{ color: BAI.caramel, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: BAI.caramel }}>Actions requises</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {urgentContracts.length > 0 && (
                  <Link to="/contracts" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    background: BAI.caramel, color: '#ffffff',
                    fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  }}>
                    <PenLine size={12} />
                    {urgentContracts.length} contrat{urgentContracts.length > 1 ? 's' : ''} à signer
                  </Link>
                )}
                {pendingApps.length > 0 && (
                  <Link to="/applications/manage" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    background: BAI.owner, color: '#ffffff',
                    fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  }}>
                    <ClipboardList size={12} />
                    {pendingApps.length} candidature{pendingApps.length > 1 ? 's' : ''} en attente
                  </Link>
                )}
                {drafts > 0 && (
                  <Link to="/contracts" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    background: BAI.bgMuted, color: BAI.inkMid,
                    border: `1px solid ${BAI.borderStrong}`,
                    fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  }}>
                    <AlertTriangle size={12} />
                    {drafts} brouillon{drafts > 1 ? 's' : ''} à finaliser
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ── KPI row ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 32 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
          >
            {/* We render four KPI cards inline */}
            {[
              {
                label: 'Revenus mensuels',
                value: `${monthlyRevenue.toLocaleString('fr-FR')} €`,
                sub: `${annualRevenue.toLocaleString('fr-FR')} € / an`,
                to: undefined as string | undefined,
              },
              {
                label: "Taux d'occupation",
                value: `${occupancyRate}%`,
                sub: `${occupiedProps} loué${occupiedProps > 1 ? 's' : ''} / ${totalProps} biens`,
                to: '/properties/owner/me',
              },
              {
                label: 'Rendement estimé',
                value: monthlyRevenue > 0 ? `${estimatedYield}%` : '—',
                sub: 'Rendement brut annuel',
                to: '/applications/manage',
              },
              {
                label: 'Candidatures en attente',
                value: String(pendingApps.length),
                sub: pendingApps.length > 0 ? 'En attente de traitement' : 'Aucune en attente',
                to: '/applications/manage',
              },
            ].map((kpi) => {
              const inner = (
                <div style={{
                  ...cardBase,
                  padding: 20,
                  display: 'flex', flexDirection: 'column', height: '100%',
                  boxSizing: 'border-box', cursor: kpi.to ? 'pointer' : 'default',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={(e) => {
                    if (kpi.to) {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(13,12,10,0.13), inset 0 1px 0 rgba(255,255,255,0.70)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'none'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = BAI.glassShadow
                  }}
                >
                  {/* Accent bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${BAI.owner}, ${BAI.ownerBorder})`,
                    borderRadius: '16px 16px 0 0',
                  }} />
                  <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 12 }}>
                    {kpi.label}
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 700, fontSize: 44, color: BAI.ink,
                    lineHeight: 1, marginBottom: 4,
                  }}>
                    {kpi.value}
                  </p>
                  <p style={{ fontSize: 12, color: BAI.inkFaint }}>
                    {kpi.sub}
                  </p>
                  {kpi.to && (
                    <ArrowUpRight size={14} style={{ color: BAI.inkFaint, marginTop: 'auto', alignSelf: 'flex-end', marginBottom: 0 }} />
                  )}
                </div>
              )
              return kpi.to ? (
                <Link key={kpi.label} to={kpi.to} style={{ textDecoration: 'none', display: 'block' }}>
                  {inner}
                </Link>
              ) : (
                <div key={kpi.label}>{inner}</div>
              )
            })}
          </div>

          {/* ── Main grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">

            {/* Left column (2/3) */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Mes biens ─────────────────────────────────────────── */}
                <div style={cardBase}>
                  {/* Section header */}
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BAI.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                        Mes biens
                      </span>
                      <Link to="/properties/owner/me" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: BAI.owner, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${BAI.border}` }} />
                  </div>

                  <div>
                    {myProperties.slice(0, 5).map((property, idx) => {
                      const badge = statusBadge[property.status] || statusBadge['DRAFT']
                      const isLast = idx === Math.min(myProperties.length, 5) - 1
                      return (
                        <button key={property.id} onClick={() => navigate(`/properties/${property.id}`)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                            padding: '12px 20px', textAlign: 'left', background: 'transparent',
                            border: 'none', borderBottom: isLast ? 'none' : `1px solid ${BAI.border}`,
                            cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          {property.images?.[0] ? (
                            <img src={property.images[0]} alt={property.title}
                              style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          ) : (
                            <div style={{
                              width: 64, height: 64, borderRadius: 10, flexShrink: 0,
                              background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Home size={24} style={{ color: BAI.inkFaint }} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {property.title}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: BAI.inkMid }}>
                              <MapPin size={11} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.city}</span>
                              <span style={{ flexShrink: 0 }}>· {property.bedrooms} ch · {property.surface} m²</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                              {Number(property.price).toLocaleString('fr-FR')} <span style={{ fontWeight: 400, fontSize: 11, color: BAI.inkFaint, whiteSpace: 'nowrap' }}>€ / mois</span>
                            </p>
                            <span style={{
                              fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                              background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`,
                            }}>
                              {badge.label}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ padding: '12px 20px', borderTop: `1px solid ${BAI.border}` }}>
                    <Link to="/properties/new" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                      color: BAI.owner, textDecoration: 'none', transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.ownerLight }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <Plus size={13} /> Ajouter un bien
                    </Link>
                  </div>
                </div>

                {/* ── Visites à venir ───────────────────────────────────── */}
                <div style={cardBase}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BAI.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                          Visites à venir
                        </span>
                        {upcomingVisits.length > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#ffffff',
                            background: BAI.owner, borderRadius: 20, padding: '1px 8px',
                          }}>{upcomingVisits.length}</span>
                        )}
                      </div>
                      <Link to="/bookings/manage" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: BAI.owner, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${BAI.border}` }} />
                  </div>

                  {upcomingVisits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: BAI.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                      }}>
                        <CalendarCheck size={18} style={{ color: BAI.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: BAI.inkMid }}>Aucune visite confirmée à venir</p>
                    </div>
                  ) : (
                    <div>
                      {upcomingVisits.map((visit, idx) => {
                        const isLast = idx === upcomingVisits.length - 1
                        const visitDateObj = parseISO(visit.visitDate)
                        const isToday = format(visitDateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                        return (
                          <div key={visit.id} style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '12px 20px',
                            borderBottom: isLast ? 'none' : `1px solid ${BAI.border}`,
                          }}>
                            {/* Date badge */}
                            <div style={{
                              width: 44, flexShrink: 0, textAlign: 'center',
                              background: isToday ? BAI.ownerLight : BAI.bgMuted,
                              border: `1px solid ${isToday ? BAI.ownerBorder : BAI.border}`,
                              borderRadius: 10, padding: '6px 4px',
                            }}>
                              <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: isToday ? BAI.owner : BAI.ink, fontFamily: "'Cormorant Garamond', serif", margin: 0 }}>
                                {format(visitDateObj, 'd')}
                              </p>
                              <p style={{ fontSize: 10, fontWeight: 600, color: isToday ? BAI.owner : BAI.inkFaint, textTransform: 'uppercase', margin: 0 }}>
                                {format(visitDateObj, 'MMM', { locale: fr })}
                              </p>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              {/* Tenant — clickable */}
                              <button
                                onClick={() => navigate(`/owner/tenants/${visit.tenantId}`)}
                                style={{
                                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                  fontSize: 14, fontWeight: 600, color: BAI.owner, textAlign: 'left',
                                  marginBottom: 2, display: 'block', maxWidth: '100%',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}
                              >
                                {visit.tenant.firstName} {visit.tenant.lastName}
                              </button>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: BAI.inkMid, flexWrap: 'wrap' }}>
                                <MapPin size={11} style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {visit.property.title}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 13, fontWeight: 700, color: BAI.ink,
                              }}>
                                <Clock size={12} style={{ color: BAI.inkFaint }} />
                                {visit.visitTime}
                              </span>
                              <span style={{ fontSize: 11, color: BAI.inkFaint }}>{visit.duration} min</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Candidatures en attente ────────────────────────────── */}
                <div style={cardBase}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BAI.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                          Candidatures en attente
                        </span>
                        {pendingApps.length > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#ffffff',
                            background: BAI.owner, borderRadius: 20, padding: '1px 8px',
                          }}>
                            {pendingApps.length}
                          </span>
                        )}
                      </div>
                      <Link to="/applications/manage" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: BAI.owner, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${BAI.border}` }} />
                  </div>

                  {pendingApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: BAI.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <Users size={18} style={{ color: BAI.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: BAI.inkMid }}>Aucune candidature en attente</p>
                    </div>
                  ) : (
                    <div>
                      {pendingApps.slice(0, 4).map((app, idx) => {
                        const isLast = idx === Math.min(pendingApps.length, 4) - 1
                        const scoreStroke = app.score >= 70 ? '#1b5e3b' : app.score >= 40 ? BAI.caramel : '#b91c1c'
                        const circumference = 2 * Math.PI * 16
                        return (
                          <div key={app.id} style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '12px 20px',
                            borderBottom: isLast ? 'none' : `1px solid ${BAI.border}`,
                          }}>
                            {/* Score ring */}
                            <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                              <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="20" cy="20" r="16" strokeWidth="3" fill="none" stroke={BAI.bgMuted} />
                                <circle cx="20" cy="20" r="16" strokeWidth="3" fill="none"
                                  style={{
                                    stroke: scoreStroke,
                                    strokeDasharray: circumference,
                                    strokeDashoffset: circumference * (1 - app.score / 100),
                                    strokeLinecap: 'round',
                                    transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)',
                                  }} />
                              </svg>
                              <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <span style={{
                                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                                  fontSize: 13, fontWeight: 700, color: scoreStroke,
                                }}>
                                  {app.score}
                                </span>
                              </div>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.tenant?.firstName} {app.tenant?.lastName}
                              </p>
                              <p style={{ fontSize: 12, color: BAI.inkMid, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.property?.title} · {format(new Date(app.createdAt), 'd MMM', { locale: fr })}
                              </p>
                            </div>

                            <Link to="/applications/manage" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '6px 14px', borderRadius: 8,
                              background: BAI.owner, color: '#ffffff',
                              fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
                              transition: 'opacity 0.15s',
                            }}>
                              <Zap size={12} /> Traiter
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Contrats récents ───────────────────────────────────── */}
                <div style={cardBase}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BAI.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                        Contrats récents
                      </span>
                      <Link to="/contracts" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: BAI.owner, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${BAI.border}` }} />
                  </div>

                  {contracts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: BAI.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <FileText size={18} style={{ color: BAI.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 16 }}>Aucun contrat</p>
                      <Link to="/contracts/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: BAI.owner, color: '#ffffff',
                        fontSize: 12, fontWeight: 600, textDecoration: 'none',
                      }}>
                        <Plus size={13} /> Créer un contrat
                      </Link>
                    </div>
                  ) : (
                    <div>
                      {contracts.slice(0, 4).map((contract, idx) => {
                        const isLast = idx === Math.min(contracts.length, 4) - 1
                        return (
                          <button key={contract.id} onClick={() => navigate(`/contracts/${contract.id}`)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                              padding: '12px 20px', textAlign: 'left', background: 'transparent',
                              border: 'none', borderBottom: isLast ? 'none' : `1px solid ${BAI.border}`,
                              cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {contract.property?.title || 'Contrat'}
                              </p>
                              <p style={{ fontSize: 12, color: BAI.inkMid, margin: 0 }}>
                                {contract.tenant?.firstName} {contract.tenant?.lastName} · {Number(contract.monthlyRent).toLocaleString('fr-FR')} €/mois
                              </p>
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, flexShrink: 0,
                              ...contractStatusStyle(contract.status),
                            }}>
                              {getContractStatusLabel(contract.status)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Right sidebar (1/3) ──────────────────────────────────── */}
            <div className="hidden lg:flex" style={{ flexDirection: 'column', gap: 16 }}>

              {/* Activity — prominent KPI grid */}
              <div style={{ ...cardBase, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 16 }}>
                  Activité
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Vues annonces',   value: statistics?.totalViews   || 0, icon: <Eye size={13} /> },
                    { label: 'Contacts reçus',  value: statistics?.totalContacts || 0, icon: <Users size={13} /> },
                    { label: 'Contrats actifs', value: contractStats?.active    || 0, icon: <FileText size={13} /> },
                    { label: 'En signature',    value: pendingSignatures,              icon: <PenLine size={13} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{
                      padding: '14px 12px',
                      background: BAI.bgMuted,
                      borderRadius: 12,
                      border: `1px solid ${BAI.border}`,
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 7, marginBottom: 10,
                        background: BAI.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: BAI.owner,
                      }}>
                        {icon}
                      </div>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 40, fontWeight: 700, color: BAI.ink,
                        lineHeight: 1, margin: '0 0 5px',
                      }}>
                        {value}
                      </p>
                      <p style={{ fontSize: 11, color: BAI.inkMid, margin: 0, lineHeight: 1.4 }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio breakdown */}
              <div style={{ ...cardBase, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 16 }}>
                  Parc immobilier
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                  {[
                    { label: 'Occupés',       value: occupiedProps,                              pct: totalProps > 0 ? (occupiedProps / totalProps) * 100 : 0 },
                    { label: 'Disponibles',   value: availableProps,                             pct: totalProps > 0 ? (availableProps / totalProps) * 100 : 0 },
                    { label: 'Hors marché',   value: totalProps - occupiedProps - availableProps, pct: totalProps > 0 ? ((totalProps - occupiedProps - availableProps) / totalProps) * 100 : 0 },
                  ].map(({ label, value, pct }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: BAI.inkMid }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: BAI.ink }}>{value}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: BAI.bgMuted, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          background: BAI.owner,
                          width: `${pct}%`,
                          transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 12, borderTop: `1px solid ${BAI.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: BAI.inkMid }}>Total</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: BAI.ink }}>{totalProps} bien{totalProps > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Finance card */}
              <div style={{ ...cardBase, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, margin: 0 }}>
                    Finances
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Revenus annuels',  value: `${annualRevenue.toLocaleString('fr-FR')} €`, icon: <Banknote size={15} /> },
                    { label: 'Cash-flow / mois', value: `${cashflow.toLocaleString('fr-FR')} €`,      icon: <Euro size={15} /> },
                    { label: 'Rendement',         value: `${estimatedYield}%`,                          icon: <TrendingUp size={15} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: BAI.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: BAI.owner, flexShrink: 0,
                        }}>
                          {icon}
                        </div>
                        <span style={{ fontSize: 12, color: BAI.inkMid }}>{label}</span>
                      </div>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 20, fontWeight: 700, color: BAI.ink,
                      }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>


            </div>
          </div>

        </div>
      </div>

    </Layout>
  )
}
