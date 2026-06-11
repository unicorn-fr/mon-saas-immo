import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useContractStore } from '../../store/contractStore'
import { applicationService } from '../../services/application.service'
import { bookingService } from '../../services/booking.service'
import { dossierService } from '../../services/dossier.service'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import {
  Search, FolderOpen, SendHorizonal, Calendar, FileText, CreditCard,
  ChevronRight, CheckCircle, Clock,
} from 'lucide-react'
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

const APP_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'En attente', bg: '#fff3e0', color: '#e65100' },
  APPROVED:  { label: 'Approuvée',  bg: '#e8f5e9', color: '#2e7d32' },
  REJECTED:  { label: 'Refusée',    bg: BAI.errorLight, color: BAI.error },
  WITHDRAWN: { label: 'Retirée',    bg: BAI.bgMuted, color: BAI.inkMid },
}

// ─── Pipeline step card ───────────────────────────────────────────────────────

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
  let chipIcon  = <Clock size={11} />

  if (done) {
    chipBg = BAI.tenantLight; chipColor = BAI.tenant; chipLabel = 'Fait'
    chipIcon = <CheckCircle size={11} />
  } else if (inProgress) {
    chipBg = BAI.caramelLight; chipColor = BAI.caramel; chipLabel = 'En cours'
    chipIcon = <Clock size={11} />
  }

  return (
    <motion.a
      href={route}
      onClick={e => { e.preventDefault(); window.location.href = route }}
      whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(13,12,10,0.12)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        background: BAI.bgSurface,
        border: `1px solid ${done ? BAI.tenantBorder : BAI.border}`,
        borderRadius: BAI.radiusLg,
        padding: '16px 14px',
        boxShadow: BAI.shadowMd,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: done ? BAI.tenantLight : BAI.bgMuted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: done ? BAI.tenant : BAI.inkMid,
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
        fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600,
        width: 'fit-content',
      }}>
        {chipIcon}
        {chipLabel}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
        <ChevronRight size={14} color={BAI.inkFaint} />
      </div>
    </motion.a>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { contracts, fetchContracts } = useContractStore()

  const [applications, setApplications] = useState<Application[]>([])
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [pct, setPct]                   = useState(0)
  const [loading, setLoading]           = useState(true)

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
        if (docs.status === 'fulfilled')    setPct(dossierPercent(docs.value))
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

  const pendingApps = applications.filter((a) => a.status === 'PENDING')
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE')

  const steps: StepProps[] = [
    {
      icon: <FolderOpen size={18} />,
      title: 'Dossier',
      route: '/dossier',
      done: pct >= 80,
      inProgress: pct > 0 && pct < 80,
    },
    {
      icon: <SendHorizonal size={18} />,
      title: 'Candidature',
      route: '/my-applications',
      done: applications.length > 0,
    },
    {
      icon: <Calendar size={18} />,
      title: 'Visite',
      route: '/my-bookings',
      done: bookings.length > 0,
    },
    {
      icon: <FileText size={18} />,
      title: 'Contrat',
      route: '/contracts',
      done: contracts.length > 0,
    },
    {
      icon: <CreditCard size={18} />,
      title: 'Paiements',
      route: '/tenant/payments',
      done: activeContracts.length > 0,
    },
  ]

  const completedSteps = steps.filter((s) => s.done).length
  const progressPct    = Math.round((completedSteps / steps.length) * 100)

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${BAI.border}`, borderTopColor: BAI.caramel, animation: 'spin 0.7s linear infinite' }} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(16px,4vw,40px)' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          style={{ marginBottom: 32 }}
        >
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: BAI.caramel, marginBottom: 6,
          }}>
            Mon parcours
          </p>
          <h1 style={{
            fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,40px)',
            fontWeight: 700, fontStyle: 'italic', color: BAI.ink,
            margin: 0,
          }}>
            Bonjour{user?.firstName ? ` ${user.firstName}` : ''}
          </h1>
        </motion.div>

        {/* ── Stats rapides ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {[
            { label: `${pendingApps.length} candidature${pendingApps.length !== 1 ? 's' : ''} en attente`, bg: '#fff3e0', color: '#e65100' },
            { label: `${upcomingVisits.length} visite${upcomingVisits.length !== 1 ? 's' : ''} à venir`, bg: BAI.ownerLight, color: BAI.owner },
            { label: `Dossier ${pct}%`, bg: pct >= 80 ? BAI.tenantLight : BAI.caramelLight, color: pct >= 80 ? BAI.tenant : BAI.caramel },
          ].map((chip, i) => (
            <motion.span
              key={chip.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.22 }}
              style={{
                display: 'inline-block', padding: '5px 12px',
                borderRadius: 20, background: chip.bg, color: chip.color,
                fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
              }}
            >
              {chip.label}
            </motion.span>
          ))}
        </div>

        {/* ── Banner dossier incomplet ────────────────────────────────────── */}
        {pct < 80 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
            background: BAI.caramelLight,
            border: `1px solid ${BAI.caramelBorder}`,
            borderRadius: BAI.radiusLg, padding: '14px 18px',
            marginBottom: 32,
          }}>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.caramel, fontWeight: 500 }}>
              Votre dossier est à <strong>{pct}%</strong>. Complétez-le pour améliorer vos chances.
            </span>
            <Link
              to="/dossier"
              style={{
                fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                color: BAI.bgSurface, background: BAI.caramel,
                padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                whiteSpace: 'nowrap', minHeight: 44, display: 'flex', alignItems: 'center',
              }}
            >
              Compléter mon dossier
            </Link>
          </div>
        )}

        {/* ── Pipeline progression ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.28 }}
          style={{
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            borderRadius: BAI.radiusLg, padding: 'clamp(16px,3vw,24px)',
            boxShadow: BAI.shadowMd, marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
              Progression du parcours
            </span>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>
              {completedSteps}/{steps.length} étapes
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 3, background: BAI.bgMuted, marginBottom: 20 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.36 }}
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
                transition={{ delay: 0.42 + i * 0.07, duration: 0.22 }}
                style={{ flex: '1 1 140px', minWidth: 120 }}
              >
                <StepCard {...step} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Recherche rapide ────────────────────────────────────────────── */}
        <motion.div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/search')}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && navigate('/search')}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.22 }}
          whileHover={{ scale: 1.01, boxShadow: '0 4px 16px rgba(13,12,10,0.08)' }}
          whileTap={{ scale: 0.99 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: BAI.bgInput, border: `1px solid ${BAI.border}`,
            borderRadius: BAI.radiusLg, padding: '0 16px',
            height: 48, cursor: 'pointer', marginBottom: 32,
          }}
        >
          <Search size={16} color={BAI.inkFaint} />
          <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>
            Rechercher un logement…
          </span>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

          {/* ── Candidatures récentes ─────────────────────────────────────── */}
          {applications.length > 0 && (
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: BAI.radiusLg, padding: 20, boxShadow: BAI.shadowMd,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink }}>
                  Mes candidatures
                </span>
                <Link to="/my-applications" style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel, textDecoration: 'none', fontWeight: 600 }}>
                  Voir tout
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {applications.slice(0, 3).map((app) => {
                  const s = APP_STATUS[app.status] ?? APP_STATUS.PENDING
                  return (
                    <Link
                      key={app.id}
                      to="/my-applications"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: BAI.radius,
                        border: `1px solid ${BAI.border}`, textDecoration: 'none',
                        background: BAI.bgBase, gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {app.property?.title ?? 'Bien inconnu'}
                        </p>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>
                          {app.property?.price ? `${app.property.price} €/mois` : ''} · {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: 20, background: s.bg, color: s.color, fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                        {s.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Visites à venir ───────────────────────────────────────────── */}
          {upcomingVisits.length > 0 && (
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: BAI.radiusLg, padding: 20, boxShadow: BAI.shadowMd,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink }}>
                  Visites à venir
                </span>
                <Link to="/my-bookings" style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel, textDecoration: 'none', fontWeight: 600 }}>
                  Voir tout
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingVisits.slice(0, 3).map((booking) => (
                  <Link
                    key={booking.id}
                    to="/my-bookings"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: BAI.radius,
                      border: `1px solid ${BAI.border}`, textDecoration: 'none',
                      background: BAI.bgBase,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: BAI.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Calendar size={16} color={BAI.owner} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {booking.property?.title ?? 'Bien inconnu'}
                      </p>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>
                        {format(new Date(booking.visitDate), 'EEEE d MMM', { locale: fr })} à {booking.visitTime.slice(0, 5)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
