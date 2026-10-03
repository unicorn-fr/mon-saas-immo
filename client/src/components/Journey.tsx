import { useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Btn, TextLink, useToast } from './kit'
import { Check } from './Icons'
import { api } from '../lib/api'
import type { RentalStep } from '../lib/space'

const STATE_LABEL: Record<RentalStep['state'], string> = { DONE: 'Fait', TODO: 'À faire', WAITING: 'En attente', LOCKED: 'Plus tard', SKIPPED: 'Pas nécessaire' }

/**
 * Mise en location d'un logement, dans l'ordre : chaque étape dit ce qui est fait, ce qui reste
 * et ouvre la bonne page. Rien ne se coche à la main : tout est déduit de ce que vous avez déjà saisi.
 */
export function Journey({ propertyId, steps: initial }: { propertyId: string; steps: RentalStep[] }) {
  const toast = useToast()
  const [steps, setSteps] = useState(initial)
  const [showDone, setShowDone] = useState(false)
  const done = steps.filter((s) => s.state === 'DONE' || s.state === 'SKIPPED').length
  // Première étape à faire : elle porte l'action principale.
  const current = steps.find((s) => s.state === 'TODO' && !s.optional) ?? steps.find((s) => s.state === 'TODO')
  const skip = async (key: RentalStep['key'], value: boolean) => {
    try {
      const r = await api<{ journey: RentalStep[] }>(`/properties/${propertyId}/steps/${key}`, { method: 'POST', body: { skip: value } })
      setSteps(r.journey)
    } catch (e) {
      toast.error(e)
    }
  }
  const visible = showDone ? steps : steps.filter((s) => !(s.state === 'DONE' || s.state === 'SKIPPED') || s === steps[0])

  return (
    <section aria-label="Mise en location" style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 22, padding: 'clamp(18px, 3vw, 26px)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', paddingBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Mise en location, étape par étape</h2>
        <span style={{ fontSize: 14, color: BAI.inkSoft }}>
          {done} sur {steps.length} ·{' '}
          <TextLink onClick={() => setShowDone(!showDone)} style={{ fontSize: 14 }}>
            {showDone ? 'Masquer ce qui est fait' : 'Tout afficher'}
          </TextLink>
        </span>
      </div>
      {visible.map((s) => {
        const n = steps.indexOf(s) + 1
        const isDone = s.state === 'DONE' || s.state === 'SKIPPED'
        const isCurrent = s === current
        const showAction = Boolean(s.action) && (s.state === 'TODO' || s.state === 'WAITING')
        const canSkip = Boolean(s.optional) && !isDone
        return (
          <div key={s.key} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderTop: `1px solid ${BAI.dividerSoft}`, opacity: s.state === 'LOCKED' ? 0.6 : 1 }}>
            <span aria-hidden style={{ width: 30, height: 30, borderRadius: 15, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, ...(isDone ? { background: BAI.greenLight, color: BAI.green } : isCurrent ? { background: BAI.owner, color: BAI.surface } : { border: `1.5px solid ${BAI.dashed}`, color: BAI.inkSoft }) }}>
              {isDone ? <Check size={15} /> : n}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: isDone ? BAI.inkMid : BAI.ink }}>{s.title}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.state === 'TODO' ? BAI.caramelInk : s.state === 'WAITING' ? BAI.owner : BAI.inkSoft }}>
                  {STATE_LABEL[s.state]}
                  {s.optional && s.state !== 'SKIPPED' ? ', facultatif' : ''}
                </span>
              </span>
              {!isDone || isCurrent ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{s.text}</span> : null}
              {showAction || canSkip || s.state === 'SKIPPED' ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', paddingTop: 4 }}>
                  {showAction && s.action ? (
                    <Btn size="sm" variant={isCurrent ? 'primary' : 'outline'} to={s.action.to}>
                      {s.action.label}
                    </Btn>
                  ) : null}
                  {canSkip || s.state === 'SKIPPED' ? (
                    <TextLink onClick={() => void skip(s.key, s.state !== 'SKIPPED')} style={{ fontSize: 14 }}>
                      {s.state === 'SKIPPED' ? 'Finalement, je le veux' : 'Je n’en ai pas besoin'}
                    </TextLink>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </section>
  )
}
