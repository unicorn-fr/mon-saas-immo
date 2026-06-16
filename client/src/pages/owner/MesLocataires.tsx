import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'
import { Users, Home, FileText, Phone, Mail, ChevronRight, Search, TrendingUp, Calendar, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

interface Tenant {
  id: string
  contractId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  property: {
    id: string
    title: string
    address: string
    city: string
  }
  monthlyRent: number
  startDate: string
  endDate?: string
  status: string
}

const CONTRACT_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: 'Actif', color: '#1b5e3b', bg: '#edf7f2', border: '#9fd4ba' },
  SIGNED_OWNER: { label: 'Signé', color: '#1a3270', bg: '#eaf0fb', border: '#b8ccf0' },
  SIGNED_TENANT: { label: 'Signé', color: '#1a3270', bg: '#eaf0fb', border: '#b8ccf0' },
  COMPLETED: { label: 'Complété', color: '#1b5e3b', bg: '#edf7f2', border: '#9fd4ba' },
  SENT: { label: 'Envoyé', color: '#92400e', bg: '#fdf5ec', border: '#f3c99a' },
  DRAFT: { label: 'Brouillon', color: BAI.inkFaint, bg: BAI.bgMuted, border: BAI.border },
}

function Initials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const colors = [BAI.owner, BAI.tenant, BAI.caramel, '#6b46c1', '#0e7490', '#b45309']
  const idx = ((firstName.charCodeAt(0) || 0) + (lastName.charCodeAt(0) || 0)) % colors.length
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      background: colors[idx], color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 18,
      flexShrink: 0, letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  )
}

export default function MesLocataires() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiClient.get('/contracts')
      .then(res => {
        const contracts = res.data.data?.contracts ?? []
        const active = contracts.filter((c: any) =>
          ['ACTIVE', 'COMPLETED', 'SIGNED_OWNER', 'SIGNED_TENANT'].includes(c.status) &&
          c.tenant
        )
        // Deduplicate by tenantId — keep the ACTIVE contract when multiple exist
        const priorityOrder = ['ACTIVE', 'SIGNED_TENANT', 'SIGNED_OWNER', 'COMPLETED']
        const byTenant = new Map<string, any>()
        for (const c of active) {
          const existing = byTenant.get(c.tenantId)
          if (!existing) {
            byTenant.set(c.tenantId, c)
          } else {
            const existingPrio = priorityOrder.indexOf(existing.status) === -1 ? 999 : priorityOrder.indexOf(existing.status)
            const newPrio = priorityOrder.indexOf(c.status) === -1 ? 999 : priorityOrder.indexOf(c.status)
            if (newPrio < existingPrio) byTenant.set(c.tenantId, c)
          }
        }
        const mapped: Tenant[] = [...byTenant.values()].map((c: any) => ({
          id: c.tenantId,
          contractId: c.id,
          firstName: c.tenant?.firstName ?? '',
          lastName: c.tenant?.lastName ?? '',
          email: c.tenant?.email ?? '',
          phone: c.tenant?.phone,
          avatar: c.tenant?.avatar,
          property: {
            id: c.propertyId,
            title: c.property?.title ?? 'Bien',
            address: c.property?.address ?? '',
            city: c.property?.city ?? '',
          },
          monthlyRent: c.monthlyRent ?? 0,
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status,
        }))
        setTenants(mapped)
      })
      .catch(() => toast.error('Impossible de charger les locataires'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tenants.filter(t =>
    search === '' ||
    `${t.firstName} ${t.lastName} ${t.email} ${t.property.title} ${t.property.city}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = tenants.filter(t => t.status === 'ACTIVE').length
  const signingCount = tenants.filter(t => ['COMPLETED', 'SIGNED_OWNER', 'SIGNED_TENANT'].includes(t.status)).length
  const totalRevenue = tenants.reduce((sum, t) => sum + (t.monthlyRent || 0), 0)

  const glassKpi = (label: string, value: string | number) => (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.13)',
      borderRadius: 16,
      padding: '16px 24px',
      minWidth: 130,
    }}>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )

  return (
    <>      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>

        {/* === DARK HERO === */}
        <div style={{ background: '#0a0d1a', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
            Propriétaire
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '6px 0 8px', lineHeight: 1.1 }}>
            Mes locataires
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            {loading
              ? 'Chargement…'
              : tenants.length > 0
                ? `${tenants.length} locataire${tenants.length > 1 ? 's' : ''} · ${activeCount} contrat${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}`
                : 'Gérez vos locataires et accédez à leurs informations en un clic.'}
          </p>

          {/* Glass KPIs */}
          <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
            {glassKpi('Locataires', loading ? '—' : tenants.length)}
            {glassKpi('Actifs', loading ? '—' : activeCount)}
            {signingCount > 0 && glassKpi('En signature', signingCount)}
            {totalRevenue > 0 && glassKpi('Revenus /mois', `${totalRevenue.toLocaleString('fr-FR')} €`)}
          </div>
        </div>

        {/* === LIGHT CONTENT === */}
        <div style={{ background: BAI.bgBase, minHeight: '60vh', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>

            {/* Search */}
            {tenants.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: BAI.inkFaint, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Rechercher un locataire, un bien, une ville..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 16px 11px 42px',
                      border: `1px solid ${BAI.border}`, borderRadius: 10,
                      fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink,
                      background: BAI.bgSurface, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ padding: '10px 16px', borderRadius: 9, border: `1px solid ${BAI.border}`, background: BAI.bgSurface, fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, cursor: 'pointer' }}
                  >
                    Effacer
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '20px 24px', height: 100, opacity: 0.5 }} />
                ))}
              </div>
            ) : tenants.length === 0 ? (
              <div style={{ background: BAI.bgSurface, border: `1px dashed ${BAI.border}`, borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Users style={{ width: 24, height: 24, color: BAI.inkFaint }} />
                </div>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: BAI.ink, margin: '0 0 8px' }}>
                  Aucun locataire pour l'instant
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 24px' }}>
                  Vos locataires apparaîtront ici une fois leurs contrats signés.
                </p>
                <Link
                  to="/contracts/new"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 24px', background: BAI.night, color: '#fff',
                    borderRadius: 10, textDecoration: 'none',
                    fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14,
                  }}
                >
                  Créer un contrat
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: BAI.inkMid, fontFamily: BAI.fontBody }}>
                Aucun résultat pour « {search} »
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filtered.map(t => {
                  const s = CONTRACT_STATUS[t.status] ?? CONTRACT_STATUS.DRAFT
                  const isActive = t.status === 'ACTIVE'

                  // Duration progress bar for ACTIVE contracts
                  let durationPct: number | null = null
                  let monthsElapsed: number | null = null
                  if (isActive && t.startDate && t.endDate) {
                    const start = new Date(t.startDate).getTime()
                    const end = new Date(t.endDate).getTime()
                    const now = Date.now()
                    durationPct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
                    monthsElapsed = Math.floor((now - start) / (30.44 * 86400000))
                  }

                  return (
                    <div
                      key={t.contractId}
                      style={{
                        background: BAI.bgSurface,
                        border: `1px solid ${BAI.border}`,
                        borderRadius: 14,
                        padding: '20px 24px',
                        boxShadow: BAI.shadowSm,
                        borderLeft: isActive ? `4px solid ${BAI.tenant}` : `4px solid transparent`,
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        {/* Avatar */}
                        <Initials firstName={t.firstName} lastName={t.lastName} />

                        {/* Main info */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          {/* Name + badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 18, color: BAI.ink }}>
                              {t.firstName} {t.lastName}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                              fontFamily: BAI.fontBody, letterSpacing: '0.04em',
                            }}>
                              {s.label}
                            </span>
                          </div>

                          {/* Property */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                            <Home style={{ width: 13, height: 13, color: BAI.caramel, flexShrink: 0 }} />
                            <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, fontWeight: 500 }}>
                              {t.property.title}
                            </span>
                            <span style={{ color: BAI.border, margin: '0 2px' }}>·</span>
                            <MapPin style={{ width: 12, height: 12, color: BAI.inkFaint, flexShrink: 0 }} />
                            <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint }}>
                              {t.property.city}
                            </span>
                          </div>

                          {/* Contact */}
                          <div style={{ display: 'flex', gap: '4px 16px', flexWrap: 'wrap', marginBottom: 8 }}>
                            <a href={`mailto:${t.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel, textDecoration: 'none' }}>
                              <Mail style={{ width: 11, height: 11 }} />{t.email}
                            </a>
                            {t.phone && (
                              <a href={`tel:${t.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, textDecoration: 'none' }}>
                                <Phone style={{ width: 11, height: 11 }} />{t.phone}
                              </a>
                            )}
                          </div>

                          {/* Meta row: loyer + date */}
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <TrendingUp style={{ width: 13, height: 13, color: BAI.tenant, flexShrink: 0 }} />
                              <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: BAI.tenant }}>
                                {t.monthlyRent.toLocaleString('fr-FR')} €
                              </span>
                              <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>/mois</span>
                            </div>
                            {t.startDate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar style={{ width: 12, height: 12, color: BAI.inkFaint }} />
                                <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                                  depuis {new Date(t.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                  {monthsElapsed != null && monthsElapsed > 0 && ` (${monthsElapsed} mois)`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Duration progress bar (ACTIVE with endDate) */}
                          {durationPct != null && (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, color: BAI.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                  Durée du bail
                                </span>
                                <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, color: BAI.tenant }}>
                                  {durationPct}%
                                </span>
                              </div>
                              <div style={{ height: 4, background: BAI.bgMuted, borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${durationPct}%`, background: BAI.tenant, borderRadius: 99, transition: 'width 0.4s ease' }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          <Link
                            to={`/owner/tenants/${t.id}`}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '9px 18px', borderRadius: 9,
                              background: BAI.night, color: '#fff',
                              fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                              textDecoration: 'none', whiteSpace: 'nowrap',
                            }}
                          >
                            Voir profil
                            <ChevronRight style={{ width: 14, height: 14 }} />
                          </Link>
                          <Link
                            to={`/contracts/${t.contractId}`}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '8px 16px', borderRadius: 9,
                              border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                              fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 500, color: BAI.inkMid,
                              textDecoration: 'none', whiteSpace: 'nowrap',
                            }}
                          >
                            <FileText style={{ width: 13, height: 13 }} />
                            Contrat
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>  )
}
