import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'
import { Users, Home, FileText, Phone, Mail, ChevronRight } from 'lucide-react'
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
  status: string
}

const CONTRACT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Actif', color: '#1b5e3b', bg: '#edf7f2' },
  SIGNED_OWNER: { label: 'Signé', color: '#1a3270', bg: '#eaf0fb' },
  SIGNED_TENANT: { label: 'Signé', color: '#1a3270', bg: '#eaf0fb' },
  COMPLETED: { label: 'Complété', color: '#1b5e3b', bg: '#edf7f2' },
  SENT: { label: 'Envoyé', color: '#92400e', bg: '#fdf5ec' },
  DRAFT: { label: 'Brouillon', color: BAI.inkFaint, bg: BAI.bgMuted },
}

function Initials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const colors = ['#1a3270', '#1b5e3b', '#c4976a', '#6b46c1', '#0e7490', '#b45309']
  const idx = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length
  return (
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      background: colors[idx], color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 16,
      flexShrink: 0,
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
        const contracts = res.data.data ?? []
        const active = contracts.filter((c: any) =>
          ['ACTIVE', 'COMPLETED', 'SIGNED_OWNER', 'SIGNED_TENANT'].includes(c.status) &&
          c.tenant
        )
        const mapped: Tenant[] = active.map((c: any) => ({
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

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
              Locataires
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 4px', lineHeight: 1.15 }}>
              Mes locataires
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
              {tenants.length} locataire{tenants.length !== 1 ? 's' : ''} en bail actif
            </p>
          </div>

          {/* Search */}
          {tenants.length > 0 && (
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <input
                type="text"
                placeholder="Rechercher un locataire, un bien..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '11px 16px 11px 42px',
                  border: `1px solid ${BAI.border}`, borderRadius: 10,
                  fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink,
                  background: BAI.bgSurface, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
              Chargement...
            </div>
          ) : tenants.length === 0 ? (
            <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '56px 24px', textAlign: 'center' }}>
              <Users className="w-10 h-10" style={{ color: BAI.inkFaint, margin: '0 auto 16px' }} />
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: BAI.ink, margin: '0 0 8px' }}>
                Aucun locataire pour l'instant
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 24px' }}>
                Vos locataires apparaîtront ici une fois leurs contrats signés.
              </p>
              <Link to="/contracts/new" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px', background: BAI.night, color: '#fff',
                borderRadius: 10, textDecoration: 'none',
                fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14,
              }}>
                Créer un contrat
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: BAI.inkMid, fontFamily: BAI.fontBody }}>
              Aucun résultat pour "{search}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(t => {
                const s = CONTRACT_STATUS[t.status] ?? CONTRACT_STATUS.DRAFT
                return (
                  <div key={t.contractId} style={{
                    background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                    borderRadius: 12, padding: '20px 24px',
                    boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.04)',
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  }}>
                    {/* Avatar */}
                    <Initials firstName={t.firstName} lastName={t.lastName} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 16, color: BAI.ink }}>
                          {t.firstName} {t.lastName}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: s.bg, color: s.color,
                        }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px 20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>
                          <Home className="w-3.5 h-3.5" />
                          {t.property.title} · {t.property.city}
                        </span>
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>
                          <strong style={{ color: BAI.ink }}>{t.monthlyRent.toLocaleString('fr-FR')} €</strong>/mois
                        </span>
                        {t.startDate && (
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                            depuis {new Date(t.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px 16px', flexWrap: 'wrap', marginTop: 6 }}>
                        <a href={`mailto:${t.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel, textDecoration: 'none' }}>
                          <Mail className="w-3 h-3" />{t.email}
                        </a>
                        {t.phone && (
                          <a href={`tel:${t.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, textDecoration: 'none' }}>
                            <Phone className="w-3 h-3" />{t.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Link
                        to={`/contracts/${t.contractId}`}
                        title="Voir le contrat"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 8,
                          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                          fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 500, color: BAI.inkMid,
                          textDecoration: 'none',
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        Contrat
                      </Link>
                      <Link
                        to={`/owner/tenants/${t.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 8,
                          background: BAI.night, color: '#fff',
                          fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Profil
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
