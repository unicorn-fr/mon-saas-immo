import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { useDraft } from '../lib/draft'
import { Check } from './Icons'
import { Logo } from './Logo'
import { Spinner } from './ui'
import { SaveLater } from './SaveLater'

export const TUNNEL_STEPS = ['type', 'logement', 'personnes', 'loyer', 'relecture'] as const
export type TunnelStep = (typeof TUNNEL_STEPS)[number]
export const stepPath = (s: string) => (s === 'type' ? '/commencer' : `/commencer/${s}`)

function SaveIndicator() {
  const { status } = useDraft()
  if (status === 'idle') return <span aria-hidden style={{ width: 90 }} />
  const saving = status === 'saving'
  const error = status === 'error'
  return (
    <span role="status" aria-live="polite" style={{ fontSize: 14, color: error ? BAI.error : BAI.green, display: 'flex', gap: 6, alignItems: 'center', minWidth: 90, justifyContent: 'flex-end' }}>
      {saving ? <Spinner size={14} color={BAI.green} /> : error ? null : <Check />}
      {saving ? 'Enregistrement' : error ? 'Non enregistré' : 'Enregistré'}
    </span>
  )
}

export function TunnelLayout({ step, children, width = 640 }: { step: TunnelStep; children: ReactNode; width?: number }) {
  const index = TUNNEL_STEPS.indexOf(step) + 1
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.bg }}>
      <header style={{ height: 'clamp(60px, 8vw, 72px)', padding: '0 clamp(20px, 3.3vw, 48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BAI.surface, gap: 12 }}>
        <Logo size={28} />
        <span style={{ fontSize: 14, fontWeight: 600, color: BAI.inkMid }}>
          <span className="hide-md">Étape </span>
          {index} sur 5
        </span>
        <SaveIndicator />
      </header>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={index} aria-label="Progression" style={{ height: 4, background: BAI.divider }}>
        <div style={{ width: `${index * 20}%`, height: '100%', background: BAI.owner, transition: 'width 0.3s ease' }} />
      </div>
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: 'clamp(40px, 6vw, 88px) 20px 64px' }}>
        <div className="stack" style={{ width: '100%', maxWidth: width, gap: 32 }}>
          {children}
          {step !== 'type' ? <SaveLater /> : null}
        </div>
      </main>
    </div>
  )
}

/** Retour / Continuer, en bas de chaque étape. */
export function StepNav({ back, next, nextLabel = 'Continuer', loading, disabled }: { back?: string; next: () => void; nextLabel?: string; loading?: boolean; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, gap: 16 }}>
      {back ? (
        <Link to={back} style={{ textDecoration: 'none', fontWeight: 600, fontSize: 16, padding: '16px 4px' }}>
          Retour
        </Link>
      ) : (
        <span />
      )}
      <button
        type="submit"
        onClick={(e) => {
          e.preventDefault()
          next()
        }}
        disabled={loading || disabled}
        style={{ background: BAI.owner, color: BAI.surface, height: 60, padding: '0 40px', borderRadius: 14, fontWeight: 600, fontSize: 17, border: 'none', display: 'flex', alignItems: 'center', gap: 10, opacity: disabled ? 0.5 : 1 }}
      >
        {loading ? <Spinner color={BAI.surface} /> : null}
        {nextLabel}
      </button>
    </div>
  )
}
