import type { CSSProperties } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { GUIDES, citeParts, type GuideKey } from '../lib/sources'

const ext = { target: '_blank', rel: 'noreferrer' } as const

/** Une référence juridique, avec un lien vers chaque article sur Légifrance. */
export function Cite({ reference, style }: { reference: string; style?: CSSProperties }) {
  return (
    <span style={style}>
      {citeParts(reference).map((p, i) =>
        p.url ? (
          <a key={i} href={p.url} {...ext} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }} title="Lire le texte officiel sur Légifrance">
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  )
}

/** Lien vers la fiche pratique officielle (service-public.gouv.fr). */
export function Guide({ to, label, style }: { to: GuideKey; label?: string; style?: CSSProperties }) {
  const g = GUIDES[to]
  return (
    <a href={g.url} {...ext} style={{ fontSize: 13, fontWeight: 600, color: BAI.owner, textDecoration: 'none', ...style }}>
      {label ?? g.label} <span aria-hidden>↗</span>
    </a>
  )
}

/** Pied de section : texte de loi + fiches officielles. */
export function Sources({ reference, guides }: { reference?: string; guides?: GuideKey[] }) {
  if (!reference && !guides?.length) return null
  return (
    <div style={{ fontSize: 12, color: BAI.inkSoft, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {reference ? (
        <span>
          Source : <Cite reference={reference} />
        </span>
      ) : null}
      {guides?.length ? (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
          <span>Fiche officielle :</span>
          {guides.map((g) => (
            <Guide key={g} to={g} style={{ fontSize: 12 }} />
          ))}
        </span>
      ) : null}
    </div>
  )
}
