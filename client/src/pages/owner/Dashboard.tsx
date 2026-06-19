import { useEffect, useRef, useState } from 'react'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { contractService } from '../../services/contract.service'
import type { Contract } from '../../types/contract.types'
import { useMessages } from '../../hooks/useMessages'
import { applicationService } from '../../services/application.service'
import { bookingService } from '../../services/booking.service'
import { PropertyCard } from '../../components/property/PropertyCard'
import { BAI } from '../../constants/bailio-tokens'
import {
  Plus, ArrowRight, ShieldAlert, Calendar,
  Home, ClipboardList, MessageSquare, ChevronRight, HelpCircle,
  FileText, TrendingUp, Receipt, LayoutDashboard, Users,
  Zap, Lock, PenLine, ClipboardCheck,
} from 'lucide-react'
import { apiClient } from '../../services/api.service'
import type { Application } from '../../types/application.types'
import type { Booking } from '../../types/booking.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PlatformTour } from '../../components/ui/PlatformTour'
import type { TourFeature } from '../../components/ui/PlatformTour'
import { usePlan } from '../../hooks/usePlan'

const TOUR_KEY = 'bailio_tour_owner_v1'

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
  const initials = item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      paddingTop: 11, paddingBottom: 11,
      borderBottom: `1px solid ${BAI.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: cfg.color,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </p>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.action}
        </p>
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
  const { hasPlan, loading: planLoading } = usePlan()
  const isFreePlan = !planLoading && !hasPlan('SOLO')
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768

  const [pendingApps, setPendingApps] = useState<Application[]>([])
  const [upcomingVisits, setUpcomingVisits] = useState<Booking[]>([])
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [contractsToSign, setContractsToSign] = useState<Contract[]>([])
  const [identityVerified, setIdentityVerified] = useState(true)
  const [tourKey, setTourKey] = useState(0)
  const [tourImmediate, setTourImmediate] = useState(false)

  // Tour target refs (kept for future spotlight steps if needed)
  const kpiRef       = useRef<HTMLDivElement>(null)
  const propsRef     = useRef<HTMLElement>(null)
  const activityRef  = useRef<HTMLElement>(null)
  const actionsRef   = useRef<HTMLDivElement>(null)

  const tourFeatures: TourFeature[] = [
    {
      icon: LayoutDashboard,
      iconBg: 'rgba(196,151,106,0.16)',
      iconColor: BAI.caramel,
      label: 'Tableau de bord',
      title: 'Votre centre de contrôle',
      desc: 'Candidatures à traiter, visites planifiées, messages non lus — tout ce qui nécessite votre attention aujourd\'hui, résumé en un coup d\'œil. Agissez directement depuis les cartes.',
    },
    {
      icon: Home,
      iconBg: 'rgba(26,50,112,0.28)',
      iconColor: '#7aa4f0',
      label: 'Mes annonces',
      title: 'Publiez et gérez vos biens',
      desc: 'Créez une annonce complète en 5 minutes grâce au formulaire guidé : photos, description, loyer, critères de solvabilité. Les locataires peuvent candidater dès la publication.',
      link: '/properties/owner/me',
    },
    {
      icon: ClipboardList,
      iconBg: 'rgba(27,94,59,0.28)',
      iconColor: '#5fcf96',
      label: 'Candidatures',
      title: 'Évaluez les dossiers locataires',
      desc: 'Chaque candidature arrive avec le dossier complet du locataire : revenus, pièce d\'identité, justificatifs d\'emploi. Acceptez, refusez ou planifiez une visite directement depuis cette page.',
      link: '/applications/manage',
    },
    {
      icon: Calendar,
      iconBg: 'rgba(196,151,106,0.18)',
      iconColor: BAI.caramel,
      label: 'Visites',
      title: 'Planifiez votre agenda de visites',
      desc: 'Proposez des créneaux de visite aux candidats. Ils confirment directement depuis leur espace — sans échange d\'emails, sans appel téléphonique. Les confirmations apparaissent en temps réel.',
      link: '/bookings/manage',
    },
    {
      icon: MessageSquare,
      iconBg: 'rgba(26,50,112,0.22)',
      iconColor: '#7aa4f0',
      label: 'Messages',
      title: 'Communiquez avec vos locataires',
      desc: 'Échangez directement avec vos candidats et locataires. Historique complet, pièces jointes, notifications instantanées — tout est centralisé, rien ne se perd.',
      link: '/messages',
    },
    {
      icon: FileText,
      iconBg: 'rgba(27,94,59,0.24)',
      iconColor: '#5fcf96',
      label: 'Contrats',
      title: 'Bail électronique conforme eIDAS',
      desc: 'Rédigez votre bail à partir du modèle Loi ALUR, personnalisez-le et envoyez-le en signature électronique. Le locataire signe depuis son téléphone — aucun déplacement, aucune impression.',
      link: '/contracts',
      tag: 'eIDAS',
    },
    {
      icon: TrendingUp,
      iconBg: 'rgba(196,151,106,0.16)',
      iconColor: BAI.caramel,
      label: 'Finances',
      title: 'Suivez vos revenus locatifs',
      desc: 'Tableau de bord financier complet : loyers encaissés, charges, rentabilité par bien. Générez des rapports mensuels et suivez l\'évolution de votre patrimoine en un coup d\'œil.',
      link: '/owner/finances',
    },
    {
      icon: Receipt,
      iconBg: 'rgba(26,50,112,0.20)',
      iconColor: '#7aa4f0',
      label: 'Quittances',
      title: 'Quittances automatiques conformes',
      desc: 'Générez les quittances de loyer de vos locataires en un clic, conformément à l\'article 21 de la Loi ALUR. Envoyées automatiquement par email, archivées dans votre espace.',
      link: '/owner/quittances',
    },
    {
      icon: Users,
      iconBg: 'rgba(27,94,59,0.20)',
      iconColor: '#5fcf96',
      label: 'Mes locataires',
      title: 'Gérez votre portefeuille locataire',
      desc: 'Vue d\'ensemble de tous vos locataires actifs : contrats en cours, loyers, coordonnées. Accédez à l\'historique complet de chaque relation locative en un clic.',
      link: '/owner/locataires',
    },
  ]

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

    bookingService.getBookings({ status: 'PENDING' }, { page: 1, limit: 10 }).then((res) => {
      setPendingBookings(res.bookings.slice(0, 5))
    }).catch(() => {})

    contractService.getContracts({ status: 'SIGNED_TENANT' }, { page: 1, limit: 5 }).then((res) => {
      setContractsToSign(res.contracts)
    }).catch(() => {})

    apiClient.get('/stripe/identity-status').then((res) => {
      setIdentityVerified(res.data?.data?.verified ?? true)
    }).catch(() => {})
  }, [])

  const displayedProperties = myProperties.slice(0, 4)
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
    <>      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── 1. HERO BANNER ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'relative',
          background: HERO_BG,
          height: 'clamp(200px, 28vw, 280px)',
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
            opacity: 0.32,
            pointerEvents: 'none',
          }}
        />
        {/* Gradient overlay — left dark for readability, right open */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(10,13,26,0.88) 0%, rgba(10,13,26,0.50) 55%, rgba(10,13,26,0.15) 100%)',
          pointerEvents: 'none',
        }} />

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

          {/* Subtitle + Guide button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 15,
              color: 'rgba(255,255,255,0.60)',
              margin: 0,
            }}>
              Voici un résumé de votre activité.
            </p>
            <button
              onClick={() => { localStorage.removeItem(TOUR_KEY); setTourImmediate(true); setTourKey(k => k + 1) }}
              title="Lancer le guide interactif"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 20,
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.75)',
                fontFamily: BAI.fontBody, fontSize: 11.5, fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <HelpCircle size={12} /> Guide
            </button>
          </div>

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
          <div ref={kpiRef} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
          </div>

          {/* ── Actions requises ──────────────────────────────────────── */}
          {(pendingBookings.length > 0 || contractsToSign.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.28 }}
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 14,
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: '#fef9ec', border: '1px solid #f3c99a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ClipboardCheck size={14} style={{ color: BAI.warning }} />
                </div>
                <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: BAI.ink, margin: 0, flex: 1 }}>
                  À faire maintenant
                </h3>
                <span style={{
                  padding: '2px 9px', borderRadius: 20,
                  background: BAI.warningLight, border: '1px solid #f3c99a',
                  fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.warning,
                }}>
                  {pendingBookings.length + contractsToSign.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingBookings.map((b) => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Calendar size={14} style={{ color: BAI.tenant }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Visite à confirmer — {(b as any).property?.title ?? 'Bien'}
                      </p>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 11.5, color: BAI.inkMid, margin: '1px 0 0' }}>
                        {b.tenant ? `${b.tenant.firstName} ${b.tenant.lastName}` : ''} · {b.visitDate ? format(new Date(b.visitDate), 'dd MMM', { locale: fr }) : ''}
                      </p>
                    </div>
                    <Link
                      to="/bookings/manage"
                      style={{
                        padding: '6px 14px', borderRadius: 7, flexShrink: 0,
                        background: BAI.tenant, color: '#fff',
                        fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Confirmer
                    </Link>
                  </div>
                ))}

                {contractsToSign.map((c) => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <PenLine size={14} style={{ color: BAI.owner }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Contrat à signer — {(c as any).property?.title ?? 'Bien'}
                      </p>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 11.5, color: BAI.inkMid, margin: '1px 0 0' }}>
                        Locataire a signé · votre signature est requise
                      </p>
                    </div>
                    <Link
                      to={`/contracts/${c.id}`}
                      style={{
                        padding: '6px 14px', borderRadius: 7, flexShrink: 0,
                        background: BAI.owner, color: '#fff',
                        fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Signer
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PRO Upgrade Banner — FREE users only ─────────────────── */}
          {isFreePlan && (
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0d1a 100%)',
              borderRadius: 16,
              padding: 'clamp(20px,3vw,28px)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(196,151,106,0.25)',
            }}>
              {/* Ambient glow */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '40%', height: '100%',
                background: 'radial-gradient(ellipse at top right, rgba(196,151,106,0.15) 0%, transparent 60%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                {/* Left: title + features */}
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: 'rgba(196,151,106,0.18)', border: '1px solid rgba(196,151,106,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap size={16} style={{ color: '#c4976a' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c4976a', margin: 0 }}>
                        Plan Free actif
                      </p>
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1.1 }}>
                        Débloquez tout Bailio
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                    {[
                      'Quittances automatiques',
                      'Signature eIDAS',
                      'Relances auto',
                      'Analyse IA dossiers',
                      'Rapport fiscal',
                      'Analytics & Rentabilité',
                    ].map(f => (
                      <span key={f} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 12,
                        color: 'rgba(255,255,255,0.65)',
                      }}>
                        <Lock size={10} style={{ color: '#c4976a', opacity: 0.8 }} />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: price + CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '0 0 2px', textDecoration: 'line-through' }}>19,90 €/mois</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1 }}>
                      9,90 €<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>/mois</span>
                    </p>
                  </div>
                  <Link
                    to="/owner/abonnement"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '12px 24px', borderRadius: 10,
                      background: '#c4976a', color: '#fff',
                      fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 14, fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 4px 16px rgba(196,151,106,0.35)',
                    }}
                  >
                    <Zap size={15} />
                    Passer à Pro
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. GRID 2 COLONNES → 1 col sur mobile ─────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.4fr) minmax(0,1fr)',
            gap: isMobile ? 20 : 28,
            alignItems: 'start',
          }}>
            {/* Colonne gauche — Mes biens */}
            <motion.section
              ref={propsRef}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
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
              ref={activityRef}
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

            </motion.section>
          </div>

          {/* ── 4. QUICK ACTIONS ────────────────────────────────────────── */}
          <motion.div
            ref={actionsRef}
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

      <PlatformTour
        key={tourKey}
        features={tourFeatures}
        storageKey={TOUR_KEY}
        tourTitle="Votre espace propriétaire"
        immediate={tourImmediate}
      />
    </>  )
}
