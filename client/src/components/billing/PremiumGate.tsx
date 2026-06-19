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
    // overflow:clip = clip visuel sans créer de scroll container → sticky fonctionne
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'clip' }}>

      {/* ── CTA sticky EN PREMIER dans le DOM ─────────────────────────────────
          Placé avant le contenu, son top naturel = haut du conteneur.
          Sticky le maintient centré dans le viewport dès que la section est visible. */}
      <div style={{
        position: 'sticky',
        top: compact ? 'calc(50vh - 120px)' : 'calc(50vh - 175px)',
        zIndex: 2,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 10 : 16,
        padding: compact ? '24px 20px' : '40px 32px',
        textAlign: 'center',
      }}>

        {/* Lock icon */}
        <div style={{
          width: compact ? 44 : 56,
          height: compact ? 44 : 56,
          borderRadius: compact ? 14 : 18,
          background: '#fdf5ec',
          border: '1px solid rgba(196,151,106,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(196,151,106,0.22), 0 1px 4px rgba(13,12,10,0.08)',
        }}>
          <Lock size={compact ? 20 : 24} style={{ color: BAI.caramel }} />
        </div>

        {/* Title + description */}
        <div style={{ maxWidth: 480 }}>
          <h3 style={{
            fontFamily: BAI.fontDisplay,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: compact ? 20 : 26,
            color: BAI.ink,
            margin: '0 0 8px',
            textShadow: '0 1px 8px rgba(250,250,248,0.9)',
          }}>
            {title ?? 'Fonctionnalité Premium'}
          </h3>
          <p style={{
            fontFamily: BAI.fontBody,
            fontSize: compact ? 12.5 : 13.5,
            color: BAI.inkMid,
            margin: 0,
            lineHeight: 1.6,
            textShadow: '0 1px 6px rgba(250,250,248,0.85)',
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
            padding: compact ? '11px 22px' : '14px 36px',
            background: BAI.night,
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 10,
            fontFamily: BAI.fontBody,
            fontSize: compact ? 13 : 14,
            fontWeight: 600,
            boxShadow: '0 4px 24px rgba(26,26,46,0.30)',
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
                  background: 'rgba(253,245,236,0.92)',
                  border: '1px solid rgba(196,151,106,0.35)',
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

      {/* ── Contenu flouté EN DESSOUS, remonté derrière le CTA ───────────────
          marginTop négatif ≈ hauteur du CTA → le contenu se glisse visuellement
          derrière le CTA pendant que sticky le maintient centré. */}
      <div style={{
        marginTop: compact ? '-200px' : '-380px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Dégradé radial pour lisibilité du CTA au-dessus */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(250,250,248,0.70) 0%, rgba(250,250,248,0.08) 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        <div style={{
          filter: 'blur(2px)',
          opacity: 0.55,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
