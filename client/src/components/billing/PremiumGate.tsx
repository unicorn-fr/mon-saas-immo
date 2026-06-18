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
    // overflow: clip clips visually like overflow:hidden
    // but does NOT create a scroll container — sticky children still work
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'clip' }}>

      {/* Blurred content — lighter so the layout is still legible (teasing) */}
      <div style={{
        filter: 'blur(1.5px)',
        opacity: 0.65,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {children}
      </div>

      {/* Gradient overlay — covers the full scrollable area */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(250,250,248,0.25) 0%, rgba(250,250,248,0.72) 35%, rgba(250,250,248,0.96) 65%)',
        pointerEvents: 'none',
      }} />

      {/* Sticky CTA — follows the viewport as the user scrolls */}
      <div style={{
        position: 'sticky',
        top: compact ? '8vh' : '18vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '20px 16px' : '32px 24px',
        gap: compact ? 8 : 14,
        zIndex: 2,
        pointerEvents: 'auto',
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
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
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
    </div>
  )
}
