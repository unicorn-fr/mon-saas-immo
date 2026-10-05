import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Btn, Callout } from './kit'
import { display } from './ui'

export interface WizardStep {
  key: string
  title: string
  note?: ReactNode
  content: ReactNode
  /** Message si l'étape n'est pas complète, null sinon. */
  validate?: () => string | null
  /** Étape facultative : bouton « Passer cette étape ». */
  optional?: boolean
}

/**
 * Assistant dans une page ou une fenêtre : une question par écran, une barre d'avancement, « Continuer » comme seule
 * action principale. La dernière étape lance `onFinish`.
 */
export function Wizard({ steps, onFinish, finishLabel, onCancel, busy, error }: { steps: WizardStep[]; onFinish: () => unknown; finishLabel: string; onCancel?: () => void; busy?: boolean; error?: string | null }) {
  const [index, setIndex] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const i = Math.min(index, steps.length - 1)
  const step = steps[i]
  const last = i === steps.length - 1

  // À chaque nouvelle étape, la question est annoncée et le curseur va dans le premier champ.
  useEffect(() => {
    const box = heading.current?.parentElement
    const field = box?.querySelector<HTMLElement>('input, select, textarea, button[aria-pressed]')
    if (field) field.focus()
    else heading.current?.focus()
  }, [i])

  const next = () => {
    const problem = step.validate?.() ?? null
    setMessage(problem)
    if (problem) return
    if (last) return void onFinish()
    setIndex(i + 1)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!busy) next()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 14, color: BAI.inkMid }}>
          Étape {i + 1} sur {steps.length}
        </span>
        <div style={{ height: 4, background: BAI.divider, borderRadius: 2 }} aria-hidden="true">
          <div style={{ width: `${Math.round(((i + 1) / steps.length) * 100)}%`, height: '100%', background: BAI.owner, borderRadius: 2, transition: 'width .25s' }} />
        </div>
      </div>
      <h2 ref={heading} tabIndex={-1} style={display('clamp(28px, 4vw, 36px)', { lineHeight: 1.08, outline: 'none' })}>
        {step.title}
      </h2>
      {step.note ? <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>{step.note}</p> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{step.content}</div>
      {message || error ? <Callout tone="warn">{message ?? error}</Callout> : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {i > 0 ? (
            <button type="button" onClick={() => { setMessage(null); setIndex(i - 1) }} style={{ border: 'none', background: 'transparent', color: BAI.owner, fontFamily: 'inherit', fontSize: 16, fontWeight: 600, padding: '12px 4px', cursor: 'pointer' }}>
              Retour
            </button>
          ) : onCancel ? (
            <button type="button" onClick={onCancel} style={{ border: 'none', background: 'transparent', color: BAI.owner, fontFamily: 'inherit', fontSize: 16, fontWeight: 600, padding: '12px 4px', cursor: 'pointer' }}>
              Annuler
            </button>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {step.optional && !last ? (
            <button type="button" onClick={() => { setMessage(null); setIndex(i + 1) }} style={{ border: 'none', background: 'transparent', color: BAI.owner, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, padding: '12px 4px', cursor: 'pointer' }}>
              Passer cette étape
            </button>
          ) : null}
          <Btn type="submit" loading={busy} disabled={busy}>
            {last ? finishLabel : 'Continuer'}
          </Btn>
        </div>
      </div>
    </form>
  )
}
