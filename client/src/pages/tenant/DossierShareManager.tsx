/**
 * DossierShareManager — Maison Design System
 * Gestionnaire de partage du dossier locataire.
 * Accessible via : /dossier/partages
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ShieldCheck, ShieldOff,
  Clock, User, Loader2, AlertTriangle, Eye, Search,
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { TrustBadge } from '../../components/security/TrustBadge'
import { ReportUserModal } from '../../components/security/ReportUserModal'
import { shareApi, type DossierShare } from '../../services/dossier.service'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'

// ── Design tokens ──────────────────────────────────────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────────

function shareStatus(share: DossierShare): 'active' | 'expired' | 'revoked' {
  if (share.revokedAt) return 'revoked'
  if (new Date(share.expiresAt) < new Date()) return 'expired'
  return 'active'
}

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
}

// ── Grant form — contact picker ─────────────────────────────────────────────────

function GrantShareForm({ onGranted }: { onGranted: () => void }) {
  const { user } = useAuth()
  const { conversations, fetchConversations } = useMessages()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ id: string; firstName: string; lastName: string; avatar?: string | null } | null>(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Extract unique contacts (owner side of conversations)
  const contacts = conversations
    .map((c) => c.user1Id === user?.id ? c.user2 : c.user1)
    .filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i)
    .filter((u) =>
      !search.trim() ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

  const handleGrant = async () => {
    if (!selected) { toast.error('Sélectionnez un propriétaire'); return }
    setLoading(true)
    try {
      await shareApi.grantShare(selected.id, undefined, days)
      toast.success(`Dossier partagé avec ${selected.firstName} ${selected.lastName} pour ${days} jours`)
      setSelected(null)
      onGranted()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr?.response?.data?.message ?? (err instanceof Error ? err.message : 'Erreur lors du partage')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: BAI.bgSurface,
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${BAI.border}`,
      boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 16px rgba(13,12,10,0.05)',
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: '24px', fontWeight: 600, fontStyle: 'italic', color: BAI.ink, margin: '0 0 4px' }}>
          Partager mon dossier
        </h2>
        <p style={{ fontFamily: BAI.fontBody, fontSize: '13px', color: BAI.inkMid, margin: 0 }}>
          Sélectionnez le propriétaire parmi vos contacts
        </p>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative' as const, marginBottom: '12px' }}>
        <Search style={{ position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: BAI.inkFaint }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un propriétaire…"
          style={{
            width: '100%',
            boxSizing: 'border-box' as const,
            paddingLeft: '36px', paddingRight: '12px',
            paddingTop: '10px', paddingBottom: '10px',
            border: `1px solid ${BAI.border}`,
            borderRadius: '10px',
            fontSize: '13px', fontFamily: BAI.fontBody,
            color: BAI.ink, background: BAI.bgMuted,
            outline: 'none',
          }}
        />
      </div>

      {/* Contact list */}
      {conversations.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center' as const, borderRadius: '10px', border: `1.5px dashed ${BAI.border}` }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: '13px', color: BAI.inkFaint, margin: 0 }}>
            Aucun contact — envoyez d'abord un message à un propriétaire
          </p>
        </div>
      ) : contacts.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center' as const }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: '13px', color: BAI.inkFaint, margin: 0 }}>Aucun résultat</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', maxHeight: '200px', overflowY: 'auto' as const, marginBottom: '14px' }}>
          {contacts.map((contact) => {
            const isSelected = selected?.id === contact.id
            const initials = `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase()
            return (
              <button
                key={contact.id}
                onClick={() => setSelected(isSelected ? null : contact)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${isSelected ? BAI.tenantBorder : BAI.border}`,
                  background: isSelected ? BAI.tenantLight : BAI.bgMuted,
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                  transition: 'all 0.15s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: isSelected ? BAI.tenantBorder : '#e4e1db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: BAI.fontBody, fontSize: '12px', fontWeight: 600,
                  color: isSelected ? BAI.tenant : BAI.inkMid,
                  overflow: 'hidden',
                }}>
                  {contact.avatar
                    ? <img src={contact.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
                    : initials || <User style={{ width: 14, height: 14 }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: '13px', fontWeight: 600, color: BAI.ink, margin: 0 }}>
                    {contact.firstName} {contact.lastName}
                  </p>
                </div>
                {isSelected && (
                  <ShieldCheck style={{ width: 15, height: 15, color: BAI.tenant, flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Duration + submit */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{
            padding: '10px 12px', border: `1px solid ${BAI.border}`,
            borderRadius: '10px', fontSize: '13px', fontFamily: BAI.fontBody,
            color: BAI.inkMid, background: BAI.bgMuted, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value={3}>3 jours</option>
          <option value={7}>7 jours</option>
          <option value={14}>14 jours</option>
          <option value={30}>30 jours</option>
        </select>

        <button
          onClick={handleGrant}
          disabled={loading || !selected}
          style={{
            flex: 1, padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: !selected || loading ? BAI.inkFaint : BAI.tenant,
            color: '#ffffff', fontWeight: 600, fontSize: '13px', fontFamily: BAI.fontBody,
            cursor: !selected || loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { if (selected && !loading) (e.currentTarget as HTMLElement).style.background = '#144a2e' }}
          onMouseLeave={(e) => { if (selected && !loading) (e.currentTarget as HTMLElement).style.background = BAI.tenant }}
        >
          {loading
            ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            : <ShieldCheck style={{ width: 14, height: 14 }} />
          }
          {selected ? `Partager avec ${selected.firstName}` : 'Sélectionner un contact'}
        </button>
      </div>

      <p style={{ marginTop: '12px', fontFamily: BAI.fontBody, fontSize: '11px', color: BAI.inkFaint, lineHeight: 1.6 }}>
        Votre dossier sera accessible uniquement pendant la durée choisie.
        Vous pouvez révoquer l'accès à tout moment. Tous les documents sont filigranés.
      </p>
    </div>
  )
}

// ── Share card ──────────────────────────────────────────────────────────────────

function ShareCard({
  share,
  onRevoke,
  onReport,
}: {
  share: DossierShare
  onRevoke: (ownerId: string) => void
  onReport: (share: DossierShare) => void
}) {
  const status = shareStatus(share)
  const days = daysLeft(share.expiresAt)

  const statusConfig = {
    active: {
      bg: BAI.tenantLight,
      border: BAI.tenantBorder,
      text: BAI.tenant,
      dot: BAI.tenant,
      label: `Actif — ${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`,
    },
    expired: {
      bg: BAI.bgMuted,
      border: BAI.border,
      text: BAI.inkFaint,
      dot: BAI.borderStrong,
      label: 'Expiré',
    },
    revoked: {
      bg: '#fef2f2',
      border: '#fca5a5',
      text: '#9b1c1c',
      dot: '#ef4444',
      label: 'Révoqué',
    },
  }[status]

  const initials = `${share.owner.firstName[0]}${share.owner.lastName[0]}`.toUpperCase()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      style={{
        background: BAI.bgSurface,
        borderRadius: '14px',
        border: `1px solid ${status === 'active' ? BAI.border : '#f0ede8'}`,
        padding: '16px 18px',
        opacity: status === 'active' ? 1 : 0.6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '10px',
          flexShrink: 0,
          background: BAI.bgMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: BAI.fontDisplay,
          fontSize: '17px',
          fontWeight: 600,
          color: BAI.inkMid,
          overflow: 'hidden',
        }}>
          {share.owner.avatar
            ? <img src={share.owner.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
            : initials
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '2px' }}>
            <span style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: '14px', color: BAI.ink }}>
              {share.owner.firstName} {share.owner.lastName}
            </span>
            <TrustBadge
              trustScore={share.owner.trustScore}
              isVerifiedOwner={share.owner.isVerifiedOwner}
              size="sm"
            />
          </div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: '12px', color: BAI.inkFaint, margin: '0 0 6px' }}>
            {share.owner.email}
          </p>
          {/* Status pill */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 9px',
            borderRadius: '999px',
            background: statusConfig.bg,
            border: `1px solid ${statusConfig.border}`,
            color: statusConfig.text,
            fontFamily: BAI.fontBody,
            fontSize: '11px',
            fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusConfig.dot, flexShrink: 0 }} />
            {statusConfig.label}
          </span>
        </div>

        {/* Actions */}
        {status === 'active' && (
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => onReport(share)}
              title="Signaler ce propriétaire"
              style={{
                padding: '7px',
                borderRadius: '8px',
                border: `1px solid ${BAI.border}`,
                background: BAI.bgMuted,
                color: BAI.inkFaint,
                cursor: 'pointer',
                lineHeight: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#fef2f2'
                ;(e.currentTarget as HTMLElement).style.borderColor = '#fca5a5'
                ;(e.currentTarget as HTMLElement).style.color = '#9b1c1c'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = BAI.bgMuted
                ;(e.currentTarget as HTMLElement).style.borderColor = BAI.border
                ;(e.currentTarget as HTMLElement).style.color = BAI.inkFaint
              }}
            >
              <AlertTriangle style={{ width: 14, height: 14 }} />
            </button>
            <button
              onClick={() => onRevoke(share.ownerId)}
              title="Révoquer l'accès"
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: `1px solid ${BAI.border}`,
                background: BAI.bgMuted,
                color: BAI.inkMid,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: BAI.fontBody,
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = BAI.bgSurface
                ;(e.currentTarget as HTMLElement).style.borderColor = BAI.borderStrong
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = BAI.bgMuted
                ;(e.currentTarget as HTMLElement).style.borderColor = BAI.border
              }}
            >
              <ShieldOff style={{ width: 13, height: 13 }} />
              Révoquer
            </button>
          </div>
        )}
      </div>

      {/* Dates */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: `1px solid ${BAI.bgMuted}`,
        fontFamily: BAI.fontBody,
        fontSize: '11px',
        color: BAI.inkFaint,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock style={{ width: 11, height: 11 }} />
          Partagé le {new Date(share.createdAt).toLocaleDateString('fr-FR')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Eye style={{ width: 11, height: 11 }} />
          Expire le {new Date(share.expiresAt).toLocaleDateString('fr-FR')}
        </span>
      </div>
    </motion.div>
  )
}

// ── Section heading ─────────────────────────────────────────────────────────────

function SectionHeading({ children, count, dot }: {
  children: React.ReactNode
  count?: number
  dot?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      <span style={{
        fontFamily: BAI.fontBody,
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: BAI.inkFaint,
      }}>
        {children}
      </span>
      {count !== undefined && count > 0 && (
        <span style={{
          padding: '1px 8px',
          borderRadius: '999px',
          background: BAI.tenantLight,
          color: BAI.tenant,
          fontFamily: BAI.fontBody,
          fontSize: '11px',
          fontWeight: 600,
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DossierShareManager() {
  const [shares, setShares] = useState<DossierShare[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [reportTarget, setReportTarget] = useState<DossierShare | null>(null)

  const load = async () => {
    try {
      const data = await shareApi.listShares()
      setShares(data)
    } catch {
      toast.error('Impossible de charger les partages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRevoke = async (ownerId: string) => {
    setRevoking(ownerId)
    try {
      await shareApi.revokeShare(ownerId)
      toast.success('Accès révoqué')
      setShares((prev) =>
        prev.map((s) => s.ownerId === ownerId ? { ...s, revokedAt: new Date().toISOString() } : s)
      )
    } catch {
      toast.error('Erreur lors de la révocation')
    } finally {
      setRevoking(null)
    }
  }

  const activeShares = shares.filter((s) => shareStatus(s) === 'active')
  const pastShares   = shares.filter((s) => shareStatus(s) !== 'active')

  return (
    <Layout>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: BAI.fontBody,
      }}>

        {/* Page header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Shield style={{ width: 20, height: 20, color: BAI.tenant }} />
            <span style={{
              fontFamily: BAI.fontBody,
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              color: BAI.caramel,
            }}>
              Sécurité
            </span>
          </div>
          <h1 style={{
            fontFamily: BAI.fontDisplay,
            fontSize: '40px',
            fontWeight: 600,
            fontStyle: 'italic',
            color: BAI.ink,
            margin: '0 0 8px',
            lineHeight: 1.15,
          }}>
            Contrôle d'accès
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: '15px', color: BAI.inkMid, margin: 0, maxWidth: 500 }}>
            Vous choisissez exactement qui peut consulter vos documents, pour combien de temps.
          </p>
        </div>

        {/* Security info banner */}
        <div style={{
          background: BAI.tenantLight,
          borderLeft: `3px solid ${BAI.tenant}`,
          borderRadius: '0 12px 12px 0',
          padding: '14px 16px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <ShieldCheck style={{ width: 17, height: 17, color: BAI.tenant, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: '13px', color: BAI.tenant, margin: '0 0 3px' }}>
              Vos documents sont protégés
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: '12px', color: '#2d6a4a', margin: 0, lineHeight: 1.55 }}>
              Chaque image est <strong>filigranée</strong> avec le nom et la date d'accès du propriétaire.
              Vous recevez un <strong>email d'alerte</strong> à chaque consultation.
            </p>
          </div>
        </div>

        {/* Thin rule */}
        <div style={{ height: 1, background: BAI.border, marginBottom: '28px' }} />

        {/* Grant form */}
        <div style={{ marginBottom: '36px' }}>
          <GrantShareForm onGranted={load} />
        </div>

        {/* Thin rule */}
        <div style={{ height: 1, background: BAI.border, marginBottom: '28px' }} />

        {/* Active shares */}
        <section style={{ marginBottom: '32px' }}>
          <SectionHeading dot={BAI.tenant} count={activeShares.length}>
            Accès actifs
          </SectionHeading>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: BAI.inkFaint }}>
              <Loader2 style={{ width: 24, height: 24, margin: '0 auto', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : activeShares.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center' as const,
              borderRadius: '14px',
              border: `1.5px dashed ${BAI.border}`,
            }}>
              <User style={{ width: 28, height: 28, margin: '0 auto 10px', color: BAI.inkFaint, opacity: 0.5 }} />
              <p style={{ fontFamily: BAI.fontBody, fontSize: '14px', color: BAI.inkFaint, margin: 0 }}>
                Aucun propriétaire n'a accès à votre dossier actuellement
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
              <AnimatePresence>
                {activeShares.map((share) => (
                  <ShareCard
                    key={share.id}
                    share={{ ...share, revokedAt: revoking === share.ownerId ? new Date().toISOString() : share.revokedAt }}
                    onRevoke={handleRevoke}
                    onReport={(s) => setReportTarget(s)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Past shares */}
        {pastShares.length > 0 && (
          <section>
            <SectionHeading>Historique — expirés et révoqués</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
              {pastShares.map((share) => (
                <ShareCard
                  key={share.id}
                  share={share}
                  onRevoke={handleRevoke}
                  onReport={(s) => setReportTarget(s)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Report modal */}
      {reportTarget && (
        <ReportUserModal
          targetId={reportTarget.ownerId}
          targetName={`${reportTarget.owner.firstName} ${reportTarget.owner.lastName}`}
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </Layout>
  )
}
