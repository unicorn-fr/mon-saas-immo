import { useEffect, useRef, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Spinner, display } from './ui'

/**
 * Une question à la fois. Un formulaire long décourage : on commence, on abandonne avant la fin. Chaque écran pose une
 * seule question, courte ; un choix fait passer tout seul à la suivante ; « Entrée » valide. La question en cours est
 * dans l'adresse (`?q=3`) : le bouton retour du navigateur revient à la précédente, rien n'est perdu.
 */
export function useQuestion(count: number) {
  const [params, setParams] = useSearchParams()
  const q = Math.min(Math.max(1, Number(params.get('q')) || 1), Math.max(1, count))
  const go = (n: number) => {
    const next = new URLSearchParams(params)
    if (n > 1) next.set('q', String(n))
    else next.delete('q')
    setParams(next)
  }
  // Nouvelle question : le curseur va sur sa réponse (le lecteur d'écran lit la question).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[data-question] input:not([type=hidden]):not(.sr-only), [data-question] textarea, [data-question] select, [data-question] button[aria-pressed]')
      if (el) el.focus()
      else document.querySelector<HTMLElement>('[data-question] h1, [data-question] h2')?.focus()
    })
    window.scrollTo(0, 0)
  }, [q])
  return { q, go, next: () => go(q + 1), prev: () => go(q - 1) }
}

/** « Question 2 sur 5 », discret, au-dessus de la question. */
export function QuestionCount({ q, count }: { q: number; count: number }) {
  return (
    <span style={{ fontSize: 14, fontWeight: 600, color: BAI.inkSoft }}>
      Question {q} sur {count}
    </span>
  )
}

/**
 * Réponses en gros boutons. Un clic choisit et passe à la question suivante (`onPick`), sans bouton « Continuer ».
 * `legend` : l'intitulé lu par les lecteurs d'écran quand la question est déjà affichée en titre.
 */
export function Choices<T extends string | number>({ legend, value, options, onPick, columns }: { legend: string; value?: T | null; options: Array<{ value: T; label: ReactNode; hint?: string }>; onPick: (v: T) => void; columns?: boolean }) {
  return (
    <div role="group" aria-label={legend} style={{ display: 'flex', flexDirection: columns ? 'column' : 'row', flexWrap: 'wrap', gap: 10 }}>
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(o.value)}
            style={{
              minHeight: 56,
              padding: o.hint ? '12px 20px' : '0 22px',
              border: selected ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`,
              background: selected ? BAI.ownerLight : BAI.surface,
              color: selected ? BAI.owner : BAI.ink,
              fontSize: 16,
              fontWeight: selected ? 700 : 600,
              borderRadius: 14,
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2,
              cursor: 'pointer',
            }}
          >
            {o.label}
            {o.hint ? <span style={{ fontSize: 14, fontWeight: 400, color: BAI.inkSoft }}>{o.hint}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Une question d'un formulaire public : titre, réponse, puis « Retour » et le bouton principal. Le formulaire entier
 * se valide avec Entrée. `skip` : la question est facultative, « Passer » mène à la suivante sans réponse.
 */
export function QuestionScreen({
  q,
  count,
  title,
  hint,
  children,
  onNext,
  onBack,
  nextLabel = 'Continuer',
  skip,
  busy,
  hideNext,
  footer,
  page,
}: {
  q: number
  count: number
  title: ReactNode
  hint?: ReactNode
  children?: ReactNode
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  skip?: () => void
  busy?: boolean
  hideNext?: boolean
  footer?: ReactNode
  /** La question est le titre de la page (h1, repris dans l'onglet) ; sinon un h2 sous le titre de la page. */
  page?: boolean
}) {
  const Heading = page ? 'h1' : 'h2'
  return (
    <form
      data-question
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!busy) onNext?.()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <QuestionCount q={q} count={count} />
      <div role="progressbar" aria-label="Progression" aria-valuemin={0} aria-valuemax={count} aria-valuenow={q} style={{ height: 4, background: BAI.divider, borderRadius: 2, marginTop: -12 }}>
        <div style={{ width: `${(q / count) * 100}%`, height: '100%', background: BAI.owner, borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>
      <Heading tabIndex={-1} style={display('clamp(28px, 4.4vw, 38px)', { lineHeight: 1.15, outline: 'none' })}>
        {title}
      </Heading>
      {hint ? <div style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55, marginTop: -8 }}>{hint}</div> : null}
      {children}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 4 }}>
        {onBack ? (
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', padding: '14px 4px', fontWeight: 600, fontSize: 16, color: BAI.owner, cursor: 'pointer', fontFamily: 'inherit' }}>
            Retour
          </button>
        ) : (
          <span />
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {skip ? (
            <button type="button" onClick={skip} style={{ background: 'none', border: 'none', padding: '14px 4px', fontWeight: 600, fontSize: 16, color: BAI.owner, cursor: 'pointer', fontFamily: 'inherit' }}>
              Passer
            </button>
          ) : null}
          {hideNext ? null : (
            <button type="submit" disabled={busy} style={{ background: BAI.cta, color: BAI.ctaInk, minHeight: 56, padding: '0 34px', borderRadius: 999, fontWeight: 600, fontSize: 17, border: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
              {busy ? <Spinner size={16} color={BAI.ctaInk} /> : null}
              {nextLabel}
            </button>
          )}
        </span>
      </div>
      {footer}
    </form>
  )
}
