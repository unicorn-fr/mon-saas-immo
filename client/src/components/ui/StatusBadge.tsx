/**
 * StatusBadge — Light Premium
 * Variants: success · warning · danger · info · default · pending · active
 */

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'pending' | 'active' | 'draft' | 'signed' | 'completed'

const VARIANTS: Record<Variant, { bg: string; border: string; color: string; dot: string; label?: string }> = {
  success:   { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669', dot: '#10b981' },
  warning:   { bg: '#fffbeb', border: '#fde68a', color: '#d97706', dot: '#f59e0b' },
  danger:    { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', dot: '#ef4444' },
  info:      { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', dot: '#3b82f6' },
  default:   { bg: '#f5f5f7', border: '#d2d2d7', color: '#515154', dot: '#86868b' },
  pending:   { bg: '#fffbeb', border: '#fde68a', color: '#d97706', dot: '#f59e0b', label: 'En attente' },
  active:    { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669', dot: '#10b981', label: 'Actif' },
  draft:     { bg: '#f5f5f7', border: '#d2d2d7', color: '#515154', dot: '#86868b', label: 'Brouillon' },
  signed:    { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', dot: '#3b82f6', label: 'Signé' },
  completed: { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669', dot: '#10b981', label: 'Complété' },
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
