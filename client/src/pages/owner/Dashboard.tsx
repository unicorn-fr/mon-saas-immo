import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { useMessages } from '../../hooks/useMessages'
import { applicationService } from '../../services/application.service'
import { bookingService } from '../../services/booking.service'
import { Layout } from '../../components/layout/Layout'
import { PropertyCard } from '../../components/property/PropertyCard'
import { BAI } from '../../constants/bailio-tokens'
import {
  Plus, ArrowRight, ShieldAlert, Calendar,
  Home, ClipboardList, MessageSquare, ChevronRight,
  TrendingUp, Euro, BarChart2,
} from 'lucide-react'
import { apiClient } from '../../services/api.service'
import type { Application } from '../../types/application.types'
import type { Booking } from '../../types/booking.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Skeleton shimmer ────────────────────────────────────────────────────────
const shimmerStyle: React.CSSProperties = {
  background: `linear-gradient(90deg, ${BAI.bgMuted} 0%, #ebe8e2 40%, ${BAI.bgMuted} 100%)`,
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: 10,
}

function SkeletonCard() {
  return (
    <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ ...shimmerStyle, height: 180, borderRadius: 0 }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...shimmerStyle, height: 24, width: '55%' }} />
        <div style={{ ...shimmerStyle, height: 14, width: '40%' }} />
        <div style={{ ...shimmerStyle, height: 16, width: '80%' }} />
        <div style={{ ...shimmerStyle, height: 14, width: '60%', marginTop: 4 }} />
      </div>
    </div>
  )
}

// ── KPI card ────────────────────────────────────────────────────────────────
interface KpiProps {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  value: number | string
  label: string
  to: string
  accent: string
  delay: number
}

function KpiCard({ icon, iconBg, iconColor, value, label, to, accent, delay }: KpiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(13,12,10,0.10)' }}
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 14,
        padding: '20px 24px',
        borderTop: `3px solid ${accent}`,
        boxShadow: BAI.shadowMd,
        cursor: 'default',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <Link
          to={to}
          style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color: BAI.inkFaint, textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = BAI.caramel)}
          onMouseLeave={(e) => (e.currentTarget.style.color = BAI.inkFaint)}
        >
          Voir <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 36, color: BAI.ink, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint }}>
        {label}
      </div>
    </motion.div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, to, linkLabel }: { title: string; to?: string; linkLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(18px,2.5vw,22px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>
        {title}
      </h2>
      {to && linkLabel && (
        <Link
          to={to}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: BAI.caramel, textDecoration: 'none', transition: 'opacity 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {linkLabel} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { user } = useAuth()
  const { myProperties, statistics, fetchMyProperties, fetchMyStatistics, isLoading } = useProperties()
  const { unreadCount } = useMessages()

  const [pendingApps, setPendingApps] = useState<Application[]>([])
  const [upcomingVisits, setUpcomingVisits] = useState<Booking[]>([])
  const [identityVerified, setIdentityVerified] = useState(true)
  const [monthRevenue, setMonthRevenue] = useState<number | null>(null)
  const [activeContracts, setActiveContracts] = useState<number | null>(null)

  useEffect(() => {
    fetchMyProperties()
    fetchMyStatistics()

    applicationService.list().then((apps) => {
      setPendingApps(apps.filter((a) => a.status === 'PENDING'))
    }).catch(() => {})

    bookingService.getBookings({ status: 'CONFIRMED' }, { page: 1, limit: 20 }).then((res) => {
      const now = new Date()
      const future = res.bookings
        .filter((b) => new Date(`${b.visitDate}T${b.visitTime}`) > now)
        .sort((a, b) => new Date(`${a.visitDate}T${a.visitTime}`).getTime() - new Date(`${b.visitDate}T${b.visitTime}`).getTime())
        .slice(0, 3)
      setUpcomingVisits(future)
    }).catch(() => {})

    apiClient.get('/stripe/identity-status').then((res) => {
      setIdentityVerified(res.data?.data?.verified ?? true)
    }).catch(() => {})

    // Finance summary for dashboard widget
    apiClient.get('/finances/summary').then((res) => {
      const s = res.data?.data?.summary
      if (s) {
        const months = s.cashFlowByMonth ?? []
        const currentMonth = new Date().toISOString().slice(0, 7)
        const thisMonth = months.find((m: any) => m.month === currentMonth)
        setMonthRevenue(thisMonth ? Math.round(thisMonth.revenue) : null)
      }
    }).catch(() => {})

    apiClient.get('/contracts').then((res) => {
      const contracts = res.data?.data?.contracts ?? []
      setActiveContracts(contracts.filter((c: any) => c.status === 'ACTIVE').length)
    }).catch(() => {})
  }, [])

  const displayedProperties = myProperties.slice(0, 6)
  const totalProps = statistics?.totalProperties ?? myProperties.length

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })
  const contextMsg = pendingApps.length > 0
    ? `${pendingApps.length} candidature${pendingApps.length > 1 ? 's' : ''} en attente de votre décision.`
    : upcomingVisits.length > 0
    ? `${upcomingVisits.length} visite${upcomingVisits.length > 1 ? 's' : ''} confirmée${upcomingVisits.length > 1 ? 's' : ''} à venir.`
    : 'Tout est à jour.'

  const kpis: KpiProps[] = [
    {
      icon: <Home size={18} />,
      iconBg: `rgba(196,151,106,0.12)`,
      iconColor: BAI.caramel,
      value: isLoading ? '—' : totalProps,
      label: 'Biens actifs',
      to: '/properties/owner/me',
      accent: BAI.caramel,
      delay: 0.06,
    },
    {
      icon: <ClipboardList size={18} />,
      iconBg: `rgba(26,50,112,0.10)`,
      iconColor: BAI.owner,
      value: pendingApps.length,
      label: 'Candidatures en attente',
      to: '/applications/manage',
      accent: BAI.owner,
      delay: 0.12,
    },
    {
      icon: <Calendar size={18} />,
      iconBg: `rgba(27,94,59,0.10)`,
      iconColor: BAI.tenant,
      value: upcomingVisits.length,
      label: 'Visites à venir',
      to: '/bookings/manage',
      accent: BAI.tenant,
      delay: 0.18,
    },
    {
      icon: <MessageSquare size={18} />,
      iconBg: `rgba(26,26,46,0.08)`,
      iconColor: BAI.night,
      value: unreadCount,
      label: 'Messages non lus',
      to: '/messages',
      accent: BAI.night,
      delay: 0.24,
    },
  ]

  return (
    <Layout>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(20px, 4vw, 48px)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 36 }}
          >
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 8,
            }}>
              Tableau de bord
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px',
            }}>
              Bonjour, {user?.firstName}.
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
              <span style={{ textTransform: 'capitalize' }}>{todayLabel}</span>
              {' · '}
              <span style={{ color: BAI.inkFaint }}>{contextMsg}</span>
            </p>
          </motion.div>

          {/* ── KPI bar ──────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 16,
            marginBottom: 36,
          }}>
            {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
          </div>

          {/* ── Revenus & raccourcis ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {/* Revenus ce mois */}
            <div style={{
              background: BAI.night,
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: '0 4px 20px rgba(26,26,46,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: 'rgba(196,151,106,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Euro size={20} color={BAI.caramel} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '0 0 4px' }}>
                  Revenus ce mois
                </p>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: monthRevenue !== null ? BAI.caramel : 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1 }}>
                  {monthRevenue !== null ? `${monthRevenue.toLocaleString('fr-FR')} €` : '—'}
                </p>
              </div>
              <Link to="/dashboard/owner/finances" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = BAI.caramel)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                <BarChart2 size={14} />
              </Link>
            </div>

            {/* Contrats actifs */}
            <div style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: BAI.shadowMd,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: BAI.tenantLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <TrendingUp size={20} color={BAI.tenant} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 4px' }}>
                  Contrats actifs
                </p>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.tenant, margin: 0, lineHeight: 1 }}>
                  {activeContracts !== null ? activeContracts : '—'}
                </p>
              </div>
              <Link to="/contracts" style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color: BAI.inkFaint, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = BAI.caramel)}
                onMouseLeave={e => (e.currentTarget.style.color = BAI.inkFaint)}>
                Voir <ChevronRight size={11} />
              </Link>
            </div>

            {/* Mes locataires */}
            <div style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: BAI.shadowMd,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: BAI.ownerLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Home size={20} color={BAI.owner} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 4px' }}>
                  Mes locataires
                </p>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.owner, margin: 0, lineHeight: 1 }}>
                  {activeContracts !== null ? activeContracts : '—'}
                </p>
              </div>
              <Link to="/owner/tenants" style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color: BAI.inkFaint, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = BAI.caramel)}
                onMouseLeave={e => (e.currentTarget.style.color = BAI.inkFaint)}>
                Voir <ChevronRight size={11} />
              </Link>
            </div>
          </motion.div>

          {/* ── Alerte identité ────────────────────────────────────────── */}
          {!identityVerified && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: BAI.warningLight, border: `1px solid ${BAI.caramelBorder}`,
                borderRadius: 12, padding: '12px 18px', marginBottom: 32,
              }}
            >
              <ShieldAlert size={16} color={BAI.warning} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: BAI.fontBody, fontSize: 13.5, color: BAI.warning, flex: 1 }}>
                Vérifiez votre identité pour activer les candidatures.
              </span>
              <Link to="/verify-identity" style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.warning, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                Vérifier →
              </Link>
            </motion.div>
          )}

          {/* ── Section principale 2 colonnes ─────────────────────────── */}
          {(pendingApps.length > 0 || upcomingVisits.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 24,
                marginBottom: 40,
              }}
            >
              {/* Candidatures récentes */}
              {pendingApps.length > 0 && (
                <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '20px 24px', boxShadow: BAI.shadowMd }}>
                  <SectionHeader title="Candidatures récentes" to="/applications/manage" linkLabel="Voir tout" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pendingApps.slice(0, 5).map((app, i) => {
                      const tenant = app.tenant
                      const name = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Locataire'
                      const initials = tenant ? `${tenant.firstName?.[0] ?? ''}${tenant.lastName?.[0] ?? ''}`.toUpperCase() : '?'
                      const propTitle = (app as any).property?.title ?? 'Bien'
                      return (
                        <motion.div
                          key={app.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.30 + i * 0.05 }}
                        >
                          <Link to="/applications/manage" style={{ textDecoration: 'none' }}>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, transition: 'background 0.15s', cursor: 'pointer' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, color: BAI.owner, fontFamily: BAI.fontBody,
                              }}>
                                {initials}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: 600, color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 11.5, color: BAI.inkFaint, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {propTitle} · {format(new Date(app.createdAt), 'd MMM', { locale: fr })}
                                </p>
                              </div>
                              <span style={{
                                fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                                color: BAI.warning, background: BAI.warningLight,
                                border: `1px solid ${BAI.caramelBorder}`, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
                              }}>
                                Attente
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                  {pendingApps.length > 5 && (
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                      <Link to="/applications/manage" style={{ fontFamily: BAI.fontBody, fontSize: 12.5, fontWeight: 600, color: BAI.caramel, textDecoration: 'none' }}>
                        +{pendingApps.length - 5} autres candidatures
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Prochaines visites */}
              {upcomingVisits.length > 0 && (
                <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '20px 24px', boxShadow: BAI.shadowMd }}>
                  <SectionHeader title="Visites à venir" to="/bookings/manage" linkLabel="Voir tout" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {upcomingVisits.map((visit, i) => {
                      const visitDt = new Date(`${visit.visitDate}T${visit.visitTime}`)
                      const tenant = visit.tenant
                      const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Locataire'
                      return (
                        <motion.div
                          key={visit.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.32 + i * 0.05 }}
                        >
                          <Link to="/bookings/manage" style={{ textDecoration: 'none' }}>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, transition: 'background 0.15s', cursor: 'pointer' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                                background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Calendar size={16} color={BAI.tenant} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: 600, color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {visit.property?.title ?? 'Visite confirmée'}
                                </p>
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 11.5, color: BAI.inkFaint, margin: '2px 0 0' }}>
                                  {format(visitDt, 'EEE d MMM · HH:mm', { locale: fr })} · {tenantName}
                                </p>
                              </div>
                              <span style={{
                                fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                                color: BAI.tenant, background: BAI.tenantLight,
                                border: `1px solid ${BAI.tenantBorder}`, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
                              }}>
                                Confirmée
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Biens récents ────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 48 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>
                Mes annonces
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {myProperties.length > 6 && (
                  <Link
                    to="/properties/owner/me"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12.5, fontWeight: 600, color: BAI.caramel, textDecoration: 'none' }}
                  >
                    Gérer mes biens <ArrowRight size={13} />
                  </Link>
                )}
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/properties/new"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: BAI.night, color: '#fff',
                      fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                      padding: '9px 16px', borderRadius: 9, textDecoration: 'none', minHeight: 40,
                    }}
                  >
                    <Plus size={14} /> Ajouter
                  </Link>
                </motion.div>
              </div>
            </div>

            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : displayedProperties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center', padding: '56px 24px',
                  background: BAI.bgSurface, border: `1px dashed ${BAI.border}`, borderRadius: 16,
                  boxShadow: BAI.shadowMd,
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: BAI.bgMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <Home size={24} color={BAI.inkFaint} />
                </div>
                <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: BAI.ink, marginBottom: 8 }}>
                  Vous n'avez pas encore de bien
                </h3>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, marginBottom: 24 }}>
                  Publiez votre première annonce et commencez à recevoir des candidatures.
                </p>
                <motion.div whileTap={{ scale: 0.96 }} style={{ display: 'inline-block' }}>
                  <Link
                    to="/properties/new"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: BAI.night, color: '#fff',
                      fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
                      padding: '12px 24px', borderRadius: 10, textDecoration: 'none',
                    }}
                  >
                    <Plus size={16} /> Ajouter votre premier bien
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {displayedProperties.map((property, i) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.36 + i * 0.06, duration: 0.28 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>
                {myProperties.length > 6 && (
                  <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <Link
                      to="/properties/owner/me"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: 600,
                        color: BAI.caramel, textDecoration: 'none',
                        padding: '10px 20px', border: `1px solid ${BAI.caramelBorder}`,
                        borderRadius: 9, background: BAI.caramelLight,
                      }}
                    >
                      <TrendingUp size={14} /> Voir tous mes biens ({myProperties.length})
                    </Link>
                  </div>
                )}
              </>
            )}
          </motion.section>

        </div>
      </div>
    </Layout>
  )
}
