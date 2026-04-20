/**
 * CalendarShareModal — owner partage le calendrier de visites avec un locataire
 * Design system Maison
 */
import { useEffect, useState } from 'react'
import { X, UserCheck, Trash2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingService } from '../../services/booking.service'
import type { CalendarInviteWithTenant } from '../../types/booking.types'

const M = {
  surface: '#ffffff', muted: '#f4f2ee', bg: '#fafaf8',
  ink: '#0d0c0a', inkMid: '#5a5754', inkFaint: '#9e9b96',
  night: '#1a1a2e', border: '#e4e1db',
  owner: '#1a3270', ownerLight: '#eaf0fb', ownerBorder: '#b8ccf0',
  caramel: '#c4976a', caramelLight: '#fdf5ec', caramelBorder: '#f3c99a',
  danger: '#9b1c1c', dangerBg: '#fef2f2',
  body: "'DM Sans', system-ui, sans-serif",
}

interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  propertyTitle: string
  suggestedTenants?: Tenant[]
}

export function CalendarShareModal({ isOpen, onClose, propertyId, propertyTitle, suggestedTenants = [] }: Props) {
  const [invites, setInvites] = useState<CalendarInviteWithTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    bookingService.getPropertyInvites(propertyId)
      .then(setInvites)
      .catch(() => toast.error('Impossible de charger les invitations'))
      .finally(() => setLoading(false))
  }, [isOpen, propertyId])

  const invitedIds = new Set(invites.map(i => i.tenantId))
  const uninvited = suggestedTenants.filter(t => !invitedIds.has(t.id))

  async function handleInvite(tenant: Tenant) {
    setInviting(tenant.id)
    try {
      const invite = await bookingService.createInvite(propertyId, tenant.id)
      setInvites(prev => [...prev, { ...invite, tenant }])
      toast.success(`${tenant.firstName} peut maintenant réserver une visite`)
    } catch { toast.error('Erreur lors de l\'invitation') }
    finally { setInviting(null) }
  }

  async function handleRevoke(inviteId: string, tenantName: string) {
    setRevoking(inviteId)
    try {
      await bookingService.revokeInvite(inviteId)
      setInvites(prev => prev.filter(i => i.id !== inviteId))
      toast.success(`Accès révoqué pour ${tenantName}`)
    } catch { toast.error('Erreur lors de la révocation') }
    finally { setRevoking(null) }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg rounded-2xl overflow-hidden pointer-events-auto"
          style={{ background: M.surface, border: `1px solid ${M.border}`, boxShadow: '0 20px 60px rgba(13,12,10,0.16)' }}>

          {/* Header */}
          <div className="flex items-start justify-between p-5" style={{ borderBottom: `1px solid ${M.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: M.ownerLight }}>
                <Calendar className="w-4 h-4" style={{ color: M.owner }} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: M.ink, margin: 0, fontFamily: M.body }}>
                  Partager le calendrier
                </h2>
                <p style={{ fontSize: 12, color: M.inkFaint, margin: 0 }}>{propertyTitle}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: M.inkFaint, padding: 4 }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

            {/* Info */}
            <div className="flex gap-2 p-3 rounded-lg" style={{ background: M.caramelLight, border: `1px solid ${M.caramelBorder}` }}>
              <UserCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: M.caramel }} />
              <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                Seuls les locataires invités pourront voir les créneaux disponibles et réserver une visite.
              </p>
            </div>

            {/* Invitations existantes */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: M.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Invités ({invites.length})
              </p>
              {loading ? (
                <p style={{ fontSize: 13, color: M.inkFaint }}>Chargement…</p>
              ) : invites.length === 0 ? (
                <p style={{ fontSize: 13, color: M.inkFaint, padding: '10px 0' }}>Aucun locataire invité pour le moment.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {invites.map(invite => (
                    <div key={invite.id} className="flex items-center justify-between gap-3 p-3 rounded-lg"
                      style={{ background: M.ownerLight, border: `1px solid ${M.ownerBorder}` }}>
                      <div className="min-w-0">
                        <p style={{ fontSize: 13, fontWeight: 600, color: M.owner, margin: 0 }}>
                          {invite.tenant.firstName} {invite.tenant.lastName}
                        </p>
                        <p style={{ fontSize: 11, color: M.inkFaint, margin: 0 }}>{invite.tenant.email}</p>
                      </div>
                      <button
                        onClick={() => handleRevoke(invite.id, `${invite.tenant.firstName} ${invite.tenant.lastName}`)}
                        disabled={revoking === invite.id}
                        title="Révoquer l'accès"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: M.danger, padding: 6, borderRadius: 6, opacity: revoking === invite.id ? 0.5 : 1, flexShrink: 0 }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Locataires à inviter */}
            {uninvited.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: M.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Candidats à inviter
                </p>
                <div className="flex flex-col gap-2">
                  {uninvited.map(tenant => (
                    <div key={tenant.id} className="flex items-center justify-between gap-3 p-3 rounded-lg"
                      style={{ background: M.muted, border: `1px solid ${M.border}` }}>
                      <div className="min-w-0">
                        <p style={{ fontSize: 13, fontWeight: 600, color: M.ink, margin: 0 }}>
                          {tenant.firstName} {tenant.lastName}
                        </p>
                        <p style={{ fontSize: 11, color: M.inkFaint, margin: 0 }}>{tenant.email}</p>
                      </div>
                      <button
                        onClick={() => handleInvite(tenant)}
                        disabled={inviting === tenant.id}
                        style={{
                          background: M.night, color: '#fff', border: 'none', borderRadius: 8,
                          padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: inviting === tenant.id ? 'not-allowed' : 'pointer',
                          opacity: inviting === tenant.id ? 0.7 : 1, fontFamily: M.body, flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}>
                        {inviting === tenant.id ? '…' : 'Inviter'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {suggestedTenants.length === 0 && invites.length === 0 && !loading && (
              <p style={{ fontSize: 13, color: M.inkFaint }}>
                Aucun candidat disponible. Approuvez des candidatures pour pouvoir les inviter.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
