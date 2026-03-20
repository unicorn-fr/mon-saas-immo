/**
 * ContractActivityFeed — Journal d'activité contrat dans le panneau droit de la messagerie
 *
 * Affiche un suivi style "livreur" de toutes les étapes du contrat entre
 * l'utilisateur courant et son interlocuteur.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Send, PenTool, CheckCircle, Clock,
  XCircle, Loader2, ArrowRight,
} from 'lucide-react'
import { contractService } from '../../services/contract.service'
import { Contract } from '../../types/contract.types'
import { useAuth } from '../../hooks/useAuth'

const M = {
  ink:      '#0d0c0a',
  inkMid:   '#5a5754',
  inkFaint: '#9e9b96',
  border:   '#e4e1db',
  muted:    '#f4f2ee',
  surface:  '#ffffff',
  owner:    '#1a3270',
  ownerL:   '#eaf0fb',
  ownerB:   '#b8ccf0',
  tenant:   '#1b5e3b',
  tenantL:  '#edf7f2',
  tenantB:  '#9fd4ba',
  night:    '#1a1a2e',
  caramel:  '#c4976a',
  danger:   '#9b1c1c',
  dangerBg: '#fef2f2',
}

interface ActivityEvent {
  id: string
  label: string
  sub?: string
  date?: string
  done: boolean
  active: boolean
  danger?: boolean
  icon: typeof FileText
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function buildTimeline(contract: Contract, isOwner: boolean): ActivityEvent[] {
  const s = contract.status
  const done = (statuses: string[]) => statuses.includes(s)
  const terminal = ['TERMINATED', 'CANCELLED', 'EXPIRED'].includes(s)

  const events: ActivityEvent[] = [
    {
      id: 'created',
      label: 'Contrat créé',
      sub: contract.property?.title ?? undefined,
      date: contract.createdAt,
      done: true,
      active: s === 'DRAFT',
      icon: FileText,
    },
    {
      id: 'sent',
      label: 'Envoyé au locataire',
      sub: isOwner ? 'En attente de signature' : 'Reçu pour signature',
      date: s !== 'DRAFT' ? contract.updatedAt : undefined,
      done: done(['SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED', 'ACTIVE', 'TERMINATED', 'CANCELLED', 'EXPIRED']),
      active: s === 'SENT',
      icon: Send,
    },
    {
      id: 'signed_tenant',
      label: 'Signé par le locataire',
      date: contract.signedByTenant ?? undefined,
      done: !!contract.signedByTenant,
      active: s === 'SIGNED_TENANT',
      icon: PenTool,
    },
    {
      id: 'signed_owner',
      label: 'Signé par le propriétaire',
      date: contract.signedByOwner ?? undefined,
      done: !!contract.signedByOwner,
      active: s === 'SIGNED_OWNER',
      icon: PenTool,
    },
    {
      id: 'active',
      label: 'Contrat actif',
      sub: contract.startDate ? `Depuis le ${fmtDate(contract.startDate)}` : undefined,
      done: done(['ACTIVE']),
      active: s === 'ACTIVE',
      icon: CheckCircle,
    },
  ]

  if (terminal) {
    events.push({
      id: 'terminal',
      label: s === 'TERMINATED' ? 'Résilié' : s === 'CANCELLED' ? 'Annulé' : 'Expiré',
      date: contract.updatedAt,
      done: true,
      active: true,
      danger: true,
      icon: s === 'EXPIRED' ? Clock : XCircle,
    })
  }

  return events
}

interface Props {
  otherUserId: string
}

export function ContractActivityFeed({ otherUserId }: Props) {
  const { isOwner } = useAuth()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!otherUserId) return
    setLoading(true)
    const filters = isOwner ? { tenantId: otherUserId } : { ownerId: otherUserId }
    contractService
      .getContracts(filters, { limit: 1, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => setContract(res.contracts[0] ?? null))
      .catch(() => setContract(null))
      .finally(() => setLoading(false))
  }, [otherUserId, isOwner])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        <Loader2 style={{ width: 16, height: 16, color: M.inkFaint }} className="animate-spin" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div style={{
        padding: '14px 12px', borderRadius: 10,
        background: M.muted, border: `1px solid ${M.border}`,
        textAlign: 'center',
      }}>
        <FileText style={{ width: 18, height: 18, color: M.inkFaint, margin: '0 auto 6px' }} />
        <p style={{ fontSize: 11, color: M.inkFaint, margin: 0, lineHeight: 1.5 }}>
          Aucun contrat en cours avec cet interlocuteur
        </p>
      </div>
    )
  }

  const events = buildTimeline(contract, !!isOwner)

  return (
    <div>
      {/* Lien vers le contrat */}
      <button
        onClick={() => navigate(`/contracts/${contract.id}`)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 14,
          background: isOwner ? M.ownerL : M.tenantL,
          border: `1px solid ${isOwner ? M.ownerB : M.tenantB}`,
          cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: isOwner ? M.owner : M.tenant, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            {contract.property?.address ?? 'Contrat de location'}
          </p>
          <p style={{ fontSize: 10, color: M.inkFaint, margin: '2px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            {contract.monthlyRent} €/mois · Voir le contrat
          </p>
        </div>
        <ArrowRight style={{ width: 13, height: 13, color: isOwner ? M.owner : M.tenant, flexShrink: 0 }} />
      </button>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 22 }}>
        {/* Ligne verticale */}
        <div style={{
          position: 'absolute', left: 7, top: 6, bottom: 6,
          width: 2, background: M.border,
        }} />

        {events.map((evt, i) => {
          const Icon = evt.icon
          const color = evt.danger
            ? M.danger
            : evt.done
            ? (isOwner ? M.owner : M.tenant)
            : M.inkFaint

          return (
            <div key={evt.id} style={{ position: 'relative', marginBottom: i < events.length - 1 ? 16 : 0 }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: -22, top: 1,
                width: 14, height: 14, borderRadius: '50%',
                background: evt.done ? color : M.surface,
                border: `2px solid ${evt.done ? color : M.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1,
              }}>
                {evt.done && (
                  <Icon style={{ width: 7, height: 7, color: evt.danger ? '#ffffff' : '#ffffff' }} />
                )}
              </div>

              <div>
                <p style={{
                  fontSize: 11, fontWeight: evt.active ? 600 : 500,
                  color: evt.done ? M.ink : M.inkFaint,
                  margin: 0, fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.4,
                }}>
                  {evt.label}
                </p>
                {evt.sub && (
                  <p style={{ fontSize: 10, color: M.inkFaint, margin: '1px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
                    {evt.sub}
                  </p>
                )}
                {evt.date && (
                  <p style={{ fontSize: 10, color: color, margin: '2px 0 0', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    {fmtDate(evt.date)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
