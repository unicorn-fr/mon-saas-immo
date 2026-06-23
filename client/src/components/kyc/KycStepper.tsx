import { BAI } from '../../constants/bailio-tokens'

interface Step {
  id: number
  label: string
  description: string
}

const STEPS: Step[] = [
  { id: 1, label: 'Pièce d\'identité', description: 'Upload + analyse OCR' },
  { id: 2, label: 'Vérification biométrique', description: 'Liveness + face matching' },
  { id: 3, label: 'Signature vidéo', description: 'Signature pendant filmage' },
  { id: 4, label: 'Terminé', description: 'Identité confirmée' },
]

export function KycStepper({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 40, position: 'relative' }}>
      {/* Ligne de connexion */}
      <div style={{ position: 'absolute', top: 20, left: '12.5%', right: '12.5%', height: 2, background: BAI.border, zIndex: 0 }} />

      {STEPS.map((step) => {
        const done = current > step.id
        const active = current === step.id
        return (
          <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            {/* Cercle */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? BAI.tenant : active ? BAI.night : BAI.bgSurface,
              border: `2px solid ${done ? BAI.tenant : active ? BAI.night : BAI.border}`,
              fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700,
              color: (done || active) ? '#fff' : BAI.inkFaint,
              transition: 'all 0.3s',
              marginBottom: 10,
            }}>
              {done ? '✓' : step.id}
            </div>
            <p style={{
              fontFamily: BAI.fontBody,
              fontSize: 12,
              fontWeight: 600,
              color: active ? BAI.ink : done ? BAI.tenant : BAI.inkFaint,
              margin: 0,
              textAlign: 'center',
            }}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
