import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar, MessageSquare, Search, Home, Clock, MapPin,
  CheckCircle, FileText, PenTool, FolderOpen, SendHorizonal,
  ChevronRight, ArrowRight, Loader2, Star, CreditCard, Briefcase, Banknote,
  Building2, Key, TrendingUp, ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useBookings } from '../../hooks/useBookings'
import { useFavoriteStore } from '../../store/favoriteStore'
import { useMessages } from '../../hooks/useMessages'
import { useContractStore } from '../../store/contractStore'
import { applicationService } from '../../services/application.service'
import { dossierService } from '../../services/dossier.service'
import { Layout } from '../../components/layout/Layout'
import type { Application } from '../../types/application.types'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BAI } from '../../constants/bailio-tokens'

// ─── Design tokens ────────────────────────────────────────────────────────────

const cardBase: React.CSSProperties = {
  background:   BAI.bgSurface,
  border:       `1px solid ${BAI.border}`,
  borderRadius: 16,
  boxShadow:    BAI.shadowMd,
}

// ─── Catégories requises pour le calcul de complétion du dossier ──────────────
const REQUIRED_CATEGORIES = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE'] as const

function computeDossierPercent(docs: { category: string }[]): number {
  if (docs.length === 0) return 0
  const uploaded = new Set(docs.map((d) => d.category))
  const covered = REQUIRED_CATEGORIES.filter((cat) => uploaded.has(cat)).length
  return Math.round((covered / REQUIRED_CATEGORIES.length) * 100)
}

/** Calcule la prochaine date de paiement selon le jour du mois */
function computeNextPaymentDate(paymentDay: number): Date {
  const today = new Date()
  const day   = Math.max(1, Math.min(28, paymentDay))
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day)
  if (today <= thisMonth) return thisMonth
  return new Date(today.getFullYear(), today.getMonth() + 1, day)
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TenantDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { bookings, fetchBookings, isLoading: isLoadingBookings } = useBookings()
  const { favoriteIds, loadFavorites } = useFavoriteStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const { contracts, fetchContracts, fetchStatistics: fetchContractStatistics } = useContractStore()
  const [applications, setApplications] = useState<Application[]>([])
  const [dossierPercent, setDossierPercent] = useState(0)
  const [dossierCoveredCats, setDossierCoveredCats] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchBookings()
    loadFavorites()
    fetchUnreadCount()
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
    applicationService.list().then(setApplications).catch(() => {})
    dossierService.getDocuments().then((docs) => {
      setDossierPercent(computeDossierPercent(docs))
      setDossierCoveredCats(new Set(docs.map((d) => d.category)))
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

  const fmtEUR = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  // ── Calculs contrat actif ─────────────────────────────────────────────────
  const activeCnt        = (activeContract?.content as Record<string, any>) || {}
  const _rawPaymentDay   = activeCnt.paymentDay ? Number(activeCnt.paymentDay) : (activeContract ? new Date(activeContract.startDate).getDate() : 1)
  const paymentDay       = Number.isFinite(_rawPaymentDay) ? _rawPaymentDay : 1
  const nextPaymentDate  = activeContract ? computeNextPaymentDate(paymentDay) : null
  const daysUntilPayment = nextPaymentDate ? differenceInDays(nextPaymentDate, new Date()) : null
  const daysUntilEnd     = activeContract ? differenceInDays(new Date(activeContract.endDate), new Date()) : null
  const monthsUntilEnd   = daysUntilEnd !== null ? Math.max(0, Math.floor(daysUntilEnd / 30.44)) : null
  const activeRent       = activeContract?.monthlyRent ?? 0
  const activeCharges    = activeContract?.charges ?? 0
  const activeTotal      = activeRent + activeCharges

  // Dossier ring geometry
  const RING_R          = 48
  const CIRCUMFERENCE   = 2 * Math.PI * RING_R
  const ringOffset      = CIRCUMFERENCE * (1 - dossierPercent / 100)
  const dossierColor    =
    dossierPercent >= 80 ? BAI.tenant
    : dossierPercent >= 50 ? BAI.caramel
    : '#b91c1c'
  const coveredCount = Math.round(dossierPercent / 100 * REQUIRED_CATEGORIES.length)

  const STATUS_STYLE: Record<string, React.CSSProperties> = {
    PENDING:  { background: BAI.caramelLight, border: `1px solid #e8c9a0`, color: BAI.caramel },
    APPROVED: { background: BAI.tenantLight,  border: `1px solid ${BAI.tenantBorder}`, color: BAI.tenant },
    REJECTED: { background: '#fef2f2',      border: '1px solid #fecaca', color: '#b91c1c' },
  }
  const STATUS_LABEL: Record<string, string> = {
    PENDING:  'En examen',
    APPROVED: 'Approuvée',
    REJECTED: 'Non retenue',
  }

  // ── ONBOARDING BLOQUANT — dossier incomplet et pas de bail actif ─────────
  if (!activeContract && dossierPercent < 100) {
    const ONBOARDING_STEPS = [
      { cat: 'IDENTITE', label: 'Pièce d\'identité',       sub: 'CNI ou passeport en cours de validité', Icon: CreditCard },
      { cat: 'EMPLOI',   label: 'Justificatif d\'emploi',  sub: 'Contrat de travail, promesse d\'embauche…', Icon: Briefcase },
      { cat: 'REVENUS',  label: 'Bulletins de salaire',     sub: '3 derniers bulletins + avis d\'imposition', Icon: Banknote },
      { cat: 'DOMICILE', label: 'Justificatif de domicile', sub: 'Quittance de loyer ou facture récente', Icon: Home },
    ] as const
    const coveredCats = Math.round(dossierPercent / 100 * REQUIRED_CATEGORIES.length)

    return (
      <Layout>
        <style>{`
          @media (max-width: 600px) {
            .onb-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
            .onb-hero  { padding: 48px 20px 0 !important; }
            .onb-body  { padding: 0 16px 56px !important; }
          }
        `}</style>
        <div style={{ minHeight: '100vh', background: BAI.bgBase, fontFamily: BAI.fontBody }}>

          {/* ── Hero sombre ── */}
          <div className="onb-hero" style={{ background: BAI.night, padding: 'clamp(56px,10vh,100px) 24px 0' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', paddingBottom: 'clamp(48px,8vh,80px)' }}>

              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(196,151,106,0.14)', border: '1px solid rgba(196,151,106,0.35)', borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: BAI.caramel }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel }}>
                  Avant de commencer
                </span>
              </div>

              <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(30px,6vw,56px)', color: '#fff', lineHeight: 1.08, margin: '0 0 18px' }}>
                Ton dossier locatif,<br /><em style={{ color: BAI.caramel }}>une seule fois.</em>
              </h1>
              <p style={{ fontSize: 'clamp(14px,1.5vw,16px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 36px' }}>
                Constitue-le en 5 minutes. Il sera partagé automatiquement avec les propriétaires
                à chaque candidature — tu n'auras jamais à le refaire.
              </p>

              {/* Progress ring + label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                  <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="7" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke={BAI.caramel} strokeWidth="7"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - dossierPercent / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 18, color: '#fff' }}>{dossierPercent}%</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  {coveredCats} / {REQUIRED_CATEGORIES.length} catégories complètes
                </p>
              </div>
            </div>
          </div>

          {/* ── Corps ── */}
          <div className="onb-body" style={{ maxWidth: 680, margin: '-20px auto 0', padding: '0 24px 64px' }}>

            {/* Grille des 4 étapes */}
            <div className="onb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
              {ONBOARDING_STEPS.map((step, i) => {
                const done = i < coveredCats
                const { Icon } = step
                return (
                  <div key={step.cat} style={{
                    background: BAI.bgSurface, border: `1px solid ${done ? BAI.tenantBorder : BAI.border}`,
                    borderRadius: 16, padding: '20px 18px',
                    boxShadow: done ? '0 2px 12px rgba(27,94,59,0.07)' : BAI.shadowMd,
                    display: 'flex', flexDirection: 'column', gap: 12,
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: done ? BAI.tenantLight : BAI.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={17} color={done ? BAI.tenant : BAI.inkFaint} />
                      </div>
                      {done
                        ? <CheckCircle size={16} color={BAI.tenant} />
                        : <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramel, background: '#fdf5ec', padding: '3px 8px', borderRadius: 20, border: '1px solid #f3c99a' }}>Requis</span>
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: done ? BAI.tenant : BAI.ink, margin: '0 0 3px' }}>{step.label}</p>
                      <p style={{ fontSize: 11, color: BAI.inkFaint, margin: 0, lineHeight: 1.5 }}>{step.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/dossier')}
              style={{
                width: '100%', padding: '16px', borderRadius: 12,
                background: BAI.night, color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(26,26,46,0.18)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a4e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = BAI.night }}
            >
              Constituer mon dossier <ArrowRight size={16} />
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: BAI.inkFaint, margin: '12px 0 0' }}>
              Accès complet au tableau de bord une fois les 4 catégories renseignées.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  // ── VUE BAIL ACTIF ────────────────────────────────────────────────────────
  if (activeContract) {
    return (
      <Layout>
        <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

            {/* Header condensé */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                {todayLabel}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 700, fontStyle: 'italic',
                  fontSize: 'clamp(22px, 4vw, 44px)', color: BAI.ink, lineHeight: 1.05, margin: 0,
                }}>
                  Bonjour, {user?.firstName}
                </h1>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', borderRadius: 20,
                  background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                  fontSize: 12, fontWeight: 600, color: BAI.tenant,
                }}>
                  <CheckCircle size={13} /> Bail actif
                </span>
              </div>
            </div>

            {/* ── HERO : Mon logement ─────────────────────────────────────── */}
            <div style={{
              background: BAI.night,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(13,12,10,0.22)',
              marginBottom: 28,
            }}>
              {/* Bandeau titre */}
              <div style={{
                padding: '10px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Building2 size={14} style={{ color: BAI.caramel }} />
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
                  Mon logement
                </p>
              </div>

              <div className="p-4 sm:p-7">

                {/* Propriété + adresse */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 28, fontWeight: 700, fontStyle: 'italic',
                    color: '#ffffff', margin: '0 0 6px', lineHeight: 1.2,
                  }}>
                    {activeContract.property?.title ?? 'Mon appartement'}
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                    <MapPin size={13} />
                    {activeContract.property?.address ? `${activeContract.property.address}, ${activeContract.property.city}` : activeContract.property?.city ?? ''}
                    {activeContract.property?.surface ? ` · ${activeContract.property.surface} m²` : ''}
                    {activeCnt.meuble ? ` · ${activeCnt.meuble === 'Meuble' ? 'Meublé' : 'Non meublé'}` : ''}
                  </p>
                </div>

                {/* KPI row */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-3"
                  style={{
                    gap: 1,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 24,
                  }}>
                  {/* Prochain paiement */}
                  <div style={{ padding: 'clamp(12px,3vw,18px) clamp(14px,4vw,20px)' }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={11} /> Prochain paiement
                    </p>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 'clamp(22px,5vw,36px)', fontWeight: 700, color: BAI.caramel,
                      margin: '0 0 4px', lineHeight: 1,
                    }}>
                      {daysUntilPayment !== null ? (daysUntilPayment === 0 ? "Aujourd'hui" : `J-${daysUntilPayment}`) : '—'}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                      {nextPaymentDate ? format(nextPaymentDate, 'd MMMM yyyy', { locale: fr }) : ''}
                    </p>
                  </div>

                  {/* Loyer mensuel */}
                  <div style={{ padding: 'clamp(12px,3vw,18px) clamp(14px,4vw,20px)', background: 'rgba(196,151,106,0.10)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <TrendingUp size={11} /> Coût mensuel
                    </p>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 'clamp(22px,5vw,36px)', fontWeight: 700, color: '#ffffff',
                      margin: '0 0 4px', lineHeight: 1,
                    }}>
                      {fmtEUR(activeTotal)}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                      {fmtEUR(activeRent)} loyer + {activeCharges > 0 ? fmtEUR(activeCharges) : '0 €'} charges · {fmtEUR(activeTotal * 12)}/an
                    </p>
                  </div>

                  {/* Fin du bail */}
                  <div style={{ padding: 'clamp(12px,3vw,18px) clamp(14px,4vw,20px)' }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Key size={11} /> Fin du bail
                    </p>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 'clamp(22px,5vw,36px)', fontWeight: 700, color: '#ffffff',
                      margin: '0 0 4px', lineHeight: 1,
                    }}>
                      {monthsUntilEnd !== null ? (monthsUntilEnd >= 12 ? `${Math.floor(monthsUntilEnd / 12)} an${Math.floor(monthsUntilEnd / 12) > 1 ? 's' : ''}` : `${monthsUntilEnd} mois`) : '—'}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                      {activeContract.endDate ? format(new Date(activeContract.endDate), 'd MMMM yyyy', { locale: fr }) : ''}
                    </p>
                  </div>
                </div>

                {/* Actions principales */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link to={`/contracts/${activeContract.id}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: 'clamp(9px,2vw,12px) clamp(14px,3vw,22px)', borderRadius: 10,
                    background: BAI.caramel, color: '#ffffff',
                    fontWeight: 700, fontSize: 'clamp(12px,3vw,13px)', textDecoration: 'none',
                    letterSpacing: '0.01em', whiteSpace: 'nowrap',
                  }}>
                    <FileText size={15} /> Mon contrat
                  </Link>
                  <Link to={`/contracts/${activeContract.id}/edl`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 22px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontWeight: 600, fontSize: 13, textDecoration: 'none',
                  }}>
                    <Home size={15} /> État des lieux
                  </Link>
                  <button
                    onClick={() => navigate('/messages', { state: { openWithUserId: activeContract?.ownerId } })}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '12px 22px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <MessageSquare size={15} /> Écrire à mon propriétaire
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute', top: -6, right: -6,
                        background: '#e53e3e', color: '#ffffff',
                        fontSize: 10, fontWeight: 700,
                        width: 18, height: 18, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <Link to="/dossier" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 22px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 500, fontSize: 13, textDecoration: 'none',
                  }}>
                    <FolderOpen size={15} /> Mon dossier
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Grille secondaire ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

              {/* Messages récents */}
              <div style={{ ...cardBase }}>
                <div style={{
                  padding: '14px 20px', borderBottom: `1px solid ${BAI.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                      Messages
                    </span>
                    {unreadCount > 0 && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#ffffff',
                        background: BAI.tenant, borderRadius: 20, padding: '1px 8px',
                      }}>
                        {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <Link to="/messages" style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 500, color: BAI.tenant, textDecoration: 'none',
                  }}>
                    Ouvrir <ArrowRight size={12} />
                  </Link>
                </div>
                <div style={{ padding: 20 }}>
                  {unreadCount > 0 ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 10,
                      background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: BAI.tenant, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <MessageSquare size={18} style={{ color: '#ffffff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: '0 0 2px' }}>
                          {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
                        </p>
                        <p style={{ fontSize: 12, color: BAI.inkFaint, margin: 0 }}>Votre propriétaire vous a écrit</p>
                      </div>
                      <Link to="/messages" style={{
                        padding: '8px 16px', borderRadius: 8,
                        background: BAI.tenant, color: '#ffffff',
                        fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
                      }}>
                        Lire
                      </Link>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <CheckCircle size={24} style={{ color: BAI.tenant, marginBottom: 8 }} />
                      <p style={{ fontSize: 13, color: BAI.inkMid, margin: 0 }}>Aucun message non lu</p>
                    </div>
                  )}

                  {/* Infos contrat résumé */}
                  <div style={{
                    marginTop: 16,
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                  }}>
                    {[
                      { label: 'Début bail',    val: format(new Date(activeContract.startDate), 'd MMM yyyy', { locale: fr }) },
                      { label: 'Fin bail',      val: format(new Date(activeContract.endDate), 'd MMM yyyy', { locale: fr }) },
                      { label: 'Loyer HC',      val: fmtEUR(activeRent) },
                      { label: 'Dépôt',         val: activeContract.deposit ? fmtEUR(activeContract.deposit) : '—' },
                    ].map(({ label, val }) => (
                      <div key={label} style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                      }}>
                        <p style={{ fontSize: 10, color: BAI.inkFaint, margin: '0 0 3px', letterSpacing: '0.06em' }}>{label}</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar droite */}
              <div className="hidden lg:flex" style={{ flexDirection: 'column', gap: 16 }}>

                {/* Dossier locatif mini */}
                <div style={{ ...cardBase, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, margin: 0 }}>
                      Mon dossier
                    </p>
                    <Link to="/dossier" style={{
                      fontSize: 12, fontWeight: 500, color: BAI.tenant, textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      Gérer <ArrowRight size={11} />
                    </Link>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="32" cy="32" r="24" strokeWidth="5" fill="none" stroke={BAI.bgMuted} />
                        <circle cx="32" cy="32" r="24" strokeWidth="5" fill="none"
                          style={{
                            stroke: dossierColor,
                            strokeDasharray: 2 * Math.PI * 24,
                            strokeDashoffset: 2 * Math.PI * 24 * (1 - dossierPercent / 100),
                            strokeLinecap: 'round',
                          }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: BAI.ink }}>
                          {dossierPercent}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: '0 0 4px' }}>
                        {dossierPercent === 100 ? 'Dossier complet' : `${coveredCount}/${REQUIRED_CATEGORIES.length} catégories`}
                      </p>
                      <p style={{ fontSize: 11, color: BAI.inkFaint, margin: 0 }}>
                        {dossierPercent === 100 ? 'Tous les documents présents' : 'Des documents manquent'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accès rapides */}
                <div style={{ ...cardBase, padding: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 14 }}>
                    Navigation
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      { to: `/contracts/${activeContract.id}`,      icon: <FileText size={15} />,       label: 'Mon contrat' },
                      { to: `/contracts/${activeContract.id}/edl`,  icon: <Home size={15} />,           label: 'État des lieux' },
                      { to: '/messages',                             icon: <MessageSquare size={15} />,  label: 'Messages',      badge: unreadCount },
                      { to: '/dossier',                              icon: <FolderOpen size={15} />,     label: 'Mon dossier' },
                      { to: '/profile',                              icon: <Star size={15} />,           label: 'Mon profil' },
                    ].map(({ to, icon, label, badge }, idx, arr) => (
                      <Link key={to} to={to} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 0',
                        borderBottom: idx < arr.length - 1 ? `1px solid ${BAI.border}` : 'none',
                        textDecoration: 'none', color: BAI.ink,
                        transition: 'color 0.15s',
                      }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = BAI.tenant }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = BAI.ink }}
                      >
                        <span style={{ color: 'inherit', display: 'flex', flexShrink: 0 }}>{icon}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{label}</span>
                        {badge && badge > 0 ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#ffffff',
                            background: BAI.tenant, borderRadius: 20, padding: '1px 7px', flexShrink: 0,
                          }}>
                            {badge}
                          </span>
                        ) : (
                          <ChevronRight size={14} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
                        )}
                      </Link>
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

  // ── VUE RECHERCHE (pas de bail actif) ─────────────────────────────────────
  return (
    <Layout>
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
                fontSize: 'clamp(22px, 4vw, 52px)', color: BAI.ink, lineHeight: 1.05, margin: 0,
              }}>
                Bonjour, {user?.firstName}
              </h1>
            </div>
            <Link to="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: BAI.tenant, color: '#ffffff',
              fontWeight: 600, fontSize: 13, textDecoration: 'none',
            }}>
              <Search size={15} /> Chercher un logement
            </Link>
          </div>

          {/* ── Alerte signature : bannière pleine largeur imposante ─── */}
          {pendingSignatureContracts.map((c) => {
            const cnt       = (c.content as Record<string, any>) || {}
            const rent      = c.monthlyRent ?? 0
            const charges   = c.charges ?? 0
            const total     = rent + charges
            const months    = c.startDate && c.endDate
              ? Math.round((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / (30.44 * 86400000))
              : null

            return (
              <div key={c.id} style={{
                background: '#1a1a2e',
                borderRadius: 16,
                marginBottom: 28,
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(13,12,10,0.18)',
              }}>
                {/* Bandeau urgence */}
                <div style={{
                  background: BAI.caramel,
                  padding: '8px 20px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <PenTool size={14} style={{ color: '#ffffff' }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Action requise · Signature de contrat en attente
                  </p>
                </div>

                {/* Contenu principal */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    {/* Info bien */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                        Logement proposé
                      </p>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 22, fontWeight: 700, fontStyle: 'italic',
                        color: '#ffffff', margin: '0 0 4px', lineHeight: 1.2,
                      }}>
                        {c.property?.title ?? 'Contrat de location'}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                        {c.property?.address ? `${c.property.address}, ${c.property.city}` : ''}
                        {c.startDate && c.endDate ? ` · Du ${new Date(c.startDate).toLocaleDateString('fr-FR')} au ${new Date(c.endDate).toLocaleDateString('fr-FR')}` : ''}
                        {months ? ` (${months} mois)` : ''}
                      </p>
                    </div>

                    {/* Loyer mensuel simplifié */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'baseline', gap: 6,
                      background: 'rgba(196,151,106,0.15)',
                      borderRadius: 10,
                      padding: '10px 16px',
                      border: '1px solid rgba(196,151,106,0.25)',
                      marginTop: 12,
                    }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Loyer mensuel</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#c4976a', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                        {fmtEUR(total)}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>/mois charges comprises</span>
                    </div>
                  </div>

                  {/* Infos DPE / type si disponibles */}
                  {(cnt.meuble || cnt.classeEnergie) && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {cnt.meuble && (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                          {cnt.meuble === 'Meuble' ? '🪑 Meublé' : '🏠 Non meublé (vide)'}
                        </span>
                      )}
                      {c.property?.surface && (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                          📐 {c.property.surface} m²
                        </span>
                      )}
                      {cnt.classeEnergie && (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                          ⚡ DPE {cnt.classeEnergie}
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to={`/contracts/${c.id}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '11px 22px', borderRadius: 10,
                      background: BAI.caramel, color: '#ffffff',
                      fontWeight: 700, fontSize: 13, textDecoration: 'none',
                      letterSpacing: '0.01em',
                    }}>
                      <PenTool size={14} />
                      Lire et signer le contrat
                    </Link>
                    <Link to={`/contracts/${c.id}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '11px 18px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.75)',
                      fontWeight: 500, fontSize: 13, textDecoration: 'none',
                    }}>
                      Consulter <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}

          {/* ── KPI row ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 32 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {[
              {
                to: '/my-bookings',
                label: 'Visites',
                sublabel: 'à venir',
                value: upcomingBookings.length,
                sub: upcomingBookings.length > 0
                  ? `Le ${format(new Date(upcomingBookings[0].visitDate), 'd MMM', { locale: fr })}`
                  : 'Aucune',
              },
              {
                to: '/my-applications',
                label: 'Candida-',
                sublabel: 'tures',
                value: activeApps.length,
                sub: pendingApps.length > 0
                  ? `${pendingApps.length} en attente`
                  : approvedApps.length > 0
                    ? `${approvedApps.length} approuvée${approvedApps.length > 1 ? 's' : ''}`
                    : 'Aucune',
              },
              {
                to: '/messages',
                label: 'Messages',
                sublabel: '',
                value: unreadCount,
                sub: unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Tout lu',
              },
              {
                to: '/favorites',
                label: 'Favoris',
                sublabel: '',
                value: favoriteIds.size,
                sub: favoriteIds.size > 0 ? `${favoriteIds.size} bien${favoriteIds.size > 1 ? 's' : ''}` : 'Aucun',
              },
            ].map((kpi) => (
              <Link key={kpi.label} to={kpi.to} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: '#ffffff',
                  border: `1px solid ${BAI.border}`,
                  borderTop: `3px solid ${BAI.tenant}`,
                  boxShadow: BAI.shadowMd,
                  borderRadius: 14,
                  padding: 'clamp(10px,3vw,18px)',
                  display: 'flex', flexDirection: 'column',
                  boxSizing: 'border-box',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  height: '100%',
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(13,12,10,0.12)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = BAI.shadowMd;
                    (e.currentTarget as HTMLElement).style.transform = 'none'
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 8, lineHeight: 1.4 }}>
                    {kpi.label}{kpi.sublabel && <><br />{kpi.sublabel}</>}
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 700, fontSize: 'clamp(20px,4vw,36px)', color: BAI.ink,
                    lineHeight: 1, marginBottom: 4,
                  }}>
                    {kpi.value}
                  </p>
                  <p style={{ fontSize: 11, color: BAI.inkFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {kpi.sub}
                  </p>
                  <ArrowRight size={12} style={{ color: BAI.inkFaint, marginTop: 'auto', alignSelf: 'flex-end', paddingTop: 6 }} />
                </div>
              </Link>
            ))}
          </div>

          {/* ── Main grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* Left column (2/3) */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Dossier locatif widget ──────────────────────────── */}
                <div style={cardBase}>
                  <div style={{
                    padding: '16px 20px', borderBottom: `1px solid ${BAI.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                        Mon dossier locatif
                      </span>
                    </div>
                    <Link to="/dossier" style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 500, color: BAI.tenant, textDecoration: 'none',
                    }}>
                      Gérer <ArrowRight size={12} />
                    </Link>
                  </div>

                  <div style={{ padding: 20 }}>
                    {dossierPercent >= 100 ? (
                      <>
                        {/* Success header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                          padding: '12px 14px', borderRadius: 10,
                          background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                        }}>
                          <CheckCircle size={16} style={{ color: BAI.tenant, flexShrink: 0 }} />
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: BAI.tenant }}>
                              Dossier complet
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: BAI.inkFaint, marginTop: 1 }}>
                              Toutes les catégories sont renseignées — vous pouvez postuler partout.
                            </p>
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3" style={{ gap: 8, marginBottom: 14 }}>
                          {[
                            { label: 'En cours', value: pendingApps.length, color: BAI.caramel, bg: '#fdf5ec', border: '#f3c99a' },
                            { label: 'Approuvées', value: approvedApps.length, color: BAI.tenant, bg: BAI.tenantLight, border: BAI.tenantBorder },
                            { label: 'Visites', value: upcomingBookings.length, color: BAI.inkMid, bg: BAI.bgMuted, border: BAI.border },
                          ].map(({ label, value, color, bg, border }) => (
                            <div key={label} style={{
                              textAlign: 'center', padding: '10px 6px', borderRadius: 9,
                              background: bg, border: `1px solid ${border}`,
                            }}>
                              <p style={{
                                margin: '0 0 2px', fontSize: 22, fontWeight: 700,
                                fontFamily: BAI.fontDisplay, color,
                              }}>
                                {value}
                              </p>
                              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: BAI.inkFaint, letterSpacing: '0.06em' }}>
                                {label}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* CTA to search */}
                        <Link to="/search" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '11px', borderRadius: 10,
                          background: BAI.night, color: '#ffffff',
                          fontSize: 13, fontWeight: 600, textDecoration: 'none',
                        }}>
                          Rechercher un bien →
                        </Link>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                          {/* SVG ring */}
                          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="60" cy="60" r={RING_R} strokeWidth="8" fill="none" stroke={BAI.bgMuted} />
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
                                fontSize: 32, fontWeight: 700, color: BAI.ink, lineHeight: 1,
                              }}>
                                {dossierPercent}%
                              </span>
                            </div>
                          </div>

                          {/* Right: status + pills */}
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 15, fontWeight: 600, color: BAI.ink, marginBottom: 4 }}>
                              {dossierPercent >= 50 ? 'Dossier en bonne voie, continuez !' : 'Complétez votre dossier pour postuler'}
                            </p>
                            <p style={{ fontSize: 12, color: BAI.inkFaint, marginBottom: 16 }}>
                              {coveredCount} / {REQUIRED_CATEGORIES.length} catégories complètes
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 8 }}>
                              {([
                                { id: 'IDENTITE', label: 'Identité',  Icon: CreditCard },
                                { id: 'EMPLOI',   label: 'Emploi',    Icon: Briefcase },
                                { id: 'REVENUS',  label: 'Revenus',   Icon: Banknote },
                                { id: 'DOMICILE', label: 'Domicile',  Icon: Home },
                              ] as const).map(({ id, label, Icon }) => {
                                const done = dossierCoveredCats.has(id)
                                return (
                                  <Link key={id} to="/dossier" style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                    textDecoration: 'none',
                                    background: done ? BAI.tenantLight : BAI.bgMuted,
                                    border: `1px solid ${done ? BAI.tenantBorder : BAI.borderStrong}`,
                                    color: done ? BAI.tenant : BAI.inkFaint,
                                  }}>
                                    <Icon size={13} style={{ flexShrink: 0 }} />
                                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                                    {done && <CheckCircle size={13} style={{ flexShrink: 0 }} />}
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <Link to="/dossier" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '11px', borderRadius: 10,
                          background: BAI.tenant, color: '#ffffff',
                          fontSize: 13, fontWeight: 600, textDecoration: 'none',
                        }}>
                          <FolderOpen size={15} /> Compléter mon dossier
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* ── Candidatures ───────────────────────────────────────── */}
                <div style={cardBase}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BAI.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                          Mes candidatures
                        </span>
                        {pendingApps.length > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#ffffff',
                            background: BAI.tenant, borderRadius: 20, padding: '1px 8px',
                          }}>
                            {pendingApps.length}
                          </span>
                        )}
                      </div>
                      <Link to="/my-applications" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: BAI.tenant, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${BAI.border}` }} />
                  </div>

                  {activeApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: BAI.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <SendHorizonal size={18} style={{ color: BAI.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 8 }}>Aucune candidature en cours</p>
                      <Link to="/search" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 500, color: BAI.tenant, textDecoration: 'none',
                      }}>
                        <Search size={13} /> Parcourir les annonces
                      </Link>
                    </div>
                  ) : (
                    <div>
                      {activeApps.slice(0, 5).map((app, idx) => {
                        const isLast = idx === Math.min(activeApps.length, 5) - 1
                        const thumb = app.property?.images?.[0]
                        return (
                          <div key={app.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 14,
                            padding: '12px 20px',
                            borderBottom: isLast ? 'none' : `1px solid ${BAI.border}`,
                            transition: 'background 0.15s',
                            flexWrap: 'wrap',
                          }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            {/* Thumbnail */}
                            {thumb ? (
                              <img src={thumb} alt={app.property?.title}
                                style={{ width: 52, height: 52, borderRadius: 9, objectFit: 'cover', flexShrink: 0, border: `1px solid ${BAI.border}` }}
                              />
                            ) : (
                              <div style={{
                                width: 52, height: 52, borderRadius: 9, flexShrink: 0,
                                background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Home size={18} style={{ color: BAI.inkFaint }} />
                              </div>
                            )}

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.property?.title}
                              </p>
                              <p style={{ fontSize: 12, color: BAI.inkMid, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                                {app.property?.city} · {app.property?.price} €/mois
                              </p>
                              {/* Quick actions */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {app.property?.ownerId && (
                                  <button
                                    onClick={() => navigate('/messages', { state: { openWithUserId: app.property?.ownerId, propertyId: app.property?.id } })}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 4,
                                      padding: '4px 10px', borderRadius: 6, border: `1px solid ${BAI.border}`,
                                      background: BAI.bgSurface, color: BAI.inkMid,
                                      fontSize: 11, fontWeight: 500, cursor: 'pointer',
                                    }}
                                  >
                                    <MessageSquare size={11} /> Contacter
                                  </button>
                                )}
                                <Link to={`/property/${app.property?.id}`} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 6, border: `1px solid ${BAI.border}`,
                                  background: BAI.bgSurface, color: BAI.inkMid,
                                  fontSize: 11, fontWeight: 500, textDecoration: 'none',
                                }}>
                                  <ExternalLink size={11} /> Voir le bien
                                </Link>
                                {app.status === 'APPROVED' && (
                                  <Link to="/my-bookings" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '4px 10px', borderRadius: 6, border: 'none',
                                    background: BAI.tenant, color: '#ffffff',
                                    fontSize: 11, fontWeight: 600, textDecoration: 'none',
                                  }}>
                                    Réserver
                                  </Link>
                                )}
                              </div>
                            </div>

                            {/* Status badge */}
                            <span style={{
                              fontSize: 11, fontWeight: 600, flexShrink: 0,
                              padding: '3px 12px', borderRadius: 20,
                              alignSelf: 'flex-start', marginTop: 2,
                              ...(STATUS_STYLE[app.status] || {}),
                            }}>
                              {STATUS_LABEL[app.status] || app.status}
                            </span>
                          </div>
                        )
                      })}
                      {activeApps.length > 5 && (
                        <div style={{ padding: '12px 20px', borderTop: `1px solid ${BAI.border}`, textAlign: 'center' }}>
                          <Link to="/my-applications" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 12, fontWeight: 500, color: BAI.tenant, textDecoration: 'none',
                          }}>
                            Voir toutes les candidatures <ArrowRight size={12} />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Visites à venir ────────────────────────────────────── */}
                <div style={cardBase}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BAI.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                        Visites à venir
                      </span>
                      <Link to="/my-bookings" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: BAI.tenant, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${BAI.border}` }} />
                  </div>

                  {isLoadingBookings ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                      <Loader2 size={24} style={{ color: BAI.inkFaint, animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : upcomingBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: BAI.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <Calendar size={18} style={{ color: BAI.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 8 }}>Aucune visite programmée</p>
                      <Link to="/search" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 500, color: BAI.tenant, textDecoration: 'none',
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
                            borderBottom: isLast ? 'none' : `1px solid ${BAI.border}`,
                            textDecoration: 'none', transition: 'background 0.15s',
                          }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            {booking.property.images?.[0] ? (
                              <img src={booking.property.images[0]} alt={booking.property.title}
                                style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{
                                width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                                background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Home size={20} style={{ color: BAI.inkFaint }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {booking.property.title}
                              </p>
                              <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: BAI.inkMid, margin: '0 0 4px' }}>
                                <MapPin size={11} /> {booking.property.city}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: BAI.inkFaint }}>
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
                                ? { background: BAI.tenantLight, color: BAI.tenant, border: `1px solid ${BAI.tenantBorder}` }
                                : { background: BAI.caramelLight, color: BAI.caramel, border: '1px solid #e8c9a0' }),
                            }}>
                              {booking.status === 'CONFIRMED' ? 'Confirmée' : 'En attente'}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Right sidebar (1/3) ──────────────────────────────────── */}
            <div className="hidden lg:flex" style={{ flexDirection: 'column', gap: 16 }}>

              {/* Search CTA */}
              <div style={{
                borderRadius: 16, padding: 20,
                background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: BAI.tenant, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Search size={14} style={{ color: '#ffffff' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>Trouver votre logement</p>
                </div>
                <p style={{ fontSize: 12, color: BAI.inkMid, marginBottom: 14 }}>
                  {favoriteIds.size > 0
                    ? `${favoriteIds.size} bien${favoriteIds.size > 1 ? 's' : ''} en favori`
                    : 'Explorez les annonces disponibles.'}
                </p>
                <Link to="/search" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 10,
                  background: BAI.tenant, color: '#ffffff',
                  fontSize: 13, fontWeight: 600, textDecoration: 'none',
                }}>
                  <Search size={14} /> Parcourir les annonces
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>

    </Layout>
  )
}
