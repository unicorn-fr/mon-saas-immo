import { useEffect, useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { Link, useNavigate } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { Contract } from '../../types/contract.types'
import { Layout } from '../../components/layout/Layout'
import {
  FileText,
  Plus,
  Calendar,
  Euro,
  User,
  Home as HomeIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  PenLine,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'


type TabKey = 'actifs' | 'en-cours' | 'brouillons' | 'archives'

const TAB_STATUSES: Record<TabKey, string[]> = {
  'actifs':    ['ACTIVE'],
  'en-cours':  ['SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED'],
  'brouillons':['DRAFT'],
  'archives':  ['TERMINATED', 'EXPIRED', 'CANCELLED'],
}

export default function ContractsList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { contracts, statistics, isLoading, fetchContracts, fetchStatistics } = useContractStore()
  const [activeTab, setActiveTab] = useState<TabKey>('actifs')

  useEffect(() => {
    fetchContracts(undefined, 1, 200)
    fetchStatistics()
  }, [fetchContracts, fetchStatistics])

  const filtered = contracts.filter((c) => TAB_STATUSES[activeTab].includes(c.status))

  const counts: Record<TabKey, number> = {
    'actifs':    contracts.filter(c => c.status === 'ACTIVE').length,
    'en-cours':  contracts.filter(c => ['SENT','SIGNED_OWNER','SIGNED_TENANT','COMPLETED'].includes(c.status)).length,
    'brouillons':contracts.filter(c => c.status === 'DRAFT').length,
    'archives':  contracts.filter(c => ['TERMINATED','EXPIRED','CANCELLED'].includes(c.status)).length,
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'actifs',     label: 'Actifs' },
    { key: 'en-cours',   label: 'En cours' },
    { key: 'brouillons', label: 'Brouillons' },
    { key: 'archives',   label: 'Archives' },
  ]

  const getStatusPill = (status: string) => {
    const variants: Record<string, { bg: string; color: string; border: string; icon: any; label: string }> = {
      DRAFT:         { bg: BAI.bgMuted,        color: BAI.inkMid,   border: BAI.borderStrong,  icon: Clock,       label: 'Brouillon' },
      SENT:          { bg: BAI.warningLight,    color: BAI.warning,  border: BAI.caramel,    icon: Send,        label: 'Envoyé' },
      SIGNED_OWNER:  { bg: BAI.ownerLight,   color: BAI.owner,    border: BAI.ownerBorder,icon: PenLine,     label: 'Signé (proprio)' },
      SIGNED_TENANT: { bg: BAI.tenantLight,  color: BAI.tenant,   border: BAI.tenantBorder,icon: PenLine,    label: 'Signé (locataire)' },
      COMPLETED:     { bg: BAI.tenantLight,  color: BAI.tenant,   border: BAI.tenantBorder,icon: CheckCircle,label: 'Signé' },
      ACTIVE:        { bg: BAI.tenantLight,  color: BAI.tenant,   border: BAI.tenantBorder,icon: CheckCircle,label: 'Actif' },
      EXPIRED:       { bg: BAI.bgMuted,        color: BAI.inkFaint, border: BAI.border,     icon: AlertCircle, label: 'Expiré' },
      TERMINATED:    { bg: BAI.errorLight,     color: BAI.error,   border: '#fca5a5',    icon: XCircle,     label: 'Résilié' },
      CANCELLED:     { bg: BAI.bgMuted,        color: BAI.inkFaint, border: BAI.border,     icon: XCircle,     label: 'Annulé' },
    }
    const v = variants[status] || variants['DRAFT']
    const Icon = v.icon
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          fontSize: 11, fontWeight: 600, fontFamily: BAI.fontBody,
          background: v.bg, color: v.color,
          border: `1px solid ${v.border}`,
          letterSpacing: '0.02em',
        }}
      >
        <Icon style={{ width: 11, height: 11 }} />
        {v.label}
      </span>
    )
  }

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const isOwner = user?.role === 'OWNER'
    const otherParty = isOwner ? contract.tenant : contract.owner
    const inSignature = ['SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED'].includes(contract.status)

    return (
      <div
        style={{
          background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`,
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
          padding: '20px',
          cursor: 'pointer',
          transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.15s',
          fontFamily: BAI.fontBody,
        }}
        onClick={() => navigate(`/contracts/${contract.id}`)}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.boxShadow = '0 4px 12px rgba(13,12,10,0.10), 0 12px 32px rgba(13,12,10,0.08)'
          el.style.transform = 'translateY(-2px)'
          el.style.borderColor = BAI.borderStrong
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.boxShadow = '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)'
          el.style.transform = 'translateY(0)'
          el.style.borderColor = BAI.border
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3
              className="truncate mb-1"
              style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: BAI.ink }}
            >
              {contract.property?.title}
            </h3>
            <div className="flex items-center" style={{ fontSize: 12, color: BAI.inkFaint, gap: 4 }}>
              <HomeIcon style={{ width: 12, height: 12 }} />
              {contract.property?.city}
            </div>
          </div>
          <div className="ml-3 shrink-0">{getStatusPill(contract.status)}</div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center" style={{ fontSize: 13, color: BAI.inkMid, gap: 8 }}>
            <User style={{ width: 13, height: 13, color: BAI.inkFaint, flexShrink: 0 }} />
            <span style={{ color: BAI.inkFaint }}>{isOwner ? 'Locataire :' : 'Propriétaire :'}</span>
            <span style={{ fontWeight: 500, color: BAI.ink }} className="truncate">
              {otherParty
                ? `${otherParty.firstName} ${otherParty.lastName}`
                : isOwner ? 'Locataire non assigné' : 'Propriétaire non assigné'}
            </span>
          </div>
          <div className="flex items-center" style={{ fontSize: 13, color: BAI.inkMid, gap: 8 }}>
            <Calendar style={{ width: 13, height: 13, color: BAI.inkFaint, flexShrink: 0 }} />
            {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })} →{' '}
            {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
          </div>
          <div className="flex items-center" style={{ fontSize: 13, gap: 8 }}>
            <Euro style={{ width: 13, height: 13, color: BAI.inkFaint, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: BAI.caramel, whiteSpace: 'nowrap' }}>{Number(contract.monthlyRent).toLocaleString('fr-FR')} €/mois</span>
            {contract.charges ? <span style={{ color: BAI.inkFaint, whiteSpace: 'nowrap' }}>+ {Number(contract.charges).toLocaleString('fr-FR')} € charges</span> : null}
          </div>
        </div>

        {inSignature && (
          <div
            className="pt-3"
            style={{ borderTop: `1px solid ${BAI.border}` }}
          >
            <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 6, fontFamily: BAI.fontBody, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Progression des signatures
            </p>
            <div className="flex items-center gap-4" style={{ fontSize: 12 }}>
              <div className="flex items-center gap-1.5">
                {contract.ownerSignature || ['SIGNED_OWNER','COMPLETED'].includes(contract.status) ? (
                  <CheckCircle style={{ width: 13, height: 13, color: BAI.tenant }} />
                ) : (
                  <Clock style={{ width: 13, height: 13, color: BAI.caramel }} />
                )}
                <span style={{ color: BAI.inkMid }}>Propriétaire</span>
              </div>
              <div className="flex items-center gap-1.5">
                {contract.tenantSignature || ['SIGNED_TENANT','COMPLETED'].includes(contract.status) ? (
                  <CheckCircle style={{ width: 13, height: 13, color: BAI.tenant }} />
                ) : (
                  <Clock style={{ width: 13, height: 13, color: BAI.caramel }} />
                )}
                <span style={{ color: BAI.inkMid }}>Locataire</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading && contracts.length === 0) {
    return (
      <Layout>
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `2px solid ${BAI.border}`,
                borderTopColor: BAI.night,
              }}
              className="animate-spin"
            />
            <p style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement des contrats…</p>
          </div>
        </div>
      </Layout>
    )
  }

  const pendingSignatures = (statistics?.sent || 0) + (statistics?.completed || 0)

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: BAI.bgBase, fontFamily: BAI.fontBody }}>

        {/* Header */}
        <div style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}` }}>
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{
                  fontFamily: BAI.fontBody, fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: BAI.caramel, marginBottom: 6,
                }}>
                  Gestion locative
                </p>
                <h1 style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(24px, 5vw, 40px)', color: BAI.ink, lineHeight: 1.1, margin: 0,
                }}>
                  Mes contrats
                  {statistics && (
                    <span style={{
                      fontFamily: BAI.fontBody, fontStyle: 'normal', fontWeight: 600,
                      fontSize: 14, color: BAI.inkFaint,
                      background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                      borderRadius: 20, padding: '2px 10px', marginLeft: 14,
                      verticalAlign: 'middle',
                    }}>
                      {statistics.total}
                    </span>
                  )}
                </h1>
                {statistics && (
                  <p style={{ fontSize: 14, color: BAI.inkMid, marginTop: 6 }}>
                    <span style={{ color: BAI.tenant, fontWeight: 600 }}>{statistics.active}</span> actifs
                    {pendingSignatures > 0 && (
                      <> · <span style={{ color: BAI.caramel, fontWeight: 600 }}>{pendingSignatures}</span> en attente de signature</>
                    )}
                  </p>
                )}
              </div>
              {user?.role === 'OWNER' && (
                <Link
                  to="/contracts/new"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '0 18px', minHeight: 44, borderRadius: 8,
                    background: BAI.night, color: '#ffffff',
                    fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
                    textDecoration: 'none', border: 'none',
                    transition: 'opacity 0.15s',
                    touchAction: 'manipulation',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Plus style={{ width: 15, height: 15 }} />
                  Nouveau contrat
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs — scrollables horizontalement sur mobile */}
        <div style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}` }}>
          <div className="container mx-auto px-4">
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                      padding: '14px 16px', fontSize: 13, fontWeight: 500,
                      fontFamily: BAI.fontBody, cursor: 'pointer',
                      background: 'transparent', border: 'none',
                      borderBottom: `2px solid ${isActive ? BAI.night : 'transparent'}`,
                      color: isActive ? BAI.ink : BAI.inkFaint,
                      transition: 'color 0.15s, border-color 0.15s',
                      minHeight: 48, touchAction: 'manipulation',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                    {counts[tab.key] > 0 && (
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        padding: '1px 7px', borderRadius: 20,
                        background: isActive ? BAI.night : BAI.bgMuted,
                        color: isActive ? '#ffffff' : BAI.inkFaint,
                      }}>
                        {counts[tab.key]}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: BAI.bgMuted, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <FileText style={{ width: 28, height: 28, color: BAI.inkFaint }} />
              </div>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 22, color: BAI.ink, marginBottom: 10,
              }}>
                {activeTab === 'actifs'     ? 'Aucun contrat actif'          :
                 activeTab === 'en-cours'   ? 'Aucun contrat en cours'       :
                 activeTab === 'brouillons' ? 'Aucun brouillon'              :
                                             'Aucun contrat archivé'}
              </h2>
              <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
                {activeTab === 'actifs'     ? 'Les contrats actifs apparaîtront ici.' :
                 activeTab === 'en-cours'   ? 'Les contrats en attente de signature apparaîtront ici.' :
                 activeTab === 'brouillons' ? 'Commencez par créer un nouveau contrat.' :
                                             'Les contrats terminés apparaîtront ici.'}
              </p>
              {user?.role === 'OWNER' && activeTab === 'brouillons' && (
                <Link
                  to="/contracts/new"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 8,
                    background: BAI.night, color: '#ffffff',
                    fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  <Plus style={{ width: 15, height: 15 }} />
                  Créer mon premier contrat
                </Link>
              )}
              {user?.role === 'OWNER' && activeTab === 'actifs' && (
                <Link
                  to="/contracts/new"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 8,
                    background: BAI.night, color: '#ffffff',
                    fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  <Plus style={{ width: 15, height: 15 }} />
                  Créer un contrat
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
