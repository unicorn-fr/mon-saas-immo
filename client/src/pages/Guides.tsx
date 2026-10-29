import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SimplePage } from '../components/SiteChrome'
import { GUIDES, guidePath, type Guide, type GuideBlock } from '../content/guides'
import { NotFound } from './legal/Legal'

const dateLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Description de la page pour les moteurs de recherche, remise comme avant en quittant la page. */
function useDescription(text: string) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) return
    const before = meta.content
    meta.content = text
    return () => {
      meta.content = before
    }
  }, [text])
}

export function GuidesList() {
  useDescription('Guides gratuits pour les propriétaires bailleurs : dépôt de garantie, congé, bail, état des lieux, quittances. Règles vérifiées sur les sources officielles.')
  return (
    <SimplePage title="Guides du propriétaire">
      <p style={{ margin: '0 0 28px' }}>Les règles de la location expliquées simplement, vérifiées sur les sources officielles.</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {GUIDES.map((g) => (
          <li key={g.slug} style={{ background: BAI.bg, borderRadius: 24, padding: 'clamp(20px, 4vw, 28px)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>
              <Link to={guidePath(g)} style={{ color: BAI.ink }}>
                {g.title}
              </Link>
            </h2>
            <p style={{ margin: 0, fontSize: 16 }}>{g.description}</p>
          </li>
        ))}
      </ul>
    </SimplePage>
  )
}

function Block({ block }: { block: GuideBlock }) {
  if ('h' in block) return <h2 style={{ margin: '36px 0 12px', fontSize: 22, fontWeight: 700, color: BAI.ink }}>{block.h}</h2>
  if ('list' in block)
    return (
      <ul style={{ margin: '0 0 16px', paddingLeft: 22 }}>
        {block.list.map((item) => (
          <li key={item} style={{ marginBottom: 6 }}>
            {item}
          </li>
        ))}
      </ul>
    )
  if ('note' in block)
    return (
      <p style={{ margin: '28px 0', background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(18px, 3vw, 24px)' }}>
        <strong>À retenir : </strong>
        {block.note}
      </p>
    )
  return <p style={{ margin: '0 0 16px' }}>{block.p}</p>
}

function Article({ guide }: { guide: Guide }) {
  useDescription(guide.description)
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3)
  return (
    <SimplePage title={guide.title}>
      <p style={{ margin: '-16px 0 28px', fontSize: 15, color: BAI.inkSoft }}>Publié le {dateLabel(guide.date)}</p>
      <article>
        {guide.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </article>
      <h2 style={{ margin: '36px 0 12px', fontSize: 18, fontWeight: 700, color: BAI.ink }}>Sources</h2>
      <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15 }}>
        {guide.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>{' '}
            (vérifié le {s.checked})
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 20, fontSize: 15 }}>Ce guide donne les règles générales. Il ne remplace pas un conseil juridique adapté à votre situation.</p>
      <p style={{ marginTop: 28 }}>
        <Link to="/commencer">Préparer mon bail avec Bailio, gratuitement</Link>
      </p>
      {others.length ? (
        <>
          <h2 style={{ margin: '36px 0 12px', fontSize: 18, fontWeight: 700, color: BAI.ink }}>Autres guides</h2>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            {others.map((g) => (
              <li key={g.slug}>
                <Link to={guidePath(g)}>{g.title}</Link>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 16 }}>
            <Link to="/guides">Tous les guides</Link>
          </p>
        </>
      ) : null}
    </SimplePage>
  )
}

export function GuideArticle() {
  const { slug } = useParams()
  const guide = GUIDES.find((g) => g.slug === slug)
  return guide ? <Article guide={guide} /> : <NotFound />
}
