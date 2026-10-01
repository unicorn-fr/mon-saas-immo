import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import type { Completion } from '../lib/contract'
import { Close } from './Icons'
import { Btn, Progress } from './kit'
import { Sources } from './Sources'
import type { GuideKey } from '../lib/sources'
import { Spinner, display } from './ui'

/** En-tête blanc des écrans plein écran (facture, parcours, fiches). */
export function FlowHeader({ left, center, right, height = 72 }: { left: ReactNode; center: ReactNode; right: ReactNode; height?: number }) {
  return (
    <header style={{ minHeight: height, boxSizing: 'border-box', padding: '10px clamp(16px, 3.5vw, 48px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center', gap: 12, background: BAI.surface, borderBottom: `1px solid ${BAI.divider}`, position: 'sticky', top: 0, zIndex: 30 }}>
      <div style={{ justifySelf: 'start', minWidth: 0 }}>{left}</div>
      <div style={{ justifySelf: 'center', textAlign: 'center', minWidth: 0 }}>{center}</div>
      <div style={{ justifySelf: 'end', minWidth: 0 }}>{right}</div>
    </header>
  )
}

export function CloseLink({ to, label = 'Fermer' }: { to: string; label?: string }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <Close size={16} />
      <span className="hide-md">{label}</span>
    </Link>
  )
}

/**
 * Parcours pas à pas (ajouter un logement, un locataire, créer un bail) : une question par écran,
 * barre de progression sous l'en-tête, « Retour » et « Continuer » en bas.
 */
export function StepFlow({
  title,
  closeTo,
  label,
  step,
  total,
  children,
  onBack,
  onNext,
  nextLabel = 'Continuer',
  nextDisabled,
  busy,
  extra,
}: {
  title: string
  closeTo: string
  label: string
  step: number
  total: number
  children: ReactNode
  onBack?: () => void
  onNext: () => unknown
  nextLabel?: string
  nextDisabled?: boolean
  busy?: boolean
  extra?: ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink, display: 'flex', flexDirection: 'column' }}>
      <FlowHeader
        left={<CloseLink to={closeTo} />}
        center={<span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>}
        right={
          <span style={{ fontSize: 14, color: BAI.inkMid, whiteSpace: 'nowrap' }}>
            <span className="hide-md">{label} · </span>
            {step} sur {total}
          </span>
        }
      />
      <div style={{ height: 4, background: BAI.divider, display: 'flex' }}>
        <div style={{ width: `${Math.round((step / total) * 100)}%`, background: BAI.owner, transition: 'width .25s' }} />
      </div>
      <main style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', padding: 'clamp(28px, 5vw, 56px) 16px 64px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!nextDisabled && !busy) onNext()
          }}
          style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 32 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>{children}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              {onBack ? (
                <button type="button" onClick={onBack} style={{ border: 'none', background: 'transparent', color: BAI.owner, fontFamily: 'inherit', fontSize: 16, fontWeight: 600, padding: '16px 4px', cursor: 'pointer' }}>
                  Retour
                </button>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {extra}
              <button type="submit" disabled={nextDisabled || busy} aria-busy={busy || undefined} style={{ border: 'none', background: BAI.owner, color: BAI.surface, fontFamily: 'inherit', height: 60, padding: '0 clamp(24px, 4vw, 40px)', borderRadius: 14, fontWeight: 600, fontSize: 17, display: 'inline-flex', alignItems: 'center', gap: 10, cursor: nextDisabled ? 'not-allowed' : 'pointer', opacity: nextDisabled ? 0.5 : 1 }}>
                {busy ? <Spinner size={18} color={BAI.surface} /> : null}
                {nextLabel}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export function StepTitle({ children }: { children: ReactNode }) {
  return <h1 style={display('clamp(38px, 5vw, 52px)', { lineHeight: 1.02 })}>{children}</h1>
}

export function StepNote({ children }: { children: ReactNode }) {
  return <p style={{ margin: 0, fontSize: 16, color: BAI.inkSoft, lineHeight: 1.5 }}>{children}</p>
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Fiche détaillée : toutes les étapes sur une page, le sommaire et l'avancement à gauche.
 * Les modifications s'enregistrent toutes seules ; « Enregistrer » force l'envoi immédiat.
 */
export function FicheLayout({
  backTo,
  backLabel = 'Retour',
  title,
  subtitle,
  completion,
  save,
  onSave,
  saveLabel = 'Enregistrer',
  extraAction,
  children,
  stepIds,
}: {
  backTo: string
  backLabel?: string
  title: string
  subtitle?: string
  completion: Completion | null
  save: SaveState
  onSave: () => unknown
  saveLabel?: string
  extraAction?: ReactNode
  children: ReactNode
  stepIds?: Record<string, string>
}) {
  const steps = completion?.steps.filter((s) => s.applicable) ?? []
  const firstTodo = steps.find((s) => !s.done)?.key
  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink, display: 'flex', flexDirection: 'column' }}>
      <FlowHeader
        height={80}
        left={
          <Link to={backTo} style={{ textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>
            {backLabel}
          </Link>
        }
        center={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{title}</span>
            {subtitle ? (
              <span className="hide-md" style={{ fontSize: 13, color: BAI.inkSoft }}>
                {subtitle}
              </span>
            ) : null}
          </div>
        }
        right={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="hide-md" aria-live="polite" style={{ fontSize: 13, fontWeight: 600, color: save === 'error' ? BAI.error : save === 'saved' ? BAI.green : BAI.inkSoft }}>
              {save === 'saving' ? 'Enregistrement…' : save === 'saved' ? 'Enregistré' : save === 'error' ? 'Non enregistré' : ''}
            </span>
            {extraAction}
            <Btn size="sm" onClick={onSave} style={{ height: 44 }}>
              {saveLabel}
            </Btn>
          </div>
        }
      />
      <div className="fiche">
        <aside>
          {completion ? (
            <div style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ fontWeight: 700 }}>Complété</span>
                <span style={{ fontWeight: 700, color: completion.percent >= 100 ? BAI.green : BAI.owner }}>{completion.percent} %</span>
              </div>
              <Progress percent={completion.percent} />
              <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.4 }}>{completion.percent >= 100 ? 'Tout est rempli. Vous pouvez encore modifier chaque information.' : 'Remplissez à votre rythme : chaque modification est enregistrée.'}</span>
            </div>
          ) : null}
          {steps.length ? (
            <nav aria-label="Étapes" className="fiche-steps" style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {steps.map((s, i) => (
                <a key={s.key} href={`#${stepIds?.[s.key] ?? s.key}`} style={{ textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'center', padding: '9px 10px', borderRadius: 8, fontSize: 14, color: s.done ? BAI.ink : BAI.inkSoft, fontWeight: s.key === firstTodo ? 600 : 500, background: s.key === firstTodo ? BAI.dividerSoft : 'transparent' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, ...(s.done ? { background: BAI.green, color: BAI.surface } : s.key === firstTodo ? { background: BAI.owner, color: BAI.surface } : { border: `1.5px solid ${BAI.dashed}`, color: BAI.inkSoft }) }}>
                    {s.done ? '✓' : i + 1}
                  </span>
                  {s.label}
                </a>
              ))}
            </nav>
          ) : null}
        </aside>
        <main>{children}</main>
      </div>
    </div>
  )
}

/** Une étape d'une fiche : « Étape N », titre, explication, champs, référence juridique. */
export function FicheSection({ id, n, title, intro, children, reference, guides, done }: { id: string; n: number; title: string; intro?: ReactNode; children: ReactNode; reference?: string; guides?: GuideKey[]; done?: boolean }) {
  return (
    <section id={id} style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 20, padding: 'clamp(18px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: 18, scrollMarginTop: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramelInk }}>Étape {n}</span>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h2>
        </div>
        {done ? <span style={{ fontSize: 12, fontWeight: 700, color: BAI.green, background: BAI.greenLight, padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Rempli</span> : null}
      </div>
      {intro ? <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{intro}</p> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
      <Sources reference={reference} guides={guides} />
    </section>
  )
}

/** Rangée de champs côte à côte (empilés sur téléphone). */
export function Fields({ children }: { children: ReactNode }) {
  return (
    <div className="col-md" style={{ display: 'flex', gap: 16 }}>
      {children}
    </div>
  )
}
