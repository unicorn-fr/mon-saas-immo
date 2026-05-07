import { Lock } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { usePlan } from '../../hooks/usePlan'
import { useUpgradeModal } from './UpgradeModal'

type PlanId = 'FREE' | 'SOLO' | 'PRO' | 'EXPERT'

interface PlanGateProps {
  required: PlanId           // plan minimum requis
  feature?: string           // nom de la feature (affiché dans UpgradeModal)
  children: React.ReactNode
  mode?: 'blur' | 'hide'    // blur = visible mais inaccessible, hide = masqué
}

const PLAN_LABELS: Record<PlanId, string> = {
  FREE: 'Free',
  SOLO: 'Solo',
  PRO: 'Pro',
  EXPERT: 'Expert',
}

export function PlanGate({ required, feature, children, mode = 'blur' }: PlanGateProps) {
  const { hasPlan, loading } = usePlan()
  const { showUpgrade, UpgradeModal } = useUpgradeModal()

  if (loading) return null
  if (hasPlan(required)) return <>{children}</>

  return (
    <>
      {UpgradeModal}
      <div
        style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
        onClick={() => showUpgrade({
          feature: feature ?? 'Cette fonctionnalité',
          requiredPlan: required,
        })}
      >
        {/* Contenu enfant grisé/flouté */}
        <div style={{
          filter: mode === 'blur' ? 'blur(2px) grayscale(0.5)' : undefined,
          opacity: mode === 'hide' ? 0 : 0.4,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {children}
        </div>

        {/* Overlay avec badge plan requis */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(250,250,248,0.7)',
          borderRadius: 8,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: BAI.night,
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 20,
            fontFamily: BAI.fontBody,
            fontSize: 12,
            fontWeight: 600,
          }}>
            <Lock style={{ width: 12, height: 12 }} />
            Plan {PLAN_LABELS[required]}
          </div>
        </div>
      </div>
    </>
  )
}
