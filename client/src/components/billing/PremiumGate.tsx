import { Lock, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { usePlan } from '../../hooks/usePlan'

type PlanId = 'SOLO' | 'PRO' | 'EXPERT'

interface PremiumGateProps {
  requiredPlan?: PlanId
  title?: string
  description?: string
  children: React.ReactNode
  compact?: boolean
}

const PLAN_ORDER: Record<PlanId, number> = { SOLO: 1, PRO: 2, EXPERT: 3 }

export function PremiumGate({
  requiredPlan,
  title,
  description,
  children,
  compact = false,
}: PremiumGateProps) {
  const { loading, hasPlan } = usePlan()

  if (loading) {
    return <div style={{ minHeight: compact ? 100 : 200 }} />
  }

  if (hasPlan(requiredPlan ?? 'SOLO')) {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── CTA card — toujours visible en haut ── */}
      <div style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: compact ? 12 : 16,
        padding: compact ? '20px 20px' : '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 10 : 16,
        textAlign: 'center',
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        marginBottom: 2,
      }}>

        {/* Lock icon */}
        <div style={{
          width: compact ? 40 : 52,
          height: compact ? 40 : 52,
          borderRadius: compact ? 12 : 16,
          background: '#fdf5ec',
          border: '1px solid rgba(196,151,106,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(196,151,106,0.18)',
        }}>
          <Lock size={compact ? 18 : 22} style={{ color: BAI.caramel }} />
        </div>

        {/* Title + description */}
        <div style={{ maxWidth: 460 }}>
          <h3 style={{
            fontFamily: BAI.fontDisplay,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: compact ? 18 : 24,
            color: BAI.ink,
            margin: '0 0 6px',
          }}>
            {title ?? 'Fonctionnalité Premium'}
          </h3>
          <p style={{
            fontFamily: BAI.fontBody,
            fontSize: compact ? 12 : 13,
            color: BAI.inkMid,
            margin: 0,
            lineHeight: 1.6,
          }}>
            {description ?? `Disponible à partir du plan ${requiredPlan ?? 'SOLO'}. Upgradez pour débloquer cette fonctionnalité.`}
          </p>
        </div>

        {/* CTA button */}
        <Link
          to="/owner/abonnement"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: compact ? '10px 20px' : '13px 32px',
            background: BAI.night,
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 10,
            fontFamily: BAI.fontBody,
            fontSize: compact ? 13 : 14,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(26,26,46,0.25)',
          }}
        >
          <Zap size={compact ? 13 : 15} />
          Passer au plan {requiredPlan ?? 'SOLO'}
        </Link>

        {/* Plan badges */}
        {!compact && (
          <div style={{ display: 'flex', gap: 6 }}>
            {(['SOLO', 'PRO', 'EXPERT'] as const)
              .filter(p => PLAN_ORDER[p] >= PLAN_ORDER[requiredPlan ?? 'SOLO'])
              .map(p => (
                <span key={p} style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: BAI.caramelLight,
                  border: '1px solid rgba(196,151,106,0.3)',
                  fontFamily: BAI.fontBody,
                  fontSize: 11,
                  fontWeight: 700,
                  color: BAI.caramel,
                  letterSpacing: '0.05em',
                }}>
                  {p}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* ── Aperçu flouté en dessous ── */}
      <div style={{
        position: 'relative',
        borderRadius: compact ? 12 : 16,
        overflow: 'hidden',
        maxHeight: compact ? 200 : 340,
      }}>
        <div style={{
          filter: 'blur(2px)',
          opacity: 0.55,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {children}
        </div>
        {/* Fade out at bottom so cut-off looks intentional */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: compact ? 60 : 100,
          background: 'linear-gradient(0deg, rgba(250,250,248,1) 0%, rgba(250,250,248,0) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
