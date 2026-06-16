import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useContractStore } from '../../store/contractStore'
import { applicationService } from '../../services/application.service'
import { bookingService } from '../../services/booking.service'
import { dossierService } from '../../services/dossier.service'
import { BAI } from '../../constants/bailio-tokens'
import {
  FolderOpen, SendHorizonal, Calendar, FileText, CreditCard,
  ChevronRight, CheckCircle, Clock, ArrowUpRight, MapPin, Home, HelpCircle,
  MessageSquare, Search, LayoutDashboard,
} from 'lucide-react'
import { PlatformTour } from '../../components/ui/PlatformTour'
import type { TourFeature } from '../../components/ui/PlatformTour'

const TOUR_KEY = 'bailio_tour_tenant_v1'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Application } from '../../types/application.types'
import type { Booking } from '../../types/booking.types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REQUIRED = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE']

function dossierPercent(docs: { category: string }[]): number {
  const cats = new Set(docs.map((d) => d.category))
  return Math.round(REQUIRED.filter((c) => cats.has(c)).length / REQUIRED.length * 100)
}

const APP_STATUS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING:   { label: 'En attente', bg: BAI.caramelLight,  color: BAI.caramel,  border: BAI.caramelBorder },
  APPROVED:  { label: 'Approuvée',  bg: BAI.tenantLight,   color: BAI.tenant,   border: BAI.tenantBorder },
  REJECTED:  { label: 'Refusée',    bg: BAI.errorLight,    color: BAI.error,    border: '#fca5a5' },
  WITHDRAWN: { label: 'Retirée',    bg: BAI.bgMuted,       color: BAI.inkMid,   border: BAI.border },
}

// ─── Step card ────────────────────────────────────────────────────────────────

interface StepProps {
  icon: React.ReactNode
  title: string
  route: string
  done: boolean
  inProgress?: boolean
}

function StepCard({ icon, title, route, done, inProgress }: StepProps) {
  let chipBg: string    = BAI.bgMuted
  let chipColor: string = BAI.inkFaint
  let chipLabel = 'À faire'
  let chipIcon  = <Clock size={10} />

  if (done) {
    chipBg = BAI.tenantLight; chipColor = BAI.tenant; chipLabel = 'Fait'
    chipIcon = <CheckCircle size={10} />
  } else if (inProgress) {
    chipBg = BAI.caramelLight; chipColor = BAI.caramel; chipLabel = 'En cours'
    chipIcon = <Clock size={10} />
  }

  return (
    <motion.a
      href={route}
      onClick={e => { e.preventDefault(); window.location.href = route }}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(13,12,10,0.10)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16 }}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        width: '100%',
        background: done ? BAI.tenantLight : BAI.bgSurface,
        border: `1px solid ${done ? BAI.tenantBorder : BAI.border}`,
        borderRadius: BAI.radiusLg,
        padding: '14px 12px',
        boxShadow: BAI.shadowSm,
        textDecoration: 'none',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent line top */}
      {done && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: BAI.tenant, borderRadius: '12px 12px 0 0',
        }} />
      )}

      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: done ? BAI.tenant : BAI.bgMuted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: done ? '#fff' : BAI.inkMid,
        flexShrink: 0,
      }}>
        {icon}
      </div>

      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
        {title}
      </span>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 20,
        background: chipBg, color: chipColor,
        fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.04em',
        width: 'fit-content',
      }}>
        {chipIcon}
        {chipLabel}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
        <ChevronRight size={13} color={done ? BAI.tenant : BAI.inkFaint} />
      </div>
    </motion.a>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { contracts, fetchContracts } = useContractStore()

  const [applications, setApplications]   = useState<Application[]>([])
  const [bookings, setBookings]           = useState<Booking[]>([])
  const [pct, setPct]                     = useState(0)
  const [uploadedCats, setUploadedCats]   = useState<Set<string>>(new Set())
  const [loading, setLoading]             = useState(true)
  const [tourKey, setTourKey]             = useState(0)
  const [tourImmediate, setTourImmediate] = useState(false)

  // Tour target refs (kept for potential future use)
  const kpiRef      = useRef<HTMLDivElement>(null)
  const parcourRef  = useRef<HTMLDivElement>(null)
  const gridRef     = useRef<HTMLDivElement>(null)

  const tourFeatures: TourFeature[] = [
    {
      icon: LayoutDashboard,
      iconBg: 'rgba(196,151,106,0.16)',
      iconColor: BAI.caramel,
      label: 'Tableau de bord',
      title: 'Votre espace locataire',
      desc: 'Résumé complet de votre situation : logement actuel, candidatures en cours, prochaines visites, avancement de votre dossier. Tout est organisé pour que rien ne vous échappe.',
    },
    {
      icon: Search,
      iconBg: 'rgba(26,50,112,0.28)',
      iconColor: '#7aa4f0',
      label: 'Recherche',
      title: 'Trouvez votre logement idéal',
      desc: 'Parcourez des centaines d\'annonces vérifiées. Filtres avancés : ville, budget, surface, type de bien. Activez des alertes pour être notifié dès qu\'une annonce correspond à vos critères.',
      link: '/search',
    },
    {
      icon: FolderOpen,
      iconBg: 'rgba(27,94,59,0.28)',
      iconColor: '#5fcf96',
      label: 'Dossier locatif',
      title: 'Votre dossier, prêt en 10 min',
      desc: 'Constituez votre dossier une seule fois, partagez-le à tous vos propriétaires en un clic. Notre IA vérifie chaque document automatiquement : pièce d\'identité, revenus, emploi, domicile.',
      link: '/dossier',
      tag: 'IA',
    },
    {
      icon: SendHorizonal,
      iconBg: 'rgba(196,151,106,0.18)',
      iconColor: BAI.caramel,
      label: 'Candidatures',
      title: 'Postulez et suivez en temps réel',
      desc: 'Candidatez pour plusieurs logements simultanément. Suivez chaque dossier en temps réel : en attente, visite proposée, acceptée. Vous êtes notifié dès qu\'un propriétaire répond.',
      link: '/my-applications',
    },
    {
      icon: Calendar,
      iconBg: 'rgba(26,50,112,0.24)',
      iconColor: '#7aa4f0',
      label: 'Visites',
      title: 'Réservez vos créneaux de visite',
      desc: 'Choisissez parmi les créneaux proposés par le propriétaire et confirmez votre visite en un clic. Rappel automatique la veille, modification possible à tout moment.',
      link: '/my-bookings',
    },
    {
      icon: FileText,
      iconBg: 'rgba(27,94,59,0.24)',
      iconColor: '#5fcf96',
      label: 'Contrats',
      title: 'Signez votre bail électroniquement',
      desc: 'Une fois votre candidature acceptée, le bail vous est envoyé pour signature. Conforme eIDAS, valeur légale garantie — depuis votre téléphone, en quelques secondes.',
      link: '/contracts',
      tag: 'eIDAS',
    },
    {
      icon: MessageSquare,
      iconBg: 'rgba(196,151,106,0.16)',
      iconColor: BAI.caramel,
      label: 'Messages',
      title: 'Contactez votre propriétaire',
      desc: 'Communiquez directement avec vos propriétaires : posez des questions, confirmez des détails, signalez un problème. Tout est tracé, archivé et accessible à tout moment.',
      link: '/messages',
    },
    {
      icon: CreditCard,
      iconBg: 'rgba(26,50,112,0.22)',
      iconColor: '#7aa4f0',
      label: 'Paiements',
      title: 'Suivez vos loyers et quittances',
      desc: 'Retrouvez l\'historique complet de vos paiements, téléchargez vos quittances de loyer et suivez votre compte. Tout est automatiquement archivé, disponible à tout moment.',
      link: '/tenant/payments',
    },
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const [apps, bookRes, docs] = await Promise.allSettled([
          applicationService.list(),
          bookingService.getBookings({ status: 'CONFIRMED' }),
          dossierService.getDocuments(),
        ])
        if (apps.status === 'fulfilled')    setApplications(apps.value)
        if (bookRes.status === 'fulfilled') setBookings(bookRes.value.bookings ?? [])
        if (docs.status === 'fulfilled') {
          setPct(dossierPercent(docs.value))
          setUploadedCats(new Set(docs.value.map((d: { category: string }) => d.category)))
        }
        await fetchContracts()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fetchContracts])

  const now = new Date()
  const upcomingVisits = bookings
    .filter((b) => new Date(`${b.visitDate}T${b.visitTime}`) > now)
    .sort((a, b) => new Date(`${a.visitDate}T${a.visitTime}`).getTime() - new Date(`${b.visitDate}T${b.visitTime}`).getTime())

  const pendingApps    = applications.filter((a) => a.status === 'PENDING')
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE')
  const activeContract = activeContracts[0] ?? null

  const steps: StepProps[] = [
    {
      icon: <FolderOpen size={16} />, title: 'Dossier', route: '/dossier',
      done: pct >= 80, inProgress: pct > 0 && pct < 80,
    },
    {
      icon: <SendHorizonal size={16} />, title: 'Candidature', route: '/my-applications',
      done: applications.length > 0,
    },
    {
      icon: <Calendar size={16} />, title: 'Visite', route: '/my-bookings',
      done: bookings.length > 0,
    },
    {
      icon: <FileText size={16} />, title: 'Contrat', route: '/contracts',
      done: contracts.length > 0,
    },
    {
      icon: <CreditCard size={16} />, title: 'Paiements', route: '/tenant/payments',
      done: activeContracts.length > 0,
    },
  ]

  const completedSteps = steps.filter((s) => s.done).length
  const progressPct    = Math.round((completedSteps / steps.length) * 100)

  const todayStr = format(now, "EEEE d MMMM yyyy", { locale: fr })
  const todayCap = todayStr.charAt(0).toUpperCase() + todayStr.slice(1)

  if (loading) {
    return (
      <>        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `3px solid ${BAI.border}`, borderTopColor: BAI.caramel,
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>    )
  }

  return (
    <>      {/* ── Hero dark strip ──────────────────────────────────────────────── */}
      <div style={{
        background: '#0a0d1a',
        padding: 'clamp(32px,5vw,56px) clamp(20px,5vw,48px) clamp(24px,4vw,40px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grain texture via repeating gradient */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.5) 2px,rgba(255,255,255,0.5) 3px)',
        }} />

        {/* Caramel glow orb */}
        <div style={{
          position: 'absolute', top: -60, right: -40, width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,151,106,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: BAI.caramel, marginBottom: 8,
            }}>
              Mon espace
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay, fontSize: 'clamp(30px,5vw,48px)',
              fontWeight: 700, fontStyle: 'italic',
              color: '#ffffff',
              margin: 0, marginBottom: 6,
            }}>
              Bonjour{user?.firstName ? `, ${user.firstName}` : ''}.
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <p style={{
                fontFamily: BAI.fontBody, fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                margin: 0,
              }}>
                {todayCap}
              </p>
              <button
                onClick={() => { localStorage.removeItem(TOUR_KEY); setTourImmediate(true); setTourKey(k => k + 1) }}
                title="Lancer le guide interactif"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.09)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: 'rgba(255,255,255,0.65)',
                  fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                <HelpCircle size={11} /> Guide
              </button>
            </div>
          </motion.div>

          {/* Stats row — 4 glass KPIs */}
          <div ref={kpiRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
            {[
              {
                label: activeContract ? 'Logement actuel' : 'En recherche',
                value: activeContract ? '1' : '0',
                icon: <Home size={16} />,
                bg: activeContract ? 'rgba(27,94,59,0.35)' : 'rgba(255,255,255,0.06)',
                color: activeContract ? '#5fcf96' : 'rgba(255,255,255,0.45)',
                delay: 0.05,
              },
              {
                label: 'candidature' + (pendingApps.length > 1 ? 's' : '') + ' en attente',
                value: pendingApps.length,
                icon: <SendHorizonal size={16} />,
                bg: 'rgba(196,151,106,0.18)',
                color: BAI.caramel,
                delay: 0.11,
              },
              {
                label: 'dossier complété',
                value: `${pct}%`,
                icon: <FolderOpen size={16} />,
                bg: pct >= 80 ? 'rgba(27,94,59,0.35)' : 'rgba(196,151,106,0.18)',
                color: pct >= 80 ? '#5fcf96' : BAI.caramel,
                delay: 0.17,
              },
              {
                label: 'visite' + (upcomingVisits.length !== 1 ? 's' : '') + ' à venir',
                value: upcomingVisits.length,
                icon: <Calendar size={16} />,
                bg: 'rgba(26,50,112,0.40)',
                color: '#7aa4f0',
                delay: 0.23,
              },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: s.delay, duration: 0.22 }}
                style={{
                  flex: '1 1 120px', minWidth: 120,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  borderRadius: BAI.radiusLg,
                  padding: '16px 18px',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.color, marginBottom: 10,
                }}>
                  {s.icon}
                </div>
                <p style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(24px,3.5vw,32px)', color: '#ffffff', margin: 0, lineHeight: 1,
                }}>
                  {s.value}
                </p>
                <p style={{
                  fontFamily: BAI.fontBody, fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  margin: '4px 0 0',
                }}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px)' }}>

        {/* ── Banner dossier incomplet ──────────────────────────────────── */}
        {pct < 80 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.22 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
              background: BAI.caramelLight,
              border: `1px solid ${BAI.caramelBorder}`,
              borderRadius: BAI.radiusLg, padding: '14px 20px',
              marginBottom: 28,
            }}
          >
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.caramel, fontWeight: 600, margin: 0 }}>
                Votre dossier est complété à <strong>{pct}%</strong>
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramelHover, margin: '2px 0 0' }}>
                Un dossier complet augmente vos chances d'acceptation.
              </p>
            </div>
            <Link
              to="/dossier"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                color: '#fff', background: BAI.caramel,
                padding: '9px 18px', borderRadius: 8, textDecoration: 'none',
                whiteSpace: 'nowrap', minHeight: 44,
              }}
            >
              Compléter mon dossier
              <ArrowUpRight size={14} />
            </Link>
          </motion.div>
        )}

        {/* ── Mon logement actuel (si locataire actif) ─────────────────── */}
        {activeContract && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.24 }}
            style={{
              background: '#0a0d1a',
              borderRadius: BAI.radiusLg,
              padding: 'clamp(20px,3vw,28px)',
              marginBottom: 28,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow */}
            <div style={{
              position: 'absolute', top: -40, right: -20, width: 200, height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(27,94,59,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative' }}>
              <p style={{
                fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#5fcf96', marginBottom: 12,
              }}>
                Mon logement actuel
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h2 style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                    fontSize: 'clamp(22px,4vw,32px)', color: '#fff',
                    margin: 0, marginBottom: 6, lineHeight: 1.1,
                  }}>
                    {activeContract.property?.title ?? 'Mon logement'}
                  </h2>
                  {activeContract.property?.city && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} />
                      {activeContract.property.city}
                      {activeContract.property.postalCode ? `, ${activeContract.property.postalCode}` : ''}
                    </p>
                  )}
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(150%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: BAI.radiusLg,
                  padding: '14px 20px',
                  textAlign: 'right',
                }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                    Loyer mensuel
                  </p>
                  <p style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                    fontSize: 'clamp(22px,3vw,28px)', color: BAI.caramel, margin: 0, lineHeight: 1,
                  }}>
                    {activeContract.monthlyRent
                      ? `${Number(activeContract.monthlyRent).toLocaleString('fr-FR')} €`
                      : '—'
                    }
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  to="/contracts"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                    color: '#fff',
                    background: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '9px 18px', borderRadius: 8, textDecoration: 'none',
                    minHeight: 44,
                  }}
                >
                  <FileText size={14} />
                  Voir mon contrat
                </Link>
                <Link
                  to="/messages"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                    color: 'rgba(255,255,255,0.70)',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '9px 18px', borderRadius: 8, textDecoration: 'none',
                    minHeight: 44,
                  }}
                >
                  Contacter le propriétaire
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Recherche rapide (si pas de contrat actif) ───────────────── */}
        {!activeContract && (
          <motion.div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/search')}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && navigate('/search')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.22 }}
            whileHover={{ scale: 1.005, boxShadow: '0 4px 20px rgba(13,12,10,0.08)' }}
            whileTap={{ scale: 0.99 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: BAI.radiusLg, padding: '0 20px',
              height: 52, cursor: 'pointer', marginBottom: 28,
              boxShadow: BAI.shadowSm,
            }}
          >
            <MapPin size={16} color={BAI.caramel} />
            <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, flex: 1 }}>
              Rechercher un logement…
            </span>
            <div style={{
              padding: '5px 12px', borderRadius: 6,
              background: BAI.night, color: '#fff',
              fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
            }}>
              Rechercher
            </div>
          </motion.div>
        )}

        {/* ── Pipeline progression ─────────────────────────────────────── */}
        <motion.div
          ref={parcourRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.28 }}
          style={{
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            borderRadius: BAI.radiusLg, padding: 'clamp(16px,3vw,24px)',
            boxShadow: BAI.shadowMd, marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink }}>
              Mon parcours locatif
            </span>
            <span style={{
              fontFamily: BAI.fontBody, fontSize: 12, color: progressPct === 100 ? BAI.tenant : BAI.inkMid,
              fontWeight: progressPct === 100 ? 700 : 400,
            }}>
              {completedSteps}/{steps.length} étapes
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, borderRadius: 3, background: BAI.bgMuted, marginBottom: 20 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
              style={{
                height: '100%', borderRadius: 3,
                background: progressPct === 100 ? BAI.tenant : BAI.caramel,
              }}
            />
          </div>

          {/* Step cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.44 + i * 0.07, duration: 0.22 }}
                style={{ flex: '1 1 140px', minWidth: 120 }}
              >
                <StepCard {...step} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Grille candidatures + visites + dossier ──────────────────── */}
        <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

          {/* Candidatures récentes */}
          {applications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.26 }}
              style={{
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                borderRadius: BAI.radiusLg, padding: 20, boxShadow: BAI.shadowMd,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, background: BAI.caramelLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <SendHorizonal size={13} color={BAI.caramel} />
                  </div>
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink }}>
                    Mes candidatures
                  </span>
                </div>
                <Link to="/my-applications" style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel,
                  textDecoration: 'none', fontWeight: 600,
                }}>
                  Voir tout <ArrowUpRight size={12} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {applications.slice(0, 3).map((app) => {
                  const s = APP_STATUS[app.status] ?? APP_STATUS.PENDING
                  return (
                    <Link
                      key={app.id}
                      to="/my-applications"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: BAI.radius,
                        border: `1px solid ${BAI.border}`, textDecoration: 'none',
                        background: BAI.bgBase, gap: 8,
                        transition: BAI.transition,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{
                          fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                          color: BAI.ink, margin: 0,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {app.property?.title ?? 'Bien inconnu'}
                        </p>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>
                          {app.property?.price ? `${app.property.price} €/mois` : ''}{app.property?.price ? ' · ' : ''}
                          {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <span style={{
                        padding: '3px 9px', borderRadius: 20,
                        background: s.bg, color: s.color,
                        border: `1px solid ${s.border}`,
                        fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
                        flexShrink: 0, letterSpacing: '0.03em',
                      }}>
                        {s.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Visites à venir */}
          {upcomingVisits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.26 }}
              style={{
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                borderRadius: BAI.radiusLg, padding: 20, boxShadow: BAI.shadowMd,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, background: BAI.ownerLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Calendar size={13} color={BAI.owner} />
                  </div>
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink }}>
                    Prochaine visite
                  </span>
                </div>
                <Link to="/my-bookings" style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel,
                  textDecoration: 'none', fontWeight: 600,
                }}>
                  Voir tout <ArrowUpRight size={12} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingVisits.slice(0, 3).map((booking) => (
                  <Link
                    key={booking.id}
                    to="/my-bookings"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: BAI.radius,
                      border: `1px solid ${BAI.border}`, textDecoration: 'none',
                      background: BAI.bgBase,
                    }}
                  >
                    <div style={{
                      flexShrink: 0,
                      width: 40, height: 40, borderRadius: 8,
                      background: '#0a0d1a',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 15, color: BAI.caramel, lineHeight: 1 }}>
                        {format(new Date(booking.visitDate), 'd')}
                      </span>
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {format(new Date(booking.visitDate), 'MMM', { locale: fr })}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                        color: BAI.ink, margin: 0,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {booking.property?.title ?? 'Bien inconnu'}
                      </p>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>
                        {format(new Date(booking.visitDate), 'EEEE d MMM', { locale: fr })} à {booking.visitTime.slice(0, 5)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Dossier locatif */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.26 }}
            style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: BAI.radiusLg, padding: 20, boxShadow: BAI.shadowMd,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: pct >= 80 ? BAI.tenantLight : BAI.bgMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FolderOpen size={13} color={pct >= 80 ? BAI.tenant : BAI.inkMid} />
                </div>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink }}>
                  Mon dossier
                </span>
              </div>
              <span style={{
                fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700,
                color: pct >= 80 ? BAI.tenant : BAI.caramel,
              }}>
                {pct}%
              </span>
            </div>

            {/* Documents categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {REQUIRED.map((cat) => {
                const labels: Record<string, string> = {
                  IDENTITE: "Pièce d'identité", EMPLOI: 'Justificatif emploi',
                  REVENUS: 'Justificatif revenus', DOMICILE: 'Justificatif domicile',
                }
                const done = uploadedCats.has(cat)
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: done ? BAI.inkMid : BAI.inkFaint }}>
                      {labels[cat] ?? cat}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, fontFamily: BAI.fontBody,
                      padding: '2px 8px', borderRadius: 20,
                      background: done ? BAI.tenantLight : BAI.bgMuted,
                      color: done ? BAI.tenant : BAI.inkFaint,
                    }}>
                      {done ? 'OK' : 'Manquant'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 6, borderRadius: 3, background: BAI.border }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.5 }}
                  style={{
                    height: '100%', borderRadius: 3,
                    background: pct >= 80 ? BAI.tenant : BAI.caramel,
                  }}
                />
              </div>
            </div>

            <Link
              to="/dossier"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '10px 16px', borderRadius: BAI.radius,
                background: pct >= 80 ? BAI.tenantLight : BAI.night,
                color: pct >= 80 ? BAI.tenant : '#fff',
                border: pct >= 80 ? `1px solid ${BAI.tenantBorder}` : 'none',
                fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                textDecoration: 'none', minHeight: 44, boxSizing: 'border-box',
              }}
            >
              {pct >= 80 ? 'Voir mon dossier' : 'Compléter mon dossier'}
              <ArrowUpRight size={13} />
            </Link>
          </motion.div>

        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <PlatformTour
        key={tourKey}
        features={tourFeatures}
        storageKey={TOUR_KEY}
        tourTitle="Votre espace locataire"
        immediate={tourImmediate}
      />
    </>  )
}
