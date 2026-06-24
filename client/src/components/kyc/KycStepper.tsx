import { BAI } from '../../constants/bailio-tokens'

interface Step { id: number; label: string }

const STEPS_CONTRACT: Step[] = [
  { id: 1, label: 'Pièce d\'identité' },
  { id: 2, label: 'Vérification' },
  { id: 3, label: 'Signature vidéo' },
  { id: 4, label: 'Terminé' },
]

const STEPS_STANDALONE: Step[] = [
  { id: 1, label: 'Pièce d\'identité' },
  { id: 2, label: 'Vérification' },
  { id: 3, label: 'Confirmé' },
]

export function KycStepper({ current, totalSteps = 4 }: { current: number; totalSteps?: number }) {
  const steps = totalSteps === 3 ? STEPS_STANDALONE : STEPS_CONTRACT

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 40, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, left: '12.5%', right: '12.5%', height: 2, background: BAI.border, zIndex: 0 }} />

      {steps.map((step) => {
        const done = current > step.id
        const active = current === step.id
        return (
          <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? BAI.tenant : active ? BAI.night : BAI.bgSurface,
              border: `2px solid ${done ? BAI.tenant : active ? BAI.night : BAI.border}`,
              fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700,
              color: (done || active) ? '#fff' : BAI.inkFaint,
              transition: 'all 0.3s', marginBottom: 10,
            }}>
              {done ? '✓' : step.id}
            </div>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
              color: active ? BAI.ink : done ? BAI.tenant : BAI.inkFaint,
              margin: 0, textAlign: 'center',
            }}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
