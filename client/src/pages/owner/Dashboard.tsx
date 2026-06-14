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

const HERO_BG = '#0a0d1a'
const HERO_IMG = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80'

// ── Skeleton shimmer ─────────────────────────────────────────────────────────
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

// ── Hero glass badge ──────────────────────────────────────────────────────────
function HeroBadge({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.13)',
      borderRadius: 16,
      padding: '8px 14px',
    }}>
      <span style={{ color: BAI.caramel, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 20, color: '#fff', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

// ── KPI card ─────────────────────────────────────────────────────────────────
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
      whileHover={{ y: -3 }}
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 14,
        padding: '20px 24px',
        borderTop: `3px solid ${accent}`,
        boxShadow: BAI.shadowMd,
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
      <div style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 40, color: BAI.ink, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint }}>
        {label}
      </div>
    </motion.div>
  )
}

// ── Activity feed item ────────────────────────────────────────────────────────
type FeedKind = 'application' | 'visit' | 'message'

interface FeedItem {
  id: string
  kind: FeedKind
  name: string
  action: string
  date: Date
}

const kindConfig: Record<FeedKind, { color: string; bg: string; border: string }> = {
  application: { color: BAI.owner, bg: BAI.ownerLight, border: BAI.ownerBorder },
  visit:       { color: BAI.tenant, bg: BAI.tenantLight, border: BAI.tenantBorder },
  message:     { color: BAI.caramel, bg: BAI.caramelLight, border: BAI.caramelBorder },
}

function FeedRow({ item }: { item: FeedItem }) {
  const cfg = kindConfig[item.kind]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      paddingTop: 10, paddingBottom: 10,
      borderBottom: `1px solid ${BAI.border}`,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: cfg.color,
        boxShadow: `0 0 0 3px ${cfg.bg}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
          {item.name}
        </span>
        {' '}
        <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>
          {item.action}
        </span>
      </div>
      <span style={{
        fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, flexShrink: 0,
        textTransform: 'capitalize',
      }}>
        {format(item.date, 'dd MMM', { locale: fr })}
      </span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
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
        .slice(0, 5)
      setUpcomingVisits(future)
    }).catch(() => {})

    apiClient.get('/stripe/identity-status').then((res) => {
      setIdentityVerified(res.data?.data?.verified ?? true)
    }).catch(() => {})
  }, [])

  const displayedProperties = myProperties.slice(0, 3)
  const totalProps = statistics?.totalProperties ?? myProperties.length

  // Build activity feed (max 5 items, mixed)
  const feedItems: FeedItem[] = [
    ...pendingApps.slice(0, 3).map((a): FeedItem => ({
      id: `app-${a.id}`,
      kind: 'application',
      name: a.tenant ? `${a.tenant.firstName} ${a.tenant.lastName}` : 'Un candidat',
      action: `a postulé pour "${(a as any).property?.title ?? 'votre bien'}"`,
      date: new Date(a.createdAt),
    })),
    ...upcomingVisits.slice(0, 2).map((v): FeedItem => ({
      id: `visit-${v.id}`,
      kind: 'visit',
      name: `${v.tenant.firstName} ${v.tenant.lastName}`,
      action: `visite — ${v.property?.title ?? 'bien'}`,
      date: new Date(`${v.visitDate}T${v.visitTime}`),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)

  const kpis: KpiProps[] = [
    {
      icon: <ClipboardList size={18} />,
      iconBg: `rgba(26,50,112,0.10)`,
      iconColor: BAI.owner,
      value: pendingApps.length,
      label: 'Candidatures en attente',
      to: '/applications/manage',
      accent: BAI.owner,
      delay: 0.06,
    },
    {
      icon: <Calendar size={18} />,
      iconBg: `rgba(27,94,59,0.10)`,
      iconColor: BAI.tenant,
      value: upcomingVisits.length,
      label: 'Visites planifiées',
      to: '/bookings/manage',
      accent: BAI.tenant,
      delay: 0.12,
    },
    {
      icon: <MessageSquare size={18} />,
      iconBg: `rgba(196,151,106,0.12)`,
      iconColor: BAI.caramel,
      value: unreadCount,
      label: 'Messages non lus',
      to: '/messages',
      accent: BAI.caramel,
      delay: 0.18,
    },
  ]

  return (
    <Layout>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── 1. HERO BANNER ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'relative',
          background: HERO_BG,
          height: 'clamp(160px, 22vw, 220px)',
          overflow: 'hidden',
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Ambient glow top-right */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '60%', height: '100%',
          background: 'radial-gradient(ellipse at top right, rgba(196,151,106,0.20) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Background image */}
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: 0.18,
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%',
          padding: '24px clamp(20px, 4vw, 40px)',
        }}>
          {/* Overline */}
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: BAI.caramel, margin: '0 0 6px',
          }}>
            Bon retour
          </p>

          {/* Title */}
          <h1 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 42px)',
            color: '#ffffff',
            margin: '0 0 6px',
            lineHeight: 1.1,
          }}>
            Bonjour, {user?.firstName}.
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 15,
            color: 'rgba(255,255,255,0.60)',
            margin: '0 0 18px',
          }}>
            Voici un résumé de votre activité.
          </p>

          {/* Glass badges row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <HeroBadge icon={<Home size={14} />} value={isLoading ? '—' : totalProps} label="biens publiés" />
            <HeroBadge icon={<ClipboardList size={14} />} value={pendingApps.length} label="candidatures en attente" />
            <HeroBadge icon={<MessageSquare size={14} />} value={unreadCount} label="messages non lus" />
          </div>
        </div>
      </motion.div>

      {/* ── Page body ──────────────────────────────────────────────────────── */}
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(24px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* ── Alerte identité ─────────────────────────────────────────── */}
          {!identityVerified && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: BAI.warningLight, border: `1px solid ${BAI.caramelBorder}`,
                borderRadius: 12, padding: '12px 18px',
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

          {/* ── 2. KPI ROW ─────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
          </div>

          {/* ── 3. GRID 2 COLONNES ─────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 28,
            alignItems: 'start',
          }}>
            {/* Colonne gauche — Mes biens */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(18px,2.5vw,22px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>
                  Mes biens
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {myProperties.length > 3 && (
                    <Link
                      to="/properties/owner/me"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12.5, fontWeight: 600, color: BAI.caramel, textDecoration: 'none' }}
                    >
                      Voir tout <ArrowRight size={13} />
                    </Link>
                  )}
                  <Link
                    to="/properties/new"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: BAI.night, color: '#fff',
                      fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                      padding: '9px 14px', borderRadius: 9, textDecoration: 'none', minHeight: 40,
                    }}
                  >
                    <Plus size={14} /> Ajouter
                  </Link>
                </div>
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : displayedProperties.length === 0 ? (
                /* Empty state attrayant */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0d1a 100%)',
                    borderRadius: 16,
                    padding: '48px 28px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.13)',
                  }}>
                    <Home size={28} color="rgba(255,255,255,0.20)" />
                  </div>
                  <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Publiez votre premier bien en 5 minutes
                  </h3>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13.5, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
                    Commencez à recevoir des candidatures qualifiées dès aujourd'hui.
                  </p>
                  <Link
                    to="/properties/new"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: BAI.caramel, color: '#fff',
                      fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
                      padding: '12px 24px', borderRadius: 10, textDecoration: 'none',
                      marginTop: 4,
                    }}
                  >
                    <Plus size={16} /> Ajouter un bien
                  </Link>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {displayedProperties.map((property, i) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 + i * 0.06, duration: 0.28 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                  {myProperties.length > 3 && (
                    <Link
                      to="/properties/owner/me"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: 600,
                        color: BAI.caramel, textDecoration: 'none',
                        padding: '10px 20px', border: `1px solid ${BAI.caramelBorder}`,
                        borderRadius: 9, background: BAI.caramelLight,
                      }}
                    >
                      Voir tous mes biens ({myProperties.length}) <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              )}
            </motion.section>

            {/* Colonne droite — Activité récente */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.30, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(18px,2.5vw,22px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>
                  Activité récente
                </h2>
                <Link
                  to="/applications/manage"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12.5, fontWeight: 600, color: BAI.caramel, textDecoration: 'none' }}
                >
                  Tout voir <ArrowRight size={13} />
                </Link>
              </div>

              <div style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 14,
                padding: '4px 20px 4px',
                boxShadow: BAI.shadowMd,
              }}>
                {feedItems.length === 0 ? (
                  <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 13.5, color: BAI.inkFaint, margin: 0 }}>
                      Aucune activité récente.
                    </p>
                  </div>
                ) : (
                  feedItems.map((item) => <FeedRow key={item.id} item={item} />)
                )}
              </div>

              {/* Légende */}
              <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                {(Object.keys(kindConfig) as FeedKind[]).map((k) => {
                  const labels: Record<FeedKind, string> = {
                    application: 'Candidature',
                    visit: 'Visite',
                    message: 'Message',
                  }
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: kindConfig[k].color,
                      }} />
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
                        {labels[k]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          </div>

          {/* ── 4. QUICK ACTIONS ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.40, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: HERO_BG,
              borderRadius: 16,
              padding: 'clamp(20px, 3vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, margin: 0,
            }}>
              Actions rapides
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { label: '+ Nouvelle annonce', to: '/properties/new' },
                { label: 'Voir candidatures', to: '/applications/manage' },
                { label: 'Mes messages', to: '/messages' },
              ].map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                    border: '1px solid rgba(255,255,255,0.13)',
                    borderRadius: 12,
                    padding: '12px 20px',
                    fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
                    color: '#ffffff',
                    textDecoration: 'none',
                    minHeight: 44,
                    transition: 'background 0.18s, border-color 0.18s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(196,151,106,0.18)'
                    e.currentTarget.style.borderColor = 'rgba(196,151,106,0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  )
}
