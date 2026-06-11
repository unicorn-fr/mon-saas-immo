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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(13,12,10,0.09)' }}
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 14,
        padding: '18px 20px',
        borderLeft: `3px solid ${accent}`,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04)',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <Link
          to={to}
          style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color: BAI.inkFaint, textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = BAI.caramel)}
          onMouseLeave={(e) => (e.currentTarget.style.color = BAI.inkFaint)}
        >
          Voir <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 32, color: BAI.ink, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontFamily: BAI.fontBody, fontSize: 12.5, color: BAI.inkMid }}>
        {label}
      </div>
    </motion.div>
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
  }, [])

  const displayedProperties = myProperties.slice(0, 6)
  const totalProps = statistics?.totalProperties ?? myProperties.length

  const kpis: KpiProps[] = [
    {
      icon: <Home size={16} />,
      iconBg: `rgba(196,151,106,0.12)`,
      iconColor: BAI.caramel,
      value: isLoading ? '—' : totalProps,
      label: 'Biens actifs',
      to: '/properties/owner/me',
      accent: BAI.caramel,
      delay: 0.05,
    },
    {
      icon: <ClipboardList size={16} />,
      iconBg: `rgba(26,50,112,0.10)`,
      iconColor: BAI.owner,
      value: pendingApps.length,
      label: 'Candidatures en attente',
      to: '/applications/manage',
      accent: BAI.owner,
      delay: 0.10,
    },
    {
      icon: <Calendar size={16} />,
      iconBg: `rgba(27,94,59,0.10)`,
      iconColor: BAI.tenant,
      value: upcomingVisits.length,
      label: 'Visites à venir',
      to: '/bookings/manage',
      accent: BAI.tenant,
      delay: 0.15,
    },
    {
      icon: <MessageSquare size={16} />,
      iconBg: `rgba(26,26,46,0.08)`,
      iconColor: BAI.night,
      value: unreadCount,
      label: 'Messages non lus',
      to: '/messages',
      accent: BAI.night,
      delay: 0.20,
    },
  ]

  return (
    <Layout>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(16px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            style={{ marginBottom: 28 }}
          >
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 6,
            }}>
              Espace bailleur
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 5vw, 38px)',
              fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0,
            }}>
              Bonjour, {user?.firstName}
            </h1>
          </motion.div>

          {/* ── KPI bar ──────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}>
            {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
          </div>

          {/* ── Alerte identité ────────────────────────────────────────── */}
          {!identityVerified && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: BAI.warningLight, border: `1px solid ${BAI.caramelBorder}`,
                borderRadius: 12, padding: '12px 18px', marginBottom: 28,
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

          {/* ── Action requise — candidatures + visites ─────────────────── */}
          {(pendingApps.length > 0 || upcomingVisits.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              style={{ marginBottom: 36 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>
                  Requiert votre attention
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {/* Candidatures urgentes */}
                {pendingApps.slice(0, 3).map((app, i) => {
                  const tenant = app.tenant
                  const name = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Locataire'
                  const initials = tenant ? `${tenant.firstName?.[0] ?? ''}${tenant.lastName?.[0] ?? ''}`.toUpperCase() : '?'
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                    >
                      <Link to="/applications/manage" style={{ textDecoration: 'none' }}>
                        <motion.div
                          whileHover={{ y: -1, borderColor: BAI.ownerBorder }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                            borderRadius: 12, padding: '12px 16px',
                            transition: 'border-color 0.15s',
                          }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: BAI.owner,
                          }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                            <p style={{ fontSize: 11.5, color: BAI.inkFaint, margin: '2px 0 0' }}>
                              Candidature · {format(new Date(app.createdAt), 'd MMM', { locale: fr })}
                            </p>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: BAI.warning, background: BAI.warningLight,
                            border: `1px solid ${BAI.caramelBorder}`, borderRadius: 6, padding: '2px 7px',
                          }}>
                            Attente
                          </span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )
                })}

                {/* Visites à venir */}
                {upcomingVisits.map((visit, i) => {
                  const visitDt = new Date(`${visit.visitDate}T${visit.visitTime}`)
                  const tenant = visit.tenant
                  const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Locataire'
                  return (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 + i * 0.05 }}
                    >
                      <Link to="/bookings/manage" style={{ textDecoration: 'none' }}>
                        <motion.div
                          whileHover={{ y: -1, borderColor: BAI.tenantBorder }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                            borderRadius: 12, padding: '12px 16px',
                            transition: 'border-color 0.15s',
                          }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                            background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Calendar size={16} color={BAI.tenant} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {visit.property?.title ?? 'Visite confirmée'}
                            </p>
                            <p style={{ fontSize: 11.5, color: BAI.inkFaint, margin: '2px 0 0' }}>
                              {format(visitDt, 'EEE d MMM · HH:mm', { locale: fr })} · {tenantName}
                            </p>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: BAI.tenant, background: BAI.tenantLight,
                            border: `1px solid ${BAI.tenantBorder}`, borderRadius: 6, padding: '2px 7px',
                          }}>
                            Confirmée
                          </span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {pendingApps.length > 3 && (
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <Link to="/applications/manage" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: BAI.caramel, textDecoration: 'none' }}>
                    +{pendingApps.length - 3} autres candidatures <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Mes annonces ────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30 }}
            style={{ marginBottom: 40 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>
                Mes annonces
              </h2>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Link
                  to="/properties/new"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: BAI.night, color: '#fff',
                    fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: 600,
                    padding: '9px 16px', borderRadius: 9, textDecoration: 'none', minHeight: 40,
                  }}
                >
                  <Plus size={14} /> Ajouter
                </Link>
              </motion.div>
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
                  textAlign: 'center', padding: '48px 24px',
                  background: BAI.bgSurface, border: `1px dashed ${BAI.border}`, borderRadius: 16,
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `rgba(196,151,106,0.10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Home size={22} color={BAI.caramel} />
                </div>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14.5, color: BAI.inkMid, marginBottom: 20 }}>
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
                    <Plus size={16} /> Publier une annonce
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                  {displayedProperties.map((property, i) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32 + i * 0.06 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>
                {myProperties.length > 6 && (
                  <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Link
                      to="/properties/owner/me"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: 600, color: BAI.caramel, textDecoration: 'none' }}
                    >
                      Voir tous mes biens <ArrowRight size={14} />
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
