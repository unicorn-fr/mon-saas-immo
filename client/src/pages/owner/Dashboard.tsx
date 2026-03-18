import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'
import { Layout } from '../../components/layout/Layout'
import {
  Home, Plus, Eye, MessageSquare, TrendingUp,
  Euro, ArrowRight, MapPin, FileText, PenLine,
  AlertTriangle, CalendarCheck, Users,
  ClipboardList, Zap, Banknote, ArrowUpRight,
} from 'lucide-react'
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
  owner:         '#1a3270',
  ownerLight:    '#eaf0fb',
  ownerBorder:   '#b8ccf0',
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

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { statistics, myProperties, fetchMyStatistics, fetchMyProperties, isLoading } = useProperties()
  const { contracts, statistics: contractStats, fetchContracts, fetchStatistics: fetchContractStatistics } = useContractStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const [pendingApps, setPendingApps] = useState<Application[]>([])

  useEffect(() => {
    fetchMyStatistics()
    fetchMyProperties({ page: 1, limit: 6 })
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
    fetchUnreadCount()
    applicationService.list().then((apps) => {
      setPendingApps(apps.filter((a) => a.status === 'PENDING'))
    }).catch(() => {})
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
    OCCUPIED:  { label: 'En location', bg: T.caramelLight, text: T.caramel, border: '#e8c9a0' },
    RESERVED:  { label: 'Réservé',     bg: T.ownerLight, text: T.owner, border: T.ownerBorder },
    DRAFT:     { label: 'Hors marché', bg: T.bgMuted, text: T.inkMid, border: T.borderMid },
  }

  const getContractStatusLabel = (status: string) => ({
    DRAFT: 'Brouillon', SENT: 'Envoyé', SIGNED_OWNER: 'En signature',
    SIGNED_TENANT: 'À signer', COMPLETED: 'Signé', ACTIVE: 'Actif',
    EXPIRED: 'Expiré', TERMINATED: 'Résilié',
  }[status] || status)

  const contractStatusStyle = (status: string): React.CSSProperties =>
    status === 'ACTIVE'        ? { background: '#edf7f2',   color: '#1b5e3b', border: '1px solid #9fd4ba' } :
    status === 'DRAFT'         ? { background: T.caramelLight, color: T.caramel, border: '1px solid #e8c9a0' } :
    status === 'SIGNED_TENANT' ? { background: '#fef2f2',   color: '#b91c1c', border: '1px solid #fecaca' } :
    { background: T.ownerLight, color: T.owner, border: `1px solid ${T.ownerBorder}` }

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading && !statistics) {
    return (
      <Layout>
        <div style={{ background: T.bgBase, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `3px solid ${T.ownerLight}`,
            borderTopColor: T.owner,
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </Layout>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (totalProps === 0) {
    return (
      <Layout>
        <div style={{ background: T.bgBase, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: T.ownerLight, border: `1px solid ${T.ownerBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Home size={36} style={{ color: T.owner }} />
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 700, fontStyle: 'italic',
              fontSize: 32, color: T.ink, marginBottom: 12,
            }}>
              Votre patrimoine vous attend
            </h2>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 16, color: T.inkMid, marginBottom: 32, lineHeight: 1.6 }}>
              Ajoutez votre première propriété pour commencer à gérer vos locations et suivre vos revenus.
            </p>
            <Link to="/properties/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: T.owner, color: '#ffffff',
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
            <Link to="/properties/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: T.owner, color: '#ffffff',
              fontWeight: 600, fontSize: 13, textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}>
              <Plus size={15} /> Nouveau bien
            </Link>
          </div>

          {/* ── Alertes ─────────────────────────────────────────────────── */}
          {(urgentContracts.length > 0 || pendingApps.length > 0 || drafts > 0) && (
            <div style={{
              background: T.caramelLight, border: `1px solid #e8c9a0`,
              borderLeft: `3px solid ${T.caramel}`,
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
              marginBottom: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <AlertTriangle size={15} style={{ color: T.caramel, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.caramel }}>Actions requises</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {urgentContracts.length > 0 && (
                  <Link to="/contracts" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    background: T.caramel, color: '#ffffff',
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
                    background: T.owner, color: '#ffffff',
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
                    background: T.bgMuted, color: T.inkMid,
                    border: `1px solid ${T.borderMid}`,
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
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16, marginBottom: 32,
          }}
            className="lg-grid-4"
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
                  borderTop: `3px solid ${T.owner}`,
                  padding: 20,
                  display: 'flex', flexDirection: 'column', height: '100%',
                  boxSizing: 'border-box', cursor: kpi.to ? 'pointer' : 'default',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                  onMouseEnter={(e) => {
                    if (kpi.to) {
                      (e.currentTarget as HTMLElement).style.boxShadow = T.shadowHover;
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                    }
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
                  {kpi.to && (
                    <ArrowUpRight size={14} style={{ color: T.inkFaint, marginTop: 'auto', alignSelf: 'flex-end', marginBottom: 0 }} />
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg-grid-3col">

            {/* Left column (2/3) */}
            <div style={{ gridColumn: 'span 2' }} className="lg-col-span-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Mes biens ─────────────────────────────────────────── */}
                <div style={cardBase}>
                  {/* Section header */}
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint }}>
                        Mes biens
                      </span>
                      <Link to="/properties/owner/me" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: T.owner, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${T.border}` }} />
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
                            border: 'none', borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                            cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bgMuted }}
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
                              background: T.bgMuted, border: `1px solid ${T.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Home size={24} style={{ color: T.inkFaint }} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {property.title}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.inkMid }}>
                              <MapPin size={11} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.city}</span>
                              <span style={{ flexShrink: 0 }}>· {property.bedrooms} ch · {property.surface} m²</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: 0 }}>
                              {property.price} <span style={{ fontWeight: 400, fontSize: 11, color: T.inkFaint }}>€/mois</span>
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

                  <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.border}` }}>
                    <Link to="/properties/new" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                      color: T.owner, textDecoration: 'none', transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.ownerLight }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <Plus size={13} /> Ajouter un bien
                    </Link>
                  </div>
                </div>

                {/* ── Candidatures en attente ────────────────────────────── */}
                <div style={cardBase}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint }}>
                          Candidatures en attente
                        </span>
                        {pendingApps.length > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#ffffff',
                            background: T.owner, borderRadius: 20, padding: '1px 8px',
                          }}>
                            {pendingApps.length}
                          </span>
                        )}
                      </div>
                      <Link to="/applications/manage" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: T.owner, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${T.border}` }} />
                  </div>

                  {pendingApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: T.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <Users size={18} style={{ color: T.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: T.inkMid }}>Aucune candidature en attente</p>
                    </div>
                  ) : (
                    <div>
                      {pendingApps.slice(0, 4).map((app, idx) => {
                        const isLast = idx === Math.min(pendingApps.length, 4) - 1
                        const scoreStroke = app.score >= 70 ? '#1b5e3b' : app.score >= 40 ? T.caramel : '#b91c1c'
                        const circumference = 2 * Math.PI * 16
                        return (
                          <div key={app.id} style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '12px 20px',
                            borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                          }}>
                            {/* Score ring */}
                            <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                              <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="20" cy="20" r="16" strokeWidth="3" fill="none" stroke={T.bgMuted} />
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
                              <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.tenant?.firstName} {app.tenant?.lastName}
                              </p>
                              <p style={{ fontSize: 12, color: T.inkMid, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.property?.title} · {format(new Date(app.createdAt), 'd MMM', { locale: fr })}
                              </p>
                            </div>

                            <Link to="/applications/manage" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '6px 14px', borderRadius: 8,
                              background: T.owner, color: '#ffffff',
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
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint }}>
                        Contrats récents
                      </span>
                      <Link to="/contracts" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: T.owner, textDecoration: 'none',
                      }}>
                        Tout voir <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div style={{ borderTop: `1px solid ${T.border}` }} />
                  </div>

                  {contracts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: T.bgMuted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <FileText size={18} style={{ color: T.inkFaint }} />
                      </div>
                      <p style={{ fontSize: 13, color: T.inkMid, marginBottom: 16 }}>Aucun contrat</p>
                      <Link to="/contracts/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: T.owner, color: '#ffffff',
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
                              border: 'none', borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                              cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {contract.property?.title || 'Contrat'}
                              </p>
                              <p style={{ fontSize: 12, color: T.inkMid, margin: 0 }}>
                                {contract.tenant?.firstName} {contract.tenant?.lastName} · {contract.monthlyRent} €/mois
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Quick actions */}
              <div style={{ ...cardBase, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint, marginBottom: 16 }}>
                  Actions rapides
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Ajouter un bien',   icon: <Plus size={18} />,          to: '/properties/new' },
                    { label: 'Nouveau contrat',    icon: <FileText size={18} />,      to: '/contracts/new' },
                    { label: 'Gérer les visites',  icon: <CalendarCheck size={18} />, to: '/bookings/manage' },
                    {
                      label: 'Messages',
                      icon: <MessageSquare size={18} />,
                      to: '/messages',
                      badge: unreadCount > 0 ? unreadCount : undefined,
                    },
                  ].map(({ label, icon, to, badge }, idx, arr) => (
                    <Link key={label} to={to} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0',
                      borderBottom: idx < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                      textDecoration: 'none', color: T.ink, transition: 'color 0.15s',
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.owner }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.ink }}
                    >
                      <span style={{ color: 'inherit', flexShrink: 0, display: 'flex' }}>{icon}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{label}</span>
                      {badge !== undefined ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: '#ffffff',
                          background: T.owner, borderRadius: 20, padding: '1px 7px', flexShrink: 0,
                        }}>
                          {badge}
                        </span>
                      ) : (
                        <ArrowRight size={14} style={{ color: T.inkFaint, flexShrink: 0 }} />
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Portfolio breakdown */}
              <div style={{ ...cardBase, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint, marginBottom: 16 }}>
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
                        <span style={{ fontSize: 12, color: T.inkMid }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{value}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: T.bgMuted, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          background: T.owner,
                          width: `${pct}%`,
                          transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: T.inkMid }}>Total</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{totalProps} bien{totalProps > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Finance card */}
              <div style={{ ...cardBase, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint, margin: 0 }}>
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
                          background: T.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: T.owner, flexShrink: 0,
                        }}>
                          {icon}
                        </div>
                        <span style={{ fontSize: 12, color: T.inkMid }}>{label}</span>
                      </div>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 20, fontWeight: 700, color: T.ink,
                      }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity card */}
              <div style={{ ...cardBase, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkFaint, marginBottom: 16 }}>
                  Activité
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ...(statistics ? [
                      { label: 'Vues annonces',  value: statistics.totalViews || 0,    icon: <Eye size={14} /> },
                      { label: 'Contacts reçus', value: statistics.totalContacts || 0, icon: <Users size={14} /> },
                    ] : []),
                    ...(contractStats ? [
                      { label: 'Contrats actifs',  value: contractStats.active || 0, icon: <FileText size={14} /> },
                      { label: 'En signature',     value: pendingSignatures,          icon: <PenLine size={14} /> },
                    ] : []),
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 7,
                          background: T.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: T.owner, flexShrink: 0,
                        }}>
                          {icon}
                        </div>
                        <span style={{ fontSize: 12, color: T.inkMid }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Responsive grid helpers (Tailwind-independent) */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-grid-4 { grid-template-columns: repeat(4, 1fr) !important; }
          .lg-grid-3col { grid-template-columns: 1fr 1fr 1fr !important; }
          .lg-col-span-2 { grid-column: span 2 !important; }
        }
      `}</style>
    </Layout>
  )
}
