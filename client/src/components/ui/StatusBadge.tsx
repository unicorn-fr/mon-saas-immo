/**
 * StatusBadge — Maison Design System
 */

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'pending' | 'active' | 'draft' | 'signed' | 'completed'

const VARIANTS: Record<Variant, { bg: string; border: string; color: string; dot: string; label?: string }> = {
  success:   { bg: '#edf7f2', border: '#9fd4ba', color: '#1b5e3b', dot: '#1b5e3b' },
  warning:   { bg: '#fdf5ec', border: '#f3c99a', color: '#92400e', dot: '#c4976a' },
  danger:    { bg: '#fef2f2', border: '#fca5a5', color: '#9b1c1c', dot: '#9b1c1c' },
  info:      { bg: '#eaf0fb', border: '#b8ccf0', color: '#1a3270', dot: '#1a3270' },
  default:   { bg: '#f4f2ee', border: '#e4e1db', color: '#5a5754', dot: '#9e9b96' },
  pending:   { bg: '#fdf5ec', border: '#f3c99a', color: '#92400e', dot: '#c4976a', label: 'En attente' },
  active:    { bg: '#edf7f2', border: '#9fd4ba', color: '#1b5e3b', dot: '#1b5e3b', label: 'Actif' },
  draft:     { bg: '#f4f2ee', border: '#e4e1db', color: '#5a5754', dot: '#9e9b96', label: 'Brouillon' },
  signed:    { bg: '#eaf0fb', border: '#b8ccf0', color: '#1a3270', dot: '#1a3270', label: 'Signé' },
  completed: { bg: '#edf7f2', border: '#9fd4ba', color: '#1b5e3b', dot: '#1b5e3b', label: 'Complété' },
}

interface StatusBadgeProps {
  variant?: Variant
  label?: string
  dot?: boolean
  size?: 'sm' | 'md'
}

export function StatusBadge({ variant = 'default', label, dot = true, size = 'md' }: StatusBadgeProps) {
  const v = VARIANTS[variant]
  const text = label ?? v.label ?? variant

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-bold"
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        fontSize: size === 'sm' ? 10 : 11,
        padding: size === 'sm' ? '2px 7px' : '3px 9px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {dot && (
        <span className="rounded-full flex-shrink-0"
          style={{ width: size === 'sm' ? 5 : 6, height: size === 'sm' ? 5 : 6, background: v.dot }} />
      )}
      {text}
    </span>
  )
}

/** Map backend contract/application status to badge variant */
export function contractStatusBadge(status: string) {
  const map: Record<string, { variant: Variant; label: string }> = {
    DRAFT:           { variant: 'draft',     label: 'Brouillon' },
    SENT:            { variant: 'info',      label: 'Envoyé' },
    SIGNED_OWNER:    { variant: 'warning',   label: 'Signé propriétaire' },
    SIGNED_TENANT:   { variant: 'warning',   label: 'Signé locataire' },
    COMPLETED:       { variant: 'completed', label: 'Complété' },
    ACTIVE:          { variant: 'active',    label: 'Actif' },
    TERMINATED:      { variant: 'danger',    label: 'Résilié' },
    EXPIRED:         { variant: 'default',   label: 'Expiré' },
  }
  return map[status] ?? { variant: 'default' as Variant, label: status }
}

export function applicationStatusBadge(status: string) {
  const map: Record<string, { variant: Variant; label: string }> = {
    PENDING:  { variant: 'pending',  label: 'En attente' },
    APPROVED: { variant: 'success',  label: 'Acceptée' },
    REJECTED: { variant: 'danger',   label: 'Refusée' },
  }
  return map[status] ?? { variant: 'default' as Variant, label: status }
}

export function bookingStatusBadge(status: string) {
  const map: Record<string, { variant: Variant; label: string }> = {
    PENDING:   { variant: 'pending', label: 'En attente' },
    CONFIRMED: { variant: 'success', label: 'Confirmée' },
    CANCELLED: { variant: 'danger',  label: 'Annulée' },
    COMPLETED: { variant: 'default', label: 'Terminée' },
  }
  return map[status] ?? { variant: 'default' as Variant, label: status }
}
